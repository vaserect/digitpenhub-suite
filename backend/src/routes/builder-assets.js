const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const { uploadLimiter } = require('../middleware/rateLimiters');
const multer = require('multer');
const path = require('path');
const {
  listAssets,
  getAsset,
  uploadAsset,
  updateAsset,
  deleteAsset,
  createFolder,
  listFolders,
  moveAsset,
  getAssetUsage
} = require('../controllers/builderAssetsController');

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/builder-assets'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg|mp4|webm|pdf|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only images, videos, PDFs, and ZIP files are allowed.'));
  }
});

// Protected routes
router.use(requireAuth);
router.use(requireModuleAccess('website-builder'));

// Asset CRUD
router.get('/', listAssets);
router.get('/:id', getAsset);
router.post('/upload', uploadLimiter, upload.single('file'), uploadAsset);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

// Folder management
router.post('/folders', uploadLimiter, createFolder);
router.get('/folders/list', listFolders);

// Asset operations
router.post('/:id/move', moveAsset);
router.get('/:id/usage', getAssetUsage);

module.exports = router;
