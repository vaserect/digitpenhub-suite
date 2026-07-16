# Manual Deployment Steps - See Everything & Test

**Follow these steps to deploy and test the application with full visibility**

---

## 🎯 Quick Overview

You will:
1. Set up the database (2 min)
2. Run migrations (1 min)
3. Start backend and see it running (2 min)
4. Start frontend and see it running (2 min)
5. Test in browser (5 min)

**Total Time:** ~12 minutes

---

## Step 1: Database Setup (2 min)

### Option A: Using the SQL script (Recommended)
```bash
# Run the setup script
psql -U postgres -f /home/suite.digitpenhub.com/digitpenhub-suite/setup-database.sql
```

### Option B: Manual commands
```bash
# Connect to PostgreSQL
psql -U postgres

# Run these commands:
DROP DATABASE IF EXISTS digitpenhub;
CREATE DATABASE digitpenhub;
CREATE USER digitpenhub WITH PASSWORD 'digitpenhub';
GRANT ALL PRIVILEGES ON DATABASE digitpenhub TO digitpenhub;
\c digitpenhub
GRANT ALL ON SCHEMA public TO digitpenhub;
\q
```

### Verify Database
```bash
# Test connection
PGPASSWORD=digitpenhub psql -U digitpenhub -d digitpenhub -c "SELECT 'Database ready!' AS status;"
```

**Expected output:**
```
     status      
-----------------
 Database ready!
```

---

## Step 2: Run Database Migrations (1 min)

```bash
cd /home/suite.digitpenhub.com/digitpenhub-suite/backend
npm run migrate
```

**Expected output:**
```
Running migrations...
✓ Migration 001_init.sql completed
✓ Migration 002_crm_pm.sql completed
✓ Migration 003_teams.sql completed
... (more migrations)
All migrations completed successfully!
```

---

## Step 3: Start Backend (2 min)

### Terminal 1 - Backend Server

```bash
cd /home/suite.digitpenhub.com/digitpenhub-suite/backend
npm start
```

**Expected output:**
```
> digitpenhub-suite-api@0.1.0 start
> node src/server.js

2026-07-14 19:20:00 [info]: Using in-memory cache
2026-07-14 19:20:00 [info]: Server running on port 5000
2026-07-14 19:20:00 [info]: Environment: development
2026-07-14 19:20:00 [info]: Cache enabled: true
```

### Verify Backend is Running

**Open a new terminal** and run:

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Expected: {"status":"ok","timestamp":"2026-07-14T19:20:00.000Z"}

# Test cache stats
curl http://localhost:5000/api/cache/stats

# Expected: {"hits":0,"misses":0,"hitRate":"0.00%","type":"memory","enabled":true}
```

**✅ Backend is ready when you see:**
- Server running on port 5000
- Health check returns OK
- Cache stats endpoint works

---

## Step 4: Start Frontend (2 min)

### Terminal 2 - Frontend Server

```bash
cd /home/suite.digitpenhub.com/digitpenhub-suite/frontend
npm run build
npm run start
```

**Expected output:**
```
> digitpenhub-suite-frontend@0.1.0 build
> next build

✓ Creating an optimized production build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (15/15)
✓ Finalizing page optimization

> digitpenhub-suite-frontend@0.1.0 start
> next start

- ready started server on 0.0.0.0:4000, url: http://localhost:4000
```

### Verify Frontend is Running

**Open a new terminal** and run:

```bash
# Test frontend
curl -I http://localhost:4000

# Expected: HTTP/1.1 200 OK
```

**✅ Frontend is ready when you see:**
- Server started on port 4000
- HTTP 200 response

---

## Step 5: Test in Browser (5 min)

### 5.1 Open the Application

```bash
# Open in default browser
xdg-open http://localhost:4000 2>/dev/null || open http://localhost:4000 2>/dev/null || echo "Open http://localhost:4000 in your browser"
```

Or manually open: **http://localhost:4000**

### 5.2 Register a New Account

1. Click "Sign Up" or "Register"
2. Fill in:
   - **Name:** Test User
   - **Email:** test@example.com
   - **Password:** Test123!
   - **Organization:** Test Organization
3. Click "Register"

**Expected:** You should be logged in and see the dashboard

### 5.3 Test Cached Endpoints

**Open a new terminal** and test the API:

```bash
# First, login to get a token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# Test contacts endpoint (first call - cache miss)
echo "First call (cache miss):"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/crm/contacts | jq '.'

# Check cache stats
echo -e "\nCache stats after first call:"
curl -s http://localhost:5000/api/cache/stats | jq '.'

# Test again (should hit cache)
echo -e "\nSecond call (cache hit):"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/crm/contacts | jq '.'

# Check cache stats again
echo -e "\nCache stats after second call:"
curl -s http://localhost:5000/api/cache/stats | jq '.'
```

**Expected output:**
```
First call (cache miss):
[]

Cache stats after first call:
{
  "hits": 0,
  "misses": 1,
  "hitRate": "0.00%",
  "type": "memory",
  "enabled": true
}

Second call (cache hit):
[]

Cache stats after second call:
{
  "hits": 1,
  "misses": 1,
  "hitRate": "50.00%",
  "type": "memory",
  "enabled": true
}
```

### 5.4 Test in the UI

1. **Navigate to CRM** → Contacts
2. **Create a new contact:**
   - Name: John Doe
   - Email: john@example.com
   - Phone: +1234567890
3. **Click Save**
4. **Refresh the page** - Contact should load instantly (from cache)
5. **Edit the contact** - Cache should invalidate
6. **Refresh again** - New data should be cached

### 5.5 Test Project Management

1. **Navigate to Projects**
2. **Create a new project:**
   - Name: Test Project
   - Description: Testing caching
3. **Create tasks** in the project
4. **Refresh** - Data loads from cache
5. **Update a task** - Cache invalidates
6. **Check cache stats** - Hit rate should increase

---

## 📊 Monitor Cache Performance

### Real-time Cache Statistics

```bash
# Watch cache stats in real-time
watch -n 2 'curl -s http://localhost:5000/api/cache/stats | jq "."'
```

**You should see:**
- `hits` increasing as you navigate
- `hitRate` improving over time
- Response times getting faster

### Check Backend Logs

```bash
# In Terminal 1 (where backend is running)
# You'll see logs like:
# [info]: ContactService: Cache hit for findById
# [info]: ProjectService: Cache miss for findAll
# [info]: Cache invalidated for contact:org-123
```

---

## 🎯 Success Criteria Checklist

- [ ] Database created and accessible
- [ ] Migrations completed successfully
- [ ] Backend running on port 5000
- [ ] Frontend running on port 4000
- [ ] Health check returns OK
- [ ] Cache stats endpoint working
- [ ] Can register new user
- [ ] Can login and get token
- [ ] Can access protected endpoints
- [ ] Cache hit rate increases on repeated calls
- [ ] UI loads and is responsive
- [ ] Can create/edit/delete data
- [ ] Cache invalidates on updates

---

## 🛑 Stopping the Services

### Stop Backend
```bash
# In Terminal 1 (backend)
Press Ctrl + C
```

### Stop Frontend
```bash
# In Terminal 2 (frontend)
Press Ctrl + C
```

### Or Kill by Port
```bash
# Kill backend
lsof -ti:5000 | xargs kill -9

# Kill frontend
lsof -ti:4000 | xargs kill -9
```

---

## 🔍 Troubleshooting

### Backend won't start
```bash
# Check if port is in use
lsof -i :5000

# Check database connection
PGPASSWORD=digitpenhub psql -U digitpenhub -d digitpenhub -c "SELECT 1;"

# Check logs
cd /home/suite.digitpenhub.com/digitpenhub-suite/backend
npm start
```

### Frontend won't start
```bash
# Check if port is in use
lsof -i :4000

# Rebuild
cd /home/suite.digitpenhub.com/digitpenhub-suite/frontend
rm -rf .next
npm run build
npm run start
```

### Cache not working
```bash
# Check cache configuration
cat /home/suite.digitpenhub.com/digitpenhub-suite/backend/.env | grep CACHE

# Should show:
# CACHE_TYPE=memory
# CACHE_ENABLED=true
```

---

## 📈 Performance Testing

### Test Response Times

```bash
# Without cache (first call)
time curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/crm/contacts > /dev/null

# With cache (second call)
time curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/crm/contacts > /dev/null
```

**Expected:** Second call should be 50-100x faster

### Load Testing (Optional)

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test with 100 requests
ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/crm/contacts
```

---

## ✅ Deployment Complete!

**You should now have:**
- ✅ Backend running with caching enabled
- ✅ Frontend running and connected
- ✅ Database with all tables created
- ✅ Cache working and improving performance
- ✅ Full visibility into all operations

**Next Steps:**
1. Create test data through the UI
2. Monitor cache hit rates
3. Test all major features
4. Review performance improvements

---

## 📞 Need Help?

**Check logs:**
- Backend: Terminal 1 output
- Frontend: Terminal 2 output
- Database: `psql -U digitpenhub -d digitpenhub`

**Documentation:**
- QUICK_START_LOCAL.md - Quick start guide
- DEPLOYMENT_CHECKLIST.md - Production deployment
- CACHING_IMPLEMENTATION.md - Caching details
- BUILD_AND_DEPLOY.md - General deployment

**Test suite:**
```bash
cd /home/suite.digitpenhub.com/digitpenhub-suite/backend
npm test
```

---

**Ready to deploy? Start with Step 1! 🚀**
