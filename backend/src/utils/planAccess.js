const db = require('../db');

// Modules bundled into every plan, including Free — matches the Free plan's
// advertised feature list ("Lead forms", "Basic CRM") plus Invoices, which
// Free's own limit ("5 invoices") only makes sense if the module is reachable
// at all. Everything else requires `all_modules` on the org's plan.
const FREE_TIER_MODULE_SLUGS = new Set(['crm', 'lead-generation', 'invoices']);

async function getOrgPlan(orgId) {
  const { rows } = await db.query(
    `SELECT p.slug, p.name, p.max_users, p.max_contacts, p.max_invoices, p.all_modules
     FROM subscriptions s JOIN plans p ON p.id = s.plan_id
     WHERE s.org_id = $1 AND s.status = 'active'`,
    [orgId]
  );
  if (rows.length) return rows[0];
  // Defensive fallback — every org should have a subscription row (a DB
  // trigger creates one on org creation), but if one is somehow missing,
  // treat the org as Free rather than failing open to unlimited access.
  const { rows: freeRows } = await db.query(
    `SELECT slug, name, max_users, max_contacts, max_invoices, all_modules FROM plans WHERE slug = 'free'`
  );
  return freeRows[0] || { slug: 'free', name: 'Free', max_users: 1, max_contacts: 50, max_invoices: 5, all_modules: false };
}

// Express middleware — blocks access to a paid-only module for orgs whose
// plan doesn't include `all_modules`. Not needed on crm/leads/invoices
// routes, which every plan includes.
function requireModuleAccess(moduleSlug) {
  return async function (req, res, next) {
    try {
      if (FREE_TIER_MODULE_SLUGS.has(moduleSlug)) return next();
      const plan = await getOrgPlan(req.user.orgId);
      if (plan.all_modules) return next();
      return res.status(403).json({
        error: `This feature requires a paid plan. Upgrade to unlock ${moduleSlug.replace(/-/g, ' ')}.`,
        upgradeRequired: true,
        moduleSlug,
        currentPlan: plan.slug,
      });
    } catch (err) {
      next(err);
    }
  };
}

// Express middleware — blocks creating a new resource once the org's plan
// limit is reached. Existing records over the limit stay fully accessible;
// only new creation is blocked. `countQuery` must return a single row with
// a `count` column scoped to req.user.orgId.
function requireUsageCapacity(resourceType, countQuery) {
  return async function (req, res, next) {
    try {
      const plan = await getOrgPlan(req.user.orgId);
      const max = plan[`max_${resourceType}`];
      if (max == null) return next(); // unlimited on this plan
      const { rows } = await db.query(countQuery, [req.user.orgId]);
      const current = Number(rows[0]?.count || 0);
      if (current >= max) {
        return res.status(403).json({
          error: `You've reached the ${max} ${resourceType} limit on the ${plan.name} plan. Upgrade to add more.`,
          upgradeRequired: true,
          limitReached: resourceType,
          currentPlan: plan.slug,
          current,
          max,
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { getOrgPlan, requireModuleAccess, requireUsageCapacity, FREE_TIER_MODULE_SLUGS };
