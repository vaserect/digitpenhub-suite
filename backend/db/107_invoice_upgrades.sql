-- Invoices upgrades: recurring billing, overdue automation, payment link improvements

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_frequency TEXT CHECK (recurring_frequency IN ('weekly','monthly','quarterly','yearly'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_end_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_recurred_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS invoice_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  days_after_due INT NOT NULL DEFAULT 3,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reminders_invoice ON invoice_reminders(invoice_id);

ALTER TABLE invoice_clients ADD COLUMN IF NOT EXISTS email_subject_prefix TEXT;
