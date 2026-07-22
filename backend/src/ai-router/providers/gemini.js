// ai-router/providers/gemini.js
// Gemini's REST API uses its own message format, not OpenAI-compatible.

async function chat({ apiKey, model, messages, maxTokens = 1024, temperature = 0.7 }) {
  const systemMsg = messages.find(m => m.role === 'system');
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  const body = { contents, generationConfig: { maxOutputTokens: maxTokens, temperature } };
  if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = new Error(`Gemini request failed: ${res.status}`);
    err.status = res.status;
    err.body = await res.text().catch(() => '');
    throw err;
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ?? '';
  return { text, raw: data };
}

module.exports = { chat };
