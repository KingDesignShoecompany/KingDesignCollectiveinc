-- 001_anti_cheat_schema.sql
-- Anti-cheat and audit schema for Aura Champions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Nonces (single-use, short-lived)
CREATE TABLE IF NOT EXISTS nonces (
  nonce TEXT PRIMARY KEY,
  battle_id UUID,
  issued_to UUID,
  used BOOLEAN DEFAULT FALSE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_nonces_used ON nonces(used);
CREATE INDEX IF NOT EXISTS idx_nonces_expires ON nonces(expires_at);

-- Audit log (append-only, tamper-evident via sequence)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  event_type TEXT NOT NULL,
  user_id UUID,
  card_uid TEXT,
  battle_id UUID,
  payload JSONB,
  payload_hash TEXT NOT NULL,
  server_decision TEXT,
  previous_hash TEXT
);

-- Chain hash index for tamper evidence
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Judge verification proofs
CREATE TABLE IF NOT EXISTS judge_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_uid TEXT NOT NULL,
  judge_id TEXT,
  verified_by UUID,
  status TEXT NOT NULL,
  registry_snapshot JSONB NOT NULL,
  signed_proof TEXT NOT NULL,
  proof_payload JSONB NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Session keys for HMAC rotation
CREATE TABLE IF NOT EXISTS session_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  key_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);
