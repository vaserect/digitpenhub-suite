CREATE TABLE document_folders (
  id         BIGSERIAL PRIMARY KEY,
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  parent_id  BIGINT REFERENCES document_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id          BIGSERIAL PRIMARY KEY,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  folder_id   BIGINT REFERENCES document_folders(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  file_type   TEXT,
  file_size   BIGINT,
  description TEXT,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  url         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
