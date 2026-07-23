const db = require('../db');

const PROVIDER_DIRECTORY = [
  { id: 'zapier', name: 'Zapier', description: 'Connect 5,000+ apps with automated workflows', category: 'automation', docsUrl: 'https://zapier.com/apps/digitpenhub/integrations' },
  { id: 'slack', name: 'Slack', description: 'Receive notifications and send messages to your workspace', category: 'communication', docsUrl: 'https://api.slack.com' },
  { id: 'quickbooks', name: 'QuickBooks', description: 'Sync invoices, expenses, and customers', category: 'accounting', docsUrl: 'https://developer.intuit.com' },
  { id: 'xero', name: 'Xero', description: 'Two-way sync of invoices and bank transactions', category: 'accounting', docsUrl: 'https://developer.xero.com' },
  { id: 'google-workspace', name: 'Google Workspace', description: 'Sync contacts, calendar, and drive', category: 'productivity', docsUrl: 'https://developers.google.com/workspace' },
  { id: 'microsoft-365', name: 'Microsoft 365', description: 'Calendar, contacts, and tasks integration', category: 'productivity', docsUrl: 'https://learn.microsoft.com/en-us/graph/' },
  { id: 'shopify', name: 'Shopify', description: 'Import orders, products, and customers', category: 'commerce', docsUrl: 'https://shopify.dev/api' },
  { id: 'woocommerce', name: 'WooCommerce', description: 'Sync products, orders, and inventory', category: 'commerce', docsUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs/' },
  { id: 'mailchimp', name: 'Mailchimp', description: 'Sync email lists and campaign performance', category: 'marketing', docsUrl: 'https://mailchimp.com/developer/' },
  { id: 'brevo', name: 'Brevo (Sendinblue)', description: 'Transactional email and marketing automation', category: 'marketing', docsUrl: 'https://developers.brevo.com' },
  { id: 'hubspot', name: 'HubSpot', description: 'Two-way CRM contact and deal sync', category: 'crm', docsUrl: 'https://developers.hubspot.com' },
  { id: 'salesforce', name: 'Salesforce', description: 'Enterprise CRM data synchronization', category: 'crm', docsUrl: 'https://developer.salesforce.com' },
  { id: 'stripe', name: 'Stripe', description: 'Payment processing and subscription management', category: 'payments', docsUrl: 'https://stripe.com/docs/api' },
  { id: 'calendly', name: 'Calendly', description: 'Automated meeting scheduling and sync', category: 'scheduling', docsUrl: 'https://developer.calendly.com' },
  { id: 'twilio', name: 'Twilio', description: 'SMS and voice communication channels', category: 'communication', docsUrl: 'https://www.twilio.com/docs' },
];

async function listDirectory(req, res) {
  const { rows: active } = await db.query(
    'SELECT provider FROM enterprise_integrations WHERE org_id = $1 AND is_active = true',
    [req.user.orgId]
  );
  const activeSet = new Set(active.map(r => r.provider));
  const directory = PROVIDER_DIRECTORY.map(p => ({ ...p, connected: activeSet.has(p.id) }));
  res.json({ directory });
}

async function listIntegrations(req, res) {
  const { rows } = await db.query(
    'SELECT id, provider, config, is_active, last_sync_at, created_at FROM enterprise_integrations WHERE org_id = $1 ORDER BY provider',
    [req.user.orgId]
  );
  res.json({ integrations: rows });
}

async function configureIntegration(req, res) {
  const { provider, config } = req.body || {};
  if (!provider) return res.status(400).json({ error: 'provider is required.' });

  const existing = PROVIDER_DIRECTORY.find(p => p.id === provider);
  if (!existing) return res.status(400).json({ error: `Unknown provider: ${provider}` });

  const { rows } = await db.query(
    `INSERT INTO enterprise_integrations (org_id, provider, config, is_active)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (org_id, provider) DO UPDATE SET config = $3, is_active = true, updated_at = now()
     RETURNING *`,
    [req.user.orgId, provider, config ? JSON.stringify(config) : '{}']
  );
  res.json({ integration: rows[0] });
}

async function deactivateIntegration(req, res) {
  const { provider } = req.body || {};
  if (!provider) return res.status(400).json({ error: 'provider is required.' });
  const { rows } = await db.query(
    `UPDATE enterprise_integrations SET is_active = false, updated_at = now() WHERE org_id = $1 AND provider = $2 RETURNING *`,
    [req.user.orgId, provider]
  );
  if (!rows.length) return res.status(404).json({ error: 'Integration not found.' });
  res.json({ integration: rows[0] });
}

module.exports = { listDirectory, listIntegrations, configureIntegration, deactivateIntegration };
