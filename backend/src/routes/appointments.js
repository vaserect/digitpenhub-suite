const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const { publicSubmitLimiter } = require('../middleware/rateLimiters');
const {
  listServices, createService, updateService, deleteService,
  getAvailability, saveAvailability,
  listAppointments, updateAppointmentStatus, deleteAppointment, getBookingStats,
  getPublicBookingInfo, createPublicBooking,
} = require('../controllers/appointmentsController');

const router = Router();

// Public — no auth
router.get('/public/:orgId', getPublicBookingInfo);
router.post('/public/:orgId', publicSubmitLimiter, createPublicBooking);

// Protected
router.use(requireAuth);
router.use(requireModuleAccess('appointment-booking'));

router.get('/stats', getBookingStats);

router.get('/services', listServices);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);

router.get('/availability', getAvailability);
router.post('/availability', saveAvailability);

router.get('/', listAppointments);
router.patch('/:id/status', updateAppointmentStatus);
router.delete('/:id', deleteAppointment);

router.post("/bulk-delete", bulkDeleteHandler("appointments"));
router.get("/export", async (req, res) => { const { rows } = await db.query("SELECT * FROM appointments WHERE org_id = $1", [req.user.orgId]); sendCsv(res, "appointments.csv", rows, autoColumns(rows)); });

module.exports = router;
