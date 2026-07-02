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

router.get('/', listExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

router.post('/budgets', setBudget);

module.exports = router;
