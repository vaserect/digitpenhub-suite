const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { PDFDocument, degrees } = require('pdf-lib');
const multer = require('multer');

const r = Router();
r.use(requireAuth);

// Use memory storage — process in-memory, return result
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ── Merge PDFs ────────────────────────────────────────────────────────────────
r.post('/merge', upload.array('files', 20), async (req, res) => {
  if (!req.files?.length || req.files.length < 2) {
    return res.status(400).json({ error: 'Upload at least 2 PDF files.' });
  }
  const merged = await PDFDocument.create();
  for (const file of req.files) {
    const doc = await PDFDocument.load(file.buffer);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const bytes = await merged.save();
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="merged.pdf"' });
  res.send(Buffer.from(bytes));
});

// ── Split PDF ─────────────────────────────────────────────────────────────────
// Returns JSON with base64-encoded pages so the client can download each
r.post('/split', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Upload a PDF file.' });
  const { pages: pageSpec } = req.body || {}; // e.g. "1-3,5,7-9" or blank = all

  const src = await PDFDocument.load(req.file.buffer);
  const total = src.getPageCount();

  let indices = [];
  if (pageSpec?.trim()) {
    for (const part of pageSpec.split(',')) {
      const [a, b] = part.trim().split('-').map((n) => parseInt(n, 10) - 1);
      if (!isNaN(b)) {
        for (let i = a; i <= Math.min(b, total - 1); i++) indices.push(i);
      } else if (!isNaN(a) && a >= 0 && a < total) {
        indices.push(a);
      }
    }
  } else {
    indices = src.getPageIndices();
  }
  if (!indices.length) return res.status(400).json({ error: 'No valid pages in range.' });

  const results = [];
  for (const idx of indices) {
    const single = await PDFDocument.create();
    const [page] = await single.copyPages(src, [idx]);
    single.addPage(page);
    const bytes = await single.save();
    results.push({ page: idx + 1, data: Buffer.from(bytes).toString('base64') });
  }
  res.json({ total: results.length, pages: results });
});

// ── Compress PDF (re-save with pdf-lib, strips some metadata) ─────────────────
r.post('/compress', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Upload a PDF file.' });
  const doc = await PDFDocument.load(req.file.buffer, { updateMetadata: false });
  // pdf-lib re-save removes cross-reference streams and compresses object streams
  const bytes = await doc.save({ useObjectStreams: true });
  const original = req.file.size;
  const compressed = bytes.length;
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="compressed.pdf"',
    'X-Original-Size': original,
    'X-Compressed-Size': compressed,
  });
  res.send(Buffer.from(bytes));
});

// ── Rotate PDF pages ──────────────────────────────────────────────────────────
r.post('/rotate', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Upload a PDF file.' });
  const angle = parseInt(req.body.angle || '90', 10);
  if (![90, 180, 270].includes(angle)) return res.status(400).json({ error: 'angle must be 90, 180, or 270.' });

  const doc = await PDFDocument.load(req.file.buffer);
  doc.getPages().forEach((p) => p.setRotation(degrees((p.getRotation().angle + angle) % 360)));
  const bytes = await doc.save();
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="rotated.pdf"' });
  res.send(Buffer.from(bytes));
});

// ── PDF info (page count, metadata) ──────────────────────────────────────────
r.post('/info', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Upload a PDF file.' });
  const doc = await PDFDocument.load(req.file.buffer);
  const pages = doc.getPages();
  res.json({
    pageCount: doc.getPageCount(),
    title: doc.getTitle() || null,
    author: doc.getAuthor() || null,
    subject: doc.getSubject() || null,
    creator: doc.getCreator() || null,
    fileSize: req.file.size,
    pages: pages.map((p, i) => {
      const { width, height } = p.getSize();
      return { page: i + 1, width: Math.round(width), height: Math.round(height) };
    }),
  });
});

module.exports = r;
