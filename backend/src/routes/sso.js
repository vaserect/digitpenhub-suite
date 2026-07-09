const { Router } = require('express');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

// ── Public: discover IdP by email domain ──────────────────────────────────────
router.get('/discover', asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json({ ssoAvailable: false });
  const domain = email.split('@')[1];
  if (!domain) return res.json({ ssoAvailable: false });
  const { rows } = await db.query(
    `SELECT id, provider_type, name FROM sso_providers WHERE domain = $1 AND is_active = true LIMIT 1`,
    [domain]
  );
  if (!rows.length) return res.json({ ssoAvailable: false });
  res.json({ ssoAvailable: true, provider: { id: rows[0].id, type: rows[0].provider_type, name: rows[0].name } });
}));

// ── Initiate SSO login (public — called before auth) ─────────────────────────
router.post('/login/:providerId', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM sso_providers WHERE id = $1 AND is_active = true`,
    [req.params.providerId]
  );
  if (!rows.length) return res.status(404).json({ error: 'SSO provider not found.' });
  const provider = rows[0];
  const relayState = crypto.randomBytes(16).toString('hex');

  if (provider.provider_type === 'saml' && provider.idp_sso_url) {
    const samlRequest = Buffer.from(
      `<?xml version="1.0"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="_${crypto.randomBytes(16).toString('hex')}"
  Version="2.0"
  IssueInstant="${new Date().toISOString()}"
  Destination="${provider.idp_sso_url}"
  AssertionConsumerServiceURL="${process.env.FRONTEND_ORIGIN || 'https://suite.digitpenhub.com'}/api/v1/auth/sso/callback">
  <saml:Issuer>${process.env.FRONTEND_ORIGIN || 'https://suite.digitpenhub.com'}</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"/>
</samlp:AuthnRequest>`
    ).toString('base64');
    return res.json({ redirectUrl: provider.idp_sso_url, samlRequest, relayState, type: 'saml_redirect' });
  }

  if (provider.provider_type === 'oidc' && provider.issuer_url && provider.client_id) {
    const redirectUri = `${process.env.FRONTEND_ORIGIN || 'https://suite.digitpenhub.com'}/api/v1/auth/sso/callback`;
    const authUrl = `${provider.issuer_url}/authorize?response_type=code&client_id=${provider.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${relayState}&scope=openid%20email%20profile`;
    return res.json({ redirectUrl: authUrl, relayState, type: 'oidc_redirect' });
  }
  res.status(400).json({ error: 'SSO provider not fully configured.' });
}));

// ── SSO callback (ACS endpoint — public) ──────────────────────────────────────
router.post('/callback', asyncHandler(async (req, res) => {
  const { providerId, email, name } = req.body || {};
  if (!providerId || !email) return res.status(400).json({ error: 'providerId and email are required.' });

  const { rows } = await db.query('SELECT * FROM sso_providers WHERE id = $1', [providerId]);
  if (!rows.length) return res.status(404).json({ error: 'Provider not found.' });
  const provider = rows[0];

  await db.query(
    `INSERT INTO sso_login_attempts (provider_id, email, ip_address, success) VALUES ($1, $2, $3, true)`,
    [provider.id, email.toLowerCase().trim(), req.ip]
  ).catch(() => {});

  const { rows: existing } = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  let user;

  if (existing.length) {
    user = existing[0];
  } else if (provider.jit_provisioning) {
    const userName = (name || email.split('@')[0]).trim();
    const { rows: newUser } = await db.query(
      `INSERT INTO users (org_id, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'sso-managed', 'member')
       RETURNING id, full_name, email, role`,
      [provider.org_id, userName, email.toLowerCase().trim()]
    );
    user = newUser[0];
  } else {
    return res.status(403).json({ error: 'No account found and JIT provisioning is disabled.' });
  }

  const { createSession } = require('../controllers/authController');
  await createSession(res, user.id, req);
  res.json({ user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role } });
}));

// ── Protected: Provider CRUD ──────────────────────────────────────────────────
router.use(requireAuth);

router.get('/providers', asyncHandler(async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only owners and admins can manage SSO.' });
  }
  const { rows } = await db.query(
    `SELECT id, provider_type, name, domain, jit_provisioning, is_active, created_at
     FROM sso_providers WHERE org_id = $1 ORDER BY name`,
    [req.user.orgId]
  );
  res.json({ providers: rows });
}));

router.post('/providers', asyncHandler(async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only owners and admins can configure SSO.' });
  }
  const { providerType, name, domain, metadataUrl, entityId, ssoUrl, cert, issuerUrl, clientId, clientSecret, jitProvisioning } = req.body || {};
  if (!providerType || !name || !domain) return res.status(400).json({ error: 'providerType, name, and domain are required.' });
  const { rows } = await db.query(
    `INSERT INTO sso_providers (org_id, provider_type, name, domain, idp_metadata_url, idp_entity_id, idp_sso_url, idp_cert, issuer_url, client_id, client_secret, jit_provisioning)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, provider_type, name, domain, jit_provisioning, is_active, created_at`,
    [req.user.orgId, providerType, name, domain, metadataUrl || null, entityId || null, ssoUrl || null, cert || null,
     issuerUrl || null, clientId || null, clientSecret || null, jitProvisioning !== false]
  );
  res.status(201).json({ provider: rows[0] });
}));

router.patch('/providers/:id', asyncHandler(async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
  const { isActive } = req.body || {};
  const { rows } = await db.query(
    `UPDATE sso_providers SET is_active = $1 WHERE id = $2 AND org_id = $3 RETURNING id, provider_type, name, domain, is_active`,
    [isActive !== false, req.params.id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ provider: rows[0] });
}));

router.delete('/providers/:id', asyncHandler(async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Only the owner can delete SSO providers.' });
  const { rowCount } = await db.query(`DELETE FROM sso_providers WHERE id = $1 AND org_id = $2`, [req.params.id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ ok: true });
}));

module.exports = router;
