/**
 * Social Media Scheduler Routes
 * 
 * Direct controller mapping for the Social Media Scheduler module.
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const c = require('../controllers/socialMediaController');

// All routes require authentication and module access
router.use(requireAuth);
router.use(requireModuleAccess('social-media-scheduler'));

// ── Connected Accounts ────────────────────────────────
router.get('/accounts', c.listAccounts);
router.post('/accounts', c.connectAccount);
router.put('/accounts/:id', c.reconnectAccount);
router.delete('/accounts/:id', c.disconnectAccount);
router.get('/accounts/health', c.checkAllHealth);
router.get('/accounts/:id/analytics', c.getAccountAnalytics);

// ── Workspaces ────────────────────────────────────────
router.get('/workspaces', c.listWorkspaces);
router.post('/workspaces', c.createWorkspace);
router.put('/workspaces/:id', c.updateWorkspace);
router.delete('/workspaces/:id', c.deleteWorkspace);

// ── Posts Management ──────────────────────────────────
router.get('/posts', c.listPosts);
router.post('/posts', c.createPost);
router.get('/posts/:id', c.getPost);
router.put('/posts/:id', c.updatePost);
router.delete('/posts/:id', c.deletePost);
router.post('/posts/:id/duplicate', c.duplicatePost);

// ── Scheduling Actions ─────────────────────────────────
router.post('/posts/:id/schedule', c.schedulePost);
router.post('/posts/:id/publish', c.publishNow);
router.post('/posts/:id/publish-now', c.publishNow); // Frontend fallback
router.post('/posts/:id/cancel', c.cancelPost);

// ── Calendar & Queue ──────────────────────────────────
router.get('/calendar', c.getCalendar);
router.post('/calendar/reschedule', c.reschedulePost); // Matches ContentCalendar.jsx
router.get('/calendar/export', c.exportCalendar);

// ── Approvals & Comments ──────────────────────────────
router.post('/posts/:id/submit-approval', c.submitForApproval);
router.post('/posts/:id/approve', c.approvePost);
router.post('/posts/:id/reject', c.rejectPost);
router.get('/approvals', c.listApprovals);
router.get('/posts/:id/approvals/history', c.getPostApprovalHistory);

router.get('/posts/:id/comments', c.listComments);
router.post('/posts/:id/comments', c.addComment);
router.delete('/posts/comments/:commentId', c.deleteComment);

// ── Activity History ──────────────────────────────────
router.get('/posts/:id/activity', c.getPostActivity);

// ── Media Library ─────────────────────────────────────
router.get('/media', c.listMedia);
router.post('/media', c.uploadMedia);
router.post('/media/upload', c.uploadMedia); // Frontend fallback
router.delete('/media/:id', c.deleteMedia);
router.get('/media/folders', c.listMediaFolders);
router.post('/media/folders', c.createMediaFolder);

module.exports = router;