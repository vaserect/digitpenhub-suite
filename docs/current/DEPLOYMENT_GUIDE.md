# Platform Deployment & Setup Guide
**Status:** ✅ Operational Scripts Active  
**Last Updated:** July 17, 2026  
**Supersedes:** 7 archived deployment checklists and guides in `/docs/archive/by-topic/deployment/`.

---

## 🚀 Quick Start Deployment

Deploy the Digitpen Hub Suite locally or to staging using the following 3-step process:

### 1. Database Setup
Ensure PostgreSQL is running, then create and seed the database using the SQL script:
```bash
psql -U postgres -f setup-database.sql
```

### 2. Environment Configuration
Create a `.env` file in the root directory (based on the sample) and set critical variables:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/digitpenhub
PORT=3000
JWT_SECRET=your-super-secret-key
PEXELS_API_KEY_1=key1...
CLOUDFLARE_API_TOKEN=cf-token-here
```

### 3. Deploy/Run
You can use the local shell script to verify dependencies, install node modules, run migrations, and spin up the development servers:
```bash
./DEPLOY_NOW.sh
```
*For Windows systems, the CLI setup can be initialized via `install.cmd`.*

---

## 🛠️ Operational Setup Scripts

The project root preserves only the following functional setup scripts:

*   [`install.cmd`](file:///home/suite.digitpenhub.com/digitpenhub-suite/install.cmd) - Powers local Windows CLI setups for the Antigravity system.
*   [`setup-database.sql`](file:///home/suite.digitpenhub.com/digitpenhub-suite/setup-database.sql) - Database initialization script.
*   [`DEPLOY_NOW.sh`](file:///home/suite.digitpenhub.com/digitpenhub-suite/DEPLOY_NOW.sh) - End-to-end local shell startup assistant.

---

## 📋 Staging and Production Verification Checklist

Before pushing changes to staging or production environments, complete these checks:

*   [ ] **Database Migrations:** Ensure migrations `101` through `134` are fully applied in PostgreSQL.
*   [ ] **Caching Check:** Confirm Redis/memory-cache is configured on routes to optimize dashboard loaders.
*   [ ] **Rate Limiting:** Confirm `/api/v1/hr/` and `/api/v1/auth/` have active rate limiters running.
*   [ ] **Security Audit:** Confirm no unsanitized raw inputs are present in raw SQL calls (SQL injection safeguard check).
