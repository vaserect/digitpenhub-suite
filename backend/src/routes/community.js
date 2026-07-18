const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { requireAuth } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(requireAuth);

// ==================== SPACES ====================
router.get('/spaces', communityController.getSpaces);
router.get('/spaces/:id', communityController.getSpace);
router.post('/spaces', communityController.createSpace);
router.put('/spaces/:id', communityController.updateSpace);
router.delete('/spaces/:id', communityController.deleteSpace);

// Space membership
router.post('/spaces/:id/join', communityController.joinSpace);
router.post('/spaces/:id/leave', communityController.leaveSpace);
router.get('/spaces/:id/members', communityController.getSpaceMembers);
router.put('/spaces/:id/members/:userId', communityController.updateMemberRole);
router.delete('/spaces/:id/members/:userId', communityController.removeMember);

// Space analytics
router.get('/spaces/:id/analytics', communityController.getSpaceAnalytics);

// ==================== POSTS ====================
router.get('/spaces/:spaceId/posts', communityController.getPosts);
router.post('/spaces/:spaceId/posts', communityController.createPost);
router.get('/posts/:id', communityController.getPost);
router.put('/posts/:id', communityController.updatePost);
router.delete('/posts/:id', communityController.deletePost);
router.post('/posts/:id/pin', communityController.togglePinPost);
router.post('/posts/:id/lock', communityController.toggleLockPost);

// ==================== COMMENTS ====================
router.get('/posts/:postId/comments', communityController.getComments);
router.post('/posts/:postId/comments', communityController.createComment);
router.put('/comments/:id', communityController.updateComment);
router.delete('/comments/:id', communityController.deleteComment);
router.post('/comments/:id/solution', communityController.markAsSolution);

// ==================== EVENTS ====================
router.get('/events', communityController.getEvents);
router.get('/events/:id', communityController.getEvent);
router.post('/events', communityController.createEvent);
router.put('/events/:id', communityController.updateEvent);
router.delete('/events/:id', communityController.deleteEvent);
router.post('/events/:id/rsvp', communityController.rsvpEvent);
router.get('/events/:id/attendees', communityController.getEventAttendees);

// ==================== REACTIONS ====================
router.post('/reactions', communityController.addReaction);
router.delete('/reactions/:targetType/:targetId', communityController.removeReaction);

// ==================== MEMBERS ====================
router.get('/members', communityController.getMembers);
router.get('/members/:userId/profile', communityController.getMemberProfile);
router.put('/members/profile', communityController.updateMemberProfile);

// ==================== MEMBER TIERS ====================
router.get('/tiers', communityController.getTiers);
router.post('/tiers', communityController.createTier);
router.put('/tiers/:id', communityController.updateTier);
router.delete('/tiers/:id', communityController.deleteTier);
router.post('/members/:userId/tiers/:tierId', communityController.assignTier);

// ==================== NOTIFICATIONS ====================
router.get('/notifications', communityController.getNotifications);
router.put('/notifications/:id/read', communityController.markNotificationRead);
router.put('/notifications/read-all', communityController.markAllNotificationsRead);

// ==================== ACTIVITY FEED ====================
router.get('/activity', communityController.getActivityFeed);

// ==================== ANALYTICS ====================
router.get('/analytics', communityController.getAnalytics);

module.exports = router;
