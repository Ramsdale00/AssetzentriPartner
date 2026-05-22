-- Migration 001: Add magic_link_tokens table
-- Run this on the live assetzentri database before deploying the new backend code.
--
-- psql -h 4.224.126.92 -U <your_user> -d assetzentri -f 001_magic_link_tokens.sql

CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token ON magic_link_tokens (token);
