-- =============================================
-- Jai Gems — Database Setup for Module 2: Clients
-- Run this SQL in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- =============================================

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  gst_number TEXT,
  address TEXT,
  state TEXT,
  city TEXT,
  pincode TEXT,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Note: Our backend uses the Service Role key, which automatically bypasses RLS policies.
-- These policies are just a good practice for defense-in-depth in case of future direct client-side DB access.
CREATE POLICY "Admin read/write clients" ON public.clients FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Everyone can read clients" ON public.clients FOR SELECT
  USING (true);
