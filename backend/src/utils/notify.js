const db = require('../db');
const { sendMail } = require('./mailer');

// Fire-and-forget — inserts a notification for every owner/admin in the org,
// or for a specific user if userId is provided. Pass `email: true` for
// high-value types (payment received, new lead, etc.) to also send a real
// email alongside the in-app notification — in-app alone is easy to miss if
// the user isn't actively in the app when it matters.
async function notify(orgId, { type, title, body = '', link = null, userId = null, email = false }) {
  try {
    const { rows: recipients } = userId
      ? await db.query(`SELECT id, email, full_name FROM users WHERE id = $1`, [userId])
      : await db.query(
          `SELECT id, email, full_name FROM users WHERE org_id = $1 AND role IN ('owner','admin')`,
          [orgId]
        );

    for (const u of recipients) {
      await db.query(
        `INSERT INTO notifications (org_id, user_id, type, title, body, link) VALUES ($1,$2,$3,$4,$5,$6)`,
        [orgId, u.id, type, title, body, link]
      );
    }

    if (email) {
      const url = link ? `${process.env.FRONTEND_ORIGIN}${link}` : null;
      for (const u of recipients) {
        const result = await sendMail({
          to: u.email,
          subject: title,
          html: `<p>Hi ${u.full_name || 'there'},</p><p>${body || title}</p>${url ? `<p><a href="${url}">View details</a></p>` : ''}`,
        });
        if (!result.ok) console.error('notify() email fallback failed:', { orgId, type, to: u.email, error: result.error });
      }
    }
  } catch (err) {
    // Never let a broken notification take down the calling request — but log it,
    // since a fully-silent catch here made every notification failure invisible.
    console.error('notify() failed:', { orgId, type, userId, error: err.message });
  }
}

module.exports = { notify };
