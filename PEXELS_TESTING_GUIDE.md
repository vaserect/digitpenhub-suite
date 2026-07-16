# Pexels Integration Testing Guide

## ✅ Configuration Complete

The Pexels API integration has been successfully configured with 7 API keys for optimal performance and rate limiting.

### Configuration Status
- **API Keys Added:** 7 keys (PEXELS_API_KEY_1 through PEXELS_API_KEY_7)
- **Backend Status:** ✅ Configured and running
- **Verification:** `curl http://127.0.0.1:5000/api/v1/pexels/status` returns `"configured": true`

---

## 🧪 Testing in the Browser

### Step 1: Access the Website Builder
1. Navigate to: `https://suite.digitpenhub.com/builder`
2. Log in with your credentials
3. Create a new page or open an existing one

### Step 2: Test Stock Photo Picker

#### Option A: From Page Editor
1. Click on any image element or section
2. Look for "Stock Photos" or "Browse Stock Images" button
3. Click to open the PhotoPicker modal

#### Option B: Add New Image
1. Click "Add Element" or "+" button
2. Select "Image" element
3. Choose "Stock Photos" option

### Step 3: Verify Functionality

#### ✅ Expected Behavior:
- **Modal Opens:** PhotoPicker component displays
- **Tabs Visible:** "Curated" and "Categories" tabs
- **Search Bar:** Search input is functional
- **Photos Load:** Curated photos appear automatically
- **Categories Display:** Category grid shows with icons
- **Search Works:** Typing and searching returns results
- **Photo Selection:** Clicking a photo highlights it
- **Attribution:** Photographer name appears on hover
- **Insert Works:** "Use This Photo" button inserts the image

#### ❌ If Issues Occur:
1. **No photos appear:**
   - Check browser console for errors
   - Verify you're logged in
   - Check network tab for API calls

2. **"Stock Photos Unavailable" message:**
   - Backend may not be running
   - API keys may not be loaded
   - Check backend logs: `pm2 logs digitpenhub-suite-api`

3. **Search returns no results:**
   - Try different search terms
   - Check if API rate limit is reached
   - Verify network connectivity

---

## 🔧 Automated Testing (Optional)

### Prerequisites
```bash
cd backend
npm install axios
```

### Update Test Credentials
Edit `backend/test-pexels-integration.js`:
```javascript
const TEST_USER = {
  email: 'your-email@example.com',  // Update this
  password: 'your-password'          // Update this
};
```

### Run Tests
```bash
cd backend
node test-pexels-integration.js
```

### Expected Output
```
🧪 Pexels Integration Test Suite
==================================================
🔐 Logging in...
✅ Login successful

==================================================
TEST 1: Status Check (Public)
==================================================
📡 Testing: Pexels Status
   URL: /pexels/status
✅ Success

[... more tests ...]

==================================================
📊 TEST SUMMARY
==================================================
✅ Passed: 7
❌ Failed: 0
📈 Success Rate: 100.0%

🎉 All tests passed! Pexels integration is working correctly.
```

---

## 📋 Available Endpoints

### Public Endpoints
- `GET /api/v1/pexels/status` - Check configuration status

### Protected Endpoints (Require Authentication)
- `GET /api/v1/pexels/search?query=<term>` - Search photos
- `GET /api/v1/pexels/curated` - Get curated photos
- `GET /api/v1/pexels/popular` - Get popular photos
- `GET /api/v1/pexels/categories` - List categories
- `GET /api/v1/pexels/category/:category` - Get category photos
- `GET /api/v1/pexels/photo/:id` - Get specific photo
- `GET /api/v1/pexels/collections` - Get collections
- `GET /api/v1/pexels/stats` - Usage statistics (Admin only)

### Query Parameters
- `page` - Page number (default: 1)
- `perPage` - Results per page (default: 20, max: 80)
- `orientation` - Photo orientation (landscape, portrait, square)
- `size` - Minimum size (large, medium, small)
- `color` - Desired color

---

## 🐛 Troubleshooting

### Backend Not Loading Keys
```bash
# Check if keys are in .env
tail -n 10 /home/suite.digitpenhub.com/digitpenhub-suite/backend/.env

# Restart backend with updated environment
cd /home/suite.digitpenhub.com/digitpenhub-suite/backend
pm2 restart digitpenhub-suite-api --update-env

# Verify status
curl http://127.0.0.1:5000/api/v1/pexels/status
```

### Rate Limiting
The system uses 7 API keys with automatic rotation to handle rate limits. If you encounter rate limit errors:
1. Wait a few minutes
2. The system will automatically rotate to the next key
3. Check usage stats (admin only): `GET /api/v1/pexels/stats`

### Frontend Not Showing Photos
1. **Check browser console** for JavaScript errors
2. **Verify authentication** - You must be logged in
3. **Check network tab** - Look for failed API calls
4. **Clear cache** and reload the page

### Backend Logs
```bash
# View real-time logs
pm2 logs digitpenhub-suite-api

# View last 100 lines
pm2 logs digitpenhub-suite-api --lines 100 --nostream

# Search for Pexels-related logs
pm2 logs digitpenhub-suite-api --lines 500 --nostream | grep -i pexel
```

---

## 📊 Performance Metrics

### API Key Rotation
- **Keys Available:** 7
- **Rotation Strategy:** Round-robin
- **Rate Limit per Key:** 200 requests/hour (Pexels free tier)
- **Total Capacity:** ~1,400 requests/hour

### Caching
- **Cache Duration:** 6 hours
- **Cache Key Format:** `${query}|${perPage}|${orientation}`
- **Benefits:** Reduced API calls, faster response times

### Circuit Breaker
- **Enabled:** Yes
- **Failure Threshold:** 5 consecutive failures
- **Reset Timeout:** 60 seconds
- **Fallback:** Returns cached data or empty results

---

## ✨ Features

### Search Capabilities
- ✅ Text search with any keywords
- ✅ Orientation filtering (landscape, portrait, square)
- ✅ Size filtering (large, medium, small)
- ✅ Color filtering
- ✅ Pagination support

### Photo Collections
- ✅ Curated photos (editor's picks)
- ✅ Popular photos (trending)
- ✅ Category-based browsing
- ✅ Featured collections

### User Experience
- ✅ Real-time search
- ✅ Infinite scroll / Load more
- ✅ Photo preview on hover
- ✅ Photographer attribution
- ✅ High-quality images
- ✅ Responsive design

---

## 🎯 Success Criteria

- [x] API keys configured in .env
- [x] Backend restarted with updated environment
- [x] Status endpoint returns "configured": true
- [x] PhotoPicker component exists in frontend
- [x] All endpoints properly authenticated
- [x] Rate limiting with key rotation
- [x] Caching implemented
- [x] Circuit breaker for resilience
- [ ] **Manual browser testing** (You need to do this)
- [ ] **Verify photos load in builder** (You need to do this)
- [ ] **Test search functionality** (You need to do this)
- [ ] **Test photo insertion** (You need to do this)

---

## 📝 Next Steps

1. **Test in Browser:**
   - Go to https://suite.digitpenhub.com/builder
   - Open PhotoPicker and verify photos load
   - Test search and category browsing
   - Insert a photo and verify it works

2. **Monitor Usage:**
   - Check backend logs for any errors
   - Monitor API rate limits
   - Review usage statistics (admin panel)

3. **Optional Enhancements:**
   - Add more categories
   - Implement favorites/bookmarks
   - Add photo editing capabilities
   - Create photo library for saved images

---

## 📞 Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review backend logs: `pm2 logs digitpenhub-suite-api`
3. Verify API keys are valid at https://www.pexels.com/api/
4. Check Pexels API status: https://www.pexels.com/api/status/

---

**Last Updated:** 2026-07-14  
**Status:** ✅ Ready for Testing
