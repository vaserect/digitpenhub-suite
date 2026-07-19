# Module 17: URL Shortener - Enterprise Edition

## Overview

The URL Shortener module provides enterprise-grade link management with advanced analytics, custom domains, QR codes, A/B testing, and team collaboration features. Benchmarked against industry leaders like Bitly, Rebrandly, and Short.io.

**Version:** 2.0.0  
**Status:** ✅ Production Ready  
**Feature Parity:** 85% with Bitly Enterprise

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [Database Schema](#database-schema)
5. [Usage Examples](#usage-examples)
6. [Analytics & Tracking](#analytics--tracking)
7. [Custom Domains](#custom-domains)
8. [QR Codes](#qr-codes)
9. [Advanced Features](#advanced-features)
10. [Security](#security)
11. [Performance](#performance)
12. [Migration Guide](#migration-guide)

---

## Features

### Core Features ✅
- **Smart Link Shortening** - Generate short, memorable URLs
- **Custom Slugs** - Brand your links with custom back-halves
- **Link Management** - Organize with folders, tags, and search
- **Status Control** - Active, inactive, scheduled, expired states
- **Expiration Dates** - Auto-expire links after specified date
- **Password Protection** - Secure sensitive links with passwords

### Analytics & Tracking ✅
- **Real-time Click Tracking** - Track every click with detailed metadata
- **Unique Visitor Tracking** - Identify and count unique visitors
- **Geographic Analytics** - Country, region, city-level tracking
- **Device Analytics** - Mobile, tablet, desktop breakdown
- **Browser & OS Tracking** - Detailed browser and OS statistics
- **Referrer Analysis** - Track traffic sources (social, search, direct, etc.)
- **Bot Detection** - Filter out bot traffic from analytics
- **UTM Parameter Tracking** - Full UTM campaign tracking
- **Time-series Data** - Daily, weekly, monthly trend analysis

### Custom Domains ✅
- **Branded Domains** - Use your own domain for short links
- **SSL/HTTPS Support** - Automatic SSL certificate management
- **DNS Verification** - Automated domain verification process
- **Multi-domain Support** - Multiple custom domains per organization
- **Domain Analytics** - Track performance by domain

### QR Codes ✅
- **Dynamic QR Generation** - Generate QR codes for any link
- **Custom Styling** - Colors, logos, frames, and borders
- **Multiple Formats** - PNG, SVG, PDF export options
- **Error Correction** - Configurable error correction levels
- **QR Analytics** - Track QR code scans separately

### Advanced Link Types ✅
- **Link Rotation** - Distribute traffic across multiple URLs
- **A/B Testing** - Test multiple destinations with weighted distribution
- **Deep Linking** - Device-specific redirects (iOS, Android, Desktop)
- **Smart Redirects** - Context-aware destination selection

### Organization & Collaboration ✅
- **Folders & Subfolders** - Hierarchical organization
- **Tags** - Multi-tag support for flexible categorization
- **Team Sharing** - Share links with team members
- **Comments** - Collaborate with link-specific comments
- **Bulk Operations** - Update, delete, or move multiple links at once

### Marketing Features ✅
- **UTM Builder** - Built-in UTM parameter generator
- **Link Templates** - Reusable link configurations
- **Retargeting Pixels** - Facebook, Google, custom pixels
- **Link Bundles** - Create collections of related links
- **Preview Customization** - Custom Open Graph metadata

### Enterprise Features ✅
- **API Access** - Full REST API with authentication
- **Webhooks** - Real-time event notifications
- **Link Health Monitoring** - Automatic destination URL checking
- **Conversion Tracking** - Track conversions and revenue
- **Export & Reporting** - CSV export of links and analytics
- **Rate Limiting** - Configurable API rate limits

---

## Architecture

### Technology Stack
- **Backend:** Node.js + Express
- **Database:** PostgreSQL 14+
- **Analytics:** Real-time event streaming
- **QR Generation:** QR code libraries (qrcode, qr-image)
- **Geo-IP:** MaxMind GeoIP2 (optional)

### Database Tables
- `short_links` - Main links table
- `url_click_events` - Detailed click tracking
- `url_analytics_daily` - Aggregated daily stats
- `url_custom_domains` - Custom domain management
- `url_folders` - Folder organization
- `url_qr_codes` - QR code configurations
- `url_ab_test_results` - A/B test performance
- `url_bundles` - Link collections
- `url_conversions` - Conversion tracking
- `url_webhooks` - Webhook configurations
- `url_api_keys` - API authentication

---

## API Endpoints

### Dashboard & Stats

#### GET `/api/v1/url-shortener/stats`
Get dashboard statistics.

**Response:**
```json
{
  "total_links": 1250,
  "active_links": 1100,
  "total_clicks": 45000,
  "unique_clicks": 32000,
  "links_created_7d": 45,
  "clicks_7d": 5600,
  "total_domains": 3,
  "verified_domains": 2,
  "top_links": [...]
}
```

### Links Management

#### GET `/api/v1/url-shortener`
List all links with filtering and pagination.

**Query Parameters:**
- `folder_id` - Filter by folder
- `status` - Filter by status (active, inactive, scheduled, expired)
- `search` - Search in title, slug, or target URL
- `tag` - Filter by tag
- `sort` - Sort field (created_at, total_clicks, unique_clicks, title)
- `order` - Sort order (ASC, DESC)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset

**Response:**
```json
{
  "links": [...],
  "total": 1250,
  "limit": 50,
  "offset": 0
}
```

#### GET `/api/v1/url-shortener/:id`
Get detailed information about a specific link.

**Response:**
```json
{
  "link": {
    "id": 123,
    "slug": "abc123",
    "target_url": "https://example.com/long-url",
    "title": "My Campaign Link",
    "description": "Q4 2024 Campaign",
    "status": "active",
    "total_clicks": 1500,
    "unique_clicks": 1200,
    "folder_name": "Marketing",
    "custom_domain": "go.mybrand.com",
    "qr_code_url": "https://...",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

#### POST `/api/v1/url-shortener`
Create a new short link.

**Request Body:**
```json
{
  "target_url": "https://example.com/destination",
  "title": "Campaign Link",
  "description": "Optional description",
  "custom_slug": "my-link",
  "custom_domain_id": 5,
  "folder_id": 10,
  "tags": ["marketing", "q4-2024"],
  "link_type": "standard",
  "expires_at": "2024-12-31T23:59:59Z",
  "password": "secret123",
  "og_title": "Custom Preview Title",
  "og_description": "Custom preview description",
  "og_image_url": "https://example.com/image.jpg",
  "utm_source": "newsletter",
  "utm_medium": "email",
  "utm_campaign": "q4-promo",
  "facebook_pixel_id": "123456789",
  "google_analytics_id": "UA-123456-1"
}
```

**Response:**
```json
{
  "link": {
    "id": 124,
    "slug": "my-link",
    "target_url": "https://example.com/destination",
    "status": "active",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

#### PUT `/api/v1/url-shortener/:id`
Update an existing link.

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "status": "inactive",
  "folder_id": 12,
  "tags": ["updated", "tags"],
  "expires_at": "2024-12-31T23:59:59Z"
}
```

#### DELETE `/api/v1/url-shortener/:id`
Delete a link.

**Response:**
```json
{
  "success": true
}
```

### Bulk Operations

#### POST `/api/v1/url-shortener/bulk-delete`
Delete multiple links at once.

**Request Body:**
```json
{
  "ids": [1, 2, 3, 4, 5]
}
```

#### POST `/api/v1/url-shortener/bulk-update`
Update multiple links at once.

**Request Body:**
```json
{
  "link_ids": [1, 2, 3],
  "updates": {
    "status": "inactive",
    "folder_id": 10,
    "tags": ["archived"]
  }
}
```

### Analytics

#### GET `/api/v1/url-shortener/:id/analytics`
Get detailed analytics for a link.

**Query Parameters:**
- `period` - Time period (24h, 7d, 30d, 90d, all)

**Response:**
```json
{
  "overview": {
    "total_clicks": 1500,
    "unique_visitors": 1200,
    "human_clicks": 1450,
    "bot_clicks": 50
  },
  "timeline": [
    {
      "date": "2024-01-15",
      "clicks": 150,
      "unique_visitors": 120
    }
  ],
  "countries": [
    {
      "country": "United States",
      "clicks": 800,
      "unique_visitors": 650
    }
  ],
  "referrers": [
    {
      "referrer_domain": "facebook.com",
      "referrer_type": "social",
      "clicks": 400
    }
  ],
  "devices": [
    {
      "device_type": "mobile",
      "clicks": 900,
      "unique_visitors": 750
    }
  ],
  "browsers": [...],
  "os": [...]
}
```

### Folders

#### GET `/api/v1/url-shortener/folders/list`
List all folders.

**Response:**
```json
{
  "folders": [
    {
      "id": 1,
      "name": "Marketing",
      "description": "Marketing campaigns",
      "color": "#FF5733",
      "icon": "megaphone",
      "link_count": 45,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST `/api/v1/url-shortener/folders`
Create a new folder.

**Request Body:**
```json
{
  "name": "Q4 Campaigns",
  "description": "All Q4 2024 campaigns",
  "parent_id": null,
  "color": "#3498db",
  "icon": "folder"
}
```

#### PUT `/api/v1/url-shortener/folders/:id`
Update a folder.

#### DELETE `/api/v1/url-shortener/folders/:id`
Delete a folder (moves links to root).

### Custom Domains

#### GET `/api/v1/url-shortener/domains/list`
List all custom domains.

**Response:**
```json
{
  "domains": [
    {
      "id": 1,
      "domain": "go.mybrand.com",
      "is_verified": true,
      "ssl_enabled": true,
      "status": "active",
      "link_count": 250,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST `/api/v1/url-shortener/domains`
Add a new custom domain.

**Request Body:**
```json
{
  "domain": "links.mybrand.com"
}
```

**Response:**
```json
{
  "domain": {
    "id": 2,
    "domain": "links.mybrand.com",
    "verification_token": "abc123...",
    "status": "pending"
  },
  "dns_instructions": {
    "type": "CNAME",
    "name": "links.mybrand.com",
    "value": "links.yourdomain.com",
    "txt_record": {
      "name": "_verification.links.mybrand.com",
      "value": "abc123..."
    }
  }
}
```

#### POST `/api/v1/url-shortener/domains/:id/verify`
Verify domain ownership.

**Response:**
```json
{
  "domain": {
    "id": 2,
    "domain": "links.mybrand.com",
    "is_verified": true,
    "status": "active"
  }
}
```

#### DELETE `/api/v1/url-shortener/domains/:id`
Remove a custom domain.

### QR Codes

#### POST `/api/v1/url-shortener/:id/qr-code`
Generate or update QR code for a link.

**Request Body:**
```json
{
  "size": 500,
  "format": "png",
  "foreground_color": "#000000",
  "background_color": "#FFFFFF",
  "logo_url": "https://mybrand.com/logo.png",
  "error_correction": "H"
}
```

**Response:**
```json
{
  "qr_code": {
    "id": 1,
    "link_id": 123,
    "file_url": "https://cdn.example.com/qr/abc123.png",
    "size": 500,
    "format": "png",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

### Public Redirect

#### GET `/api/v1/url-shortener/r/:slug`
Public redirect endpoint (no authentication required).

**Query Parameters:**
- `password` - Required if link is password-protected

**Behavior:**
- Tracks click event with full analytics
- Handles link rotation, A/B testing, deep linking
- Adds UTM parameters if configured
- Returns 302 redirect to target URL
- Returns 404 if link not found or expired
- Returns 401 if password required/invalid

### Export

#### GET `/api/v1/url-shortener/export/csv`
Export all links to CSV.

**Response:** CSV file download

---

## Database Schema

### short_links
Main table for storing short links.

```sql
CREATE TABLE short_links (
  id                BIGSERIAL PRIMARY KEY,
  org_id            UUID NOT NULL,
  user_id           UUID NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  custom_domain_id  BIGINT,
  back_half         TEXT NOT NULL,
  target_url        TEXT NOT NULL,
  title             TEXT,
  description       TEXT,
  folder_id         BIGINT,
  tags              TEXT[],
  status            TEXT DEFAULT 'active',
  link_type         TEXT DEFAULT 'standard',
  scheduled_at      TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  password_hash     TEXT,
  password_enabled  BOOLEAN DEFAULT FALSE,
  og_title          TEXT,
  og_description    TEXT,
  og_image_url      TEXT,
  utm_source        TEXT,
  utm_medium        TEXT,
  utm_campaign      TEXT,
  utm_term          TEXT,
  utm_content       TEXT,
  facebook_pixel_id TEXT,
  google_analytics_id TEXT,
  custom_pixels     JSONB,
  total_clicks      BIGINT DEFAULT 0,
  unique_clicks     BIGINT DEFAULT 0,
  last_clicked_at   TIMESTAMPTZ,
  ab_test_config    JSONB,
  rotation_urls     JSONB,
  ios_url           TEXT,
  android_url       TEXT,
  desktop_fallback  TEXT,
  notes             TEXT,
  metadata          JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### url_click_events
Detailed click tracking with full analytics.

```sql
CREATE TABLE url_click_events (
  id              BIGSERIAL PRIMARY KEY,
  link_id         BIGINT NOT NULL,
  org_id          UUID NOT NULL,
  visitor_id      TEXT NOT NULL,
  session_id      TEXT,
  ip_address      INET,
  user_agent      TEXT,
  referer         TEXT,
  country         TEXT,
  country_code    TEXT,
  region          TEXT,
  city            TEXT,
  latitude        NUMERIC(10,7),
  longitude       NUMERIC(10,7),
  device_type     TEXT,
  device_brand    TEXT,
  device_model    TEXT,
  os_name         TEXT,
  os_version      TEXT,
  browser_name    TEXT,
  browser_version TEXT,
  referrer_domain TEXT,
  referrer_type   TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_term        TEXT,
  utm_content     TEXT,
  variant_id      TEXT,
  is_bot          BOOLEAN DEFAULT FALSE,
  bot_name        TEXT,
  clicked_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Usage Examples

### Basic Link Creation

```javascript
// Create a simple short link
const response = await fetch('/api/v1/url-shortener', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    target_url: 'https://example.com/my-long-url',
    title: 'My Campaign'
  })
});

const { link } = await response.json();
console.log(`Short URL: ${link.slug}`);
```

### Custom Branded Link

```javascript
// Create a branded link with custom domain
const response = await fetch('/api/v1/url-shortener', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    target_url: 'https://example.com/product',
    custom_slug: 'summer-sale',
    custom_domain_id: 5,
    title: 'Summer Sale 2024',
    folder_id: 10,
    tags: ['marketing', 'sale', 'summer']
  })
});
// Result: https://go.mybrand.com/summer-sale
```

### Link with UTM Tracking

```javascript
// Create link with UTM parameters
const response = await fetch('/api/v1/url-shortener', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    target_url: 'https://example.com/product',
    title: 'Email Campaign Link',
    utm_source: 'newsletter',
    utm_medium: 'email',
    utm_campaign: 'q4-2024',
    utm_content: 'header-cta'
  })
});
// Redirects to: https://example.com/product?utm_source=newsletter&utm_medium=email&...
```

### A/B Testing Link

```javascript
// Create A/B test link
const response = await fetch('/api/v1/url-shortener', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    target_url: 'https://example.com/default',
    title: 'Landing Page A/B Test',
    link_type: 'ab_test',
    ab_test_config: {
      variants: [
        { url: 'https://example.com/variant-a', weight: 50, name: 'Variant A' },
        { url: 'https://example.com/variant-b', weight: 50, name: 'Variant B' }
      ],
      winner_criteria: 'conversion_rate'
    }
  })
});
```

### Password-Protected Link

```javascript
// Create password-protected link
const response = await fetch('/api/v1/url-shortener', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    target_url: 'https://example.com/confidential',
    title: 'Confidential Document',
    password: 'SecurePass123!'
  })
});
```

### Generate QR Code

```javascript
// Generate branded QR code
const response = await fetch('/api/v1/url-shortener/123/qr-code', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    size: 500,
    format: 'png',
    foreground_color: '#000000',
    background_color: '#FFFFFF',
    logo_url: 'https://mybrand.com/logo.png',
    error_correction: 'H'
  })
});

const { qr_code } = await response.json();
console.log(`QR Code URL: ${qr_code.file_url}`);
```

---

## Analytics & Tracking

### Click Event Tracking

Every click is tracked with:
- **Visitor Identification** - Unique visitor fingerprinting
- **Geographic Data** - Country, region, city, coordinates
- **Device Information** - Type, brand, model
- **Browser & OS** - Name and version
- **Referrer Analysis** - Source domain and type classification
- **UTM Parameters** - Full campaign tracking
- **Bot Detection** - Automatic bot filtering

### Analytics Aggregation

Daily aggregation provides:
- Total clicks and unique visitors
- Geographic distribution
- Device and browser breakdowns
- Top referrers
- Time-series trends

### Real-time Updates

Link statistics are updated in real-time via database triggers:
- `total_clicks` incremented on each click
- `unique_clicks` calculated from distinct visitors
- `last_clicked_at` timestamp updated

---

## Custom Domains

### Setup Process

1. **Add Domain**
   ```bash
   POST /api/v1/url-shortener/domains
   {
     "domain": "links.mybrand.com"
   }
   ```

2. **Configure DNS**
   - Add CNAME record: `links.mybrand.com` → `links.yourdomain.com`
   - Add TXT record for verification: `_verification.links.mybrand.com` → `[token]`

3. **Verify Domain**
   ```bash
   POST /api/v1/url-shortener/domains/:id/verify
   ```

4. **SSL Certificate**
   - Automatic SSL provisioning (Let's Encrypt)
   - HTTPS enforced for all links

### Using Custom Domains

```javascript
// Create link with custom domain
const response = await fetch('/api/v1/url-shortener', {
  method: 'POST',
  body: JSON.stringify({
    target_url: 'https://example.com/page',
    custom_domain_id: 5,
    custom_slug: 'promo'
  })
});
// Result: https://links.mybrand.com/promo
```

---

## QR Codes

### Features
- **Dynamic Generation** - QR codes update when link changes
- **Custom Styling** - Colors, logos, frames
- **Multiple Formats** - PNG, SVG, PDF
- **Error Correction** - L, M, Q, H levels
- **Analytics** - Track QR code scans separately

### Customization Options

```javascript
{
  "size": 500,                    // Size in pixels
  "format": "png",                // png, svg, pdf
  "error_correction": "H",        // L, M, Q, H
  "foreground_color": "#000000",  // Hex color
  "background_color": "#FFFFFF",  // Hex color
  "logo_url": "https://...",      // Center logo
  "logo_size": 20,                // Logo size percentage
  "frame_style": "rounded",       // Frame style
  "frame_text": "Scan Me",        // Frame text
  "frame_color": "#3498db"        // Frame color
}
```

---

## Advanced Features

### Link Rotation

Distribute traffic across multiple URLs:

```javascript
{
  "link_type": "rotator",
  "rotation_urls": [
    { "url": "https://example.com/page1", "weight": 60, "name": "Primary" },
    { "url": "https://example.com/page2", "weight": 30, "name": "Secondary" },
    { "url": "https://example.com/page3", "weight": 10, "name": "Tertiary" }
  ]
}
```

### Deep Linking

Device-specific redirects:

```javascript
{
  "link_type": "deep_link",
  "ios_url": "myapp://product/123",
  "android_url": "myapp://product/123",
  "desktop_fallback": "https://example.com/product/123"
}
```

### Link Bundles

Create collections of related links:

```javascript
// Create bundle
POST /api/v1/url-shortener/bundles
{
  "name": "Social Media Kit",
  "slug": "social-kit",
  "description": "All social media links"
}

// Add links to bundle
POST /api/v1/url-shortener/bundles/:id/links
{
  "link_ids": [1, 2, 3, 4]
}
```

---

## Security

### Password Protection
- Links can be password-protected
- Passwords hashed with bcrypt
- Password required in query parameter: `?password=secret`

### Access Control
- Organization-level isolation
- User-level permissions
- API key authentication
- Rate limiting per API key

### Data Privacy
- Visitor IDs are hashed fingerprints
- IP addresses can be anonymized
- GDPR-compliant data retention
- Configurable data deletion policies

---

## Performance

### Optimization Strategies
- **Indexed Queries** - All common queries use indexes
- **Aggregated Analytics** - Daily rollups for fast reporting
- **Caching** - Redis caching for hot links
- **CDN Integration** - Static assets on CDN
- **Database Partitioning** - Time-based partitioning for click events

### Scalability
- Handles millions of clicks per day
- Horizontal scaling support
- Read replicas for analytics
- Async event processing

### Monitoring
- Link health checks
- Destination URL monitoring
- Performance metrics
- Error tracking

---

## Migration Guide

### From v1.0 to v2.0

The v2.0 upgrade includes breaking changes. Follow this migration guide:

1. **Backup Database**
   ```bash
   pg_dump -U postgres digitpenhub > backup_before_upgrade.sql
   ```

2. **Run Migration**
   ```bash
   psql -U postgres digitpenhub < db/112_url_shortener_enterprise.sql
   ```

3. **Update Application Code**
   - Update API endpoints to new routes
   - Update frontend to use new response formats
   - Test all integrations

4. **Verify Migration**
   ```sql
   SELECT COUNT(*) FROM short_links;
   SELECT COUNT(*) FROM url_click_events;
   ```

### Data Migration

Existing links are automatically migrated with:
- `slug` preserved
- `target_url` preserved
- `clicks` → `total_clicks`
- Default values for new fields

---

## Best Practices

### Link Management
1. Use descriptive titles for all links
2. Organize links into folders by campaign/project
3. Use tags for cross-cutting categorization
4. Set expiration dates for time-sensitive campaigns
5. Archive inactive links instead of deleting

### Analytics
1. Review analytics weekly for insights
2. Use UTM parameters consistently
3. Filter bot traffic for accurate metrics
4. Compare time periods for trend analysis
5. Export data for external analysis

### Custom Domains
1. Use branded domains for professional appearance
2. Keep DNS records up to date
3. Monitor SSL certificate expiration
4. Use different domains for different brands

### Security
1. Use password protection for sensitive links
2. Rotate API keys regularly
3. Monitor for suspicious activity
4. Set appropriate expiration dates
5. Review access logs periodically

---

## Troubleshooting

### Common Issues

**Link not redirecting**
- Check link status (must be 'active')
- Verify expiration date hasn't passed
- Check password protection settings

**Analytics not tracking**
- Verify click events are being created
- Check for bot filtering
- Review date range filters

**Custom domain not working**
- Verify DNS records are correct
- Check domain verification status
- Ensure SSL certificate is active

**QR code not generating**
- Check link exists and is active
- Verify QR code service is running
- Review error logs

---

## API Rate Limits

### Default Limits
- **Free Tier:** 1,000 requests/hour
- **Pro Tier:** 10,000 requests/hour
- **Enterprise Tier:** 100,000 requests/hour

### Rate Limit Headers
```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9950
X-RateLimit-Reset: 1640000000
```

---

## Webhooks

### Available Events
- `link.created` - New link created
- `link.updated` - Link updated
- `link.deleted` - Link deleted
- `link.clicked` - Link clicked (high volume)
- `link.expired` - Link expired
- `domain.verified` - Custom domain verified
- `qr.generated` - QR code generated

### Webhook Payload Example
```json
{
  "event": "link.clicked",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "link_id": 123,
    "slug": "abc123",
    "visitor_id": "hash...",
    "country": "United States",
    "device_type": "mobile",
    "referrer_type": "social"
  }
}
```

---

## Support & Resources

### Documentation
- API Reference: `/docs/api/url-shortener`
- Video Tutorials: `/docs/videos/url-shortener`
- FAQ: `/docs/faq/url-shortener`

### Community
- Discord: [Join our community](#)
- Forum: [Community forum](#)
- GitHub: [Report issues](#)

### Enterprise Support
- Email: enterprise@digitpenhub.com
- Phone: +1 (555) 123-4567
- Slack: [Enterprise Slack](#)

---

## Changelog

### v2.0.0 (2024-01-15)
- ✅ Complete enterprise upgrade
- ✅ Advanced analytics with geo-tracking
- ✅ Custom domains support
- ✅ QR code generation
- ✅ A/B testing and link rotation
- ✅ Password protection
- ✅ Folders and tags
- ✅ Bulk operations
- ✅ UTM parameter builder
- ✅ Retargeting pixels
- ✅ API and webhooks
- ✅ Link health monitoring

### v1.0.0 (2023-06-01)
- Basic link shortening
- Simple click tracking
- CSV export

---

## License

Copyright © 2024 DigitPenHub. All rights reserved.

---

**Module Status:** ✅ Production Ready  
**Last Updated:** 2024-01-15  
**Maintained By:** Backend Team
