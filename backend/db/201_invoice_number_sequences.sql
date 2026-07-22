-- Invoice number sequences table for race-free numbering
-- Each org gets a dedicated counter row, atomically incremented

CREATE TABLE IF NOT EXISTS invoice_number_sequences (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  last_number BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (org_id)
);
