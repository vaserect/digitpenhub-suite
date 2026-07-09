const { searchImages } = require('../utils/pexels');

async function search(req, res) {
  const { q, orientation, page } = req.query;
  if (!q || !q.trim()) return res.json({ images: [] });
  try {
    const images = await searchImages(q, { orientation, page: page ? Number(page) : 1 });
    res.json({ images });
  } catch (err) {
    res.status(502).json({ error: err.message || 'Image search failed.' });
  }
}

// Public (rate-limited) — for marketing landing pages only
async function publicSearch(req, res) {
  const { q, orientation, page, perPage } = req.query;
  if (!q || !q.trim()) return res.json({ images: [] });
  try {
    const images = await searchImages(q, { orientation, page: page ? Number(page) : 1, perPage: perPage ? Math.min(Number(perPage), 20) : 10 });
    res.json({ images });
  } catch (err) {
    res.status(502).json({ error: err.message || 'Image search failed.' });
  }
}

module.exports = { search, publicSearch };
