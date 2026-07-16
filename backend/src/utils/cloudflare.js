const dns = require('dns').promises;

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

/**
 * Perform a direct DNS CNAME lookup.
 */
async function checkDnsCname(hostname) {
  try {
    const targets = await dns.resolveCname(hostname);
    // Support exact match or trailing dot (standard DNS format)
    return targets.some(t => {
      const clean = t.toLowerCase().replace(/\.$/, '');
      return clean === 'branded.digitpenhub.com';
    });
  } catch (err) {
    return false;
  }
}

/**
 * Register a custom domain in Cloudflare (SSL for SaaS).
 */
async function registerCloudflareCustomHostname(hostname) {
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
    return null;
  }

  try {
    // 1. Check if custom hostname already exists
    const checkRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames?hostname=${encodeURIComponent(hostname)}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const checkData = await checkRes.json();
    if (checkData.success && checkData.result && checkData.result.length > 0) {
      return checkData.result[0];
    }

    // 2. If it does not exist, create it
    const createRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: hostname,
          ssl: {
            method: 'http',
            type: 'dv'
          }
        })
      }
    );
    const createData = await createRes.json();
    if (createData.success) {
      return createData.result;
    }
    console.error('Cloudflare create custom hostname failed:', createData.errors);
    return null;
  } catch (e) {
    console.error('Cloudflare register custom hostname error:', e);
    return null;
  }
}

/**
 * Get the status of a custom domain in Cloudflare.
 */
async function checkCloudflareCustomHostnameStatus(hostname) {
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
    return null;
  }

  try {
    const checkRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames?hostname=${encodeURIComponent(hostname)}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const checkData = await checkRes.json();
    if (checkData.success && checkData.result && checkData.result.length > 0) {
      const record = checkData.result[0];
      return {
        id: record.id,
        status: record.status, // active | pending_validation | etc
        sslStatus: record.ssl?.status, // active | pending_validation | etc
        verificationErrors: record.verification_errors || []
      };
    }
    return null;
  } catch (e) {
    console.error('Cloudflare check status failed:', e);
    return null;
  }
}

module.exports = {
  checkDnsCname,
  registerCloudflareCustomHostname,
  checkCloudflareCustomHostnameStatus
};
