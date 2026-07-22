// backend/src/services/WebhookDeliveryService.js
// Listens to EventBus events and delivers them as HTTP POSTs to subscribed
// outgoing webhook URLs. Signing uses HMAC-SHA256 with the webhook secret.

const crypto = require('crypto');
const db = require('../db');
const eventBus = require('../utils/eventBus');
const logger = require('../utils/logger');

const SIGNATURE_HEADER = 'x-dph-signature';
const EVENT_HEADER = 'x-dph-event';
const DELIVERY_ATTEMPT_HEADER = 'x-dph-delivery-attempt';

class WebhookDeliveryService {
  constructor() {
    this._initialized = false;
    // Maximum time in ms to wait for a webhook endpoint to respond
    this.defaultTimeout = 5000;
    // Maximum number of concurrent deliveries per tick
    this.maxConcurrent = 10;
  }

  /**
   * Subscribe to all relevant EventBus events.
   * Call once during app startup.
   */
  initialize() {
    if (this._initialized) return;
    this._initialized = true;

    const events = [
      'deal.created', 'deal.updated', 'deal.stage_changed',
      'deal.won', 'deal.lost', 'deal.deleted',
      'deal.product_added', 'deal.product_removed',
      'pipeline.created', 'pipeline.updated', 'pipeline.deleted',
      'pipeline.default_changed',
      'stage.created', 'stage.updated', 'stage.deleted',
    ];

    for (const eventName of events) {
      eventBus.on(eventName, (data) => {
        this._dispatch(eventName, data).catch((err) => {
          logger.error('WebhookDeliveryService: dispatch error', {
            event: eventName,
            error: err.message,
          });
        });
      });
    }

    logger.info('WebhookDeliveryService initialized', {
      subscribedEvents: events.length,
    });
  }

  /**
   * Called when an EventBus event fires.
   * Looks up all active outgoing webhooks subscribed to this event type
   * and delivers the payload.
   */
  async _dispatch(eventType, data) {
    const orgId = data?.orgId;
    if (!orgId) {
      logger.debug('WebhookDeliveryService: skipping event without orgId', { eventType });
      return;
    }

    try {
      const { rows: webhooks } = await db.query(
        `SELECT id, url, secret, retry_count, timeout_ms
         FROM outgoing_webhooks
         WHERE org_id = $1
           AND is_active = true
           AND $2 = ANY(event_types)`,
        [orgId, eventType]
      );

      if (webhooks.length === 0) return;

      const payload = JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data,
      });

      const deliveries = webhooks.map((wh) =>
        this._deliver(wh, eventType, payload)
      );

      // Run deliveries concurrently, respect maxConcurrent
      const chunks = [];
      for (let i = 0; i < deliveries.length; i += this.maxConcurrent) {
        chunks.push(deliveries.slice(i, i + this.maxConcurrent));
      }
      for (const chunk of chunks) {
        await Promise.allSettled(chunk);
      }
    } catch (error) {
      logger.error('WebhookDeliveryService: dispatch error', {
        eventType,
        orgId,
        error: error.message,
      });
    }
  }

  /**
   * Deliver a single webhook payload to one URL.
   * Records the delivery attempt in outgoing_webhook_deliveries.
   */
  async _deliver(webhook, eventType, payload) {
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(payload)
      .digest('hex');

    const startTime = Date.now();
    let statusCode = null;
    let responseBody = null;
    let errorMessage = null;
    let deliveryStatus = 'delivered';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), webhook.timeout_ms || this.defaultTimeout);

      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [SIGNATURE_HEADER]: signature,
          [EVENT_HEADER]: eventType,
          [DELIVERY_ATTEMPT_HEADER]: '1',
          'User-Agent': 'DigitPenHub-Webhook/1.0',
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      statusCode = res.status;
      responseBody = (await res.text().catch(() => null)) || null;

      if (statusCode >= 200 && statusCode < 300) {
        deliveryStatus = 'delivered';
      } else {
        deliveryStatus = 'failed';
        errorMessage = `HTTP ${statusCode}`;
      }
    } catch (err) {
      errorMessage = err.name === 'AbortError' ? 'timeout' : err.message;
      deliveryStatus = 'failed';
    }

    const duration = Date.now() - startTime;

    try {
      await db.query(
        `INSERT INTO outgoing_webhook_deliveries
           (webhook_id, org_id, event_type, payload, status, status_code, response_body, error_message, attempt, max_attempts, delivered_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9, $10)`,
        [
          webhook.id,
          null, // org_id inferred from webhook
          eventType,
          payload,
          deliveryStatus,
          statusCode,
          responseBody,
          errorMessage,
          webhook.retry_count || 3,
          deliveryStatus === 'delivered' ? new Date() : null,
        ]
      );

      // Update webhook status
      await db.query(
        `UPDATE outgoing_webhooks
         SET last_sent_at = NOW(), last_status = $1, last_error = $2, updated_at = NOW()
         WHERE id = $3`,
        [statusCode, errorMessage, webhook.id]
      );

      logger.info('WebhookDeliveryService: delivery completed', {
        webhookId: webhook.id,
        url: webhook.url.replace(/[?#].*/, ''), // strip query params from log
        eventType,
        status: deliveryStatus,
        statusCode,
        durationMs: duration,
      });
    } catch (dbError) {
      logger.error('WebhookDeliveryService: failed to record delivery', {
        webhookId: webhook.id,
        error: dbError.message,
      });
    }
  }

  /**
   * Retry failed deliveries that haven't exceeded their max retry count.
   * Call this from a scheduled job (e.g. every 5 minutes).
   */
  async retryFailedDeliveries() {
    try {
      const { rows: failed } = await db.query(
        `SELECT d.id AS delivery_id, d.event_type, d.payload, d.attempt, d.max_attempts,
                w.id AS webhook_id, w.url, w.secret, w.timeout_ms
         FROM outgoing_webhook_deliveries d
         JOIN outgoing_webhooks w ON w.id = d.webhook_id
         WHERE d.status IN ('failed', 'retrying')
           AND d.attempt < d.max_attempts
           AND (d.next_retry_at IS NULL OR d.next_retry_at <= NOW())
         ORDER BY d.created_at ASC
         LIMIT 50`
      );

      for (const row of failed) {
        await this._deliver(
          { id: row.webhook_id, url: row.url, secret: row.secret, retry_count: row.max_attempts, timeout_ms: row.timeout_ms },
          row.event_type,
          row.payload
        );
      }

      if (failed.length > 0) {
        logger.info('WebhookDeliveryService: retried deliveries', { count: failed.length });
      }
    } catch (error) {
      logger.error('WebhookDeliveryService: retryFailedDeliveries error', {
        error: error.message,
      });
    }
  }
}

module.exports = new WebhookDeliveryService();
