const EventService = require('../services/EventService');
const db = require('../db');
const { validate } = require('../utils/validator');

const eventService = new EventService(db);

/**
 * Events Controller - Handles HTTP requests for event/webinar management
 */

// ==================== EVENTS ====================

/**
 * Get all events
 */
exports.getEvents = async (req, res) => {
  try {
    const { status, type, startDate, endDate, limit, offset } = req.query;
    const orgId = req.user.org_id;

    const events = await eventService.getEvents(orgId, {
      status,
      type,
      startDate,
      endDate,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get event by ID
 */
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const event = await eventService.getEventById(parseInt(id), orgId);
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error getting event:', error);
    res.status(error.message === 'Event not found' ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create event
 */
exports.createEvent = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const userId = req.user.id;

    const event = await eventService.createEvent(req.body, orgId, userId);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Update event
 */
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const event = await eventService.updateEvent(parseInt(id), req.body, orgId);
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(error.message === 'Event not found' ? 404 : 400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete event
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const result = await eventService.deleteEvent(parseInt(id), orgId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(error.message === 'Event not found' ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Duplicate event
 */
exports.duplicateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;
    const userId = req.user.id;

    const event = await eventService.duplicateEvent(parseInt(id), orgId, userId);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Error duplicating event:', error);
    res.status(error.message === 'Event not found' ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Cancel event
 */
exports.cancelEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const event = await eventService.cancelEvent(parseInt(id), orgId);
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error cancelling event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Start event (go live)
 */
exports.startEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const event = await eventService.startEvent(parseInt(id), orgId);
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error starting event:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * End event
 */
exports.endEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const event = await eventService.endEvent(parseInt(id), orgId);
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error ending event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get event statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const orgId = req.user.org_id;

    const stats = await eventService.getStatistics(orgId, { startDate, endDate });
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get upcoming events
 */
exports.getUpcomingEvents = async (req, res) => {
  try {
    const { limit } = req.query;
    const orgId = req.user.org_id;

    const events = await eventService.getUpcomingEvents(orgId, parseInt(limit) || 10);
    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== REGISTRATIONS ====================

/**
 * Register for event (public endpoint)
 */
exports.registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await eventService.registerForEvent(parseInt(id), req.body);
    res.status(201).json({ success: true, data: registration });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Get registrations for event
 */
exports.getRegistrations = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit, offset } = req.query;
    const orgId = req.user.org_id;

    const registrations = await eventService.getRegistrations(parseInt(id), orgId, {
      status,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });

    res.json({ success: true, data: registrations });
  } catch (error) {
    console.error('Error getting registrations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Approve registration
 */
exports.approveRegistration = async (req, res) => {
  try {
    const { id, regId } = req.params;
    const orgId = req.user.org_id;

    const registration = await eventService.approveRegistration(
      parseInt(regId),
      parseInt(id),
      orgId
    );

    res.json({ success: true, data: registration });
  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(error.message === 'Registration not found' ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Reject registration
 */
exports.rejectRegistration = async (req, res) => {
  try {
    const { id, regId } = req.params;
    const orgId = req.user.org_id;

    const registration = await eventService.rejectRegistration(
      parseInt(regId),
      parseInt(id),
      orgId
    );

    res.json({ success: true, data: registration });
  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(error.message === 'Registration not found' ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== LANDING PAGES ====================

/**
 * Get event by slug (public)
 */
exports.getEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const event = await eventService.getEventBySlug(slug);
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error getting event by slug:', error);
    res.status(error.message === 'Event not found' ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update landing page
 */
exports.updateLandingPage = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const page = await eventService.updateLandingPage(parseInt(id), orgId, req.body);
    res.json({ success: true, data: page });
  } catch (error) {
    console.error('Error updating landing page:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== CHAT ====================

/**
 * Send chat message
 */
exports.sendChatMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, is_private, recipient_id } = req.body;
    const orgId = req.user.org_id;

    const query = `
      INSERT INTO event_chat_messages (
        event_id, sender_id, sender_name, sender_type, message, is_private, recipient_id
      )
      SELECT $1, $2, u.full_name, 'presenter', $3, $4, $5
      FROM users u
      INNER JOIN events e ON e.org_id = $6
      WHERE u.id = $2 AND e.id = $1
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      parseInt(id),
      req.user.id,
      message,
      is_private || false,
      recipient_id || null,
      orgId
    ]);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get chat messages
 */
exports.getChatMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    const orgId = req.user.org_id;

    const query = `
      SELECT cm.*
      FROM event_chat_messages cm
      INNER JOIN events e ON cm.event_id = e.id
      WHERE cm.event_id = $1 AND e.org_id = $2 AND cm.deleted_at IS NULL
      ORDER BY cm.sent_at DESC
      LIMIT $3 OFFSET $4
    `;

    const { rows } = await db.query(query, [
      parseInt(id),
      orgId,
      parseInt(limit),
      parseInt(offset)
    ]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== Q&A ====================

/**
 * Submit question
 */
exports.submitQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, attendee_id } = req.body;

    const query = `
      INSERT INTO event_questions (event_id, attendee_id, question)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const { rows } = await db.query(query, [parseInt(id), attendee_id || null, question]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error submitting question:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get questions
 */
exports.getQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    const orgId = req.user.org_id;

    let query = `
      SELECT q.*, u.full_name as answered_by_name
      FROM event_questions q
      INNER JOIN events e ON q.event_id = e.id
      LEFT JOIN users u ON q.answered_by = u.id
      WHERE q.event_id = $1 AND e.org_id = $2
    `;

    const params = [parseInt(id), orgId];

    if (status) {
      query += ` AND q.status = $3`;
      params.push(status);
    }

    query += ` ORDER BY q.upvotes DESC, q.asked_at DESC`;

    const { rows } = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getting questions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Answer question
 */
exports.answerQuestion = async (req, res) => {
  try {
    const { id, qId } = req.params;
    const { answer } = req.body;
    const orgId = req.user.org_id;

    const query = `
      UPDATE event_questions q
      SET status = 'answered', answer = $3, answered_by = $4, answered_at = CURRENT_TIMESTAMP
      FROM events e
      WHERE q.id = $1 AND q.event_id = $2 AND e.id = $2 AND e.org_id = $5
      RETURNING q.*
    `;

    const { rows } = await db.query(query, [
      parseInt(qId),
      parseInt(id),
      answer,
      req.user.id,
      orgId
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Upvote question
 */
exports.upvoteQuestion = async (req, res) => {
  try {
    const { id, qId } = req.params;

    const query = `
      UPDATE event_questions
      SET upvotes = upvotes + 1
      WHERE id = $1 AND event_id = $2
      RETURNING *
    `;

    const { rows } = await db.query(query, [parseInt(qId), parseInt(id)]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error upvoting question:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== POLLS ====================

/**
 * Create poll
 */
exports.createPoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, poll_type, options, results_visible } = req.body;
    const orgId = req.user.org_id;

    const query = `
      INSERT INTO event_polls (event_id, question, poll_type, options, results_visible)
      SELECT $1, $2, $3, $4, $5
      FROM events e
      WHERE e.id = $1 AND e.org_id = $6
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      parseInt(id),
      question,
      poll_type || 'single',
      JSON.stringify(options),
      results_visible !== false,
      orgId
    ]);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get polls
 */
exports.getPolls = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const query = `
      SELECT p.*, COUNT(pr.id) as response_count
      FROM event_polls p
      INNER JOIN events e ON p.event_id = e.id
      LEFT JOIN event_poll_responses pr ON p.id = pr.poll_id
      WHERE p.event_id = $1 AND e.org_id = $2
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;

    const { rows } = await db.query(query, [parseInt(id), orgId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getting polls:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Launch poll
 */
exports.launchPoll = async (req, res) => {
  try {
    const { id, pollId } = req.params;
    const orgId = req.user.org_id;

    const query = `
      UPDATE event_polls p
      SET status = 'active', launched_at = CURRENT_TIMESTAMP
      FROM events e
      WHERE p.id = $1 AND p.event_id = $2 AND e.id = $2 AND e.org_id = $3
      RETURNING p.*
    `;

    const { rows } = await db.query(query, [parseInt(pollId), parseInt(id), orgId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Poll not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error launching poll:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Close poll
 */
exports.closePoll = async (req, res) => {
  try {
    const { id, pollId } = req.params;
    const orgId = req.user.org_id;

    const query = `
      UPDATE event_polls p
      SET status = 'closed', closed_at = CURRENT_TIMESTAMP
      FROM events e
      WHERE p.id = $1 AND p.event_id = $2 AND e.id = $2 AND e.org_id = $3
      RETURNING p.*
    `;

    const { rows } = await db.query(query, [parseInt(pollId), parseInt(id), orgId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Poll not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error closing poll:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Submit poll response
 */
exports.submitPollResponse = async (req, res) => {
  try {
    const { id, pollId } = req.params;
    const { attendee_id, response } = req.body;

    const query = `
      INSERT INTO event_poll_responses (poll_id, attendee_id, response)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const { rows } = await db.query(query, [
      parseInt(pollId),
      attendee_id || null,
      JSON.stringify(response)
    ]);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error submitting poll response:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get poll results
 */
exports.getPollResults = async (req, res) => {
  try {
    const { id, pollId } = req.params;
    const orgId = req.user.org_id;

    const query = `
      SELECT p.*, 
             json_agg(json_build_object('response', pr.response, 'submitted_at', pr.submitted_at)) as responses
      FROM event_polls p
      INNER JOIN events e ON p.event_id = e.id
      LEFT JOIN event_poll_responses pr ON p.id = pr.poll_id
      WHERE p.id = $1 AND p.event_id = $2 AND e.org_id = $3
      GROUP BY p.id
    `;

    const { rows } = await db.query(query, [parseInt(pollId), parseInt(id), orgId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Poll not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error getting poll results:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
