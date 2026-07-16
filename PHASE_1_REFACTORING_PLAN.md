# Phase 1: Foundation Refactoring - Implementation Plan

**Duration:** 4 weeks  
**Team:** 2 Senior Backend Engineers, 1 DevOps Engineer, 1 QA Engineer  
**Status:** Ready to Begin  
**Priority:** P0 (Critical)

---

## Overview

Phase 1 addresses the most critical architectural issues that are blocking scalability and maintainability. This phase establishes the foundation for all future improvements.

### Goals

1. ✅ Implement comprehensive service layer
2. ✅ Refactor monolithic route registration
3. ✅ Fix critical security vulnerabilities
4. ✅ Optimize database connection management
5. ✅ Establish testing infrastructure

### Success Criteria

- [ ] app.js reduced from 800+ lines to <200 lines
- [ ] 10+ services implemented with 80%+ test coverage
- [ ] 0 critical security vulnerabilities
- [ ] Database connection pool increased to 50+
- [ ] All changes deployed to staging without incidents

---

## Week 1: Service Layer Foundation

### Day 1-2: Architecture Setup

**Tasks:**

1. **Create Service Layer Structure**
   ```
   backend/src/
   ├── services/
   │   ├── base/
   │   │   ├── BaseService.js
   │   │   └── ServiceRegistry.js
   │   ├── crm/
   │   │   ├── ContactService.js
   │   │   └── CompanyService.js
   │   ├── invoicing/
   │   │   └── InvoiceService.js
   │   └── index.js
   ├── repositories/
   │   ├── base/
   │   │   └── BaseRepository.js
   │   ├── ContactRepository.js
   │   ├── CompanyRepository.js
   │   └── InvoiceRepository.js
   └── domain/
       ├── Contact.js
       ├── Company.js
       └── Invoice.js
   ```

2. **Implement BaseService Class**
   ```javascript
   // backend/src/services/base/BaseService.js
   class BaseService {
     constructor(repository, logger) {
       this.repository = repository;
       this.logger = logger;
     }

     async findById(id, orgId) {
       this.logger.debug('Finding by ID', { id, orgId });
       return await this.repository.findById(id, orgId);
     }

     async findAll(orgId, filters = {}) {
       this.logger.debug('Finding all', { orgId, filters });
       return await this.repository.findAll(orgId, filters);
     }

     async create(data, orgId) {
       this.logger.info('Creating entity', { orgId });
       return await this.repository.create(data, orgId);
     }

     async update(id, data, orgId) {
       this.logger.info('Updating entity', { id, orgId });
       return await this.repository.update(id, data, orgId);
     }

     async delete(id, orgId) {
       this.logger.info('Deleting entity', { id, orgId });
       return await this.repository.delete(id, orgId);
     }
   }

   module.exports = BaseService;
   ```

3. **Implement BaseRepository Class**
   ```javascript
   // backend/src/repositories/base/BaseRepository.js
   class BaseRepository {
     constructor(db, tableName, logger) {
       this.db = db;
       this.tableName = tableName;
       this.logger = logger;
     }

     async findById(id, orgId) {
       const { rows } = await this.db.query(
         `SELECT * FROM ${this.tableName} WHERE id = $1 AND org_id = $2`,
         [id, orgId]
       );
       return rows[0] || null;
     }

     async findAll(orgId, filters = {}) {
       const { rows } = await this.db.query(
         `SELECT * FROM ${this.tableName} WHERE org_id = $1 ORDER BY created_at DESC`,
         [orgId]
       );
       return rows;
     }

     async create(data, orgId) {
       const columns = Object.keys(data);
       const values = Object.values(data);
       const placeholders = values.map((_, i) => `$${i + 2}`);
       
       const { rows } = await this.db.query(
         `INSERT INTO ${this.tableName} (org_id, ${columns.join(', ')})
          VALUES ($1, ${placeholders.join(', ')})
          RETURNING *`,
         [orgId, ...values]
       );
       return rows[0];
     }

     async update(id, data, orgId) {
       const columns = Object.keys(data);
       const values = Object.values(data);
       const setClause = columns.map((col, i) => `${col} = $${i + 3}`).join(', ');
       
       const { rows } = await this.db.query(
         `UPDATE ${this.tableName}
          SET ${setClause}, updated_at = NOW()
          WHERE id = $1 AND org_id = $2
          RETURNING *`,
         [id, orgId, ...values]
       );
       return rows[0] || null;
     }

     async delete(id, orgId) {
       const { rows } = await this.db.query(
         `DELETE FROM ${this.tableName}
          WHERE id = $1 AND org_id = $2
          RETURNING id`,
         [id, orgId]
       );
       return rows[0] || null;
     }
   }

   module.exports = BaseRepository;
   ```

**Deliverables:**
- [ ] BaseService class implemented
- [ ] BaseRepository class implemented
- [ ] Service registry created
- [ ] Unit tests for base classes (80%+ coverage)

---

### Day 3-5: Implement Core Services

**Priority Services (Week 1):**

1. **ContactService** (CRM)
   - CRUD operations
   - Search and filtering
   - Bulk operations
   - Note management
   - Task management
   - Activity tracking

2. **CompanyService** (CRM)
   - CRUD operations
   - Contact associations
   - Deal tracking

3. **InvoiceService** (Invoicing)
   - CRUD operations
   - PDF generation
   - Payment tracking
   - Email sending

**Implementation Pattern:**

```javascript
// backend/src/services/crm/ContactService.js
const BaseService = require('../base/BaseService');
const ContactRepository = require('../../repositories/ContactRepository');
const logger = require('../../utils/logger');

class ContactService extends BaseService {
  constructor() {
    super(new ContactRepository(), logger);
  }

  async search(orgId, query, filters = {}) {
    this.logger.debug('Searching contacts', { orgId, query, filters });
    
    // Business logic here
    const results = await this.repository.search(orgId, query, filters);
    
    // Post-processing
    return results.map(contact => this.enrichContact(contact));
  }

  async bulkCreate(contacts, orgId) {
    this.logger.info('Bulk creating contacts', { count: contacts.length, orgId });
    
    // Validation
    const validated = contacts.map(c => this.validateContact(c));
    
    // Bulk insert
    return await this.repository.bulkCreate(validated, orgId);
  }

  async addNote(contactId, noteData, orgId, userId) {
    this.logger.info('Adding note to contact', { contactId, orgId });
    
    // Verify contact exists
    const contact = await this.findById(contactId, orgId);
    if (!contact) throw new Error('Contact not found');
    
    // Create note
    return await this.repository.addNote(contactId, noteData, userId);
  }

  enrichContact(contact) {
    // Add computed fields, format data, etc.
    return {
      ...contact,
      displayName: contact.full_name || contact.email,
      hasRecentActivity: this.hasRecentActivity(contact),
    };
  }

  validateContact(contact) {
    // Validation logic
    if (!contact.email && !contact.phone) {
      throw new Error('Contact must have email or phone');
    }
    return contact;
  }

  hasRecentActivity(contact) {
    if (!contact.last_touch_at) return false;
    const daysSince = (Date.now() - new Date(contact.last_touch_at)) / (1000 * 60 * 60 * 24);
    return daysSince < 30;
  }
}

module.exports = new ContactService();
```

**Deliverables:**
- [ ] ContactService implemented with tests
- [ ] CompanyService implemented with tests
- [ ] InvoiceService implemented with tests
- [ ] Controllers refactored to use services
- [ ] Integration tests for service layer

---

## Week 2: Route Organization & Middleware

### Day 1-2: Route Loader System

**Create Modular Route Registration:**

```javascript
// backend/src/routes/loader.js
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class RouteLoader {
  constructor(app) {
    this.app = app;
    this.routes = [];
  }

  /**
   * Load routes from configuration
   * @param {Array} routeConfigs - Array of route configuration objects
   */
  loadRoutes(routeConfigs) {
    routeConfigs.forEach(config => {
      this.registerRoute(config);
    });
    
    logger.info(`Loaded ${this.routes.length} route groups`);
  }

  /**
   * Register a single route configuration
   * @param {Object} config - Route configuration
   */
  registerRoute(config) {
    const {
      path: routePath,
      router,
      middleware = [],
      description = '',
      public: isPublic = false,
    } = config;

    // Apply middleware chain
    const middlewareChain = this.buildMiddlewareChain(middleware, isPublic);
    
    // Register route
    this.app.use(routePath, ...middlewareChain, router);
    
    this.routes.push({
      path: routePath,
      middleware: middleware.map(m => m.name || 'anonymous'),
      public: isPublic,
      description,
    });

    logger.debug(`Registered route: ${routePath}`, {
      middleware: middleware.length,
      public: isPublic,
    });
  }

  /**
   * Build middleware chain based on configuration
   */
  buildMiddlewareChain(middleware, isPublic) {
    const chain = [];
    
    // Add default middleware for protected routes
    if (!isPublic) {
      chain.push(require('../middleware/auth').requireAuth);
    }
    
    // Add custom middleware
    chain.push(...middleware);
    
    return chain;
  }

  /**
   * Get route information for debugging
   */
  getRoutes() {
    return this.routes;
  }
}

module.exports = RouteLoader;
```

**Route Configuration:**

```javascript
// backend/src/routes/config/crm.routes.js
const { requireModuleAccess } = require('../../utils/planAccess');

module.exports = {
  group: 'CRM',
  routes: [
    {
      path: '/api/v1/crm/contacts',
      router: require('../crm/contacts'),
      middleware: [requireModuleAccess('crm')],
      description: 'Contact management endpoints',
    },
    {
      path: '/api/v1/crm/companies',
      router: require('../crm/companies'),
      middleware: [requireModuleAccess('crm')],
      description: 'Company management endpoints',
    },
    {
      path: '/api/v1/crm/deals',
      router: require('../crm/deals'),
      middleware: [requireModuleAccess('crm')],
      description: 'Deal pipeline management',
    },
  ],
};
```

**New app.js Structure:**

```javascript
// backend/src/app.js (simplified)
require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { initSentry, Sentry } = require('./utils/sentry');
const { requestIdMiddleware, addUserContext } = require('./middleware/requestId');
const { csrfProtection } = require('./middleware/csrf');
const RouteLoader = require('./routes/loader');

const app = express();

// Initialize Sentry
const sentryEnabled = initSentry(app);

// Trust proxy
app.set('trust proxy', 1);

// Core middleware
if (sentryEnabled) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

app.use(requestIdMiddleware);
app.use(helmet());
app.use(cors({ 
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:4000', 
  credentials: true 
}));
app.use(cookieParser());
app.use(express.json({ limit: '200kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', csrfProtection);
app.use('/api', addUserContext);

// Load routes
const routeLoader = new RouteLoader(app);
const routeConfigs = [
  require('./routes/config/health.routes'),
  require('./routes/config/auth.routes'),
  require('./routes/config/crm.routes'),
  require('./routes/config/invoicing.routes'),
  require('./routes/config/hr.routes'),
  require('./routes/config/pm.routes'),
  require('./routes/config/marketing.routes'),
  require('./routes/config/ecommerce.routes'),
  require('./routes/config/website.routes'),
  require('./routes/config/ai.routes'),
  require('./routes/config/utilities.routes'),
];

routeLoader.loadRoutes(routeConfigs.flatMap(c => c.routes));

// Debug endpoint (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/v1/debug/routes', (req, res) => {
    res.json({ routes: routeLoader.getRoutes() });
  });
}

// 404 handler
app.use((req, res) => {
  if (req.logger) {
    req.logger.warn('Route not found', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
  }
  res.status(404).json({ error: 'Not found.' });
});

// Error handlers
if (sentryEnabled) {
  app.use(Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      return error.status >= 500 || !error.status;
    },
  }));
}

app.use((err, req, res, next) => {
  const errorContext = {
    message: err.message,
    stack: err.stack,
    requestId: req.id,
    userId: req.user?.id,
    orgId: req.user?.orgId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  };
  
  if (req.logger) {
    req.logger.error('Unhandled error', errorContext);
  } else {
    logger.error('Unhandled error (no request context)', errorContext);
  }
  
  res.status(500).json({ error: 'Something went wrong on our end.' });
});

module.exports = app;
```

**Deliverables:**
- [ ] RouteLoader class implemented
- [ ] 10+ route configuration files created
- [ ] app.js refactored to <200 lines
- [ ] Debug endpoint for route inspection
- [ ] Documentation for route configuration

---

### Day 3-5: Middleware Standardization

**Create Middleware Composition Utilities:**

```javascript
// backend/src/middleware/compose.js
/**
 * Compose multiple middleware functions into a single middleware
 */
function compose(...middlewares) {
  return (req, res, next) => {
    let index = 0;

    function dispatch(i) {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      index = i;

      const middleware = middlewares[i];
      if (!middleware) return Promise.resolve();

      try {
        return Promise.resolve(middleware(req, res, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0).catch(next);
  };
}

/**
 * Create a middleware that requires authentication and module access
 */
function requireModule(moduleSlug) {
  const { requireAuth } = require('./auth');
  const { requireModuleAccess } = require('../utils/planAccess');
  
  return compose(
    requireAuth,
    requireModuleAccess(moduleSlug)
  );
}

/**
 * Create a middleware that requires authentication and specific role
 */
function requireRole(...roles) {
  const { requireAuth } = require('./auth');
  
  return compose(
    requireAuth,
    (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: roles,
          current: req.user.role,
        });
      }
      next();
    }
  );
}

/**
 * Create a middleware that requires super admin
 */
function requireSuperAdmin() {
  const { requireAuth } = require('./auth');
  
  return compose(
    requireAuth,
    (req, res, next) => {
      if (!req.user.isSuperAdmin) {
        return res.status(403).json({ error: 'Super admin access required' });
      }
      next();
    }
  );
}

module.exports = {
  compose,
  requireModule,
  requireRole,
  requireSuperAdmin,
};
```

**Standardize Rate Limiting:**

```javascript
// backend/src/middleware/rateLimiting.js
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Create a rate limiter with standard configuration
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    keyGenerator = (req) => req.ip,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    skipSuccessfulRequests,
    keyGenerator,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userId: req.user?.id,
        path: req.path,
      });
      res.status(429).json({ error: message });
    },
  });
}

// Preset rate limiters
const rateLimiters = {
  // Strict rate limiting for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later',
  }),

  // Standard rate limiting for API endpoints
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }),

  // Relaxed rate limiting for public endpoints
  public: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 300,
  }),

  // Strict rate limiting for expensive operations
  expensive: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Rate limit exceeded for this operation',
  }),
};

module.exports = {
  createRateLimiter,
  rateLimiters,
};
```

**Deliverables:**
- [ ] Middleware composition utilities implemented
- [ ] Rate limiting standardized across all endpoints
- [ ] Role-based access control helpers created
- [ ] Documentation for middleware patterns

---

## Week 3: Security & Database Optimization

### Day 1-2: Security Audit & Fixes

**SQL Injection Audit:**

1. **Scan all controllers for raw SQL queries**
   ```bash
   # Find potential SQL injection vulnerabilities
   grep -r "db.query.*\${" backend/src/controllers/
   grep -r "db.query.*+" backend/src/controllers/
   ```

2. **Fix vulnerable queries**
   ```javascript
   // BEFORE (VULNERABLE)
   const { rows } = await db.query(
     `SELECT * FROM contacts WHERE name LIKE '%${req.query.search}%'`
   );

   // AFTER (SAFE)
   const { rows } = await db.query(
     `SELECT * FROM contacts WHERE name ILIKE $1`,
     [`%${req.query.search}%`]
   );
   ```

3. **Implement query builder for complex queries**
   ```javascript
   // backend/src/utils/queryBuilder.js
   class QueryBuilder {
     constructor(tableName) {
       this.tableName = tableName;
       this.whereClauses = [];
       this.params = [];
       this.paramIndex = 1;
     }

     where(column, operator, value) {
       this.whereClauses.push(`${column} ${operator} $${this.paramIndex}`);
       this.params.push(value);
       this.paramIndex++;
       return this;
     }

     whereIn(column, values) {
       const placeholders = values.map((_, i) => `$${this.paramIndex + i}`);
       this.whereClauses.push(`${column} IN (${placeholders.join(', ')})`);
       this.params.push(...values);
       this.paramIndex += values.length;
       return this;
     }

     build() {
       let query = `SELECT * FROM ${this.tableName}`;
       if (this.whereClauses.length > 0) {
         query += ` WHERE ${this.whereClauses.join(' AND ')}`;
       }
       return { query, params: this.params };
     }
   }

   module.exports = QueryBuilder;
   ```

**Input Sanitization:**

```javascript
// backend/src/middleware/sanitization.js
const validator = require('validator');

/**
 * Sanitize request body
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Sanitize request query
 */
function sanitizeQuery(req, res, next) {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Escape HTML to prevent XSS
      sanitized[key] = validator.escape(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? validator.escape(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

module.exports = {
  sanitizeBody,
  sanitizeQuery,
};
```

**File Upload Validation:**

```javascript
// backend/src/middleware/fileUpload.js
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Create multer upload middleware with validation
 */
function createUploadMiddleware(options = {}) {
  const {
    allowedTypes = ALLOWED_MIME_TYPES.images,
    maxSize = MAX_FILE_SIZE,
    destination = 'uploads/',
  } = options;

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSize,
    },
  });
}

module.exports = {
  createUploadMiddleware,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
};
```

**Deliverables:**
- [ ] All SQL injection vulnerabilities fixed
- [ ] Input sanitization middleware implemented
- [ ] File upload validation implemented
- [ ] Security audit report generated
- [ ] Rate limiting applied to all endpoints

---

### Day 3-5: Database Optimization

**Increase Connection Pool:**

```javascript
// backend/src/db.js (updated)
const { Pool } = require('pg');
const logger = require('./utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  keepAlive: true,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  max: 50, // Increased from 10
  min: 5,  // Maintain minimum connections
  statement_timeout: 30000, // 30 second query timeout
  query_timeout: 30000,
});

// Connection pool monitoring
pool.on('connect', (client) => {
  logger.debug('New database connection established');
});

pool.on('acquire', (client) => {
  logger.debug('Connection acquired from pool');
});

pool.on('remove', (client) => {
  logger.debug('Connection removed from pool');
});

pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle Postgres client', {
    error: err.message,
    stack: err.stack,
  });
});

// Health check
async function checkHealth() {
  try {
    const result = await pool.query('SELECT NOW()');
    return {
      healthy: true,
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
  } catch (err) {
    logger.error('Database health check failed', { error: err.message });
    return {
      healthy: false,
      error: err.message,
    };
  }
}

module.exports = pool;
module.exports.checkHealth = checkHealth;
```

**Add Database Indexes:**

```sql
-- backend/db/069_performance_indexes.sql

-- Contacts indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_org_id_created_at 
  ON contacts(org_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_org_id_stage 
  ON contacts(org_id, stage);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_email 
  ON contacts(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_full_name_trgm 
  ON contacts USING gin(full_name gin_trgm_ops);

-- Invoices indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_org_id_status 
  ON invoices(org_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_org_id_due_date 
  ON invoices(org_id, due_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_contact_id 
  ON invoices(contact_id);

-- Projects indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_org_id_status 
  ON projects(org_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_org_id_created_at 
  ON projects(org_id, created_at DESC);

-- Tasks indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_org_id_status 
  ON tasks(org_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assigned_to 
  ON tasks(assigned_to);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_project_id 
  ON tasks(project_id);

-- Sessions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id 
  ON sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at 
  ON sessions(expires_at);

-- Users indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org_id 
  ON users(org_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
  ON users(email);

-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add query performance monitoring
CREATE TABLE IF NOT EXISTS query_performance_log (
  id SERIAL PRIMARY KEY,
  query_hash TEXT NOT NULL,
  query_text TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  rows_returned INTEGER,
  org_id INTEGER,
  user_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_query_performance_hash ON query_performance_log(query_hash);
CREATE INDEX idx_query_performance_time ON query_performance_log(execution_time_ms DESC);
```

**Query Performance Monitoring:**

```javascript
// backend/src/utils/queryMonitor.js
const db = require('../db');
const logger = require('./logger');
const crypto = require('crypto');

class QueryMonitor {
  constructor() {
    this.slowQueryThreshold = 1000; // 1 second
  }

  /**
   * Wrap a query with performance monitoring
   */
  async monitorQuery(query, params, context = {}) {
    const startTime = Date.now();
    const queryHash = this.hashQuery(query);

    try {
      const result = await db.query(query, params);
      const executionTime = Date.now() - startTime;

      // Log slow queries
      if (executionTime > this.slowQueryThreshold) {
        logger.warn('Slow query detected', {
          queryHash,
          executionTime,
          rowCount: result.rowCount,
          ...context,
        });

        // Store in performance log
        await this.logQueryPerformance(
          queryHash,
          query,
          executionTime,
          result.rowCount,
          context
        );
      }

      return result;
    } catch (err) {
      const executionTime = Date.now() - startTime;
      logger.error('Query failed', {
        queryHash,
        executionTime,
        error: err.message,
        ...context,
      });
      throw err;
    }
  }

  /**
   * Hash query for identification
   */
  hashQuery(query) {
    return crypto
      .createHash('md5')
      .update(query.replace(/\s+/g, ' ').trim())
      .digest('hex');
  }

  /**
   * Log query performance to database
   */
  async logQueryPerformance(queryHash, queryText, executionTime, rowCount, context) {
    try {
      await db.query(
        `INSERT INTO query_performance_log 
         (query_hash, query_text, execution_time_ms, rows_returned, org_id, user_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          queryHash,
          queryText.substring(0, 1000), // Truncate long queries
          executionTime,
          rowCount,
          context.orgId || null,
          context.userId || null,
        ]
      );
    } catch (err) {
      logger.error('Failed to log query performance', { error: err.message });
    }
  }

  /**
   * Get slow query report
   */
  async getSlowQueryReport(limit = 10) {
    const { rows } = await db.query(
      `SELECT query_hash, query_text, 
              AVG(execution_time_ms)::int AS avg_time,
              MAX(execution_time_ms) AS max_time,
              COUNT(*) AS execution_count
       FROM query_performance_log
       WHERE created_at > NOW() - INTERVAL '24 hours'
       GROUP BY query_hash, query_text
       ORDER BY avg_time DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  }
}

module.exports = new QueryMonitor();
```

**Deliverables:**
- [ ] Connection pool increased to 50
- [ ] Database indexes added for common queries
- [ ] Query performance monitoring implemented
- [ ] Slow query report endpoint created
- [ ] Database health check endpoint added

---

## Week 4: Testing & Documentation

### Day 1-3: Testing Infrastructure

**Jest Configuration:**

```javascript
// backend/jest.config.js (updated)
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/server.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js',
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testTimeout: 10000,
};
```

**Test Utilities:**

```javascript
// backend/test/utils/testDb.js
const { Pool } = require('pg');

let testPool;

async function setupTestDb() {
  testPool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL,
  });

  // Run migrations
  // Clean database
  await testPool.query('TRUNCATE TABLE users, organizations, contacts CASCADE');
}

async function teardownTestDb() {
  if (testPool) {
    await testPool.end();
  }
}

async function createTestOrg() {
  const { rows } = await testPool.query(
    `INSERT INTO organizations (name, slug, plan_slug)
     VALUES ('Test Org', 'test-org', 'free')
     RETURNING *`
  );
  return rows[0];
}

async function createTestUser(orgId) {
  const { rows } = await testPool.query(
    `INSERT INTO users (org_id, email, full_name, password_hash, role)
     VALUES ($1, 'test@example.com', 'Test User', 'hash', 'admin')
     RETURNING *`,
    [orgId]
  );
  return rows[0];
}

module.exports = {
  setupTestDb,
  teardownTestDb,
  createTestOrg,
  createTestUser,
  testPool,
};
```

**Service Tests:**

```javascript
// backend/src/services/__tests__/ContactService.test.js
const ContactService = require('../crm/ContactService');
const { setupTestDb, teardownTestDb, createTestOrg } = require('../../../test/utils/testDb');

describe('ContactService', () => {
  let testOrg;

  beforeAll(async () => {
    await setupTestDb();
    testOrg = await createTestOrg();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('create', () => {
    it('should create a contact', async () => {
      const contactData = {
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      const contact = await ContactService.create(contactData, testOrg.id);

      expect(contact).toMatchObject(contactData);
      expect(contact.id).toBeDefined();
      expect(contact.org_id).toBe(testOrg.id);
    });

    it('should validate required fields', async () => {
      const contactData = {
        full_name: 'Jane Doe',
        // Missing email and phone
      };

      await expect(
        ContactService.create(contactData, testOrg.id)
      ).rejects.toThrow('Contact must have email or phone');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Create test contacts
      await ContactService.create({
        full_name: 'Alice Smith',
        email: 'alice@example.com',
      }, testOrg.id);

      await ContactService.create({
        full_name: 'Bob Johnson',
        email: 'bob@example.com',
      }, testOrg.id);
    });

    it('should search contacts by name', async () => {
      const results = await ContactService.search(testOrg.id, 'Alice');
      
      expect(results).toHaveLength(1);
      expect(results[0].full_name).toBe('Alice Smith');
    });

    it('should search contacts by email', async () => {
      const results = await ContactService.search(testOrg.id, 'bob@');
      
      expect(results).toHaveLength(1);
      expect(results[0].email).toBe('bob@example.com');
    });
  });
});
```

**Integration Tests:**

```javascript
// backend/test/integration/crm.test.js
const request = require('supertest');
const app = require('../../src/app');
const { setupTestDb, teardownTestDb, createTestOrg, createTestUser } = require('../utils/testDb');

describe('CRM API Integration', () => {
  let testOrg;
  let testUser;
  let authCookie;

  beforeAll(async () => {
    await setupTestDb();
    testOrg = await createTestOrg();
    testUser = await createTestUser(testOrg.id);

    // Login to get auth cookie
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authCookie = loginRes.headers['set-cookie'];
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('POST /api/v1/crm/contacts', () => {
    it('should create a contact', async () => {
      const res = await request(app)
        .post('/api/v1/crm/contacts')
        .set('Cookie', authCookie)
        .send({
          full_name: 'Test Contact',
          email: 'test@example.com',
          phone: '+1234567890',
        });

      expect(res.status).toBe(201);
      expect(res.body.contact).toMatchObject({
        full_name: 'Test Contact',
        email: 'test@example.com',
      });
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v1/crm/contacts')
        .send({
          full_name: 'Test Contact',
          email: 'test@example.com',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/crm/contacts', () => {
    it('should list contacts', async () => {
      const res = await request(app)
        .get('/api/v1/crm/contacts')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.contacts)).toBe(true);
    });
  });
});
```

**Deliverables:**
- [ ] Test infrastructure setup complete
- [ ] 10+ service unit tests (80%+ coverage)
- [ ] 5+ integration tests for critical workflows
- [ ] Test documentation created
- [ ] CI/CD pipeline configured with tests

---

### Day 4-5: Documentation

**API Documentation:**

```javascript
// backend/src/docs/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Digitpen Hub API',
      version: '1.0.0',
      description: 'Enterprise SaaS Platform API Documentation',
      contact: {
        name: 'API Support',
        email: 'support@digitpenhub.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:4001',
        description: 'Development server',
      },
      {
        url: 'https://api.digitpenhub.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'dph_session',
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./src/routes/**/*.js', './src/controllers/**/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
```

**Route Documentation Example:**

```javascript
/**
 * @swagger
 * /api/v1/crm/contacts:
 *   get:
 *     summary: List all contacts
 *     tags: [CRM]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of contacts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contacts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contact'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
```

**Architecture Documentation:**

Create comprehensive documentation:
- [ ] Architecture Decision Records (ADRs)
- [ ] Service layer documentation
- [ ] Route configuration guide
- [ ] Middleware documentation
- [ ] Testing guide
- [ ] Deployment guide
- [ ] Security best practices

**Deliverables:**
- [ ] OpenAPI/Swagger documentation complete
- [ ] Architecture documentation created
- [ ] Developer onboarding guide written
- [ ] Code examples and tutorials added
- [ ] Documentation site deployed

---

## Deployment Strategy

### Staging Deployment (Week 4)

1. **Pre-deployment Checklist:**
   - [ ] All tests passing
   - [ ] Code review completed
   - [ ] Security audit passed
   - [ ] Performance benchmarks met
   - [ ] Documentation updated

2. **Deployment Steps:**
   ```bash
   # 1. Backup production database
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

   # 2. Run database migrations
   npm run migrate

   # 3. Deploy to staging
   git push staging main

   # 4. Run smoke tests
   npm run test:smoke

   # 5. Monitor for 24 hours
   ```

3. **Rollback Plan:**
   - Keep previous version running
   - Database rollback script ready
   - Feature flags for gradual rollout

### Production Deployment (Week 5)

1. **Blue-Green Deployment:**
   - Deploy to green environment
   - Run full test suite
   - Switch traffic gradually
   - Monitor metrics

2. **Monitoring:**
   - Error rates
   - Response times
   - Database connection pool usage
   - Memory usage
   - CPU usage

---

## Success Metrics

### Technical Metrics

| Metric | Before | Target | Actual |
|--------|--------|--------|--------|
| app.js lines | 800+ | <200 | TBD |
| Services implemented | 1 | 10+ | TBD |
| Test coverage | <10% | 80%+ | TBD |
| DB connection pool | 10 | 50+ | TBD |
| SQL injection vulns | Unknown | 0 | TBD |
| API response time (p95) | Unknown | <200ms | TBD |

### Business Metrics

| Metric | Before | Target | Actual |
|--------|--------|--------|--------|
| Developer onboarding | 3+ days | <1 day | TBD |
| Feature velocity | Baseline | +50% | TBD |
| Bug resolution time | Baseline | -50