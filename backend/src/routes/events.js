const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { requireAuth } = require('../middleware/auth');

// ==================== EVENTS ====================

// Get all events
router.get('/', requireAuth, eventsController.getEvents);

// Get event statistics
router.get('/statistics', requireAuth, eventsController.getStatistics);

// Get upcoming events
router.get('/upcoming', requireAuth, eventsController.getUpcomingEvents);

// Get event by ID
router.get('/:id', requireAuth, eventsController.getEventById);

// Create event
router.post('/', requireAuth, eventsController.createEvent);

// Update event
router.put('/:id', requireAuth, eventsController.updateEvent);

// Delete event
router.delete('/:id', requireAuth, eventsController.deleteEvent);

// Duplicate event
router.post('/:id/duplicate', requireAuth, eventsController.duplicateEvent);

// Cancel event
router.post('/:id/cancel', requireAuth, eventsController.cancelEvent);

// Start event (go live)
router.post('/:id/start', requireAuth, eventsController.startEvent);

// End event
router.post('/:id/end', requireAuth, eventsController.endEvent);

// ==================== REGISTRATIONS ====================

// Register for event (public endpoint - no auth)
router.post('/:id/register', eventsController.registerForEvent);

// Get registrations for event
router.get('/:id/registrations', requireAuth, eventsController.getRegistrations);

// Approve registration
router.post('/:id/registrations/:regId/approve', requireAuth, eventsController.approveRegistration);

// Reject registration
router.post('/:id/registrations/:regId/reject', requireAuth, eventsController.rejectRegistration);

// ==================== LANDING PAGES ====================

// Get event by slug (public endpoint - no auth)
router.get('/public/:slug', eventsController.getEventBySlug);

// Update landing page
router.put('/:id/landing-page', requireAuth, eventsController.updateLandingPage);

// ==================== CHAT ====================

// Send chat message
router.post('/:id/chat', requireAuth, eventsController.sendChatMessage);

// Get chat messages
router.get('/:id/chat', requireAuth, eventsController.getChatMessages);

// ==================== Q&A ====================

// Submit question (public endpoint - no auth for attendees)
router.post('/:id/questions', eventsController.submitQuestion);

// Get questions
router.get('/:id/questions', requireAuth, eventsController.getQuestions);

// Answer question
router.post('/:id/questions/:qId/answer', requireAuth, eventsController.answerQuestion);

// Upvote question (public endpoint - no auth)
router.post('/:id/questions/:qId/upvote', eventsController.upvoteQuestion);

// ==================== POLLS ====================

// Create poll
router.post('/:id/polls', requireAuth, eventsController.createPoll);

// Get polls
router.get('/:id/polls', requireAuth, eventsController.getPolls);

// Launch poll
router.post('/:id/polls/:pollId/launch', requireAuth, eventsController.launchPoll);

// Close poll
router.post('/:id/polls/:pollId/close', requireAuth, eventsController.closePoll);

// Submit poll response (public endpoint - no auth)
router.post('/:id/polls/:pollId/respond', eventsController.submitPollResponse);

// Get poll results
router.get('/:id/polls/:pollId/results', requireAuth, eventsController.getPollResults);

module.exports = router;
