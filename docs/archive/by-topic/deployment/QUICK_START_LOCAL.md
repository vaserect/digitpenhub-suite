# Quick Start - Local Development Deployment

**Estimated Time:** 15-30 minutes  
**Requirements:** Node.js 18+, PostgreSQL  
**Caching:** In-memory (no Redis needed)

---

## 🚀 Step-by-Step Deployment

### Step 1: Verify Prerequisites (2 min)

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm
npm --version

# Check PostgreSQL is running
psql --version
```

---

### Step 2: Setup Backend (10 min)

```bash
# Navigate to backend
cd /home/suite.digitpenhub.com/digitpenhub-suite/backend

# Install dependencies
npm install

# Create environment file
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://digitpenhub:digitpenhub@localhost:5432/digitpenhub
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digitpenhub
DB_USER=digitpenhub
DB_PASSWORD=digitpenhub

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (change this in production!)
JWT_SECRET=dev-secret-key-change-in-production

# Cache Configuration (in-memory for local dev)
CACHE_TYPE=memory
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300

# Pexels API (optional - for image search)
PEXELS_API_KEY=your-pexels-api-key-here

# Frontend URL
FRONTEND_URL=http://localhost:4000
EOF

# Create PostgreSQL database and user
psql -U postgres << 'EOSQL'
CREATE DATABASE digitpenhub;
CREATE USER digitpenhub WITH PASSWORD 'digitpenhub';
GRANT ALL PRIVILEGES ON DATABASE digitpenhub TO digitpenhub;
\c digitpenhub
GRANT ALL ON SCHEMA public TO digitpenhub;
EOSQL

# Run database migrations
npm run migrate

# Verify tests pass
npm test

# Start backend server
npm start
```

**Backend should now be running at:** `http://localhost:5000`

---

### Step 3: Setup Frontend (5 min)

Open a **new terminal window**:

```bash
# Navigate to frontend
cd /home/suite.digitpenhub.com/digitpenhub-suite/frontend

# Install dependencies
npm install

# Create environment file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000
EOF

# Build for production
npm run build

# Start frontend server
npm run start
```

**Frontend should now be running at:** `http://localhost:4000`

---

## ✅ Verification Steps

### 1. Check Backend Health
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{"status":"ok","timestamp":"2026-07-14T19:00:00.000Z"}
```

### 2. Check Cache Status
```bash
curl http://localhost:5000/api/cache/stats
```

**Expected Response:**
```json
{
  "hits": 0,
  "misses": 0,
  "hitRate": "0.00%",
  "type": "memory",
  "enabled": true
}
```

### 3. Test Frontend
Open browser and navigate to:
- **Homepage:** http://localhost:4000
- **Builder:** http://localhost:4000/builder

### 4. Test Cached Endpoints

First, you need to create a user and get an auth token:

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "organization_name": "Test Org"
  }'

# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

Save the token from the response, then test cached endpoints:

```bash
# Replace YOUR_TOKEN with actual token from login
TOKEN="your_actual_token_here"

# Test contacts endpoint (first call - cache miss)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/crm/contacts

# Test again (should hit cache)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/crm/contacts

# Check cache stats (should show 1 hit, 1 miss)
curl http://localhost:5000/api/cache/stats
```

---

## 🎯 Quick Test Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 4000
- [ ] Health check returns OK
- [ ] Cache stats endpoint working
- [ ] Can register new user
- [ ] Can login and get token
- [ ] Can access protected endpoints
- [ ] Cache is working (hit rate increases on repeated calls)
- [ ] Frontend loads successfully
- [ ] Can navigate to /builder

---

## 🔧 Troubleshooting

### Issue: PostgreSQL connection failed

**Solution 1:** Check if PostgreSQL is running
```bash
sudo systemctl status postgresql
# or
brew services list | grep postgresql
```

**Solution 2:** Create database manually
```bash
psql -U postgres
CREATE DATABASE digitpenhub;
CREATE USER digitpenhub WITH PASSWORD 'digitpenhub';
GRANT ALL PRIVILEGES ON DATABASE digitpenhub TO digitpenhub;
\q
```

**Solution 3:** Update DATABASE_URL in .env if using different credentials

---

### Issue: Port 5000 already in use

**Solution:** Find and kill the process
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or use a different port in backend/.env
PORT=5001
```

---

### Issue: Port 4000 already in use

**Solution:** Find and kill the process
```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or modify package.json to use different port
```

---

### Issue: npm install fails

**Solution:** Clear cache and retry
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

### Issue: Migrations fail

**Solution:** Reset database
```bash
# Drop and recreate database
psql -U postgres << 'EOSQL'
DROP DATABASE IF EXISTS digitpenhub;
CREATE DATABASE digitpenhub;
GRANT ALL PRIVILEGES ON DATABASE digitpenhub TO digitpenhub;
EOSQL

# Run migrations again
npm run migrate
```

---

### Issue: Frontend can't connect to backend

**Solution:** Check NEXT_PUBLIC_API_URL
```bash
# Verify .env.local has correct URL
cat frontend/.env.local

# Should show:
# NEXT_PUBLIC_API_URL=http://localhost:5000

# If not, recreate it
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > frontend/.env.local

# Rebuild frontend
cd frontend
npm run build
npm run start
```

---

## 📊 Monitor Your Deployment

### View Backend Logs
```bash
# Backend logs are in the terminal where you ran npm start
# Press Ctrl+C to stop the server
```

### View Cache Statistics
```bash
# Check cache performance
curl http://localhost:5000/api/cache/stats

# Expected after some usage:
# {
#   "hits": 150,
#   "misses": 50,
#   "hitRate": "75.00%",
#   "type": "memory",
#   "enabled": true
# }
```

### Check Database
```bash
# Connect to database
psql -U digitpenhub -d digitpenhub

# Check tables
\dt

# Check user count
SELECT COUNT(*) FROM users;

# Check contacts
SELECT COUNT(*) FROM contacts;

# Exit
\q
```

---

## 🎉 Success!

Your Digitpen Hub is now running locally with:
- ✅ Backend API on http://localhost:5000
- ✅ Frontend on http://localhost:4000
- ✅ In-memory caching enabled
- ✅ All 336 tests passing
- ✅ Ready for development and testing

---

## 🔄 Stopping the Services

```bash
# Stop backend (in backend terminal)
Ctrl + C

# Stop frontend (in frontend terminal)
Ctrl + C
```

---

## 🚀 Next Steps

1. **Manual Testing** (30 min)
   - Create test data through the UI
   - Test all major features
   - Verify caching is working

2. **Performance Testing** (30 min)
   - Use the cache stats endpoint
   - Monitor response times
   - Test with multiple concurrent requests

3. **Production Deployment** (when ready)
   - Follow DEPLOYMENT_CHECKLIST.md
   - Set up Redis for production caching
   - Configure proper security settings

---

## 📞 Need Help?

- **Documentation:** See BUILD_AND_DEPLOY.md for detailed info
- **Deployment:** See DEPLOYMENT_CHECKLIST.md for production
- **Caching:** See CACHING_IMPLEMENTATION.md for technical details
- **Tests:** Run `npm test` to verify everything works

---

**Local Development Setup Complete! 🎉**
