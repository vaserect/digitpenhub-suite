const db = require('../db');
const { generateWithAI } = require('../utils/aiGenerate');

const BUILTIN_TEMPLATES = [
  {
    id: 'social-post', name: 'Social media post', category: 'marketing',
    prompt: 'Write a {{tone}} social media post for {{platform}} about {{topic}}. Keep it under {{max_length}} characters. Include relevant hashtags. {{audience}} is the target audience.',
  },
  {
    id: 'email-followup', name: 'Email follow-up', category: 'sales',
    prompt: 'Write a {{tone}} follow-up email to {{recipient_name}} regarding {{context}}. Reference our last conversation on {{date}} and suggest a specific next step. Keep it concise and professional.',
  },
  {
    id: 'blog-outline', name: 'Blog post outline', category: 'content',
    prompt: 'Create a detailed blog post outline for "{{topic}}". Include: introduction angle, 3-5 main sections with key points, conclusion with call to action. Target audience: {{audience}}. Desired tone: {{tone}}.',
  },
  {
    id: 'product-desc', name: 'Product description', category: 'commerce',
    prompt: 'Write a compelling {{tone}} product description for {{product_name}}. Key features: {{features}}. Benefits for {{audience}}. Include a persuasive call to action. {{max_length}} words maximum.',
  },
  {
    id: 'press-release', name: 'Press release', category: 'pr',
    prompt: 'Write a professional press release announcing {{announcement}} by {{company}}. Include a headline, dateline, 2-3 body paragraphs with key details, a quote from {{spokesperson}}, and a boilerplate about the company. Tone: {{tone}}.',
  },
  {
    id: 'proposal-summary', name: 'Proposal summary', category: 'sales',
    prompt: 'Write an executive summary for a proposal to {{client_name}}. The proposal covers {{scope}}. Key value propositions: {{value_props}}. Budget: {{budget}}. Timeline: {{timeline}}. Tone: {{tone}}.',
  },
];

async function listTemplates(req, res) {
  const { rows } = await db.query(
    'SELECT id, name, description, category, prompt_template FROM ai_workflow_templates WHERE is_active = true ORDER BY category, name'
  );
  // Merge DB templates with built-in catalog
  const dbMap = {};
  for (const t of rows) dbMap[t.id] = t;
  const merged = BUILTIN_TEMPLATES.map(t => ({
    ...t,
    id: t.id,
    isBuiltin: true,
    ...(dbMap[t.id] ? { prompt_template: dbMap[t.id].prompt_template } : {}),
  }));
  // Add DB-only templates that aren't in the built-in set
  for (const t of rows) {
    if (!BUILTIN_TEMPLATES.find(b => b.id === t.id)) {
      merged.push({ id: t.id, name: t.name, category: t.category, prompt: t.prompt_template, isBuiltin: false });
    }
  }
  res.json({ templates: merged });
}

async function generateFromTemplate(req, res) {
  const { template, variables, moduleKey } = req.body || {};
  if (!template) return res.status(400).json({ error: 'template is required (id or builtin name).' });

  // Resolve template
  let prompt = '';
  let templateName = '';
  const builtin = BUILTIN_TEMPLATES.find(t => t.id === template);
  if (builtin) {
    prompt = builtin.prompt;
    templateName = builtin.name;
  } else {
    const { rows } = await db.query(
      'SELECT prompt_template, name FROM ai_workflow_templates WHERE id = $1 AND is_active = true',
      [template]
    );
    if (!rows.length) return res.status(404).json({ error: 'Template not found.' });
    prompt = rows[0].prompt_template;
    templateName = rows[0].name;
  }

  // Render template variables
  if (variables) {
    for (const [key, val] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(val));
    }
  }

  // Generate via AI router
  const result = await generateWithAI({
    orgId: req.user.orgId,
    feature: moduleKey || 'ai-writer',
    systemPrompt: `You are a professional ${templateName} writer. Generate high-quality content based on the user's request.`,
    userPrompt: prompt,
    fallback: 'Unable to generate content at this time. Please try again.',
  });

  res.json({ content: result.generated || result, templateName });
}

module.exports = { listTemplates, generateFromTemplate };
