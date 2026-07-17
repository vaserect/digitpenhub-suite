# Deployment and Testing Guide - Digitpen Hub Suite

## Complete E2E Deployment and Verification

---

## 🚀 Pre-Deployment Checklist

### Backend Requirements
- [x] Node.js v18+ installed
- [x] PostgreSQL database running
- [x] Environment variables configured
- [x] All dependencies installed

### Frontend Requirements
- [x] Node.js v18+ installed
- [x] Next.js 14+ configured
- [x] Environment variables configured
- [x] All dependencies installed

---

## 📦 Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

**Expected Output:**
```
added XXX packages in XXs
```

### Frontend
```bash
cd frontend
npm install
```

**Expected Output:**
```
added XXX packages in XXs
```

---

## 🗄️ Step 2: Database Setup

### Run Migrations (if not already done)
```bash
cd backend
npm run migrate
```

**Verify Tables Exist:**
```sql
-- Connect to your database
psql $DATABASE_URL

-- Check marketplace tables
\dt marketplace_*

-- Expected tables:
-- marketplace_components
-- marketplace_reviews
-- marketplace_purchases
-- marketplace_downloads
-- marketplace_favorites
-- marketplace_collections
-- marketplace_collection_items
-- marketplace_reports
```

---

## 🔧 Step 3: Environment Configuration

### Backend (.env)
```bash
cd backend
cat .env.example

# Ensure these are set:
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=3000

# Payment gateways (Flutterwave is PRIMARY)
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST...

# Optional: Other gateways
# PAYSTACK_PUBLIC_KEY=pk_test_...
# PAYSTACK_SECRET_KEY=sk_test_...
# STRIPE_PUBLIC_KEY=pk_test_...
# STRIPE_SECRET_KEY=sk_test_...
# PAYPAL_CLIENT_ID=...
# PAYPAL_CLIENT_SECRET=...
```

### Frontend (.env.local)
```bash
cd frontend
cat .env.example

# Ensure these are set:
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...

# Optional: Other gateways
# NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
# NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
```

---

## 🏗️ Step 4: Build Applications

### Backend (No build needed - Node.js)
```bash
cd backend
# Backend runs directly with Node.js
node src/server.js
```

### Frontend (Next.js Build)
```bash
cd frontend
npm run build
```

**Expected Output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (XXX/XXX)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    XXX kB        XXX kB
├ ○ /marketplace                         XXX kB        XXX kB
├ ○ /marketplace/analytics               XXX kB        XXX kB
├ ○ /marketplace/[id]                    XXX kB        XXX kB
└ ...
```

---

## 🚀 Step 5: Start Services

### Option A: Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# or for development with auto-reload:
# npm run dev (if configured)
```

**Expected Output:**
```
Server running on port 3000
Database connected successfully
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:4000
- Network:      http://192.168.x.x:4000

✓ Ready in XXXms
```

### Option B: Production Mode

**Backend (with PM2):**
```bash
cd backend
pm2 start ecosystem.config.js
pm2 logs digitpenhub-api
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

---

## ✅ Step 6: Verification Tests

### 1. Backend Health Check
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-07-14T11:49:00.000Z"
}
```

### 2. Backend API Endpoints Test

**Test Analytics Overview:**
```bash
# First, get a token (login)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Use the token
TOKEN="your-jwt-token-here"

# Test analytics overview
curl http://localhost:3000/api/v1/analytics/marketplace/overview?time_range=30 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "overview": {
    "total_sales": 0,
    "total_revenue": "0.00",
    "unique_customers": 0,
    "average_order_value": "0.00",
    "total_components": 0,
    "total_downloads": 0,
    "sales_growth": 0,
    "revenue_growth": 0
  }
}
```

### 3. Frontend Accessibility Test

**Open in Browser:**
```
http://localhost:4000
```

**Navigate to:**
- Homepage: `http://localhost:4000`
- Marketplace: `http://localhost:4000/marketplace`
- Analytics: `http://localhost:4000/marketplace/analytics`
- Component Detail: `http://localhost:4000/marketplace/[id]`

---

## 🧪 Step 7: End-to-End Testing

### Test Suite 1: Reviews & Ratings System

#### 7.1 Navigate to Component Detail Page
1. Go to `http://localhost:4000/marketplace`
2. Click on any component
3. Verify component details load

#### 7.2 Submit a Review
1. Scroll to "Reviews & Ratings" section
2. Click "Write a Review" button
3. Select star rating (1-5)
4. Enter title (optional)
5. Enter review text
6. Click "Submit Review"
7. **Verify**: Success message appears
8. **Verify**: Review appears in list

#### 7.3 Test Review Filtering
1. Click on rating distribution bars
2. **Verify**: Reviews filter by selected rating
3. Toggle "Verified purchases only"
4. **Verify**: Only verified reviews show
5. Change sort order (Recent, Helpful, Rating)
6. **Verify**: Reviews reorder correctly

#### 7.4 Test Review Actions
1. Click "Helpful" on a review
2. **Verify**: Count increments
3. Click "Report" on a review
4. Select reason and submit
5. **Verify**: Success message

#### 7.5 Edit/Delete Own Review
1. Find your own review
2. Click edit icon
3. Modify rating or text
4. Click "Update Review"
5. **Verify**: Changes saved
6. Click delete icon
7. Confirm deletion
8. **Verify**: Review removed

### Test Suite 2: Analytics Dashboard

#### 7.6 Navigate to Analytics
1. Go to `http://localhost:4000/marketplace/analytics`
2. **Verify**: Page loads without errors

#### 7.7 Test Time Range Selector
1. Select "Last 7 days"
2. **Verify**: Data updates
3. Select "Last 30 days"
4. **Verify**: Data updates
5. Select "Last 90 days"
6. **Verify**: Data updates
7. Select "All time"
8. **Verify**: Data updates

#### 7.8 Verify Dashboard Components
1. **Overview Cards**: Check 4 stat cards display
2. **Revenue Chart**: Verify line chart renders
3. **Top Components**: Check list displays
4. **Category Chart**: Verify pie chart renders
5. **Earnings Breakdown**: Check 3 cards display
6. **Payment Methods**: Verify bar chart renders
7. **Top Customers**: Check table displays

#### 7.9 Test Chart Interactions
1. Hover over line chart points
2. **Verify**: Tooltips appear
3. Hover over bar chart bars
4. **Verify**: Values display
5. Hover over pie chart segments
6. **Verify**: Tooltips show

### Test Suite 3: Payment Integration

#### 7.10 Test Flutterwave Payment
1. Navigate to a paid component
2. Click "Purchase" button
3. **Verify**: Redirects to Flutterwave checkout
4. Use test card: `4187427415564246`
5. CVV: `828`, Expiry: `09/32`, PIN: `3310`
6. Complete payment
7. **Verify**: Redirects back with success
8. **Verify**: Component marked as purchased

#### 7.11 Test Payment Callback
1. After successful payment
2. **Verify**: Purchase recorded in database
3. **Verify**: Component available in "My Purchases"
4. **Verify**: Download/access enabled

### Test Suite 4: Search & Filtering

#### 7.12 Test Advanced Search
1. Go to marketplace page
2. Enter search term
3. **Verify**: Results filter
4. Select category filter
5. **Verify**: Results update
6. Adjust price range
7. **Verify**: Results filter
8. Select rating filter
9. **Verify**: Results update

#### 7.13 Test Sorting
1. Change sort to "Most Popular"
2. **Verify**: Order changes
3. Change to "Highest Rated"
4. **Verify**: Order changes
5. Change to "Newest"
6. **Verify**: Order changes

---

## 🔍 Step 8: Database Verification

### Check Data Integrity

```sql
-- Connect to database
psql $DATABASE_URL

-- Check reviews
SELECT COUNT(*) FROM marketplace_reviews;
SELECT * FROM marketplace_reviews ORDER BY created_at DESC LIMIT 5;

-- Check purchases
SELECT COUNT(*) FROM marketplace_purchases;
SELECT * FROM marketplace_purchases ORDER BY created_at DESC LIMIT 5;

-- Check components with ratings
SELECT 
  id, 
  name, 
  rating_average, 
  rating_count,
  downloads,
  purchases
FROM marketplace_components
ORDER BY rating_average DESC
LIMIT 10;

-- Check analytics data
SELECT 
  DATE(created_at) as date,
  COUNT(*) as sales,
  SUM(price_paid) as revenue
FROM marketplace_purchases
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 7;
```

---

## 📊 Step 9: Performance Testing

### Backend Performance
```bash
# Install Apache Bench (if not installed)
# sudo apt-get install apache-bench

# Test analytics endpoint
ab -n 100 -c 10 \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/analytics/marketplace/overview?time_range=30
```

**Expected Results:**
- Requests per second: > 50
- Time per request: < 200ms
- Failed requests: 0

### Frontend Performance
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit on analytics page
4. **Target Scores**:
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 80

---

## 🐛 Step 10: Error Handling Tests

### Test Error Scenarios

#### 10.1 Invalid Token
```bash
curl http://localhost:3000/api/v1/analytics/marketplace/overview \
  -H "Authorization: Bearer invalid-token"
```

**Expected**: 401 Unauthorized

#### 10.2 Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/v1/marketplace/components/1/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'
```

**Expected**: 400 Bad Request with error message

#### 10.3 Non-existent Resource
```bash
curl http://localhost:3000/api/v1/marketplace/components/99999 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: 404 Not Found

---

## 📝 Step 11: Logging Verification

### Check Backend Logs
```bash
cd backend
tail -f logs/app.log
# or if using PM2:
pm2 logs digitpenhub-api
```

**Look for:**
- No error messages
- Successful API requests
- Database query times
- Payment webhook logs

### Check Frontend Logs
```bash
cd frontend
# Check browser console for errors
# Check Next.js terminal output
```

---

## 🔒 Step 12: Security Verification

### Security Checklist
- [ ] JWT tokens expire correctly
- [ ] CORS configured properly
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (input sanitization)
- [ ] CSRF protection enabled
- [ ] Rate limiting active
- [ ] Sensitive data not exposed in logs
- [ ] Environment variables not committed

### Test Security
```bash
# Test rate limiting
for i in {1..100}; do
  curl http://localhost:3000/api/v1/marketplace/components
done
```

**Expected**: Rate limit error after threshold

---

## 📱 Step 13: Mobile Responsiveness

### Test on Different Devices
1. Open Chrome DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on:
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - Desktop (1920x1080)

**Verify:**
- [ ] Analytics dashboard responsive
- [ ] Charts render correctly
- [ ] Tables scroll horizontally
- [ ] Buttons accessible
- [ ] Text readable

---

## 🚀 Step 14: Production Deployment

### Backend Deployment (Example: Ubuntu Server)

```bash
# 1. Clone repository
git clone <repo-url>
cd digitpenhub-suite/backend

# 2. Install dependencies
npm install --production

# 3. Set environment variables
cp .env.example .env
nano .env  # Edit with production values

# 4. Run migrations
npm run migrate

# 5. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Frontend Deployment (Example: Vercel)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
cd frontend
vercel --prod

# Or connect GitHub repo to Vercel dashboard
```

### Alternative: Docker Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

---

## ✅ Final Verification Checklist

### Backend
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] All API endpoints respond
- [ ] Authentication works
- [ ] Analytics data accurate
- [ ] Payment webhooks working
- [ ] Logs clean (no errors)

### Frontend
- [ ] Build completes successfully
- [ ] All pages load
- [ ] No console errors
- [ ] Charts render correctly
- [ ] Forms submit successfully
- [ ] Navigation works
- [ ] Mobile responsive

### Features
- [ ] Reviews system functional
- [ ] Analytics dashboard working
- [ ] Payment integration active
- [ ] Search and filters working
- [ ] User authentication working
- [ ] Data persistence verified

### Performance
- [ ] Page load < 3 seconds
- [ ] API response < 500ms
- [ ] No memory leaks
- [ ] Database queries optimized

### Security
- [ ] Authentication enforced
- [ ] Authorization working
- [ ] Input validation active
- [ ] HTTPS enabled (production)
- [ ] Secrets not exposed

---

## 🆘 Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check port availability
lsof -i :3000

# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check logs
tail -f logs/app.log
```

#### Frontend build fails
```bash
# Clear cache
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

#### Database connection error
```bash
# Verify DATABASE_URL format
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT version()"
```

#### Charts not rendering
- Check browser console for errors
- Verify data format matches component props
- Check network tab for API responses

---

## 📞 Support

### Documentation
- Backend API: `/backend/src/routes/`
- Frontend Components: `/frontend/components/`
- Database Schema: `/backend/db/`

### Logs Location
- Backend: `/backend/logs/`
- Frontend: Browser console
- Database: PostgreSQL logs

---

## 🎉 Success Criteria

All systems are GO when:
✅ Backend running without errors
✅ Frontend accessible in browser
✅ Database queries executing
✅ Reviews system working
✅ Analytics dashboard displaying data
✅ Payment integration functional
✅ All tests passing
✅ No console errors
✅ Performance metrics met
✅ Security checks passed

**Status: Ready for Production! 🚀**

---

**Last Updated**: July 14, 2026
**Version**: 1.0.0
