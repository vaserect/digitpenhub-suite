-- password_entries.password moves from plaintext to app-level AES-256-GCM
-- ciphertext (see backend/src/utils/crypto.js). The old `strength` column was
-- a GENERATED column derived from length(password); once password is
-- ciphertext that length no longer reflects the real password's strength, so
-- strength becomes a plain column the application sets explicitly (from the
-- plaintext) at write time, before encrypting.
ALTER TABLE password_entries DROP COLUMN IF EXISTS strength;
ALTER TABLE password_entries ADD COLUMN IF NOT EXISTS strength TEXT NOT NULL DEFAULT 'fair';
