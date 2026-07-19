# Website Builder API Documentation

Complete API reference for the Website Builder module components, sections, and templates.

---

## Base URL

```
http://localhost:3000/api/v1
```

---

## Authentication

Most endpoints require authentication via JWT token in cookies or Authorization header.

```
Authorization: Bearer <token>
```

---

## Components API

### List All Components

**GET** `/api/v1/components`

Get a paginated list of all active components with optional filtering.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Filter by category (e.g., "hero", "navigation") |
| `tags` | string | No | Comma-separated tags (e.g., "modern,responsive") |
| `search` | string | No | Search in name and description |
| `limit` | number | No | Items per page (default: 50) |
| `offset` | number | No | Pagination offset (default: 0) |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/components?category=hero&limit=10"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Hero Section - Modern",
      "description": "Modern hero section with gradient background",
      "category": "hero",
      "preview_url": "https://example.com/preview/hero-modern.png",
      "html_content": "<div class=\"hero\">...</div>",
      "css_content": ".hero { ... }",
      "js_content": "// Optional JavaScript",
      "tags": ["modern", "gradient", "responsive"],
      "is_active": true,
      "usage_count": 245,
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-07-13T20:00:00Z"
    }
  ],
  "pagination": {
    "total": 142,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### Get Component Categories

**GET** `/api/v1/components/categories`

Get all component categories with counts.

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/components/categories"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    { "category": "hero", "count": "10" },
    { "category": "navigation", "count": "8" },
    { "category": "features", "count": "10" },
    { "category": "cta", "count": "8" }
  ]
}
```

---

### Get Single Component

**GET** `/api/v1/components/:id`

Get detailed information about a specific component.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Component ID |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/components/1"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Hero Section - Modern",
    "description": "Modern hero section with gradient background",
    "category": "hero",
    "preview_url": "https://example.com/preview/hero-modern.png",
    "html_content": "<div class=\"hero\">...</div>",
    "css_content": ".hero { ... }",
    "js_content": "// Optional JavaScript",
    "tags": ["modern", "gradient", "responsive"],
    "is_active": true,
    "usage_count": 245,
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-07-13T20:00:00Z"
  }
}
```

---

### Track Component Usage

**POST** `/api/v1/components/:id/use`

Increment the usage counter for a component.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Component ID |

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/v1/components/1/use"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "usage_count": 246
  }
}
```

---

### Get Popular Components

**GET** `/api/v1/components/popular/list`

Get the most popular components by usage count.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Number of items (default: 10) |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/components/popular/list?limit=5"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Hero Section - Modern",
      "usage_count": 245,
      "category": "hero"
    }
  ]
}
```

---

## Sections API

### List All Sections

**GET** `/api/v1/sections`

Get a paginated list of all active sections with optional filtering.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Filter by category |
| `tags` | string | No | Comma-separated tags |
| `search` | string | No | Search in name and description |
| `limit` | number | No | Items per page (default: 50) |
| `offset` | number | No | Pagination offset (default: 0) |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/sections?category=hero-features&limit=10"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Hero + Features Combo",
      "description": "Modern hero section with feature grid below",
      "category": "hero-features",
      "preview_url": "https://example.com/preview/hero-features-1.png",
      "html_content": "<section>...</section>",
      "css_content": "section { ... }",
      "js_content": "// Optional JavaScript",
      "components_used": [1, 15],
      "tags": ["modern", "responsive", "combo"],
      "is_active": true,
      "usage_count": 89,
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-07-13T20:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### Get Section Categories

**GET** `/api/v1/sections/categories`

Get all section categories with counts.

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/sections/categories"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    { "category": "hero-features", "count": "5" },
    { "category": "cta-testimonials", "count": "5" },
    { "category": "pricing-features", "count": "5" }
  ]
}
```

---

### Get Single Section

**GET** `/api/v1/sections/:id`

Get detailed information about a specific section.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Section ID |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/sections/1"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Hero + Features Combo",
    "description": "Modern hero section with feature grid below",
    "category": "hero-features",
    "preview_url": "https://example.com/preview/hero-features-1.png",
    "html_content": "<section>...</section>",
    "css_content": "section { ... }",
    "js_content": "// Optional JavaScript",
    "components_used": [1, 15],
    "tags": ["modern", "responsive", "combo"],
    "is_active": true,
    "usage_count": 89,
    "created_at": "2026-02-01T10:00:00Z",
    "updated_at": "2026-07-13T20:00:00Z"
  }
}
```

---

### Track Section Usage

**POST** `/api/v1/sections/:id/use`

Increment the usage counter for a section.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Section ID |

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/v1/sections/1/use"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "usage_count": 90
  }
}
```

---

### Get Popular Sections

**GET** `/api/v1/sections/popular/list`

Get the most popular sections by usage count.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Number of items (default: 10) |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/sections/popular/list?limit=5"
```

---

## Site Templates API

### List All Templates

**GET** `/api/v1/site-templates`

Get a paginated list of all active templates with optional filtering.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Filter by category (e.g., "business", "ecommerce") |
| `tags` | string | No | Comma-separated tags |
| `search` | string | No | Search in name and description |
| `premium` | boolean | No | Filter by premium status (true/false) |
| `limit` | number | No | Items per page (default: 20) |
| `offset` | number | No | Pagination offset (default: 0) |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/site-templates?category=business&premium=false"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Corporate Pro",
      "description": "Professional corporate website template",
      "category": "business",
      "preview_url": "https://example.com/preview/corporate-pro.png",
      "thumbnail_url": "https://example.com/thumb/corporate-pro.jpg",
      "demo_url": "https://demo.example.com/corporate-pro",
      "pages": [
        {
          "name": "Home",
          "slug": "home",
          "sections": [1, 2, 3, 4, 5]
        },
        {
          "name": "About",
          "slug": "about",
          "sections": [6, 7, 8]
        }
      ],
      "color_scheme": {
        "primary": "#2563eb",
        "secondary": "#7c3aed",
        "accent": "#f59e0b",
        "background": "#ffffff",
        "text": "#1f2937"
      },
      "fonts": {
        "heading": "Inter",
        "body": "Inter"
      },
      "features": [
        "Responsive Design",
        "SEO Optimized",
        "Fast Loading"
      ],
      "tags": ["corporate", "professional", "modern"],
      "is_premium": false,
      "is_active": true,
      "usage_count": 156,
      "rating": 4.8,
      "created_at": "2026-03-01T10:00:00Z",
      "updated_at": "2026-07-13T20:00:00Z"
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### Get Template Categories

**GET** `/api/v1/site-templates/categories`

Get all template categories with counts.

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/site-templates/categories"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    { "category": "business", "count": "2" },
    { "category": "ecommerce", "count": "2" },
    { "category": "portfolio", "count": "2" },
    { "category": "saas", "count": "2" }
  ]
}
```

---

### Get Free Templates

**GET** `/api/v1/site-templates/free`

Get all free templates.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Items per page (default: 20) |
| `offset` | number | No | Pagination offset (default: 0) |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/site-templates/free"
```

---

### Get Premium Templates

**GET** `/api/v1/site-templates/premium`

Get all premium templates.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Items per page (default: 20) |
| `offset` | number | No | Pagination offset (default: 0) |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/site-templates/premium"
```

---

### Get Popular Templates

**GET** `/api/v1/site-templates/popular`

Get the most popular templates by usage count.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Number of items (default: 10) |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/site-templates/popular?limit=5"
```

---

### Get Top Rated Templates

**GET** `/api/v1/site-templates/top-rated`

Get the highest rated templates.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Number of items (default: 10) |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/site-templates/top-rated?limit=5"
```

---

### Get Single Template

**GET** `/api/v1/site-templates/:id`

Get detailed information about a specific template.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Template ID |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/api/v1/site-templates/1"
```

---

### Track Template Usage

**POST** `/api/v1/site-templates/:id/use`

Increment the usage counter for a template.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Template ID |

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/v1/site-templates/1/use"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "usage_count": 157
  }
}
```

---

### Rate Template

**POST** `/api/v1/site-templates/:id/rate`

Rate a template (0-5 stars).

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Template ID |

**Request Body:**

```json
{
  "rating": 4.5
}
```

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/v1/site-templates/1/rate" \
  -H "Content-Type: application/json" \
  -d '{"rating": 4.5}'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "rating": 4.5
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

**404 Not Found:**

```json
{
  "success": false,
  "error": "Component not found"
}
```

**400 Bad Request:**

```json
{
  "success": false,
  "error": "Rating must be between 0 and 5"
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "error": "Failed to fetch components"
}
```

---

## Usage Examples

### Building a Page from Components

```javascript
// 1. Get all hero components
const heroes = await fetch('/api/v1/components?category=hero');

// 2. Get all feature components
const features = await fetch('/api/v1/components?category=features');

// 3. Track usage when user selects a component
await fetch('/api/v1/components/1/use', { method: 'POST' });

// 4. Combine components to build page
const page = {
  sections: [
    heroes.data[0],
    features.data[0]
  ]
};
```

### Using Pre-built Sections

```javascript
// 1. Get hero+features sections
const sections = await fetch('/api/v1/sections?category=hero-features');

// 2. Track usage
await fetch('/api/v1/sections/1/use', { method: 'POST' });

// 3. Use section directly
const page = {
  sections: [sections.data[0]]
};
```

### Using Complete Templates

```javascript
// 1. Get free business templates
const templates = await fetch('/api/v1/site-templates/free?category=business');

// 2. Get specific template
const template = await fetch('/api/v1/site-templates/1');

// 3. Track usage
await fetch('/api/v1/site-templates/1/use', { method: 'POST' });

// 4. Rate template
await fetch('/api/v1/site-templates/1/rate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ rating: 5 })
});

// 5. Use template structure
const website = {
  name: 'My Business Site',
  template: template.data,
  pages: template.data.pages
};
```

---

## Rate Limiting

- **Components/Sections**: 100 requests per minute
- **Templates**: 50 requests per minute
- **Usage Tracking**: 200 requests per minute

---

## Best Practices

1. **Cache Responses**: Cache component/section/template lists for better performance
2. **Track Usage**: Always track usage when a user selects an asset
3. **Pagination**: Use pagination for large lists
4. **Search**: Use search and filters to reduce payload size
5. **Error Handling**: Always handle error responses gracefully

---

## Support

For issues or questions:
- GitHub: [Repository Issues](https://github.com/your-repo/issues)
- Email: support@example.com
- Documentation: [Full Docs](https://docs.example.com)

---

**Last Updated**: 2026-07-13
**API Version**: 1.0
**Status**: Production Ready ✅
