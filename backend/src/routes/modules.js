const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { listModules } = require('../controllers/modulesController');

const router = express.Router();

router.get('/', requireAuth, listModules);

module.exports = router;
