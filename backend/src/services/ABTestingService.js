const BaseService = require('./base/BaseService');
const { trackActivity } = require('../utils/activityTracker');

/**
 * ABTestingService - Handles A/B split testing routing algorithms and statistics calculations (VWO/Optimizely benchmark)
 */
class ABTestingService extends BaseService {
  constructor(repository) {
    super(repository, { serviceName: 'ABTestingService' });
  }

  // ==================== EXPERIMENTS ====================

  async listExperiments(orgId, filters) {
    return this.repository.findExperiments(orgId, filters);
  }

  async getExperiment(id, orgId) {
    const experiment = await this.repository.findExperimentById(id, orgId);
    if (!experiment) throw new Error('A/B Experiment not found');
    
    // Attach variations
    const variations = await this.repository.findVariations(id);
    return {
      ...experiment,
      variations
    };
  }

  async createExperiment(data, orgId, userId) {
    try {
      const experiment = await this.repository.createExperiment(data, orgId);

      // Seed standard default Control A and Variant B variations (Benchmark industry standard)
      const varA = await this.repository.createVariation({
        experiment_id: experiment.id,
        name: 'Control (Variation A)',
        content_changes: data.content_changes_a || { headline: 'Welcome to our shop!' },
        traffic_weight: 100 - (data.traffic_split !== undefined ? data.traffic_split : 50)
      });

      const varB = await this.repository.createVariation({
        experiment_id: experiment.id,
        name: 'Treatment (Variation B)',
        content_changes: data.content_changes_b || { headline: 'Get 20% off today!' },
        traffic_weight: data.traffic_split !== undefined ? data.traffic_split : 50
      });

      // Log Activity
      await trackActivity(orgId, userId, 'ab_testing.created', {
        description: `New A/B experiment "${experiment.name}" created with 50/50 split variants seeded.`,
        metadata: { experimentId: experiment.id }
      });

      return {
        ...experiment,
        variations: [varA, varB]
      };
    } catch (error) {
      this.logger.error('ABTestingService: Error creating experiment', { data, orgId, error: error.message });
      throw error;
    }
  }

  async updateExperiment(id, data, orgId) {
    const experiment = await this.repository.findExperimentById(id, orgId);
    if (!experiment) throw new Error('Experiment not found');
    return this.repository.updateExperiment(id, { ...experiment, ...data }, orgId);
  }

  async deleteExperiment(id, orgId) {
    const experiment = await this.repository.findExperimentById(id, orgId);
    if (!experiment) throw new Error('Experiment not found');
    return this.repository.delete(id, orgId);
  }

  // ==================== VARIATIONS ====================

  async createVariation(experimentId, data, orgId) {
    const experiment = await this.repository.findExperimentById(experimentId, orgId);
    if (!experiment) throw new Error('Experiment not found');
    return this.repository.createVariation({ ...data, experiment_id: experimentId });
  }

  async updateVariation(id, experimentId, data, orgId) {
    const experiment = await this.repository.findExperimentById(experimentId, orgId);
    if (!experiment) throw new Error('Experiment not found');
    return this.repository.updateVariation(id, data);
  }

  async deleteVariation(id, experimentId, orgId) {
    const experiment = await this.repository.findExperimentById(experimentId, orgId);
    if (!experiment) throw new Error('Experiment not found');
    return this.repository.deleteVariation(id);
  }

  // ==================== LIVE TRAFFIC ROUTING ====================

  /**
   * Route user request to a variation based on traffic weight distribution
   */
  async routeTraffic(experimentId) {
    const variations = await this.repository.findVariations(experimentId);
    if (!variations || variations.length === 0) {
      throw new Error('No variations found for routing A/B traffic');
    }

    // Split logic: standard cumulative probability range
    const roll = Math.floor(Math.random() * 100);
    let cumulativeWeight = 0;
    let selected = variations[0];

    for (const v of variations) {
      cumulativeWeight += v.traffic_weight;
      if (roll < cumulativeWeight) {
        selected = v;
        break;
      }
    }

    // Increment view in DB asynchronously
    await this.repository.incrementViews(experimentId, selected.id);

    return {
      variation_id: selected.id,
      name: selected.name,
      content_changes: selected.content_changes
    };
  }

  /**
   * Record conversion goal event hit
   */
  async recordConversion(experimentId, variationId) {
    await this.repository.incrementConversions(experimentId, variationId);
    return { success: true };
  }

  // ==================== ANALYTICS & STATISTICAL SIGNIFICANCE ====================

  /**
   * Z-Score statistical significance calculators
   */
  calculateSignificance(viewsA, convsA, viewsB, convsB) {
    if (viewsA === 0 || viewsB === 0) {
      return { pValue: 1.0, confidence: 0, significant: false };
    }

    const rateA = convsA / viewsA;
    const rateB = convsB / viewsB;

    // Combined proportion
    const pCombined = (convsA + convsB) / (viewsA + viewsB);
    if (pCombined === 0 || pCombined === 1) {
      return { pValue: 1.0, confidence: 0, significant: false };
    }

    // Standard error
    const se = Math.sqrt(pCombined * (1 - pCombined) * (1 / viewsA + 1 / viewsB));
    
    // Z-Score
    const zScore = (rateB - rateA) / se;

    // Convert Z to P-value (approximate normcdf)
    const t = 1 / (1 + 0.2316419 * Math.abs(zScore));
    const d = 0.3989423 * Math.exp(-zScore * zScore / 2);
    const pApprox = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    const pValue = zScore >= 0 ? pApprox : 1 - pApprox;

    const confidence = (1 - pValue) * 100;
    const significant = confidence >= 95.0; // 95% threshold standard

    return {
      pValue: Number(pValue.toFixed(4)),
      confidence: Number(confidence.toFixed(2)),
      significant
    };
  }

  async getExecutiveStats(experimentId, orgId) {
    const experiment = await this.repository.findExperimentById(experimentId, orgId);
    if (!experiment) throw new Error('Experiment not found');

    const variations = await this.repository.findVariations(experimentId);
    const timeline = await this.repository.getTimeline(experimentId);

    // Calculate rates and improvements compared to variation A (first in list as control)
    const enrichedVariations = variations.map((v, idx) => {
      const cr = v.views > 0 ? (v.conversions / v.views) * 100 : 0;
      let improvement = 0;

      if (idx > 0 && variations[0].views > 0) {
        const crControl = (variations[0].conversions / variations[0].views) * 100;
        if (crControl > 0) {
          improvement = ((cr - crControl) / crControl) * 100;
        }
      }

      return {
        ...v,
        conversion_rate: Number(cr.toFixed(2)),
        improvement: Number(improvement.toFixed(2))
      };
    });

    // Statistical significance details (B vs A)
    let statsReport = { pValue: 1.0, confidence: 0, significant: false };
    if (enrichedVariations.length >= 2) {
      const control = enrichedVariations[0];
      const variant = enrichedVariations[1];
      statsReport = this.calculateSignificance(
        control.views, control.conversions,
        variant.views, variant.conversions
      );
    }

    return {
      experiment,
      variations: enrichedVariations,
      timeline,
      stats: statsReport
    };
  }
}

module.exports = ABTestingService;
