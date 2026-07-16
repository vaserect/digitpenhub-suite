/**
 * HR & Payroll Authorization Middleware
 * Ensures only users with appropriate roles can access sensitive HR data
 */

const db = require('../db');

/**
 * Check if user has HR access (owner, admin, hr roles)
 * Used for viewing employee data (excluding salaries)
 */
async function requireHrAccess(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT role FROM team_members WHERE user_id = $1 AND org_id = $2`,
      [req.user.id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(403).json({ error: 'No team membership found.' });
    }

    const hasAccess = rows.some(r => ['owner', 'admin', 'hr'].includes(r.role));

    if (!hasAccess) {
      // Log unauthorized access attempt
      await db.query(
        `INSERT INTO audit_log (user_id, org_id, action, resource_type, resource_id, ip_address, user_agent, status, meta)
         VALUES ($1, $2, 'hr.access.denied', 'hr', NULL, $3, $4, 'denied', $5)`,
        [
          req.user.id,
          req.user.orgId,
          req.ip || req.connection?.remoteAddress || 'unknown',
          req.get('user-agent') || 'unknown',
          JSON.stringify({ endpoint: req.originalUrl, method: req.method })
        ]
      );

      return res.status(403).json({ 
        error: 'Insufficient permissions. HR access required.' 
      });
    }

    // Store role info for later use
    req.userRoles = rows.map(r => r.role);
    next();
  } catch (error) {
    console.error('HR auth middleware error:', error);
    res.status(500).json({ error: 'Authorization check failed.' });
  }
}

/**
 * Check if user has sensitive data access (owner, admin, hr roles)
 * Used for viewing salaries and financial data
 */
async function requireSensitiveDataAccess(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT role FROM team_members WHERE user_id = $1 AND org_id = $2`,
      [req.user.id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(403).json({ error: 'No team membership found.' });
    }

    const hasAccess = rows.some(r => ['owner', 'admin', 'hr'].includes(r.role));

    if (!hasAccess) {
      // Log unauthorized access attempt
      await db.query(
        `INSERT INTO audit_log (user_id, org_id, action, resource_type, resource_id, ip_address, user_agent, status, meta)
         VALUES ($1, $2, 'hr.salary.access.denied', 'employee', NULL, $3, $4, 'denied', $5)`,
        [
          req.user.id,
          req.user.orgId,
          req.ip || req.connection?.remoteAddress || 'unknown',
          req.get('user-agent') || 'unknown',
          JSON.stringify({ endpoint: req.originalUrl, method: req.method })
        ]
      );

      return res.status(403).json({ 
        error: 'Insufficient permissions. HR role required to view sensitive data.' 
      });
    }

    req.userRoles = rows.map(r => r.role);
    next();
  } catch (error) {
    console.error('Sensitive data auth middleware error:', error);
    res.status(500).json({ error: 'Authorization check failed.' });
  }
}

/**
 * Check if user has payroll access (owner, admin, hr, finance roles)
 * Used for payroll operations
 */
async function requirePayrollAccess(req, res, next) {
  try {
    const { rows } = await db.query(
      `SELECT role FROM team_members WHERE user_id = $1 AND org_id = $2`,
      [req.user.id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(403).json({ error: 'No team membership found.' });
    }

    const hasAccess = rows.some(r => ['owner', 'admin', 'hr', 'finance'].includes(r.role));

    if (!hasAccess) {
      // Log unauthorized access attempt
      await db.query(
        `INSERT INTO audit_log (user_id, org_id, action, resource_type, resource_id, ip_address, user_agent, status, meta)
         VALUES ($1, $2, 'hr.payroll.access.denied', 'payroll', NULL, $3, $4, 'denied', $5)`,
        [
          req.user.id,
          req.user.orgId,
          req.ip || req.connection?.remoteAddress || 'unknown',
          req.get('user-agent') || 'unknown',
          JSON.stringify({ endpoint: req.originalUrl, method: req.method })
        ]
      );

      return res.status(403).json({ 
        error: 'Insufficient permissions. HR or Finance role required for payroll access.' 
      });
    }

    req.userRoles = rows.map(r => r.role);
    next();
  } catch (error) {
    console.error('Payroll auth middleware error:', error);
    res.status(500).json({ error: 'Authorization check failed.' });
  }
}

/**
 * Helper function to check if user has specific role
 */
async function hasRole(userId, orgId, allowedRoles) {
  const { rows } = await db.query(
    `SELECT role FROM team_members WHERE user_id = $1 AND org_id = $2`,
    [userId, orgId]
  );

  return rows.some(r => allowedRoles.includes(r.role));
}

/**
 * Log HR action to audit log
 */
async function logHrAction(userId, orgId, action, resourceType, resourceId, req, status = 'success', meta = {}) {
  try {
    await db.query(
      `INSERT INTO audit_log (user_id, org_id, action, resource_type, resource_id, ip_address, user_agent, status, meta)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        orgId,
        action,
        resourceType,
        resourceId,
        req.ip || req.connection?.remoteAddress || 'unknown',
        req.get('user-agent') || 'unknown',
        status,
        JSON.stringify(meta)
      ]
    );
  } catch (error) {
    console.error('Failed to log HR action:', error);
    // Don't throw - logging failure shouldn't break the request
  }
}

module.exports = {
  requireHrAccess,
  requireSensitiveDataAccess,
  requirePayrollAccess,
  hasRole,
  logHrAction,
};
