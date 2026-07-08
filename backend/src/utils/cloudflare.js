// Thin wrapper around Cloudflare's Custom Hostnames API (Cloudflare for SaaS).
// Every domain-connection feature in the app should call these functions —
// never hit the Cloudflare API directly from a controller.

const CF_API = 'https://api.cloudflare.com/client/v4';

function authHeaders() {
  return {
    'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function isConfigured() {
  return !!(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID);
}

// Registers a customer's domain as a Custom Hostname on our zone. Cloudflare
// then handles DCV (domain control validation) and cert issuance once the
// customer's DNS actually points at us — this call alone does not make the
// domain live, it just starts the process.
async function createCustomHostname(hostname) {
  if (!isConfigured()) {
    return { ok: false, error: 'cloudflare_not_configured' };
  }
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const res = await fetch(`${CF_API}/zones/${zoneId}/custom_hostnames`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      hostname,
      ssl: { method: 'http', type: 'dv', settings: { min_tls_version: '1.2' } },
    }),
  });
  const data = await res.json();
  if (!data.success) {
    return { ok: false, error: data.errors?.[0]?.message || 'cloudflare_error', raw: data.errors };
  }
  return { ok: true, id: data.result.id, status: mapStatus(data.result) };
}

// Polls the real, current state of a previously-created custom hostname —
// this is what powers an honest Pending/Live status instead of a static label.
async function getCustomHostnameStatus(customHostnameId) {
  if (!isConfigured()) {
    return { ok: false, error: 'cloudflare_not_configured' };
  }
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const res = await fetch(`${CF_API}/zones/${zoneId}/custom_hostnames/${customHostnameId}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!data.success) {
    return { ok: false, error: data.errors?.[0]?.message || 'cloudflare_error' };
  }
  return { ok: true, status: mapStatus(data.result), raw: data.result };
}

// Deregisters the domain — used by both the "remove domain" button and
// account deactivation, so a churned customer's hostname doesn't linger.
async function deleteCustomHostname(customHostnameId) {
  if (!isConfigured()) {
    return { ok: false, error: 'cloudflare_not_configured' };
  }
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const res = await fetch(`${CF_API}/zones/${zoneId}/custom_hostnames/${customHostnameId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  return { ok: !!data.success, error: data.success ? null : (data.errors?.[0]?.message || 'cloudflare_error') };
}

// Collapses Cloudflare's own hostname/SSL status fields into the three
// states the UI actually needs — never show "Connected" without this
// resolving to 'active'.
function mapStatus(result) {
  const sslStatus = result?.ssl?.status;
  const hostnameStatus = result?.status;
  if (hostnameStatus === 'active' && sslStatus === 'active') return 'active';
  if (hostnameStatus === 'active' || hostnameStatus === 'pending') return 'pending';
  return 'error';
}

module.exports = { isConfigured, createCustomHostname, getCustomHostnameStatus, deleteCustomHostname };
