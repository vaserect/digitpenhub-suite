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

module.exports = { search };
