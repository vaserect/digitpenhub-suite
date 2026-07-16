// ============================================================
// Social Media Provider Abstraction Layer
// 
// Each platform provides: exchangeCode, getProfile, publishPost,
// refreshToken, getAnalytics. Unsupported ops throw descriptive
// errors so the controller can surface them in the UI.
// ============================================================

const axios = require('axios');

// --------------- helpers ---------------

function buildError(platform, message) {
  const err = new Error(`[${platform}] ${message}`);
  err.platform = platform;
  return err;
}

async function fbGraph(endpoint, accessToken, params = {}) {
  const { data } = await axios.get(`https://graph.facebook.com/v18.0/${endpoint}`, {
    params: { access_token: accessToken, ...params },
  });
  return data;
}

async function fbGraphPost(endpoint, accessToken, payload = {}) {
  const { data } = await axios.post(`https://graph.facebook.com/v18.0/${endpoint}`, null, {
    params: { access_token: accessToken, ...payload },
  });
  return data;
}

// --------------- Facebook ---------------

const facebook = {
  exchangeCode: async (code, redirectUri, clientId, clientSecret) => {
    const { data } = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: { client_id: clientId, redirect_uri: redirectUri, client_secret: clientSecret, code },
    });
    // Exchange short-lived token for long-lived (60 days)
    const { data: longLived } = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: { grant_type: 'fb_exchange_token', client_id: clientId, client_secret: clientSecret, fb_exchange_token: data.access_token },
    });
    return { accessToken: longLived.access_token, expiresIn: longLived.expires_in || 5184000 };
  },

  getProfile: async (accessToken) => {
    const me = await fbGraph('me', accessToken, { fields: 'id,name,picture' });
    // Get pages the user manages
    const pages = await fbGraph('me/accounts', accessToken, { fields: 'id,name,picture,access_token' });
    return {
      userId: me.id,
      name: me.name,
      avatar: me.picture?.data?.url,
      pages: (pages.data || []).map(p => ({
        id: p.id, name: p.name, avatar: p.picture?.data?.url, accessToken: p.access_token,
      })),
    };
  },

  publishPost: async (accessToken, accountId, { text, linkUrl, mediaUrls }) => {
    const params = { message: text };
    if (linkUrl) params.link = linkUrl;
    if (mediaUrls && mediaUrls.length === 1) {
      // Single image
      const photo = await fbGraphPost(`${mediaUrls[0]}/photos`, accessToken, { message: text, published: false });
      params.attached_media = JSON.stringify([{ media_fbid: photo.id }]);
    } else if (mediaUrls && mediaUrls.length > 1) {
      // Carousel
      const children = await Promise.all(
        mediaUrls.map(url => fbGraphPost(`${url}/photos`, accessToken, { published: false }))
      );
      params.attached_media = JSON.stringify(children.map(c => ({ media_fbid: c.id })));
    }
    // For pages, post to page's feed
    const result = await fbGraphPost(`${accountId}/feed`, accessToken, params);
    return { id: result.id, url: `https://facebook.com/${result.id}` };
  },

  refreshToken: async (clientId, clientSecret, token) => {
    const { data } = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: { grant_type: 'fb_exchange_token', client_id: clientId, client_secret: clientSecret, fb_exchange_token: token },
    });
    return { accessToken: data.access_token, expiresIn: data.expires_in || 5184000 };
  },

  getProfileUrl: (accountId) => `https://facebook.com/${accountId}`,
};

// --------------- Instagram ---------------

const instagram = {
  // Instagram uses Facebook's OAuth with `instagram_basic,instagram_content_publish` scopes
  exchangeCode: async (code, redirectUri, clientId, clientSecret) => {
    return facebook.exchangeCode(code, redirectUri, clientId, clientSecret);
  },

  getProfile: async (accessToken) => {
    const me = await fbGraph('me', accessToken, { fields: 'id,name' });
    // Get connected Instagram Business accounts
    const igAccounts = await fbGraph(`${me.id}/accounts`, accessToken, { fields: 'instagram_business_account{id,name,profile_picture_url,username}' });
    const accounts = [];
    for (const page of igAccounts.data || []) {
      if (page.instagram_business_account) {
        accounts.push({
          id: page.instagram_business_account.id,
          name: page.instagram_business_account.username || page.name,
          avatar: page.instagram_business_account.profile_picture_url,
          pageId: page.id,
          pageAccessToken: accessToken, // Page-scoped token needed for IG
        });
      }
    }
    return { userId: me.id, name: me.name, pages: accounts };
  },

  publishPost: async (accessToken, igUserId, { text, mediaUrls, postType }) => {
    if (postType === 'story') {
      // Stories use a different endpoint
      if (!mediaUrls || mediaUrls.length === 0) throw buildError('instagram', 'Stories require media.');
      const creation = await fbGraphPost(`${igUserId}/media`, accessToken, {
        media_type: 'STORIES',
        media_url: mediaUrls[0],
      });
      const publish = await fbGraphPost(`${igUserId}/media_publish`, accessToken, { creation_id: creation.id });
      return { id: publish.id, url: `https://instagram.com/p/${publish.id}` };
    }

    if (!text && (!mediaUrls || mediaUrls.length === 0)) {
      throw buildError('instagram', 'Post must have text or media.');
    }

    if (mediaUrls && mediaUrls.length === 1) {
      // Single image or video
      const isVideo = mediaUrls[0].match(/\.(mp4|mov|avi)/i);
      const creation = await fbGraphPost(`${igUserId}/media`, accessToken, {
        media_type: isVideo ? 'VIDEO' : 'IMAGE',
        media_url: mediaUrls[0],
        caption: text || '',
      });
      const publish = await fbGraphPost(`${igUserId}/media_publish`, accessToken, { creation_id: creation.id });
      return { id: publish.id, url: `https://instagram.com/p/${publish.id}` };
    }

    if (mediaUrls && mediaUrls.length > 1) {
      // Carousel
      const children = await Promise.all(
        mediaUrls.map(url => fbGraphPost(`${igUserId}/media`, accessToken, {
          media_type: 'IMAGE', media_url: url, is_carousel_item: true,
        }))
      );
      const creation = await fbGraphPost(`${igUserId}/media`, accessToken, {
        media_type: 'CAROUSEL',
        children: children.map(c => c.id).join(','),
        caption: text || '',
      });
      const publish = await fbGraphPost(`${igUserId}/media_publish`, accessToken, { creation_id: creation.id });
      return { id: publish.id, url: `https://instagram.com/p/${publish.id}` };
    }

    // Text-only — not supported directly; IG requires media or a link
    throw buildError('instagram', 'Instagram requires at least one image or video with the caption.');
  },

  getProfileUrl: (igUserId) => `https://instagram.com/${igUserId}`,
};

// --------------- X / Twitter ---------------
// Uses Twitter API v2 — needs OAuth 2.0 PKCE or OAuth 1.0a

const twitter = {
  exchangeCode: async () => { throw buildError('twitter', 'OAuth 2.0 PKCE flow requires auth code + code verifier + client config.'); },
  getProfile: async () => { throw buildError('twitter', 'Not implemented — needs OAuth setup.'); },
  publishPost: async (accessToken, userId, { text, mediaUrls }) => {
    // POST https://api.twitter.com/2/tweets
    const { data } = await axios.post('https://api.twitter.com/2/tweets',
      { text },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return { id: data.data.id, url: `https://twitter.com/i/web/status/${data.data.id}` };
  },
  getProfileUrl: (handle) => `https://twitter.com/${handle}`,
};

// --------------- LinkedIn ---------------

const linkedin = {
  exchangeCode: async () => { throw buildError('linkedin', 'OAuth 2.0 flow requires auth code + client config.'); },
  getProfile: async () => { throw buildError('linkedin', 'Not implemented — needs OAuth setup.'); },
  publishPost: async (accessToken, authorId, { text, linkUrl }) => {
    const body = {
      author: `urn:li:person:${authorId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: linkUrl ? 'ARTICLE' : 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };
    if (linkUrl) {
      body.specificContent['com.linkedin.ugc.ShareContent'].media = [{ status: 'READY', originalUrl: linkUrl }];
    }
    const { data } = await axios.post('https://api.linkedin.com/v2/ugcPosts', body, {
      headers: { Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0', 'Content-Type': 'application/json' },
    });
    return { id: data.id, url: `https://linkedin.com/feed/update/${data.id}` };
  },
  getProfileUrl: (vanity) => `https://linkedin.com/in/${vanity}`,
};

// --------------- TikTok ---------------

const tiktok = {
  exchangeCode: async () => { throw buildError('tiktok', 'OAuth requires video.upload scope + client config.'); },
  getProfile: async () => { throw buildError('tiktok', 'Not implemented — needs OAuth setup.'); },
  publishPost: async () => { throw buildError('tiktok', 'Video upload requires direct binary upload to TikTok servers.'); },
  getProfileUrl: (username) => `https://tiktok.com/@${username}`,
};

// --------------- YouTube ---------------

const youtube = {
  exchangeCode: async () => { throw buildError('youtube', 'OAuth requires youtube.upload scope.'); },
  getProfile: async () => { throw buildError('youtube', 'Not implemented — needs OAuth setup.'); },
  publishPost: async () => { throw buildError('youtube', 'Video upload requires direct binary upload to YouTube servers.'); },
  getProfileUrl: (channelId) => `https://youtube.com/channel/${channelId}`,
};

// --------------- Pinterest ---------------

const pinterest = {
  exchangeCode: async () => { throw buildError('pinterest', 'OAuth requires boards:read, pins:read/write scopes.'); },
  getProfile: async () => { throw buildError('pinterest', 'Not implemented — needs OAuth setup.'); },
  publishPost: async () => { throw buildError('pinterest', 'Pin creation requires image URL + board ID.'); },
  getProfileUrl: (username) => `https://pinterest.com/${username}`,
};

// --------------- Google Business Profile ---------------

const googleBusiness = {
  exchangeCode: async () => { throw buildError('google-business', 'OAuth requires business.manage scope.'); },
  getProfile: async () => { throw buildError('google-business', 'Not implemented — needs OAuth setup.'); },
  publishPost: async () => { throw buildError('google-business', 'Google My Business API now requires GMB API access.'); },
  getProfileUrl: (name) => `https://business.google.com/locations/${name}`,
};

// --------------- Telegram ---------------

const telegram = {
  exchangeCode: async () => { throw buildError('telegram', 'Telegram uses bot tokens (no OAuth). Set up via BotFather.'); },
  getProfile: async () => { throw buildError('telegram', 'Bot accounts only.'); },
  publishPost: async (botToken, chatId, { text, mediaUrls }) => {
    if (mediaUrls && mediaUrls.length > 0) {
      const { data } = await axios.post(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        chat_id: chatId, photo: mediaUrls[0], caption: text || '',
      });
      return { id: String(data.result.message_id) };
    }
    const { data } = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId, text: text || '',
    });
    return { id: String(data.result.message_id) };
  },
  getProfileUrl: (username) => `https://t.me/${username}`,
};

// --------------- WhatsApp Business ---------------

const whatsappBusiness = {
  exchangeCode: async () => { throw buildError('whatsapp-business', 'WhatsApp Business uses phone number ID + permanent token via Facebook Cloud API.'); },
  getProfile: async () => { throw buildError('whatsapp-business', 'Configure via Facebook Cloud API.'); },
  publishPost: async (phoneNumberId, token, { text, mediaUrls }) => {
    const body = { messaging_product: 'whatsapp', recipient_type: 'individual', to: phoneNumberId };
    if (mediaUrls && mediaUrls.length > 0) {
      body.type = 'image'; body.image = { link: mediaUrls[0], caption: text };
    } else {
      body.type = 'text'; body.text = { body: text };
    }
    const { data } = await axios.post(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { id: data.messages?.[0]?.id };
  },
  getProfileUrl: (phone) => `https://wa.me/${phone}`,
};

// --------------- Provider Registry ---------------

const registry = {
  facebook,
  instagram,
  twitter,
  linkedin,
  tiktok,
  youtube,
  pinterest,
  'google-business': googleBusiness,
  telegram,
  'whatsapp-business': whatsappBusiness,
};

function getProvider(platformSlug) {
  const provider = registry[platformSlug];
  if (!provider) throw buildError(platformSlug, `Unknown platform: "${platformSlug}". Supported: ${Object.keys(registry).join(', ')}`);
  return provider;
}

module.exports = {
  getProvider,
  registry,
  // Convenience wrappers
  exchangeCode: async (platform, ...args) => getProvider(platform).exchangeCode(...args),
  getProfile: async (platform, ...args) => getProvider(platform).getProfile(...args),
  publishPost: async (platform, ...args) => getProvider(platform).publishPost(...args),
  refreshToken: async (platform, ...args) => getProvider(platform).refreshToken?.(...args),
  getProfileUrl: (platform, ...args) => getProvider(platform).getProfileUrl?.(...args),
};
