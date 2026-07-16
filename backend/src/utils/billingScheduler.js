const db = require('../db');
const { sendMail } = require('./mailer');
const { getOrgPlan } = require('./planAccess');

const TICK_MS = 15 * 60 * 1000; // 15 minutes — balances responsiveness with DB load

/**
 * Background worker that runs inside the PM2 API process. Tick-based polling
 * (not cron): every 15 minutes it scans for:
 *   1. Expired subscriptions → mark as expired + start dunning
 *   2. Due dunning cycles → advance through schedule (send reminders)
 *   3. Exhausted dunning cycles → escalate, then auto-downgrade to free
 *
 * State is entirely in the database, so a PM2 restart just resumes on the next
 * tick with no lost progress.
 */

async function processExpiredSubscriptions() {
  // Find active paid subscriptions past their period end
  const { rows: expired } = await db.query(
    `SELECT s.id AS sub_id, s.org_id, p.name AS plan_name, p.price_ngn
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.status = 'active'
       AND s.current_period_end IS NOT NULL
       AND s.current_period_end < now()
       AND p.price_ngn > 0`
  );

  for (const sub of expired) {
    // Mark subscription as expired
    await db.query(
      `UPDATE subscriptions SET status = 'expired', updated_at = now() WHERE id = $1`,
      [sub.sub_id]
    );

    // Start a dunning cycle if one doesn't already exist
    const { rows: existing } = await db.query(
      `SELECT id FROM dunning_cycles WHERE org_id = $1 AND subscription_id = $2 AND status NOT IN ('resolved','suspended')`,
      [sub.org_id, sub.sub_id]
    );
    if (!existing.length) {
      const { rows: cycle } = await db.query(
        `INSERT INTO dunning_cycles (org_id, subscription_id, amount_due, next_action_at)
         VALUES ($1, $2, $3, now() + interval '3 days') RETURNING id`,
        [sub.org_id, sub.sub_id, sub.price_ngn]
      );
      await db.query(
        `INSERT INTO dunning_actions (cycle_id, action_type, detail)
         VALUES ($1, 'email_reminder', 'Subscription expired — first payment reminder scheduled in 3 days.')`,
        [cycle[0].id]
      );
    }

    // Audit log
    try {
      await db.query(
        `INSERT INTO audit_log (user_id, action, ip_address, meta)
         VALUES (NULL, 'subscription.expired', '0.0.0.0', $1)`,
        [JSON.stringify({ subId: sub.sub_id, orgId: sub.org_id, planName: sub.plan_name })]
      );
    } catch { /* silent */ }
  }
}

async function advanceDunningCycles() {
  // Find cycles whose next_action_at has passed
  const { rows: due } = await db.query(
    `SELECT dc.id, dc.org_id, dc.subscription_id, dc.amount_due, dc.failure_count,
            dc.next_action_at, dt.schedule, dt.max_retries
     FROM dunning_cycles dc
     LEFT JOIN subscriptions s ON s.id = dc.subscription_id
     LEFT JOIN plans p ON p.id = s.plan_id
     LEFT JOIN dunning_templates dt ON dt.is_default = true AND (dt.org_id IS NULL OR dt.org_id = dc.org_id)
     WHERE dc.status NOT IN ('resolved', 'suspended')
       AND dc.next_action_at IS NOT NULL
       AND dc.next_action_at < now()`
  );

  for (const cycle of due) {
    const schedule = cycle.schedule || [
      { delay_days: 3, action: 'email_reminder' },
      { delay_days: 7, action: 'email_reminder' },
      { delay_days: 14, action: 'email_final' },
      { delay_days: 21, action: 'restrict_usage' },
      { delay_days: 28, action: 'suspend_notice' },
    ];
    const maxRetries = cycle.max_retries || 3;

    // Get the last action executed
    const { rows: lastActions } = await db.query(
      `SELECT action_type FROM dunning_actions WHERE cycle_id = $1 ORDER BY executed_at DESC LIMIT 1`,
      [cycle.id]
    );
    const lastAction = lastActions[0]?.action_type || null;

    // Determine which step comes next
    let nextStepIdx = 0;
    if (lastAction) {
      nextStepIdx = schedule.findIndex((s) => s.action === lastAction) + 1;
    }

    if (nextStepIdx >= schedule.length || cycle.failure_count >= maxRetries) {
      // Dunning exhausted — escalate to suspended, then downgrade to free
      await db.query(
        `UPDATE dunning_cycles SET status = 'suspended', next_action_at = NULL, resolved_at = now()
         WHERE id = $1`,
        [cycle.id]
      );
      await db.query(
        `INSERT INTO dunning_actions (cycle_id, action_type, detail)
         VALUES ($1, 'suspend_notice', 'Dunning exhausted — service has been restricted.')`,
        [cycle.id]
      );

      // Downgrade to free plan
      const { rows: freePlan } = await db.query(`SELECT id FROM plans WHERE slug = 'free'`);
      if (freePlan.length && cycle.subscription_id) {
        await db.query(
          `UPDATE subscriptions SET plan_id = $1, status = 'active', updated_at = now()
           WHERE id = $2`,
          [freePlan[0].id, cycle.subscription_id]
        );
        await db.query(
          `INSERT INTO dunning_actions (cycle_id, action_type, detail)
           VALUES ($1, 'resolved', 'Downgraded to Free plan after dunning exhausted.')`,
          [cycle.id]
        );
      }

      // Audit
      try {
        await db.query(
          `INSERT INTO audit_log (user_id, action, ip_address, meta)
           VALUES (NULL, 'subscription.downgraded_free', '0.0.0.0', $1)`,
          [JSON.stringify({ cycleId: cycle.id, orgId: cycle.org_id })]
        );
      } catch { /* silent */ }
      continue;
    }

    const step = schedule[nextStepIdx];
    const delayDays = step.delay_days || 3;

    // Record the action
    await db.query(
      `INSERT INTO dunning_actions (cycle_id, action_type, detail)
       VALUES ($1, $2, $3)`,
      [cycle.id, step.action, `${step.action} step executed.`]
    );

    // Update cycle status and schedule next action
    const newFailureCount = cycle.failure_count + 1;
    await db.query(
      `UPDATE dunning_cycles
       SET status = CASE
             WHEN $1 IN ('email_final', 'suspend_notice') THEN 'escalated'
             ELSE 'reminding'
           END,
           failure_count = $2,
           last_attempt_at = now(),
           next_action_at = now() + ($3 || 3) * interval '1 day'
       WHERE id = $4`,
      [step.action, newFailureCount, delayDays, cycle.id]
    );

    // Try to send a payment reminder email to the org members
    if (['email_reminder', 'email_final', 'suspend_notice'].includes(step.action)) {
      try {
        const { rows: org } = await db.query(`SELECT name FROM organizations WHERE id = $1`, [cycle.org_id]);
        const { rows: admins } = await db.query(
          `SELECT email, full_name FROM users WHERE org_id = $1 AND role IN ('owner', 'admin') LIMIT 3`,
          [cycle.org_id]
        );
        for (const admin of admins) {
          sendMail({
            to: admin.email,
            subject: step.action === 'email_final' ? 'Final payment reminder — Digitpen Hub' :
                     step.action === 'suspend_notice' ? 'Service restricted — Digitpen Hub' :
                     `Payment reminder — Digitpen Hub`,
            html: `<p>Hi ${admin.full_name?.split(' ')[0] || 'there'},</p>
<p>Your <strong>${org[0]?.name || 'workspace'}</strong> subscription payment of <strong>NGN ${Number(cycle.amount_due).toLocaleString()}/mo</strong> is past due.</p>
${step.action === 'email_final'
  ? '<p><strong>This is your final notice.</strong> Please make a payment immediately to avoid service restriction.</p>'
  : step.action === 'suspend_notice'
  ? '<p>Your access has been restricted due to non-payment. Please contact support to restore your service.</p>'
  : '<p>Please log in to update your payment method and keep your workspace running.</p>'}
<p><a href="${process.env.FRONTEND_ORIGIN || 'https://suite.digitpenhub.com'}/billing">Manage subscription →</a></p>
<p>Thank you.</p>`,
          }).catch(() => {});
        }
      } catch { /* silent */ }
    }
  }
}

function startBillingScheduler() {
  setInterval(() => {
    Promise.all([
      processExpiredSubscriptions(),
      advanceDunningCycles(),
    ]).catch((err) => console.error('billing scheduler tick failed:', err.message));
  }, TICK_MS);
  // First run shortly after boot
  setTimeout(() => {
    Promise.all([
      processExpiredSubscriptions(),
      advanceDunningCycles(),
    ]).catch((err) => console.error('billing scheduler initial tick failed:', err.message));
  }, 30000);
}

module.exports = { startBillingScheduler };
