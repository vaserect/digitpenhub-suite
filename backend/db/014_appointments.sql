-- Milestone 14: Appointment Booking

CREATE TABLE services (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  description      TEXT,
  duration_minutes INTEGER     NOT NULL DEFAULT 30,
  price_ngn        INTEGER     NOT NULL DEFAULT 0,
  color            TEXT        NOT NULL DEFAULT '#2563eb',
  status           TEXT        NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','inactive')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX services_org_idx ON services (org_id, status);

-- One row per day of week per org (0=Sun … 6=Sat)
CREATE TABLE availability_slots (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  day_of_week   INTEGER     NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME        NOT NULL DEFAULT '09:00',
  end_time      TIME        NOT NULL DEFAULT '17:00',
  is_active     BOOLEAN     NOT NULL DEFAULT false,
  UNIQUE (org_id, day_of_week)
);

CREATE TABLE appointments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_id    UUID        REFERENCES services(id) ON DELETE SET NULL,
  client_name   TEXT        NOT NULL,
  client_email  TEXT,
  client_phone  TEXT,
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','cancelled','completed')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX appointments_org_time_idx ON appointments (org_id, start_time);
