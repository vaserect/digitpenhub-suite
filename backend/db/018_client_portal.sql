-- Milestone 18: Client Portal

ALTER TABLE invoice_clients
ADD COLUMN IF NOT EXISTS portal_token UUID UNIQUE DEFAULT NULL;

CREATE INDEX invoice_clients_portal_token_idx
  ON invoice_clients (portal_token)
  WHERE portal_token IS NOT NULL;
