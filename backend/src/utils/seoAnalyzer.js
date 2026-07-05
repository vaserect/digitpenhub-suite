const { fetchWithTimeout } = require('./aiReliability');

// A real, lightweight on-page SEO audit — fetches the target URL and inspects
// the actual HTML for the signals we can check without a headless browser
// (no Lighthouse/Puppeteer in this deployment, so no synthetic Core Web
// Vitals are reported — that would just be more fabricated data).
function extract(html, regex) {
  const m = html.match(regex);
  return m && m[1] !== undefined ? m[1].trim() : null;
}

function countMatches(html, regex) {
  return (html.match(regex) || []).length;
}

const BLOCKED_HOSTNAME_RE = /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|::1$)|^172\.(1[6-9]|2\d|3[01])\./i;

async function runAudit(rawUrl) {
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  let hostname;
  try { hostname = new URL(url).hostname; } catch {
    return { fetchError: 'Invalid URL.', score: 0, meta: {}, headings: {}, images: {}, links: {}, technical: {}, issues: [{ severity: 'critical', title: 'Invalid URL', detail: 'Enter a valid http(s) URL.' }] };
  }
  // The audit target is user-supplied and fetched server-side — block
  // loopback/private/link-local addresses so this can't be used to probe the
  // app's own internal network (SSRF).
  if (BLOCKED_HOSTNAME_RE.test(hostname)) {
    return { fetchError: 'That host is not allowed to be audited.', score: 0, meta: {}, headings: {}, images: {}, links: {}, technical: {}, issues: [{ severity: 'critical', title: 'Blocked host', detail: 'Internal/private network addresses cannot be audited.' }] };
  }
  let html, finalUrl, fetchError;
  try {
    const resp = await fetchWithTimeout(url, { headers: { 'User-Agent': 'DigiOpenHubSEOAudit/1.0' } }, 15000);
    finalUrl = resp.url || url;
    if (!resp.ok) fetchError = `Site responded with HTTP ${resp.status}.`;
    else html = await resp.text();
  } catch (err) {
    fetchError = `Could not reach ${url}: ${err.message}`;
  }

  if (fetchError) {
    return {
      fetchError,
      score: 0,
      meta: {}, headings: {}, images: {}, links: {}, technical: {},
      issues: [{ severity: 'critical', title: 'Could not fetch page', detail: fetchError }],
    };
  }

  const isHttps = finalUrl.startsWith('https://');
  const title = extract(html, /<title[^>]*>([^<]*)<\/title>/i);
  const description = extract(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const canonical = extract(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
  const viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const robotsMeta = extract(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i);
  const structuredData = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);

  const h1Count = countMatches(html, /<h1[\s>]/gi);
  const h2Count = countMatches(html, /<h2[\s>]/gi);
  const h3Count = countMatches(html, /<h3[\s>]/gi);

  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const imagesTotal = imgTags.length;
  const imagesMissingAlt = imgTags.filter((tag) => !/alt=["'][^"']+["']/i.test(tag)).length;

  const anchorTags = html.match(/<a\s[^>]*href=["']([^"']*)["'][^>]*>/gi) || [];
  let internalLinks = 0, externalLinks = 0;
  let finalHostname = '';
  try { finalHostname = new URL(finalUrl).hostname; } catch {}
  for (const tag of anchorTags) {
    const href = extract(tag, /href=["']([^"']*)["']/i);
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    if (/^https?:\/\//i.test(href)) {
      try { const h = new URL(href).hostname; if (h === finalHostname) internalLinks++; else externalLinks++; } catch { externalLinks++; }
    } else {
      internalLinks++;
    }
  }

  const issues = [];
  if (!title) issues.push({ severity: 'critical', title: 'Missing <title> tag', detail: 'Every page needs a unique, descriptive title tag.' });
  else if (title.length < 10 || title.length > 65) issues.push({ severity: 'warning', title: 'Title length is not ideal', detail: `Title is ${title.length} characters; aim for 10–65.` });
  if (!description) issues.push({ severity: 'critical', title: 'Missing meta description', detail: 'Add a compelling meta description (120–160 chars) to improve click-through rate.' });
  else if (description.length < 50 || description.length > 160) issues.push({ severity: 'warning', title: 'Meta description length is not ideal', detail: `Description is ${description.length} characters; aim for 50–160.` });
  if (!canonical) issues.push({ severity: 'warning', title: 'Missing canonical tag', detail: 'Add a <link rel="canonical"> to prevent duplicate-content issues.' });
  if (!viewport) issues.push({ severity: 'critical', title: 'Missing responsive viewport meta tag', detail: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile usability.' });
  if (h1Count === 0) issues.push({ severity: 'critical', title: 'Missing H1 heading', detail: 'Every page should have exactly one H1.' });
  else if (h1Count > 1) issues.push({ severity: 'warning', title: 'Multiple H1 headings found', detail: `Found ${h1Count} H1 tags; use exactly one per page.` });
  if (imagesTotal > 0 && imagesMissingAlt > 0) issues.push({ severity: 'warning', title: 'Images missing alt text', detail: `${imagesMissingAlt} of ${imagesTotal} images have no alt attribute.` });
  if (!isHttps) issues.push({ severity: 'critical', title: 'Not served over HTTPS', detail: 'Serve the site over HTTPS for security and SEO ranking factors.' });
  if (!structuredData) issues.push({ severity: 'info', title: 'No structured data found', detail: 'Add JSON-LD schema markup to improve rich snippet eligibility.' });
  if (h2Count === 0 && h3Count === 0) issues.push({ severity: 'info', title: 'No H2/H3 subheadings', detail: 'Content lacks secondary headings for scannability.' });

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const score = Math.max(0, Math.min(100, 100 - criticalCount * 15 - warningCount * 7));

  return {
    score,
    meta: {
      titlePresent: !!title, title, titleLength: title?.length || 0,
      descriptionPresent: !!description, description, descriptionLength: description?.length || 0,
      canonicalPresent: !!canonical, canonical, robotsMeta: robotsMeta || 'not set', viewportPresent: viewport,
    },
    headings: { h1Count, h2Count, h3Count },
    images: { total: imagesTotal, missingAlt: imagesMissingAlt },
    links: { internal: internalLinks, external: externalLinks },
    technical: { ssl: isHttps, structuredData },
    issues,
  };
}

module.exports = { runAudit };
