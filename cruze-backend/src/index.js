import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import fetch from 'node-fetch'
import getRawBody from 'raw-body'

const app = express()
const PORT = process.env.PORT || 5050

// --- CORS ---
app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',') || '*',
  credentials: true
}))

// Stripe needs raw for webhook, JSON elsewhere
app.use((req, res, next) => {
  if (req.path === '/webhooks/stripe') return next()
  express.json()(req, res, next)
})

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
})

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

// In-memory demo store (replace with Supabase tables)
let trips = []
let requests = []
let idCounter = 1

// --- Routes ---
app.get('/health', (_, res) => res.json({ ok: true }))

app.get('/api/trips', (_, res) => res.json(trips))

app.post('/api/trips', async (req, res) => {
  const t = { id: idCounter++, ...req.body }
  trips.push(t)
  return res.status(201).json(t)
})

app.post('/api/requests', async (req, res) => {
  const r = { id: idCounter++, ...req.body, status: 'pending' }
  requests.push(r)
  return res.status(201).json(r)
})

app.get('/api/match/:tripId', async (req, res) => {
  // Fetch candidate riders from our "requests" demo store
  const candidates = requests.filter(r => r.trip_id == req.params.tripId)
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
  if (!stripe) return res.json({ url: 'https://example.com/checkout-demo' }) // dev fallback
  const { trip_id } = req.body
  const trip = trips.find(t => t.id === trip_id)
  if (!trip) return res.status(404).json({ error: 'trip not found' })

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

// --- Stripe webhook ---
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
    // Here you would mark booking as paid in Supabase
    console.log('Payment succeeded:', event.data.object.id)
  }
  res.json({ received: true })
})

// --- Google Maps proxy ---
app.get('/api/maps/distance', async (req, res) => {
  const { origins, destinations } = req.query
  if (!process.env.GOOGLE_MAPS_API_KEY) return res.status(400).json({ error: 'no maps key' })
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  const r = await fetch(url)
  const j = await r.json()
  res.json(j)
})

app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`))
