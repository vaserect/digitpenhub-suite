const crypto = require('crypto');
const db = require('../db');
const { hashPassword } = require('../utils/password');
const { notify } = require('../utils/notify');
const { sendMail } = require('../utils/mailer');

// GET /api/v1/team/members
async function listMembers(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT id, full_name, email, role, created_at
       FROM users WHERE org_id = $1 ORDER BY created_at ASC`,
      [req.user.orgId]
    );
    res.json({ members: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load members.' });
  }
}

// PATCH /api/v1/team/members/:id/role
async function updateRole(req, res) {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    // Cannot change owner role
    const { rows: target } = await db.query(
      'SELECT role FROM users WHERE id=$1 AND org_id=$2',
      [req.params.id, req.user.orgId]
    );
    if (!target[0]) return res.status(404).json({ error: 'Member not found.' });
    if (target[0].role === 'owner') {
      return res.status(403).json({ error: 'Cannot change the owner role.' });
    }
    await db.query(
      'UPDATE users SET role=$1 WHERE id=$2 AND org_id=$3',
      [role, req.params.id, req.user.orgId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update role.' });
  }
}

// DELETE /api/v1/team/members/:id
async function removeMember(req, res) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot remove yourself.' });
    }
    const { rows: target } = await db.query(
      'SELECT role FROM users WHERE id=$1 AND org_id=$2',
      [req.params.id, req.user.orgId]
    );
    if (!target[0]) return res.status(404).json({ error: 'Member not found.' });
    if (target[0].role === 'owner') {
      return res.status(403).json({ error: 'Cannot remove the owner.' });
    }
    await db.query('DELETE FROM users WHERE id=$1 AND org_id=$2', [req.params.id, req.user.orgId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not remove member.' });
  }
}

// POST /api/v1/team/invitations
async function inviteMember(req, res) {
  try {
    const { email, role = 'member' } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    const validRoles = ['admin', 'member'];
    if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role.' });

    // Check not already a member
    const { rows: existing } = await db.query(
      'SELECT id FROM users WHERE email=$1 AND org_id=$2',
      [email.toLowerCase(), req.user.orgId]
    );
    if (existing[0]) return res.status(409).json({ error: 'This person is already a member.' });

    // Upsert invitation (cancel old pending one if exists)
    await db.query(
      `UPDATE invitations SET status='expired' WHERE org_id=$1 AND email=$2 AND status='pending'`,
      [req.user.orgId, email.toLowerCase()]
    );

    const token = crypto.randomBytes(32).toString('hex');
    await db.query(
      `INSERT INTO invitations (org_id, email, role, token, invited_by)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.user.orgId, email.toLowerCase(), role, token, req.user.id]
    );

    const inviteLink = `${process.env.FRONTEND_ORIGIN}/invite/${token}`;

    const { rows: orgRows } = await db.query('SELECT name FROM organizations WHERE id=$1', [req.user.orgId]);
    const orgName = orgRows[0]?.name || 'DigitPen Hub';
    const mailResult = await sendMail({
      to: email,
      subject: `${req.user.fullName} invited you to join ${orgName} on DigitPen Hub`,
      html: `<p>${req.user.fullName} has invited you to join <strong>${orgName}</strong> on DigitPen Hub as a${role === 'admin' ? 'n' : ''} ${role}.</p>
<p><a href="${inviteLink}">Accept invitation</a></p>
<p style="color:#888;font-size:12px;">This link expires in 7 days. If you weren't expecting this, you can ignore this email.</p>`,
    });

    // Email delivery failure never blocks the invite — the link is still valid and returned
    // to the frontend for manual copy/paste/resend, same as before this email path existed.
    res.json({ ok: true, inviteLink, emailSent: mailResult.ok });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not send invitation.' });
  }
}

// GET /api/v1/team/invitations
async function listInvitations(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT i.id, i.email, i.role, i.status, i.created_at, i.expires_at,
              u.full_name as invited_by_name
       FROM invitations i JOIN users u ON u.id = i.invited_by
       WHERE i.org_id=$1 AND i.status='pending'
       ORDER BY i.created_at DESC`,
      [req.user.orgId]
    );
    res.json({ invitations: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load invitations.' });
  }
}

// DELETE /api/v1/team/invitations/:id
async function cancelInvitation(req, res) {
  try {
    await db.query(
      `UPDATE invitations SET status='expired' WHERE id=$1 AND org_id=$2`,
      [req.params.id, req.user.orgId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not cancel invitation.' });
  }
}

// GET /api/v1/team/invite/:token  (public — no auth required)
async function getInvitation(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT i.email, i.role, i.expires_at, o.name as org_name
       FROM invitations i JOIN organizations o ON o.id = i.org_id
       WHERE i.token=$1 AND i.status='pending'`,
      [req.params.token]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Invitation not found or expired.' });
    if (new Date(rows[0].expires_at) < new Date()) {
      return res.status(410).json({ error: 'This invitation has expired.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load invitation.' });
  }
}

// POST /api/v1/team/invite/:token/accept  (public — no auth required)
async function acceptInvitation(req, res) {
  try {
    const { fullName, password } = req.body;
    if (!fullName || !password) {
      return res.status(400).json({ error: 'Name and password are required.' });
    }
    const { rows } = await db.query(
      `SELECT * FROM invitations WHERE token=$1 AND status='pending'`,
      [req.params.token]
    );
    const inv = rows[0];
    if (!inv) return res.status(404).json({ error: 'Invitation not found or already used.' });
    if (new Date(inv.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This invitation has expired.' });
    }

    const passwordHash = await hashPassword(password);
    await db.query(
      `INSERT INTO users (org_id, full_name, email, password_hash, role)
       VALUES ($1,$2,$3,$4,$5)`,
      [inv.org_id, fullName, inv.email, passwordHash, inv.role]
    );
    await db.query(
      `UPDATE invitations SET status='accepted' WHERE id=$1`,
      [inv.id]
    );

    notify(inv.org_id, {
      type: 'team_joined',
      title: 'New team member joined',
      body: `${fullName} has joined the workspace.`,
      email: true,
    });

    res.json({ ok: true, message: 'Account created. You can now sign in.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Could not accept invitation.' });
  }
}

// PATCH /api/v1/team/profile
async function updateProfile(req, res) {
  try {
    const { fullName, currentPassword, newPassword } = req.body;
    if (fullName) {
      await db.query('UPDATE users SET full_name=$1 WHERE id=$2', [fullName, req.user.id]);
    }
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required.' });
      const { rows } = await db.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
      const { comparePassword } = require('../utils/password');
      const ok = await comparePassword(currentPassword, rows[0].password_hash);
      if (!ok) return res.status(401).json({ error: 'Current password is incorrect.' });
      const hash = await hashPassword(newPassword);
      await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update profile.' });
  }
}

// GET /api/v1/team/org
async function getOrg(req, res) {
  try {
    const { rows } = await db.query('SELECT id, name, created_at FROM organizations WHERE id=$1', [req.user.orgId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not load organization.' });
  }
}

// PATCH /api/v1/team/org
async function updateOrg(req, res) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });
    await db.query('UPDATE organizations SET name=$1 WHERE id=$2', [name, req.user.orgId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not update organization.' });
  }
}

module.exports = {
  listMembers, updateRole, removeMember,
  inviteMember, listInvitations, cancelInvitation,
  getInvitation, acceptInvitation,
  updateProfile, getOrg, updateOrg
};
