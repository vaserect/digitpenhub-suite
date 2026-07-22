// ai-router/providers/anthropic.js
// Paid provider for the quality chain. No local rate-limit tracking.

async function chat({ apiKey, model, messages, maxTokens = 1024, temperature = 0.7 }) {
  const systemMsg = messages.find(m => m.role === 'system');
  const conversation = messages.filter(m => m.role !== 'system');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemMsg?.content,
      messages: conversation,
    }),
  });

  if (!res.ok) {
    const err = new Error(`Anthropic request failed: ${res.status}`);
    err.status = res.status;
    err.body = await res.text().catch(() => '');
    throw err;
  }

  const data = await res.json();
  const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') ?? '';
  return { text, raw: data };
}

module.exports = { chat };
