/**
 * Week 2 - Stats/Metrics Components
 * 10 professional statistics display components
 * 
 * Usage: node scripts/seed-week2-stats.js
 */

require('dotenv').config();
const db = require('../src/db');

const CATEGORIES = {
  STATS: 'stats'
};

function createComponent(name, description, category, blockType, html, css, schema, defaultProps, tags, js = null) {
  return {
    name,
    description,
    category,
    block_type: blockType,
    is_global: true,
    html: html.trim(),
    css: css.trim(),
    js,
    schema,
    default_props: defaultProps,
    tags,
    responsive_settings: {
      mobile: { fontSize: 'smaller', padding: 'reduced' },
      tablet: { fontSize: 'medium', padding: 'normal' }
    }
  };
}

// STATS COMPONENTS (10 total)
const statsComponents = [
  createComponent(
    'Stats - Simple Grid',
    'Clean 4-column statistics grid',
    CATEGORIES.STATS,
    'stats',
    `<section class="stats-simple">
      <div class="stats-container">
        <div class="stat-item">
          <div class="stat-value">{{stat1Value}}</div>
          <div class="stat-label">{{stat1Label}}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{stat2Value}}</div>
          <div class="stat-label">{{stat2Label}}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{stat3Value}}</div>
          <div class="stat-label">{{stat3Label}}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{stat4Value}}</div>
          <div class="stat-label">{{stat4Label}}</div>
        </div>
      </div>
    </section>`,
    `.stats-simple {
      padding: 4rem 2rem;
      background: white;
    }
    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 3rem;
    }
    .stat-item {
      text-align: center;
    }
    .stat-value {
      font-size: 3rem;
      font-weight: 700;
      color: #2563eb;
      margin-bottom: 0.5rem;
    }
    .stat-label {
      font-size: 1rem;
      color: #6b7280;
      font-weight: 500;
    }
    @media (max-width: 768px) {
      .stats-container {
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
      }
      .stat-value {
        font-size: 2rem;
      }
    }`,
    {
      stat1Value: { type: 'text', label: 'Stat 1 Value', default: '10K+' },
      stat1Label: { type: 'text', label: 'Stat 1 Label', default: 'Active Users' },
      stat2Value: { type: 'text', label: 'Stat 2 Value', default: '99%' },
      stat2Label: { type: 'text', label: 'Stat 2 Label', default: 'Satisfaction' },
      stat3Value: { type: 'text', label: 'Stat 3 Value', default: '50+' },
      stat3Label: { type: 'text', label: 'Stat 3 Label', default: 'Countries' },
      stat4Value: { type: 'text', label: 'Stat 4 Value', default: '24/7' },
      stat4Label: { type: 'text', label: 'Stat 4 Label', default: 'Support' }
    },
    {
      stat1Value: '10K+',
      stat1Label: 'Active Users',
      stat2Value: '99%',
      stat2Label: 'Satisfaction',
      stat3Value: '50+',
      stat3Label: 'Countries',
      stat4Value: '24/7',
      stat4Label: 'Support'
    },
    ['stats', 'metrics', 'grid', 'simple']
  ),

  createComponent(
    'Stats - With Icons',
    'Statistics with icon indicators',
    CATEGORIES.STATS,
    'stats',
    `<section class="stats-icons">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-value">{{stat1Value}}</div>
          <div class="stat-label">{{stat1Label}}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-value">{{stat2Value}}</div>
          <div class="stat-label">{{stat2Label}}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-value">{{stat3Value}}</div>
          <div class="stat-label">{{stat3Label}}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🚀</div>
          <div class="stat-value">{{stat4Value}}</div>
          <div class="stat-label">{{stat4Label}}</div>
        </div>
      </div>
    </section>`,
    `.stats-icons {
      padding: 4rem 2rem;
      background: #f9fafb;
    }
    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
    }
    .stat-card {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-4px);
    }
    .stat-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    }
    @media (max-width: 768px) {
      .stats-container {
        grid-template-columns: repeat(2, 1fr);
      }
    }`,
    {
      stat1Value: { type: 'text', label: 'Stat 1 Value', default: '150%' },
      stat1Label: { type: 'text', label: 'Stat 1 Label', default: 'Growth Rate' },
      stat2Value: { type: 'text', label: 'Stat 2 Value', default: '50K+' },
      stat2Label: { type: 'text', label: 'Stat 2 Label', default: 'Happy Clients' },
      stat3Value: { type: 'text', label: 'Stat 3 Value', default: '4.9/5' },
      stat3Label: { type: 'text', label: 'Stat 3 Label', default: 'Rating' },
      stat4Value: { type: 'text', label: 'Stat 4 Value', default: '100+' },
      stat4Label: { type: 'text', label: 'Stat 4 Label', default: 'Projects' }
    },
    {
      stat1Value: '150%',
      stat1Label: 'Growth Rate',
      stat2Value: '50K+',
      stat2Label: 'Happy Clients',
      stat3Value: '4.9/5',
      stat3Label: 'Rating',
      stat4Value: '100+',
      stat4Label: 'Projects'
    },
    ['stats', 'metrics', 'icons', 'cards']
  ),

  createComponent(
    'Stats - Dark Background',
    'Statistics on dark background with gradient',
    CATEGORIES.STATS,
    'stats',
    `<section class="stats-dark">
      <div class="stats-container">
        <div class="stat-item">
          <div class="stat-value">{{stat1Value}}</div>
          <div class="stat-label">{{stat1Label}}</div>
          <div class="stat-description">{{stat1Desc}}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{stat2Value}}</div>
          <div class="stat-label">{{stat2Label}}</div>
          <div class="stat-description">{{stat2Desc}}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{stat3Value}}</div>
          <div class="stat-label">{{stat3Label}}</div>
          <div class="stat-description">{{stat3Desc}}</div>
        </div>
      </div>
    </section>`,
    `.stats-dark {
      padding: 5rem 2rem;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
    }
    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4rem;
    }
    .stat-item {
      text-align: center;
    }
    .stat-value {
      font-size: 3.5rem;
      font-weight: 700;
      color: white;
      margin-bottom: 0.5rem;
    }
    .stat-label {
      font-size: 1.25rem;
      color: rgba(255,255,255,0.9);
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .stat-description {
      font-size: 0.875rem;
      color: rgba(255,255,255,0.7);
    }
    @media (max-width: 768px) {
      .stats-container {
        grid-template-columns: 1fr;
        gap: 3rem;
      }
    }`,
    {
      stat1Value: { type: 'text', label: 'Stat 1 Value', default: '2M+' },
      stat1Label: { type: 'text', label: 'Stat 1 Label', default: 'Downloads' },
      stat1Desc: { type: 'text', label: 'Stat 1 Description', default: 'Across all platforms' },
      stat2Value: { type: 'text', label: 'Stat 2 Value', default: '98%' },
      stat2Label: { type: 'text', label: 'Stat 2 Label', default: 'Uptime' },
      stat2Desc: { type: 'text', label: 'Stat 2 Description', default: 'Last 12 months' },
      stat3Value: { type: 'text', label: 'Stat 3 Value', default: '<1s' },
      stat3Label: { type: 'text', label: 'Stat 3 Label', default: 'Response Time' },
      stat3Desc: { type: 'text', label: 'Stat 3 Description', default: 'Average globally' }
    },
    {
      stat1Value: '2M+',
      stat1Label: 'Downloads',
      stat1Desc: 'Across all platforms',
      stat2Value: '98%',
      stat2Label: 'Uptime',
      stat2Desc: 'Last 12 months',
      stat3Value: '<1s',
      stat3Label: 'Response Time',
      stat3Desc: 'Average globally'
    },
    ['stats', 'metrics', 'dark', 'gradient']
  ),

  createComponent(
    'Stats - Bordered Cards',
    'Statistics in bordered card layout',
    CATEGORIES.STATS,
    'stats',
    `<section class="stats-bordered">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-number">{{stat1Value}}</div>
          <div class="stat-title">{{stat1Label}}</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{stat2Value}}</div>
          <div class="stat-title">{{stat2Label}}</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{stat3Value}}</div>
          <div class="stat-title">{{stat3Label}}</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{stat4Value}}</div>
          <div class="stat-title">{{stat4Label}}</div>
        </div>
      </div>
    </section>`,
    `.stats-bordered {
      padding: 4rem 2rem;
      background: white;
    }
    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
    }
    .stat-card {
      padding: 2.5rem 2rem;
      text-align: center;
      border: 2px solid #e5e7eb;
      border-right: none;
    }
    .stat-card:last-child {
      border-right: 2px solid #e5e7eb;
    }
    .stat-number {
      font-size: 3rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .stat-title {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    @media (max-width: 768px) {
      .stats-container {
        grid-template-columns: repeat(2, 1fr);
      }
      .stat-card {
        border-right: 2px solid #e5e7eb;
        border-bottom: none;
      }
      .stat-card:nth-child(2n) {
        border-right: 2px solid #e5e7eb;
      }
      .stat-card:nth-last-child(-n+2) {
        border-bottom: 2px solid #e5e7eb;
      }
    }`,
    {
      stat1Value: { type: 'text', label: 'Stat 1 Value', default: '500+' },
      stat1Label: { type: 'text', label: 'Stat 1 Label', default: 'Companies' },
      stat2Value: { type: 'text', label: 'Stat 2 Value', default: '1M+' },
      stat2Label: { type: 'text', label: 'Stat 2 Label', default: 'Users' },
      stat3Value: { type: 'text', label: 'Stat 3 Value', default: '95%' },
      stat3Label: { type: 'text', label: 'Stat 3 Label', default: 'Retention' },
      stat4Value: { type: 'text', label: 'Stat 4 Value', default: '4.8★' },
      stat4Label: { type: 'text', label: 'Stat 4 Label', default: 'Rating' }
    },
    {
      stat1Value: '500+',
      stat1Label: 'Companies',
      stat2Value: '1M+',
      stat2Label: 'Users',
      stat3Value: '95%',
      stat3Label: 'Retention',
      stat4Value: '4.8★',
      stat4Label: 'Rating'
    },
    ['stats', 'metrics', 'bordered', 'cards']
  ),

  createComponent(
    'Stats - With Progress Bars',
    'Statistics with visual progress indicators',
    CATEGORIES.STATS,
    'stats',
    `<section class="stats-progress">
      <div class="stats-container">
        <div class="stat-item">
          <div class="stat-header">
            <span class="stat-label">{{stat1Label}}</span>
            <span class="stat-value">{{stat1Value}}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {{stat1Progress}}%"></div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-header">
            <span class="stat-label">{{stat2Label}}</span>
            <span class="stat-value">{{stat2Value}}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {{stat2Progress}}%"></div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-header">
            <span class="stat-label">{{stat3Label}}</span>
            <span class="stat-value">{{stat3Value}}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {{stat3Progress}}%"></div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-header">
            <span class="stat-label">{{stat4Label}}</span>
            <span class="stat-value">{{stat4Value}}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {{stat4Progress}}%"></div>
          </div>
        </div>
      </div>
    </section>`,
    `.stats-progress {
      padding: 4rem 2rem;
      background: #f9fafb;
    }
    .stats-container {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .stat-item {
      background: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    }
    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
    }
    .progress-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
      transition: width 1s ease;
    }`,
    {
      stat1Label: { type: 'text', label: 'Stat 1 Label', default: 'Customer Satisfaction' },
      stat1Value: { type: 'text', label: 'Stat 1 Value', default: '98%' },
      stat1Progress: { type: 'number', label: 'Stat 1 Progress', default: 98 },
      stat2Label: { type: 'text', label: 'Stat 2 Label', default: 'Project Completion' },
      stat2Value: { type: 'text', label: 'Stat 2 Value', default: '95%' },
      stat2Progress: { type: 'number', label: 'Stat 2 Progress', default: 95 },
      stat3Label: { type: 'text', label: 'Stat 3 Label', default: 'Team Productivity' },
      stat3Value: { type: 'text', label: 'Stat 3 Value', default: '92%' },
      stat3Progress: { type: 'number', label: 'Stat 3 Progress', default: 92 },
      stat4Label: { type: 'text', label: 'Stat 4 Label', default: 'Code Quality' },
      stat4Value: { type: 'text', label: 'Stat 4 Value', default: '89%' },
      stat4Progress: { type: 'number', label: 'Stat 4 Progress', default: 89 }
    },
    {
      stat1Label: 'Customer Satisfaction',
      stat1Value: '98%',
      stat1Progress: 98,
      stat2Label: 'Project Completion',
      stat2Value: '95%',
      stat2Progress: 95,
      stat3Label: 'Team Productivity',
      stat3Value: '92%',
      stat3Progress: 92,
      stat4Label: 'Code Quality',
      stat4Value: '89%',
      stat4Progress: 89
    },
    ['stats', 'metrics', 'progress', 'bars']
  ),

  createComponent(
    'Stats - Minimal',
    'Minimal statistics display',
    CATEGORIES.STATS,
    'stats',
    `<section class="stats-minimal">
      <div class="stats-container">
        <div class="stat-group">
          <span class="stat-value">{{stat1Value}}</span>
          <span class="stat-label">{{stat1Label}}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-group">
          <span class="stat-value">{{stat2Value}}</span>
          <span class="stat-label">{{stat2Label}}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-group">
          <span class="stat-value">{{stat3Value}}</span>
          <span class="stat-label">{{stat3Label}}</span>
        </div>
      </div>
    </section>`,
    `.stats-minimal {
      padding: 3rem 2rem;
      background: white;
    }
    .stats-container {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 3rem;
    }
    .stat-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #111827;
    }
    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-divider {
      width: 1px;
      height: 60px;
      background: #e5e7eb;
    }
    @media (max-width: 768px) {
      .stats-container {
        flex-direction: column;
        gap: 2rem;
      }
      .stat-divider {
        width: 60px;
        height: 1px;
      }
    }`,
    {
      stat1Value: { type: 'text', label: 'Stat 1 Value', default: '10+' },
      stat1Label: { type: 'text', label: 'Stat 1 Label', default: 'Years' },
      stat2Value: { type: 'text', label: 'Stat 2 Value', default: '500+' },
      stat2Label: { type: 'text', label: 'Stat 2 Label', default: 'Projects' },
      stat3Value: { type: 'text', label: 'Stat 3 Value', default: '50+' },
      stat3Label: { type: 'text', label: 'Stat 3 Label', default: 'Awards' }
    },
    {
      stat1Value: '10+',
      stat1Label: 'Years',
      stat2Value: '500+',
      stat2Label: 'Projects',
      stat3Value: '50+',
      stat3Label: 'Awards'
    },
    ['stats', 'metrics', 'minimal', 'clean']
  ),

  createComponent(
    'Stats - Large Numbers',
    'Emphasis on large statistical numbers',
    CATEGORIES.STATS,
    'stats',
    `<section class="stats-large">
      <div class="stats-container">
        <div class="stats-header">
          <h2>{{heading}}</h2>
          <p>{{subheading}}</p>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{stat1Value}}</div>
            <div class="stat-label">{{stat1Label}}</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{stat2Value}}</div>
            <div class="stat-label">{{stat2Label}}</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{stat3Value}}</div>
            <div class="stat-label">{{stat3Label}}</div>
          </div>
        </div>
      </div>
    </section>`,
    `.stats-large {
      padding: 5rem 2rem;
      background: linear-gradient(to bottom, white 0%, #f9fafb 100%);
    }
    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .stats-header {
      text-align: center;
      margin-bottom: 4rem;
    }
    .stats-header h2 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1rem;
    }
    .stats-header p {
      font-size: 1.125rem;
      color: #6b7280;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4rem;
    }
    .stat-item {
      text-align: center;
    }
    .stat-number {
      font-size: 4.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
    }
    .stat-label {
      font-size: 1.125rem;
      color: #374151;
      font-weight: 500;
    }
    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 3rem;
      }
      .stat-number {
        font-size: 3rem;
      }
    }`,
    {
      heading: { type: 'text', label: 'Heading', default: 'Trusted by thousands' },
      subheading: { type: 'text', label: 'Subheading', default: 'Join the companies that rely on us every day' },
      stat1Value: { type: 'text', label: 'Stat 1 Value', default: '10M+' },
      stat1Label: { type: 'text', label: 'Stat 1 Label', default: 'Active Users' },
      stat2Value: { type: 'text', label: 'Stat 2 Value', default: '150+' },
      stat2Label: { type: 'text', label: 'Stat 2 Label', default: 'Countries' },
      stat3Value: { type: 'text', label: 'Stat 3 Value', default: '99.9%' },
      stat3Label: { type: 'text', label: 'Stat 3 Label', default: 'Uptime' }
    },
    {
      heading: 'Trusted by thousands',
      subheading: 'Join the companies that rely on us every day',
      stat1Value: '10M+',
      stat1Label: 'Active Users',
      stat2Value: '150+',
      stat2Label: 'Countries',
      stat3Value: '99.9%',
      stat3Label: 'Uptime'
    },
    ['stats', 'metrics', 'large', 'gradient']
  ),

  createComponent(
    'Stats - Compact',
    'Compact inline statistics',
    CATEGORIES.STATS,
    'stats',
    `<section class="stats-compact">
      <div class="stats-container">
        <div class="stat-inline">
          <strong>{{stat1Value}}</strong> {{stat1Label}}
        </div>
        <span class="stat-separator">•</span>
        <div class="stat-inline">
          <strong>{{stat2Value}}</strong> {{stat2Label}}
        </div>
        <span class="stat-separator">•</span>
        <div class="stat-inline">
          <strong>{{stat3Value}}</strong> {{stat3Label}}
        </div>
        <span class="stat-separator">•</span>
        <div class="stat-inline">
          <strong>{{stat4Value}}</strong> {{stat4Label}}
        </div>
      </div>
    </section>`,
    `.stats-compact {
      padding: 2rem;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }
    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 2rem;
      flex-wrap: wrap;
    }
    .stat-inline {
      font-size: 0.875rem;
      color: #6b7280;
    }
    .stat-inline strong {
      font-size: 1.125rem;
      color: #111827;
      font-weight: 700;
    }
    .stat-separator {
      color: #d1d5db;
      font-size: 1.25rem;
    }
    @media (max-width: 768px) {
      .stats-container {
        flex-direction: column;
        gap: 1rem;
      }
      .stat-separator {
        display: none;
      }
    }`,
    {
      stat1Value: { type: 'text', label: 'Stat 1 Value', default: '5,000+' },
      stat1Label: { type: 'text', label: 'Stat 1 Label', default: 'customers' },
      stat2Value: { type: 'text', label: 'Stat 2 Value', default: '99%' },
      stat2Label: { type: 'text', label: 'Stat 2 Label', default: 'satisfaction' },
      stat3Value: { type: 'text', label: 'Stat 3 Value', default: '24/7' },
      stat3Label: { type: 'text', label: 'Stat 3 Label', default: 'support' },
      stat4Value: { type: 'text', label: 'Stat 4 Value', default: '50+' },
      stat4Label: { type: 'text', label: 'Stat 4 Label', default: 'countries' }
    },
    {
      stat1Value: '5,000+',
      stat1Label: 'customers',
      stat2Value: '99%',
      stat2Label: 'satisfaction',
      stat3Value: '24/7',
      stat3Label: 'support',
      stat4Value: '50+',
      stat4Label: 'countries'
    },
    ['stats', 'metrics', 'compact', 'inline']
  ),

  createComponent(
    'Stats - Animated Counter',
    'Statistics with animated counting effect',
    CATEGORIES.STATS,
    'stats',
    `<section class="stats-animated">
      <div class="stats-container">
        <div class="stat-box">
          <div class="stat-icon">💰</div>
          <div class="stat-value" data-target="{{stat1Value}}">0</div>
          <div class="stat-label">{{stat1Label}}</div>
        </div>
        <div class="stat-box">
          <div class="stat-icon">👥</div>
          <div class="stat-value" data-target="{{stat2Value}}">0</div>
          <div class="stat-label">{{stat2Label}}</div>
        </div>
        <div class="stat-box">
          <div class="stat-icon">🌍</div>
          <div class="stat-value" data-target="{{stat3Value}}">0</div>
          <div class="stat-label">{{stat3Label}}</div>
        </div>
        <div class="stat-box">
          <div class="stat-icon">⚡</div>
          <div class="stat-value" data-target="{{stat4Value}}">0</div>
          <div class="stat-label">{{stat4Label}}</div>
        </div>
      </div>
    </section>`,
    `.stats-animated {
      padding: 5rem 2rem;
      background: white;
    }
    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 3rem;
    }
    .stat-box {
      text-align: center;
      padding: 2rem;
      border-radius: 1rem;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      transition: transform 0.3s;
    }
    .stat-box:hover {
      transform: translateY(-8px);
    }
    .stat-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .stat-value {
      font-size: 3rem;
      font-weight: 700;
      color: #2563eb;
      margin-bottom: 0.5rem;
    }
    .stat-label {
      font-size: 1rem;
      color: #6b7280;
      font-weight: 500;
    }
    @media (max-width: 768px) {
      .stats-container {
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
      }
    }`,
    {
      stat1Value: { type: 'text', label: 'Stat 1 Value', default: '$5M+' },
      stat1Label: { type: 'text', label: 'Stat 1 Label', default: 'Revenue' },
      stat2Value: { type: 'text', label: 'Stat 2 Value', default: '10K+' },
      stat2Label: { type: 'text', label: 'Stat 2 Label', default: 'Users' },
      stat3Value: { type: 'text', label: 'Stat 3 Value', default: '75+' },
      stat3Label: { type: 'text', label: 'Stat 3 Label', default: 'Countries' },
      stat4Value: { type: 'text', label: 'Stat 4 Value', default: '99.9%' },
      stat4Label: { type: 'text', label: 'Stat 4 Label', default: 'Uptime' }
    },
    {
      stat1Value: '$5M+',
      stat1Label: 'Revenue',
      stat2Value: '10K+',
      stat2Label: 'Users',
      stat3Value: '75+',
      stat3Label: 'Countries',
      stat4Value: '99.9%',
      stat4Label: 'Uptime'
    },
    ['stats', 'metrics', 'animated', 'counter'],
    `// Simple counter animation on scroll
    const animateCounters = () => {
      const counters = document.querySelectorAll('.stat-value[data-target]');
      counters.forEach(counter => {
        const target = counter.getAttribute('data-target');
        const numericTarget = parseInt(target.replace(/[^0-9]/g, ''));
        if (numericTarget) {
          let current = 0;
          const increment = numericTarget / 50;
          const timer = setInterval(() => {
            current += increment;
            if (current >= numericTarget) {
              counter.textContent = target;
              clearInterval(timer);
            } else {
              counter.textContent = Math.floor(current) + target.replace(/[0-9]/g, '');
            }
          }, 30);
        }
      });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', animateCounters);
    } else {
      animateCounters();
    }`
  ),

  createComponent(
    'Stats - Two Column',
    'Statistics in two-column layout with descriptions',
    CATEGORIES.STATS,
    'stats',
    `<section class="stats-two-col">
      <div class="stats-container">
        <div class="stat-row">
          <div class="stat-item">
            <div class="stat-number">{{stat1Value}}</div>
            <div class="stat-title">{{stat1Label}}</div>
            <div class="stat-desc">{{stat1Desc}}</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{stat2Value}}</div>
            <div class="stat-title">{{stat2Label}}</div>
            <div class="stat-desc">{{stat2Desc}}</div>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat-item">
            <div class="stat-number">{{stat3Value}}</div>
            <div class="stat-title">{{stat3Label}}</div>
            <div class="stat-desc">{{stat3Desc}}</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{stat4Value}}</div>
            <div class="stat-title">{{stat4Label}}</div>
            <div class="stat-desc">{{stat4Desc}}</div>
          </div>
        </div>
      </div>
    </section>`,
    `.stats-two-col {
      padding: 5rem 2rem;
      background: #f9fafb;
    }
    .stats-container {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 3rem;
    }
    .stat-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 3rem;
    }
    .stat-item {
      background: white;
      padding: 2.5rem;
      border-radius: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .stat-number {
      font-size: 3.5rem;
      font-weight: 700;
      color: #2563eb;
      margin-bottom: 0.75rem;
    }
    .stat-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .stat-desc {
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.6;
    }
    @media (max-width: 768px) {
      .stat-row {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
    }`,
    {
      stat1Value: { type: 'text', label: 'Stat 1 Value', default: '250+' },
      stat1Label: { type: 'text', label: 'Stat 1 Label', default: 'Enterprise Clients' },
      stat1Desc: { type: 'text', label: 'Stat 1 Description', default: 'Fortune 500 companies trust our platform' },
      stat2Value: { type: 'text', label: 'Stat 2 Value', default: '5M+' },
      stat2Label: { type: 'text', label: 'Stat 2 Label', default: 'API Calls Daily' },
      stat2Desc: { type: 'text', label: 'Stat 2 Description', default: 'Handling millions of requests with 99.9% uptime' },
      stat3Value: { type: 'text', label: 'Stat 3 Value', default: '<50ms' },
      stat3Label: { type: 'text', label: 'Stat 3 Label', default: 'Response Time' },
      stat3Desc: { type: 'text', label: 'Stat 3 Description', default: 'Lightning-fast performance across the globe' },
      stat4Value: { type: 'text', label: 'Stat 4 Value', default: '24/7' },
      stat4Label: { type: 'text', label: 'Stat 4 Label', default: 'Support Available' },
      stat4Desc: { type: 'text', label: 'Stat 4 Description', default: 'Expert team ready to help anytime, anywhere' }
    },
    {
      stat1Value: '250+',
      stat1Label: 'Enterprise Clients',
      stat1Desc: 'Fortune 500 companies trust our platform',
      stat2Value: '5M+',
      stat2Label: 'API Calls Daily',
      stat2Desc: 'Handling millions of requests with 99.9% uptime',
      stat3Value: '<50ms',
      stat3Label: 'Response Time',
      stat3Desc: 'Lightning-fast performance across the globe',
      stat4Value: '24/7',
      stat4Label: 'Support Available',
      stat4Desc: 'Expert team ready to help anytime, anywhere'
    },
    ['stats', 'metrics', 'two-column', 'descriptions']
  )
];

// Seeding function
async function seedComponents() {
  console.log('\n🌱 Starting Stats components seeding...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  try {
    for (const component of statsComponents) {
      try {
        const componentData = {
          block_type: component.block_type,
          html: component.html,
          css: component.css,
          js: component.js,
          schema: component.schema,
          default_props: component.default_props,
          responsive_settings: component.responsive_settings
        };
        
        const result = await db.query(
          `INSERT INTO builder_components 
           (name, description, category, is_global, component_data, tags)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            component.name,
            component.description,
            component.category,
            component.is_global,
            JSON.stringify(componentData),
            component.tags
          ]
        );
        
        console.log(`✅ Created: ${component.name} (ID: ${result.rows[0].id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error creating ${component.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Stats Components Seeding Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total: ${statsComponents.length}`);
    
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedComponents();
}

module.exports = { statsComponents, seedComponents };
