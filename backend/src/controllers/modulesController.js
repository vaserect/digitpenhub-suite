const db = require('../db');
const { getOrgPlan, FREE_TIER_MODULE_SLUGS } = require('../utils/planAccess');

// Returns categories with their modules nested inside, already in display order.
// This single endpoint is what makes the dashboard "auto-activate" tiles — the frontend
// has zero hardcoded knowledge of which modules exist or which are live.
async function listModules(req, res) {
  const { rows } = await db.query(
    `SELECT c.key as category_key, c.name as category_name, c.badge as category_badge,
            m.name as module_name, m.slug, m.status, m.route
     FROM categories c
     JOIN modules m ON m.category_id = c.id
     ORDER BY c.sort_order, m.sort_order`
  );

  const plan = await getOrgPlan(req.user.orgId);

  const byKey = new Map();
  for (const row of rows) {
    if (!byKey.has(row.category_key)) {
      byKey.set(row.category_key, {
        key: row.category_key,
        name: row.category_name,
        badge: row.category_badge,
        modules: [],
      });
    }
    const locked = !plan.all_modules && !FREE_TIER_MODULE_SLUGS.has(row.slug);
    byKey.get(row.category_key).modules.push({
      name: row.module_name,
      slug: row.slug,
      status: row.status,
      route: row.route,
      locked,
    });
  }

  res.json({
    categories: [...byKey.values()],
    plan: { slug: plan.slug, name: plan.name, allModules: plan.all_modules },
  });
}

module.exports = { listModules };
