# Build and Deploy Guide - Unified Website Builder

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Environment variables configured

---

## 📦 Backend Build & Deploy

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run Database Migrations
```bash
npm run migrate
```

### 3. Seed Database (Optional - if needed)
```bash
npm run seed
```

### 4. Start Backend Server
```bash
# Development
npm start

# Production (with PM2)
pm2 start ecosystem.config.js
```

**Backend will run on:** `http://localhost:5000` (or configured port)

---

## 🎨 Frontend Build & Deploy

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Build for Production
```bash
npm run build
```

### 3. Start Frontend Server
```bash
# Development
npm run dev

# Production
npm run start
```

**Frontend will run on:** `http://localhost:4000`

---

## 🔧 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/digitpenhub
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digitpenhub
DB_USER=your_user
DB_PASSWORD=your_password

# Server
PORT=5000
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Pexels API (for image search)
PEXELS_API_KEY=your-pexels-api-key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:4000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🧪 Testing Before Deploy

### 1. Test Backend
```bash
cd backend
npm test
```

### 2. Test Frontend Build
```bash
cd frontend
npm run build
npm run start
```

### 3. Manual Testing Checklist
- [ ] Navigate to `/builder`
- [ ] Create a new page
- [ ] Add blocks from sidebar
- [ ] Edit block properties
- [ ] Test responsive preview (desktop/tablet/mobile)
- [ ] Test undo/redo
- [ ] Save page
- [ ] Publish page
- [ ] Test legacy redirects:
  - [ ] `/website-builder` → `/builder?type=page`
  - [ ] `/funnel-builder` → `/builder?type=funnel`

---

## 🌐 Production Deployment

### Option 1: Traditional Server (VPS/Dedicated)

#### Backend
```bash
# 1. Clone repository
git clone <your-repo-url>
cd digitpenhub-suite/backend

# 2. Install dependencies
npm install --production

# 3. Set environment variables
cp .env.example .env
nano .env  # Edit with production values

# 4. Run migrations
npm run migrate

# 5. Start with PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Frontend
```bash
cd ../frontend

# 1. Install dependencies
npm install --production

# 2. Set environment variables
cp .env.example .env.local
nano .env.local  # Edit with production values

# 3. Build
npm run build

# 4. Start with PM2
pm2 start npm --name "digitpenhub-frontend" -- start
pm2 save
```

### Option 2: Docker Deployment

#### Create docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: digitpenhub
      POSTGRES_USER: digitpenhub
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://digitpenhub:${DB_PASSWORD}@postgres:5432/digitpenhub
      JWT_SECRET: ${JWT_SECRET}
      PEXELS_API_KEY: ${PEXELS_API_KEY}
      PORT: 5000
    ports:
      - "5000:5000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:5000
    ports:
      - "4000:4000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### Deploy with Docker
```bash
docker-compose up -d
```

### Option 3: Vercel (Frontend) + Railway/Render (Backend)

#### Frontend on Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

#### Backend on Railway
1. Go to railway.app
2. Create new project
3. Connect GitHub repository
4. Set environment variables
5. Deploy

---

## 🔄 Update/Redeploy Process

### Backend Updates
```bash
cd backend
git pull
npm install
npm run migrate  # If new migrations
pm2 restart digitpenhub-backend
```

### Frontend Updates
```bash
cd frontend
git pull
npm install
npm run build
pm2 restart digitpenhub-frontend
```

---

## 🐛 Troubleshooting

### Issue: Frontend can't connect to backend
**Solution:** Check NEXT_PUBLIC_API_URL in frontend/.env.local

### Issue: Database connection failed
**Solution:** Verify DATABASE_URL and ensure PostgreSQL is running

### Issue: Pexels images not loading
**Solution:** Check PEXELS_API_KEY in backend/.env

### Issue: Build fails with memory error
**Solution:** Increase Node.js memory:
```bash
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### Issue: Port already in use
**Solution:** Change port in package.json or kill existing process:
```bash
# Find process
lsof -i :4000
# Kill process
kill -9 <PID>
```

---

## 📊 Monitoring

### Check Backend Status
```bash
pm2 status
pm2 logs digitpenhub-backend
```

### Check Frontend Status
```bash
pm2 status
pm2 logs digitpenhub-frontend
```

### Database Health
```bash
psql -U digitpenhub -d digitpenhub -c "SELECT COUNT(*) FROM pages;"
```

---

## 🔐 Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use strong database password
- [ ] Enable HTTPS in production
- [ ] Set secure cookie flags
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Regular security updates

---

## 📈 Performance Optimization

### Backend
- Enable PostgreSQL connection pooling
- Add Redis for caching
- Enable gzip compression
- Use CDN for static assets

### Frontend
- Enable Next.js image optimization
- Use lazy loading for components
- Implement code splitting
- Enable service worker for PWA

---

## 🎯 Post-Deployment Verification

1. **Health Check:** `curl http://your-domain.com/api/health`
2. **Builder Access:** Navigate to `http://your-domain.com/builder`
3. **Create Test Page:** Verify full workflow
4. **Check Logs:** Review for any errors
5. **Monitor Performance:** Check response times

---

## 📞 Support

If you encounter issues:
1. Check logs: `pm2 logs`
2. Review environment variables
3. Verify database connectivity
4. Check firewall/security groups
5. Review error messages in browser console

---

**Deployment Complete! 🎉**

Your unified website builder is now live and ready for users!
