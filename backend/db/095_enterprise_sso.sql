-- Enterprise SSO/SAML
--
-- Supports SAML 2.0 and OIDC identity providers. Each org can configure
-- one or more IdP connections. JIT provisioning creates user accounts
-- automatically on first successful SSO login.

CREATE TABLE IF NOT EXISTS sso_providers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_type   TEXT NOT NULL CHECK (provider_type IN ('saml','oidc')),
  name            TEXT NOT NULL,               -- e.g. "Google Workspace", "Azure AD"
  -- SAML fields
  idp_metadata_url TEXT,                        -- SAML metadata URL
  idp_entity_id   TEXT,                         -- SAML Issuer
  idp_sso_url     TEXT,                         -- SAML Login URL
  idp_cert        TEXT,                         -- SAML x509 cert (base64)
  -- OIDC fields
  issuer_url      TEXT,
  client_id       TEXT,
  client_secret   TEXT,
  -- Common
  domain          TEXT NOT NULL,               -- org's email domain (e.g. "company.com")
  jit_provisioning BOOLEAN NOT NULL DEFAULT true,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, id)
);

CREATE INDEX IF NOT EXISTS idx_sso_domain ON sso_providers(domain) WHERE is_active = true;

-- Track SSO login attempts (for debugging and audit)
CREATE TABLE IF NOT EXISTS sso_login_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID REFERENCES sso_providers(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  ip_address      TEXT,
  success         BOOLEAN NOT NULL,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sso_attempts_email ON sso_login_attempts(email);
