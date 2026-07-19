const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const damController = require('../controllers/damController');
const { upload, processUpload, handleUploadError } = require('../middleware/upload');
const { bulkDeleteHandler } = require('../utils/bulkDelete');
const { sendCsv, autoColumns } = require('../utils/csv');
const db = require('../db');

const router = Router();
router.use(requireAuth);

// File upload endpoint
router.post('/upload', 
  upload.array('files', 10), 
  handleUploadError,
  processUpload, 
  damController.uploadFiles
);

// Serve asset file
router.get('/serve/:id', damController.serveAsset);

// Asset CRUD operations
router.get('/', damController.getAll);
router.get('/:id', damController.getById);
router.post('/', damController.create);
router.put('/:id', damController.update);
router.delete('/:id', damController.delete);

// Folder operations
router.get('/folders/list', damController.getFolders);
router.post('/folders', damController.createFolder);
router.put('/folders/:id', damController.updateFolder);
router.delete('/folders/:id', damController.deleteFolder);

// Tag operations
router.get('/tags/list', damController.getTags);
router.post('/tags', damController.createTag);
router.delete('/tags/:id', damController.deleteTag);
router.post('/tags/add', damController.addTagToAsset);
router.post('/tags/remove', damController.removeTagFromAsset);

// Bulk operations
router.post('/bulk-delete', bulkDeleteHandler('dam_assets'));

// Export
router.get('/export/csv', async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM dam_assets WHERE org_id = $1 ORDER BY created_at DESC',
    [req.user.orgId]
  );
  sendCsv(res, 'dam_assets.csv', rows, autoColumns(rows));
});

// Stats
router.get('/stats/summary', async (req, res) => {
  const { orgId } = req.user;
  
  const [assetsCount, foldersCount, tagsCount, totalSize] = await Promise.all([
    db.query('SELECT count(*)::int AS total FROM dam_assets WHERE org_id = $1', [orgId]),
    db.query('SELECT count(*)::int AS total FROM dam_folders WHERE org_id = $1', [orgId]),
    db.query('SELECT count(*)::int AS total FROM dam_tags WHERE org_id = $1', [orgId]),
    db.query('SELECT COALESCE(SUM(size_bytes), 0)::bigint AS total FROM dam_assets WHERE org_id = $1', [orgId])
  ]);
  
  res.json({
    assets: assetsCount.rows[0].total,
    folders: foldersCount.rows[0].total,
    tags: tagsCount.rows[0].total,
    totalSizeBytes: totalSize.rows[0].total
  });
});

module.exports = router;

// Image transformation
router.get('/:id/transform', damController.transformAsset);

// Usage tracking
router.get('/:id/usage', damController.getAssetUsage);
router.post('/:id/usage', damController.trackAssetUsage);

// Sharing
router.post('/:id/share', damController.generateShareLink);
router.delete('/:id/share', damController.revokeShareLink);
router.get('/share/:token', damController.accessSharedAsset);

module.exports = router;
