# 🚀 START HERE - Deploy Digitpen Hub in 3 Steps

**Quick deployment guide - Get up and running in 10 minutes**

---

## Prerequisites Check

```bash
# Verify you have everything installed
node --version    # Should be 18+
npm --version     # Should be 9+
psql --version    # Should be 12+
```

---

## Step 1: Database Setup (2 minutes)

Run **ONE** of these commands based on your PostgreSQL setup:

### Option A: If you can run `sudo -u postgres`
```bash
sudo -u postgres psql -f /home/suite.digitpenhub.com/digitpenhub-suite/setup-database.sql
```

### Option B: If you have postgres password
```bash
psql -U postgres -f /home/suite.digitpenhub.com/digitpenhub-suite/setup-database.sql
# Enter your postgres password when prompted
```

### Option C: Manual setup (copy-paste into psql)
```bash
sudo -u postgres psql
```
Then paste:
```sql
DROP DATABASE IF EXISTS digitpenhub;
CREATE DATABASE digitpenhub;
CREATE USER digitpenhub WITH PASSWORD 'digitpenhub';
GRANT ALL PRIVILEGES ON DATABASE digitpenhub TO digitpenhub;
\c digitpenhub
GRANT ALL ON SCHEMA public TO digitpenhub;
\q
```

### Verify Database Works
```bash
PGPASSWORD=digitpenhub psql -U digitpenhub -d digitpenhub -c "SELECT 'Ready!' AS status;"
```
**Expected:** `Ready!`

---

## Step 2: Start Backend (3 minutes)

Open **Terminal 1** and run:

```bash
cd /home/suite.digitpenhub.com/digitpenhub-suite/backend

# Run migrations
npm run migrate

# Start server
npm start
```

**Wait for:** `Server running on port 5000`

### Test Backend (in a new terminal)
```bash
curl http://localhost:5000/api/health
# Expected: {"status":"ok",...}

curl http://localhost:5000/api/cache/stats
# Expected: {"hits":0,"misses":0,...}
```

---

## Step 3: Start Frontend (3 minutes)

Open **Terminal 2** and run:

```bash
cd /home/suite.digitpenhub.com/digitpenhub-suite/frontend

# Build
npm run build

# Start
npm run start
```

**Wait for:** `ready started server on 0.0.0.0:4000`

---

## 🎉 You're Done! Test It

### Open in Browser
```bash
# Linux
xdg-open http://localhost:4000

# macOS
open http://localhost:4000

# Or manually open: http://localhost:4000
```

### Quick Test
1. **Register** a new account
2. **Login** with your credentials
3. **Navigate** to CRM → Contacts
4. **Create** a test contact
5. **Refresh** the page (data loads from cache!)

### Monitor Cache Performance
```bash
# Watch cache stats update in real-time
watch -n 2 'curl -s http://localhost:5000/api/cache/stats'
```

You should see:
- `hits` increasing
- `hitRate` improving
- Response times getting faster

---

## 🛑 Stop Services

```bash
# Terminal 1 (Backend): Ctrl+C
# Terminal 2 (Frontend): Ctrl+C
```

---

## 📚 More Information

- **Full Guide:** `MANUAL_DEPLOYMENT_STEPS.md`
- **Production:** `DEPLOYMENT_CHECKLIST.md`
- **Technical:** `CACHING_IMPLEMENTATION.md`
- **Summary:** `PHASE_1_WEEK2_COMPLETE_SUMMARY.md`

---

## ⚡ Quick Commands Reference

```bash
# Check if services are running
curl http://localhost:5000/api/health
curl http://localhost:4000

# View cache statistics
curl http://localhost:5000/api/cache/stats

# Test with authentication
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/crm/contacts

# Kill services by port
lsof -ti:5000 | xargs kill -9  # Backend
lsof -ti:4000 | xargs kill -9  # Frontend
```

---

**That's it! You're ready to use Digitpen Hub with caching enabled! 🚀**
