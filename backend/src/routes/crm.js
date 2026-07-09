const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireUsageCapacity } = require('../utils/planAccess');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const {
  listContacts, createContact, updateContact, deleteContact,
  listContactNotes, createContactNote, deleteContactNote,
  listContactTasks, createContactTask, updateContactTask, deleteContactTask,
  bulkCreateContacts,
} = require('../controllers/crmController');

const router = express.Router();

const capContacts = requireUsageCapacity('contacts', `SELECT COUNT(*)::int AS count FROM contacts WHERE org_id = $1`);

router.get('/contacts', requireAuth, listContacts);
router.post('/contacts', requireAuth, capContacts, createContact);
router.post('/contacts/import', requireAuth, bulkCreateContacts);
router.patch('/contacts/:id', requireAuth, updateContact);
router.delete('/contacts/:id', requireAuth, deleteContact);

router.get('/contacts/:contactId/notes', requireAuth, listContactNotes);
router.post('/contacts/:contactId/notes', requireAuth, createContactNote);
router.delete('/contacts/:contactId/notes/:noteId', requireAuth, deleteContactNote);

router.get('/contacts/:contactId/tasks', requireAuth, listContactTasks);
router.post('/contacts/:contactId/tasks', requireAuth, createContactTask);
router.patch('/contacts/:contactId/tasks/:taskId', requireAuth, updateContactTask);
router.delete('/contacts/:contactId/tasks/:taskId', requireAuth, deleteContactTask);

router.post('/contacts/bulk-delete', requireAuth, bulkDeleteHandler('contacts'));
router.get('/contacts/export', requireAuth, async (req, res) => {
  const { rows } = await db.query('SELECT id, full_name, company, email, phone, stage, value_ngn, last_touch_at, tags, created_at FROM contacts WHERE org_id = $1 ORDER BY last_touch_at DESC', [req.user.orgId]);
  sendCsv(res, 'contacts.csv', rows, autoColumns(rows));
});
router.get('/contacts/stats', requireAuth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE stage='new')::int AS new,
            count(*) FILTER (WHERE stage='contacted')::int AS contacted,
            count(*) FILTER (WHERE stage='proposal_sent')::int AS proposal_sent,
            count(*) FILTER (WHERE stage='won')::int AS won,
            count(*) FILTER (WHERE stage='lost')::int AS lost,
            COALESCE(sum(value_ngn),0)::numeric AS total_value
     FROM contacts WHERE org_id = $1`,
    [req.user.orgId]
  );
  res.json({ stats: rows[0] });
});

module.exports = router;
