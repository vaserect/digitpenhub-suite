const db = require('../db');
const { fetchWithTimeout, logAiCall } = require('../utils/aiReliability');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS total, COUNT(DISTINCT target_lang) AS languages
     FROM ai_translations WHERE org_id=$1`, [req.user.orgId]);
  res.json({ stats: rows[0] });
}

async function listHistory(req, res) {
  const { rows } = await db.query(
    `SELECT id,source_lang,target_lang,LEFT(source_text,80) AS source_preview,
            LEFT(translated_text,80) AS translation_preview,created_at
     FROM ai_translations WHERE org_id=$1 ORDER BY created_at DESC LIMIT 50`, [req.user.orgId]);
  res.json({ history: rows });
}

async function translate(req, res) {
  const { text, sourceLang, targetLang } = req.body || {};
  if (!text?.trim() || !targetLang) return res.status(400).json({ error: 'text and targetLang required.' });
  const sl = sourceLang || 'en';
  const startedAt = Date.now();
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sl}|${targetLang}`;
    const response = await fetchWithTimeout(url, {}, 10000);
    const data = await response.json();
    if (!response.ok || data.responseStatus !== 200) throw new Error(data.responseDetails || 'Translation failed');
    const translated = data.responseData.translationText;
    const { rows } = await db.query(
      `INSERT INTO ai_translations (org_id,source_lang,target_lang,source_text,translated_text)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.orgId, sl, targetLang, text.trim(), translated]
    );
    logAiCall({ orgId: req.user.orgId, feature: 'ai-translator', provider: 'mymemory', success: true, durationMs: Date.now() - startedAt });
    res.json({ translation: translated, record: rows[0] });
  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
    console.error('Translation error:', err.message);
    logAiCall({ orgId: req.user.orgId, feature: 'ai-translator', provider: 'mymemory', success: false, errorMessage: isTimeout ? 'Timed out after 10s' : err.message, durationMs: Date.now() - startedAt });
    res.status(502).json({ error: isTimeout ? 'Translation service timed out. Try again.' : 'Translation service unavailable. Try again.' });
  }
}

async function deleteHistory(req, res) {
  await db.query(`DELETE FROM ai_translations WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

module.exports = { getStats, listHistory, translate, deleteHistory };
