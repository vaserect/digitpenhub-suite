const { requireAuth } = require('./auth');

function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user.isSuperAdmin) return res.status(403).json({ error: 'Forbidden.' });
    next();
  });
}

// Scoped admin gate — a content editor can reach content-management routes
// without also getting org/user/billing access, which stays behind
// requireSuperAdmin alone.
function requireAnyAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user.isSuperAdmin && !req.user.isContentAdmin) return res.status(403).json({ error: 'Forbidden.' });
    next();
  });
}

module.exports = { requireSuperAdmin, requireAnyAdmin };
