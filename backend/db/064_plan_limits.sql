-- Milestone 64: Real, enforceable plan limits (previously `plans.features`
-- was display-only text on the pricing/billing page, nothing was actually
-- enforced — every org had unrestricted access to all 97 modules regardless
-- of plan). NULL on a limit column means "unlimited".

ALTER TABLE plans ADD COLUMN max_contacts INTEGER;
ALTER TABLE plans ADD COLUMN max_invoices INTEGER;
ALTER TABLE plans ADD COLUMN all_modules BOOLEAN NOT NULL DEFAULT true;

UPDATE plans SET max_contacts = 50,   max_invoices = 5,    all_modules = false WHERE slug = 'free';
UPDATE plans SET max_contacts = 500,  max_invoices = NULL, all_modules = true  WHERE slug = 'starter';
UPDATE plans SET max_contacts = 5000, max_invoices = NULL, all_modules = true  WHERE slug = 'growth';
UPDATE plans SET max_contacts = NULL, max_invoices = NULL, all_modules = true  WHERE slug = 'business';
