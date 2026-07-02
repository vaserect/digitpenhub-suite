const db = require('../db');

const DEFAULT_CATEGORIES = [
  { name: 'Office Supplies',  color: '#6366f1' },
  { name: 'Travel',           color: '#f59e0b' },
  { name: 'Meals & Entertainment', color: '#ef4444' },
  { name: 'Marketing',        color: '#10b981' },
  { name: 'Utilities',        color: '#3b82f6' },
  { name: 'Software & Tools', color: '#8b5cf6' },
  { name: 'Salaries',         color: '#ec4899' },
  { name: 'Rent',             color: '#14b8a6' },
  { name: 'Other',            color: '#94a3b8' },
];

// ── Categories ────────────────────────────────────────────────────────────────

async function listCategories(req, res) {
  let { rows } = await db.query(
    `SELECT ec.id, ec.name, ec.color, ec.created_at,
            COALESCE(SUM(e.amount_ngn), 0) AS total_spent
     FROM expense_categories ec
     LEFT JOIN expenses e ON e.category_id = ec.id AND e.org_id = ec.org_id
     WHERE ec.org_id = $1
     GROUP BY ec.id
     ORDER BY ec.name`,
    [req.user.orgId]
  );

  // Seed default categories on first load
  if (rows.length === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.query(
        `INSERT INTO expense_categories (org_id, name, color) VALUES ($1, $2, $3)`,
        [req.user.orgId, cat.name, cat.color]
      );
    }
    const fresh = await db.query(
      `SELECT id, name, color, created_at, 0 AS total_spent FROM expense_categories WHERE org_id = $1 ORDER BY name`,
      [req.user.orgId]
    );
    rows = fresh.rows;
  }

  res.json({ categories: rows });
}

async function createCategory(req, res) {
  const { name, color } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await db.query(
    `INSERT INTO expense_categories (org_id, name, color) VALUES ($1, $2, $3) RETURNING *`,
    [req.user.orgId, name.trim(), color || '#6366f1']
  );
  res.status(201).json({ category: rows[0] });
}

async function updateCategory(req, res) {
  const { id } = req.params;
  const { name, color } = req.body || {};
  const updates = []; const values = []; let idx = 1;
  if (name !== undefined)  { updates.push(`name = $${idx++}`);  values.push(name.trim()); }
  if (color !== undefined) { updates.push(`color = $${idx++}`); values.push(color); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
  values.push(id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE expense_categories SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
    values
  );
  if (!rows.length) return res.status(404).json({ error: 'Category not found.' });
  res.json({ category: rows[0] });
}

async function deleteCategory(req, res) {
  const { id } = req.params;
  await db.query(`UPDATE expenses SET category_id = NULL WHERE category_id = $1 AND org_id = $2`, [id, req.user.orgId]);
  const { rowCount } = await db.query(`DELETE FROM expense_categories WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Category not found.' });
  res.json({ ok: true });
}

// ── Expenses ──────────────────────────────────────────────────────────────────

async function listExpenses(req, res) {
  const { month, year, categoryId, status } = req.query;
  const m = Number(month) || 0;
  const y = Number(year) || 0;

  const { rows } = await db.query(
    `SELECT e.id, e.title, e.amount_ngn, e.expense_date, e.payment_method, e.status,
            e.receipt_url, e.notes, e.created_at,
            ec.id AS category_id, ec.name AS category_name, ec.color AS category_color
     FROM expenses e
     LEFT JOIN expense_categories ec ON ec.id = e.category_id
     WHERE e.org_id = $1
       AND ($2 = 0 OR EXTRACT(MONTH FROM e.expense_date) = $2)
       AND ($3 = 0 OR EXTRACT(YEAR  FROM e.expense_date) = $3)
       AND ($4 = '' OR e.category_id::text = $4)
       AND ($5 = '' OR e.status = $5)
     ORDER BY e.expense_date DESC, e.created_at DESC`,
    [req.user.orgId, m, y, categoryId || '', status || '']
  );
  res.json({ expenses: rows });
}

async function createExpense(req, res) {
  const { title, amountNgn, expenseDate, categoryId, paymentMethod, status, receiptUrl, notes } = req.body || {};
  if (!title?.trim())      return res.status(400).json({ error: 'title is required.' });
  if (!amountNgn || Number(amountNgn) <= 0) return res.status(400).json({ error: 'amountNgn must be > 0.' });

  const { rows } = await db.query(
    `INSERT INTO expenses (org_id, title, amount_ngn, expense_date, category_id, payment_method, status, receipt_url, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user.orgId, title.trim(), Number(amountNgn), expenseDate || new Date().toISOString().slice(0, 10), categoryId || null, paymentMethod || 'cash', status || 'paid', receiptUrl || null, notes || null]
  );
  res.status(201).json({ expense: rows[0] });
}

async function updateExpense(req, res) {
  const { id } = req.params;
  const { title, amountNgn, expenseDate, categoryId, paymentMethod, status, receiptUrl, notes } = req.body || {};
  const existing = await db.query(`SELECT id FROM expenses WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Expense not found.' });

  const updates = []; const values = []; let idx = 1;
  if (title !== undefined)         { updates.push(`title = $${idx++}`);          values.push(title.trim()); }
  if (amountNgn !== undefined)     { updates.push(`amount_ngn = $${idx++}`);     values.push(Number(amountNgn)); }
  if (expenseDate !== undefined)   { updates.push(`expense_date = $${idx++}`);   values.push(expenseDate); }
  if (categoryId !== undefined)    { updates.push(`category_id = $${idx++}`);    values.push(categoryId || null); }
  if (paymentMethod !== undefined) { updates.push(`payment_method = $${idx++}`); values.push(paymentMethod); }
  if (status !== undefined)        { updates.push(`status = $${idx++}`);         values.push(status); }
  if (receiptUrl !== undefined)    { updates.push(`receipt_url = $${idx++}`);    values.push(receiptUrl || null); }
  if (notes !== undefined)         { updates.push(`notes = $${idx++}`);          values.push(notes || null); }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });

  values.push(id, req.user.orgId);
  const { rows } = await db.query(
    `UPDATE expenses SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
    values
  );
  res.json({ expense: rows[0] });
}

async function deleteExpense(req, res) {
  const { id } = req.params;
  const { rowCount } = await db.query(`DELETE FROM expenses WHERE id = $1 AND org_id = $2`, [id, req.user.orgId]);
  if (!rowCount) return res.status(404).json({ error: 'Expense not found.' });
  res.json({ ok: true });
}

// ── Stats & Summary ───────────────────────────────────────────────────────────

async function getExpenseStats(req, res) {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();

  const [monthRes, yearRes, budgetRes, catRes] = await Promise.all([
    db.query(
      `SELECT COALESCE(SUM(amount_ngn), 0) AS total
       FROM expenses WHERE org_id = $1 AND EXTRACT(MONTH FROM expense_date) = $2 AND EXTRACT(YEAR FROM expense_date) = $3`,
      [req.user.orgId, m, y]
    ),
    db.query(
      `SELECT COALESCE(SUM(amount_ngn), 0) AS total FROM expenses WHERE org_id = $1 AND EXTRACT(YEAR FROM expense_date) = $2`,
      [req.user.orgId, y]
    ),
    db.query(
      `SELECT amount_ngn FROM expense_budgets WHERE org_id = $1 AND period_month = $2 AND period_year = $3 AND category_id IS NULL`,
      [req.user.orgId, m, y]
    ),
    db.query(
      `SELECT ec.name, ec.color, COALESCE(SUM(e.amount_ngn), 0) AS total
       FROM expense_categories ec
       LEFT JOIN expenses e ON e.category_id = ec.id AND e.org_id = ec.org_id
         AND EXTRACT(MONTH FROM e.expense_date) = $2 AND EXTRACT(YEAR FROM e.expense_date) = $3
       WHERE ec.org_id = $1
       GROUP BY ec.id
       ORDER BY total DESC
       LIMIT 6`,
      [req.user.orgId, m, y]
    ),
  ]);

  res.json({
    thisMonth: Number(monthRes.rows[0].total),
    thisYear: Number(yearRes.rows[0].total),
    monthBudget: budgetRes.rows.length ? Number(budgetRes.rows[0].amount_ngn) : null,
    topCategories: catRes.rows.map((r) => ({ ...r, total: Number(r.total) })),
    month: m,
    year: y,
  });
}

async function getMonthlySummary(req, res) {
  const { year } = req.query;
  const y = Number(year) || new Date().getFullYear();

  const { rows } = await db.query(
    `SELECT EXTRACT(MONTH FROM expense_date)::int AS month,
            COALESCE(SUM(amount_ngn), 0) AS total,
            COUNT(*) AS count
     FROM expenses WHERE org_id = $1 AND EXTRACT(YEAR FROM expense_date) = $2
     GROUP BY month ORDER BY month`,
    [req.user.orgId, y]
  );

  // Fill all 12 months
  const byMonth = Object.fromEntries(rows.map((r) => [r.month, r]));
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    total: Number(byMonth[i + 1]?.total || 0),
    count: Number(byMonth[i + 1]?.count || 0),
  }));

  res.json({ months, year: y });
}

// ── Budgets ───────────────────────────────────────────────────────────────────

async function setBudget(req, res) {
  const { month, year, amountNgn, categoryId } = req.body || {};
  const m = Number(month);
  const y = Number(year);
  if (!m || !y || m < 1 || m > 12) return res.status(400).json({ error: 'Valid month and year are required.' });

  if (categoryId) {
    await db.query(
      `INSERT INTO expense_budgets (org_id, category_id, period_month, period_year, amount_ngn)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (org_id, category_id, period_month, period_year)
       WHERE category_id IS NOT NULL
       DO UPDATE SET amount_ngn = EXCLUDED.amount_ngn`,
      [req.user.orgId, categoryId, m, y, Number(amountNgn) || 0]
    );
  } else {
    await db.query(
      `INSERT INTO expense_budgets (org_id, category_id, period_month, period_year, amount_ngn)
       VALUES ($1, NULL, $2, $3, $4)
       ON CONFLICT (org_id, period_month, period_year)
       WHERE category_id IS NULL
       DO UPDATE SET amount_ngn = EXCLUDED.amount_ngn`,
      [req.user.orgId, m, y, Number(amountNgn) || 0]
    );
  }

  res.json({ ok: true });
}

module.exports = {
  listCategories, createCategory, updateCategory, deleteCategory,
  listExpenses, createExpense, updateExpense, deleteExpense,
  getExpenseStats, getMonthlySummary, setBudget,
};
