-- Native Integrations Hub (Must-have)
-- Provider registry, per-org OAuth connections, webhook events, sync audit log.

CREATE TABLE IF NOT EXISTS integration_providers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  icon_url        TEXT,
  auth_type       TEXT NOT NULL DEFAULT 'oauth2' CHECK (auth_type IN ('oauth2','api_key','none')),
  client_id       TEXT,
  client_secret   TEXT,
  auth_url        TEXT,
  token_url       TEXT,
  scopes          TEXT[] DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_id     UUID NOT NULL REFERENCES integration_providers(id) ON DELETE CASCADE,
  label           TEXT,
  access_token    TEXT,
  refresh_token   TEXT,
  token_expires_at TIMESTAMPTZ,
  provider_user_id TEXT,
  provider_org_id  TEXT,
  metadata        JSONB DEFAULT '{}'::jsonb,
  is_connected    BOOLEAN NOT NULL DEFAULT false,
  last_sync_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, provider_id, label)
);

CREATE INDEX IF NOT EXISTS idx_int_conn_org ON integration_connections(org_id, provider_id);

CREATE TABLE IF NOT EXISTS integration_webhooks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id   UUID REFERENCES integration_connections(id) ON DELETE SET NULL,
  provider_slug   TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  payload         JSONB,
  source_ip       TEXT,
  signature       TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processed','failed')),
  processed_at    TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_int_webhooks_org ON integration_webhooks(org_id, created_at DESC);

CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id   UUID NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
  sync_type       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  records_synced  INT DEFAULT 0,
  error_message   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_int_sync_logs_conn ON integration_sync_logs(connection_id, started_at DESC);

INSERT INTO integration_providers (slug, name, description, auth_type, scopes) VALUES
  ('slack',       'Slack',        'Team messaging and collaboration',        'oauth2', '{channels:read,chat:write,users:read}'),
  ('google',      'Google',       'Google Workspace (Gmail, Drive, Calendar)','oauth2', '{https://www.googleapis.com/auth/gmail.modify,https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/calendar}'),
  ('microsoft',   'Microsoft',    'Microsoft 365 (Outlook, Teams, SharePoint)','oauth2','{offline_access,User.Read,Mail.Read,Calendars.Read}'),
  ('quickbooks',  'QuickBooks',   'QuickBooks Online accounting',            'oauth2', '{com.intuit.quickbooks.accounting}'),
  ('salesforce',  'Salesforce',   'Salesforce CRM',                          'oauth2', '{api,refresh_token,offline_access}'),
  ('zoom',        'Zoom',         'Video conferencing and meetings',         'oauth2', '{meeting:write,user:read}'),
  ('stripe',      'Stripe',       'Payment processing and billing',          'oauth2', '{charges.read,customers.read,subscriptions.read}'),
  ('resend',      'Resend',       'Email delivery API',                      'api_key','{}')
ON CONFLICT (slug) DO NOTHING;
