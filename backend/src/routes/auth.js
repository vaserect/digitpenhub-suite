const express = require('express');
const rateLimit = require('express-rate-limit');
const { uploadLimiter } = require('../middleware/rateLimiters');
const multer = require('multer');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const {
  register, login, verifyMfa, logout, me, changePassword,
  forgotPassword, resetPassword,
  updateProfile, updateEmail, uploadAvatar, getAvatar,
  setup2fa, confirm2fa, disable2fa, regenerateBackup,
  listSessions, revokeSession, revokeAllOtherSessions,
  getAuditLog,
} = require('../controllers/authController');

const router = express.Router();

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/avatars')),
  filename: (req, file, cb) => {
    const unique = `${req.user.id}-${Date.now()}`;
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype)) {
      return cb(new Error('Only PNG, JPEG, GIF, or WEBP images are allowed.'));
    }
    cb(null, true);
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' },
});

// Public
router.post('/register', loginLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/verify-mfa', loginLimiter, verifyMfa);
router.post('/forgot-password', loginLimiter, forgotPassword);
router.post('/reset-password', loginLimiter, resetPassword);

// Protected
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);
router.post('/change-password', requireAuth, loginLimiter, changePassword);
router.patch('/me', requireAuth, updateProfile);
router.patch('/me/email', requireAuth, loginLimiter, updateEmail);
router.post('/me/avatar', requireAuth, uploadLimiter, (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload failed.' });
    next();
  });
}, uploadAvatar);
router.get('/avatar/:filename', requireAuth, getAvatar);

// 2FA management (requires existing session)
router.get('/2fa/setup', requireAuth, setup2fa);
router.post('/2fa/confirm', requireAuth, confirm2fa);
router.post('/2fa/disable', requireAuth, disable2fa);
router.post('/2fa/regenerate-backup', requireAuth, regenerateBackup);

// Session management
router.get('/sessions', requireAuth, listSessions);
router.delete('/sessions/:id', requireAuth, revokeSession);
router.post('/sessions/revoke-all-others', requireAuth, revokeAllOtherSessions);

// Audit log
router.get('/audit-log', requireAuth, getAuditLog);

module.exports = router;
