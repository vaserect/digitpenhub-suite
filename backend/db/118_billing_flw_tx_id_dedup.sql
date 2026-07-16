-- Prevent double-activation from the same Flutterwave transaction.
-- A single payment can arrive via both the front-end verify flow AND the
-- server-side webhook. If both succeed before either checks, the org gets
-- credited twice. A partial unique index on (flw_tx_id WHERE NOT NULL)
-- ensures any second attempt to activate the same tx_id hits a constraint
-- error and rolls back harmlessly.

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_flw_tx_id_unique
  ON payments (flw_tx_id)
  WHERE flw_tx_id IS NOT NULL;
