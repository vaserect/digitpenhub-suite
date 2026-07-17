const db = require('../db');
const dns = require('dns').promises;
const { encrypt, decrypt } = require('../utils/crypto');
const { getProvider } = require('../utils/socialMediaProviders');
const socialProviders = require('../utils/socialMediaProviders');

// ============================================================
// ACCOUNT MANAGEMENT
// ============================================================

// List connected accounts with workspace & platform info
async function listAccounts(req, res) {
  try {
    const { platform, workspaceId, health } = req.query;
    const conditions = ['sa.org_id = $1'];
    const values = [req.user.orgId];
    let idx = 2;

    if (platform) { conditions.push(`sp.slug = $${idx}`); values.push(platform); idx++; }
    if (workspaceId) { conditions.push(`sa.workspace_id = $${idx}`); values.push(workspaceId); idx++; }
    if (health) { conditions.push(`sa.health_status = $${idx}`); values.push(health); idx++; }

    const { rows } = await db.query(
      `SELECT sa.id, sa.platform_id, sa.account_type, sa.account_name, sa.account_avatar,
              sa.workspace_id, sa.brand_id, sa.is_active, sa.health_status, sa.last_checked_at,
              sa.last_error, sa.created_at, sp.name AS platform_name, sp.slug AS platform_slug,
              sp.icon AS platform_icon, sw.name AS workspace_name
       FROM social_accounts sa
       JOIN social_platforms sp ON sp.id = sa.platform_id
       LEFT JOIN social_workspaces sw ON sw.id = sa.workspace_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY sp.name, sa.account_name`,
      values
    );

    res.json({ accounts: rows });
  } catch (err) {
    console.error('[socialMediaController.listAccounts] Error:', err);
    res.status(500).json({ error: 'Failed to list accounts.' });
  }
}

// Connect a social account via OAuth code exchange
async function connectAccount(req, res) {
  try {
    const { platform, code, redirectUri, clientId, clientSecret } = req.body;

    if (!platform || !code) {
      return res.status(400).json({ error: 'platform and code are required.' });
    }

    // Get platform info from DB
    const platformRes = await db.query(
      `SELECT id, slug, name FROM social_platforms WHERE slug = $1 AND is_active = true`,
      [platform]
    );
    if (!platformRes.rows.length) {
      return res.status(400).json({ error: `Unsupported platform: "${platform}".` });
    }
    const platformRow = platformRes.rows[0];

    // Exchange OAuth code for tokens
    const provider = getProvider(platform);
    let tokens;
    try {
      tokens = await provider.exchangeCode(code, redirectUri, clientId, clientSecret);
    } catch (oauthErr) {
      console.error(`[socialMedia] OAuth exchange failed for ${platform}:`, oauthErr.message);
      return res.status(400).json({ error: `OAuth handshake failed: ${oauthErr.message}` });
    }

    // Get profile info from platform
    const profile = await provider.getProfile(tokens.accessToken);

    // Encrypt tokens for storage
    const encryptedAccess = encrypt(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken ? encrypt(tokens.refreshToken) : null;
    const expiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;

    // Create account (main profile)
    const tokenScopes = tokens.scopes || [];

    // Insert the primary account
    const { rows: accountRows } = await db.query(
      `INSERT INTO social_accounts
        (org_id, platform_id, platform_user_id, account_type, account_name, account_avatar,
         access_token, refresh_token, token_expires_at, token_scopes, health_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'connected')
       ON CONFLICT (org_id, platform_id, platform_user_id)
       DO UPDATE SET access_token = $7, refresh_token = $8, token_expires_at = $9,
                     token_scopes = $10, health_status = 'connected', last_error = NULL,
                     updated_at = now()
       RETURNING id, account_name, account_type, health_status`,
      [req.user.orgId, platformRow.id, profile.userId, 'profile', profile.name,
       profile.avatar || null, encryptedAccess, encryptedRefresh, expiresAt, tokenScopes]
    );

    const created = [accountRows[0]];

    // If platform has pages (Facebook, Instagram business), create sub-accounts
    if (profile.pages && profile.pages.length > 0) {
      for (const page of profile.pages) {
        const pageToken = page.accessToken ? encrypt(page.accessToken) : encryptedAccess;
        const pageExpiresAt = page.accessToken
          ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          : expiresAt;

        await db.query(
          `INSERT INTO social_accounts
            (org_id, platform_id, platform_user_id, account_type, account_name, account_avatar,
             access_token, refresh_token, token_expires_at, health_status)
           VALUES ($1, $2, $3, 'page', $4, $5, $6, $7, $8, 'connected')
           ON CONFLICT (org_id, platform_id, platform_user_id)
           DO UPDATE SET account_name = $4, account_avatar = $5, access_token = $6,
                         health_status = 'connected', updated_at = now()
           RETURNING id, account_name, account_type`,
          [req.user.orgId, platformRow.id, page.id, page.name, page.avatar || null,
           pageToken, encryptedRefresh, pageExpiresAt]
        );
      }
    }

    res.status(201).json({
      accounts: created,
      message: `${platformRow.name} account connected successfully.`
    });
  } catch (err) {
    console.error('[socialMediaController.connectAccount] Error:', err);
    res.status(500).json({ error: 'Failed to connect account: ' + (err.message || 'Unknown error') });
  }
}

// Disconnect account (revoke token + delete)
async function disconnectAccount(req, res) {
  try {
    const { id } = req.params;

    // Get the platform info for potential token revocation
    const accountRes = await db.query(
      `SELECT sa.access_token, sp.slug AS platform_slug
       FROM social_accounts sa
       JOIN social_platforms sp ON sp.id = sa.platform_id
       WHERE sa.id = $1 AND sa.org_id = $2`,
      [id, req.user.orgId]
    );

    if (!accountRes.rows.length) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    // Delete from DB (cascades to posts, targets, queue, analytics)
    await db.query(
      `DELETE FROM social_accounts WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );

    res.json({ ok: true, message: 'Account disconnected.' });
  } catch (err) {
    console.error('[socialMediaController.disconnectAccount] Error:', err);
    res.status(500).json({ error: 'Failed to disconnect account.' });
  }
}

// Refresh OAuth token for an account
async function reconnectAccount(req, res) {
  try {
    const { id } = req.params;

    const accountRes = await db.query(
      `SELECT sa.access_token, sa.refresh_token, sa.platform_user_id, sp.slug AS platform_slug
       FROM social_accounts sa
       JOIN social_platforms sp ON sp.id = sa.platform_id
       WHERE sa.id = $1 AND sa.org_id = $2`,
      [id, req.user.orgId]
    );

    if (!accountRes.rows.length) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const account = accountRes.rows[0];
    const provider = getProvider(account.platform_slug);

    if (!provider.refreshToken) {
      return res.status(400).json({ error: `${account.platform_slug} does not support token refresh.` });
    }

    const decryptedRefresh = account.refresh_token ? decrypt(account.refresh_token) : null;
    if (!decryptedRefresh) {
      return res.status(400).json({ error: 'No refresh token available. Please reconnect the account.' });
    }

    const tokens = await provider.refreshToken(decryptedRefresh);
    const encryptedAccess = encrypt(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken ? encrypt(tokens.refreshToken) : encryptedAccess;
    const expiresAt = tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : null;

    await db.query(
      `UPDATE social_accounts
       SET access_token = $1, refresh_token = $2, token_expires_at = $3,
           health_status = 'connected', last_error = NULL, last_checked_at = now(), updated_at = now()
       WHERE id = $4`,
      [encryptedAccess, encryptedRefresh, expiresAt, id]
    );

    res.json({ ok: true, message: 'Token refreshed successfully.' });
  } catch (err) {
    console.error('[socialMediaController.reconnectAccount] Error:', err);
    await db.query(
      `UPDATE social_accounts SET health_status = 'error', last_error = $1, last_checked_at = now()
       WHERE id = $2`,
      [err.message, req.params.id]
    );
    res.status(500).json({ error: 'Failed to refresh token: ' + err.message });
  }
}

// Bulk health check for all accounts
async function checkAllHealth(req, res) {
  try {
    const { rows: accounts } = await db.query(
      `SELECT sa.id, sa.access_token, sa.token_expires_at, sp.slug AS platform_slug, sp.name AS platform_name
       FROM social_accounts sa
       JOIN social_platforms sp ON sp.id = sa.platform_id
       WHERE sa.org_id = $1 AND sa.is_active = true`,
      [req.user.orgId]
    );

    const results = [];
    for (const account of accounts) {
      const status = { id: account.id, platform: account.platform_name, health: 'connected' };

      // Check token expiry
      if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
        status.health = 'expired';
        status.reason = 'Token expired. Reconnect required.';
        await db.query(
          `UPDATE social_accounts SET health_status = 'expired', last_checked_at = now() WHERE id = $1`,
          [account.id]
        );
      } else {
        // Try a lightweight API call to verify token works
        try {
          const provider = getProvider(account.platform_slug);
          const token = decrypt(account.access_token);
          await provider.getProfile(token);
        } catch (apiErr) {
          status.health = 'error';
          status.reason = apiErr.message;
          await db.query(
            `UPDATE social_accounts SET health_status = 'error', last_error = $1, last_checked_at = now() WHERE id = $2`,
            [apiErr.message, account.id]
          );
        }
      }

      results.push(status);
    }

    res.json({ results });
  } catch (err) {
    console.error('[socialMediaController.checkAllHealth] Error:', err);
    res.status(500).json({ error: 'Health check failed.' });
  }
}

// Get account-level analytics
async function getAccountAnalytics(req, res) {
  try {
    const { id } = req.params;
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);

    const { rows } = await db.query(
      `SELECT date, followers, follower_growth, impressions, reach,
              engagement_rate, posts_count, stories_count, profile_visits
       FROM social_account_analytics
       WHERE account_id = $1 AND org_id = $2
         AND date >= NOW() - ($3 || ' days')::INTERVAL
       ORDER BY date ASC`,
      [id, req.user.orgId, days]
    );

    // Summary stats
    const summary = await db.query(
      `SELECT
         MAX(followers) AS current_followers,
         COALESCE(SUM(impressions), 0) AS total_impressions,
         COALESCE(SUM(reach), 0) AS total_reach,
         COALESCE(AVG(engagement_rate), 0) AS avg_engagement,
         COALESCE(SUM(posts_count), 0) AS total_posts
       FROM social_account_analytics
       WHERE account_id = $1 AND org_id = $2
         AND date >= NOW() - ($3 || ' days')::INTERVAL`,
      [id, req.user.orgId, days]
    );

    res.json({ analytics: rows, summary: summary.rows[0] });
  } catch (err) {
    console.error('[socialMediaController.getAccountAnalytics] Error:', err);
    res.status(500).json({ error: 'Failed to get account analytics.' });
  }
}

// ============================================================
// WORKSPACE MANAGEMENT
// ============================================================

async function listWorkspaces(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT sw.*,
              (SELECT COUNT(*)::int FROM social_accounts WHERE workspace_id = sw.id AND is_active = true) AS account_count
       FROM social_workspaces sw
       WHERE sw.org_id = $1 AND sw.is_active = true
       ORDER BY sw.name ASC`,
      [req.user.orgId]
    );
    res.json({ workspaces: rows });
  } catch (err) {
    console.error('[socialMediaController.listWorkspaces] Error:', err);
    res.status(500).json({ error: 'Failed to list workspaces.' });
  }
}

async function createWorkspace(req, res) {
  try {
    const { name, description, clientName, color } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Workspace name is required.' });

    const { rows } = await db.query(
      `INSERT INTO social_workspaces (org_id, name, description, client_name, color)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.orgId, name.trim(), description || null, clientName || null, color || '#2563eb']
    );
    res.status(201).json({ workspace: rows[0] });
  } catch (err) {
    console.error('[socialMediaController.createWorkspace] Error:', err);
    res.status(500).json({ error: 'Failed to create workspace.' });
  }
}

async function updateWorkspace(req, res) {
  try {
    const { id } = req.params;
    const { name, description, clientName, color, isActive } = req.body;

    const result = await db.query(
      `UPDATE social_workspaces
       SET name = COALESCE($1, name), description = COALESCE($2, description),
           client_name = COALESCE($3, client_name), color = COALESCE($4, color),
           is_active = COALESCE($5, is_active), updated_at = now()
       WHERE id = $6 AND org_id = $7
       RETURNING *`,
      [name, description, clientName, color, isActive, id, req.user.orgId]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Workspace not found.' });
    res.json({ workspace: result.rows[0] });
  } catch (err) {
    console.error('[socialMediaController.updateWorkspace] Error:', err);
    res.status(500).json({ error: 'Failed to update workspace.' });
  }
}

async function deleteWorkspace(req, res) {
  try {
    const { rowCount } = await db.query(
      `DELETE FROM social_workspaces WHERE id = $1 AND org_id = $2`,
      [req.params.id, req.user.orgId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Workspace not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[socialMediaController.deleteWorkspace] Error:', err);
    res.status(500).json({ error: 'Failed to delete workspace.' });
  }
}

// ============================================================
// POST MANAGEMENT
// ============================================================

async function listPosts(req, res) {
  try {
    const { status, platformId, from, to, q, limit = 50, offset = 0 } = req.query;

    const conditions = ['p.org_id = $1'];
    const values = [req.user.orgId];
    let idx = 2;

    if (status) { conditions.push(`p.status = $${idx}`); values.push(status); idx++; }
    if (platformId) { conditions.push(`EXISTS (SELECT 1 FROM social_post_targets spt JOIN social_accounts sa ON sa.id = spt.account_id WHERE spt.post_id = p.id AND sa.platform_id = $${idx})`); values.push(platformId); idx++; }
    if (from) { conditions.push(`p.created_at >= $${idx}`); values.push(from); idx++; }
    if (to) { conditions.push(`p.created_at <= $${idx}`); values.push(to); idx++; }
    if (q && q.trim()) {
      conditions.push(`(p.content_text ILIKE $${idx} OR p.content_html ILIKE $${idx} OR $${idx} = ANY(p.tags))`);
      values.push(`%${q.trim()}%`);
      idx++;
    }

    values.push(parseInt(limit) || 50, parseInt(offset) || 0);

    const { rows } = await db.query(
      `SELECT p.id, p.content_text, p.post_type, p.status, p.is_recurring,
              p.ai_generated, p.tags, p.created_at, p.updated_at,
              u.full_name AS created_by_name,
              COALESCE(
                json_agg(
                  json_build_object(
                    'target_id', spt.id, 'account_id', spt.account_id,
                    'account_name', sa.account_name, 'platform_slug', sp.slug,
                    'platform_name', sp.name, 'scheduled_at', spt.scheduled_at,
                    'published_at', spt.published_at, 'target_status', spt.status,
                    'platform_post_url', spt.platform_post_url
                  )
                ) FILTER (WHERE spt.id IS NOT NULL),
                '[]'
              ) AS targets
       FROM social_posts p
       JOIN users u ON u.id = p.created_by
       LEFT JOIN social_post_targets spt ON spt.post_id = p.id
       LEFT JOIN social_accounts sa ON sa.id = spt.account_id
       LEFT JOIN social_platforms sp ON sp.id = sa.platform_id
       WHERE ${conditions.join(' AND ')}
       GROUP BY p.id, u.full_name
       ORDER BY p.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    const countResult = await db.query(
      `SELECT COUNT(DISTINCT p.id)::int AS total FROM social_posts p
       LEFT JOIN social_post_targets spt ON spt.post_id = p.id
       LEFT JOIN social_accounts sa ON sa.id = spt.account_id
       WHERE p.org_id = $1`,
      [req.user.orgId]
    );

    res.json({
      posts: rows,
      total: countResult.rows[0].total,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
  } catch (err) {
    console.error('[socialMediaController.listPosts] Error:', err);
    res.status(500).json({ error: 'Failed to list posts.' });
  }
}

async function getPost(req, res) {
  try {
    const { id } = req.params;

    const postRes = await db.query(
      `SELECT p.*, u.full_name AS created_by_name
       FROM social_posts p
       JOIN users u ON u.id = p.created_by
       WHERE p.id = $1 AND p.org_id = $2`,
      [id, req.user.orgId]
    );

    if (!postRes.rows.length) return res.status(404).json({ error: 'Post not found.' });

    const targetsRes = await db.query(
      `SELECT spt.*, sa.account_name, sp.slug AS platform_slug, sp.name AS platform_name
       FROM social_post_targets spt
       JOIN social_accounts sa ON sa.id = spt.account_id
       JOIN social_platforms sp ON sp.id = sa.platform_id
       WHERE spt.post_id = $1
       ORDER BY spt.sort_order`,
      [id]
    );

    res.json({ post: { ...postRes.rows[0], targets: targetsRes.rows } });
  } catch (err) {
    console.error('[socialMediaController.getPost] Error:', err);
    res.status(500).json({ error: 'Failed to get post.' });
  }
}

async function createPost(req, res) {
  try {
    const { contentText, contentHtml, mediaIds, linkUrl, postType, tags, targets } = req.body;

    if (!contentText && !contentHtml && (!mediaIds || mediaIds.length === 0) && !linkUrl) {
      return res.status(400).json({ error: 'Post must have text, media, or a link.' });
    }

    const validTypes = ['post', 'story', 'reel', 'thread', 'carousel'];
    const finalType = validTypes.includes(postType) ? postType : 'post';

    // Create the post
    const { rows: postRows } = await db.query(
      `INSERT INTO social_posts (org_id, created_by, content_text, content_html, media_ids, link_url, post_type, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.orgId, req.user.id, contentText || null, contentHtml || null,
       mediaIds || [], linkUrl || null, finalType, tags || []]
    );

    const post = postRows[0];
    const createdTargets = [];

    // Create post targets if specified
    if (targets && Array.isArray(targets)) {
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        const accountRes = await db.query(
          `SELECT id FROM social_accounts WHERE id = $1 AND org_id = $2 AND is_active = true`,
          [t.accountId, req.user.orgId]
        );
        if (accountRes.rows.length) {
          const { rows: targetRows } = await db.query(
            `INSERT INTO social_post_targets (post_id, account_id, platform_specific, scheduled_at, status, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [post.id, t.accountId,
             t.platformSpecific ? JSON.stringify(t.platformSpecific) : null,
             t.scheduledAt || null,
             t.scheduledAt ? 'scheduled' : 'draft',
             i]
          );
          createdTargets.push(targetRows[0]);
        }
      }
    }

    res.status(201).json({ post: { ...post, targets: createdTargets } });
  } catch (err) {
    console.error('[socialMediaController.createPost] Error:', err);
    res.status(500).json({ error: 'Failed to create post.' });
  }
}

async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const { contentText, contentHtml, mediaIds, linkUrl, postType, tags, status } = req.body;

    const updates = [];
    const values = [];
    let idx = 1;

    if (contentText !== undefined) { updates.push(`content_text = $${idx}`); values.push(contentText); idx++; }
    if (contentHtml !== undefined) { updates.push(`content_html = $${idx}`); values.push(contentHtml); idx++; }
    if (mediaIds !== undefined) { updates.push(`media_ids = $${idx}`); values.push(mediaIds); idx++; }
    if (linkUrl !== undefined) { updates.push(`link_url = $${idx}`); values.push(linkUrl); idx++; }
    if (postType !== undefined) { updates.push(`post_type = $${idx}`); values.push(postType); idx++; }
    if (tags !== undefined) { updates.push(`tags = $${idx}`); values.push(tags); idx++; }
    if (status !== undefined) { updates.push(`status = $${idx}`); values.push(status); idx++; }

    if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });

    updates.push(`updated_at = now()`);
    values.push(id, req.user.orgId);

    const { rows } = await db.query(
      `UPDATE social_posts SET ${updates.join(', ')} WHERE id = $${idx} AND org_id = $${idx + 1} RETURNING *`,
      values
    );

    if (!rows.length) return res.status(404).json({ error: 'Post not found.' });
    res.json({ post: rows[0] });
  } catch (err) {
    console.error('[socialMediaController.updatePost] Error:', err);
    res.status(500).json({ error: 'Failed to update post.' });
  }
}

async function deletePost(req, res) {
  try {
    const { rowCount } = await db.query(
      `DELETE FROM social_posts WHERE id = $1 AND org_id = $2`,
      [req.params.id, req.user.orgId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Post not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[socialMediaController.deletePost] Error:', err);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
}

async function duplicatePost(req, res) {
  try {
    const { id } = req.params;

    const original = await db.query(
      `SELECT * FROM social_posts WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );
    if (!original.rows.length) return res.status(404).json({ error: 'Post not found.' });

    const p = original.rows[0];
    const { rows: newPost } = await db.query(
      `INSERT INTO social_posts (org_id, created_by, content_text, content_html, media_ids, link_url, post_type, tags, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
       RETURNING *`,
      [req.user.orgId, req.user.id, p.content_text, p.content_html, p.media_ids, p.link_url, p.post_type, p.tags]
    );

    res.status(201).json({ post: newPost[0] });
  } catch (err) {
    console.error('[socialMediaController.duplicatePost] Error:', err);
    res.status(500).json({ error: 'Failed to duplicate post.' });
  }
}

// ============================================================
// SCHEDULING
// ============================================================

async function schedulePost(req, res) {
  try {
    const { id } = req.params;
    const { schedules } = req.body; // [{ targetId or accountId, scheduledAt, platformSpecific }]

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ error: 'schedules array is required.' });
    }

    const postCheck = await db.query(
      `SELECT id FROM social_posts WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );
    if (!postCheck.rows.length) return res.status(404).json({ error: 'Post not found.' });

    const results = [];

    for (const s of schedules) {
      if (s.targetId) {
        // Update existing target
        const { rows } = await db.query(
          `UPDATE social_post_targets
           SET scheduled_at = $1, status = 'scheduled', platform_specific = COALESCE($2, platform_specific),
               updated_at = now()
           WHERE id = $3 AND post_id = $4
           RETURNING *`,
          [s.scheduledAt, s.platformSpecific ? JSON.stringify(s.platformSpecific) : null, s.targetId, id]
        );
        if (rows.length) results.push(rows[0]);
      } else if (s.accountId) {
        // Create new target + schedule
        const { rows } = await db.query(
          `INSERT INTO social_post_targets (post_id, account_id, scheduled_at, status, platform_specific)
           VALUES ($1, $2, $3, 'scheduled', $4)
           ON CONFLICT (post_id, account_id) DO UPDATE SET scheduled_at = $3, status = 'scheduled'
           RETURNING *`,
          [id, s.accountId, s.scheduledAt,
           s.platformSpecific ? JSON.stringify(s.platformSpecific) : null]
        );
        results.push(rows[0]);
      }
    }

    // Update post status
    await db.query(`UPDATE social_posts SET status = 'scheduled', updated_at = now() WHERE id = $1`, [id]);

    res.json({ targets: results, message: `${results.length} target(s) scheduled.` });
  } catch (err) {
    console.error('[socialMediaController.schedulePost] Error:', err);
    res.status(500).json({ error: 'Failed to schedule post.' });
  }
}

async function publishNow(req, res) {
  try {
    const { id } = req.params;
    const { accountIds } = req.body; // optional: specific accounts to publish to

    const postCheck = await db.query(
      `SELECT * FROM social_posts WHERE id = $1 AND org_id = $2`,
      [id, req.user.orgId]
    );
    if (!postCheck.rows.length) return res.status(404).json({ error: 'Post not found.' });

    const post = postCheck.rows[0];

    // Get targets — either specified or all draft targets for this post
    let targets;
    if (accountIds && Array.isArray(accountIds)) {
      const { rows } = await db.query(
        `SELECT spt.*, sa.account_name, sa.access_token, sp.slug AS platform_slug
         FROM social_post_targets spt
         JOIN social_accounts sa ON sa.id = spt.account_id
         JOIN social_platforms sp ON sp.id = sa.platform_id
         WHERE spt.post_id = $1 AND sa.id = ANY($2::uuid[])
           AND spt.status IN ('draft', 'scheduled')`,
        [id, accountIds]
      );
      targets = rows;
    } else {
      const { rows } = await db.query(
        `SELECT spt.*, sa.account_name, sa.access_token, sp.slug AS platform_slug
         FROM social_post_targets spt
         JOIN social_accounts sa ON sa.id = spt.account_id
         JOIN social_platforms sp ON sp.id = sa.platform_id
         WHERE spt.post_id = $1 AND spt.status IN ('draft', 'scheduled')`,
        [id]
      );
      targets = rows;
    }

    if (targets.length === 0) {
      return res.status(400).json({ error: 'No publishable targets found for this post.' });
    }

    // Publish to each target immediately
    const results = [];
    for (const target of targets) {
      try {
        const accessToken = decrypt(target.access_token);
        const provider = getProvider(target.platform_slug);
        const result = await provider.publishPost(accessToken, target.account_id, {
          text: post.content_text,
          linkUrl: post.link_url,
          mediaIds: post.media_ids,
          postType: post.post_type,
        });

        // Update target as published
        await db.query(
          `UPDATE social_post_targets
           SET status = 'published', published_at = now(), platform_post_id = $1, platform_post_url = $2
           WHERE id = $3`,
          [result.id, result.url, target.id]
        );

        results.push({ accountId: target.account_id, accountName: target.account_name, success: true, platformPostUrl: result.url });
      } catch (publishErr) {
        console.error(`[socialMedia] Publish failed for ${target.account_name}:`, publishErr.message);
        await db.query(
          `UPDATE social_post_targets SET status = 'failed', error_message = $1, retry_count = retry_count + 1 WHERE id = $2`,
          [publishErr.message, target.id]
        );
        results.push({ accountId: target.account_id, accountName: target.account_name, success: false, error: publishErr.message });
      }
    }

    // Update post status
    const allSuccess = results.every(r => r.success);
    await db.query(
      `UPDATE social_posts SET status = $1, updated_at = now() WHERE id = $2`,
      [allSuccess ? 'published' : 'failed', id]
    );

    res.json({ results });
  } catch (err) {
    console.error('[socialMediaController.publishNow] Error:', err);
    res.status(500).json({ error: 'Failed to publish post.' });
  }
}

async function cancelPost(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      `UPDATE social_post_targets SET status = 'draft' WHERE post_id = $1 AND status = 'scheduled'
       RETURNING id`,
      [id]
    );

    await db.query(
      `UPDATE social_posts SET status = 'draft', updated_at = now() WHERE id = $1`,
      [id]
    );

    res.json({ ok: true, cancelled: rows.length });
  } catch (err) {
    console.error('[socialMediaController.cancelPost] Error:', err);
    res.status(500).json({ error: 'Failed to cancel post.' });
  }
}

// ============================================================
// CALENDAR
// ============================================================

async function getCalendar(req, res) {
  try {
    const { from, to, platformId, workspaceId } = req.query;

    const conditions = ['p.org_id = $1'];
    const values = [req.user.orgId];
    let idx = 2;

    if (from) { conditions.push(`spt.scheduled_at >= $${idx}`); values.push(from); idx++; }
    if (to) { conditions.push(`spt.scheduled_at <= $${idx}`); values.push(to); idx++; }
    if (platformId) {
      conditions.push(`sa.platform_id = $${idx}`);
      values.push(platformId);
      idx++;
    }
    if (workspaceId) {
      conditions.push(`sa.workspace_id = $${idx}`);
      values.push(workspaceId);
      idx++;
    }

    const { rows } = await db.query(
      `SELECT spt.id AS target_id, spt.scheduled_at, spt.status AS target_status,
              spt.platform_post_id,
              p.id AS post_id, p.content_text, p.post_type, p.status AS post_status,
              sa.id AS account_id, sa.account_name,
              sp.slug AS platform_slug, sp.name AS platform_name, sp.icon AS platform_icon
       FROM social_post_targets spt
       JOIN social_posts p ON p.id = spt.post_id
       JOIN social_accounts sa ON sa.id = spt.account_id
       JOIN social_platforms sp ON sp.id = sa.platform_id
       WHERE ${conditions.join(' AND ')}
         AND spt.scheduled_at IS NOT NULL
       ORDER BY spt.scheduled_at ASC`,
      values
    );

    res.json({ events: rows });
  } catch (err) {
    console.error('[socialMediaController.getCalendar] Error:', err);
    res.status(500).json({ error: 'Failed to get calendar.' });
  }
}

async function reschedulePost(req, res) {
  try {
    const { targetId, scheduledAt } = req.body;

    await db.query(
      `UPDATE social_post_targets SET scheduled_at = $1, status = 'scheduled', updated_at = now() WHERE id = $2`,
      [scheduledAt, targetId]
    );

    res.json({ ok: true, message: 'Rescheduled.' });
  } catch (err) {
    console.error('[socialMediaController.reschedulePost] Error:', err);
    res.status(500).json({ error: 'Failed to reschedule.' });
  }
}

// ============================================================
// MEDIA
// ============================================================

async function listMedia(req, res) {
  try {
    const { type, folderId, q, limit = 50, offset = 0 } = req.query;
    const conditions = ['org_id = $1'];
    const values = [req.user.orgId];
    let idx = 2;

    if (type) { conditions.push(`type = $${idx}`); values.push(type); idx++; }
    if (folderId) { conditions.push(`folder_id = $${idx}`); values.push(folderId); idx++; }
    if (q && q.trim()) {
      conditions.push(`(name ILIKE $${idx} OR $${idx} = ANY(tags) OR $${idx} = ANY(ai_tags))`);
      values.push(`%${q.trim()}%`);
      idx++;
    }

    values.push(parseInt(limit) || 50, parseInt(offset) || 0);

    const { rows } = await db.query(
      `SELECT * FROM social_media_assets
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM social_media_assets WHERE ${conditions.join(' AND ')}`,
      values.slice(0, -2)
    );

    res.json({ media: rows, total: countResult.rows[0].total });
  } catch (err) {
    console.error('[socialMediaController.listMedia] Error:', err);
    res.status(500).json({ error: 'Failed to list media.' });
  }
}

async function uploadMedia(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  try {
    const ext = require('path').extname(req.file.originalname).toLowerCase();
    let type = 'document';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) type = 'image';
    else if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) type = 'video';
    else if (ext === '.gif') type = 'gif';
    else if (['.mp3', '.wav', '.ogg'].includes(ext)) type = 'audio';

    const url = `/uploads/social-media/${req.file.filename}`;
    const { name, altText, tags, folderId, isBrandAsset } = req.body;

    let parsedTags = [];
    if (tags) { try { parsedTags = JSON.parse(tags); } catch { parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean); } }

    const { rows } = await db.query(
      `INSERT INTO social_media_assets (org_id, uploaded_by, name, type, url, size, alt_text, tags, folder_id, is_brand_asset)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [req.user.orgId, req.user.id, name || req.file.originalname, type, url, req.file.size,
       altText || null, parsedTags, folderId || null, isBrandAsset === 'true']
    );

    res.status(201).json({ media: rows[0] });
  } catch (err) {
    console.error('[socialMediaController.uploadMedia] Error:', err);
    try { await require('fs').promises.unlink(req.file.path); } catch {}
    res.status(500).json({ error: 'Failed to upload media.' });
  }
}

async function deleteMedia(req, res) {
  try {
    const result = await db.query(
      `SELECT url FROM social_media_assets WHERE id = $1 AND org_id = $2`,
      [req.params.id, req.user.orgId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Media not found.' });

    await db.query(`DELETE FROM social_media_assets WHERE id = $1`, [req.params.id]);

    try { await require('fs').promises.unlink(require('path').join(__dirname, '../..', result.rows[0].url)); } catch {}

    res.json({ ok: true });
  } catch (err) {
    console.error('[socialMediaController.deleteMedia] Error:', err);
    res.status(500).json({ error: 'Failed to delete media.' });
  }
}

async function createMediaFolder(req, res) {
  try {
    const { name, parentId } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Folder name is required.' });

    const { rows } = await db.query(
      `INSERT INTO social_asset_folders (org_id, name, parent_id) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.orgId, name.trim(), parentId || null]
    );
    res.status(201).json({ folder: rows[0] });
  } catch (err) {
    console.error('[socialMediaController.createMediaFolder] Error:', err);
    res.status(500).json({ error: 'Failed to create folder.' });
  }
}

async function listMediaFolders(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT f.*,
              (SELECT COUNT(*)::int FROM social_media_assets WHERE folder_id = f.id) AS asset_count,
              (SELECT COUNT(*)::int FROM social_asset_folders WHERE parent_id = f.id) AS subfolder_count
       FROM social_asset_folders f
       WHERE f.org_id = $1
       ORDER BY f.name ASC`,
      [req.user.orgId]
    );
    res.json({ folders: rows });
  } catch (err) {
    console.error('[socialMediaController.listMediaFolders] Error:', err);
    res.status(500).json({ error: 'Failed to list folders.' });
  }
}

// ============================================================
// EXPORTS
// ============================================================



// ============================================================
// CALENDAR EXPORT
// ============================================================

async function exportCalendar(req, res) {
  try {
    const { from, to, format } = req.query;
    const f = from || new Date(Date.now() - 90 * 86400000).toISOString();
    const t = to || new Date(Date.now() + 90 * 86400000).toISOString();

    const { rows } = await db.query(
      `SELECT spt.scheduled_at, spt.status AS target_status,
              p.content_text, p.post_type, p.status AS post_status,
              sa.account_name, sp.name AS platform_name, sp.slug AS platform_slug
       FROM social_post_targets spt
       JOIN social_posts p ON p.id = spt.post_id
       JOIN social_accounts sa ON sa.id = spt.account_id
       JOIN social_platforms sp ON sp.id = sa.platform_id
       WHERE p.org_id = $1 AND spt.scheduled_at >= $2 AND spt.scheduled_at <= $3
       ORDER BY spt.scheduled_at ASC`,
      [req.user.orgId, f, t]
    );

    if (format === 'ical' || format === 'ics') {
      let ical = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//DigitpenHub//SocialMedia//EN\r\n';
      for (const ev of rows) {
        const start = new Date(ev.scheduled_at);
        const end = new Date(start.getTime() + 3600000);
        const uid = 'social-' + ev.platform_slug + '-' + start.getTime() + '@digitpenhub';
        const summary = (ev.content_text || 'Social post').substring(0, 100).replace(/[,;\n]/g, ' ');
        ical += 'BEGIN:VEVENT\r\n';
        ical += 'UID:' + uid + '\r\n';
        ical += 'DTSTART:' + start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z\r\n';
        ical += 'DTEND:' + end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z\r\n';
        ical += 'SUMMARY:' + summary + '\r\n';
        ical += 'DESCRIPTION:Post for ' + ev.account_name + ' on ' + ev.platform_name + '\r\n';
        ical += 'STATUS:' + (ev.target_status === 'published' ? 'CONFIRMED' : 'TENTATIVE') + '\r\n';
        ical += 'END:VEVENT\r\n';
      }
      ical += 'END:VCALENDAR\r\n';
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=social-calendar.ics');
      return res.send(ical);
    }

    res.json({ events: rows, count: rows.length, exportedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[socialMediaController.exportCalendar] Error:', err);
    res.status(500).json({ error: 'Failed to export calendar.' });
  }
}



// ============================================================
// APPROVAL WORKFLOW
// ============================================================

// Submit a post for approval
async function submitForApproval(req, res) {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) return res.status(400).json({ error: 'assignedTo (user ID) is required.' });

    // Verify post exists and belongs to org
    const postCheck = await db.query(
      'SELECT id, status, created_by FROM social_posts WHERE id = $1 AND org_id = $2',
      [id, req.user.orgId]
    );
    if (!postCheck.rows.length) return res.status(404).json({ error: 'Post not found.' });

    // Verify assignee exists in org
    const userCheck = await db.query(
      'SELECT id FROM users WHERE id = $1 AND org_id = $2',
      [assignedTo, req.user.orgId]
    );
    if (!userCheck.rows.length) return res.status(400).json({ error: 'Assigned user not found in your organization.' });

    // Check if already has a pending approval
    const pending = await db.query(
      "SELECT id FROM social_approval_requests WHERE post_id = $1 AND status = 'pending'",
      [id]
    );
    if (pending.rows.length) return res.status(400).json({ error: 'Post already has a pending approval request.' });

    const { rows } = await db.query(
      "INSERT INTO social_approval_requests (post_id, requested_by, assigned_to, status) VALUES ($1, $2, $3, 'pending') RETURNING *",
      [id, req.user.id, assignedTo]
    );

    // Update post status
    await db.query("UPDATE social_posts SET status = 'pending_approval', updated_at = now() WHERE id = $1", [id]);

    res.status(201).json({ approval: rows[0], message: 'Submitted for approval.' });
  } catch (err) {
    console.error('[socialMediaController.submitForApproval] Error:', err);
    res.status(500).json({ error: 'Failed to submit for approval.' });
  }
}

// Approve a post
async function approvePost(req, res) {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const approvalRes = await db.query(
      "SELECT id, post_id FROM social_approval_requests WHERE id = $1 AND assigned_to = $2 AND status = 'pending'",
      [id, req.user.id]
    );
    if (!approvalRes.rows.length) return res.status(404).json({ error: 'Pending approval request not found.' });

    await db.query(
      "UPDATE social_approval_requests SET status = 'approved', feedback = $1, reviewed_at = now() WHERE id = $2",
      [feedback || null, id]
    );

    await db.query("UPDATE social_posts SET status = 'approved', updated_at = now() WHERE id = $1", [approvalRes.rows[0].post_id]);

    res.json({ ok: true, message: 'Post approved.' });
  } catch (err) {
    console.error('[socialMediaController.approvePost] Error:', err);
    res.status(500).json({ error: 'Failed to approve post.' });
  }
}

// Reject a post
async function rejectPost(req, res) {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    if (!feedback) return res.status(400).json({ error: 'Feedback is required when rejecting.' });

    const approvalRes = await db.query(
      "SELECT id, post_id FROM social_approval_requests WHERE id = $1 AND assigned_to = $2 AND status = 'pending'",
      [id, req.user.id]
    );
    if (!approvalRes.rows.length) return res.status(404).json({ error: 'Pending approval request not found.' });

    await db.query(
      "UPDATE social_approval_requests SET status = 'changes_requested', feedback = $1, reviewed_at = now() WHERE id = $2",
      [feedback, id]
    );

    await db.query("UPDATE social_posts SET status = 'draft', updated_at = now() WHERE id = $1", [approvalRes.rows[0].post_id]);

    res.json({ ok: true, message: 'Post rejected. Feedback sent to author.' });
  } catch (err) {
    console.error('[socialMediaController.rejectPost] Error:', err);
    res.status(500).json({ error: 'Failed to reject post.' });
  }
}

// List approval requests for current user
async function listApprovals(req, res) {
  try {
    const { status } = req.query;
    const conditions = ['(ar.assigned_to = $1 OR ar.requested_by = $1)'];
    const values = [req.user.id];
    let idx = 2;
    if (status) { conditions.push('ar.status = $' + idx); values.push(status); idx++; }

    const { rows } = await db.query(
      "SELECT ar.id, ar.status, ar.feedback, ar.created_at, ar.reviewed_at, "
      + "p.id AS post_id, p.content_text, p.post_type, p.status AS post_status, "
      + "req.full_name AS requested_by_name, "
      + "ass.full_name AS assigned_to_name "
      + "FROM social_approval_requests ar "
      + "JOIN social_posts p ON p.id = ar.post_id "
      + "JOIN users req ON req.id = ar.requested_by "
      + "JOIN users ass ON ass.id = ar.assigned_to "
      + "WHERE " + conditions.join(' AND ') + " "
      + "ORDER BY ar.created_at DESC",
      values
    );

    res.json({ approvals: rows });
  } catch (err) {
    console.error('[socialMediaController.listApprovals] Error:', err);
    res.status(500).json({ error: 'Failed to list approvals.' });
  }
}

// Get approval history for a post
async function getPostApprovalHistory(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      "SELECT ar.*, req.full_name AS requested_by_name, ass.full_name AS assigned_to_name "
      + "FROM social_approval_requests ar "
      + "JOIN users req ON req.id = ar.requested_by "
      + "JOIN users ass ON ass.id = ar.assigned_to "
      + "WHERE ar.post_id = $1 "
      + "ORDER BY ar.created_at DESC",
      [id]
    );

    res.json({ history: rows });
  } catch (err) {
    console.error('[socialMediaController.getPostApprovalHistory] Error:', err);
    res.status(500).json({ error: 'Failed to get approval history.' });
  }
}

// ============================================================
// COMMENTS (Internal Collaboration)
// ============================================================

// List comments for a post
async function listComments(req, res) {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      "SELECT sc.*, u.full_name AS user_name, u.avatar_url AS user_avatar "
      + "FROM social_post_comments sc "
      + "JOIN users u ON u.id = sc.user_id "
      + "WHERE sc.post_id = $1 "
      + "ORDER BY sc.created_at ASC",
      [id]
    );

    // Build threaded structure
    const topLevel = rows.filter(c => !c.parent_id);
    const replies = rows.filter(c => c.parent_id);

    const threads = topLevel.map(c => ({
      ...c,
      replies: replies.filter(r => r.parent_id === c.id),
    }));

    res.json({ comments: threads, total: rows.length });
  } catch (err) {
    console.error('[socialMediaController.listComments] Error:', err);
    res.status(500).json({ error: 'Failed to list comments.' });
  }
}

// Add a comment to a post
async function addComment(req, res) {
  try {
    const { id } = req.params;
    const { content, parentId } = req.body;

    if (!content || !content.trim()) return res.status(400).json({ error: 'Comment content is required.' });

    // Verify post exists
    const postCheck = await db.query(
      'SELECT id FROM social_posts WHERE id = $1 AND org_id = $2',
      [id, req.user.orgId]
    );
    if (!postCheck.rows.length) return res.status(404).json({ error: 'Post not found.' });

    // If parentId provided, verify it exists
    if (parentId) {
      const parentCheck = await db.query(
        'SELECT id FROM social_post_comments WHERE id = $1 AND post_id = $2',
        [parentId, id]
      );
      if (!parentCheck.rows.length) return res.status(400).json({ error: 'Parent comment not found.' });
    }

    const { rows } = await db.query(
      'INSERT INTO social_post_comments (post_id, user_id, content, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, req.user.id, content.trim(), parentId || null]
    );

    res.status(201).json({ comment: rows[0] });
  } catch (err) {
    console.error('[socialMediaController.addComment] Error:', err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
}

// Delete a comment (only comment author or admin)
async function deleteComment(req, res) {
  try {
    const { id } = req.params;

    const { rowCount } = await db.query(
      'DELETE FROM social_post_comments WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (!rowCount) return res.status(404).json({ error: 'Comment not found or not authorized to delete.' });

    res.json({ ok: true });
  } catch (err) {
    console.error('[socialMediaController.deleteComment] Error:', err);
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
}

// ============================================================
// ACTIVITY LOG
// ============================================================

// Get activity log for a post
async function getPostActivity(req, res) {
  try {
    const { id } = req.params;

    // Combine approval history + comments into an activity feed
    const approvalRes = await db.query(
      "SELECT 'approval' AS type, ar.status AS action, ar.feedback AS details, "
      + "req.full_name AS actor_name, ar.created_at "
      + "FROM social_approval_requests ar "
      + "JOIN users req ON req.id = ar.requested_by "
      + "WHERE ar.post_id = $1",
      [id]
    );

    const commentRes = await db.query(
      "SELECT 'comment' AS type, 'comment' AS action, sc.content AS details, "
      + "u.full_name AS actor_name, sc.created_at "
      + "FROM social_post_comments sc "
      + "JOIN users u ON u.id = sc.user_id "
      + "WHERE sc.post_id = $1",
      [id]
    );

    // Also add publish/schedule events from target history
    const targetRes = await db.query(
      "SELECT 'publish' AS type, spt.status AS action, "
      + "CASE WHEN spt.published_at IS NOT NULL THEN 'Published to ' || sa.account_name "
      + "     WHEN spt.scheduled_at IS NOT NULL THEN 'Scheduled on ' || sa.account_name || ' for ' || spt.scheduled_at::text "
      + "     ELSE 'Target: ' || sa.account_name END AS details, "
      + "sa.account_name AS actor_name, "
      + "COALESCE(spt.published_at, spt.created_at) AS created_at "
      + "FROM social_post_targets spt "
      + "JOIN social_accounts sa ON sa.id = spt.account_id "
      + "WHERE spt.post_id = $1",
      [id]
    );

    const all = [...approvalRes.rows, ...commentRes.rows, ...targetRes.rows]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ activity: all });
  } catch (err) {
    console.error('[socialMediaController.getPostActivity] Error:', err);
    res.status(500).json({ error: 'Failed to get activity.' });
  }
}

module.exports = {
  // Accounts
  listAccounts, connectAccount, disconnectAccount, reconnectAccount, checkAllHealth, getAccountAnalytics,
  // Workspaces
  listWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace,
  // Posts
  listPosts, getPost, createPost, updatePost, deletePost, duplicatePost,
  // Scheduling
  schedulePost, publishNow, cancelPost,
  // Calendar
  getCalendar, reschedulePost, exportCalendar,
  // Approvals
  submitForApproval, approvePost, rejectPost, listApprovals, getPostApprovalHistory,
  // Comments
  listComments, addComment, deleteComment,
  // Activity
  getPostActivity,
  // Media
  listMedia, uploadMedia, deleteMedia, createMediaFolder, listMediaFolders,
};