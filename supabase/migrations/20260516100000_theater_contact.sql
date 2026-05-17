-- Add contact person fields to theaters table
ALTER TABLE theaters
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;
