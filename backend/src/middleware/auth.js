const db = require('../db');
const { verifySessionToken } = require('../utils/jwt');

const COOKIE_NAME = 'dph_session';

// Verifies the JWT *and* checks the matching session row hasn't been revoked or expired.
// This is what makes "log out" and future "log out everywhere" actually work, instead of
// the token just being trusted blindly until it naturally expires.
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Not signed in.' });

    const payload = verifySessionToken(token);

    const { rows } = await db.query(
      `SELECT s.id, s.revoked_at, s.expires_at,
              u.id AS user_id, u.full_name, u.email, u.role, u.role_id, u.org_id, u.is_super_admin, u.is_content_admin, u.totp_enabled, u.avatar_url,
              o.is_suspended
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN organizations o ON o.id = u.org_id
       WHERE s.id = $1 AND u.id = $2`,
      [payload.jti, payload.sub]
    );

    const session = rows[0];
    if (!session || session.revoked_at || new Date(session.expires_at) < new Date()) {
      res.clearCookie(COOKIE_NAME);
      return res.status(401).json({ error: 'Session expired or signed out.' });
    }

    if (session.is_suspended) {
      return res.status(403).json({ error: 'Your organization has been suspended. Please contact support.' });
    }

    req.user = {
      id: session.user_id,
      fullName: session.full_name,
      email: session.email,
      role: session.role,
      roleId: session.role_id,
      orgId: session.org_id,
      isSuperAdmin: session.is_super_admin,
      isContentAdmin: session.is_content_admin,
      totpEnabled: session.totp_enabled,
      avatarUrl: session.avatar_url,
    };
    req.sessionId = session.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not signed in.' });
  }
}

module.exports = { requireAuth, COOKIE_NAME };
