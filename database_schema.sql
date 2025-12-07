-- Cruze RideShare Database Schema
-- Run this in your Supabase SQL Editor

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
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
CREATE TABLE IF NOT EXISTS ride_requests (
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view trips" ON trips;
DROP POLICY IF EXISTS "Authenticated users can create trips" ON trips;
DROP POLICY IF EXISTS "Public can view ride requests" ON ride_requests;
DROP POLICY IF EXISTS "Authenticated users can create ride requests" ON ride_requests;

-- Allow public read access to trips
CREATE POLICY "Public can view trips" ON trips
  FOR SELECT USING (true);

-- Allow anyone (authenticated or anon) to create trips
CREATE POLICY "Authenticated users can create trips" ON trips
  FOR INSERT WITH CHECK (true);

-- Allow public read access to ride requests
CREATE POLICY "Public can view ride requests" ON ride_requests
  FOR SELECT USING (true);

-- Allow anyone (authenticated or anon) to create ride requests
CREATE POLICY "Authenticated users can create ride requests" ON ride_requests
  FOR INSERT WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(date);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at);
CREATE INDEX IF NOT EXISTS idx_ride_requests_trip_id ON ride_requests(trip_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status);
