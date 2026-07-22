// ai-router/router.js
// Orchestrates the fallback chain: tries each provider in order, checks the
// local rate limiter before calling, retries once with jittered backoff on
// retryable errors, then moves to the next provider.

const config = require('./config');
const rateLimiter = require('./rateLimiter');
const openaiCompatible = require('./providers/openaiCompatible');
const gemini = require('./providers/gemini');
const anthropic = require('./providers/anthropic');

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function callProvider(providerName, providerConf, model, messages, opts) {
  const modelLimits = providerConf.models[model];

  if (!rateLimiter.canProceed(providerName, model, modelLimits)) {
    const e = new Error(`Local rate limit reached for ${providerName}/${model}`);
    e.code = 'RATE_LIMITED_LOCAL';
    throw e;
  }

  let result;
  if (providerName === 'gemini') {
    result = await gemini.chat({ apiKey: providerConf.apiKey, model, messages, ...opts });
  } else if (providerName === 'anthropic') {
    result = await anthropic.chat({ apiKey: providerConf.apiKey, model, messages, ...opts });
  } else {
    const extraHeaders = providerName === 'openrouter'
      ? { 'HTTP-Referer': process.env.APP_URL || 'https://suite.digitpenhub.com', 'X-Title': 'Digitpen Hub Suite' }
      : {};
    result = await openaiCompatible.chat({ baseURL: providerConf.baseURL, apiKey: providerConf.apiKey, model, messages, extraHeaders, ...opts });
  }

  rateLimiter.record(providerName, model);
  return result;
}

async function generate({ moduleKey, messages, opts = {}, chainOverride }) {
  const chainName = chainOverride || config.moduleChains[moduleKey] || 'default';
  const chain = config.chains[chainName];

  if (!chain || chain.length === 0) {
    throw new Error(`No provider chain configured for "${chainName}"`);
  }

  const attempts = [];

  for (const providerName of chain) {
    const providerConf = config.providers[providerName];
    if (!providerConf || !providerConf.enabled) {
      attempts.push({ provider: providerName, skipped: 'not configured (missing API key)' });
      continue;
    }

    const model = opts.model || providerConf.defaultModel;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await callProvider(providerName, providerConf, model, messages, opts);
        return { ...result, provider: providerName, model, chain: chainName, attempts };
      } catch (err) {
        const status = err.status;
        const retryable = err.code === 'RATE_LIMITED_LOCAL' || RETRYABLE_STATUS.has(status);
        attempts.push({ provider: providerName, model, attempt, error: err.message, status });

        if (!retryable) break;
        if (attempt === 0) await sleep(500 + Math.random() * 500);
      }
    }
  }

  const e = new Error('All providers in chain failed or are rate-limited');
  e.attempts = attempts;
  throw e;
}

module.exports = { generate, rateLimiter, config };
