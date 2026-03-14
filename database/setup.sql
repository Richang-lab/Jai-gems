-- =============================================
-- Jai Gems — Database Setup
-- Run this SQL in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- =============================================

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'wax_employee', 'jhalai_employee', 'wax_tree_employee')),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (backend uses service role key)
CREATE POLICY "Service role full access" ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create a trigger to automatically set email from auth.users
CREATE OR REPLACE FUNCTION public.handle_user_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email = (SELECT email FROM auth.users WHERE id = NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_user_email
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email();

-- =============================================
-- IMPORTANT: After running the above SQL,
-- you need to insert your admin user profile.
-- 
-- 1. Go to Authentication → Users in Supabase
-- 2. Copy your admin user's UUID
-- 3. Run this query (replace YOUR_ADMIN_UUID):
--
-- INSERT INTO public.users (id, full_name, role)
-- VALUES ('YOUR_ADMIN_UUID', 'Admin Name', 'admin');
-- =============================================
