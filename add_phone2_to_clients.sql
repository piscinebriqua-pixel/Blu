-- Add phone2 column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone2 TEXT;
