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

const todayStart = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

const parseDateOnly = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

const parseDateTime = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const METERS_PER_MILE = 1609.344
const MAX_DESTINATIONS_PER_REQUEST = 25

const chunkArray = (items, size) => {
  const chunks = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

const scoreCandidate = (candidate) => {
  let score = 0.5
  const reasons = []

  if (candidate.status && candidate.status.toLowerCase() !== 'pending') {
    score -= 0.4
    reasons.push(`status ${candidate.status}`)
  }

  const seats = Number.isFinite(candidate.seats_needed) ? candidate.seats_needed : 1
  if (seats === 1) {
    score += 0.1
    reasons.push('solo rider')
  } else if (seats === 2) {
    score += 0.08
    reasons.push('small party')
  } else if (seats === 3) {
    score += 0.05
    reasons.push('moderate party')
  } else if (seats === 4) {
    score += 0.02
    reasons.push('medium party')
  } else {
    score -= 0.12
    reasons.push(`large party (${seats})`)
  }

  if (!candidate.origin || !candidate.destination) {
    score -= 0.25
    reasons.push('missing origin/destination')
  }

  if (candidate.time_window) {
    score += 0.08
    reasons.push('has time window')
  } else {
    score -= 0.04
    reasons.push('no time window')
  }

  const today = todayStart()
  if (candidate.date) {
    const reqDate = parseDateOnly(candidate.date)
    if (reqDate) {
      if (reqDate >= today) {
        score += 0.07
        reasons.push('date ok')
      } else {
        score -= 0.2
        reasons.push('date in past')
      }
    } else {
      score -= 0.05
      reasons.push('invalid date')
    }
  }

  if (candidate.created_at) {
    const created = parseDateTime(candidate.created_at)
    if (created) {
      const createdDay = new Date(created.getFullYear(), created.getMonth(), created.getDate())
      const ageDays = Math.floor((today - createdDay) / (1000 * 60 * 60 * 24))
      if (ageDays <= 1) {
        score += 0.05
        reasons.push('fresh request')
      } else if (ageDays <= 7) {
        score += 0.02
        reasons.push('recent request')
      } else if (ageDays > 30) {
        score -= 0.05
        reasons.push('stale request')
      }
    }
  }

  const finalScore = Math.min(1, Math.max(0, score))
  return {
    score: finalScore,
    reason: reasons.length ? reasons.join(', ') : 'default weighting'
  }
}

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

app.get('/api/trips/search', async (req, res) => {
  const destination = typeof req.query.destination === 'string' ? req.query.destination.trim() : ''
  const radiusMiles = Number.isFinite(Number(req.query.radiusMiles))
    ? Number(req.query.radiusMiles)
    : 10

  if (!destination) return res.status(400).json({ error: 'destination is required' })
  if (!process.env.GOOGLE_MAPS_API_KEY) return res.status(400).json({ error: 'no maps key' })

  const { data: trips, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  const candidates = (trips || []).filter((trip) => trip.destination)
  if (!candidates.length) return res.json({ trips: [], count: 0, radiusMiles })

  const radiusMeters = Math.max(0, radiusMiles) * METERS_PER_MILE
  const batches = chunkArray(candidates, MAX_DESTINATIONS_PER_REQUEST)
  const matches = []

  for (const batch of batches) {
    const destinations = batch.map((trip) => trip.destination)
    const encodedDestinations = destinations.map((item) => encodeURIComponent(item)).join('|')
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(destination)}&destinations=${encodedDestinations}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    const response = await fetch(url)
    const payload = await response.json()

    if (payload.status !== 'OK' || !Array.isArray(payload.rows)) {
      return res.status(502).json({ error: 'distance lookup failed', detail: payload.status })
    }

    const elements = payload.rows[0]?.elements || []
    elements.forEach((element, index) => {
      if (element?.status !== 'OK') return
      const meters = element.distance?.value
      if (!Number.isFinite(meters)) return
      if (meters <= radiusMeters) {
        matches.push({
          ...batch[index],
          distance_miles: Number((meters / METERS_PER_MILE).toFixed(2))
        })
      }
    })
  }

  matches.sort((a, b) => (a.distance_miles ?? 0) - (b.distance_miles ?? 0))
  res.json({ trips: matches, count: matches.length, radiusMiles })
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

  const scored = candidates
    .map((candidate) => {
      const { score, reason } = scoreCandidate(candidate)
      return {
        id: candidate.id,
        score: Number(score.toFixed(3)),
        reason,
        candidate
      }
    })
    .sort((a, b) => b.score - a.score)

  return res.json({
    tripId: req.params.tripId,
    count: scored.length,
    matches: scored
  })
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
