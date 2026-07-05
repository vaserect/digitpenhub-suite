const { fetchWithTimeout, logAiCall } = require('./aiReliability');

// Shared Claude call used by the "AI" modules (Chatbot Builder, Meeting
// Notes, Knowledge Base, Customer Support) so each gets genuinely
// AI-generated drafts instead of being plain manual-entry CRUD with "AI"
// branding. Mirrors aiDocumentsController's pattern: falls back to a plain
// labeled template when ANTHROPIC_API_KEY isn't configured, rather than
// failing or pretending.
async function generateWithAI({ orgId, feature, systemPrompt, userPrompt, fallback }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logAiCall({ orgId, feature, provider: 'anthropic', success: false, usedFallback: true, errorMessage: 'No ANTHROPIC_API_KEY configured' });
    return { generated: fallback, usedAI: false };
  }
  const startedAt = Date.now();
  try {
    const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const data = await response.json();
    const generated = data.content?.[0]?.text || '';
    logAiCall({ orgId, feature, provider: 'anthropic', success: true, durationMs: Date.now() - startedAt });
    return { generated, usedAI: true };
  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
    console.error(`${feature} AI generate error:`, err.message);
    logAiCall({ orgId, feature, provider: 'anthropic', success: false, usedFallback: true, errorMessage: isTimeout ? 'Timed out after 15s' : err.message, durationMs: Date.now() - startedAt });
    return { generated: fallback, usedAI: false, warning: isTimeout ? 'AI request timed out, used a plain draft instead.' : 'AI unavailable, used a plain draft instead.' };
  }
}

module.exports = { generateWithAI };
