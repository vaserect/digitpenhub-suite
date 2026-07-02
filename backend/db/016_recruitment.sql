-- Milestone 16: Recruitment

CREATE TABLE job_postings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  department   TEXT,
  location     TEXT,
  job_type     TEXT        NOT NULL DEFAULT 'full-time'
                 CHECK (job_type IN ('full-time','part-time','contract','remote','internship')),
  description  TEXT,
  requirements TEXT,
  status       TEXT        NOT NULL DEFAULT 'open'
                 CHECK (status IN ('draft','open','closed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX job_postings_org_status_idx ON job_postings (org_id, status);

CREATE TABLE applicants (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id       UUID        REFERENCES job_postings(id) ON DELETE SET NULL,
  full_name    TEXT        NOT NULL,
  email        TEXT,
  phone        TEXT,
  stage        TEXT        NOT NULL DEFAULT 'new'
                 CHECK (stage IN ('new','screening','interview','offer','hired','rejected')),
  source       TEXT,
  resume_url   TEXT,
  notes        TEXT,
  applied_at   DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX applicants_org_stage_idx ON applicants (org_id, stage);
CREATE INDEX applicants_org_job_idx   ON applicants (org_id, job_id);
