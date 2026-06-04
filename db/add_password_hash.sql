-- Run once in Supabase SQL Editor if users table has no password_hash column
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar;
