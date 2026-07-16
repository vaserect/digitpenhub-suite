const db = require('../db');
const { getOrgPlan } = require('../utils/planAccess');
const { registerCloudflareCustomHostname, checkCloudflareCustomHostnameStatus, checkDnsCname } = require('../utils/cloudflare');

// White-label is a Business-plan feature — agencies reselling the whole
// platform under their own brand is exactly the "highest tier" use case,
// consistent with how the pricing page positions Business as the plan for
// agencies/dedicated support.
const ELIGIBLE_PLAN_SLUG = 'business';

// Computes which of the 6 guided stages are done, in order, so the frontend
// can render real status per stage instead of guessing from raw fields.
function computeStages(plan, branding) {
  const eligible = plan.slug === ELIGIBLE_PLAN_SLUG;
  const hasDomain = !!branding?.custom_domain;
  const hasBranding = !!(branding?.logo_url && branding?.primary_color);
  const hasSender = !!(branding?.sender_name && branding?.sender_email);
  return [
    { key: 'eligibility', label: 'Plan eligibility', status: eligible ? 'done' : 'blocked', detail: eligible ? 'Business plan active.' : 'Requires the Business plan.' },
    { key: 'domain', label: 'Connect a custom domain', status: !eligible ? 'locked' : hasDomain ? (branding.custom_domain_verified ? 'done' : 'pending') : 'not_started', detail: !eligible ? null : hasDomain ? (branding.custom_domain_verified ? branding.custom_domain : `Awaiting DNS verification for ${branding.custom_domain}`) : 'No domain connected yet.' },
    { key: 'branding', label: 'Upload logo & set colors', status: !eligible ? 'locked' : hasBranding ? 'done' : 'not_started', detail: !eligible ? null : hasBranding ? 'Logo and brand colors set.' : 'No branding uploaded yet.' },
    { key: 'sender', label: 'Set sender identity', status: !eligible ? 'locked' : hasSender ? 'done' : 'not_started', detail: !eligible ? null : hasSender ? `${branding.sender_name} <${branding.sender_email}>` : 'No sender identity set yet.' },
    { key: 'preview', label: 'Preview', status: !eligible ? 'locked' : (hasBranding ? 'done' : 'not_started'), detail: !eligible ? null : 'Preview the branded app shell before activating.' },
    { key: 'activate', label: 'Activate', status: !eligible ? 'locked' : branding?.is_active ? 'done' : (hasBranding ? 'not_started' : 'locked'), detail: !eligible ? null : branding?.is_active ? `Live since ${branding.activated_at}` : null },
  ];
}

async function getStatus(req, res) {
  const [plan, brandingRes] = await Promise.all([
    getOrgPlan(req.user.orgId),
    db.query(`SELECT * FROM org_branding WHERE org_id = $1`, [req.user.orgId]),
  ]);
  const branding = brandingRes.rows[0] || null;
  res.json({
    eligible: plan.slug === ELIGIBLE_PLAN_SLUG,
    planSlug: plan.slug,
    branding,
    stages: computeStages(plan, branding),
    // Real blocker, surfaced honestly rather than pretending domain
    // verification works — matches how Step 1f was built (UI/UX complete,
    // live DNS calls gated behind the credential).
    domainAutomationAvailable: !!process.env.CLOUDFLARE_API_TOKEN,
  });
}

async function upsertBranding(req, res) {
  const plan = await getOrgPlan(req.user.orgId);
  if (plan.slug !== ELIGIBLE_PLAN_SLUG) {
    return res.status(403).json({ error: 'White-label is a Business-plan feature. Upgrade to unlock it.', upgradeRequired: true });
  }

  const { logoUrl, faviconUrl, primaryColor, accentColor, displayName, senderName, senderEmail } = req.body || {};
  const { rows } = await db.query(
    `INSERT INTO org_branding (org_id, logo_url, favicon_url, primary_color, accent_color, display_name, sender_name, sender_email, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
     ON CONFLICT (org_id) DO UPDATE SET
       logo_url      = COALESCE(EXCLUDED.logo_url, org_branding.logo_url),
       favicon_url   = COALESCE(EXCLUDED.favicon_url, org_branding.favicon_url),
       primary_color = COALESCE(EXCLUDED.primary_color, org_branding.primary_color),
       accent_color  = COALESCE(EXCLUDED.accent_color, org_branding.accent_color),
       display_name  = COALESCE(EXCLUDED.display_name, org_branding.display_name),
       sender_name   = COALESCE(EXCLUDED.sender_name, org_branding.sender_name),
       sender_email  = COALESCE(EXCLUDED.sender_email, org_branding.sender_email),
       updated_at    = now()
     RETURNING *`,
    [req.user.orgId, logoUrl || null, faviconUrl || null, primaryColor || null, accentColor || null, displayName || null, senderName || null, senderEmail || null]
  );
  res.json({ branding: rows[0] });
}

async function connectDomain(req, res) {
  const plan = await getOrgPlan(req.user.orgId);
  if (plan.slug !== ELIGIBLE_PLAN_SLUG) {
    return res.status(403).json({ error: 'White-label is a Business-plan feature. Upgrade to unlock it.', upgradeRequired: true });
  }
  const { domain } = req.body || {};
  if (!domain?.trim()) return res.status(400).json({ error: 'domain is required.' });

  const cleanDomain = domain.trim().toLowerCase();

  // Try to register in Cloudflare Zone
  await registerCloudflareCustomHostname(cleanDomain);

  const cloudflareConfigured = !!process.env.CLOUDFLARE_API_TOKEN;

  const { rows } = await db.query(
    `INSERT INTO org_branding (org_id, custom_domain, custom_domain_verified, updated_at)
     VALUES ($1,$2,false,now())
     ON CONFLICT (org_id) DO UPDATE SET custom_domain = $2, custom_domain_verified = false, updated_at = now()
     RETURNING *`,
    [req.user.orgId, cleanDomain]
  );
  res.json({
    branding: rows[0],
    dnsInstructions: { type: 'CNAME', name: cleanDomain, value: 'branded.digitpenhub.com' },
    cloudflareConfigured,
    note: cloudflareConfigured ? 'Connecting to SSL automation…' : 'Automatic DNS verification needs a Cloudflare API token — see NEXT_STEPS_FOR_YOU.md. Add the CNAME record above and check back once it is added.',
  });
}

async function verifyDomain(req, res) {
  const brandingRes = await db.query(`SELECT * FROM org_branding WHERE org_id = $1`, [req.user.orgId]);
  const branding = brandingRes.rows[0];
  if (!branding || !branding.custom_domain) {
    return res.status(400).json({ error: 'No custom domain is connected. Connect one first.' });
  }

  const hostname = branding.custom_domain;
  let verified = false;
  let details = {};

  // 1. Check direct DNS CNAME
  const dnsVerified = await checkDnsCname(hostname);
  if (dnsVerified) {
    verified = true;
    details.method = 'dns_cname';
  }

  // 2. Check Cloudflare hostname status if token configured
  const cloudflareConfigured = !!process.env.CLOUDFLARE_API_TOKEN;
  if (cloudflareConfigured) {
    const cfStatus = await checkCloudflareCustomHostnameStatus(hostname);
    details.cloudflare = cfStatus;
    if (cfStatus && cfStatus.status === 'active') {
      verified = true;
      details.method = 'cloudflare_api';
    }
  }

  // 3. Update DB on success
  if (verified) {
    await db.query(
      `UPDATE org_branding SET custom_domain_verified = true, updated_at = now() WHERE org_id = $1`,
      [req.user.orgId]
    );
  }

  res.json({
    verified,
    domain: hostname,
    dnsInstructions: { type: 'CNAME', name: hostname, value: 'branded.digitpenhub.com' },
    cloudflareConfigured,
    details
  });
}

async function activate(req, res) {
  const plan = await getOrgPlan(req.user.orgId);
  if (plan.slug !== ELIGIBLE_PLAN_SLUG) {
    return res.status(403).json({ error: 'White-label is a Business-plan feature. Upgrade to unlock it.', upgradeRequired: true });
  }
  const { rows: existing } = await db.query(`SELECT * FROM org_branding WHERE org_id = $1`, [req.user.orgId]);
  if (!existing.length || !existing[0].logo_url || !existing[0].primary_color) {
    return res.status(400).json({ error: 'Upload a logo and set your brand colors before activating.' });
  }
  const { rows } = await db.query(
    `UPDATE org_branding SET is_active = true, activated_at = now(), updated_at = now() WHERE org_id = $1 RETURNING *`,
    [req.user.orgId]
  );
  res.json({ branding: rows[0] });
}

async function deactivate(req, res) {
  const { rows } = await db.query(
    `UPDATE org_branding SET is_active = false, updated_at = now() WHERE org_id = $1 RETURNING *`,
    [req.user.orgId]
  );
  res.json({ branding: rows[0] || null });
}

module.exports = { getStatus, upsertBranding, connectDomain, verifyDomain, activate, deactivate };
