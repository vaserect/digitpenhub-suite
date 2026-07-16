const https = require('https');

// ── Configuration checks ─────────────────────────────────────────────────────

function smsProviderConfigured() {
  return Boolean(
    process.env.TERMII_API_KEY ||
    (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) ||
    (process.env.AFRICAS_TALKING_USERNAME && process.env.AFRICAS_TALKING_API_KEY)
  );
}

function whatsappProviderConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

// ── Termii SMS ────────────────────────────────────────────────────────────────

const TERMII_BASE = 'https://api.termii.com';

function termiiRequest(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(path, TERMII_BASE);
    const req = https.request(
      { hostname: url.hostname, path: url.pathname, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => {
        let resp = '';
        res.on('data', (c) => (resp += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(resp) }); }
          catch { resolve({ status: res.statusCode, body: resp }); }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendTermiiSms({ to, message, senderId }) {
  try {
    const result = await termiiRequest('/api/sms/send', {
      api_key: process.env.TERMII_API_KEY,
      to,
      from: senderId || process.env.TERMII_SENDER_ID || 'DigitpenHub',
      sms: message,
      type: 'plain',
      channel: 'generic',
    });

    if (result.status === 200 && result.body?.message_id) {
      return { ok: true, messageId: result.body.message_id };
    }
    return { ok: false, error: result.body?.message || `Termii error (${result.status})` };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function sendTwilioSms({ to, message }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNum = process.env.TWILIO_FROM_NUMBER || 'DigitpenHub';

  try {
    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', fromNum);
    params.append('Body', message);

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await res.json();
    if (res.status === 201 || res.status === 200) {
      return { ok: true, messageId: data.sid };
    }
    return { ok: false, error: data.message || `Twilio error status ${res.status}` };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function sendAfricasTalkingSms({ to, message }) {
  const username = process.env.AFRICAS_TALKING_USERNAME;
  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const from = process.env.AFRICAS_TALKING_FROM;

  try {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('to', to);
    params.append('message', message);
    if (from) {
      params.append('from', from);
    }

    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'apiKey': apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await res.json();
    const recipient = data?.SMSMessageData?.Recipients?.[0];
    if (recipient && (recipient.status === 'Success' || recipient.status === 'Sent')) {
      return { ok: true, messageId: recipient.messageId };
    }
    return { ok: false, error: recipient?.status || data?.SMSMessageData?.Message || `Africa's Talking error status ${res.status}` };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function sendSms({ to, message, senderId }) {
  if (process.env.TERMII_API_KEY) {
    return sendTermiiSms({ to, message, senderId });
  }
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return sendTwilioSms({ to, message });
  }
  if (process.env.AFRICAS_TALKING_USERNAME && process.env.AFRICAS_TALKING_API_KEY) {
    return sendAfricasTalkingSms({ to, message });
  }
  return { ok: false, error: 'No SMS provider configured. TERMII_API_KEY is not set.' };
}

async function sendBulkSms({ recipients, message, senderId }) {
  const configured = smsProviderConfigured();
  if (!configured) {
    return {
      ok: false,
      error: 'No SMS provider configured. TERMII_API_KEY is not set.',
      results: recipients.map((to) => ({ to, ok: false, error: 'TERMII_API_KEY is not set.' }))
    };
  }

  const results = [];
  for (const to of recipients) {
    const result = await sendSms({ to, message, senderId });
    results.push({ to, ok: result.ok, messageId: result.messageId || null, error: result.error || null });
  }
  return { ok: results.some((r) => r.ok), results };
}

// ── WhatsApp Business Cloud API ──────────────────────────────────────────────
// Uses Meta's official WhatsApp Cloud API (v22.0).
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
// Prerequisites:
//   - WHATSAPP_ACCESS_TOKEN: A long-lived System User access token from
//     developers.facebook.com → App → WhatsApp → API Setup
//   - WHATSAPP_PHONE_NUMBER_ID: The phone number ID from the same page
//   - WHATSAPP_FROM: The display phone number (optional, defaults to the
//     number associated with the phone_number_id)

// ── WhatsApp Business Cloud API ──────────────────────────────────────────────
// Uses Meta's official WhatsApp Cloud API (v22.0).
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

function graphRequest(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      { hostname: 'graph.facebook.com', path, method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Length': Buffer.byteLength(data),
        } },
      (res) => {
        let resp = '';
        res.on('data', (c) => (resp += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(resp) }); }
          catch { resolve({ status: res.statusCode, body: resp }); }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendWhatsAppText({ to, message }) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneNumberId || !process.env.WHATSAPP_ACCESS_TOKEN) {
    return { ok: false, error: 'WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured.' };
  }

  try {
    const result = await graphRequest(`/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: message },
    });

    if (result.status === 200 || result.status === 201) {
      return { ok: true, messageId: result.body?.messages?.[0]?.id || null };
    }
    return { ok: false, error: result.body?.error?.message || `WhatsApp error (${result.status})` };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function sendWhatsAppTemplate({ to, templateName, language = 'en', components }) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneNumberId || !process.env.WHATSAPP_ACCESS_TOKEN) {
    return { ok: false, error: 'WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured.' };
  }

  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
    },
  };
  if (components) body.template.components = components;

  try {
    const result = await graphRequest(`/${phoneNumberId}/messages`, body);
    if (result.status === 200 || result.status === 201) {
      return { ok: true, messageId: result.body?.messages?.[0]?.id || null };
    }
    return { ok: false, error: result.body?.error?.message || `WhatsApp error (${result.status})` };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function sendWhatsAppBroadcast({ recipients, message }) {
  const results = [];
  for (const to of recipients) {
    const result = await sendWhatsAppText({ to, message });
    results.push({ to, ok: result.ok, messageId: result.messageId || null, error: result.error || null });
  }
  return { ok: results.some((r) => r.ok), results };
}

module.exports = {
  smsProviderConfigured,
  whatsappProviderConfigured,
  sendSms,
  sendBulkSms,
  sendWhatsAppText,
  sendWhatsAppTemplate,
  sendWhatsAppBroadcast,
};
