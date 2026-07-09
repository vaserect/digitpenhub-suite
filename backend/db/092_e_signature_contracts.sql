CREATE TABLE IF NOT EXISTS contracts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  content       TEXT,                          -- the contract body (HTML or markdown)
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','sent','signed','expired','cancelled')),
  parties       JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{name, email, role}]
  sent_at       TIMESTAMPTZ,
  signed_at     TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contracts_org ON contracts(org_id, status);

CREATE TABLE IF NOT EXISTS contract_signatures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  party_email   TEXT NOT NULL,
  party_name    TEXT NOT NULL,
  sign_token    TEXT NOT NULL UNIQUE,          -- unique URL token for signing
  signature_data TEXT,                         -- base64 of drawn or typed signature
  ip_address    TEXT,
  signed_at     TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contract_sig_token ON contract_signatures(sign_token);
CREATE INDEX IF NOT EXISTS idx_contract_sig_contract ON contract_signatures(contract_id);
