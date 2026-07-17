# 🖼️ Pexels Stock Photo Integration - COMPLETE

## Overview

The Website Builder now includes full integration with Pexels API, providing users with access to millions of high-quality, free stock photos directly within the builder interface.

## 🎯 What Was Implemented

### Backend Integration

#### 1. Pexels Service (`backend/src/services/pexels.service.js`)
- Full Pexels API wrapper with comprehensive methods
- Search photos with filters (orientation, size, color)
- Browse curated and popular photos
- Category-based browsing
- Photo collections support
- Automatic response formatting
- Error handling and fallbacks

**Key Features:**
- ✅ Photo search with advanced filters
- ✅ Curated photos (editor's picks)
- ✅ Category browsing (15 predefined categories)
- ✅ Individual photo retrieval
- ✅ Collections support
- ✅ Pagination support
- ✅ Configuration status checking

#### 2. API Routes (`backend/src/routes/pexels.routes.js`)
Registered at `/api/v1/pexels/*`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/status` | GET | Check if Pexels API is configured |
| `/search` | GET | Search photos with query and filters |
| `/curated` | GET | Get curated photos (editor's picks) |
| `/popular` | GET | Get popular photos |
| `/categories` | GET | Get predefined photo categories |
| `/category/:category` | GET | Get photos by category |
| `/photo/:id` | GET | Get specific photo by ID |
| `/collections` | GET | Get featured collections |
| `/stats` | GET | Get API usage stats (admin only) |

**Authentication:** All endpoints require user authentication except `/status`

#### 3. Environment Configuration
Added to `.env.example`:
```bash
# Pexels API for stock photos in Website Builder
# Get your free API key at: https://www.pexels.com/api/
PEXELS_API_KEY=YOUR_PEXELS_API_KEY_HERE
```

### Frontend Integration

#### 1. PhotoPicker Component (`frontend/components/builder/PhotoPicker.jsx`)
Full-featured photo picker modal with:

**Features:**
- ✅ Search functionality with real-time results
- ✅ Curated photos tab
- ✅ Category browsing (15 categories with icons)
- ✅ Grid layout with hover effects
- ✅ Photo selection with visual feedback
- ✅ Pagination (load more)
- ✅ Photographer attribution
- ✅ Responsive design
- ✅ Loading states and error handling
- ✅ Configuration status checking

**UI Elements:**
- Search bar with instant search
- Tab navigation (Search, Curated, Categories)
- Photo grid with hover effects
- Selected photo indicator
- Load more button
- Photographer credit display
- Confirmation buttons

#### 2. ImageField Component
Added to `BuilderPropertiesPanel.js`:
- Text input for manual URL entry
- "Browse Stock Photos" button
- Image preview
- Integrated PhotoPicker modal
- Seamless photo selection workflow

#### 3. Builder Integration
Updated `BuilderPropertiesPanel.js`:
- Added ImageField for hero background images
- Imported PhotoPicker component
- Integrated stock photo browsing into property editing

### Build System

#### 1. Frontend Build
- ✅ Added `jsconfig.json` for path resolution
- ✅ Installed `@heroicons/react` dependency
- ✅ Successfully built Next.js application
- ✅ All components compile without errors

## 📋 Setup Instructions

### 1. Get Pexels API Key

1. Visit https://www.pexels.com/api/
2. Sign up for a free account
3. Generate your API key (free tier: 200 requests/hour)

### 2. Configure Backend

Add to `backend/.env`:
```bash
PEXELS_API_KEY=your_actual_api_key_here
```

### 3. Restart Backend

```bash
cd backend
npm restart
# or
pm2 restart digitpenhub-suite
```

### 4. Verify Integration

Check API status:
```bash
curl http://localhost:4001/api/v1/pexels/status
```

Expected response:
```json
{
  "success": true,
  "configured": true,
  "message": "Pexels API is configured and ready"
}
```

## 🎨 User Workflow

### Using Stock Photos in Website Builder

1. **Open Builder**
   - Navigate to Website Builder
   - Select a page to edit

2. **Select Component**
   - Click on a hero component or any component with images
   - Properties panel opens on the right

3. **Browse Photos**
   - Find the image field (e.g., "Background Image")
   - Click "Browse Stock Photos" button
   - PhotoPicker modal opens

4. **Find Perfect Photo**
   - **Search:** Type keywords (e.g., "business", "nature")
   - **Curated:** Browse editor-picked photos
   - **Categories:** Click category icons for themed photos

5. **Select & Use**
   - Click on desired photo
   - Photo highlights with checkmark
   - Click "Use This Photo"
   - Photo URL automatically inserted
   - Preview appears in properties panel

6. **Attribution**
   - Photographer credit shown in picker
   - Link to photographer's Pexels profile
   - Automatic attribution handling

## 🔧 API Usage Examples

### Search Photos

```javascript
// Search for business photos
GET /api/v1/pexels/search?query=business&page=1&perPage=20

// Search with filters
GET /api/v1/pexels/search?query=nature&orientation=landscape&size=large&color=green
```

### Browse Curated

```javascript
// Get curated photos
GET /api/v1/pexels/curated?page=1&perPage=20
```

### Browse by Category

```javascript
// Get nature photos
GET /api/v1/pexels/category/nature?page=1&perPage=20
```

### Get Categories

```javascript
// Get all available categories
GET /api/v1/pexels/categories

// Response:
[
  { id: 'nature', name: 'Nature', icon: '🌿' },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  // ... 12 more categories
]
```

## 📊 Available Categories

1. 🌿 Nature
2. 💼 Business
3. 💻 Technology
4. 👥 People
5. 🍔 Food
6. ✈️ Travel
7. 🏛️ Architecture
8. 👗 Fashion
9. 💪 Fitness
10. 🐾 Animals
11. 🎨 Abstract
12. 🌆 City
13. 🖥️ Workspace
14. ⚪ Minimal
15. 🖼️ Backgrounds

## 🎯 Features & Benefits

### For Users
- ✅ **Free Stock Photos** - Access millions of high-quality images
- ✅ **No Attribution Required** - Pexels photos are free to use
- ✅ **Easy Search** - Find perfect photos in seconds
- ✅ **Category Browsing** - Explore themed collections
- ✅ **Curated Selection** - Editor-picked quality photos
- ✅ **Instant Preview** - See photos before using
- ✅ **One-Click Insert** - No manual URL copying

### For Platform
- ✅ **Professional Content** - Users create better-looking sites
- ✅ **Faster Workflow** - No need to leave builder
- ✅ **Better UX** - Integrated, seamless experience
- ✅ **Free Service** - No additional costs
- ✅ **Scalable** - Handles high traffic with pagination

## 🔒 Security & Best Practices

### API Key Security
- ✅ API key stored in environment variables
- ✅ Never exposed to frontend
- ✅ Server-side API calls only
- ✅ Authentication required for all endpoints

### Rate Limiting
- **Free Tier:** 200 requests/hour
- **Recommendation:** Implement caching for popular searches
- **Fallback:** Graceful degradation if API unavailable

### Error Handling
- ✅ Configuration status checking
- ✅ User-friendly error messages
- ✅ Fallback to manual URL entry
- ✅ Loading states for better UX

## 📈 Performance Considerations

### Optimization Strategies

1. **Pagination**
   - Load 20 photos at a time
   - "Load More" button for additional results
   - Prevents overwhelming UI

2. **Image Optimization**
   - Pexels provides multiple sizes
   - Use `medium` for grid display
   - Use `large` for final insertion
   - Automatic compression via Pexels CDN

3. **Caching Recommendations**
   - Cache popular searches (Redis)
   - Cache category results
   - Cache curated photos (1 hour TTL)
   - Reduce API calls significantly

4. **Lazy Loading**
   - Images load as user scrolls
   - Improves initial load time
   - Better mobile experience

## 🐛 Troubleshooting

### API Not Working

**Check Configuration:**
```bash
# Backend
curl http://localhost:4001/api/v1/pexels/status

# If not configured:
# 1. Add PEXELS_API_KEY to backend/.env
# 2. Restart backend server
```

### Photos Not Loading

**Common Issues:**
1. **No API Key** - Add to `.env` file
2. **Invalid API Key** - Check key at pexels.com/api
3. **Rate Limit** - Wait or upgrade plan
4. **Network Error** - Check internet connection

### PhotoPicker Not Opening

**Check:**
1. User is authenticated
2. Frontend build is up to date
3. Browser console for errors
4. Component is properly imported

## 🚀 Future Enhancements

### Potential Improvements

1. **Search History**
   - Save recent searches
   - Quick access to previous queries

2. **Favorites**
   - Save favorite photos
   - Personal photo library

3. **Advanced Filters**
   - More color options
   - Aspect ratio selection
   - Photo quality filters

4. **Collections**
   - Browse Pexels collections
   - Themed photo sets
   - Curated galleries

5. **AI Suggestions**
   - Suggest photos based on content
   - Auto-match to component type
   - Smart recommendations

6. **Bulk Operations**
   - Select multiple photos
   - Batch download
   - Create photo sets

## 📝 Code Examples

### Using Pexels Service

```javascript
const pexelsService = require('./services/pexels.service');

// Search photos
const results = await pexelsService.searchPhotos('business', {
  page: 1,
  perPage: 20,
  orientation: 'landscape'
});

// Get curated photos
const curated = await pexelsService.getCuratedPhotos(1, 20);

// Get photo by ID
const photo = await pexelsService.getPhoto(12345);
```

### Using PhotoPicker Component

```jsx
import PhotoPicker from '@/components/builder/PhotoPicker';

function MyComponent() {
  const [showPicker, setShowPicker] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handlePhotoSelect = (photo) => {
    setImageUrl(photo.url);
    setShowPicker(false);
  };

  return (
    <>
      <button onClick={() => setShowPicker(true)}>
        Browse Photos
      </button>
      
      {showPicker && (
        <PhotoPicker
          onSelect={handlePhotoSelect}
          onClose={() => setShowPicker(false)}
          currentImage={imageUrl}
        />
      )}
    </>
  );
}
```

## 📚 Resources

- **Pexels API Docs:** https://www.pexels.com/api/documentation/
- **Pexels License:** https://www.pexels.com/license/
- **Get API Key:** https://www.pexels.com/api/
- **Pexels Guidelines:** https://www.pexels.com/api/documentation/#guidelines

## ✅ Completion Checklist

- [x] Pexels service implemented
- [x] API routes created and registered
- [x] PhotoPicker component built
- [x] ImageField component added
- [x] Builder integration complete
- [x] Environment configuration documented
- [x] Frontend build successful
- [x] Error handling implemented
- [x] Loading states added
- [x] Responsive design verified
- [x] Documentation complete

---

**Status:** ✅ COMPLETE  
**Date:** 2024-07-13  
**Integration:** Pexels API v1  
**Components:** 6 new files, 3 modified files  
**Impact:** Users can now browse and use millions of free stock photos directly in the Website Builder
