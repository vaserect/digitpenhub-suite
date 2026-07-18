const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/whatsappSegmentsController');

const r = Router();
r.use(requireAuth);

// Segment CRUD
r.get('/', c.listSegments);
r.post('/', c.createSegment);
r.get('/:id', c.getSegment);
r.put('/:id', c.updateSegment);
r.delete('/:id', c.deleteSegment);

// Segment operations
r.get('/:id/contacts', c.getSegmentContacts);
r.post('/:id/recalculate', c.recalculateSegment);
r.post('/recalculate-all', c.recalculateAllSegments);

module.exports = r;
