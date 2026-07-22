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
      `SELECT role FROM users WHERE id = $1 AND org_id = $2`,
      [req.user.id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(403).json({ error: 'No team membership found.' });
    }

    const role = rows[0].role;
    const hasAccess = ['owner', 'admin', 'hr'].includes(role);

    if (!hasAccess) {
      // Log unauthorized access attempt
      await db.query(
        `INSERT INTO audit_log (user_id, action, meta, ip_address) VALUES ($1, 'hr.access.denied', $2, $3)`,
        [
          req.user.id,
          JSON.stringify({ orgId: req.user.orgId, resourceType: 'hr', endpoint: req.originalUrl, method: req.method, userAgent: req.get('user-agent') || 'unknown', status: 'denied' }),
          req.ip || req.connection?.remoteAddress || 'unknown',
        ]
      );

      return res.status(403).json({ 
        error: 'Insufficient permissions. HR access required.' 
      });
    }

    // Store role info for later use
    req.userRoles = [role];
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
      `SELECT role FROM users WHERE id = $1 AND org_id = $2`,
      [req.user.id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(403).json({ error: 'No team membership found.' });
    }

    const role = rows[0].role;
    const hasAccess = ['owner', 'admin', 'hr'].includes(role);

    if (!hasAccess) {
      // Log unauthorized access attempt
      await db.query(
        `INSERT INTO audit_log (user_id, action, meta, ip_address) VALUES ($1, 'hr.salary.access.denied', $2, $3)`,
        [
          req.user.id,
          JSON.stringify({ orgId: req.user.orgId, resourceType: 'employee', endpoint: req.originalUrl, method: req.method, userAgent: req.get('user-agent') || 'unknown', status: 'denied' }),
          req.ip || req.connection?.remoteAddress || 'unknown',
        ]
      );

      return res.status(403).json({ 
        error: 'Insufficient permissions. HR role required to view sensitive data.' 
      });
    }

    req.userRoles = [role];
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
      `SELECT role FROM users WHERE id = $1 AND org_id = $2`,
      [req.user.id, req.user.orgId]
    );

    if (!rows.length) {
      return res.status(403).json({ error: 'No team membership found.' });
    }

    const role = rows[0].role;
    const hasAccess = ['owner', 'admin', 'hr', 'finance'].includes(role);

    if (!hasAccess) {
      // Log unauthorized access attempt
      await db.query(
        `INSERT INTO audit_log (user_id, action, meta, ip_address) VALUES ($1, 'hr.payroll.access.denied', $2, $3)`,
        [
          req.user.id,
          JSON.stringify({ orgId: req.user.orgId, resourceType: 'payroll', endpoint: req.originalUrl, method: req.method, userAgent: req.get('user-agent') || 'unknown', status: 'denied' }),
          req.ip || req.connection?.remoteAddress || 'unknown',
        ]
      );

      return res.status(403).json({ 
        error: 'Insufficient permissions. HR or Finance role required for payroll access.' 
      });
    }

    req.userRoles = [role];
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
    `SELECT role FROM users WHERE id = $1 AND org_id = $2`,
    [userId, orgId]
  );

  return rows.length > 0 && allowedRoles.includes(rows[0].role);
}

/**
 * Log HR action to audit log
 */
async function logHrAction(userId, orgId, action, resourceType, resourceId, req, status = 'success', meta = {}) {
  try {
    await db.query(
      `INSERT INTO audit_log (user_id, action, meta, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        userId,
        action,
        JSON.stringify({ ...meta, orgId, resourceType, resourceId, status, userAgent: req?.get?.('user-agent') || 'unknown' }),
        req?.ip || req?.connection?.remoteAddress || 'unknown',
      ]
    );
  } catch (error) {
    console.error('Failed to log HR action:', error);
  }
}

module.exports = {
  requireHrAccess,
  requireSensitiveDataAccess,
  requirePayrollAccess,
  hasRole,
  logHrAction,
};
