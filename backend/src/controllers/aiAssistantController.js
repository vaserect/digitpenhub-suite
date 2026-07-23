const db = require('../db');
const { generateWithAI } = require('../utils/aiGenerate');

const CONTEXT_PROMPTS = {
  crm: 'You are a CRM assistant. Help the user with contacts, deals, pipelines, and sales tracking. Keep answers concise and actionable.',
  invoices: 'You are an invoicing assistant. Help with creating, sending, and tracking invoices and payments.',
  'email-marketing': 'You are an email marketing assistant. Help with campaigns, segments, templates, and deliverability.',
  hr: 'You are an HR assistant. Help with employee records, payroll, leave management, and recruitment.',
  'project-management': 'You are a project management assistant. Help with tasks, timelines, milestones, and team coordination.',
  default: 'You are a helpful business software assistant. Answer questions about using the Digitpen Hub Suite platform.',
};

async function askAssistant(req, res) {
  const { moduleSlug, question } = req.body || {};
  if (!question) return res.status(400).json({ error: 'question is required.' });

  const systemPrompt = CONTEXT_PROMPTS[moduleSlug] || CONTEXT_PROMPTS.default;
  const prompt = `${systemPrompt}\n\nUser question: ${question}\n\nProvide a helpful, specific answer about how to accomplish this in Digitpen Hub Suite. If the question involves steps, list them clearly.`;

  const result = await generateWithAI({
    orgId: req.user.orgId,
    feature: 'ai-writer',
    systemPrompt,
    userPrompt: question,
    fallback: 'Try navigating to the module and clicking the "+ New" button to get started.',
  });

  res.json({ answer: result.generated || result, moduleSlug });
}

module.exports = { askAssistant };
