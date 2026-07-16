const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiters');
const multer = require('multer');
const path = require('path');

const {
  // Accounts
  listAccounts, connectAccount, disconnectAccount, reconnectAccount, checkAllHealth, getAccountAnalytics,
  // Workspaces
  listWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace,
  // Posts
  listPosts, getPost, createPost, updatePost, deletePost, duplicatePost,
  // Scheduling
  schedulePost, publishNow, cancelPost,
  // Calendar
  getCalendar, reschedulePost,
  // Media
  listMedia, uploadMedia, deleteMedia, createMediaFolder, listMediaFolders,
} = require('../controllers/socialMediaController');

const router = Router();

// All endpoints require auth
router.use(requireAuth);

// ---- ACCOUNTS ----
router.get('/accounts', listAccounts);
router.post('/accounts/connect', uploadLimiter, connectAccount);
router.delete('/accounts/:id', disconnectAccount);
router.post('/accounts/:id/reconnect', reconnectAccount);
router.post('/accounts/check-health', checkAllHealth);
router.get('/accounts/:id/analytics', getAccountAnalytics);

// ---- WORKSPACES ----
router.get('/workspaces', listWorkspaces);
router.post('/workspaces', uploadLimiter, createWorkspace);
router.put('/workspaces/:id', updateWorkspace);
router.delete('/workspaces/:id', deleteWorkspace);

// ---- POSTS ----
router.get('/posts', listPosts);
router.get('/posts/:id', getPost);
router.post('/posts', uploadLimiter, createPost);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);
router.post('/posts/:id/duplicate', duplicatePost);

// ---- SCHEDULING ----
router.post('/posts/:id/schedule', uploadLimiter, schedulePost);
router.post('/posts/:id/publish-now', uploadLimiter, publishNow);
router.post('/posts/:id/cancel', cancelPost);

// ---- CALENDAR ----
router.get('/calendar', getCalendar);
router.put('/calendar/reschedule', uploadLimiter, reschedulePost);

// ---- MEDIA ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/social-media')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)),
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|mp4|mov|avi|webm|mp3|wav|ogg|pdf|zip/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  },
});

router.get('/media', listMedia);
router.post('/media/upload', uploadLimiter, upload.single('file'), uploadMedia);
router.delete('/media/:id', deleteMedia);
router.post('/media/folders', uploadLimiter, createMediaFolder);
router.get('/media/folders', listMediaFolders);

module.exports = router;
