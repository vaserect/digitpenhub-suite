// ai-router/providers/openaiCompatible.js
// Groq, OpenRouter, and OpenAI all speak OpenAI's /chat/completions shape.

async function chat({ baseURL, apiKey, model, messages, maxTokens = 1024, temperature = 0.7, extraHeaders = {} }) {
  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
  });

  if (!res.ok) {
    const err = new Error(`Provider request failed: ${res.status}`);
    err.status = res.status;
    err.body = await res.text().catch(() => '');
    throw err;
  }

  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content ?? '', raw: data };
}

module.exports = { chat };
