const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const crypto = require('crypto');

// Ensure upload directories exist
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const THUMBS_DIR = path.join(UPLOAD_DIR, 'thumbs');

async function ensureDirectories() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(THUMBS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directories:', error);
  }
}

ensureDirectories();

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureDirectories();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const sanitized = basename.replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${Date.now()}-${uniqueSuffix}-${sanitized}${ext}`);
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
    // Videos
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
    // Documents
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    // Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 10 // Max 10 files per request
  }
});

// Middleware to process uploaded files
async function processUpload(req, res, next) {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const processedFiles = [];

    for (const file of req.files) {
      const fileData = {
        filename: file.originalname,
        diskPath: file.path,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        width: null,
        height: null,
        thumbPath: null
      };

      // Generate thumbnail for images
      if (file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') {
        try {
          const metadata = await sharp(file.path).metadata();
          fileData.width = metadata.width;
          fileData.height = metadata.height;

          // Generate thumbnail (300x300 max, maintain aspect ratio)
          const thumbFilename = `thumb_${path.basename(file.filename)}`;
          const thumbPath = path.join(THUMBS_DIR, thumbFilename);
          
          await sharp(file.path)
            .resize(300, 300, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toFile(thumbPath);

          fileData.thumbPath = thumbPath;
        } catch (error) {
          console.error('Failed to process image:', error);
          // Continue without thumbnail
        }
      }

      processedFiles.push(fileData);
    }

    req.processedFiles = processedFiles;
    next();
  } catch (error) {
    next(error);
  }
}

// Error handler for multer errors
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 100MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 10 files per upload.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  
  next();
}

module.exports = {
  upload,
  processUpload,
  handleUploadError,
  UPLOAD_DIR,
  THUMBS_DIR
};
