-- Migration to add session_id, csrf_token, and correlation_id columns to users table
-- These columns are required for advanced JMeter correlation testing

-- Add session_id column
ALTER TABLE users ADD COLUMN session_id TEXT;

-- Add csrf_token column
ALTER TABLE users ADD COLUMN csrf_token TEXT;

-- Add correlation_id column
ALTER TABLE users ADD COLUMN correlation_id TEXT;

-- Optional: Create indexes for faster lookups during validation
CREATE INDEX IF NOT EXISTS idx_users_session_id ON users(session_id);
CREATE INDEX IF NOT EXISTS idx_users_csrf_token ON users(csrf_token);
CREATE INDEX IF NOT EXISTS idx_users_correlation_id ON users(correlation_id);
