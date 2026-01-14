-- Complete Supabase Schema for ShadowPay Payment Sync
-- This creates the proper source-of-truth architecture

-- 1. PAYMENT_LINKS table (main)
DROP TABLE IF EXISTS payment_links CASCADE;
CREATE TABLE payment_links (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  token TEXT DEFAULT 'SOL',
  any_amount BOOLEAN DEFAULT FALSE,
  amount_type TEXT DEFAULT 'fixed', -- 'fixed' or 'any'
  link_usage_type TEXT DEFAULT 'reusable', -- 'reusable' or 'single'
  url TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'paid', 'expired'
  paid BOOLEAN DEFAULT FALSE,
  commitment TEXT,
  tx_hash TEXT,
  payment_count INTEGER DEFAULT 0, -- Track how many times this link was paid
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_links_creator_id ON payment_links(creator_id);
CREATE INDEX idx_payment_links_paid ON payment_links(paid);
CREATE INDEX idx_payment_links_status ON payment_links(status);

-- 2. PAYMENTS table (transaction log - new!)
DROP TABLE IF EXISTS payments CASCADE;
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  link_id TEXT NOT NULL REFERENCES payment_links(id) ON DELETE CASCADE,
  payer_wallet TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_link_id ON payments(link_id);
CREATE INDEX idx_payments_payer ON payments(payer_wallet);
CREATE INDEX idx_payments_tx_hash ON payments(tx_hash);

-- 3. BALANCES table (user balance tracking - new!)
DROP TABLE IF EXISTS balances CASCADE;
CREATE TABLE balances (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  balance NUMERIC DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_balances_user_id ON balances(user_id);

-- Enable RLS
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_links
CREATE POLICY "Allow public read payment_links" ON payment_links FOR SELECT USING (true);
CREATE POLICY "Allow anyone insert payment_links" ON payment_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update payment_links" ON payment_links FOR UPDATE USING (true);

-- RLS Policies for payments
CREATE POLICY "Allow public read payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Allow insert payments" ON payments FOR INSERT WITH CHECK (true);

-- RLS Policies for balances
CREATE POLICY "Allow public read balances" ON balances FOR SELECT USING (true);
CREATE POLICY "Allow insert balances" ON balances FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update balances" ON balances FOR UPDATE USING (true);

-- =============================================================
-- 4. SQL FUNCTIONS for ATOMIC operations
-- =============================================================

-- Function to increment payment_count on link
CREATE OR REPLACE FUNCTION increment_payment_count(p_link_id TEXT)
RETURNS TABLE(new_count INTEGER) AS $$
BEGIN
  UPDATE payment_links
  SET payment_count = payment_count + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_link_id
  RETURNING payment_count INTO new_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add balance to creator
CREATE OR REPLACE FUNCTION add_balance_to_creator(p_link_id TEXT, p_amount NUMERIC)
RETURNS TABLE(new_balance NUMERIC) AS $$
DECLARE
  creator_id TEXT;
  v_new_balance NUMERIC;
BEGIN
  -- Get creator_id from link
  SELECT creator_id INTO creator_id FROM payment_links WHERE id = p_link_id;
  
  IF creator_id IS NULL THEN
    RAISE EXCEPTION 'Link not found: %', p_link_id;
  END IF;
  
  -- Upsert balance (insert if not exists, update if exists)
  INSERT INTO balances (user_id, balance, last_updated)
  VALUES (creator_id, p_amount, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = balances.balance + p_amount,
    last_updated = CURRENT_TIMESTAMP
  RETURNING balance INTO v_new_balance;
  
  new_balance := v_new_balance;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record payment atomically (do all 3 operations in one call)
CREATE OR REPLACE FUNCTION record_payment(
  p_link_id TEXT,
  p_payer_wallet TEXT,
  p_amount NUMERIC,
  p_tx_hash TEXT
)
RETURNS TABLE(
  payment_recorded BOOLEAN,
  new_payment_count INTEGER,
  new_balance NUMERIC
) AS $$
DECLARE
  v_payment_count INTEGER;
  v_balance NUMERIC;
  creator_id TEXT;
BEGIN
  -- 1. Insert payment record
  INSERT INTO payments (link_id, payer_wallet, amount, tx_hash)
  VALUES (p_link_id, p_payer_wallet, p_amount, p_tx_hash);
  
  -- 2. Increment payment_count
  UPDATE payment_links
  SET payment_count = payment_count + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_link_id
  RETURNING payment_links.payment_count INTO v_payment_count;
  
  -- 3. Update creator balance
  SELECT creator_id INTO creator_id FROM payment_links WHERE id = p_link_id;
  
  INSERT INTO balances (user_id, balance, last_updated)
  VALUES (creator_id, p_amount, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    balance = balances.balance + p_amount,
    last_updated = CURRENT_TIMESTAMP
  RETURNING balance INTO v_balance;
  
  payment_recorded := TRUE;
  new_payment_count := v_payment_count;
  new_balance := v_balance;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- Test data (optional - for testing)
-- =============================================================
-- Seed initial balance if testing
-- INSERT INTO balances (user_id, balance) VALUES ('test_user', 0);
