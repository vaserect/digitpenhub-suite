const db = require('../db');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not signed in.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do this.' });
    }
    next();
  };
}

function checkPermission(resource, action) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not signed in.' });
    
    // Owners and Admins have full access bypass
    if (req.user.role === 'owner' || req.user.role === 'admin') {
      return next();
    }
    
    try {
      const roleId = req.user.roleId;
      
      const { rows } = await db.query(
        `SELECT scope FROM role_permissions WHERE role_id = $1 AND module_slug = $2`,
        [roleId, resource]
      );
      
      if (rows.length === 0) {
        return res.status(403).json({ error: 'You do not have permission to access this resource.' });
      }
      
      const hasAccess = rows.some(row => {
        if (action === 'read') {
          return row.scope === 'view' || row.scope === 'manage';
        }
        if (['create', 'update', 'delete'].includes(action)) {
          return row.scope === 'manage';
        }
        return false;
      });
      
      if (!hasAccess) {
        return res.status(403).json({ error: `You do not have permission to ${action} this resource.` });
      }
      
      next();
    } catch (err) {
      console.error('RBAC checkPermission error:', err);
      res.status(500).json({ error: 'Internal server error during permission verification.' });
    }
  };
}

module.exports = { requireRole, checkPermission };
