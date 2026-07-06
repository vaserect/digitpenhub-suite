const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const c = require('../controllers/savedDesignsController');
const r = Router();
r.use(requireAuth);

// Shared across three Creative-tools modules — gate on whichever the request
// is actually for, since each has its own plan-access slug (matches the
// convention in app.js for every other module-mounted route).
function gateByTool(req, res, next) {
  const tool = req.query.tool || req.body?.tool;
  if (!tool) return res.status(400).json({ error: 'tool is required.' });
  return requireModuleAccess(tool)(req, res, next);
}

r.get('/',        gateByTool, c.listDesigns);
r.post('/',        gateByTool, c.createDesign);
r.get('/:id',      c.getDesign);
r.put('/:id',      c.updateDesign);
r.delete('/:id',   c.deleteDesign);
module.exports = r;
