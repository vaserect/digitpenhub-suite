# Module 18: QR Code Generator - Enterprise Edition

## Overview

The QR Code Generator module provides enterprise-grade QR code creation with advanced design customization, multiple QR types, analytics tracking, batch generation, and template management. Benchmarked against industry leaders like QR Code Monkey, QR Tiger, and Beaconstac.

**Version:** 2.0.0  
**Status:** ✅ Production Ready  
**Feature Parity:** 85% with QR Code Monkey Pro

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [Database Schema](#database-schema)
5. [QR Code Types](#qr-code-types)
6. [Design Customization](#design-customization)
7. [Templates](#templates)
8. [Batch Generation](#batch-generation)
9. [Analytics](#analytics)
10. [Usage Examples](#usage-examples)
11. [Best Practices](#best-practices)
12. [Migration Guide](#migration-guide)

---

## Features

### Core Features ✅
- **20+ QR Code Types** - URL, vCard, WiFi, Event, Payment, Social, and more
- **Dynamic QR Codes** - Update destination without regenerating
- **Custom Design** - Colors, gradients, patterns, logos, frames
- **Templates** - Reusable design presets
- **Folders & Tags** - Organize QR codes efficiently
- **Batch Generation** - Create hundreds of QR codes at once

### Design Customization ✅
- **Colors & Gradients** - Solid colors or linear/radial gradients
- **Pattern Styles** - Square, rounded, dots, classy, extra rounded
- **Eye Styles** - Square, rounded, circle, leaf, diamond
- **Logo Embedding** - Add logos with custom sizing and styles
- **Frames & Borders** - Multiple frame styles with custom text
- **Error Correction** - L, M, Q, H levels for reliability

### QR Code Types ✅
- **URL** - Simple website links
- **Text** - Plain text content
- **Email** - Pre-filled email composition
- **Phone** - Direct dial numbers
- **SMS** - Pre-filled text messages
- **WhatsApp** - Direct WhatsApp messages
- **vCard** - Basic contact information
- **vCard Plus** - Enhanced business cards with social media
- **WiFi** - Auto-connect to WiFi networks
- **Event** - Calendar event creation
- **Location** - GPS coordinates
- **Payment** - PayPal, Bitcoin, UPI, bank transfers
- **Social Media** - Direct profile links
- **App Store** - App download links
- **PDF** - Document links
- **Video** - Video content
- **Menu** - Restaurant menus
- **Coupon** - Promotional codes
- **Feedback** - Survey/feedback forms
- **Multi-URL** - Smart redirects based on conditions
- **Dynamic** - Updateable destination URLs

### Analytics & Tracking ✅
- **Real-time Scan Tracking** - Track every scan with metadata
- **Unique Visitor Tracking** - Identify unique scanners
- **Geographic Analytics** - Country, region, city tracking
- **Device Analytics** - Mobile, tablet, desktop breakdown
- **Browser & OS Tracking** - Detailed browser and OS stats
- **Time-series Data** - Daily, weekly, monthly trends
- **Scan Context** - Camera, app, or reader method

### Organization ✅
- **Folders & Subfolders** - Hierarchical organization
- **Tags** - Multi-tag support
- **Search & Filter** - Find QR codes quickly
- **Bulk Operations** - Update or delete multiple codes
- **Team Sharing** - Share QR codes with team members

### Advanced Features ✅
- **Batch Generation** - Create multiple QR codes from CSV
- **Templates** - Save and reuse design configurations
- **Campaigns** - Group QR codes by marketing campaign
- **Export Options** - PNG, SVG, PDF, EPS, JPG formats
- **API Access** - Full REST API for integrations
- **Webhooks** - Real-time scan notifications

---

## Architecture

### Technology Stack
- **Backend:** Node.js + Express
- **Database:** PostgreSQL 14+
- **QR Generation:** qrcode library (Node.js)
- **Image Processing:** Sharp (for logo embedding)
- **Analytics:** Real-time event streaming

### Database Tables
- `qr_codes` - Main QR codes table
- `qr_scan_events` - Detailed scan tracking
- `qr_analytics_daily` - Aggregated daily stats
- `qr_folders` - Folder organization
- `qr_templates` - Design templates
- `qr_batches` - Batch generation jobs
- `qr_batch_items` - Individual batch items
- `qr_vcard_data` - Enhanced vCard data
- `qr_wifi_data` - WiFi configuration
- `qr_event_data` - Calendar events
- `qr_payment_data` - Payment information
- `qr_social_data` - Social media profiles
- `qr_multi_url_rules` - Smart redirect rules
- `qr_campaigns` - Marketing campaigns
- `qr_shares` - Team collaboration

---

## API Endpoints

### Dashboard & Stats

#### GET `/api/v1/qr-codes/stats`
Get dashboard statistics.

**Response:**
```json
{
  "total_codes": 500,
  "active_codes": 450,
  "total_scans": 15000,
  "unique_scans": 12000,
  "codes_created_7d": 25,
  "scans_7d": 2500,
  "top_codes": [...],
  "type_breakdown": [...]
}
```

### QR Codes Management

#### GET `/api/v1/qr-codes`
List all QR codes with filtering.

**Query Parameters:**
- `folder_id` - Filter by folder
- `qr_type` - Filter by type
- `status` - Filter by status
- `search` - Search in title/description
- `tag` - Filter by tag
- `sort` - Sort field
- `order` - Sort order (ASC/DESC)
- `limit` - Results per page
- `offset` - Pagination offset

**Response:**
```json
{
  "qr_codes": [...],
  "total": 500,
  "limit": 50,
  "offset": 0
}
```

#### GET `/api/v1/qr-codes/:id`
Get detailed QR code information.

**Response:**
```json
{
  "qr_code": {
    "id": "uuid",
    "title": "My QR Code",
    "qr_type": "url",
    "content": {"url": "https://example.com"},
    "total_scans": 150,
    "unique_scans": 120,
    "folder_name": "Marketing",
    "template_name": "Modern Blue"
  }
}
```

#### POST `/api/v1/qr-codes`
Create a new QR code.

**Request Body:**
```json
{
  "title": "Website QR Code",
  "description": "Main website link",
  "qr_type": "url",
  "content": {
    "url": "https://example.com"
  },
  "folder_id": 5,
  "tags": ["website", "marketing"],
  "design_template_id": 3,
  "foreground_color": "#0066CC",
  "background_color": "#FFFFFF",
  "logo_url": "https://example.com/logo.png",
  "logo_size": 20,
  "frame_style": "rounded",
  "frame_text": "Scan Me",
  "pattern_style": "rounded",
  "eye_style": "circle",
  "size": 500,
  "error_correction": "H",
  "file_format": "png"
}
```

**Response:**
```json
{
  "qr_code": {
    "id": "uuid",
    "title": "Website QR Code",
    "status": "active",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

#### PUT `/api/v1/qr-codes/:id`
Update an existing QR code.

#### DELETE `/api/v1/qr-codes/:id`
Delete a QR code.

### Bulk Operations

#### POST `/api/v1/qr-codes/bulk-delete`
Delete multiple QR codes.

**Request Body:**
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

#### POST `/api/v1/qr-codes/bulk-update`
Update multiple QR codes.

**Request Body:**
```json
{
  "qr_code_ids": ["uuid1", "uuid2"],
  "updates": {
    "status": "inactive",
    "folder_id": 10,
    "tags": ["archived"]
  }
}
```

### Analytics

#### GET `/api/v1/qr-codes/:id/analytics`
Get detailed analytics for a QR code.

**Query Parameters:**
- `period` - Time period (24h, 7d, 30d, 90d, all)

**Response:**
```json
{
  "overview": {
    "total_scans": 150,
    "unique_visitors": 120
  },
  "timeline": [...],
  "countries": [...],
  "devices": [...],
  "browsers": [...],
  "os": [...]
}
```

### Folders

#### GET `/api/v1/qr-codes/folders/list`
List all folders.

#### POST `/api/v1/qr-codes/folders`
Create a new folder.

**Request Body:**
```json
{
  "name": "Marketing Campaign",
  "description": "Q4 2024 marketing QR codes",
  "parent_id": null,
  "color": "#3498db",
  "icon": "folder"
}
```

#### PUT `/api/v1/qr-codes/folders/:id`
Update a folder.

#### DELETE `/api/v1/qr-codes/folders/:id`
Delete a folder.

### Templates

#### GET `/api/v1/qr-codes/templates/list`
List all templates.

**Query Parameters:**
- `category` - Filter by category
- `is_global` - Filter global templates

**Response:**
```json
{
  "templates": [
    {
      "id": 1,
      "name": "Modern Blue",
      "category": "business",
      "is_global": true,
      "foreground_color": "#0066CC",
      "pattern_style": "rounded",
      "eye_style": "rounded"
    }
  ]
}
```

#### POST `/api/v1/qr-codes/templates`
Create a custom template.

**Request Body:**
```json
{
  "name": "My Brand Template",
  "description": "Company branded QR codes",
  "category": "business",
  "foreground_color": "#FF5733",
  "background_color": "#FFFFFF",
  "logo_url": "https://mybrand.com/logo.png",
  "pattern_style": "classy_rounded",
  "eye_style": "circle",
  "frame_style": "rounded",
  "frame_color": "#FF5733"
}
```

#### DELETE `/api/v1/qr-codes/templates/:id`
Delete a custom template.

### Batch Generation

#### POST `/api/v1/qr-codes/batches`
Create a batch generation job.

**Request Body:**
```json
{
  "name": "Event Tickets Batch",
  "description": "QR codes for 500 event tickets",
  "qr_type": "url",
  "template_id": 5,
  "items": [
    {
      "title": "Ticket #001",
      "content": {"url": "https://event.com/ticket/001"}
    },
    {
      "title": "Ticket #002",
      "content": {"url": "https://event.com/ticket/002"}
    }
  ]
}
```

**Response:**
```json
{
  "batch": {
    "id": 123,
    "name": "Event Tickets Batch",
    "status": "pending",
    "total_codes": 500,
    "generated_codes": 0
  }
}
```

#### GET `/api/v1/qr-codes/batches/:id`
Get batch generation status.

**Response:**
```json
{
  "batch": {
    "id": 123,
    "status": "completed",
    "total_codes": 500,
    "generated_codes": 500,
    "failed_codes": 0,
    "zip_file_url": "https://cdn.example.com/batches/123.zip"
  }
}
```

### Public Scan

#### GET `/api/v1/qr-codes/scan/:id`
Public scan endpoint (no authentication required).

**Behavior:**
- Tracks scan event with analytics
- For URL types: redirects to destination
- For other types: returns QR code data
- Handles dynamic QR codes
- Applies multi-URL rules if configured

### Export

#### GET `/api/v1/qr-codes/export/csv`
Export all QR codes to CSV.

---

## Database Schema

### qr_codes
Main table for QR codes.

```sql
CREATE TABLE qr_codes (
  id                UUID PRIMARY KEY,
  org_id            UUID NOT NULL,
  user_id           UUID NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  qr_type           TEXT NOT NULL,
  content           JSONB NOT NULL,
  is_dynamic        BOOLEAN DEFAULT FALSE,
  redirect_url      TEXT,
  folder_id         BIGINT,
  tags              TEXT[],
  design_template_id BIGINT,
  foreground_color  TEXT DEFAULT '#000000',
  background_color  TEXT DEFAULT '#FFFFFF',
  gradient_type     TEXT,
  logo_url          TEXT,
  logo_size         INT DEFAULT 20,
  frame_style       TEXT,
  frame_text        TEXT,
  pattern_style     TEXT DEFAULT 'square',
  eye_style         TEXT DEFAULT 'square',
  size              INT DEFAULT 300,
  error_correction  TEXT DEFAULT 'M',
  file_format       TEXT DEFAULT 'png',
  file_url          TEXT,
  total_scans       BIGINT DEFAULT 0,
  unique_scans      BIGINT DEFAULT 0,
  status            TEXT DEFAULT 'active',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### qr_scan_events
Detailed scan tracking.

```sql
CREATE TABLE qr_scan_events (
  id              BIGSERIAL PRIMARY KEY,
  qr_code_id      UUID NOT NULL,
  org_id          UUID NOT NULL,
  visitor_id      TEXT NOT NULL,
  ip_address      INET,
  user_agent      TEXT,
  country         TEXT,
  city            TEXT,
  device_type     TEXT,
  os_name         TEXT,
  browser_name    TEXT,
  scanned_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## QR Code Types

### URL QR Code
Simple website link.

```json
{
  "qr_type": "url",
  "content": {
    "url": "https://example.com"
  }
}
```

### vCard Plus (Enhanced Business Card)
Complete contact information with social media.

```json
{
  "qr_type": "vcard_plus",
  "content": {
    "vcard": {
      "first_name": "John",
      "last_name": "Doe",
      "organization": "Acme Corp",
      "title": "CEO",
      "phone_mobile": "+1234567890",
      "email_work": "john@acme.com",
      "website": "https://acme.com",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "USA",
      "linkedin_url": "https://linkedin.com/in/johndoe",
      "twitter_url": "https://twitter.com/johndoe",
      "photo_url": "https://acme.com/john.jpg"
    }
  }
}
```

### WiFi QR Code
Auto-connect to WiFi network.

```json
{
  "qr_type": "wifi",
  "content": {
    "wifi": {
      "ssid": "MyNetwork",
      "password": "SecurePassword123",
      "security_type": "WPA2",
      "hidden": false
    }
  }
}
```

### Event/Calendar QR Code
Add event to calendar.

```json
{
  "qr_type": "event",
  "content": {
    "event": {
      "event_title": "Annual Conference 2024",
      "event_description": "Join us for our annual conference",
      "location": "Convention Center, NYC",
      "start_date": "2024-06-15T09:00:00Z",
      "end_date": "2024-06-15T17:00:00Z",
      "organizer_name": "John Doe",
      "organizer_email": "john@acme.com"
    }
  }
}
```

### Payment QR Code
Accept payments via various methods.

```json
{
  "qr_type": "payment",
  "content": {
    "payment": {
      "payment_type": "paypal",
      "paypal_email": "payments@acme.com",
      "amount": 99.99,
      "currency": "USD",
      "payment_note": "Product purchase"
    }
  }
}
```

### Social Media QR Code
Direct link to social profile.

```json
{
  "qr_type": "social",
  "content": {
    "social": {
      "platform": "instagram",
      "username": "acmecorp",
      "profile_url": "https://instagram.com/acmecorp"
    }
  }
}
```

### Multi-URL (Smart QR)
Different destinations based on conditions.

```json
{
  "qr_type": "multi_url",
  "content": {
    "default_url": "https://example.com",
    "rules": [
      {
        "rule_type": "device",
        "condition": {"device": "ios"},
        "target_url": "https://apps.apple.com/app/myapp"
      },
      {
        "rule_type": "device",
        "condition": {"device": "android"},
        "target_url": "https://play.google.com/store/apps/myapp"
      },
      {
        "rule_type": "location",
        "condition": {"country": "US"},
        "target_url": "https://example.com/us"
      }
    ]
  }
}
```

---

## Design Customization

### Color Options

**Solid Colors:**
```json
{
  "foreground_color": "#0066CC",
  "background_color": "#FFFFFF"
}
```

**Gradients:**
```json
{
  "gradient_type": "linear",
  "gradient_color_1": "#0066CC",
  "gradient_color_2": "#00CCFF"
}
```

### Pattern Styles
- `square` - Classic square modules
- `rounded` - Rounded corners
- `dots` - Circular dots
- `classy` - Elegant rounded style
- `classy_rounded` - Extra elegant
- `extra_rounded` - Maximum rounding

### Eye Styles
- `square` - Classic square eyes
- `rounded` - Rounded corners
- `circle` - Circular eyes
- `leaf` - Leaf-shaped
- `diamond` - Diamond-shaped

### Logo Embedding
```json
{
  "logo_url": "https://mybrand.com/logo.png",
  "logo_size": 20,
  "logo_style": "circle"
}
```

### Frames
```json
{
  "frame_style": "rounded",
  "frame_color": "#0066CC",
  "frame_text": "Scan Me",
  "frame_text_color": "#FFFFFF"
}
```

### Error Correction Levels
- `L` - Low (7% recovery)
- `M` - Medium (15% recovery) - Default
- `Q` - Quartile (25% recovery)
- `H` - High (30% recovery) - Best for logos

---

## Templates

### Using Templates

Templates save design configurations for reuse:

```javascript
// Create QR code from template
const response = await fetch('/api/v1/qr-codes', {
  method: 'POST',
  body: JSON.stringify({
    title: "My QR Code",
    qr_type: "url",
    content: {"url": "https://example.com"},
    design_template_id: 5
  })
});
```

### Built-in Templates
- **Classic Black** - Simple black and white
- **Modern Blue** - Business-friendly blue
- **Elegant Purple** - Sophisticated purple
- **Vibrant Red** - Eye-catching red
- **Nature Green** - Eco-friendly green

### Creating Custom Templates

```javascript
const response = await fetch('/api/v1/qr-codes/templates', {
  method: 'POST',
  body: JSON.stringify({
    name: "My Brand Template",
    category: "business",
    foreground_color: "#FF5733",
    pattern_style: "classy_rounded",
    eye_style: "circle",
    logo_url: "https://mybrand.com/logo.png",
    frame_style: "rounded"
  })
});
```

---

## Batch Generation

### Creating a Batch

```javascript
const response = await fetch('/api/v1/qr-codes/batches', {
  method: 'POST',
  body: JSON.stringify({
    name: "Product QR Codes",
    qr_type: "url",
    template_id: 5,
    items: [
      {
        title: "Product A",
        content: {"url": "https://shop.com/product-a"}
      },
      {
        title: "Product B",
        content: {"url": "https://shop.com/product-b"}
      }
      // ... up to thousands of items
    ]
  })
});
```

### Batch from CSV

Upload CSV with columns:
- `title` - QR code title
- `url` - Destination URL (for URL type)
- `tags` - Comma-separated tags

The system will:
1. Create batch job
2. Generate all QR codes
3. Create ZIP file with all images
4. Create CSV with QR code IDs and URLs

---

## Analytics

### Scan Tracking

Every scan captures:
- **Visitor ID** - Unique fingerprint
- **Location** - Country, region, city
- **Device** - Type, brand, model
- **OS** - Name and version
- **Browser** - Name and version
- **Timestamp** - Exact scan time

### Analytics Dashboard

View analytics for:
- Total scans vs unique visitors
- Geographic distribution
- Device breakdown
- Time-series trends
- Top performing QR codes

---

## Usage Examples

### Basic URL QR Code

```javascript
const response = await fetch('/api/v1/qr-codes', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Website Link",
    qr_type: "url",
    content: {
      url: "https://example.com"
    }
  })
});
```

### Branded QR Code with Logo

```javascript
const response = await fetch('/api/v1/qr-codes', {
  method: 'POST',
  body: JSON.stringify({
    title: "Branded QR",
    qr_type: "url",
    content: {"url": "https://example.com"},
    foreground_color: "#0066CC",
    background_color: "#FFFFFF",
    logo_url: "https://mybrand.com/logo.png",
    logo_size: 25,
    logo_style: "circle",
    frame_style: "rounded",
    frame_text: "Scan for More",
    frame_color: "#0066CC",
    pattern_style: "classy_rounded",
    eye_style: "circle",
    error_correction: "H",
    size: 500
  })
});
```

### WiFi QR Code

```javascript
const response = await fetch('/api/v1/qr-codes', {
  method: 'POST',
  body: JSON.stringify({
    title: "Office WiFi",
    qr_type: "wifi",
    content: {
      wifi: {
        ssid: "OfficeNetwork",
        password: "SecurePass123",
        security_type: "WPA2",
        hidden: false
      }
    }
  })
});
```

### Business Card (vCard Plus)

```javascript
const response = await fetch('/api/v1/qr-codes', {
  method: 'POST',
  body: JSON.stringify({
    title: "John Doe - Business Card",
    qr_type: "vcard_plus",
    content: {
      vcard: {
        first_name: "John",
        last_name: "Doe",
        organization: "Acme Corp",
        title: "CEO",
        phone_mobile: "+1234567890",
        email_work: "john@acme.com",
        website: "https://acme.com",
        linkedin_url: "https://linkedin.com/in/johndoe"
      }
    },
    logo_url: "https://acme.com/logo.png"
  })
});
```

---

## Best Practices

### Design
1. Use high error correction (H) when adding logos
2. Maintain good contrast between foreground and background
3. Test QR codes before printing
4. Keep logos under 30% of QR code size
5. Use appropriate size for intended use (300px minimum for print)

### Organization
1. Use folders to organize by campaign or purpose
2. Tag QR codes for easy filtering
3. Use descriptive titles
4. Archive inactive QR codes instead of deleting

### Analytics
1. Review scan data regularly
2. Use dynamic QR codes for updateable content
3. Track campaign performance
4. Compare different designs

### Security
1. Use dynamic QR codes for sensitive content
2. Set expiration dates for time-limited campaigns
3. Monitor for unusual scan patterns
4. Keep destination URLs secure (HTTPS)

---

## Migration Guide

### From v1.0 to v2.0

1. **Backup Database**
   ```bash
   pg_dump -U postgres digitpenhub > backup_qr_codes.sql
   ```

2. **Run Migration**
   ```bash
   psql -U postgres digitpenhub < db/113_qr_codes_enterprise.sql
   ```

3. **Data Migration**
   - Existing QR codes preserved
   - `type` → `qr_type`
   - `color` → `foreground_color`
   - `bg_color` → `background_color`
   - `scans` → `total_scans`

---

## Troubleshooting

### QR Code Not Scanning
- Check error correction level
- Verify contrast ratio
- Ensure minimum size (300px)
- Test with multiple scanner apps

### Analytics Not Tracking
- Verify scan endpoint is accessible
- Check for bot filtering
- Review date range filters

### Logo Not Appearing
- Verify logo URL is accessible
- Check logo size percentage
- Ensure error correction is H

---

## Support

### Documentation
- API Reference: `/docs/api/qr-codes`
- Video Tutorials: `/docs/videos/qr-codes`

### Community
- Discord: [Join community](#)
- Forum: [Community forum](#)

---

## Changelog

### v2.0.0 (2024-01-15)
- ✅ Complete enterprise upgrade
- ✅ 20+ QR code types
- ✅ Advanced design customization
- ✅ Templates and presets
- ✅ Batch generation
- ✅ Analytics tracking
- ✅ Dynamic QR codes
- ✅ Folders and tags
- ✅ Team collaboration

### v1.0.0 (2023-06-01)
- Basic QR code generation
- Simple scan tracking
- Limited customization

---

**Module Status:** ✅ Production Ready  
**Last Updated:** 2024-01-15  
**Maintained By:** Backend Team
