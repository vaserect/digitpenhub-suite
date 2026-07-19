const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/smsSegmentsController');

const r = Router();
r.use(requireAuth);

r.get('/', c.listSegments);
r.get('/:id', c.getSegment);
r.post('/', c.createSegment);
r.put('/:id', c.updateSegment);
r.delete('/:id', c.deleteSegment);
r.post('/:id/recalculate', c.recalculateSegment);
r.get('/:id/members', c.getSegmentMembers);
r.post('/:id/members', c.addContactToSegment);
r.delete('/:id/members', c.removeContactFromSegment);

module.exports = r;
