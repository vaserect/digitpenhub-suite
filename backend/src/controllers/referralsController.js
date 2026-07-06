const db = require('../db');
const { sendCsv, autoColumns } = require('../utils/csv');

async function getStats(req, res) {
  const [pgRes, refRes] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS c FROM referral_programs WHERE org_id=$1 AND status='active'`, [req.user.orgId]),
    db.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER(WHERE status='converted')::int AS converted,
              COUNT(*) FILTER(WHERE status='pending')::int AS pending,
              COUNT(*) FILTER(WHERE status='rewarded')::int AS rewarded
       FROM referrals WHERE org_id=$1`,
      [req.user.orgId]
    ),
  ]);
  res.json({
    activePrograms: pgRes.rows[0].c,
    totalReferrals: refRes.rows[0].total,
    converted:      refRes.rows[0].converted,
    pending:        refRes.rows[0].pending,
    rewarded:       refRes.rows[0].rewarded,
  });
}

// ── Programs ──────────────────────────────────────────────────────────────────

async function listPrograms(req, res) {
  const { rows } = await db.query(
    `SELECT rp.*, COUNT(r.id)::int AS referral_count,
            COUNT(r.id) FILTER(WHERE r.status='converted')::int AS conversions
     FROM referral_programs rp
     LEFT JOIN referrals r ON r.program_id=rp.id
     WHERE rp.org_id=$1 GROUP BY rp.id ORDER BY rp.created_at DESC`,
    [req.user.orgId]
  );
  res.json({ programs: rows });
}

async function createProgram(req, res) {
  const { name, description, rewardType, rewardValue, status, terms } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO referral_programs (org_id, name, description, reward_type, reward_value, status, terms)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.orgId, name.trim(), description||null, rewardType||'cash', Number(rewardValue)||0, status||'active', terms||null]
  );
  res.status(201).json({ program: rows[0] });
}

async function updateProgram(req, res) {
  const { id } = req.params;
  const { name, description, rewardType, rewardValue, status, terms } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (name       !==undefined){updates.push(`name=$${i++}`);        vals.push(name.trim());}
  if (description!==undefined){updates.push(`description=$${i++}`); vals.push(description||null);}
  if (rewardType !==undefined){updates.push(`reward_type=$${i++}`); vals.push(rewardType);}
  if (rewardValue!==undefined){updates.push(`reward_value=$${i++}`);vals.push(Number(rewardValue));}
  if (status     !==undefined){updates.push(`status=$${i++}`);      vals.push(status);}
  if (terms      !==undefined){updates.push(`terms=$${i++}`);       vals.push(terms||null);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE referral_programs SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Program not found.' });
  res.json({ program: rows[0] });
}

async function deleteProgram(req, res) {
  await db.query(`DELETE FROM referral_programs WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

// ── Referrals ─────────────────────────────────────────────────────────────────

async function listReferrals(req, res) {
  const { programId, status } = req.query;
  const { rows } = await db.query(
    `SELECT r.*, rp.name AS program_name FROM referrals r
     LEFT JOIN referral_programs rp ON rp.id=r.program_id
     WHERE r.org_id=$1 AND ($2='' OR r.program_id::text=$2) AND ($3='' OR r.status=$3)
     ORDER BY r.created_at DESC`,
    [req.user.orgId, programId||'', status||'']
  );
  res.json({ referrals: rows });
}

async function createReferral(req, res) {
  const { programId, referrerName, referrerEmail, referrerCode, refereeName, refereeEmail, refereePhone, notes } = req.body || {};
  if (!referrerName?.trim()) return res.status(400).json({ error: 'referrerName is required.' });
  if (!refereeName?.trim())  return res.status(400).json({ error: 'refereeName is required.' });
  const { rows } = await db.query(
    `INSERT INTO referrals (org_id, program_id, referrer_name, referrer_email, referrer_code, referee_name, referee_email, referee_phone, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user.orgId, programId||null, referrerName.trim(), referrerEmail||null, referrerCode?.trim()||null, refereeName.trim(), refereeEmail||null, refereePhone||null, notes||null]
  );
  res.status(201).json({ referral: rows[0] });
}

async function updateReferral(req, res) {
  const { id } = req.params;
  const { status, notes } = req.body || {};
  const updates=[]; const vals=[]; let i=1;
  if (status!==undefined){updates.push(`status=$${i++}`);vals.push(status);}
  if (notes !==undefined){updates.push(`notes=$${i++}`); vals.push(notes||null);}
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const { rows } = await db.query(`UPDATE referrals SET ${updates.join(',')} WHERE id=$${i} AND org_id=$${i+1} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Referral not found.' });
  res.json({ referral: rows[0] });
}

async function deleteReferral(req, res) {
  await db.query(`DELETE FROM referrals WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function exportReferrals(req, res) {
  const { rows } = await db.query(
    `SELECT r.*, rp.name AS program_name FROM referrals r
     LEFT JOIN referral_programs rp ON rp.id=r.program_id
     WHERE r.org_id=$1
     ORDER BY r.created_at DESC`,
    [req.user.orgId]
  );
  sendCsv(res, 'referrals.csv', rows, autoColumns(rows));
}

module.exports = {
  getStats,
  listPrograms, createProgram, updateProgram, deleteProgram,
  listReferrals, exportReferrals, createReferral, updateReferral, deleteReferral,
};
