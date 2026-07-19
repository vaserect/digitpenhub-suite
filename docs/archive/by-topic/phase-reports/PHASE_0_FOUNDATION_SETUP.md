# Phase 0: Foundation & Planning Setup Guide
**Duration:** Weeks 1-2  
**Status:** In Progress  
**Date:** July 16, 2026

---

## Overview

Phase 0 establishes the foundation for the CRM transformation project. This phase focuses on team assembly, environment setup, and establishing development processes before any code implementation begins.

---

## 0.1 Team Assembly (Week 1, Days 1-3)

### Required Roles

| Role | Count | Responsibilities | Skills Required |
|------|-------|------------------|-----------------|
| **Tech Lead** | 1 | Architecture decisions, code review, technical leadership | 10+ years experience, Node.js, PostgreSQL, React, System design |
| **Senior Backend Developer** | 2 | Services, APIs, database, integrations | 5+ years Node.js, PostgreSQL, Redis, Bull queues, Microservices |
| **Senior Frontend Developer** | 2 | Components, UI/UX, state management | 5+ years React, Next.js, TypeScript, Tailwind CSS |
| **QA Engineer** | 1 | Testing strategy, automation, quality assurance | Jest, Playwright, k6, Test automation |
| **DevOps Engineer** | 1 | CI/CD, deployment, monitoring, infrastructure | Docker, Kubernetes, GitHub Actions, AWS/GCP |
| **Product Manager** | 1 | Requirements, prioritization, stakeholder management | CRM domain knowledge, Agile/Scrum |
| **UX Designer** | 1 | UI design, user research, prototyping | Figma, User research, Design systems |

### Hiring Checklist

- [ ] Create job descriptions for all roles
- [ ] Post job openings on relevant platforms
- [ ] Screen candidates (technical + cultural fit)
- [ ] Conduct technical interviews
- [ ] Make offers and negotiate terms
- [ ] Complete onboarding paperwork
- [ ] Set start dates

### Team Structure

```
Tech Lead (1)
├── Backend Team (2 Senior Developers)
├── Frontend Team (2 Senior Developers)
├── QA Team (1 Engineer)
└── DevOps Team (1 Engineer)

Product Manager (1) - Works with Tech Lead
UX Designer (1) - Works with Frontend Team
```

---

## 0.2 Development Environment Setup (Week 1, Days 4-5)

### Local Development Setup

#### Prerequisites
```bash
# Required software versions
Node.js: 18.x or higher
PostgreSQL: 14.x or higher
Redis: 7.x or higher
Git: 2.x or higher
Docker: 20.x or higher
```

#### Repository Setup
```bash
# Clone repository
git clone https://github.com/digitpenhub/digitpenhub-suite.git
cd digitpenhub-suite

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Set up environment variables
cp .env.example .env
# Edit .env with local database credentials

# Set up database
createdb digitpenhub_dev
psql digitpenhub_dev < backend/db/schema.sql

# Start development servers
npm run dev:backend  # Port 3001
npm run dev:frontend # Port 3000
```

#### IDE Configuration

**VS Code Extensions:**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "eamodio.gitlens",
    "github.copilot",
    "prisma.prisma"
  ]
}
```

**ESLint Configuration:**
```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error"
  }
}
```

**Prettier Configuration:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Docker Development Environment

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: digitpenhub_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/digitpenhub_dev
      REDIS_URL: redis://redis:6379
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

**Start Development Environment:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

---

## 0.3 CI/CD Pipeline Setup (Week 2, Days 1-2)

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run linter
        working-directory: ./backend
        run: npm run lint

      - name: Run tests
        working-directory: ./backend
        run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run linter
        working-directory: ./frontend
        run: npm run lint

      - name: Run tests
        working-directory: ./frontend
        run: npm test -- --coverage

      - name: Build
        working-directory: ./frontend
        run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend, e2e-tests]
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Add deployment commands here

  deploy-production:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend, e2e-tests]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          echo "Deploying to production environment"
          # Add deployment commands here
```

### Branch Protection Rules

**Main Branch:**
- Require pull request reviews (2 approvals)
- Require status checks to pass
- Require branches to be up to date
- Require conversation resolution
- No force pushes
- No deletions

**Develop Branch:**
- Require pull request reviews (1 approval)
- Require status checks to pass
- Allow force pushes (for rebasing)

---

## 0.4 Code Review Process (Week 2, Day 3)

### Pull Request Template

```markdown
# .github/pull_request_template.md

## Description
<!-- Describe your changes in detail -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
<!-- Link to related issues: Fixes #123 -->

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Dependent changes merged

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

## Performance Impact
<!-- Describe any performance implications -->

## Security Considerations
<!-- Describe any security implications -->
```

### Code Review Guidelines

**For Reviewers:**
1. Check code quality and style
2. Verify tests are comprehensive
3. Look for security vulnerabilities
4. Assess performance implications
5. Ensure documentation is updated
6. Verify backward compatibility
7. Check for code duplication

**For Authors:**
1. Keep PRs small and focused
2. Write clear descriptions
3. Add tests for all changes
4. Update documentation
5. Respond to feedback promptly
6. Resolve all conversations
7. Rebase before merging

### Review SLA
- Small PRs (< 100 lines): 4 hours
- Medium PRs (100-500 lines): 1 day
- Large PRs (> 500 lines): 2 days

---

## 0.5 Monitoring & Logging Setup (Week 2, Days 4-5)

### Application Monitoring

**DataDog Setup:**
```javascript
// backend/src/utils/monitoring.js
const tracer = require('dd-trace').init({
  service: 'digitpenhub-crm',
  env: process.env.NODE_ENV,
  version: process.env.APP_VERSION,
  logInjection: true,
  analytics: true
});

module.exports = tracer;
```

**New Relic Setup:**
```javascript
// backend/newrelic.js
exports.config = {
  app_name: ['DigitPenHub CRM'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  distributed_tracing: {
    enabled: true
  },
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 'apdex_f'
  }
};
```

### Centralized Logging

**Winston Logger Configuration:**
```javascript
// backend/src/utils/logger.js
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'digitpenhub-crm',
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_URL
      },
      index: 'digitpenhub-logs'
    })
  ]
});

module.exports = logger;
```

### Error Tracking

**Sentry Setup:**
```javascript
// backend/src/utils/errorTracking.js
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app })
  ]
});

module.exports = Sentry;
```

### Performance Monitoring

**Custom Metrics:**
```javascript
// backend/src/utils/metrics.js
const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const dealCreationCounter = new client.Counter({
  name: 'crm_deals_created_total',
  help: 'Total number of deals created',
  labelNames: ['pipeline', 'stage'],
  registers: [register]
});

module.exports = {
  register,
  httpRequestDuration,
  dealCreationCounter
};
```

---

## 0.6 Development Standards

### Git Workflow

**Branch Naming:**
```
feature/CRM-123-add-deal-entity
bugfix/CRM-456-fix-contact-search
hotfix/CRM-789-security-patch
refactor/CRM-101-optimize-queries
```

**Commit Message Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

**Example:**
```
feat(crm): add deal entity with pipeline support

- Create crm_deals table with foreign keys
- Implement DealService with CRUD operations
- Add deal API endpoints
- Create DealCard component for Kanban board

Closes #123
```

### Code Style

**Backend (Node.js):**
- Use async/await over promises
- Use const/let, never var
- Use arrow functions
- Use template literals
- Use destructuring
- Use optional chaining
- Add JSDoc comments

**Frontend (React):**
- Use functional components
- Use hooks (useState, useEffect, etc.)
- Use TypeScript for type safety
- Use Tailwind CSS for styling
- Use React Query for data fetching
- Use Zustand for state management
- Add PropTypes or TypeScript types

### Testing Standards

**Coverage Requirements:**
- Unit tests: 80% minimum
- Integration tests: 70% minimum
- E2E tests: Critical paths only

**Test Structure:**
```javascript
describe('DealService', () => {
  describe('create', () => {
    it('should create a deal with valid data', async () => {
      // Arrange
      const dealData = { name: 'Test Deal', amount: 10000 };
      
      // Act
      const result = await dealService.create(orgId, dealData, userId);
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Test Deal');
    });
  });
});
```

---

## 0.7 Documentation Standards

### Code Documentation

**JSDoc Example:**
```javascript
/**
 * Creates a new deal in the CRM system
 * @param {string} orgId - Organization ID
 * @param {Object} dealData - Deal data
 * @param {string} dealData.name - Deal name
 * @param {number} dealData.amount - Deal amount
 * @param {string} dealData.pipelineId - Pipeline ID
 * @param {string} dealData.stageId - Stage ID
 * @param {string} userId - User ID creating the deal
 * @returns {Promise<Object>} Created deal object
 * @throws {ValidationError} If deal data is invalid
 * @throws {NotFoundError} If pipeline or stage not found
 */
async create(orgId, dealData, userId) {
  // Implementation
}
```

### API Documentation

**OpenAPI/Swagger:**
```yaml
/api/crm/deals:
  post:
    summary: Create a new deal
    tags: [Deals]
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/DealCreate'
    responses:
      201:
        description: Deal created successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Deal'
      400:
        description: Invalid request data
      401:
        description: Unauthorized
      404:
        description: Pipeline or stage not found
```

---

## 0.8 Security Standards

### Authentication & Authorization

**JWT Configuration:**
```javascript
// backend/src/config/jwt.js
module.exports = {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h',
  refreshExpiresIn: '7d',
  algorithm: 'HS256'
};
```

**Role-Based Access Control:**
```javascript
// backend/src/middleware/rbac.js
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    const user = req.user;
    const hasPermission = await rbacService.checkPermission(
      user.roleId,
      resource,
      action
    );
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};
```

### Data Security

**Encryption:**
```javascript
// backend/src/utils/encryption.js
const crypto = require('crypto');

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}
```

**SQL Injection Prevention:**
- Always use parameterized queries
- Never concatenate user input into SQL
- Use ORM/query builder (Knex.js)
- Validate and sanitize all inputs

---

## 0.9 Phase 0 Checklist

### Week 1
- [ ] Team assembly initiated
- [ ] Job descriptions created
- [ ] Interviews scheduled
- [ ] Development environment documented
- [ ] Docker setup tested
- [ ] Local development working

### Week 2
- [ ] CI/CD pipeline configured
- [ ] Branch protection rules set
- [ ] Code review process established
- [ ] Monitoring tools configured
- [ ] Logging infrastructure set up
- [ ] Error tracking enabled
- [ ] Documentation standards defined
- [ ] Security standards defined

### Deliverables
- [ ] Team roster with roles
- [ ] Development environment guide
- [ ] CI/CD pipeline running
- [ ] Code review guidelines
- [ ] Monitoring dashboards
- [ ] Security policies document

---

## 0.10 Next Steps

Once Phase 0 is complete:

1. **Kick-off Meeting**
   - Introduce team members
   - Review project goals
   - Discuss timeline and milestones
   - Assign initial tasks

2. **Sprint Planning**
   - Plan first 2-week sprint
   - Assign Phase 1 tasks (Database Foundation)
   - Set up sprint board in Jira/Linear

3. **Begin Phase 1**
   - Start database migration development
   - Create core entity tables
   - Set up repository pattern
   - Begin service layer development

---

**Phase 0 Status:** Ready to Begin  
**Estimated Completion:** 2 weeks  
**Next Phase:** Phase 1 - Database Foundation (Weeks 3-6)

---

**End of Phase 0 Setup Guide**
