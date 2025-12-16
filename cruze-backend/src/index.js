import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import fetch from 'node-fetch'
import getRawBody from 'raw-body'

const app = express()
const PORT = process.env.PORT || 5050

app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',') || '*',
  credentials: true
}))

app.use((req, res, next) => {
  if (req.path === '/webhooks/stripe') return next()
  express.json()(req, res, next)
})

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
})

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authentication token provided' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) req.user = user;
    } catch (err) {
    }
  }
  next();
};

app.get('/', (_, res) => res.send('Cruze backend is running. Try /health or /api/trips'))

app.get('/health', (_, res) => res.json({ ok: true }))

app.get('/api/trips', async (_, res) => {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.get('/api/trips/my', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
  
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.get('/api/requests/my', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('ride_requests')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
  
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

app.post('/api/trips', requireAuth, async (req, res) => {
  const { origin, destination, date, time, seats, price } = req.body
  
  const { data, error } = await supabase
    .from('trips')
    .insert([{ 
      origin, 
      destination, 
      date, 
      time, 
      seats, 
      price,
      user_id: req.user.id
    }])
    .select()
    .single()
  
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
})

app.post('/api/requests', requireAuth, async (req, res) => {
  const { origin, destination, date, timeWindow, seatsNeeded, trip_id } = req.body
  
  const { data, error } = await supabase
    .from('ride_requests')
    .insert([{ 
      origin, 
      destination, 
      date, 
      time_window: timeWindow, 
      seats_needed: seatsNeeded,
      trip_id,
      status: 'pending',
      user_id: req.user.id
    }])
    .select()
    .single()
  
  if (error) return res.status(400).json({ error: error.message })
  res.status(201).json(data)
})

app.get('/api/match/:tripId', async (req, res) => {
  const { data: candidates, error } = await supabase
    .from('ride_requests')
    .select('*')
    .eq('trip_id', req.params.tripId)
  
  if (error) return res.status(500).json({ error: error.message })
  
  try {
    const resp = await fetch(`${process.env.MATCHING_URL}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-token': process.env.INTERNAL_TOKEN || '' },
      body: JSON.stringify({ tripId: req.params.tripId, candidates })
    })
    const data = await resp.json()
    return res.json(data)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'matching service error' })
  }
})

app.post('/api/checkout', async (req, res) => {
  if (!stripe) return res.json({ url: 'https://example.com/checkout-demo' })
  const { trip_id } = req.body
  
  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', trip_id)
    .single()
  
  if (error || !trip) return res.status(404).json({ error: 'trip not found' })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: Math.max(1, Math.round((trip.price || 5) * 100)),
        product_data: { name: `Ride: ${trip.origin} → ${trip.destination}` }
      },
      quantity: 1
    }],
    success_url: process.env.FRONTEND_URL + '/?success=true',
    cancel_url: process.env.FRONTEND_URL + '/?canceled=true'
  })
  res.json({ url: session.url })
})

app.post('/webhooks/stripe', async (req, res) => {
  if (!stripe) return res.json({ received: true, note: 'no stripe key set' })
  const sig = req.headers['stripe-signature']
  let buf
  try {
    buf = await getRawBody(req)
  } catch (e) {
    return res.status(400).send(`Webhook Error: ${e.message}`)
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed.', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    console.log('Payment succeeded:', event.data.object.id)
  }
  res.json({ received: true })
})

app.get('/api/maps/distance', async (req, res) => {
  const { origins, destinations } = req.query
  if (!process.env.GOOGLE_MAPS_API_KEY) return res.status(400).json({ error: 'no maps key' })
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  const r = await fetch(url)
  const j = await r.json()
  res.json(j)
})

app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`))
