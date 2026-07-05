const db = require('../db');
const { generateWithAI } = require('../utils/aiGenerate');

async function getStats(req, res) {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER(WHERE meeting_date = CURRENT_DATE) AS today,
            COUNT(*) FILTER(WHERE meeting_date >= date_trunc('week',CURRENT_DATE)) AS this_week
     FROM meeting_notes WHERE org_id=$1`, [req.user.orgId]);
  res.json({ stats: rows[0] });
}

async function listNotes(req, res) {
  const { rows } = await db.query(
    `SELECT id,title,meeting_date,attendees,created_at,
            jsonb_array_length(action_items) AS action_count,
            LEFT(notes,100) AS excerpt
     FROM meeting_notes WHERE org_id=$1 ORDER BY meeting_date DESC, created_at DESC`, [req.user.orgId]);
  res.json({ notes: rows });
}

async function getNote(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM meeting_notes WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ note: rows[0] });
}

async function createNote(req, res) {
  const { title, meetingDate, attendees, agenda, notes, actionItems } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'title required.' });
  const { rows } = await db.query(
    `INSERT INTO meeting_notes (org_id,title,meeting_date,attendees,agenda,notes,action_items)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.orgId, title.trim(), meetingDate||new Date().toISOString().slice(0,10),
     JSON.stringify(attendees||[]), agenda||null, notes||null, JSON.stringify(actionItems||[])]
  );
  res.status(201).json({ note: rows[0] });
}

async function updateNote(req, res) {
  const { id } = req.params;
  const { title, meetingDate, attendees, agenda, notes, actionItems } = req.body || {};
  const { rows } = await db.query(
    `UPDATE meeting_notes SET
       title=COALESCE($3,title), meeting_date=COALESCE($4,meeting_date),
       attendees=COALESCE($5,attendees), agenda=$6, notes=$7,
       action_items=COALESCE($8,action_items), updated_at=NOW()
     WHERE id=$1 AND org_id=$2 RETURNING *`,
    [id, req.user.orgId, title||null, meetingDate||null,
     attendees ? JSON.stringify(attendees) : null,
     agenda??null, notes??null,
     actionItems ? JSON.stringify(actionItems) : null]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  res.json({ note: rows[0] });
}

async function deleteNote(req, res) {
  await db.query(`DELETE FROM meeting_notes WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  res.json({ ok: true });
}

async function summarize(req, res) {
  const { rows } = await db.query(`SELECT * FROM meeting_notes WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'Not found.' });
  const note = rows[0];
  if (!note.notes?.trim()) return res.status(400).json({ error: 'This meeting has no notes text to summarize yet.' });
  const result = await generateWithAI({
    orgId: req.user.orgId,
    feature: 'meeting-notes:summarize',
    systemPrompt: 'You summarize meeting notes. Reply with a short summary paragraph, then a "Action items:" section listing one action item per line prefixed with "- ". No other formatting.',
    userPrompt: `Meeting: ${note.title}\nAttendees: ${(note.attendees||[]).join(', ')}\n\nNotes:\n${note.notes}`,
    fallback: `[ANTHROPIC_API_KEY isn't configured, so no AI summary is available. Review the notes below and add action items manually.]`,
  });
  res.json(result);
}

module.exports = { getStats, listNotes, getNote, createNote, updateNote, deleteNote, summarize };
