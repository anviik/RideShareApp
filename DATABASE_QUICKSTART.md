# Quick Start: Database Setup

## ✅ What's Already Done

Your Supabase credentials are already configured in:
- `cruze-backend/.env` ✓
- `cruze-frontend/.env` ✓

## 🎯 What You Need to Do

### Step 1: Create the Database Tables

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project (the one with ID: `jvgdfesraxdfqbqagxwb`)
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy and paste the entire contents of `database_schema.sql` (in this folder)
6. Click **RUN** or press `Ctrl+Enter`

You should see: **Success. No rows returned**

### Step 2: Verify Tables Were Created

1. In Supabase dashboard, click **Table Editor** in the left sidebar
2. You should see two new tables:
   - `trips`
   - `ride_requests`

### Step 3: Test the Application

1. **Start the backend** (if not already running):
   ```bash
   cd cruze-backend
   npm run dev
   ```

2. **Start the frontend** (if not already running):
   ```bash
   cd cruze-frontend
   npm run dev
   ```

3. **Open your browser** to `http://localhost:5173`

4. **Test creating a trip**:
   - Switch to "Driver" mode
   - Fill out the form
   - Click submit
   - Check your Supabase dashboard → Table Editor → trips table
   - Your trip should appear there!

## 🔍 What Changed

### Backend (`cruze-backend/src/index.js`)
- ✅ Replaced in-memory storage with Supabase queries
- ✅ All trips/requests now saved to database
- ✅ Matching service fetches from database

### Frontend (`cruze-frontend/src/pages/Home.jsx`)
- ✅ Fetches trips from backend API on page load
- ✅ Posts new trips/requests to backend
- ✅ Updates UI when new trips are created

## 🐛 Troubleshooting

**Tables don't appear in Supabase:**
- Make sure you ran the SQL script in Step 1
- Check for any error messages in the SQL Editor

**Frontend can't connect to backend:**
- Verify backend is running on `http://localhost:5050`
- Check `VITE_BACKEND_URL` in `cruze-frontend/.env`

**"Invalid API key" errors:**
- Your keys are already configured correctly
- If you see this, restart both servers

**CORS errors:**
- Backend `.env` now includes `http://localhost:5173` in `FRONTEND_URL`
- Restart the backend if you just updated this

## 📊 Database Schema

### `trips` table
- Stores driver trip postings
- Fields: origin, destination, date, time, seats, price

### `ride_requests` table
- Stores rider requests
- Fields: origin, destination, date, time_window, seats_needed, status
- Links to trips via `trip_id`

## 🚀 Ready to Go!

Once you've run the SQL script, your app is fully connected to Supabase and ready to use!
