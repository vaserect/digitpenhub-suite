const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireUsageCapacity } = require('../utils/planAccess');
const { listContacts, createContact, updateContact, deleteContact } = require('../controllers/crmController');

const router = express.Router();

const capContacts = requireUsageCapacity('contacts', `SELECT COUNT(*)::int AS count FROM contacts WHERE org_id = $1`);

router.get('/contacts', requireAuth, listContacts);
router.post('/contacts', requireAuth, capContacts, createContact);
router.patch('/contacts/:id', requireAuth, updateContact);
router.delete('/contacts/:id', requireAuth, deleteContact);

module.exports = router;
