# Supabase Database Setup Guide

## Step 1: Get Your Supabase Credentials

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Open your project (or create a new one)
3. Go to **Project Settings** (gear icon in sidebar) → **API**
4. Copy these values:

   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJh...`)
   - **service_role key** (starts with `eyJh...`, keep this secret!)

## Step 2: Create Environment Files

### Backend (.env)
Create `/cruze-backend/.env`:
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key-here
FRONTEND_URL=http://localhost:5173
MATCHING_URL=http://localhost:8001
INTERNAL_TOKEN=your-secret-token
PORT=5050
```

### Frontend (.env)
Create `/cruze-frontend/.env`:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
VITE_BACKEND_URL=http://localhost:5050
```

## Step 3: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Paste and run this SQL:

```sql
-- Create trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  seats INTEGER NOT NULL,
  price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ride_requests table
CREATE TABLE ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  trip_id UUID REFERENCES trips(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  date DATE NOT NULL,
  time_window TEXT,
  seats_needed INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;

-- Allow public read access to trips
CREATE POLICY "Public can view trips" ON trips
  FOR SELECT USING (true);

-- Allow authenticated users to create trips
CREATE POLICY "Authenticated users can create trips" ON trips
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Allow public read access to ride requests
CREATE POLICY "Public can view ride requests" ON ride_requests
  FOR SELECT USING (true);

-- Allow authenticated users to create ride requests
CREATE POLICY "Authenticated users can create ride requests" ON ride_requests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
```

## Step 4: Test the Connection

1. Restart your backend server:
   ```bash
   cd cruze-backend
   npm run dev
   ```

2. Restart your frontend:
   ```bash
   cd cruze-frontend
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`
4. Try creating a trip as a driver - it should now save to Supabase!

## Step 5: Verify in Supabase

1. Go to your Supabase dashboard
2. Click **Table Editor** in the sidebar
3. Select the `trips` table
4. You should see any trips you created!

## Troubleshooting

- **"Invalid API key"**: Double-check your keys in the `.env` files
- **"relation does not exist"**: Make sure you ran the SQL to create the tables
- **CORS errors**: Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- **Nothing showing up**: Check the browser console and backend logs for errors
