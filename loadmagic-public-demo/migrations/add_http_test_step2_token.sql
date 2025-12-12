-- Migration to add http_test_step2_token column for correlation testing
-- This column stores the step2_token generated in HTTP Test Step 1 for validation in Step 2

-- Add http_test_step2_token column
ALTER TABLE users ADD COLUMN http_test_step2_token TEXT;

-- Add timestamp for when the step2_token was generated (for expiry checking if needed)
ALTER TABLE users ADD COLUMN http_test_step2_token_timestamp TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_http_test_step2_token ON users(http_test_step2_token);
