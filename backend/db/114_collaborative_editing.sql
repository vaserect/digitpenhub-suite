-- ── Collaborative Document Co-editing (🔴 Must-have) ──────────────────────
-- Shared documents with versioning, edit locking, and presence tracking.
-- Full OT/CRDT is deferred; REST-based locking provides basic conflict prevention.

CREATE TABLE IF NOT EXISTS shared_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  content         TEXT DEFAULT '',
  version         INT NOT NULL DEFAULT 1,
  locked_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_at       TIMESTAMPTZ,
  lock_expires_at TIMESTAMPTZ,
  created_by      UUID NOT NULL REFERENCES users(id),
  is_archived     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shared_docs_org ON shared_documents(org_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS document_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES shared_documents(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_heartbeat  TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (document_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_doc_sessions_doc ON document_sessions(document_id);

CREATE TABLE IF NOT EXISTS document_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES shared_documents(id) ON DELETE CASCADE,
  version         INT NOT NULL,
  content         TEXT NOT NULL,
  saved_by        UUID NOT NULL REFERENCES users(id),
  change_summary  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, version)
);
CREATE INDEX IF NOT EXISTS idx_doc_versions_doc ON document_versions(document_id, version DESC);

-- Function to auto-snapshot on content update (triggered by the app layer, not a DB trigger)
-- The application explicitly creates a version snapshot when saving.
