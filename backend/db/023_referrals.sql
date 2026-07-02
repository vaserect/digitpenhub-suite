-- Milestone 23: Referral Program

CREATE TABLE referral_programs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  description  TEXT,
  reward_type  TEXT        NOT NULL DEFAULT 'cash'
                 CHECK (reward_type IN ('cash','discount','credit','gift')),
  reward_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  status       TEXT        NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','paused','ended')),
  terms        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX referral_programs_org_idx ON referral_programs (org_id);

CREATE TABLE referrals (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  program_id     UUID        REFERENCES referral_programs(id) ON DELETE SET NULL,
  referrer_name  TEXT        NOT NULL,
  referrer_email TEXT,
  referrer_code  TEXT,
  referee_name   TEXT        NOT NULL,
  referee_email  TEXT,
  referee_phone  TEXT,
  status         TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','contacted','converted','rewarded','rejected')),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX referrals_org_program_idx ON referrals (org_id, program_id);
