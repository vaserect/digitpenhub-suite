// ai-router/config.js
// Central config for the AI provider fallback router.

module.exports = {
  providers: {
    groq: {
      enabled: !!process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
      models: {
        'llama-3.3-70b-versatile': { rpm: 30, rpd: 1000, tpm: 12000 },
        'gemma2-9b-it': { rpm: 30, rpd: 1000, tpm: 15000 },
      },
      defaultModel: 'llama-3.3-70b-versatile',
    },

    gemini: {
      enabled: !!process.env.GEMINI_API_KEY,
      apiKey: process.env.GEMINI_API_KEY,
      models: {
        'gemini-2.5-flash-lite': { rpm: 30, rpd: 1500, tpm: 1000000 },
      },
      defaultModel: 'gemini-2.5-flash-lite',
      trainingDataWarning: true,
    },

    openrouter: {
      enabled: !!process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      models: {
        'google/gemma-4-26b-a4b-it:free': { rpm: 20, rpd: 50 },
        'openai/gpt-oss-20b:free': { rpm: 20, rpd: 50 },
      },
      defaultModel: 'google/gemma-4-26b-a4b-it:free',
    },

    anthropic: {
      enabled: !!process.env.ANTHROPIC_API_KEY,
      apiKey: process.env.ANTHROPIC_API_KEY,
      models: { 'claude-sonnet-4-6': {} },
      defaultModel: 'claude-sonnet-4-6',
      premium: true,
    },

    openai: {
      enabled: !!process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
      models: { 'gpt-4o-mini': {} },
      defaultModel: 'gpt-4o-mini',
      premium: true,
    },
  },

  chains: {
    budget: ['groq', 'gemini', 'openrouter'],
    quality: ['anthropic', 'groq', 'gemini'],
    default: ['groq', 'gemini', 'openrouter', 'anthropic'],
  },

  moduleChains: {
    'ai-writer': 'budget',
    'ai-blog-generator': 'budget',
    'ai-email-assistant': 'budget',
    'ai-meeting-notes': 'budget',
    'ai-content-repurposing': 'budget',
    'ai-workflow-suggestions': 'budget',
    'ai-voice-transcription': 'budget',
    'ai-data-enrichment': 'budget',
    'ai-image-generator': 'budget',
    'ai-voice-agent': 'budget',
    'ai-avatar': 'budget',
    'ai-translator': 'budget',
    'predictive-sales': 'budget',
    'churn-prediction': 'budget',
    'anomaly-detection': 'budget',
    'cross-sell-upsell': 'budget',
    'ai-proposal-generator': 'quality',
    'ai-sales-call-coach': 'quality',
    'ai-data-analyst': 'quality',
    'ai-chatbot-builder': 'default',
    'ai-customer-support': 'default',
    'ai-knowledge-base': 'default',
  },
};
