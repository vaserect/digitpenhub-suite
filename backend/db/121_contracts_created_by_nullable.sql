-- Migration 121: Make contracts.created_by nullable
-- Allows the organizations trigger to seed a default draft contract during registration
-- before the owner user record is inserted.

ALTER TABLE contracts ALTER COLUMN created_by DROP NOT NULL;
