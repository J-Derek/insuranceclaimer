-- KlaimSwift Members Table
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  id_number TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  email TEXT,
  policy_number TEXT NOT NULL UNIQUE,
  insurance_company TEXT DEFAULT 'KlaimSwift Insurance',
  whatsapp_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (required by Supabase)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for demo (in production, lock this down)
CREATE POLICY "Allow public read" ON members FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON members FOR UPDATE USING (true);

-- Create index for fast policy number lookups
CREATE INDEX idx_members_policy ON members (policy_number);
CREATE INDEX idx_members_name ON members USING gin (to_tsvector('english', full_name));
