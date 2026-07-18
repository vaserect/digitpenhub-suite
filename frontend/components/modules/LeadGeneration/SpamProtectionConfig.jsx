'use client';
import { useState } from 'react';

export default function SpamProtectionConfig({ draft, setDraft }) {
  const spamConfig = draft.spamProtection || { honeypot: true, captcha: false, captchaType: 'recaptcha', captchaSiteKey: '', rateLimit: true, rateLimitMax: 5 };

  function updateSpamConfig(key, value) {
    setDraft(prev => ({
      ...prev,
      spamProtection: { ...spamConfig, [key]: value }
    }));
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>Spam Protection</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        Protect your forms from bots and spam submissions
      </p>

      <div style={{ display: 'grid', gap: 14 }}>
        {/* Honeypot */}
        <div className="card" style={{ background: 'var(--surface-muted)', padding: 14 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={spamConfig.honeypot}
              onChange={e => updateSpamConfig('honeypot', e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                🍯 Honeypot Field (Recommended)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Adds an invisible field that only bots will fill out. Simple and effective with no user friction.
              </div>
            </div>
          </label>
        </div>

        {/* CAPTCHA */}
        <div className="card" style={{ background: 'var(--surface-muted)', padding: 14 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={spamConfig.captcha}
              onChange={e => updateSpamConfig('captcha', e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                🤖 CAPTCHA Verification
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Require users to complete a challenge to prove they're human. More secure but adds friction.
              </div>
            </div>
          </label>

          {spamConfig.captcha && (
            <div style={{ marginLeft: 32, display: 'grid', gap: 10 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12 }}>CAPTCHA Type</label>
                <select
                  value={spamConfig.captchaType}
                  onChange={e => updateSpamConfig('captchaType', e.target.value)}
                  style={{ fontSize: 13, padding: '6px 8px' }}
                >
                  <option value="recaptcha">Google reCAPTCHA v2</option>
                  <option value="recaptcha-v3">Google reCAPTCHA v3 (Invisible)</option>
                  <option value="hcaptcha">hCaptcha</option>
                  <option value="turnstile">Cloudflare Turnstile</option>
                </select>
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12 }}>Site Key</label>
                <input
                  value={spamConfig.captchaSiteKey}
                  onChange={e => updateSpamConfig('captchaSiteKey', e.target.value)}
                  placeholder="Your CAPTCHA site key"
                  style={{ fontSize: 13, padding: '6px 8px' }}
                />
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                  Get your site key from{' '}
                  {spamConfig.captchaType === 'recaptcha' || spamConfig.captchaType === 'recaptcha-v3' ? (
                    <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                      Google reCAPTCHA
                    </a>
                  ) : spamConfig.captchaType === 'hcaptcha' ? (
                    <a href="https://www.hcaptcha.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                      hCaptcha
                    </a>
                  ) : (
                    <a href="https://dash.cloudflare.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                      Cloudflare Turnstile
                    </a>
                  )}
                </small>
              </div>
            </div>
          )}
        </div>

        {/* Rate Limiting */}
        <div className="card" style={{ background: 'var(--surface-muted)', padding: 14 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={spamConfig.rateLimit}
              onChange={e => updateSpamConfig('rateLimit', e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                ⏱️ Rate Limiting
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Limit the number of submissions from the same IP address within a time window.
              </div>
            </div>
          </label>

          {spamConfig.rateLimit && (
            <div style={{ marginLeft: 32 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12 }}>Max Submissions per 15 Minutes</label>
                <input
                  type="number"
                  value={spamConfig.rateLimitMax}
                  onChange={e => updateSpamConfig('rateLimitMax', parseInt(e.target.value))}
                  min="1"
                  max="100"
                  style={{ fontSize: 13, padding: '6px 8px' }}
                />
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                  Recommended: 3-5 for contact forms, 10-20 for surveys
                </small>
              </div>
            </div>
          )}
        </div>

        {/* Email Verification */}
        <div className="card" style={{ background: 'var(--surface-muted)', padding: 14 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={spamConfig.emailVerification}
              onChange={e => updateSpamConfig('emailVerification', e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                ✉️ Email Verification
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Require users to verify their email address before the submission is accepted. Prevents fake emails.
              </div>
            </div>
          </label>
        </div>

        {/* Disposable Email Blocking */}
        <div className="card" style={{ background: 'var(--surface-muted)', padding: 14 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={spamConfig.blockDisposableEmails}
              onChange={e => updateSpamConfig('blockDisposableEmails', e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                🚫 Block Disposable Emails
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Reject submissions from temporary/disposable email services (e.g., 10minutemail, guerrillamail).
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14, background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)', padding: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text)' }}>💡 Best Practices:</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
            <li>Start with Honeypot + Rate Limiting for minimal friction</li>
            <li>Add CAPTCHA only if you're experiencing significant spam</li>
            <li>Use reCAPTCHA v3 (invisible) for the best user experience</li>
            <li>Monitor your spam rate and adjust protection levels accordingly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
