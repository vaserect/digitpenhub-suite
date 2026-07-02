const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');
const db = require('../db');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signSessionToken, signMfaToken, verifyMfaToken, SEVEN_DAYS_SECONDS } = require('../utils/jwt');
const { generateSecret, otpauthUri, verifyTotp, generateBackupCodes } = require('../utils/totp');
const { sendMail } = require('../utils/mailer');
const { COOKIE_NAME } = require('../middleware/auth');

const AVATARS_DIR = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(AVATARS_DIR)) fs.mkdirSync(AVATARS_DIR, { recursive: true });

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: SEVEN_DAYS_SECONDS * 1000,
  path: '/',
};

async function auditLog(userId, action, ip, meta = null) {
  try {
    await db.query(
      `INSERT INTO audit_log (user_id, action, ip_address, meta) VALUES ($1,$2,$3,$4)`,
      [userId, action, ip, meta ? JSON.stringify(meta) : null]
    );
  } catch { /* silent */ }
}

async function createSession(res, userId, req) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SEVEN_DAYS_SECONDS * 1000);
  await db.query(
    `INSERT INTO sessions (id, user_id, user_agent, ip_address, expires_at) VALUES ($1,$2,$3,$4,$5)`,
    [sessionId, userId, req.headers['user-agent'] || null, req.ip, expiresAt]
  );
  const token = signSessionToken({ userId, sessionId });
  res.cookie(COOKIE_NAME, token, cookieOptions);
  return sessionId;
}

// ── Login ────────────────────────────────────────────────────────────────────

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = rows[0];

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  // 2FA gate
  if (user.totp_enabled) {
    const mfaToken = signMfaToken(user.id);
    return res.json({ requiresMfa: true, mfaToken });
  }

  await createSession(res, user.id, req);
  await auditLog(user.id, 'login', req.ip);
  res.json({ user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role } });
}

// POST /auth/register — public self-serve sign-up: creates a new organization,
// its owner user, and a free-tier subscription in one transaction, then signs
// the user straight in. No admin approval gate — this is the platform's own
// free-trial sign-up, distinct from the org-internal team-invite flow in
// teamController.js (which adds a member to an *existing* org).
async function register(req, res) {
  const { orgName, fullName, email, password } = req.body || {};
  if (!orgName || !orgName.trim() || !fullName || !fullName.trim() || !email || !password) {
    return res.status(400).json({ error: 'Organization name, your name, email, and password are required.' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const { rows: existing } = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing.length) {
    return res.status(409).json({ error: 'An account with this email already exists. Try signing in instead.' });
  }

  const passwordHash = await hashPassword(password);

  // Uses a single dedicated client (not bare pool.query BEGIN/COMMIT) so every
  // statement in this transaction is guaranteed to run on the same physical
  // connection — pool.query() alone may hand different statements to different
  // pooled connections, silently breaking atomicity.
  const client = await db.connect();
  let user;
  try {
    await client.query('BEGIN');
    const { rows: orgRows } = await client.query(
      `INSERT INTO organizations (name) VALUES ($1) RETURNING id`,
      [orgName.trim().slice(0, 200)]
    );
    const orgId = orgRows[0].id;

    const { rows: userRows } = await client.query(
      `INSERT INTO users (org_id, full_name, email, password_hash, role)
       VALUES ($1,$2,$3,$4,'owner') RETURNING id, full_name, email, role`,
      [orgId, fullName.trim().slice(0, 200), normalizedEmail, passwordHash]
    );
    user = userRows[0];

    // A DB trigger (trg_org_subscription / auto_create_subscription()) already
    // creates a free-plan subscription row for every new organization — no
    // need to insert one here too.
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists. Try signing in instead.' });
    }
    throw err;
  } finally {
    client.release();
  }

  await createSession(res, user.id, req);
  await auditLog(user.id, 'signup', req.ip);
  res.status(201).json({ user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role } });
}

// POST /auth/verify-mfa  — second step when 2FA is enabled
async function verifyMfa(req, res) {
  const { mfaToken, code, backupCode } = req.body || {};
  if (!mfaToken) return res.status(400).json({ error: 'mfaToken is required.' });

  let payload;
  try { payload = verifyMfaToken(mfaToken); } catch {
    return res.status(401).json({ error: 'MFA session expired. Please sign in again.' });
  }

  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [payload.sub]);
  const user = rows[0];
  if (!user || !user.totp_enabled) return res.status(401).json({ error: 'MFA not configured.' });

  if (backupCode) {
    const storedCodes = Array.isArray(user.totp_backup_codes) ? user.totp_backup_codes : [];
    const normalized = String(backupCode).toUpperCase().trim();
    const remaining = storedCodes.filter((c) => c !== normalized);
    if (remaining.length === storedCodes.length) {
      return res.status(401).json({ error: 'Invalid backup code.' });
    }
    // Consume the backup code
    await db.query('UPDATE users SET totp_backup_codes = $1 WHERE id = $2', [JSON.stringify(remaining), user.id]);
  } else {
    if (!code || !verifyTotp(user.totp_secret, code)) {
      return res.status(401).json({ error: 'Invalid or expired code.' });
    }
  }

  await createSession(res, user.id, req);
  await auditLog(user.id, backupCode ? 'login_backup_code' : 'login_mfa', req.ip);
  res.json({ user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role } });
}

// ── Auth helpers ─────────────────────────────────────────────────────────────

async function logout(req, res) {
  if (req.sessionId) {
    await db.query(`UPDATE sessions SET revoked_at = now() WHERE id = $1`, [req.sessionId]);
    await auditLog(req.user.id, 'logout', req.ip);
  }
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
}

async function me(req, res) {
  res.json({ user: req.user });
}

// POST /auth/change-password — requires current password, applies immediately,
// revokes every other session so a stolen session can't outlive the change.
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const user = rows[0];
  if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const newHash = await hashPassword(newPassword);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);
  await db.query(
    `UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND id != $2 AND revoked_at IS NULL`,
    [req.user.id, req.sessionId]
  );
  await auditLog(req.user.id, 'password_changed', req.ip);
  res.json({ ok: true });
}

// POST /auth/forgot-password — always responds the same way whether or not the
// email exists, so this endpoint can't be used to enumerate accounts. Emails a
// one-hour reset link via the existing transactional mailer.
async function forgotPassword(req, res) {
  const { email } = req.body || {};
  const generic = { ok: true, message: 'If an account exists for that email, a reset link has been sent.' };
  if (!email) return res.json(generic);

  const normalized = email.trim().toLowerCase();
  const { rows } = await db.query('SELECT id, full_name FROM users WHERE email = $1', [normalized]);
  if (!rows.length) return res.json(generic);
  const user = rows[0];

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`,
    [user.id, tokenHash, expiresAt]
  );

  const resetUrl = `${process.env.FRONTEND_ORIGIN}/reset-password/${rawToken}`;
  await sendMail({
    to: normalized,
    subject: 'Reset your Digitpen Hub password',
    html: `<p>Hi ${user.full_name || 'there'},</p><p>Click the link below to reset your password. This link expires in 1 hour and can only be used once.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
  });
  await auditLog(user.id, 'password_reset_requested', req.ip);

  res.json(generic);
}

// POST /auth/reset-password — consumes a one-time token from forgot-password.
async function resetPassword(req, res) {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ error: 'token and newPassword are required.' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const { rows } = await db.query(
    `SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL`,
    [tokenHash]
  );
  const record = rows[0];
  if (!record || new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired. Request a new one.' });
  }

  const newHash = await hashPassword(newPassword);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, record.user_id]);
  await db.query('UPDATE password_reset_tokens SET used_at = now() WHERE id = $1', [record.id]);
  await db.query(`UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [record.user_id]);
  await auditLog(record.user_id, 'password_reset_completed', req.ip);

  res.json({ ok: true });
}

// PATCH /auth/me — self-serve display name update. No password gate: this is a
// low-sensitivity, easily-reversible field, unlike email/password.
async function updateProfile(req, res) {
  const { fullName } = req.body || {};
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: 'fullName is required.' });
  }
  const trimmed = fullName.trim().slice(0, 200);
  await db.query('UPDATE users SET full_name = $1 WHERE id = $2', [trimmed, req.user.id]);
  await auditLog(req.user.id, 'profile_updated', req.ip, { fullName: trimmed });
  res.json({ user: { ...req.user, fullName: trimmed } });
}

// PATCH /auth/me/email — requires current password (same bar as a password
// change) since email doubles as the login identifier; also revokes every
// other session so a stolen session can't quietly redirect account recovery.
async function updateEmail(req, res) {
  const { newEmail, currentPassword } = req.body || {};
  if (!newEmail || !currentPassword) {
    return res.status(400).json({ error: 'newEmail and currentPassword are required.' });
  }
  const normalized = newEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const user = rows[0];
  if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const { rows: taken } = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [normalized, req.user.id]);
  if (taken.length) {
    return res.status(409).json({ error: 'That email is already in use.' });
  }

  await db.query('UPDATE users SET email = $1 WHERE id = $2', [normalized, req.user.id]);
  await db.query(
    `UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND id != $2 AND revoked_at IS NULL`,
    [req.user.id, req.sessionId]
  );
  await auditLog(req.user.id, 'email_changed', req.ip, { from: req.user.email, to: normalized });
  res.json({ user: { ...req.user, email: normalized } });
}

// POST /auth/me/avatar — multipart image upload (see routes/auth.js for the
// multer config). Deletes the previous avatar file on disk, if any, so
// storage doesn't grow unbounded across repeated changes.
async function uploadAvatar(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const { rows } = await db.query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
  const previous = rows[0]?.avatar_url;

  await db.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [req.file.filename, req.user.id]);

  if (previous) {
    const oldPath = path.join(AVATARS_DIR, previous);
    fs.unlink(oldPath, () => {});
  }

  await auditLog(req.user.id, 'avatar_updated', req.ip);
  res.json({ user: { ...req.user, avatarUrl: req.file.filename } });
}

// GET /auth/avatar/:filename — serves an uploaded avatar image inline.
// Filenames are server-generated (random, not guessable) and avatars carry no
// sensitive data, so any signed-in user may view one (e.g. a teammate's).
async function getAvatar(req, res) {
  const filename = path.basename(req.params.filename);
  const full = path.join(AVATARS_DIR, filename);
  if (!fs.existsSync(full)) return res.status(404).json({ error: 'Not found.' });
  res.sendFile(full);
}

// ── 2FA management ───────────────────────────────────────────────────────────

// GET /auth/2fa/setup  — generate secret + QR code (pending confirmation)
async function setup2fa(req, res) {
  const { rows } = await db.query('SELECT email, totp_enabled FROM users WHERE id = $1', [req.user.id]);
  const user = rows[0];
  if (user.totp_enabled) return res.status(400).json({ error: '2FA is already enabled.' });

  const secret = generateSecret();
  const uri = otpauthUri(secret, user.email);
  const qr = await qrcode.toDataURL(uri);

  // Store secret temporarily (not enabled yet — confirm2fa finalizes it)
  await db.query('UPDATE users SET totp_secret = $1 WHERE id = $2', [secret, req.user.id]);

  res.json({ secret, qrDataUri: qr });
}

// POST /auth/2fa/confirm  — verify TOTP code and enable 2FA
async function confirm2fa(req, res) {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'code is required.' });

  const { rows } = await db.query('SELECT totp_secret, totp_enabled FROM users WHERE id = $1', [req.user.id]);
  const user = rows[0];
  if (user.totp_enabled) return res.status(400).json({ error: '2FA is already enabled.' });
  if (!user.totp_secret) return res.status(400).json({ error: 'Run setup first.' });

  if (!verifyTotp(user.totp_secret, code)) {
    return res.status(400).json({ error: 'Invalid code. Make sure your device clock is correct.' });
  }

  const codes = generateBackupCodes();
  await db.query(
    'UPDATE users SET totp_enabled = true, totp_backup_codes = $1 WHERE id = $2',
    [JSON.stringify(codes), req.user.id]
  );
  await auditLog(req.user.id, '2fa_enabled', req.ip);
  res.json({ ok: true, backupCodes: codes });
}

// POST /auth/2fa/disable  — verify TOTP code and disable 2FA
async function disable2fa(req, res) {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'code is required.' });

  const { rows } = await db.query('SELECT totp_secret, totp_enabled FROM users WHERE id = $1', [req.user.id]);
  const user = rows[0];
  if (!user.totp_enabled) return res.status(400).json({ error: '2FA is not enabled.' });

  if (!verifyTotp(user.totp_secret, code)) {
    return res.status(400).json({ error: 'Invalid code.' });
  }

  await db.query(
    "UPDATE users SET totp_enabled = false, totp_secret = NULL, totp_backup_codes = '[]' WHERE id = $1",
    [req.user.id]
  );
  await auditLog(req.user.id, '2fa_disabled', req.ip);
  res.json({ ok: true });
}

// POST /auth/2fa/regenerate-backup — regenerate backup codes (requires TOTP)
async function regenerateBackup(req, res) {
  const { code } = req.body || {};
  const { rows } = await db.query('SELECT totp_secret, totp_enabled FROM users WHERE id = $1', [req.user.id]);
  const user = rows[0];
  if (!user.totp_enabled) return res.status(400).json({ error: '2FA is not enabled.' });
  if (!code || !verifyTotp(user.totp_secret, code)) return res.status(400).json({ error: 'Invalid code.' });

  const codes = generateBackupCodes();
  await db.query('UPDATE users SET totp_backup_codes = $1 WHERE id = $2', [JSON.stringify(codes), req.user.id]);
  res.json({ ok: true, backupCodes: codes });
}

// ── Session management ───────────────────────────────────────────────────────

async function listSessions(req, res) {
  const { rows } = await db.query(
    `SELECT id, user_agent, ip_address, created_at, expires_at,
            id = $2 AS is_current
     FROM sessions
     WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC`,
    [req.user.id, req.sessionId]
  );
  res.json({ sessions: rows });
}

async function revokeSession(req, res) {
  const { id } = req.params;
  if (id === req.sessionId) return res.status(400).json({ error: 'Cannot revoke your own current session. Sign out instead.' });
  await db.query(
    `UPDATE sessions SET revoked_at = now() WHERE id = $1 AND user_id = $2`,
    [id, req.user.id]
  );
  await auditLog(req.user.id, 'session_revoked', req.ip, { sessionId: id });
  res.json({ ok: true });
}

async function revokeAllOtherSessions(req, res) {
  await db.query(
    `UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND id != $2 AND revoked_at IS NULL`,
    [req.user.id, req.sessionId]
  );
  await auditLog(req.user.id, 'sessions_revoked_all', req.ip);
  res.json({ ok: true });
}

// ── Audit log ────────────────────────────────────────────────────────────────

async function getAuditLog(req, res) {
  const { rows } = await db.query(
    `SELECT id, action, ip_address, meta, created_at FROM audit_log
     WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.user.id]
  );
  res.json({ log: rows });
}

module.exports = {
  register, login, verifyMfa, logout, me, changePassword,
  forgotPassword, resetPassword,
  updateProfile, updateEmail, uploadAvatar, getAvatar,
  setup2fa, confirm2fa, disable2fa, regenerateBackup,
  listSessions, revokeSession, revokeAllOtherSessions,
  getAuditLog,
};
