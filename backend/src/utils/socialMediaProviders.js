// ============================================================
// Social Media Provider Abstraction Layer — v2 (Enterprise)
//
// Every platform provides a consistent interface:
//   exchangeCode(code, redirectUri, clientId, clientSecret)
//   getProfile(accessToken)
//   publishPost(accessToken, accountId, { text, mediaUrls, linkUrl, postType })
//   refreshToken(...)
// ============================================================

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// ─── helpers ───────────────────────────────────────────────────

function buildError(platform, message) {
  const err = new Error(`[${platform}] ${message}`);
  err.platform = platform;
  return err;
}

// Upload a remote URL to a destination via POST binary stream
async function uploadBinary(url, destPath) {
  const writer = fs.createWriteStream(destPath);
  const resp = await axios({ url, method: 'GET', responseType: 'stream' });
  resp.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// ════════════════════════════════════════════════════════════════
// FACEBOOK (Graph API v18.0)
// ════════════════════════════════════════════════════════════════

async function fbGraph(endpoint, accessToken, params = {}) {
  const { data } = await axios.get(`https://graph.facebook.com/v18.0/${endpoint}`, {
    params: { access_token: accessToken, ...params },
  });
  return data;
}

async function fbGraphPost(endpoint, accessToken, payload = {}, method = 'post') {
  const fn = method === 'post' ? axios.post : axios.put;
  const { data } = await fn(`https://graph.facebook.com/v18.0/${endpoint}`, null, {
    params: { access_token: accessToken, ...payload },
  });
  return data;
}

// Upload an image URL to Facebook to get a photo ID for carousels
async function fbUploadPhoto(pageAccessToken, imageUrl) {
  // For page tokens, create photo on page directly
  const { data } = await axios.post(`https://graph.facebook.com/v18.0/me/photos`, {
    url: imageUrl,
    published: false,
    access_token: pageAccessToken,
  });
  return data.id;
}

const facebook = {
  exchangeCode: async (code, redirectUri, clientId, clientSecret) => {
    const { data } = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: { client_id: clientId, redirect_uri: redirectUri, client_secret: clientSecret, code },
    });
    // Exchange for long-lived token (60 days)
    const { data: longLived } = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: clientId,
        client_secret: clientSecret,
        fb_exchange_token: data.access_token,
      },
    });
    const scopes = data.scopes ? data.scopes.split(',') : [];
    return { accessToken: longLived.access_token, expiresIn: longLived.expires_in || 5184000, scopes };
  },

  getProfile: async (accessToken) => {
    const me = await fbGraph('me', accessToken, { fields: 'id,name,picture' });
    const pages = await fbGraph('me/accounts', accessToken, {
      fields: 'id,name,picture,access_token,instagram_business_account{id,username,profile_picture_url}',
    });
    const pageList = (pages.data || []).map(p => ({
      id: p.id, name: p.name, avatar: p.picture?.data?.url, accessToken: p.access_token,
      instagramBusinessId: p.instagram_business_account?.id,
      instagramUsername: p.instagram_business_account?.username,
    }));
    return { userId: me.id, name: me.name, avatar: me.picture?.data?.url, pages: pageList };
  },

  publishPost: async (accessToken, accountId, { text, linkUrl, mediaUrls }) => {
    // For Facebook Page posts, use the page's access token
    const token = accessToken;
    const params = { message: text || '' };

    if (linkUrl) {
      params.link = linkUrl;
    }

    if (mediaUrls && mediaUrls.length > 0) {
      // Upload each image to get a photo ID, then attach
      const photoIds = [];
      for (const url of mediaUrls) {
        try {
          const id = await fbUploadPhoto(token, url);
          photoIds.push(id);
        } catch (e) {
          console.error(`[facebook] Failed to upload photo ${url}:`, e.message);
        }
      }

      if (photoIds.length === 1) {
        // Single image post — post as photo
        const result = await fbGraphPost(`${accountId}/photos`, token, {
          url: mediaUrls[0],
          message: text || '',
        });
        return { id: result.id, url: `https://facebook.com/photo.php?fbid=${result.id}` };
      }

      if (photoIds.length > 1) {
        // Carousel — use attached_media
        params.attached_media = JSON.stringify(photoIds.map(id => ({ media_fbid: id })));
      }
    }

    const result = await fbGraphPost(`${accountId}/feed`, token, params);
    return { id: result.id, url: `https://facebook.com/${result.id}` };
  },

  refreshToken: async (clientId, clientSecret, token) => {
    const { data } = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token', client_id: clientId,
        client_secret: clientSecret, fb_exchange_token: token,
      },
    });
    return { accessToken: data.access_token, expiresIn: data.expires_in || 5184000 };
  },

  getProfileUrl: (accountId) => `https://facebook.com/${accountId}`,
};

// ════════════════════════════════════════════════════════════════
// INSTAGRAM (via Facebook Graph API — Business/Creator accounts)
// ════════════════════════════════════════════════════════════════

const instagram = {
  exchangeCode: async (code, redirectUri, clientId, clientSecret) => {
    // Instagram uses Facebook Login — get a FB token first, then exchange
    const fbToken = await facebook.exchangeCode(code, redirectUri, clientId, clientSecret);
    return fbToken;
  },

  getProfile: async (accessToken) => {
    const me = await fbGraph('me', accessToken, { fields: 'id,name' });
    // Find IG business accounts connected to managed pages
    const accounts = await fbGraph(`${me.id}/accounts`, accessToken, {
      fields: 'instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count}',
    });
    const igAccounts = [];
    for (const page of accounts.data || []) {
      if (page.instagram_business_account) {
        const ig = page.instagram_business_account;
        // Get a page-scoped token for IG operations
        const pageToken = await fbGraph(`${page.id}`, accessToken, { fields: 'access_token' });
        igAccounts.push({
          id: ig.id,
          name: ig.username || ig.name,
          avatar: ig.profile_picture_url,
          username: ig.username,
          followersCount: ig.followers_count,
          mediaCount: ig.media_count,
          pageId: page.id,
          // Need page access token for IG content publishing
          pageAccessToken: pageToken.access_token,
        });
      }
    }
    return { userId: me.id, name: me.name, pages: igAccounts };
  },

  publishPost: async (accessToken, igUserId, { text, mediaUrls, postType }) => {
    // Instagram Content Publishing API
    // For IG, the accessToken must be a Page Access Token with instagram_content_publish scope
    const token = accessToken;
    const caption = text || '';

    if (postType === 'story') {
      if (!mediaUrls || mediaUrls.length === 0) {
        throw buildError('instagram', 'Stories require media.');
      }
      const creation = await fbGraphPost(`${igUserId}/media`, token, {
        media_type: 'STORIES',
        media_url: mediaUrls[0],
      });
      const publish = await fbGraphPost(`${igUserId}/media_publish`, token, {
        creation_id: creation.id,
      });
      return { id: publish.id, url: `https://instagram.com/stories/${igUserId}/${publish.id}` };
    }

    if (!mediaUrls || mediaUrls.length === 0) {
      // Text-only not supported — IG requires media
      throw buildError('instagram', 'Instagram requires at least one image or video with the caption.');
    }

    if (mediaUrls.length === 1) {
      const isVideo = /\.(mp4|mov|avi|webm)/i.test(mediaUrls[0]);
      const creation = await fbGraphPost(`${igUserId}/media`, token, {
        media_type: isVideo ? 'VIDEO' : 'IMAGE',
        media_url: mediaUrls[0],
        caption,
      });
      const publish = await fbGraphPost(`${igUserId}/media_publish`, token, {
        creation_id: creation.id,
      });
      return { id: publish.id, url: `https://instagram.com/p/${publish.id}` };
    }

    // Carousel (up to 10 items)
    const children = await Promise.all(
      mediaUrls.slice(0, 10).map(url =>
        fbGraphPost(`${igUserId}/media`, token, {
          media_type: /\.(mp4|mov)/i.test(url) ? 'VIDEO' : 'IMAGE',
          media_url: url,
          is_carousel_item: true,
        }).then(r => r.id)
      )
    );
    const creation = await fbGraphPost(`${igUserId}/media`, token, {
      media_type: 'CAROUSEL',
      children: children.join(','),
      caption,
    });
    const publish = await fbGraphPost(`${igUserId}/media_publish`, token, {
      creation_id: creation.id,
    });
    return { id: publish.id, url: `https://instagram.com/p/${publish.id}` };
  },

  getProfileUrl: (igUserId) => `https://instagram.com/${igUserId}`,
};

// ════════════════════════════════════════════════════════════════
// X / TWITTER (API v2 — OAuth 2.0 PKCE)
// ════════════════════════════════════════════════════════════════

const twitter = {
  exchangeCode: async (code, redirectUri, clientId, clientSecret, codeVerifier) => {
    // OAuth 2.0 PKCE token exchange
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier || 'challenge',
    });
    if (clientSecret) params.append('client_secret', clientSecret);

    const { data } = await axios.post('https://api.twitter.com/2/oauth2/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scopes: data.scope?.split(' ') || [],
    };
  },

  getProfile: async (accessToken) => {
    const { data } = await axios.get('https://api.twitter.com/2/users/me', {
      params: { 'user.fields': 'id,name,username,profile_image_url,public_metrics' },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const u = data.data;
    return {
      userId: u.id,
      name: u.name,
      username: u.username,
      avatar: u.profile_image_url?.replace('_normal', ''),
      followersCount: u.public_metrics?.followers_count,
      followingCount: u.public_metrics?.following_count,
      tweetCount: u.public_metrics?.tweet_count,
    };
  },

  publishPost: async (accessToken, userId, { text, mediaUrls, linkUrl }) => {
    let tweetText = text || '';
    if (linkUrl) tweetText += '\n' + linkUrl;

    // Media upload via Twitter API v2 media upload (separate endpoint)
    let mediaIds = [];
    if (mediaUrls && mediaUrls.length > 0) {
      // For v2, media must be uploaded via the media/upload endpoint (v1.1)
      // We use the v1.1 upload endpoint with the same OAuth 2.0 token
      for (const url of mediaUrls) {
        try {
          const resp = await axios.get(url, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(resp.data);
          // Twitter v2 media upload via delegated upload
          const fd = new FormData();
          fd.append('media', buffer, { filename: 'media.jpg' });
          const uploadRes = await axios.post('https://upload.twitter.com/1.1/media/upload.json', fd, {
            headers: { ...fd.getHeaders(), Authorization: `Bearer ${accessToken}` },
          });
          if (uploadRes.data?.media_id_string) {
            mediaIds.push(uploadRes.data.media_id_string);
          }
        } catch (e) {
          console.error(`[twitter] Media upload failed:`, e.message);
        }
      }
    }

    const payload = { text: tweetText };
    if (mediaIds.length > 0) {
      payload.media = { media_ids: mediaIds };
    }

    const { data } = await axios.post('https://api.twitter.com/2/tweets', payload, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    if (!data?.data?.id) throw buildError('twitter', 'Failed to publish tweet');
    return {
      id: data.data.id,
      url: `https://twitter.com/i/web/status/${data.data.id}`,
    };
  },

  refreshToken: async (clientId, refreshToken) => {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    });
    const { data } = await axios.post('https://api.twitter.com/2/oauth2/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  },

  getProfileUrl: (username) => `https://twitter.com/${username}`,
};

// ════════════════════════════════════════════════════════════════
// LINKEDIN (Marketing API v2)
// ════════════════════════════════════════════════════════════════

const linkedin = {
  exchangeCode: async (code, redirectUri, clientId, clientSecret) => {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const { data } = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      scopes: data.scope?.split(' ') || [],
    };
  },

  getProfile: async (accessToken) => {
    const { data } = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Get organizations the user administers
    let orgs = [];
    try {
      const orgRes = await axios.get('https://api.linkedin.com/v2/organizationalEntityAcls', {
        params: { q: 'roleAssignee', role: 'ADMINISTRATOR' },
        headers: { Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' },
      });
      if (orgRes.data?.elements) {
        orgs = await Promise.all(
          orgRes.data.elements.map(async (el) => {
            const orgId = el.organizationalTarget?.replace('urn:li:organization:', '');
            try {
              const orgInfo = await axios.get(`https://api.linkedin.com/v2/organizations/${orgId}`, {
                params: { projection: '(id,localizedName,vanityName,logoV2(original~:playableStreams))' },
                headers: { Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' },
              });
              return {
                id: orgId,
                name: orgInfo.data.localizedName,
                vanityName: orgInfo.data.vanityName,
                avatar: orgInfo.data.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier,
              };
            } catch { return null; }
          })
        );
        orgs = orgs.filter(Boolean);
      }
    } catch { /* user may not have org admin access */ }

    return {
      userId: data.sub,
      name: data.name,
      avatar: data.picture,
      email: data.email,
    };
  },

  publishPost: async (accessToken, authorId, { text, mediaUrls, linkUrl }) => {
    // LinkedIn UGC Posts API — supports text, article (link), and image shares
    const author = `urn:li:person:${authorId}`;
    let shareMediaCategory = 'NONE';
    const media = [];

    if (linkUrl) {
      shareMediaCategory = 'ARTICLE';
      media.push({ status: 'READY', originalUrl: linkUrl });
    }

    if (mediaUrls && mediaUrls.length > 0) {
      // Register image upload, then share
      shareMediaCategory = 'IMAGE';
      for (const url of mediaUrls) {
        try {
          // Step 1: Register upload
          const registerRes = await axios.post(
            'https://api.linkedin.com/v2/assets?action=registerUpload',
            {
              registerUploadRequest: {
                recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                owner: author,
                serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
              },
            },
            { headers: { Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' } }
          );
          const uploadUrl = registerRes.data.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
          const assetId = registerRes.data.value?.asset;

          if (uploadUrl && assetId) {
            // Step 2: Upload image binary
            const imgResp = await axios.get(url, { responseType: 'stream' });
            await axios.post(uploadUrl, imgResp.data, {
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'image/jpeg' },
            });
            media.push({ status: 'READY', media: assetId });
          }
        } catch (e) {
          console.error(`[linkedin] Image upload failed:`, e.message);
        }
      }
    }

    const body = {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: text || '' },
          shareMediaCategory,
          media: media.length > 0 ? media : undefined,
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };

    const { data } = await axios.post('https://api.linkedin.com/v2/ugcPosts', body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
    });
    return { id: data.id, url: `https://linkedin.com/feed/update/${data.id}` };
  },

  refreshToken: async (clientId, clientSecret, refreshToken) => {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const { data } = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  },

  getProfileUrl: (vanityName) => vanityName ? `https://linkedin.com/in/${vanityName}` : '#',
};

// ════════════════════════════════════════════════════════════════
// TIKTOK (Content Posting API)
// ════════════════════════════════════════════════════════════════

const tiktok = {
  exchangeCode: async (code, redirectUri, clientKey, clientSecret) => {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_key: clientKey,
      client_secret: clientSecret,
    });
    const { data } = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' },
    });
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scopes: (data.scope || '').split(','),
    };
  },

  getProfile: async (accessToken) => {
    const { data } = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
      params: { fields: 'open_id,union_id,avatar_url,display_name,username,follower_count,following_count,video_count' },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const u = data.data?.user;
    if (!u) throw buildError('tiktok', 'Failed to get user profile.');
    return {
      userId: u.open_id,
      name: u.display_name,
      username: u.username,
      avatar: u.avatar_url,
      followersCount: u.follower_count,
      followingCount: u.following_count,
      videoCount: u.video_count,
    };
  },

  publishPost: async (accessToken, openId, { text, mediaUrls }) => {
    if (!mediaUrls || mediaUrls.length === 0) {
      throw buildError('tiktok', 'TikTok requires a video upload.');
    }

    // Step 1: Initialize upload
    const initRes = await axios.post(
      'https://open.tiktokapis.com/v2/video/upload/init/',
      { source: 'FILE_UPLOAD' },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    const uploadUrl = initRes.data?.data?.upload_url;
    const publishId = initRes.data?.data?.publish_id;
    if (!uploadUrl || !publishId) throw buildError('tiktok', 'Failed to initialize video upload.');

    // Step 2: Upload video binary
    const videoResp = await axios.get(mediaUrls[0], { responseType: 'stream' });
    await axios.post(uploadUrl, videoResp.data, {
      headers: { 'Content-Type': 'video/mp4', 'Content-Length': (await axios.head(mediaUrls[0])).headers['content-length'] },
    });

    // Step 3: Check upload status
    let status = 'IN_PROGRESS';
    let attempts = 0;
    while (status === 'IN_PROGRESS' && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await axios.get(`https://open.tiktokapis.com/v2/video/upload/status/?publish_id=${publishId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      status = statusRes.data?.data?.status;
      attempts++;
    }
    if (status !== 'COMPLETE') throw buildError('tiktok', `Video upload status: ${status}`);

    // Step 4: Publish the video
    const publishRes = await axios.post(
      'https://open.tiktokapis.com/v2/video/publish/',
      {
        publish_id: publishId,
        source: 'FILE_UPLOAD',
        post_info: {
          title: text || '',
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_stitch: false,
          disable_comment: false,
        },
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    const postId = publishRes.data?.data?.post_id;
    return { id: postId || publishId, url: `https://tiktok.com/@user/video/${postId || publishId}` };
  },

  refreshToken: async (clientKey, refreshToken) => {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_key: clientKey,
    });
    const { data } = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  },

  getProfileUrl: (username) => `https://tiktok.com/@${username}`,
};

// ════════════════════════════════════════════════════════════════
// YOUTUBE (Data API v3 — resumable upload)
// ════════════════════════════════════════════════════════════════

const youtube = {
  exchangeCode: async (code, redirectUri, clientId, clientSecret) => {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const { data } = await axios.post('https://oauth2.googleapis.com/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  },

  getProfile: async (accessToken) => {
    const { data } = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet,statistics', mine: true },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const ch = data.items?.[0];
    if (!ch) throw buildError('youtube', 'No YouTube channel found.');
    return {
      userId: ch.id,
      name: ch.snippet.title,
      avatar: ch.snippet.thumbnails?.default?.url,
      subscribersCount: ch.statistics?.subscriberCount,
      videoCount: ch.statistics?.videoCount,
      viewCount: ch.statistics?.viewCount,
    };
  },

  publishPost: async (accessToken, channelId, { text, mediaUrls }) => {
    if (!mediaUrls || mediaUrls.length === 0) {
      throw buildError('youtube', 'YouTube requires a video upload.');
    }

    // Step 1: Create resumable upload session
    const metadata = {
      snippet: {
        title: text ? text.substring(0, 100) : 'Untitled Video',
        description: text ? text.substring(0, 5000) : '',
        channelId,
      },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
    };

    const initRes = await axios.post(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      metadata,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': 'video/*',
        },
      }
    );

    const uploadUrl = initRes.headers.location;
    if (!uploadUrl) throw buildError('youtube', 'Failed to get upload URL');

    // Step 2: Stream video binary to resumable URL
    const videoResp = await axios.get(mediaUrls[0], { responseType: 'stream' });
    const { data } = await axios.put(uploadUrl, videoResp.data, {
      headers: { 'Content-Type': 'video/*' },
    });

    return { id: data.id, url: `https://youtube.com/watch?v=${data.id}` };
  },

  refreshToken: async (clientId, clientSecret, refreshToken) => {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const { data } = await axios.post('https://oauth2.googleapis.com/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  },

  getProfileUrl: (channelId) => `https://youtube.com/channel/${channelId}`,
};

// ════════════════════════════════════════════════════════════════
// PINTEREST (API v5)
// ════════════════════════════════════════════════════════════════

const pinterest = {
  exchangeCode: async (code, redirectUri, clientId, clientSecret) => {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const { data } = await axios.post('https://api.pinterest.com/v5/oauth/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scopes: (data.scope || '').split(','),
    };
  },

  getProfile: async (accessToken) => {
    const { data } = await axios.get('https://api.pinterest.com/v5/user_account', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Get boards
    const boardsRes = await axios.get('https://api.pinterest.com/v5/boards', {
      params: { page_size: 100 },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return {
      userId: data.username,
      name: `${data.first_name} ${data.last_name}`.trim() || data.username,
      username: data.username,
      avatar: data.profile_image,
      followersCount: data.follower_count,
      boards: (boardsRes.data?.items || []).map(b => ({
        id: b.id, name: b.name, description: b.description, privacy: b.privacy,
      })),
    };
  },

  publishPost: async (accessToken, username, { text, mediaUrls, linkUrl, platformSpecific }) => {
    if (!mediaUrls || mediaUrls.length === 0) {
      throw buildError('pinterest', 'Pinterest requires at least one image.');
    }

    // Use specified board, or fallback
    const boardId = platformSpecific?.boardId;

    const body = {
      board_id: boardId || username,
      title: text ? text.substring(0, 100) : 'Pin from Digitpen Hub',
      description: text || '',
      link: linkUrl || '',
      media_source: {
        source_type: 'image_url',
        url: mediaUrls[0],
      },
    };

    const { data } = await axios.post('https://api.pinterest.com/v5/pins', body, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    return { id: data.id, url: `https://pinterest.com/pin/${data.id}` };
  },

  refreshToken: async (clientId, clientSecret, refreshToken) => {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const { data } = await axios.post('https://api.pinterest.com/v5/oauth/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  },

  getProfileUrl: (username) => `https://pinterest.com/${username}`,
};

// ════════════════════════════════════════════════════════════════
// BLUESKY (AT Protocol — com.atproto.repo.createRecord)
// ════════════════════════════════════════════════════════════════

const bluesky = {
  // BlueSky uses App Password auth (no OAuth). `accessToken` = service endpoint
  // `refreshToken` = App Password; `clientId` = handle (e.g. user.bsky.social)
  exchangeCode: async (handle, appPassword) => {
    // BlueSky doesn't use OAuth — users provide handle + app password
    // This function creates a session
    const { data: session } = await axios.post(
      'https://bsky.social/xrpc/com.atproto.server.createSession',
      { identifier: handle, password: appPassword },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return {
      accessToken: session.accessJwt,
      refreshToken: session.refreshJwt,
      did: session.did,
      handle: session.handle,
      scopes: ['atproto'],
    };
  },

  getProfile: async (accessToken) => {
    // Parse JWT to get DID, or use a profile call
    const { data } = await axios.get('https://bsky.social/xrpc/app.bsky.actor.getProfile', {
      params: { actor: 'me' },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return {
      userId: data.did,
      name: data.displayName || data.handle,
      username: data.handle,
      avatar: data.avatar,
      description: data.description,
      followersCount: data.followersCount,
      followsCount: data.followsCount,
      postCount: data.postsCount,
    };
  },

  publishPost: async (accessToken, did, { text, mediaUrls, linkUrl }) => {
    // BlueSky posts = com.atproto.repo.createRecord with app.bsky.feed.post
    const facets = [];
    const embed = {};

    // Handle link embedding
    if (linkUrl) {
      facets.push({
        index: { byteStart: 0, byteEnd: text ? text.length : 0 },
        features: [{ $type: 'app.bsky.richtext.facet#link', uri: linkUrl }],
      });
    }

    // Handle image embedding
    if (mediaUrls && mediaUrls.length > 0) {
      // Step 1: Upload each image to get a blob reference
      const images = [];
      for (const url of mediaUrls) {
        try {
          const imgResp = await axios.get(url, { responseType: 'arraybuffer' });
          const imgBuffer = Buffer.from(imgResp.data);
          const blobRes = await axios.post(
            'https://bsky.social/xrpc/com.atproto.repo.uploadBlob',
            imgBuffer,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': imgResp.headers['content-type'] || 'image/jpeg',
              },
            }
          );
          images.push({
            alt: '',
            image: blobRes.data.blob,
          });
        } catch (e) {
          console.error(`[bluesky] Image upload failed:`, e.message);
        }
      }

      if (images.length > 0) {
        embed.$type = 'app.bsky.embed.images';
        embed.images = images;
      }
    }

    // Handle link card embed
    if (linkUrl && !embed.$type) {
      try {
        const linkPreview = await axios.get(linkUrl, { timeout: 5000 });
        const title = (linkPreview.data.match(/<title>(.*?)<\/title>/i) || [])[1] || linkUrl;
        embed.$type = 'app.bsky.embed.external';
        embed.external = {
          uri: linkUrl,
          title: title.substring(0, 200),
          description: '',
        };
      } catch {
        embed.$type = 'app.bsky.embed.external';
        embed.external = { uri: linkUrl, title: linkUrl, description: '' };
      }
    }

    const record = {
      $type: 'app.bsky.feed.post',
      text: text || '',
      createdAt: new Date().toISOString(),
    };
    if (facets.length > 0) record.facets = facets;
    if (embed.$type) record.embed = embed;

    const { data } = await axios.post(
      'https://bsky.social/xrpc/com.atproto.repo.createRecord',
      {
        repo: did,
        collection: 'app.bsky.feed.post',
        record,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const atUri = data.uri;
    const rkey = atUri.split('/').pop();
    return { id: rkey, url: `https://bsky.app/profile/${did}/post/${rkey}` };
  },

  refreshToken: async (refreshJwt) => {
    const { data } = await axios.post(
      'https://bsky.social/xrpc/com.atproto.server.refreshSession',
      {},
      { headers: { Authorization: `Bearer ${refreshJwt}` } }
    );
    return {
      accessToken: data.accessJwt,
      refreshToken: data.refreshJwt,
      did: data.did,
      handle: data.handle,
    };
  },

  getProfileUrl: (handle) => `https://bsky.app/profile/${handle}`,
};

// ════════════════════════════════════════════════════════════════
// THREADS (Meta's Threads API — via Facebook Graph 18.0)
// ════════════════════════════════════════════════════════════════

const threads = {
  // Threads uses the same Facebook Login as Instagram
  exchangeCode: async (code, redirectUri, clientId, clientSecret) => {
    return facebook.exchangeCode(code, redirectUri, clientId, clientSecret);
  },

  getProfile: async (accessToken) => {
    // Threads profiles are linked to Instagram Business accounts
    const me = await fbGraph('me', accessToken, { fields: 'id,name' });
    const igAccounts = await fbGraph(`${me.id}/accounts`, accessToken, {
      fields: 'instagram_business_account{id,username,profile_picture_url,threads_profile{id,username,profile_picture_url}}',
    });
    const threadsAccounts = [];
    for (const page of igAccounts.data || []) {
      const threadsProfile = page.instagram_business_account?.threads_profile;
      if (threadsProfile) {
        threadsAccounts.push({
          id: threadsProfile.id,
          name: threadsProfile.username,
          avatar: threadsProfile.profile_picture_url,
          username: threadsProfile.username,
          igBusinessAccountId: page.instagram_business_account.id,
        });
      }
    }
    return { userId: me.id, name: me.name, pages: threadsAccounts };
  },

  publishPost: async (accessToken, threadsUserId, { text, mediaUrls }) => {
    // Threads API uses /{threads-user-id}/threads endpoint
    const params = { media_type: 'TEXT', text: text || '' };

    if (mediaUrls && mediaUrls.length > 0) {
      if (mediaUrls.length === 1) {
        params.media_type = 'IMAGE';
        params.image_url = mediaUrls[0];
      } else {
        params.media_type = 'CAROUSEL';
        params.media_urls = JSON.stringify(mediaUrls.slice(0, 10));
      }
    }

    // Create threads media container
    const creation = await fbGraphPost(`${threadsUserId}/threads`, accessToken, params);
    if (!creation.id) throw buildError('threads', 'Failed to create threads container');

    // Check media status (for image/video processing)
    if (params.media_type !== 'TEXT') {
      let status = 'PROCESSING';
      let attempts = 0;
      while (status === 'PROCESSING' && attempts < 20) {
        await new Promise(r => setTimeout(r, 2000));
        const statusRes = await fbGraph(creation.id, accessToken, { fields: 'status' });
        status = statusRes.status;
        attempts++;
      }
      if (status === 'ERROR') throw buildError('threads', 'Threads media processing failed.');
    }

    // Publish the thread
    const publish = await fbGraphPost(`${threadsUserId}/threads_publish`, accessToken, {
      creation_id: creation.id,
    });

    return { id: publish.id, url: `https://threads.net/@user/post/${publish.id}` };
  },

  getProfileUrl: (username) => `https://threads.net/@${username}`,
};

// ════════════════════════════════════════════════════════════════
// GOOGLE BUSINESS PROFILE
// ════════════════════════════════════════════════════════════════

const googleBusiness = {
  exchangeCode: async (code, redirectUri, clientId, clientSecret) => {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const { data } = await axios.post('https://oauth2.googleapis.com/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  },

  getProfile: async (accessToken) => {
    // List Google Business Profile locations
    const { data } = await axios.get('https://mybusiness.googleapis.com/v4/accounts/me/locations', {
      params: { pageSize: 100, readMask: 'name,title,storefrontAddress,metadata' },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const locations = (data.locations || []).map(loc => ({
      id: loc.name,
      name: loc.title || loc.locationName,
      address: loc.storefrontAddress ? `${loc.storefrontAddress.addressLines?.join(', ') || ''}` : '',
    }));
    return {
      userId: 'google-business',
      name: locations[0]?.name || 'Google Business Profile',
      pages: locations,
    };
  },

  publishPost: async (accessToken, locationName, { text, mediaUrls, linkUrl }) => {
    // GMB Posts API — create a local post
    const body = {
      summary: text || '',
      languageCode: 'en',
      callToAction: linkUrl
        ? { actionType: 'LEARN_MORE', url: linkUrl }
        : undefined,
      media: mediaUrls?.length > 0
        ? mediaUrls.map(url => ({ mediaFormat: 'PHOTO', sourceUrl: url }))
        : undefined,
    };

    const { data } = await axios.post(
      `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`,
      body,
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return { id: data.name, url: `https://business.google.com/locations/${locationName}` };
  },

  getProfileUrl: (locationName) => `https://business.google.com/locations/${locationName}`,
};

// ════════════════════════════════════════════════════════════════
// TELEGRAM (Bot API)
// ════════════════════════════════════════════════════════════════

const telegram = {
  exchangeCode: async () => {
    throw buildError('telegram', 'Telegram uses bot tokens (no OAuth). Create a bot via @BotFather and enter its token.');
  },
  getProfile: async (botToken) => {
    const { data } = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
    if (!data.ok) throw buildError('telegram', 'Invalid bot token.');
    return {
      userId: String(data.result.id),
      name: data.result.first_name,
      username: data.result.username,
      avatar: null,
    };
  },
  publishPost: async (botToken, chatId, { text, mediaUrls }) => {
    if (mediaUrls && mediaUrls.length > 0) {
      const parts = [];
      for (const url of mediaUrls) {
        const isVideo = /\.(mp4|mov|avi|webm)/i.test(url);
        const payload = {
          chat_id: chatId,
          [isVideo ? 'video' : 'photo']: url,
          caption: parts.length === 0 ? (text || '') : '',
        };
        const { data } = await axios.post(
          `https://api.telegram.org/bot${botToken}/${isVideo ? 'sendVideo' : 'sendPhoto'}`,
          payload
        );
        parts.push(data.result?.message_id);
      }
      return { id: parts.join(',') };
    }
    const { data } = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: text || '',
      parse_mode: 'HTML',
    });
    return { id: String(data.result.message_id) };
  },
  getProfileUrl: (username) => `https://t.me/${username}`,
};

// ════════════════════════════════════════════════════════════════
// WHATSAPP BUSINESS (Cloud API)
// ════════════════════════════════════════════════════════════════

const whatsappBusiness = {
  exchangeCode: async () => {
    throw buildError('whatsapp-business', 'WhatsApp Business uses a permanent token from Facebook Cloud API. Configure in Settings.');
  },
  getProfile: async (token) => {
    // WABA phone numbers
    const { data } = await axios.get('https://graph.facebook.com/v18.0/me/phone_numbers', {
      params: { fields: 'id,display_phone,verified_name,quality_rating' },
      headers: { Authorization: `Bearer ${token}` },
    });
    const phones = (data.data || []).map(p => ({
      id: p.id,
      name: p.verified_name,
      phone: p.display_phone,
      qualityRating: p.quality_rating,
    }));
    return {
      userId: 'whatsapp-business',
      name: phones[0]?.name || 'WhatsApp Business',
      avatar: null,
      pages: phones,
    };
  },
  publishPost: async (token, phoneNumberId, { text, mediaUrls }) => {
    const to = phoneNumberId;
    if (mediaUrls && mediaUrls.length > 0) {
      const isVideo = /\.(mp4|mov)/i.test(mediaUrls[0]);
      const { data } = await axios.post(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: isVideo ? 'video' : 'image',
          [isVideo ? 'video' : 'image']: { link: mediaUrls[0], caption: text || '' },
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      return { id: data.messages?.[0]?.id };
    }
    const { data } = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text || '' },
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return { id: data.messages?.[0]?.id };
  },
  getProfileUrl: (phone) => `https://wa.me/${phone}`,
};

// ════════════════════════════════════════════════════════════════
// PROVIDER REGISTRY
// ════════════════════════════════════════════════════════════════

const registry = {
  facebook,
  instagram,
  twitter,
  linkedin,
  tiktok,
  youtube,
  pinterest,
  bluesky,
  threads,
  'google-business': googleBusiness,
  telegram,
  'whatsapp-business': whatsappBusiness,
};

function getProvider(platformSlug) {
  const provider = registry[platformSlug];
  if (!provider) {
    throw buildError(platformSlug, `Unknown platform: "${platformSlug}". Supported: ${Object.keys(registry).join(', ')}`);
  }
  
  // Wrap provider to intercept and mock calls when using 'mock_' prefixes for local offline testing
  return {
    ...provider,
    exchangeCode: async (code, ...args) => {
      if (code === 'mock_code' || code?.startsWith('mock_')) {
        return {
          accessToken: `mock_access_${platformSlug}_${Date.now()}`,
          refreshToken: `mock_refresh_${platformSlug}_${Date.now()}`,
          expiresIn: 3600,
          scopes: ['publish_actions', 'read_insights']
        };
      }
      return provider.exchangeCode(code, ...args);
    },
    getProfile: async (token, ...args) => {
      if (token?.startsWith('mock_')) {
        return {
          userId: `mock_user_${Date.now()}`,
          name: `Mock ${platformSlug.toUpperCase()} Profile`,
          avatar: `https://avatar.iran.liara.run/public/boy?username=${platformSlug}`,
          pages: platformSlug === 'facebook' || platformSlug === 'instagram' ? [
            { id: `mock_page_${Date.now()}`, name: `Mock ${platformSlug.toUpperCase()} Page 1`, avatar: null },
            { id: `mock_page_2_${Date.now()}`, name: `Mock ${platformSlug.toUpperCase()} Page 2`, avatar: null }
          ] : []
        };
      }
      return provider.getProfile(token, ...args);
    },
    publishPost: async (token, accountId, postData) => {
      if (token?.startsWith('mock_')) {
        console.log(`[SocialMediaProviders] Simulated publish to ${platformSlug} for account ${accountId}`);
        return {
          id: `mock_post_${Date.now()}`,
          url: `https://${platformSlug}.com/mock_post_${Date.now()}`
        };
      }
      return provider.publishPost(token, accountId, postData);
    }
  };
}

module.exports = {
  getProvider,
  registry,
  exchangeCode: async (platform, ...args) => getProvider(platform).exchangeCode(...args),
  getProfile: async (platform, ...args) => getProvider(platform).getProfile(...args),
  publishPost: async (platform, ...args) => getProvider(platform).publishPost(...args),
  refreshToken: async (platform, ...args) => getProvider(platform).refreshToken?.(...args),
  getProfileUrl: (platform, ...args) => getProvider(platform).getProfileUrl?.(...args),
};
