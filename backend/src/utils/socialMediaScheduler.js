// ============================================================
// Social Media Publish Queue Worker
//
// Polls social_publish_queue every 30 seconds for due posts,
// publishes them via the appropriate platform provider, and
// updates statuses. Runs in the background via server.js.
// ============================================================

const db = require('../db');
const { decrypt } = require('./crypto');
const { getProvider } = require('./socialMediaProviders');

const POLL_INTERVAL = 30 * 1000; // 30 seconds
const BATCH_SIZE = 10;
const MAX_RETRIES = 3;

let intervalHandle = null;

async function processQueue() {
  try {
    // Fetch due queued posts with FOR UPDATE SKIP LOCKED for worker safety
    const { rows: dueJobs } = await db.query(
      `SELECT pq.id AS queue_id, pq.target_id, pq.post_id, pq.account_id, pq.org_id,
              pq.scheduled_at, pq.retry_count, pq.max_retries,
              sa.access_token, sa.account_name, sp.slug AS platform_slug,
              p.content_text, p.content_html, p.media_ids, p.link_url, p.post_type,
              spt.platform_specific
       FROM social_publish_queue pq
       JOIN social_post_targets spt ON spt.id = pq.target_id
       JOIN social_posts p ON p.id = pq.post_id
       JOIN social_accounts sa ON sa.id = pq.account_id
       JOIN social_platforms sp ON sp.id = sa.platform_id
       WHERE pq.status = 'queued'
         AND pq.scheduled_at <= NOW()
         AND pq.retry_count < pq.max_retries
       ORDER BY pq.scheduled_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [BATCH_SIZE]
    );

    if (dueJobs.length === 0) return;

    console.log(`[SocialMediaScheduler] Processing ${dueJobs.length} queued post(s)...`);

    for (const job of dueJobs) {
      // Mark as processing
      await db.query(
        `UPDATE social_publish_queue SET status = 'processing', started_at = now() WHERE id = $1`,
        [job.queue_id]
      );

      try {
        const accessToken = decrypt(job.access_token);
        const provider = getProvider(job.platform_slug);

        const mediaUrls = job.media_ids && job.media_ids.length > 0
          ? await resolveMediaUrls(job.media_ids)
          : [];

        const result = await provider.publishPost(accessToken, job.account_id, {
          text: job.content_text,
          linkUrl: job.link_url,
          mediaUrls,
          postType: job.post_type,
          platformSpecific: job.platform_specific,
        });

        // Mark queue as published
        await db.query(
          `UPDATE social_publish_queue
           SET status = 'published', completed_at = now()
           WHERE id = $1`,
          [job.queue_id]
        );

        // Update target as published
        await db.query(
          `UPDATE social_post_targets
           SET status = 'published', published_at = now(), platform_post_id = $1, platform_post_url = $2
           WHERE id = $3`,
          [result.id, result.url, job.target_id]
        );

        // Update post status if all targets are published
        await updatePostStatusIfComplete(job.post_id);

        console.log(`[SocialMediaScheduler] Published to ${job.account_name} (${job.platform_slug}): ${result.id}`);
      } catch (err) {
        console.error(`[SocialMediaScheduler] Publish failed for ${job.account_name}:`, err.message);

        const newRetryCount = job.retry_count + 1;
        const shouldRetry = newRetryCount < job.max_retries;

        await db.query(
          `UPDATE social_publish_queue
           SET status = $1, retry_count = $2, last_error = $3, completed_at = $4
           WHERE id = $5`,
          [shouldRetry ? 'retrying' : 'failed', newRetryCount, err.message, shouldRetry ? null : 'now()', job.queue_id]
        );

        await db.query(
          `UPDATE social_post_targets
           SET status = $1, error_message = $2, retry_count = $3
           WHERE id = $4`,
          [shouldRetry ? 'scheduled' : 'failed', err.message, newRetryCount, job.target_id]
        );
      }
    }
  } catch (err) {
    console.error('[SocialMediaScheduler] Queue processing error:', err);
  }
}

// Resolve media IDs to their URLs
async function resolveMediaUrls(mediaIds) {
  if (!mediaIds || mediaIds.length === 0) return [];
  const { rows } = await db.query(
    `SELECT url FROM social_media_assets WHERE id = ANY($1::uuid[])`,
    [mediaIds]
  );
  return rows.map(r => r.url);
}

// Check if all targets for a post are published, and update status
async function updatePostStatusIfComplete(postId) {
  const { rows } = await db.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'published')::int AS published,
       COUNT(*) FILTER (WHERE status = 'failed')::int AS failed
     FROM social_post_targets WHERE post_id = $1`,
    [postId]
  );

  const { total, published, failed } = rows[0];
  let newStatus;

  if (published === total) newStatus = 'published';
  else if (failed > 0 && published + failed === total) newStatus = 'failed';
  else newStatus = 'publishing';

  await db.query(
    `UPDATE social_posts SET status = $1, updated_at = now() WHERE id = $2`,
    [newStatus, postId]
  );
}

// Queue a target for publishing
async function queueTarget(targetId, postId, accountId, orgId, scheduledAt) {
  await db.query(
    `INSERT INTO social_publish_queue (target_id, post_id, account_id, org_id, scheduled_at, status)
     VALUES ($1, $2, $3, $4, $5, 'queued')
     ON CONFLICT (target_id) DO UPDATE SET status = 'queued', scheduled_at = $5, retry_count = 0, last_error = NULL`,
    [targetId, postId, accountId, orgId, scheduledAt || new Date()]
  );
}

function start() {
  if (intervalHandle) return;
  console.log('[SocialMediaScheduler] Starting — polling every 30s');
  intervalHandle = setInterval(processQueue, POLL_INTERVAL);
  // Run first check immediately
  processQueue();
}

function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[SocialMediaScheduler] Stopped');
  }
}

module.exports = { start, stop, queueTarget, processQueue };
