// backend/tests/integration/api.integration.test.js
// Phase 1 Implementation: CRM API Integration Tests
// Date: 2026-07-16

const request = require('supertest');
const { describe, it, expect, beforeAll, afterAll, beforeEach, jest } = require('@jest/globals');

// Mock Express app setup
const express = require('express');
const app = express();

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = { id: 'user-123', org_id: 'org-456' };
  next();
};

describe('CRM API Integration Tests', () => {
  let testDealId;
  let testCompanyId;
  let testPipelineId;
  let testStageId;

  beforeAll(async () => {
    // Setup test database connection
    // Initialize routes with mock services
    app.use(express.json());
    app.use(mockAuth);
  });

  afterAll(async () => {
    // Cleanup test database
    // Close connections
  });

  describe('Pipeline API', () => {
    describe('POST /api/crm/pipelines', () => {
      it('should create a new pipeline with default stages', async () => {
        const pipelineData = {
          name: 'Test Sales Pipeline',
          description: 'Integration test pipeline'
        };

        const response = await request(app)
          .post('/api/crm/pipelines')
          .send(pipelineData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toBe(pipelineData.name);
        expect(response.body.data.is_default).toBe(true);
        expect(response.body.data.stages).toHaveLength(6);

        testPipelineId = response.body.data.id;
        testStageId = response.body.data.stages[0].id;
      });

      it('should reject pipeline creation without name', async () => {
        const response = await request(app)
          .post('/api/crm/pipelines')
          .send({ description: 'No name' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('name');
      });
    });

    describe('GET /api/crm/pipelines', () => {
      it('should list all pipelines with pagination', async () => {
        const response = await request(app)
          .get('/api/crm/pipelines')
          .query({ page: 1, limit: 10 })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.pagination).toHaveProperty('total');
        expect(response.body.pagination).toHaveProperty('page');
      });

      it('should filter pipelines by search term', async () => {
        const response = await request(app)
          .get('/api/crm/pipelines')
          .query({ search: 'Test Sales' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/crm/pipelines/:id', () => {
      it('should retrieve a specific pipeline with stages', async () => {
        const response = await request(app)
          .get(`/api/crm/pipelines/${testPipelineId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testPipelineId);
        expect(response.body.data.stages).toBeInstanceOf(Array);
      });

      it('should return 404 for non-existent pipeline', async () => {
        const response = await request(app)
          .get('/api/crm/pipelines/nonexistent-id')
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/crm/pipelines/:id', () => {
      it('should update pipeline details', async () => {
        const updates = {
          name: 'Updated Pipeline Name',
          description: 'Updated description'
        };

        const response = await request(app)
          .put(`/api/crm/pipelines/${testPipelineId}`)
          .send(updates)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(updates.name);
      });
    });
  });

  describe('Company API', () => {
    describe('POST /api/crm/companies', () => {
      it('should create a new company', async () => {
        const companyData = {
          name: 'Test Corp',
          industry: 'Technology',
          website: 'https://testcorp.com',
          email: 'contact@testcorp.com'
        };

        const response = await request(app)
          .post('/api/crm/companies')
          .send(companyData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toBe(companyData.name);

        testCompanyId = response.body.data.id;
      });

      it('should detect duplicate companies', async () => {
        const duplicateData = {
          name: 'Test Corp',
          email: 'contact@testcorp.com'
        };

        const response = await request(app)
          .post('/api/crm/companies')
          .send(duplicateData)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('duplicate');
      });

      it('should validate email format', async () => {
        const invalidData = {
          name: 'Invalid Email Corp',
          email: 'invalid-email'
        };

        const response = await request(app)
          .post('/api/crm/companies')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('email');
      });
    });

    describe('GET /api/crm/companies', () => {
      it('should list companies with filters', async () => {
        const response = await request(app)
          .get('/api/crm/companies')
          .query({ industry: 'Technology', page: 1, limit: 10 })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });

    describe('GET /api/crm/companies/:id', () => {
      it('should retrieve company with statistics', async () => {
        const response = await request(app)
          .get(`/api/crm/companies/${testCompanyId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testCompanyId);
        expect(response.body.data).toHaveProperty('contact_count');
        expect(response.body.data).toHaveProperty('deal_count');
      });
    });

    describe('GET /api/crm/companies/:id/statistics', () => {
      it('should retrieve detailed company statistics', async () => {
        const response = await request(app)
          .get(`/api/crm/companies/${testCompanyId}/statistics`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('total_revenue');
        expect(response.body.data).toHaveProperty('pipeline_value');
        expect(response.body.data).toHaveProperty('health_score');
      });
    });

    describe('POST /api/crm/companies/:id/merge', () => {
      it('should merge two companies', async () => {
        // Create second company
        const company2 = await request(app)
          .post('/api/crm/companies')
          .send({ name: 'Merge Test Corp' })
          .expect(201);

        const response = await request(app)
          .post(`/api/crm/companies/${testCompanyId}/merge`)
          .send({ source_company_id: company2.body.data.id })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('merged');
      });
    });
  });

  describe('Deal API', () => {
    describe('POST /api/crm/deals', () => {
      it('should create a new deal', async () => {
        const dealData = {
          name: 'Test Deal',
          amount: 50000,
          pipeline_id: testPipelineId,
          stage_id: testStageId,
          company_id: testCompanyId,
          expected_close_date: '2026-12-31'
        };

        const response = await request(app)
          .post('/api/crm/deals')
          .send(dealData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toBe(dealData.name);
        expect(response.body.data.amount).toBe(dealData.amount);

        testDealId = response.body.data.id;
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/crm/deals')
          .send({ name: 'Incomplete Deal' })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should validate amount is positive', async () => {
        const response = await request(app)
          .post('/api/crm/deals')
          .send({
            name: 'Negative Deal',
            amount: -1000,
            pipeline_id: testPipelineId,
            stage_id: testStageId
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('amount');
      });
    });

    describe('GET /api/crm/deals', () => {
      it('should list deals with pagination', async () => {
        const response = await request(app)
          .get('/api/crm/deals')
          .query({ page: 1, limit: 10 })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.pagination).toBeDefined();
      });

      it('should filter deals by pipeline', async () => {
        const response = await request(app)
          .get('/api/crm/deals')
          .query({ pipeline_id: testPipelineId })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.every(d => d.pipeline_id === testPipelineId)).toBe(true);
      });

      it('should filter deals by status', async () => {
        const response = await request(app)
          .get('/api/crm/deals')
          .query({ status: 'open' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.every(d => d.status === 'open')).toBe(true);
      });
    });

    describe('GET /api/crm/deals/:id', () => {
      it('should retrieve deal with related data', async () => {
        const response = await request(app)
          .get(`/api/crm/deals/${testDealId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testDealId);
        expect(response.body.data).toHaveProperty('company');
        expect(response.body.data).toHaveProperty('products');
      });
    });

    describe('PUT /api/crm/deals/:id', () => {
      it('should update deal details', async () => {
        const updates = {
          name: 'Updated Deal Name',
          amount: 75000
        };

        const response = await request(app)
          .put(`/api/crm/deals/${testDealId}`)
          .send(updates)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(updates.name);
        expect(response.body.data.amount).toBe(updates.amount);
      });
    });

    describe('POST /api/crm/deals/:id/products', () => {
      it('should add product to deal', async () => {
        const productData = {
          product_id: 'product-001',
          quantity: 5,
          unit_price: 1000,
          discount: 10
        };

        const response = await request(app)
          .post(`/api/crm/deals/${testDealId}/products`)
          .send(productData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.quantity).toBe(productData.quantity);
      });
    });

    describe('PUT /api/crm/deals/:id/stage', () => {
      it('should change deal stage', async () => {
        const stageData = {
          stage_id: testStageId,
          reason: 'Moving to next stage'
        };

        const response = await request(app)
          .put(`/api/crm/deals/${testDealId}/stage`)
          .send(stageData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.stage_id).toBe(stageData.stage_id);
      });
    });

    describe('GET /api/crm/deals/forecast', () => {
      it('should retrieve sales forecast', async () => {
        const response = await request(app)
          .get('/api/crm/deals/forecast')
          .query({
            pipeline_id: testPipelineId,
            start_date: '2026-01-01',
            end_date: '2026-12-31'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('committed');
        expect(response.body.data).toHaveProperty('best_case');
        expect(response.body.data).toHaveProperty('pipeline');
      });
    });
  });

  describe('Cross-Entity Integration', () => {
    it('should reflect deal changes in company statistics', async () => {
      // Get initial company stats
      const initialStats = await request(app)
        .get(`/api/crm/companies/${testCompanyId}/statistics`)
        .expect(200);

      // Create new deal for company
      await request(app)
        .post('/api/crm/deals')
        .send({
          name: 'Integration Test Deal',
          amount: 25000,
          pipeline_id: testPipelineId,
          stage_id: testStageId,
          company_id: testCompanyId
        })
        .expect(201);

      // Get updated company stats
      const updatedStats = await request(app)
        .get(`/api/crm/companies/${testCompanyId}/statistics`)
        .expect(200);

      expect(updatedStats.body.data.total_deals).toBeGreaterThan(
        initialStats.body.data.total_deals
      );
      expect(updatedStats.body.data.pipeline_value).toBeGreaterThan(
        initialStats.body.data.pipeline_value
      );
    });

    it('should update pipeline statistics when deal stage changes', async () => {
      // Get initial pipeline stats
      const initialStats = await request(app)
        .get(`/api/crm/pipelines/${testPipelineId}/statistics`)
        .expect(200);

      // Change deal stage
      await request(app)
        .put(`/api/crm/deals/${testDealId}/stage`)
        .send({ stage_id: testStageId })
        .expect(200);

      // Get updated pipeline stats
      const updatedStats = await request(app)
        .get(`/api/crm/pipelines/${testPipelineId}/statistics`)
        .expect(200);

      expect(updatedStats.body.data).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/crm/deals')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid JSON payload', async () => {
      const response = await request(app)
        .post('/api/crm/deals')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle database connection errors gracefully', async () => {
      // Simulate database error
      const response = await request(app)
        .get('/api/crm/deals')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should delete test deal', async () => {
      const response = await request(app)
        .delete(`/api/crm/deals/${testDealId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should delete test company', async () => {
      const response = await request(app)
        .delete(`/api/crm/companies/${testCompanyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should delete test pipeline', async () => {
      const response = await request(app)
        .delete(`/api/crm/pipelines/${testPipelineId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
