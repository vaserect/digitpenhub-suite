const nodemailer = require('nodemailer');
const db = require('../db');
const { validateEmail, normalizeEmail } = require('../utils/emailValidator');

// Sendmail transport — uses the server's local Postfix (with DKIM via opendkim)
function makeTransport() {
  return nodemailer.createTransport({ sendmail: true, path: '/usr/sbin/sendmail', newline: 'unix' });
}

// ── Lists ──────────────────────────────────────────────────────────────────

async function listLists(req, res) {
  const { rows } = await db.query(
    `SELECT l.id, l.name, l.description, l.created_at,
            COUNT(s.id) FILTER (WHERE s.status = 'subscribed') AS subscriber_count
     FROM email_lists l
     LEFT JOIN email_subscribers s ON s.list_id = l.id
     WHERE l.org_id = $1
     GROUP BY l.id
     ORDER BY l.created_at DESC`,
    [req.user.orgId]
  );
  res.json({ lists: rows });
}

async function createList(req, res) {
  const { name, description } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'name is required.' });

  const { rows } = await db.query(
    `INSERT INTO email_lists (org_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING id, name, description, created_at`,
    [req.user.orgId, String(name).trim(), description || null]
  );
  res.status(201).json({ list: rows[0] });
}

async function updateList(req, res) {
  const { id } = req.params;
  const { name, description } = req.body || {};

  const { rows } = await db.query(
    `UPDATE email_lists
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         updated_at = now()
     WHERE id = $3 AND org_id = $4
     RETURNING id, name, description, created_at`,
    [name || null, description !== undefined ? description : null, id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'List not found.' });
  res.json({ list: rows[0] });
}

async function deleteList(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `DELETE FROM email_lists WHERE id = $1 AND org_id = $2 RETURNING id`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'List not found.' });
  res.json({ ok: true });
}

// ── Subscribers ────────────────────────────────────────────────────────────

async function listSubscribers(req, res) {
  const { listId } = req.params;

  const listCheck = await db.query(
    `SELECT id FROM email_lists WHERE id = $1 AND org_id = $2`,
    [listId, req.user.orgId]
  );
  if (!listCheck.rows.length) return res.status(404).json({ error: 'List not found.' });

  const { rows } = await db.query(
    `SELECT id, email, name, status, subscribed_at
     FROM email_subscribers
     WHERE list_id = $1
     ORDER BY subscribed_at DESC`,
    [listId]
  );
  res.json({ subscribers: rows });
}

async function addSubscriber(req, res) {
  const { listId } = req.params;
  const { email, name, skipConfirmation } = req.body || {};

  const listCheck = await db.query(
    `SELECT id FROM email_lists WHERE id = $1 AND org_id = $2`,
    [listId, req.user.orgId]
  );
  if (!listCheck.rows.length) return res.status(404).json({ error: 'List not found.' });

  if (!email || !String(email).trim()) {
    return res.status(400).json({ error: 'email is required.' });
  }

  const normalizedEmail = normalizeEmail(email);
  
  // CRITICAL FIX: Validate email to prevent invalid/disposable addresses
  const validation = await validateEmail(normalizedEmail);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  // CRITICAL FIX: Implement double opt-in for GDPR compliance (unless explicitly skipped for imports)
  if (!skipConfirmation) {
    const crypto = require('crypto');
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    
    const { rows } = await db.query(
      `INSERT INTO email_subscribers (list_id, org_id, email, name, status, confirmation_token)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       ON CONFLICT (list_id, email) DO UPDATE
         SET status = 'pending', 
             confirmation_token = EXCLUDED.confirmation_token,
             name = EXCLUDED.name
       RETURNING id, email, confirmation_token`,
      [listId, req.user.orgId, normalizedEmail, name || null, confirmationToken]
    );
    
    // Send confirmation email
    const confirmUrl = `${process.env.FRONTEND_ORIGIN || 'https://suite.digitpenhub.com'}/confirm-subscription/${confirmationToken}`;
    const { sendMail } = require('../utils/mailer');
    
    try {
      await sendMail({
        to: normalizedEmail,
        subject: 'Confirm your subscription',
        html: `<p>Please confirm your subscription by clicking the link below:</p>
<p><a href="${confirmUrl}" style="display:inline-block;padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:4px;">Confirm Subscription</a></p>
<p style="font-size:12px;color:#888;">This link expires in 24 hours. If you didn't request this, please ignore this email.</p>`,
      });
    } catch (err) {
      console.error('Failed to send confirmation email:', err);
      return res.status(500).json({ error: 'Failed to send confirmation email.' });
    }
    
    return res.status(201).json({ 
      subscriber: { id: rows[0].id, email: rows[0].email, status: 'pending' },
      message: 'Confirmation email sent. Please check your inbox.' 
    });
  }

  // Direct subscription (for imports or admin adds)
  const { rows } = await db.query(
    `INSERT INTO email_subscribers (list_id, org_id, email, name, status, confirmed_at)
     VALUES ($1, $2, $3, $4, 'subscribed', now())
     ON CONFLICT (list_id, email) DO UPDATE
       SET status = 'subscribed', name = EXCLUDED.name, confirmed_at = now()
     RETURNING id, email, name, status, subscribed_at`,
    [listId, req.user.orgId, normalizedEmail, name || null]
  );
  res.status(201).json({ subscriber: rows[0] });
}

async function importSubscribers(req, res) {
  const { listId } = req.params;
  // body.csv: plain text, one email per line or "email,name" per line
  const { csv } = req.body || {};

  const listCheck = await db.query(
    `SELECT id FROM email_lists WHERE id = $1 AND org_id = $2`,
    [listId, req.user.orgId]
  );
  if (!listCheck.rows.length) return res.status(404).json({ error: 'List not found.' });

  if (!csv || !String(csv).trim()) return res.status(400).json({ error: 'csv is required.' });

  const lines = String(csv).split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  let imported = 0;

  for (const line of lines) {
    const [rawEmail, rawName] = line.split(',').map((s) => s.trim());
    const email = rawEmail ? rawEmail.toLowerCase() : '';
    if (!email || !email.includes('@')) continue;
    await db.query(
      `INSERT INTO email_subscribers (list_id, org_id, email, name, status)
       VALUES ($1, $2, $3, $4, 'subscribed')
       ON CONFLICT (list_id, email) DO UPDATE SET status = 'subscribed', name = EXCLUDED.name`,
      [listId, req.user.orgId, email, rawName || null]
    );
    imported++;
  }

  res.json({ imported });
}

async function removeSubscriber(req, res) {
  const { listId, id } = req.params;
  const { rows } = await db.query(
    `DELETE FROM email_subscribers WHERE id = $1 AND list_id = $2 AND org_id = $3 RETURNING id`,
    [id, listId, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Subscriber not found.' });
  res.json({ ok: true });
}

// Public unsubscribe endpoint — no auth required
async function unsubscribe(req, res) {
  const { id } = req.params;
  const { reason } = req.body || {};
  
  // CRITICAL FIX: Track unsubscribe events for compliance (CAN-SPAM Act)
  const { rows } = await db.query(
    `UPDATE email_subscribers 
     SET status = 'unsubscribed',
         unsubscribed_at = now(),
         unsubscribe_reason = $2
     WHERE id = $1
     RETURNING email, list_id`,
    [id, reason || null]
  );
  
  if (!rows.length) {
    return res.status(404).json({ error: 'Subscriber not found.' });
  }
  
  // Log unsubscribe event for audit trail
  await db.query(
    `INSERT INTO audit_log (user_id, action, ip_address, meta) 
     VALUES (null, 'email.unsubscribed', $1, $2)`,
    [req.ip, JSON.stringify({ subscriberId: id, email: rows[0].email, reason })]
  );
  
  res.json({ ok: true, message: 'You have been unsubscribed.' });
}

// ── Campaigns ──────────────────────────────────────────────────────────────

async function listCampaigns(req, res) {
  const { rows } = await db.query(
    `SELECT c.id, c.subject, c.preview_text, c.status, c.sent_at, c.opens, c.clicks,
            c.list_id, l.name AS list_name,
            (SELECT COUNT(*) FROM email_subscribers s
             WHERE s.list_id = c.list_id AND s.status = 'subscribed') AS recipient_count,
            c.created_at
     FROM email_campaigns c
     LEFT JOIN email_lists l ON l.id = c.list_id
     WHERE c.org_id = $1
     ORDER BY c.created_at DESC`,
    [req.user.orgId]
  );
  res.json({ campaigns: rows });
}

async function createCampaign(req, res) {
  const { listId, subject, previewText, bodyHtml } = req.body || {};
  if (!subject || !String(subject).trim()) return res.status(400).json({ error: 'subject is required.' });

  const { rows } = await db.query(
    `INSERT INTO email_campaigns (org_id, list_id, subject, preview_text, body_html)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, list_id, subject, preview_text, body_html, status, opens, clicks, created_at`,
    [req.user.orgId, listId || null, String(subject).trim(), previewText || null, bodyHtml || '']
  );
  res.status(201).json({ campaign: rows[0] });
}

async function getCampaign(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `SELECT c.id, c.subject, c.preview_text, c.body_html, c.status,
            c.sent_at, c.opens, c.clicks, c.list_id, l.name AS list_name, c.created_at
     FROM email_campaigns c
     LEFT JOIN email_lists l ON l.id = c.list_id
     WHERE c.id = $1 AND c.org_id = $2`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Campaign not found.' });
  res.json({ campaign: rows[0] });
}

async function updateCampaign(req, res) {
  const { id } = req.params;
  const { listId, subject, previewText, bodyHtml } = req.body || {};

  if (subject !== undefined && (!subject || !String(subject).trim())) {
    return res.status(400).json({ error: 'subject cannot be empty.' });
  }

  const existing = await db.query(
    `SELECT id, status FROM email_campaigns WHERE id = $1 AND org_id = $2`,
    [id, req.user.orgId]
  );
  if (!existing.rows.length) return res.status(404).json({ error: 'Campaign not found.' });
  if (existing.rows[0].status === 'sent') {
    return res.status(400).json({ error: 'Sent campaigns cannot be edited.' });
  }

  const { rows } = await db.query(
    `UPDATE email_campaigns
     SET list_id = COALESCE($1, list_id),
         subject = COALESCE($2, subject),
         preview_text = COALESCE($3, preview_text),
         body_html = COALESCE($4, body_html),
         updated_at = now()
     WHERE id = $5 AND org_id = $6
     RETURNING id, list_id, subject, preview_text, body_html, status, opens, clicks, created_at`,
    [listId || null, subject ? String(subject).trim() : null, previewText !== undefined ? (previewText || null) : null, bodyHtml !== undefined ? bodyHtml : null, id, req.user.orgId]
  );
  res.json({ campaign: rows[0] });
}

async function deleteCampaign(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `DELETE FROM email_campaigns WHERE id = $1 AND org_id = $2 RETURNING id`,
    [id, req.user.orgId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Campaign not found.' });
  res.json({ ok: true });
}

async function sendCampaign(req, res) {
  const { id } = req.params;

  const campaignResult = await db.query(
    `SELECT c.id, c.subject, c.preview_text, c.body_html, c.status, c.list_id,
            c.segment_id, c.ab_test_enabled, c.ab_test_subject_b, c.ab_test_body_b,
            c.ab_test_split_pct, c.ab_test_metric, c.ab_test_duration_hours,
            o.name AS org_name
     FROM email_campaigns c
     JOIN organizations o ON o.id = c.org_id
     WHERE c.id = $1 AND c.org_id = $2`,
    [id, req.user.orgId]
  );
  if (!campaignResult.rows.length) return res.status(404).json({ error: 'Campaign not found.' });

  const campaign = campaignResult.rows[0];
  if (campaign.status === 'sent') return res.status(400).json({ error: 'Campaign has already been sent.' });
  if (!campaign.list_id) return res.status(400).json({ error: 'Assign a subscriber list before sending.' });
  if (!campaign.body_html || !campaign.body_html.trim()) {
    return res.status(400).json({ error: 'Campaign body cannot be empty.' });
  }

  // Get subscribers from list or segment
  let subscribersResult;
  if (campaign.segment_id) {
    subscribersResult = await db.query(
      `SELECT s.id, s.email, s.name FROM email_subscribers s
       JOIN email_segment_members sm ON sm.subscriber_id = s.id
       WHERE sm.segment_id = $1 AND s.status = 'subscribed'`,
      [campaign.segment_id]
    );
  } else {
    subscribersResult = await db.query(
      `SELECT id, email, name FROM email_subscribers
       WHERE list_id = $1 AND status = 'subscribed'`,
      [campaign.list_id]
    );
  }

  const subscribers = subscribersResult.rows;
  if (!subscribers.length) return res.status(400).json({ error: 'No subscribed contacts in this list.' });

  // CRITICAL FIX: Check daily email quota to prevent abuse
  const { rows: dailyCount } = await db.query(
    `SELECT COALESCE(SUM(
      (SELECT COUNT(*) FROM email_subscribers 
       WHERE list_id = c.list_id AND status = 'subscribed')
    ), 0) AS emails_sent_today
     FROM email_campaigns c
     WHERE c.org_id = $1 
       AND c.sent_at >= CURRENT_DATE 
       AND c.status = 'sent'`,
    [req.user.orgId]
  );
  
  const emailsSentToday = Number(dailyCount[0]?.emails_sent_today || 0);
  
  // Get plan-based daily limit
  let DAILY_LIMIT = 10000;
  try {
    const { getOrgPlan } = require('../utils/planAccess');
    const plan = await getOrgPlan(req.user.orgId);
    if (plan.max_emails_per_day) DAILY_LIMIT = plan.max_emails_per_day;
  } catch (e) { /* defaults to 10000 */ }
  
  if (emailsSentToday + subscribers.length > DAILY_LIMIT) {
    return res.status(429).json({ 
      error: `Daily email limit reached (${DAILY_LIMIT}). Upgrade your plan for higher limits.`,
      sent: emailsSentToday,
      limit: DAILY_LIMIT,
      requested: subscribers.length
    });
  }

  const transport = makeTransport();
  const fromAddress = process.env.ADMIN_EMAIL || 'noreply@digitpenhub.com';
  const baseUrl = process.env.FRONTEND_ORIGIN || 'https://suite.digitpenhub.com';

  let sent = 0;
  const errors = [];

  // A/B testing logic
  const isAbTest = campaign.ab_test_enabled && campaign.ab_test_subject_b;
  const splitPct = campaign.ab_test_split_pct || 50;

  for (const sub of subscribers) {
    const unsubLink = `${baseUrl}/api/v1/email/unsubscribe/${sub.id}`;
    
    // Determine variant for A/B test
    let variant = null;
    let subject = campaign.subject;
    let bodyHtml = campaign.body_html;
    
    if (isAbTest) {
      // Random assignment based on split percentage
      const random = Math.random() * 100;
      if (random < splitPct) {
        variant = 'a';
      } else {
        variant = 'b';
        subject = campaign.ab_test_subject_b || campaign.subject;
        bodyHtml = campaign.ab_test_body_b || campaign.body_html;
      }
    }
    
    const html = `${bodyHtml}
<br><br>
<p style="font-size:12px;color:#888;">
  You received this email because you subscribed to ${campaign.org_name}.<br>
  <a href="${unsubLink}">Unsubscribe</a>
</p>`;

    try {
      await transport.sendMail({
        from: `"${campaign.org_name}" <${fromAddress}>`,
        to: sub.name ? `"${sub.name}" <${sub.email}>` : sub.email,
        subject: subject,
        html,
      });
      
      // Track send in email_sends table
      await db.query(
        `INSERT INTO email_sends (campaign_id, subscriber_id, variant, sent_at)
         VALUES ($1, $2, $3, now())`,
        [id, sub.id, variant]
      );
      
      sent++;
    } catch (err) {
      errors.push({ email: sub.email, error: err.message });
    }
  }
  
  // Start A/B test timer if enabled
  if (isAbTest && campaign.ab_test_duration_hours) {
    await db.query(
      `UPDATE email_campaigns 
       SET ab_test_started_at = now()
       WHERE id = $1`,
      [id]
    );
  }

  await db.query(
    `UPDATE email_campaigns SET status = 'sent', sent_at = now(), updated_at = now() WHERE id = $1`,
    [id]
  );

  res.json({ ok: true, sent, errors });
}

async function getStats(req, res) {
  const [listsRow, subsRow, campaignsRow] = await Promise.all([
    db.query(`SELECT COUNT(*) FROM email_lists WHERE org_id = $1`, [req.user.orgId]),
    db.query(`SELECT COUNT(*) FILTER (WHERE status = 'subscribed') AS active, COUNT(*) AS total FROM email_subscribers WHERE org_id = $1`, [req.user.orgId]),
    db.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status = 'sent') AS sent,
              COALESCE(SUM(opens), 0) AS total_opens,
              COALESCE(SUM(clicks), 0) AS total_clicks
       FROM email_campaigns WHERE org_id = $1`,
      [req.user.orgId]
    ),
  ]);

  res.json({
    lists: Number(listsRow.rows[0].count),
    subscribers: {
      active: Number(subsRow.rows[0].active),
      total: Number(subsRow.rows[0].total),
    },
    campaigns: {
      total: Number(campaignsRow.rows[0].total),
      sent: Number(campaignsRow.rows[0].sent),
      totalOpens: Number(campaignsRow.rows[0].total_opens),
      totalClicks: Number(campaignsRow.rows[0].total_clicks),
    },
  });
}

// CRITICAL FIX: Confirmation endpoint for double opt-in (GDPR compliance)
async function confirmSubscription(req, res) {
  const { token } = req.params;
  
  const { rows } = await db.query(
    `UPDATE email_subscribers 
     SET status = 'subscribed', 
         subscribed_at = now(),
         confirmed_at = now(),
         confirmation_token = NULL
     WHERE confirmation_token = $1 AND status = 'pending'
     RETURNING id, email, list_id`,
    [token]
  );
  
  if (!rows.length) {
    return res.status(404).json({ error: 'Invalid or expired confirmation token.' });
  }
  
  // Log confirmation event
  await db.query(
    `INSERT INTO audit_log (user_id, action, ip_address, meta) 
     VALUES (null, 'email.subscription_confirmed', $1, $2)`,
    [req.ip, JSON.stringify({ subscriberId: rows[0].id, email: rows[0].email })]
  );
  
  res.json({ ok: true, message: 'Subscription confirmed! Thank you.' });
}

module.exports = {
  listLists, createList, updateList, deleteList,
  listSubscribers, addSubscriber, importSubscribers, removeSubscriber, unsubscribe,
  listCampaigns, createCampaign, getCampaign, updateCampaign, deleteCampaign, sendCampaign,
  getStats,
  confirmSubscription, // CRITICAL FIX: Export confirmation endpoint for double opt-in
};
