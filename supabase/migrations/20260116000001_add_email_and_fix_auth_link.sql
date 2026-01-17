-- Add email column and fix auth.users relationship
-- This migration enables dual authentication (email + phone)

-- Add email column
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Make email unique (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx 
  ON users (email) 
  WHERE email IS NOT NULL;

-- Add constraint: at least one auth method must exist
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS has_auth_method;

ALTER TABLE users 
  ADD CONSTRAINT has_auth_method 
  CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- Drop the default on id (it should come from auth.users, not be auto-generated)
-- Note: We don't add a foreign key constraint because seed data users don't have auth.users records
-- New users created via Supabase Auth will have matching auth.users records
ALTER TABLE users 
  ALTER COLUMN id DROP DEFAULT;

-- Add updated_at column if it doesn't exist
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
