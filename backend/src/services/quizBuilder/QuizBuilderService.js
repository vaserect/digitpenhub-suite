const db = require('../../db');

/**
 * QuizBuilderService
 * 
 * Enterprise-grade quiz builder service matching Outgrow/Interact benchmarks.
 * Supports scored quizzes, personality assessments, outcome-based quizzes,
 * branching logic, custom results pages, analytics, and lead capture.
 */
class QuizBuilderService {
  /**
   * Get quiz statistics for an organization
   */
  async getStats(orgId) {
    const { rows } = await db.query(
      `SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER(WHERE published) AS published,
        COALESCE(SUM(responses_count), 0) AS total_responses,
        COALESCE(SUM(views_count), 0) AS total_views,
        COALESCE(SUM(starts_count), 0) AS total_starts,
        COALESCE(AVG(completion_rate), 0) AS avg_completion_rate
       FROM quizzes 
       WHERE org_id = $1`,
      [orgId]
    );
    return rows[0];
  }

  /**
   * List all quizzes for an organization
   */
  async listQuizzes(orgId, filters = {}) {
    let query = `
      SELECT 
        id, title, description, quiz_type, status, published,
        responses_count, views_count, starts_count, completion_rate,
        lead_capture_enabled, template_id, created_at, updated_at,
        jsonb_array_length(questions) AS question_count
      FROM quizzes 
      WHERE org_id = $1
    `;
    const params = [orgId];
    let paramIndex = 2;

    if (filters.quiz_type) {
      query += ` AND quiz_type = $${paramIndex}`;
      params.push(filters.quiz_type);
      paramIndex++;
    }

    if (filters.published !== undefined) {
      query += ` AND published = $${paramIndex}`;
      params.push(filters.published);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Get a single quiz by ID
   */
  async getQuiz(quizId, orgId) {
    const { rows } = await db.query(
      `SELECT * FROM quizzes WHERE id = $1 AND org_id = $2`,
      [quizId, orgId]
    );
    
    if (!rows.length) {
      throw new Error('Quiz not found');
    }

    const quiz = rows[0];

    // Load outcomes if they exist
    const { rows: outcomes } = await db.query(
      `SELECT * FROM quiz_outcomes WHERE quiz_id = $1 ORDER BY display_order, min_score`,
      [quizId]
    );
    quiz.outcomes = outcomes;

    // Load branching rules if they exist
    const { rows: rules } = await db.query(
      `SELECT * FROM quiz_branching_rules WHERE quiz_id = $1`,
      [quizId]
    );
    quiz.branching_rules = rules;

    return quiz;
  }

  /**
   * Get public quiz (for anonymous respondents)
   * Strips sensitive data like correct answers
   */
  async getPublicQuiz(quizId) {
    const { rows } = await db.query(
      `SELECT id, title, description, questions, settings, quiz_type,
              lead_capture_enabled, lead_capture_position, lead_capture_fields,
              social_sharing_enabled, show_progress_bar, randomize_questions, randomize_answers
       FROM quizzes 
       WHERE id = $1 AND published = true`,
      [quizId]
    );

    if (!rows.length) {
      throw new Error('Quiz not found or not published');
    }

    const quiz = rows[0];

    // Strip correct answers from questions
    const questions = (quiz.questions || []).map(({ correct_answer, personality_weights, outcome_mapping, ...rest }) => rest);
    quiz.questions = questions;

    // Load outcomes (for display after completion)
    const { rows: outcomes } = await db.query(
      `SELECT id, title, description, image_url, cta_text, cta_url 
       FROM quiz_outcomes 
       WHERE quiz_id = $1 
       ORDER BY display_order`,
      [quizId]
    );
    quiz.outcomes = outcomes;

    // Increment views count
    await db.query(
      `UPDATE quizzes SET views_count = views_count + 1 WHERE id = $1`,
      [quizId]
    );

    // Track analytics
    await this.trackAnalytics(quizId, 'view');

    return quiz;
  }

  /**
   * Create a new quiz
   */
  async createQuiz(orgId, data) {
    const {
      title,
      description,
      quiz_type = 'scored',
      questions = [],
      settings = {},
      template_id,
      lead_capture_enabled = false,
      lead_capture_position = 'end',
      lead_capture_fields = ['name', 'email'],
      social_sharing_enabled = false,
      retake_allowed = true,
      show_progress_bar = true,
      randomize_questions = false,
      randomize_answers = false,
      pass_percentage,
      certificate_enabled = false
    } = data;

    if (!title?.trim()) {
      throw new Error('Quiz title is required');
    }

    const { rows } = await db.query(
      `INSERT INTO quizzes (
        org_id, title, description, quiz_type, questions, settings,
        template_id, lead_capture_enabled, lead_capture_position, lead_capture_fields,
        social_sharing_enabled, retake_allowed, show_progress_bar,
        randomize_questions, randomize_answers, pass_percentage, certificate_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        orgId, title.trim(), description || null, quiz_type,
        JSON.stringify(questions), JSON.stringify(settings),
        template_id || null, lead_capture_enabled, lead_capture_position,
        JSON.stringify(lead_capture_fields), social_sharing_enabled,
        retake_allowed, show_progress_bar, randomize_questions,
        randomize_answers, pass_percentage || null, certificate_enabled
      ]
    );

    return rows[0];
  }

  /**
   * Update an existing quiz
   */
  async updateQuiz(quizId, orgId, data) {
    const fields = [];
    const values = [quizId, orgId];
    let paramIndex = 3;

    const allowedFields = [
      'title', 'description', 'quiz_type', 'questions', 'settings',
      'published', 'status', 'lead_capture_enabled', 'lead_capture_position',
      'lead_capture_fields', 'social_sharing_enabled', 'retake_allowed',
      'show_progress_bar', 'randomize_questions', 'randomize_answers',
      'pass_percentage', 'certificate_enabled'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        let value = data[field];
        
        // JSON fields need stringification
        if (['questions', 'settings', 'lead_capture_fields'].includes(field) && typeof value === 'object') {
          value = JSON.stringify(value);
        }

        fields.push(`${field} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);

    const { rows } = await db.query(
      `UPDATE quizzes SET ${fields.join(', ')} 
       WHERE id = $1 AND org_id = $2 
       RETURNING *`,
      values
    );

    if (!rows.length) {
      throw new Error('Quiz not found');
    }

    return rows[0];
  }

  /**
   * Delete a quiz
   */
  async deleteQuiz(quizId, orgId) {
    const { rowCount } = await db.query(
      `DELETE FROM quizzes WHERE id = $1 AND org_id = $2`,
      [quizId, orgId]
    );

    if (rowCount === 0) {
      throw new Error('Quiz not found');
    }

    return { success: true };
  }

  /**
   * Submit a quiz response
   */
  async submitResponse(quizId, data) {
    const { answers, respondentName, respondentEmail, respondentPhone, customFields, startedAt, deviceType, referrer, utmSource, utmMedium, utmCampaign } = data;

    // Get quiz details
    const { rows: qRows } = await db.query(
      `SELECT org_id, questions, quiz_type, settings FROM quizzes WHERE id = $1 AND published = true`,
      [quizId]
    );

    if (!qRows.length) {
      throw new Error('Quiz not found or not published');
    }

    const { org_id: orgId, questions: quizQuestions, quiz_type: quizType, settings } = qRows[0];
    const questions = quizQuestions || [];

    // Calculate score and determine outcome
    let score = 0;
    let maxScore = 0;
    let personalityType = null;
    let outcomeId = null;

    if (quizType === 'scored') {
      // Scored quiz: calculate points
      (answers || []).forEach((a, i) => {
        const q = questions[i];
        if (!q) return;

        const points = q.points || 10;
        
        if (q.type === 'multiple_choice') {
          maxScore += points;
          if (q.correct_answer !== undefined && a.answer === q.correct_answer) {
            score += points;
          }
        } else if (q.type === 'true_false') {
          maxScore += points;
          if (q.correct_answer !== undefined && a.answer === q.correct_answer) {
            score += points;
          }
        }
      });

      // Find matching outcome based on score
      const { rows: outcomes } = await db.query(
        `SELECT id FROM quiz_outcomes 
         WHERE quiz_id = $1 AND $2 >= COALESCE(min_score, 0) AND $2 <= COALESCE(max_score, 999999)
         ORDER BY min_score DESC LIMIT 1`,
        [quizId, score]
      );
      if (outcomes.length) {
        outcomeId = outcomes[0].id;
      }

    } else if (quizType === 'personality') {
      // Personality quiz: calculate personality weights
      const weights = {};
      (answers || []).forEach((a, i) => {
        const q = questions[i];
        if (!q || !q.personality_weights) return;

        const selectedOption = a.answer;
        const optionWeights = q.personality_weights[selectedOption] || {};
        
        for (const [type, weight] of Object.entries(optionWeights)) {
          weights[type] = (weights[type] || 0) + weight;
        }
      });

      // Determine dominant personality type
      personalityType = Object.keys(weights).reduce((a, b) => weights[a] > weights[b] ? a : b, null);

      // Find matching outcome
      const { rows: outcomes } = await db.query(
        `SELECT id FROM quiz_outcomes WHERE quiz_id = $1 AND personality_type = $2 LIMIT 1`,
        [quizId, personalityType]
      );
      if (outcomes.length) {
        outcomeId = outcomes[0].id;
      }

    } else if (quizType === 'outcome_based') {
      // Outcome-based quiz: map answers to outcomes
      const outcomeCounts = {};
      (answers || []).forEach((a, i) => {
        const q = questions[i];
        if (!q || !q.outcome_mapping) return;

        const selectedOption = a.answer;
        const outcomeKey = q.outcome_mapping[selectedOption];
        if (outcomeKey) {
          outcomeCounts[outcomeKey] = (outcomeCounts[outcomeKey] || 0) + 1;
        }
      });

      // Determine dominant outcome
      const dominantOutcome = Object.keys(outcomeCounts).reduce((a, b) => 
        outcomeCounts[a] > outcomeCounts[b] ? a : b, null
      );

      // Find matching outcome
      const { rows: outcomes } = await db.query(
        `SELECT id FROM quiz_outcomes WHERE quiz_id = $1 AND outcome_key = $2 LIMIT 1`,
        [quizId, dominantOutcome]
      );
      if (outcomes.length) {
        outcomeId = outcomes[0].id;
      }
    }

    // Calculate time spent
    const timeSpent = startedAt ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000) : null;

    // Insert response
    const { rows } = await db.query(
      `INSERT INTO quiz_responses (
        quiz_id, org_id, answers, score, max_score, outcome_id, personality_type,
        respondent_name, respondent_email, time_spent, started_at, device_type,
        referrer, utm_source, utm_medium, utm_campaign
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        quizId, orgId, JSON.stringify(answers || []), score, maxScore || null,
        outcomeId, personalityType, respondentName || null, respondentEmail || null,
        timeSpent, startedAt || null, deviceType || null, referrer || null,
        utmSource || null, utmMedium || null, utmCampaign || null
      ]
    );

    const response = rows[0];

    // Update quiz stats
    await db.query(
      `UPDATE quizzes SET 
        responses_count = responses_count + 1,
        completion_rate = CASE 
          WHEN starts_count > 0 THEN (responses_count + 1)::DECIMAL / starts_count * 100
          ELSE 0
        END
       WHERE id = $1`,
      [quizId]
    );

    // Track analytics
    await this.trackAnalytics(quizId, 'completion', { score, timeSpent });

    // Handle lead capture if enabled
    if (settings.leadCaptureEnabled && respondentEmail) {
      await this.captureLeadFromQuiz(quizId, orgId, response.id, {
        name: respondentName,
        email: respondentEmail,
        phone: respondentPhone,
        customFields,
        outcomeId,
        score,
        personalityType
      });
    }

    // Get outcome details for response
    if (outcomeId) {
      const { rows: outcomeRows } = await db.query(
        `SELECT id, title, description, image_url, cta_text, cta_url FROM quiz_outcomes WHERE id = $1`,
        [outcomeId]
      );
      response.outcome = outcomeRows[0] || null;
    }

    return { response, score, maxScore, personalityType, outcomeId };
  }

  /**
   * Track quiz analytics
   */
  async trackAnalytics(quizId, eventType, data = {}) {
    const { rows: quizRows } = await db.query(
      `SELECT org_id FROM quizzes WHERE id = $1`,
      [quizId]
    );

    if (!quizRows.length) return;

    const orgId = quizRows[0].org_id;
    const today = new Date().toISOString().split('T')[0];

    if (eventType === 'view') {
      await db.query(
        `INSERT INTO quiz_analytics (quiz_id, org_id, date, views)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (quiz_id, date)
         DO UPDATE SET views = quiz_analytics.views + 1, updated_at = NOW()`,
        [quizId, orgId, today]
      );
    } else if (eventType === 'start') {
      await db.query(
        `INSERT INTO quiz_analytics (quiz_id, org_id, date, starts)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (quiz_id, date)
         DO UPDATE SET starts = quiz_analytics.starts + 1, updated_at = NOW()`,
        [quizId, orgId, today]
      );

      await db.query(
        `UPDATE quizzes SET starts_count = starts_count + 1 WHERE id = $1`,
        [quizId]
      );
    } else if (eventType === 'completion') {
      const { score, timeSpent } = data;
      
      await db.query(
        `INSERT INTO quiz_analytics (quiz_id, org_id, date, completions, avg_completion_time, avg_score)
         VALUES ($1, $2, $3, 1, $4, $5)
         ON CONFLICT (quiz_id, date)
         DO UPDATE SET 
           completions = quiz_analytics.completions + 1,
           avg_completion_time = (quiz_analytics.avg_completion_time * quiz_analytics.completions + $4) / (quiz_analytics.completions + 1),
           avg_score = CASE 
             WHEN $5 IS NOT NULL THEN (COALESCE(quiz_analytics.avg_score, 0) * quiz_analytics.completions + $5) / (quiz_analytics.completions + 1)
             ELSE quiz_analytics.avg_score
           END,
           updated_at = NOW()`,
        [quizId, orgId, today, timeSpent, score]
      );
    }
  }

  /**
   * Capture lead from quiz completion
   */
  async captureLeadFromQuiz(quizId, orgId, responseId, leadData) {
    const { name, email, phone, company, customFields, outcomeId, score, personalityType } = leadData;

    // Check if contact already exists in CRM
    let contactId = null;
    if (email) {
      const { rows: contactRows } = await db.query(
        `SELECT id FROM contacts WHERE org_id = $1 AND email = $2 LIMIT 1`,
        [orgId, email]
      );

      if (contactRows.length) {
        contactId = contactRows[0].id;
        
        // Update existing contact with quiz data
        await db.query(
          `UPDATE contacts SET 
            custom_fields = custom_fields || $1::jsonb,
            updated_at = NOW()
           WHERE id = $2`,
          [JSON.stringify({ quiz_score: score, quiz_personality: personalityType, ...customFields }), contactId]
        );
      } else {
        // Create new contact
        const { rows: newContactRows } = await db.query(
          `INSERT INTO contacts (org_id, name, email, phone, company, source, custom_fields)
           VALUES ($1, $2, $3, $4, $5, 'quiz', $6)
           RETURNING id`,
          [orgId, name, email, phone, company, JSON.stringify({ quiz_score: score, quiz_personality: personalityType, ...customFields })]
        );
        contactId = newContactRows[0].id;
      }
    }

    // Insert lead capture record
    await db.query(
      `INSERT INTO quiz_lead_captures (
        quiz_id, org_id, response_id, contact_id, name, email, phone, company,
        custom_fields, outcome_id, score, personality_type, lead_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'quiz')`,
      [
        quizId, orgId, responseId, contactId, name, email, phone, company,
        JSON.stringify(customFields || {}), outcomeId, score, personalityType
      ]
    );

    return { contactId };
  }

  /**
   * List quiz responses
   */
  async listResponses(quizId, orgId, filters = {}) {
    let query = `
      SELECT r.*, o.title as outcome_title
      FROM quiz_responses r
      LEFT JOIN quiz_outcomes o ON r.outcome_id = o.id
      WHERE r.quiz_id = $1 AND r.org_id = $2
    `;
    const params = [quizId, orgId];
    let paramIndex = 3;

    if (filters.minScore !== undefined) {
      query += ` AND r.score >= $${paramIndex}`;
      params.push(filters.minScore);
      paramIndex++;
    }

    if (filters.maxScore !== undefined) {
      query += ` AND r.score <= $${paramIndex}`;
      params.push(filters.maxScore);
      paramIndex++;
    }

    query += ` ORDER BY r.completed_at DESC LIMIT ${filters.limit || 50}`;

    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Get quiz analytics
   */
  async getAnalytics(quizId, orgId, dateRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const { rows } = await db.query(
      `SELECT * FROM quiz_analytics 
       WHERE quiz_id = $1 AND org_id = $2 AND date >= $3
       ORDER BY date DESC`,
      [quizId, orgId, startDate.toISOString().split('T')[0]]
    );

    return rows;
  }

  /**
   * Get quiz templates
   */
  async getTemplates(filters = {}) {
    let query = `SELECT * FROM quiz_templates WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (filters.category) {
      query += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.quiz_type) {
      query += ` AND quiz_type = $${paramIndex}`;
      params.push(filters.quiz_type);
      paramIndex++;
    }

    query += ` ORDER BY usage_count DESC, name ASC`;

    const { rows } = await db.query(query, params);
    return rows;
  }

  /**
   * Create quiz from template
   */
  async createFromTemplate(orgId, templateId, customizations = {}) {
    const { rows: templateRows } = await db.query(
      `SELECT * FROM quiz_templates WHERE id = $1`,
      [templateId]
    );

    if (!templateRows.length) {
      throw new Error('Template not found');
    }

    const template = templateRows[0];

    // Increment template usage
    await db.query(
      `UPDATE quiz_templates SET usage_count = usage_count + 1 WHERE id = $1`,
      [templateId]
    );

    // Create quiz from template
    const quizData = {
      title: customizations.title || template.name,
      description: customizations.description || template.description,
      quiz_type: template.quiz_type,
      questions: template.questions,
      settings: { ...template.settings, ...customizations.settings },
      template_id: templateId
    };

    const quiz = await this.createQuiz(orgId, quizData);

    // Create outcomes from template
    if (template.outcomes && template.outcomes.length) {
      for (const outcome of template.outcomes) {
        await db.query(
          `INSERT INTO quiz_outcomes (
            quiz_id, org_id, title, description, min_score, max_score,
            personality_type, outcome_key, cta_text, cta_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            quiz.id, orgId, outcome.title, outcome.description,
            outcome.min_score || null, outcome.max_score || null,
            outcome.personality_type || null, outcome.outcome_key || null,
            outcome.cta_text || null, outcome.cta_url || null
          ]
        );
      }
    }

    return quiz;
  }

  /**
   * Manage quiz outcomes
   */
  async createOutcome(quizId, orgId, outcomeData) {
    const { rows } = await db.query(
      `INSERT INTO quiz_outcomes (
        quiz_id, org_id, title, description, image_url, min_score, max_score,
        personality_type, outcome_key, cta_text, cta_url, display_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        quizId, orgId, outcomeData.title, outcomeData.description || null,
        outcomeData.image_url || null, outcomeData.min_score || null,
        outcomeData.max_score || null, outcomeData.personality_type || null,
        outcomeData.outcome_key || null, outcomeData.cta_text || null,
        outcomeData.cta_url || null, outcomeData.display_order || 0
      ]
    );

    return rows[0];
  }

  async updateOutcome(outcomeId, orgId, outcomeData) {
    const { rows } = await db.query(
      `UPDATE quiz_outcomes SET
        title = COALESCE($3, title),
        description = COALESCE($4, description),
        image_url = COALESCE($5, image_url),
        min_score = COALESCE($6, min_score),
        max_score = COALESCE($7, max_score),
        personality_type = COALESCE($8, personality_type),
        outcome_key = COALESCE($9, outcome_key),
        cta_text = COALESCE($10, cta_text),
        cta_url = COALESCE($11, cta_url),
        display_order = COALESCE($12, display_order),
        updated_at = NOW()
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [
        outcomeId, orgId, outcomeData.title, outcomeData.description,
        outcomeData.image_url, outcomeData.min_score, outcomeData.max_score,
        outcomeData.personality_type, outcomeData.outcome_key,
        outcomeData.cta_text, outcomeData.cta_url, outcomeData.display_order
      ]
    );

    if (!rows.length) {
      throw new Error('Outcome not found');
    }

    return rows[0];
  }

  async deleteOutcome(outcomeId, orgId) {
    const { rowCount } = await db.query(
      `DELETE FROM quiz_outcomes WHERE id = $1 AND org_id = $2`,
      [outcomeId, orgId]
    );

    if (rowCount === 0) {
      throw new Error('Outcome not found');
    }

    return { success: true };
  }
}

module.exports = new QuizBuilderService();
