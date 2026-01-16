-- Make phone nullable to support email-based signups
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;
ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE NULLS NOT DISTINCT (phone);
