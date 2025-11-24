-- Migration to add dashboard1_shortid column for correlation testing
-- This column stores the shortID generated in Step 1 for validation in Step 2

-- Add dashboard1_shortid column
ALTER TABLE users ADD COLUMN dashboard1_shortid TEXT;

-- Add timestamp for when the shortID was generated (for expiry checking if needed)
ALTER TABLE users ADD COLUMN dashboard1_shortid_timestamp TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_dashboard1_shortid ON users(dashboard1_shortid);
