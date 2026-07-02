const db = require('../db');
const { fetchWithTimeout, logAiCall } = require('../utils/aiReliability');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT doc_type, COUNT(*) AS count FROM ai_documents WHERE org_id=$1 GROUP BY doc_type`,
    [req.user.orgId]);
  const stats = {};
  rows.forEach((r) => { stats[r.doc_type] = Number(r.count); });
  res.json({ stats });
}

async function listDocuments(req, res) {
  const { type } = req.query;
  const { rows } = await db.query(
    `SELECT id,doc_type,title,tags,created_at,updated_at,
            LEFT(content,120) AS excerpt
     FROM ai_documents WHERE org_id=$1 ${type ? 'AND doc_type=$2' : ''} ORDER BY updated_at DESC`,
    type ? [req.user.orgId, type] : [req.user.orgId]
  );
  res.json({ documents: rows });
}

async function getDocument(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM ai_documents WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ document: rows[0] });
}

async function createDocument(req, res) {
  const { docType, title, content, promptUsed, tags } = req.body || {};
  if (!title?.trim() || !docType) return res.status(400).json({ error: 'title and docType required.' });
  const { rows } = await db.query(
    `INSERT INTO ai_documents (org_id,doc_type,title,content,prompt_used,tags)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.orgId, docType, title.trim(), content||'', promptUsed||null, JSON.stringify(tags||[])]
  );
  res.status(201).json({ document: rows[0] });
}

async function updateDocument(req, res) {
  const { id } = req.params;
  const { title, content, tags } = req.body || {};
  const { rows } = await db.query(
    `UPDATE ai_documents SET title=COALESCE($3,title), content=COALESCE($4,content),
       tags=COALESCE($5,tags), updated_at=NOW()
     WHERE id=$1 AND org_id=$2 RETURNING *`,
    [id, req.user.orgId, title||null, content??null, tags ? JSON.stringify(tags) : null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ document: rows[0] });
}

async function deleteDocument(req, res) {
  await db.query(`DELETE FROM ai_documents WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function generateContent(req, res) {
  const { type, prompt, context } = req.body || {};
  if (!type || !prompt) return res.status(400).json({ error: 'type and prompt required.' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logAiCall({ orgId: req.user.orgId, feature: `ai-documents:${type}`, provider: 'anthropic', success: true, usedFallback: true, errorMessage: 'No ANTHROPIC_API_KEY configured' });
    return res.json({ generated: buildTemplate(type, prompt, context), usedAI: false });
  }
  const startedAt = Date.now();
  try {
    const systemPrompts = {
      writer: 'You are a professional content writer. Write clear, engaging, well-structured content based on the prompt.',
      email: 'You are an expert email copywriter. Write professional, conversion-focused emails based on the prompt.',
      proposal: 'You are a business proposal expert. Write compelling, structured business proposals based on the prompt.',
      blog: 'You are a professional blogger and SEO content writer. Write engaging blog posts with proper headings and structure.',
    };
    const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: systemPrompts[type] || systemPrompts.writer,
        messages: [{ role: 'user', content: `${prompt}${context ? `\n\nContext: ${context}` : ''}` }]
      })
    });
    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const data = await response.json();
    const generated = data.content?.[0]?.text || '';
    logAiCall({ orgId: req.user.orgId, feature: `ai-documents:${type}`, provider: 'anthropic', success: true, durationMs: Date.now() - startedAt });
    res.json({ generated, usedAI: true });
  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
    console.error('AI generate error:', err.message);
    logAiCall({ orgId: req.user.orgId, feature: `ai-documents:${type}`, provider: 'anthropic', success: false, usedFallback: true, errorMessage: isTimeout ? 'Timed out after 15s' : err.message, durationMs: Date.now() - startedAt });
    res.json({ generated: buildTemplate(type, prompt, context), usedAI: false, warning: isTimeout ? 'AI request timed out, used template instead.' : 'AI unavailable, used template.' });
  }
}

function buildTemplate(type, prompt, context) {
  const templates = {
    writer: `# ${prompt}\n\n## Introduction\n[Write your introduction here]\n\n## Main Content\n[Expand on the topic]\n\n## Key Points\n- Point 1\n- Point 2\n- Point 3\n\n## Conclusion\n[Summarise and call to action]`,
    email: `Subject: ${prompt}\n\nDear [Name],\n\n[Opening paragraph - state your purpose]\n\n[Body - provide details and value]\n\n[Call to action]\n\nBest regards,\n[Your Name]`,
    proposal: `# Business Proposal: ${prompt}\n\n## Executive Summary\n[Brief overview]\n\n## Problem Statement\n[Describe the challenge]\n\n## Proposed Solution\n[Detail your solution]\n\n## Scope of Work\n- Deliverable 1\n- Deliverable 2\n\n## Timeline\n[Project timeline]\n\n## Investment\n[Pricing details]\n\n## Why Us\n[Your value proposition]`,
    blog: `# ${prompt}\n\n*[Author] · [Date] · [X] min read*\n\n## Introduction\n[Hook the reader]\n\n## [Section 1 Heading]\n[Content]\n\n## [Section 2 Heading]\n[Content]\n\n## [Section 3 Heading]\n[Content]\n\n## Conclusion\n[Wrap up and CTA]\n\n---\n*Tags: [tag1], [tag2]*`,
  };
  return templates[type] || templates.writer;
}

module.exports = { getStats, listDocuments, getDocument, createDocument, updateDocument, deleteDocument, generateContent };
