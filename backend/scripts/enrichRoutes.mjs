// Auto-generation script: adds bulk-delete + export + stats to route files
// Run: node scripts/enrichRoutes.mjs  (not used directly — I'll explain below)

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, '../src/routes');

// Table name mapping: route file → likely DB table
function guessTable(filename) {
  const name = filename.replace(/\.js$/, '').replace(/Routes?$/, '').replace(/Controller$/, '');
  const map = {
    appointments: 'appointments',
    approvals: 'approval_templates',
    assets: 'assets',
    automation: 'automation_rules',
    barcodes: 'barcodes',
    cbt: 'cbt_quizzes',
    certificates: 'certificates',
    chatbotBuilder: 'chatbot_flows',
    cloudStorage: 'cloud_storage_files',
    colorPalettes: 'color_palettes',
    contracts: 'contracts',
    coupons: 'coupons',
    crmUpgrades: 'crm_companies',
    customReports: 'custom_reports',
    dataTables: 'data_tables',
    delivery: 'delivery_orders',
    digitalBusinessCards: 'digital_business_cards',
    digitalProducts: 'digital_products',
    documents: 'documents',
    dunning: 'dunning_templates',
    educationUpgrades: 'attendance_records',
    expenses: 'expenses',
    exports: 'export_jobs',
    featureFlags: 'feature_flags',
    funnels: 'funnels',
    gdpr: 'gdpr_requests',
    greenModules: 'communities',
    heatmaps: 'heatmaps',
    helpdesk: 'helpdesk_tickets',
    hr: 'employees',
    inbox: 'inbox_messages',
    inventory: 'inventory_items',
    invoices: 'invoices',
    knowledgeBase: 'kb_articles',
    leads: 'forms',
    meetingNotes: 'meeting_notes',
    notes: 'notes',
    notifications: 'notifications',
    orders: 'orders',
    payroll: 'payroll_runs',
    permissions: 'permission_roles',
    popupBuilder: 'popups',
    pos: 'pos_sessions',
    quizBuilder: 'quizzes',
    recruitment: 'jobs',
    referrals: 'referrals',
    reviews: 'reviews',
    segments: 'segments',
    sms: 'sms_contacts',
    sso: 'sso_providers',
    subscriptions: 'subscriptions',
    tasks: 'tasks',
    timeTracking: 'time_entries',
    urlShortener: 'short_urls',
    whatsapp: 'whatsapp_contacts',
    workflowAutomation: 'workflows',
  };
  return map[name] || name.replace(/_/g, '');
}

fs.readdirSync(ROUTES_DIR).forEach(file => {
  const filepath = path.join(ROUTES_DIR, file);
  let content = fs.readFileSync(filepath, 'utf8');
  const hasBulkDelete = content.includes('bulk-delete') || content.includes('bulkDelete');
  const hasExport = content.includes("'/export'") || content.includes('export');
  const hasStats = content.includes("'/stats'") || content.includes('getStats');

  const needs = [];
  if (!hasBulkDelete) needs.push('bulk-delete');
  if (!hasExport) needs.push('export');
  if (!hasStats) needs.push('stats');

  if (needs.length > 0) {
    const table = guessTable(file);
    const insertions = [];

    if (needs.includes('bulk-delete')) {
      insertions.push(`router.post('/bulk-delete', bulkDeleteHandler('${table}'));`);
    }
    if (needs.includes('export')) {
      insertions.push(`router.get('/export', async (req, res) => {
    const { rows } = await db.query('SELECT * FROM ${table} WHERE org_id = $1', [req.user.orgId]);
    sendCsv(res, '${table}.csv', rows, autoColumns(rows));
  });`);
    }
    if (needs.includes('stats')) {
      insertions.push(`router.get('/stats', async (req, res) => {
    const { rows } = await db.query('SELECT count(*)::int AS total FROM ${table} WHERE org_id = $1', [req.user.orgId]);
    res.json({ stats: rows[0] });
  });`);
    }

    // Add imports if needed
    if (!content.includes("'../utils/bulkDelete'")) {
      content = content.replace(/^const .* = require\('express'\);/m,
        `const { Router } = require('express');\nconst { bulkDeleteHandler } = require('../utils/bulkDelete');\nconst { sendCsv, autoColumns } = require('../utils/csv');\nconst db = require('../db');`);
    }

    // Add routes before module.exports
    content = content.replace(/(module\.exports\s*=)/,
      insertions.join('\n') + '\n\n$1');

    fs.writeFileSync(filepath, content);
    console.log(`${file}: added ${needs.join(', ')}`);
  }
});
