// utils/aiGenerate.js — replaced direct Anthropic call with ai-router fallback chain
const aiRouter = require('../ai-router');
const { logAiCall } = require('./aiReliability');

const MODULE_KEYS = {
  'ai-writer': 'ai-writer',
  'ai-email-assistant': 'ai-email-assistant',
  'ai-proposal-generator': 'ai-proposal-generator',
  'ai-blog-generator': 'ai-blog-generator',
  'ai-support:generate-answer': 'ai-customer-support',
  'ai-documents:writer': 'ai-writer',
  'ai-documents:email': 'ai-email-assistant',
  'ai-documents:proposal': 'ai-proposal-generator',
  'ai-documents:blog': 'ai-blog-generator',
  'ai-meeting-notes': 'ai-meeting-notes',
  'ai-knowledge-base': 'ai-knowledge-base',
  'ai-translator': 'ai-translator',
};

async function generateWithAI({ orgId, feature, systemPrompt, userPrompt, fallback }) {
  const moduleKey = MODULE_KEYS[feature] || 'ai-writer';
  try {
    const result = await aiRouter.generate({
      moduleKey,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      opts: { maxTokens: 800, temperature: 0.7 },
    });
    logAiCall({ orgId, feature, provider: result.provider, success: true, durationMs: null });
    return { generated: result.text, usedAI: true, provider: result.provider, model: result.model };
  } catch (err) {
    console.error(`${feature} AI generate error:`, err.message);
    logAiCall({ orgId, feature, provider: 'ai-router', success: false, usedFallback: true, errorMessage: err.message });
    return { generated: fallback, usedAI: false, warning: 'AI generation unavailable, used a plain draft instead.' };
  }
}

module.exports = { generateWithAI };
