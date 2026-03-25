-- Migration: Multi-threading correlation trap columns for nasty flow
-- Adds support for sticky sessions, dynamic field names, idempotency keys,
-- conditional response tokens, and per-session routing

ALTER TABLE nasty_flow_sessions ADD COLUMN route_id TEXT;
ALTER TABLE nasty_flow_sessions ADD COLUMN field_name_suffix TEXT;
ALTER TABLE nasty_flow_sessions ADD COLUMN idempotency_key TEXT;
ALTER TABLE nasty_flow_sessions ADD COLUMN idempotency_response TEXT;
ALTER TABLE nasty_flow_sessions ADD COLUMN reward_token TEXT;
ALTER TABLE nasty_flow_sessions ADD COLUMN premium_quote_token TEXT;

CREATE INDEX IF NOT EXISTS idx_nasty_idempotency ON nasty_flow_sessions(idempotency_key);
