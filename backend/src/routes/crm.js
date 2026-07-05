const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireUsageCapacity } = require('../utils/planAccess');
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

module.exports = router;
