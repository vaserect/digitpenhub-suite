# Website Builder Template System Documentation

## Overview

The Digitpen Hub Suite now includes a comprehensive website builder template system with **460 professionally designed templates** across 100+ industries. Each template comes with real thumbnail images from Pexels and a complete preview system.

## System Architecture

### Database Structure

**Tables:**
- `builder_templates` - Main template metadata
- `builder_template_pages` - Individual pages within each template
- `builder_template_blocks` - Content blocks for each page

**Key Fields:**
```sql
builder_templates:
  - id (UUID)
  - name (VARCHAR)
  - description (TEXT)
  - industry (VARCHAR)
  - category (VARCHAR)
  - style_variant (VARCHAR)
  - thumbnail_url (VARCHAR)
  - demo_url (VARCHAR)
  - is_featured (BOOLEAN)
  - is_premium (BOOLEAN)
  - is_active (BOOLEAN)
  - scope (VARCHAR) - 'global' or 'org'
```

### File Structure

```
digitpenhub-suite/
├── backend/
│   ├── db/
│   │   ├── 125_seed_templates_batch1.sql
│   │   ├── 126_seed_templates_batch2.sql
│   │   ├── ... (through 134)
│   │   └── 134_seed_templates_batch10.sql
│   ├── scripts/
│   │   ├── update-template-demo-urls.js
│   │   ├── generate-placeholder-thumbnails.js
│   │   └── generate-pexels-thumbnails.js
│   └── src/
│       ├── routes/builder.js
│       └── utils/pexels.js
└── frontend/
    ├── app/
    │   └── templates/
    │       ├── page.js (Template Library)
    │       └── preview/
    │           └── [id]/
    │               └── page.js (Template Preview)
    └── public/
        └── templates/
            ├── *.jpg (460 Pexels images)
            └── *.svg (460 SVG placeholders - backup)
```

## API Endpoints

### List Templates
```http
GET /api/v1/builder/templates
```

**Query Parameters:**
- `limit` (number) - Max templates to return (default: 50)
- `offset` (number) - Pagination offset
- `industry` (string) - Filter by industry
- `style` (string) - Filter by style variant
- `featured` (boolean) - Show only featured templates
- `premium` (boolean) - Show only premium templates

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Modern Real Estate",
      "description": "Professional real estate website...",
      "industry": "Real Estate",
      "category": "Business",
      "style_variant": "Modern",
      "thumbnail_url": "/templates/uuid.jpg",
      "demo_url": "/templates/preview/uuid",
      "is_featured": true,
      "is_premium": false,
      "page_count": 5
    }
  ],
  "total": 460,
  "limit": 50,
  "offset": 0
}
```

### Get Template Details
```http
GET /api/v1/builder/templates/:id
```

**Response:**
```json
{
  "template": {
    "id": "uuid",
    "name": "Modern Real Estate",
    "description": "...",
    "industry": "Real Estate",
    "thumbnail_url": "/templates/uuid.jpg",
    "demo_url": "/templates/preview/uuid",
    "pages": [
      {
        "id": "uuid",
        "name": "Home",
        "slug": "home",
        "is_homepage": true,
        "blocks": [...]
      }
    ]
  }
}
```

### Get Template Pages
```http
GET /api/v1/builder/templates/:id/pages
```

### Use Template (Create Site)
```http
POST /api/v1/builder/templates/:id/use
```

**Request Body:**
```json
{
  "site_name": "My New Website",
  "customize": true
}
```

**Response:**
```json
{
  "site_id": "uuid",
  "message": "Site created successfully from template"
}
```

## Frontend Routes

### Template Library
**URL:** `/templates`

**Features:**
- Grid view of all 460 templates
- Real-time search across name, industry, and description
- Filter by industry (100+ options)
- Filter by style variant (Modern, Classic, Minimal, Bold, Creative)
- Toggle filters for Featured and Premium templates
- Responsive design with hover effects
- Click to preview any template

### Template Preview
**URL:** `/templates/preview/:id`

**Features:**
- Full template details display
- Page navigation (Home, About, Services, etc.)
- Content block preview
- "Use This Template" button
- Responsive layout
- Back to library navigation

## Scripts

### 1. Update Demo URLs
**File:** `backend/scripts/update-template-demo-urls.js`

**Purpose:** Updates all template demo URLs to point to internal preview system

**Usage:**
```bash
cd backend
node scripts/update-template-demo-urls.js
```

**What it does:**
- Connects to database
- Updates all 460 templates
- Sets demo_url to `/templates/preview/{id}`
- Reports success/failure

### 2. Generate SVG Placeholders
**File:** `backend/scripts/generate-placeholder-thumbnails.js`

**Purpose:** Creates industry-themed SVG placeholder thumbnails

**Usage:**
```bash
cd backend
node scripts/generate-placeholder-thumbnails.js
```

**What it does:**
- Generates 460 SVG files (1.6KB each)
- Uses industry-specific color schemes
- Saves to `frontend/public/templates/`
- Updates database with thumbnail URLs

### 3. Generate Pexels Thumbnails
**File:** `backend/scripts/generate-pexels-thumbnails.js`

**Purpose:** Fetches real images from Pexels API for each template

**Usage:**
```bash
cd backend
node scripts/generate-pexels-thumbnails.js
```

**Requirements:**
- Pexels API keys in `.env` file:
  ```
  PEXELS_API_KEY_1=your_key_here
  PEXELS_API_KEY_2=your_key_here
  PEXELS_API_KEY_3=your_key_here
  ```

**What it does:**
- Fetches industry-relevant images from Pexels
- Downloads 460 JPG images (150-300KB each)
- Saves to `frontend/public/templates/`
- Updates database with new thumbnail URLs
- Rotates API keys to avoid rate limits
- Includes 100ms delay between requests

**Industry Mapping:**
- Real Estate → "modern house architecture"
- Restaurant → "restaurant interior dining"
- Healthcare → "medical clinic hospital"
- Technology → "technology office workspace"
- And 30+ more industry-specific queries

## Template Statistics

### By Industry (Top 10)
1. Real Estate - 46 templates
2. Restaurant - 46 templates
3. Healthcare - 46 templates
4. Technology - 46 templates
5. Education - 46 templates
6. Retail - 46 templates
7. Finance - 46 templates
8. Legal - 46 templates
9. Fitness - 46 templates
10. Beauty - 46 templates

### By Style Variant
- Modern: 92 templates
- Classic: 92 templates
- Minimal: 92 templates
- Bold: 92 templates
- Creative: 92 templates

### Special Categories
- Featured: 74 templates
- Premium: 46 templates
- Free: 414 templates

### Pages per Template
- Average: 5 pages
- Common pages: Home, About, Services, Contact, Blog

## Image Assets

### Thumbnail Images
**Location:** `/frontend/public/templates/`

**Formats:**
- Primary: JPG (from Pexels API)
- Fallback: SVG (generated placeholders)

**Specifications:**
- JPG: 800x600px, landscape orientation
- SVG: 800x600px, industry-themed colors
- File naming: `{template-id}.jpg` or `{template-id}.svg`

**Total Size:**
- JPG images: ~100MB (460 files × ~220KB avg)
- SVG images: ~740KB (460 files × 1.6KB)

## Pexels Integration

### API Configuration
The system uses the shared Pexels utility (`src/utils/pexels.js`) which:
- Rotates across multiple API keys
- Caches results for 6 hours
- Handles rate limiting automatically
- Maps photos to standardized format

### Search Queries
Each industry has a carefully crafted search query:
```javascript
{
  'real-estate': 'modern house architecture',
  'restaurant': 'restaurant interior dining',
  'healthcare': 'medical clinic hospital',
  // ... 30+ more
}
```

## Development Workflow

### Adding New Templates

1. **Create Migration File:**
```sql
-- db/135_seed_new_templates.sql
INSERT INTO builder_templates (id, name, industry, ...) VALUES
  (gen_random_uuid(), 'Template Name', 'Industry', ...);
```

2. **Run Migration:**
```bash
cd backend
npm run migrate
```

3. **Generate Thumbnails:**
```bash
node scripts/generate-pexels-thumbnails.js
```

4. **Verify:**
- Check database: `SELECT * FROM builder_templates WHERE name = 'Template Name'`
- Check file: `ls frontend/public/templates/{id}.jpg`
- Test preview: Visit `/templates/preview/{id}`

### Updating Existing Templates

1. **Update Database:**
```sql
UPDATE builder_templates 
SET description = 'New description'
WHERE id = 'template-id';
```

2. **Regenerate Thumbnail (if needed):**
```bash
# Delete old thumbnail
rm frontend/public/templates/{id}.jpg

# Regenerate
node scripts/generate-pexels-thumbnails.js
```

## Troubleshooting

### Templates Not Showing
1. Check database connection
2. Verify migrations ran: `SELECT * FROM schema_migrations WHERE version >= 125`
3. Check API endpoint: `curl http://localhost:4001/api/v1/builder/templates`

### Thumbnails Not Loading
1. Check file exists: `ls frontend/public/templates/{id}.jpg`
2. Verify thumbnail_url in database
3. Check Next.js public folder serving
4. Try SVG fallback if JPG missing

### Pexels API Issues
1. Verify API keys in `.env`
2. Check rate limits (50 requests/hour per key)
3. Review error logs in script output
4. Use SVG placeholders as fallback

### Preview Page Not Working
1. Check template exists in database
2. Verify pages exist for template
3. Check API endpoint returns data
4. Review browser console for errors

## Performance Considerations

### Database
- Indexes on `industry`, `style_variant`, `is_featured`
- Pagination for large result sets
- Efficient JOIN queries for pages/blocks

### Images
- JPG compression for smaller file sizes
- Lazy loading in template grid
- Next.js Image component optimization
- CDN recommended for production

### API
- Response caching (6 hours for Pexels)
- Rate limiting on endpoints
- Efficient query patterns

## Security

### Template Access
- Global templates: Available to all users
- Org templates: Scoped to organization
- Premium templates: Require subscription check

### API Protection
- Authentication required for "use template"
- Rate limiting on all endpoints
- Input validation on filters

### Image Security
- Pexels API keys in environment variables
- No direct API key exposure to frontend
- Secure image downloads

## Future Enhancements

### Planned Features
1. Template categories/tags system
2. User ratings and reviews
3. Template customization wizard
4. A/B testing for templates
5. Template analytics dashboard
6. Custom template uploads
7. Template marketplace
8. AI-powered template recommendations

### Optimization Opportunities
1. WebP image format support
2. Progressive image loading
3. Template preview caching
4. Search index optimization
5. CDN integration
6. Image lazy loading improvements

## Support

### Common Questions

**Q: How do I add a new industry?**
A: Add templates with the new industry name, then it will automatically appear in filters.

**Q: Can I customize templates before using them?**
A: Yes, use the preview page and click "Use This Template" to start customization.

**Q: How often are thumbnails updated?**
A: Thumbnails are static. Re-run the Pexels script to refresh them.

**Q: What if Pexels API is down?**
A: SVG placeholders serve as fallback. System continues to work.

**Q: How do I make a template featured?**
A: Update `is_featured = true` in the database for that template.

## Maintenance

### Regular Tasks
- Monitor Pexels API usage
- Review template performance metrics
- Update outdated thumbnails
- Clean up unused templates
- Optimize database queries

### Backup Strategy
- Database: Regular PostgreSQL backups
- Images: Backup `frontend/public/templates/`
- Scripts: Version controlled in Git

## Conclusion

The template system is production-ready with:
- ✅ 460 professional templates
- ✅ Real Pexels thumbnails
- ✅ Complete preview system
- ✅ Robust API endpoints
- ✅ Comprehensive filtering
- ✅ Responsive UI
- ✅ Automated scripts
- ✅ Full documentation

For questions or issues, refer to this documentation or contact the development team.
