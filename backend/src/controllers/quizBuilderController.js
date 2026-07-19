const QuizBuilderService = require('../services/quizBuilder/QuizBuilderService');

async function getStats(req, res) {
  try {
    const stats = await QuizBuilderService.getStats(req.user.orgId);
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function listQuizzes(req, res) {
  try {
    const filters = {
      quiz_type: req.query.quiz_type,
      published: req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined,
      search: req.query.search,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };
    const quizzes = await QuizBuilderService.listQuizzes(req.user.orgId, filters);
    res.json({ quizzes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getQuiz(req, res) {
  try {
    const quiz = await QuizBuilderService.getQuiz(req.params.id, req.user.orgId);
    res.json({ quiz });
  } catch (error) {
    if (error.message === 'Quiz not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

async function createQuiz(req, res) {
  try {
    const quiz = await QuizBuilderService.createQuiz(req.user.orgId, req.body);
    res.status(201).json({ quiz });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function updateQuiz(req, res) {
  try {
    const quiz = await QuizBuilderService.updateQuiz(req.params.id, req.user.orgId, req.body);
    res.json({ quiz });
  } catch (error) {
    if (error.message === 'Quiz not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
}

async function deleteQuiz(req, res) {
  try {
    await QuizBuilderService.deleteQuiz(req.params.id, req.user.orgId);
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'Quiz not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

// Public endpoint - no auth required
async function getPublicQuiz(req, res) {
  try {
    const quiz = await QuizBuilderService.getPublicQuiz(req.params.id);
    res.json({ quiz });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('not published')) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }
    res.status(500).json({ error: error.message });
  }
}

// Public endpoint - no auth required
async function submitResponse(req, res) {
  try {
    const result = await QuizBuilderService.submitResponse(req.params.quizId, req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('not published')) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }
    res.status(400).json({ error: error.message });
  }
}

async function listResponses(req, res) {
  try {
    const filters = {
      minScore: req.query.minScore ? parseInt(req.query.minScore) : undefined,
      maxScore: req.query.maxScore ? parseInt(req.query.maxScore) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };
    const responses = await QuizBuilderService.listResponses(req.params.quizId, req.user.orgId, filters);
    res.json({ responses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getAnalytics(req, res) {
  try {
    const dateRange = req.query.days ? parseInt(req.query.days) : 30;
    const analytics = await QuizBuilderService.getAnalytics(req.params.quizId, req.user.orgId, dateRange);
    res.json({ analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getTemplates(req, res) {
  try {
    const filters = {
      category: req.query.category,
      quiz_type: req.query.quiz_type
    };
    const templates = await QuizBuilderService.getTemplates(filters);
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createFromTemplate(req, res) {
  try {
    const { templateId, customizations } = req.body;
    if (!templateId) {
      return res.status(400).json({ error: 'Template ID is required' });
    }
    const quiz = await QuizBuilderService.createFromTemplate(req.user.orgId, templateId, customizations || {});
    res.status(201).json({ quiz });
  } catch (error) {
    if (error.message === 'Template not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
}

// Outcome management
async function createOutcome(req, res) {
  try {
    const outcome = await QuizBuilderService.createOutcome(req.params.quizId, req.user.orgId, req.body);
    res.status(201).json({ outcome });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function updateOutcome(req, res) {
  try {
    const outcome = await QuizBuilderService.updateOutcome(req.params.outcomeId, req.user.orgId, req.body);
    res.json({ outcome });
  } catch (error) {
    if (error.message === 'Outcome not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
}

async function deleteOutcome(req, res) {
  try {
    await QuizBuilderService.deleteOutcome(req.params.outcomeId, req.user.orgId);
    res.json({ ok: true });
  } catch (error) {
    if (error.message === 'Outcome not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getStats,
  listQuizzes,
  getQuiz,
  getPublicQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitResponse,
  listResponses,
  getAnalytics,
  getTemplates,
  createFromTemplate,
  createOutcome,
  updateOutcome,
  deleteOutcome
};