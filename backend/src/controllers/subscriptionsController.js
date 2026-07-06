const db = require('../db');
const { sendCsv, autoColumns } = require('../utils/csv');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const bulkDeleteSubscriptions = bulkDeleteHandler('customer_subscriptions');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER(WHERE status='active')::int AS active,
       COUNT(*) FILTER(WHERE status='cancelled')::int AS cancelled,
       COALESCE(SUM(amount) FILTER(WHERE status='active'),0) AS mrr
     FROM customer_subscriptions WHERE org_id=$1`,
    [req.user.orgId]
  );
  res.json({ ...rows[0], mrr: Number(rows[0].mrr) });
}

async function listPlans(req, res) {
  const { rows } = await db.query(
    `SELECT p.*, COUNT(s.id)::int AS subscriber_count FROM subscription_plans p
     LEFT JOIN customer_subscriptions s ON s.plan_id=p.id AND s.status='active'
     WHERE p.org_id=$1 GROUP BY p.id ORDER BY p.price`,
    [req.user.orgId]
  );
  res.json({ plans: rows });
}

async function createPlan(req, res) {
  const { name, description, price, billingCycle, trialDays, features, status } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const { rows } = await db.query(
    `INSERT INTO subscription_plans (org_id,name,description,price,billing_cycle,trial_days,features,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.orgId, name.trim(), description||null, Number(price)||0, billingCycle||'monthly', Number(trialDays)||0, JSON.stringify(features||[]), status||'active']
  );
  res.status(201).json({ plan: rows[0] });
}

async function updatePlan(req, res) {
  const { id } = req.params;
  const { name, description, price, billingCycle, trialDays, features, status } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (name         !==undefined){updates.push(`name=$${i++}`);          vals.push(name.trim());}
  if (description  !==undefined){updates.push(`description=$${i++}`);   vals.push(description||null);}
  if (price        !==undefined){updates.push(`price=$${i++}`);         vals.push(Number(price)||0);}
  if (billingCycle !==undefined){updates.push(`billing_cycle=$${i++}`); vals.push(billingCycle);}
  if (trialDays    !==undefined){updates.push(`trial_days=$${i++}`);    vals.push(Number(trialDays)||0);}
  if (features     !==undefined){updates.push(`features=$${i++}`);      vals.push(JSON.stringify(features||[]));}
  if (status       !==undefined){updates.push(`status=$${i++}`);        vals.push(status);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE subscription_plans SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ plan: rows[0] });
}

async function deletePlan(req, res) {
  await db.query(`DELETE FROM subscription_plans WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function listSubscriptions(req, res) {
  const { status, planId, search } = req.query;
  const conditions=['s.org_id=$1']; const vals=[req.user.orgId]; let i=2;
  if (status) {conditions.push(`s.status=$${i++}`);                              vals.push(status);}
  if (planId) {conditions.push(`s.plan_id=$${i++}`);                             vals.push(planId);}
  if (search) {conditions.push(`s.customer_name ILIKE $${i++}`);                 vals.push(`%${search}%`);}
  const { rows } = await db.query(
    `SELECT s.*, p.name AS plan_name, p.billing_cycle FROM customer_subscriptions s
     LEFT JOIN subscription_plans p ON p.id=s.plan_id
     WHERE ${conditions.join(' AND ')} ORDER BY s.created_at DESC`,
    vals
  );
  res.json({ subscriptions: rows });
}

async function exportSubscriptions(req, res) {
  const { rows } = await db.query(
    `SELECT s.*, p.name AS plan_name, p.billing_cycle FROM customer_subscriptions s
     LEFT JOIN subscription_plans p ON p.id=s.plan_id
     WHERE s.org_id=$1 ORDER BY s.created_at DESC`,
    [req.user.orgId]
  );
  sendCsv(res, 'subscribers.csv', rows, autoColumns(rows));
}

async function createSubscription(req, res) {
  const { planId, customerName, customerEmail, customerPhone, startedAt, currentPeriodEnd, amount, notes } = req.body || {};
  if (!customerName?.trim()) return res.status(400).json({ error: 'customerName required' });
  const { rows } = await db.query(
    `INSERT INTO customer_subscriptions (org_id,plan_id,customer_name,customer_email,customer_phone,started_at,current_period_end,amount,notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user.orgId, planId||null, customerName.trim(), customerEmail||null, customerPhone||null, startedAt||new Date().toISOString().slice(0,10), currentPeriodEnd||null, Number(amount)||0, notes||null]
  );
  res.status(201).json({ subscription: rows[0] });
}

async function updateSubscription(req, res) {
  const { id } = req.params;
  const { status, planId, currentPeriodEnd, amount, notes, cancelledAt } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (status          !==undefined){updates.push(`status=$${i++}`);             vals.push(status); if (status==='cancelled') updates.push(`cancelled_at=NOW()`);}
  if (planId          !==undefined){updates.push(`plan_id=$${i++}`);            vals.push(planId||null);}
  if (currentPeriodEnd!==undefined){updates.push(`current_period_end=$${i++}`); vals.push(currentPeriodEnd||null);}
  if (amount          !==undefined){updates.push(`amount=$${i++}`);             vals.push(Number(amount)||0);}
  if (notes           !==undefined){updates.push(`notes=$${i++}`);              vals.push(notes||null);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  updates.push('updated_at=NOW()');
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE customer_subscriptions SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ subscription: rows[0] });
}

async function deleteSubscription(req, res) {
  await db.query(`DELETE FROM customer_subscriptions WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

module.exports = { getStats, listPlans, createPlan, updatePlan, deletePlan, listSubscriptions, exportSubscriptions, createSubscription, updateSubscription, deleteSubscription, bulkDeleteSubscriptions };
