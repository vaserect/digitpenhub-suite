# Deployment Checklist - Phase 1 Week 2 with Caching

**Date:** July 14, 2026  
**Version:** Phase 1 Week 2 Complete  
**Status:** Ready for Deployment

---

## 🔍 Pre-Deployment Verification

### 1. Test Suite Status
```bash
cd /home/suite.digitpenhub.com/digitpenhub-suite/backend
npm test
```
**Expected:** 336/336 tests passing ✅

### 2. Code Quality Check
```bash
# Check for linting errors
npm run lint

# Check for security vulnerabilities
npm audit
```

### 3. Environment Variables Check

**Backend Required:**
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Strong secret key (change default!)
- [ ] `PORT` - Backend port (default: 5000)
- [ ] `NODE_ENV` - Set to 'production'
- [ ] `REDIS_HOST` - Redis server host (optional, falls back to memory)
- [ ] `REDIS_PORT` - Redis server port (default: 6379)
- [ ] `REDIS_PASSWORD` - Redis password (if required)
- [ ] `CACHE_TYPE` - 'redis' or 'memory' (default: memory)
- [ ] `CACHE_ENABLED` - true/false (default: true)
- [ ] `PEXELS_API_KEY` - For image search feature

**Frontend Required:**
- [ ] `NEXT_PUBLIC_API_URL` - Backend API URL

---

## 🚀 Deployment Steps

### Option A: Quick Local Deployment (Development/Testing)

#### Step 1: Backend Setup
```bash
cd /home/suite.digitpenhub.com/digitpenhub-suite/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env

# Run database migrations
npm run migrate

# Start backend
npm start
```

**Backend will be available at:** `http://localhost:5000`

#### Step 2: Frontend Setup
```bash
cd /home/suite.digitpenhub.com/digitpenhub-suite/frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit environment variables
nano .env.local

# Build for production
npm run build

# Start frontend
npm run start
```

**Frontend will be available at:** `http://localhost:4000`

---

### Option B: Production Deployment with PM2

#### Step 1: Install PM2 Globally
```bash
npm install -g pm2
```

#### Step 2: Deploy Backend
```bash
cd /home/suite.digitpenhub.com/digitpenhub-suite/backend

# Install production dependencies
npm install --production

# Set up environment
cp .env.example .env
nano .env  # Configure production values

# Run migrations
npm run migrate

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system boot
pm2 startup
```

#### Step 3: Deploy Frontend
```bash
cd /home/suite.digitpenhub.com/digitpenhub-suite/frontend

# Install production dependencies
npm install --production

# Set up environment
cp .env.example .env.local
nano .env.local  # Configure production values

# Build
npm run build

# Start with PM2
pm2 start npm --name "digitpenhub-frontend" -- start

# Save configuration
pm2 save
```

#### Step 4: Verify PM2 Status
```bash
pm2 status
pm2 logs digitpenhub-backend
pm2 logs digitpenhub-frontend
```

---

### Option C: Docker Deployment

#### Step 1: Create Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

#### Step 2: Create Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
```

#### Step 3: Create docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: digitpenhub
      POSTGRES_USER: digitpenhub
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U digitpenhub"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://digitpenhub:${DB_PASSWORD}@postgres:5432/digitpenhub
      JWT_SECRET: ${JWT_SECRET}
      PEXELS_API_KEY: ${PEXELS_API_KEY}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      CACHE_TYPE: redis
      CACHE_ENABLED: true
      PORT: 5000
      NODE_ENV: production
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:5000
    ports:
      - "4000:4000"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### Step 4: Deploy with Docker
```bash
# Create .env file with secrets
cat > .env << EOF
DB_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password
JWT_SECRET=your_jwt_secret
PEXELS_API_KEY=your_pexels_key
EOF

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## 🔧 Redis Setup (Recommended for Production)

### Install Redis (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Set password (uncomment and set)
requirepass your_strong_password

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli
AUTH your_strong_password
PING
```

### Install Redis (macOS)
```bash
brew install redis

# Start Redis
brew services start redis

# Test connection
redis-cli ping
```

### Configure Backend for Redis
```bash
# In backend/.env
CACHE_TYPE=redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_strong_password
CACHE_ENABLED=true
```

---

## ✅ Post-Deployment Verification

### 1. Health Check
```bash
# Backend health
curl http://localhost:5000/api/health

# Expected response:
# {"status":"ok","timestamp":"2026-07-14T19:00:00.000Z"}
```

### 2. Cache Status Check
```bash
# Check cache statistics
curl http://localhost:5000/api/cache/stats

# Expected response:
# {"hits":0,"misses":0,"hitRate":"0.00%","type":"redis","enabled":true}
```

### 3. Test Cached Endpoints
```bash
# Test contact endpoint (should cache)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/crm/contacts

# Call again (should hit cache)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/crm/contacts

# Check cache stats again (should show hits)
curl http://localhost:5000/api/cache/stats
```

### 4. Frontend Access
```bash
# Open in browser
open http://localhost:4000

# Or test with curl
curl http://localhost:4000
```

### 5. Database Connection
```bash
# Connect to PostgreSQL
psql -U digitpenhub -d digitpenhub

# Check tables
\dt

# Check data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM contacts;
SELECT COUNT(*) FROM projects;
```

---

## 📊 Monitoring Setup

### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs

# View specific service logs
pm2 logs digitpenhub-backend
pm2 logs digitpenhub-frontend

# Check memory usage
pm2 list
```

### Redis Monitoring
```bash
# Connect to Redis CLI
redis-cli -a your_password

# Monitor commands in real-time
MONITOR

# Check memory usage
INFO memory

# Check cache keys
KEYS contact:*
KEYS project:*

# Get cache statistics
INFO stats
```

### Database Monitoring
```bash
# Check active connections
psql -U digitpenhub -d digitpenhub -c "SELECT count(*) FROM pg_stat_activity;"

# Check database size
psql -U digitpenhub -d digitpenhub -c "SELECT pg_size_pretty(pg_database_size('digitpenhub'));"

# Check table sizes
psql -U digitpenhub -d digitpenhub -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
"
```

---

## 🔒 Security Checklist

- [ ] Changed default JWT_SECRET
- [ ] Set strong database password
- [ ] Set Redis password (if using Redis)
- [ ] Configured firewall rules
- [ ] Enabled HTTPS (use nginx/caddy as reverse proxy)
- [ ] Set secure cookie flags
- [ ] Configured CORS properly
- [ ] Enabled rate limiting
- [ ] Removed debug/development endpoints
- [ ] Set up regular backups

---

## 🚨 Troubleshooting

### Issue: Backend won't start
```bash
# Check logs
pm2 logs digitpenhub-backend

# Common causes:
# 1. Database connection failed - check DATABASE_URL
# 2. Port already in use - check PORT setting
# 3. Missing environment variables - check .env file
```

### Issue: Cache not working
```bash
# Check Redis connection
redis-cli -a your_password ping

# Check backend logs for cache errors
pm2 logs digitpenhub-backend | grep -i cache

# Verify cache configuration
curl http://localhost:5000/api/cache/stats
```

### Issue: Frontend can't connect to backend
```bash
# Check NEXT_PUBLIC_API_URL in frontend/.env.local
# Should match backend URL

# Check CORS configuration in backend
# Ensure frontend URL is allowed
```

### Issue: High memory usage
```bash
# Check PM2 memory usage
pm2 list

# Restart services if needed
pm2 restart digitpenhub-backend
pm2 restart digitpenhub-frontend

# Check Redis memory
redis-cli -a your_password INFO memory

# Clear cache if needed
redis-cli -a your_password FLUSHALL
```

---

## 📈 Performance Optimization

### 1. Enable Gzip Compression
```javascript
// In backend/src/app.js
const compression = require('compression');
app.use(compression());
```

### 2. Configure Connection Pooling
```javascript
// In backend/src/config/database.js
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 3. Optimize Redis
```bash
# In /etc/redis/redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### 4. Set Up CDN (Optional)
- Use Cloudflare or similar for static assets
- Configure caching headers
- Enable HTTP/2

---

## 🔄 Update/Rollback Procedures

### Update Deployment
```bash
# Pull latest code
git pull origin main

# Backend update
cd backend
npm install
npm run migrate
pm2 restart digitpenhub-backend

# Frontend update
cd ../frontend
npm install
npm run build
pm2 restart digitpenhub-frontend
```

### Rollback Procedure
```bash
# Revert to previous commit
git revert HEAD
git push

# Or checkout specific version
git checkout <previous-commit-hash>

# Rebuild and restart
npm install
npm run build
pm2 restart all
```

---

## 📞 Support Contacts

**Technical Issues:**
- Check logs: `pm2 logs`
- Review documentation: `BUILD_AND_DEPLOY.md`
- Check test results: `npm test`

**Performance Issues:**
- Monitor cache stats: `/api/cache/stats`
- Check Redis: `redis-cli INFO`
- Review database queries

---

## ✅ Deployment Complete Checklist

- [ ] All tests passing (336/336)
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Redis configured (if using)
- [ ] Backend started successfully
- [ ] Frontend built and started
- [ ] Health checks passing
- [ ] Cache working correctly
- [ ] Monitoring set up
- [ ] Security measures in place
- [ ] Backups configured
- [ ] Documentation reviewed

---

**Deployment Status:** Ready to Deploy! 🚀

**Next Steps:**
1. Choose deployment option (Local/PM2/Docker)
2. Follow step-by-step instructions
3. Run post-deployment verification
4. Set up monitoring
5. Perform manual testing

**Estimated Deployment Time:**
- Local: 15-30 minutes
- PM2: 30-45 minutes
- Docker: 45-60 minutes
