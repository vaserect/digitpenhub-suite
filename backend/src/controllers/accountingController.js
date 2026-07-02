const db = require('../db');

const DEFAULT_COA = [
  { code: '1000', name: 'Cash',                    type: 'asset' },
  { code: '1010', name: 'Bank Account',             type: 'asset' },
  { code: '1100', name: 'Accounts Receivable',      type: 'asset' },
  { code: '1200', name: 'Inventory',                type: 'asset' },
  { code: '1300', name: 'Prepaid Expenses',         type: 'asset' },
  { code: '2000', name: 'Accounts Payable',         type: 'liability' },
  { code: '2100', name: 'VAT Payable',              type: 'liability' },
  { code: '2200', name: 'Loans Payable',            type: 'liability' },
  { code: '2300', name: 'Accrued Liabilities',      type: 'liability' },
  { code: '3000', name: "Owner's Equity",           type: 'equity' },
  { code: '3100', name: 'Retained Earnings',        type: 'equity' },
  { code: '4000', name: 'Sales Revenue',            type: 'income' },
  { code: '4100', name: 'Service Revenue',          type: 'income' },
  { code: '4200', name: 'Other Income',             type: 'income' },
  { code: '5000', name: 'Cost of Goods Sold',       type: 'expense' },
  { code: '5100', name: 'Salaries & Wages',         type: 'expense' },
  { code: '5200', name: 'Rent',                     type: 'expense' },
  { code: '5300', name: 'Utilities',                type: 'expense' },
  { code: '5400', name: 'Marketing & Advertising',  type: 'expense' },
  { code: '5500', name: 'Office Supplies',          type: 'expense' },
  { code: '5600', name: 'Professional Services',    type: 'expense' },
  { code: '5700', name: 'Bank Charges',             type: 'expense' },
  { code: '5800', name: 'Other Expenses',           type: 'expense' },
];

// ── Stats ─────────────────────────────────────────────────────────────────────

async function getStats(req, res) {
  const now = new Date();
  const startOfYear  = `${now.getFullYear()}-01-01`;
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today        = now.toISOString().slice(0, 10);

  const plQuery = (start, end) =>
    db.query(
      `SELECT ca.account_type,
              COALESCE(SUM(jl.debit), 0)  AS total_debit,
              COALESCE(SUM(jl.credit), 0) AS total_credit
       FROM coa_accounts ca
       LEFT JOIN journal_lines jl ON jl.account_id = ca.id
       LEFT JOIN journal_entries je ON je.id = jl.entry_id
         AND je.entry_date BETWEEN $2 AND $3
       WHERE ca.org_id = $1 AND ca.account_type IN ('income','expense')
       GROUP BY ca.account_type`,
      [req.user.orgId, start, end]
    );

  const [yearRows, monthRows, countRow] = await Promise.all([
    plQuery(startOfYear, today),
    plQuery(startOfMonth, today),
    db.query(`SELECT COUNT(*) AS c FROM journal_entries WHERE org_id = $1`, [req.user.orgId]),
  ]);

  const calcPL = (rows) => {
    const inc = rows.find((r) => r.account_type === 'income');
    const exp = rows.find((r) => r.account_type === 'expense');
    const revenue  = inc ? Number(inc.total_credit)  - Number(inc.total_debit)  : 0;
    const expenses = exp ? Number(exp.total_debit)   - Number(exp.total_credit) : 0;
    return { revenue, expenses, netProfit: revenue - expenses };
  };

  res.json({
    year:          calcPL(yearRows.rows),
    month:         calcPL(monthRows.rows),
    totalEntries:  Number(countRow.rows[0].c),
  });
}

// ── Chart of Accounts ─────────────────────────────────────────────────────────

async function listAccounts(req, res) {
  let { rows } = await db.query(
    `SELECT id, code, name, account_type, is_system, created_at
     FROM coa_accounts WHERE org_id = $1 ORDER BY account_type, code, name`,
    [req.user.orgId]
  );

  if (rows.length === 0) {
    for (const a of DEFAULT_COA) {
      await db.query(
        `INSERT INTO coa_accounts (org_id, code, name, account_type, is_system) VALUES ($1,$2,$3,$4,true)`,
        [req.user.orgId, a.code, a.name, a.type]
      );
    }
    const fresh = await db.query(
      `SELECT id, code, name, account_type, is_system FROM coa_accounts WHERE org_id = $1 ORDER BY account_type, code`,
      [req.user.orgId]
    );
    rows = fresh.rows;
  }

  res.json({ accounts: rows });
}

async function createAccount(req, res) {
  const { code, name, accountType } = req.body || {};
  if (!name?.trim())    return res.status(400).json({ error: 'name is required.' });
  if (!accountType)     return res.status(400).json({ error: 'accountType is required.' });
  const { rows } = await db.query(
    `INSERT INTO coa_accounts (org_id, code, name, account_type) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, code?.trim() || null, name.trim(), accountType]
  );
  res.status(201).json({ account: rows[0] });
}

async function updateAccount(req, res) {
  const { id } = req.params;
  const { code, name, accountType } = req.body || {};
  const updates = []; const values = []; let idx = 1;
  if (code !== undefined)        { updates.push(`code = $${idx++}`);         values.push(code?.trim() || null); }
  if (name !== undefined)        { updates.push(`name = $${idx++}`);         values.push(name.trim()); }
  if (accountType !== undefined) { updates.push(`account_type = $${idx++}`); values.push(accountType); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  values.push(id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE coa_accounts SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
    values
  );
  if (!rows.length) return res.status(404).json({ error: 'Account not found.' });
  res.json({ account: rows[0] });
}

async function deleteAccount(req, res) {
  const { id } = req.params;
  const acc = await db.query(`SELECT is_system FROM coa_accounts WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!acc.rows.length) return res.status(404).json({ error: 'Account not found.' });
  const used = await db.query(`SELECT 1 FROM journal_lines WHERE account_id = $1 LIMIT 1`, [id]);
  if (used.rows.length) return res.status(409).json({ error: 'Cannot delete an account that has journal entries.' });
  await db.query(`DELETE FROM coa_accounts WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  res.json({ ok: true });
}

// ── Journal Entries ───────────────────────────────────────────────────────────

async function listEntries(req, res) {
  const { start, end, accountId } = req.query;
  const params = [req.user.orgId];
  let where = 'WHERE je.org_id = $1';
  let idx = 2;
  if (start)     { where += ` AND je.entry_date >= $${idx++}`; params.push(start); }
  if (end)       { where += ` AND je.entry_date <= $${idx++}`; params.push(end); }
  if (accountId) {
    where += ` AND je.id IN (SELECT entry_id FROM journal_lines WHERE account_id = $${idx++})`;
    params.push(accountId);
  }

  const { rows } = await db.query(
    `SELECT je.id, je.entry_date, je.description, je.reference, je.created_at,
            COALESCE(SUM(jl.debit), 0)  AS total_debit,
            COALESCE(SUM(jl.credit), 0) AS total_credit
     FROM journal_entries je
     LEFT JOIN journal_lines jl ON jl.entry_id = je.id
     ${where}
     GROUP BY je.id
     ORDER BY je.entry_date DESC, je.created_at DESC
     LIMIT 200`,
    params
  );
  res.json({
    entries: rows.map((r) => ({
      ...r,
      total_debit:  Number(r.total_debit),
      total_credit: Number(r.total_credit),
    })),
  });
}

async function getEntry(req, res) {
  const { id } = req.params;
  const [entryRes, linesRes] = await Promise.all([
    db.query(`SELECT * FROM journal_entries WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]),
    db.query(
      `SELECT jl.id, jl.debit, jl.credit, jl.notes,
              ca.id AS account_id, ca.code, ca.name, ca.account_type
       FROM journal_lines jl
       JOIN coa_accounts ca ON ca.id = jl.account_id
       WHERE jl.entry_id = $1 ORDER BY jl.debit DESC`,
      [id]
    ),
  ]);
  if (!entryRes.rows.length) return res.status(404).json({ error: 'Entry not found.' });
  res.json({
    entry: entryRes.rows[0],
    lines: linesRes.rows.map((l) => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) })),
  });
}

async function createEntry(req, res) {
  const { entryDate, description, reference, lines } = req.body || {};
  if (!description?.trim()) return res.status(400).json({ error: 'description is required.' });
  if (!Array.isArray(lines) || lines.length < 2) return res.status(400).json({ error: 'At least 2 lines are required.' });

  const totalDebit  = lines.reduce((s, l) => s + (Number(l.debit)  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0) {
    return res.status(400).json({ error: `Entry is not balanced: debits ${totalDebit} ≠ credits ${totalCredit}.` });
  }

  const { rows: [entry] } = await db.query(
    `INSERT INTO journal_entries (org_id, entry_date, description, reference)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.orgId, entryDate || new Date().toISOString().slice(0, 10), description.trim(), reference?.trim() || null]
  );

  for (const line of lines) {
    if (!line.accountId) continue;
    await db.query(
      `INSERT INTO journal_lines (entry_id, account_id, debit, credit, notes) VALUES ($1,$2,$3,$4,$5)`,
      [entry.id, line.accountId, Number(line.debit) || 0, Number(line.credit) || 0, line.notes?.trim() || null]
    );
  }

  res.status(201).json({ entry });
}

async function deleteEntry(req, res) {
  const { id } = req.params;
  const { rowCount } = await db.query(`DELETE FROM journal_entries WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Entry not found.' });
  res.json({ ok: true });
}

// ── Reports ───────────────────────────────────────────────────────────────────

async function getPL(req, res) {
  const now  = new Date();
  const startDate = req.query.start || `${now.getFullYear()}-01-01`;
  const endDate   = req.query.end   || now.toISOString().slice(0, 10);

  const { rows } = await db.query(
    `SELECT ca.id, ca.code, ca.name, ca.account_type,
            COALESCE(SUM(jl.debit), 0)  AS total_debit,
            COALESCE(SUM(jl.credit), 0) AS total_credit
     FROM coa_accounts ca
     LEFT JOIN journal_lines jl ON jl.account_id = ca.id
     LEFT JOIN journal_entries je ON je.id = jl.entry_id
       AND je.entry_date BETWEEN $2 AND $3
     WHERE ca.org_id = $1 AND ca.account_type IN ('income','expense')
     GROUP BY ca.id
     ORDER BY ca.account_type, ca.code, ca.name`,
    [req.user.orgId, startDate, endDate]
  );

  const income = rows
    .filter((r) => r.account_type === 'income')
    .map((r) => ({ id: r.id, code: r.code, name: r.name, amount: Number(r.total_credit) - Number(r.total_debit) }));
  const expenses = rows
    .filter((r) => r.account_type === 'expense')
    .map((r) => ({ id: r.id, code: r.code, name: r.name, amount: Number(r.total_debit) - Number(r.total_credit) }));

  const totalIncome   = income.reduce((s, a) => s + a.amount, 0);
  const totalExpenses = expenses.reduce((s, a) => s + a.amount, 0);

  res.json({ startDate, endDate, income, expenses, totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses });
}

async function getBalanceSheet(req, res) {
  const asofDate = req.query.asof || new Date().toISOString().slice(0, 10);

  const { rows } = await db.query(
    `SELECT ca.id, ca.code, ca.name, ca.account_type,
            COALESCE(SUM(jl.debit), 0)  AS total_debit,
            COALESCE(SUM(jl.credit), 0) AS total_credit
     FROM coa_accounts ca
     LEFT JOIN journal_lines jl ON jl.account_id = ca.id
     LEFT JOIN journal_entries je ON je.id = jl.entry_id AND je.entry_date <= $2
     WHERE ca.org_id = $1
     GROUP BY ca.id
     ORDER BY ca.account_type, ca.code, ca.name`,
    [req.user.orgId, asofDate]
  );

  const toAmount = (r, normalCredit) =>
    normalCredit
      ? Number(r.total_credit) - Number(r.total_debit)
      : Number(r.total_debit)  - Number(r.total_credit);

  const assets      = rows.filter((r) => r.account_type === 'asset')
                          .map((r) => ({ id: r.id, code: r.code, name: r.name, amount: toAmount(r, false) }));
  const liabilities = rows.filter((r) => r.account_type === 'liability')
                          .map((r) => ({ id: r.id, code: r.code, name: r.name, amount: toAmount(r, true) }));
  const equity      = rows.filter((r) => r.account_type === 'equity')
                          .map((r) => ({ id: r.id, code: r.code, name: r.name, amount: toAmount(r, true) }));

  // Current period net income (undistributed)
  const incRows = rows.filter((r) => r.account_type === 'income');
  const expRows = rows.filter((r) => r.account_type === 'expense');
  const netIncome =
    incRows.reduce((s, r) => s + Number(r.total_credit) - Number(r.total_debit), 0) -
    expRows.reduce((s, r) => s + Number(r.total_debit)  - Number(r.total_credit), 0);

  const totalAssets      = assets.reduce((s, a) => s + a.amount, 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + a.amount, 0);
  const totalEquity      = equity.reduce((s, a) => s + a.amount, 0) + netIncome;

  res.json({
    asofDate, assets, liabilities, equity, netIncome,
    totalAssets, totalLiabilities, totalEquity,
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 2,
  });
}

module.exports = {
  getStats,
  listAccounts, createAccount, updateAccount, deleteAccount,
  listEntries, getEntry, createEntry, deleteEntry,
  getPL, getBalanceSheet,
};
