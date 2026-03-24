-- Migration: Nasty Flow sessions table
-- Tracks per-session state for the cascading silent failure checkout demo

CREATE TABLE IF NOT EXISTS nasty_flow_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  nasty_session_id TEXT NOT NULL UNIQUE,
  -- T1: Home
  visitor_id TEXT,
  journey_id TEXT,
  -- T2: Login page
  csrf_token TEXT,
  auth_flow_id TEXT,
  page_instance_id TEXT,
  csrf_token_created_at TEXT,
  -- T3: Login submit
  auth_level TEXT DEFAULT 'none',
  customer_context_id TEXT,
  access_token TEXT,
  -- T4: Aura fragments (assembled by client for T8)
  aura_fwuid TEXT,
  aura_mode TEXT,
  aura_app TEXT,
  -- T5: Product
  product_view_token TEXT,
  viewstate_signature TEXT,
  -- T6: Basket
  basket_id TEXT,
  basket_version INTEGER DEFAULT 0,
  basket_ownership TEXT DEFAULT 'none',
  -- T8: Checkout
  checkout_flow_id TEXT,
  flow_recovered INTEGER DEFAULT 0,
  request_verification_token TEXT,
  -- T9: Delivery
  delivery_quote_token TEXT,
  -- T10: Payment
  payment_nonce TEXT,
  pricing_signature TEXT,
  -- Sequencing (Siebel SWEC-style)
  swec_counter INTEGER DEFAULT 0,
  -- Metadata
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_nasty_session_id ON nasty_flow_sessions(nasty_session_id);
CREATE INDEX IF NOT EXISTS idx_nasty_user_id ON nasty_flow_sessions(user_id);
