const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  listCategories, createCategory, updateCategory, deleteCategory,
  listExpenses, createExpense, updateExpense, deleteExpense,
  getExpenseStats, getMonthlySummary, setBudget,
} = require('../controllers/expensesController');

const router = Router();
router.use(requireAuth);

router.get('/stats', getExpenseStats);
router.get('/summary', getMonthlySummary);

router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.post('/categories/bulk-delete', bulkDeleteHandler('expense_categories'));
router.get('/categories/export', async (req, res) => { const { rows } = await db.query("SELECT * FROM expense_categories WHERE org_id = $1", [req.user.orgId]); sendCsv(res, "expense_categories.csv", rows, autoColumns(rows)); });

router.get('/', listExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

router.post('/budgets', setBudget);

router.post("/bulk-delete", bulkDeleteHandler("expenses"));
router.get("/export", async (req, res) => { const { rows } = await db.query("SELECT * FROM expenses WHERE org_id = $1", [req.user.orgId]); sendCsv(res, "expenses.csv", rows, autoColumns(rows)); });

module.exports = router;
