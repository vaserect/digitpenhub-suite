const db = require('../db');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER(WHERE status='draft')::int AS draft,
       COUNT(*) FILTER(WHERE status='sent')::int AS sent,
       COUNT(*) FILTER(WHERE status='accepted')::int AS accepted,
       COALESCE(SUM(total) FILTER(WHERE status='accepted'),0) AS accepted_value
     FROM quotations WHERE org_id=$1`,
    [req.user.orgId]
  );
  res.json({ total: rows[0].total, draft: rows[0].draft, sent: rows[0].sent, accepted: rows[0].accepted, acceptedValue: Number(rows[0].accepted_value) });
}

async function listQuotations(req, res) {
  const { status } = req.query;
  const vals = [req.user.orgId]; const extra = status ? ' AND status=$2' : '';
  if (status) vals.push(status);
  const { rows } = await db.query(`SELECT * FROM quotations WHERE org_id=$1${extra} ORDER BY created_at DESC`, vals);
  res.json({ quotations: rows });
}

async function getQuotation(req, res) {
  const { rows } = await db.query(`SELECT * FROM quotations WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ quotation: rows[0] });
}

async function createQuotation(req, res) {
  const { clientName, clientEmail, clientAddress, items, subtotal, discount, taxRate, total, notes, validUntil } = req.body || {};
  if (!clientName?.trim()) return res.status(400).json({ error: 'clientName required' });
  const seqRes = await db.query(`SELECT nextval('quotation_number_seq') AS n`);
  const quoteNumber = `QUO-${String(seqRes.rows[0].n).padStart(4, '0')}`;
  const taxAmt = (Number(subtotal||0) - Number(discount||0)) * (Number(taxRate)||0) / 100;
  const { rows } = await db.query(
    `INSERT INTO quotations (org_id,quote_number,client_name,client_email,client_address,items,subtotal,discount,tax_rate,tax_amount,total,notes,valid_until)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [req.user.orgId, quoteNumber, clientName.trim(), clientEmail||null, clientAddress||null, JSON.stringify(items||[]), Number(subtotal)||0, Number(discount)||0, Number(taxRate)||0, taxAmt, Number(total)||0, notes||null, validUntil||null]
  );
  res.status(201).json({ quotation: rows[0] });
}

async function updateQuotation(req, res) {
  const { id } = req.params;
  const { clientName, clientEmail, clientAddress, items, subtotal, discount, taxRate, total, status, notes, validUntil } = req.body || {};
  const updates = []; const vals = []; let i = 1;
  if (clientName    !== undefined) { updates.push(`client_name=$${i++}`);    vals.push(clientName.trim()); }
  if (clientEmail   !== undefined) { updates.push(`client_email=$${i++}`);   vals.push(clientEmail||null); }
  if (clientAddress !== undefined) { updates.push(`client_address=$${i++}`); vals.push(clientAddress||null); }
  if (items         !== undefined) { updates.push(`items=$${i++}`);          vals.push(JSON.stringify(items)); }
  if (subtotal      !== undefined) { updates.push(`subtotal=$${i++}`);       vals.push(Number(subtotal)); }
  if (discount      !== undefined) { updates.push(`discount=$${i++}`);       vals.push(Number(discount)); }
  if (taxRate       !== undefined) { updates.push(`tax_rate=$${i++}`);       vals.push(Number(taxRate)); }
  if (taxRate !== undefined || discount !== undefined || subtotal !== undefined) {
    // Fetch the existing quotation to get the current tax_rate when it's not in the body.
    // This avoids silently wiping tax_amount to 0 when only subtotal/discount is updated.
    let effectiveTaxRate = taxRate;
    if (effectiveTaxRate === undefined) {
      const { rows: existing } = await db.query(
        `SELECT tax_rate FROM quotations WHERE id=$1 AND org_id=$2`,
        [id, req.user.orgId]
      );
      effectiveTaxRate = existing.length ? existing[0].tax_rate : 0;
    }
    const s = taxRate !== undefined ? Number(subtotal || 0) : undefined;
    const d = discount !== undefined ? Number(discount || 0) : undefined;
    // Only recalculate if we have the needed values
    const sVal = s !== undefined ? s : Number(subtotal || 0);
    const dVal = d !== undefined ? d : Number(discount || 0);
    const r = Number(effectiveTaxRate || 0);
    updates.push(`tax_amount=$${i++}`);
    vals.push((sVal - dVal) * r / 100);
  }
  if (total      !== undefined) { updates.push(`total=$${i++}`);       vals.push(Number(total)); }
  if (status     !== undefined) { updates.push(`status=$${i++}`);      vals.push(status); }
  if (notes      !== undefined) { updates.push(`notes=$${i++}`);       vals.push(notes||null); }
  if (validUntil !== undefined) { updates.push(`valid_until=$${i++}`); vals.push(validUntil||null); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  vals.push(id, req.user.orgId);
  const idParam = i;
  const orgParam = i + 1;
  const { rows } = await db.query(`UPDATE quotations SET ${updates.join(',')} WHERE id=$${idParam} AND org_id=$${orgParam} RETURNING *`, vals);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ quotation: rows[0] });
}

async function deleteQuotation(req, res) {
  await db.query(`DELETE FROM quotations WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

module.exports = { getStats, listQuotations, getQuotation, createQuotation, updateQuotation, deleteQuotation };
