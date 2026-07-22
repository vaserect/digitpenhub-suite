/**
 * Module CRUD Route — flat routes for every module with a DB table.
 * Routes at /api/v1/module/{slug}/list, /api/v1/module/{slug}/stats, etc.
 */
const { Router } = require('express');
const { createCrudController } = require('../controllers/crudController');
const { CRUD_MODULES } = require('../routes/config/moduleRoutes');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

// Build all controllers at startup
const controllers = {};
for (const [slug, cfg] of Object.entries(CRUD_MODULES)) {
  controllers[slug] = createCrudController(cfg.table, { searchColumns: cfg.search, exportName: slug });
}

// Middleware to resolve slug from path
router.param('slug', (req, res, next, slug) => {
  if (!controllers[slug]) {
    return res.status(404).json({ error: `Module '${slug}' not found` });
  }
  req.moduleSlug = slug;
  req.moduleCtrl = controllers[slug];
  next();
});

// Expose controllers map for direct access
router.controllers = controllers;

// Per-module routes
router.get('/:slug/stats',   (req, res) => req.moduleCtrl.stats(req, res));
router.get('/:slug/export',  (req, res) => req.moduleCtrl.export(req, res));
router.get('/:slug',         (req, res) => req.moduleCtrl.list(req, res));
router.post('/:slug',        (req, res) => req.moduleCtrl.create(req, res));
router.get('/:slug/:id',     (req, res) => req.moduleCtrl.get(req, res));
router.put('/:slug/:id',     (req, res) => req.moduleCtrl.update(req, res));
router.delete('/:slug/:id',  (req, res) => req.moduleCtrl.delete(req, res));

module.exports = router;
