#!/usr/bin/env node

/**
 * Generate Placeholder Thumbnail Images
 * 
 * Creates SVG placeholder thumbnails for all templates that don't have images yet.
 * These can be replaced with actual screenshots later.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Color schemes for different industries
const industryColors = {
  'real-estate': { bg: '#1e3a8a', text: '#ffffff', accent: '#3b82f6' },
  'restaurant': { bg: '#dc2626', text: '#ffffff', accent: '#f87171' },
  'healthcare': { bg: '#059669', text: '#ffffff', accent: '#34d399' },
  'technology': { bg: '#7c3aed', text: '#ffffff', accent: '#a78bfa' },
  'education': { bg: '#ea580c', text: '#ffffff', accent: '#fb923c' },
  'retail': { bg: '#db2777', text: '#ffffff', accent: '#f472b6' },
  'finance': { bg: '#0891b2', text: '#ffffff', accent: '#22d3ee' },
  'legal': { bg: '#1f2937', text: '#ffffff', accent: '#6b7280' },
  'default': { bg: '#6366f1', text: '#ffffff', accent: '#818cf8' }
};

function getColorScheme(industry) {
  const normalized = industry.toLowerCase().replace(/[^a-z]/g, '-');
  return industryColors[normalized] || industryColors.default;
}

function generateSVG(template) {
  const colors = getColorScheme(template.industry);
  const width = 800;
  const height = 600;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${colors.bg}"/>
  
  <!-- Accent bar -->
  <rect x="0" y="0" width="${width}" height="80" fill="${colors.accent}" opacity="0.3"/>
  
  <!-- Grid pattern -->
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${colors.text}" stroke-width="0.5" opacity="0.1"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  
  <!-- Template name -->
  <text x="${width/2}" y="200" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
        fill="${colors.text}" text-anchor="middle">${escapeXML(template.name)}</text>
  
  <!-- Industry badge -->
  <rect x="${width/2 - 100}" y="240" width="200" height="40" rx="20" fill="${colors.accent}"/>
  <text x="${width/2}" y="267" font-family="Arial, sans-serif" font-size="18" 
        fill="${colors.text}" text-anchor="middle">${escapeXML(template.industry)}</text>
  
  <!-- Style variant -->
  <text x="${width/2}" y="320" font-family="Arial, sans-serif" font-size="24" 
        fill="${colors.text}" text-anchor="middle" opacity="0.8">${escapeXML(template.style_variant)} Style</text>
  
  <!-- Decorative elements -->
  <circle cx="100" cy="500" r="60" fill="${colors.accent}" opacity="0.2"/>
  <circle cx="700" cy="100" r="80" fill="${colors.accent}" opacity="0.15"/>
  <circle cx="650" cy="520" r="50" fill="${colors.accent}" opacity="0.25"/>
  
  <!-- Footer -->
  <text x="${width/2}" y="560" font-family="Arial, sans-serif" font-size="16" 
        fill="${colors.text}" text-anchor="middle" opacity="0.6">Digitpen Hub Suite Template</text>
</svg>`;
}

function escapeXML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generatePlaceholders() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🎨 Generating placeholder thumbnails...\n');

    // Create thumbnails directory if it doesn't exist
    const thumbnailsDir = path.join(__dirname, '../../frontend/public/templates');
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
      console.log(`✅ Created directory: ${thumbnailsDir}\n`);
    }

    // Get all templates
    const { rows: templates } = await pool.query(
      'SELECT id, name, industry, style_variant FROM builder_templates ORDER BY name'
    );

    console.log(`Found ${templates.length} templates\n`);

    let generated = 0;
    let skipped = 0;

    for (const template of templates) {
      const filename = `${template.id}.svg`;
      const filepath = path.join(thumbnailsDir, filename);
      
      // Skip if file already exists
      if (fs.existsSync(filepath)) {
        skipped++;
        continue;
      }

      // Generate SVG
      const svg = generateSVG(template);
      fs.writeFileSync(filepath, svg, 'utf8');
      
      generated++;
      if (generated % 50 === 0) {
        console.log(`Generated ${generated} thumbnails...`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Generated: ${generated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${templates.length}`);

    // Update database with thumbnail URLs
    console.log(`\n🔄 Updating database with thumbnail URLs...`);
    
    const updateResult = await pool.query(`
      UPDATE builder_templates 
      SET thumbnail_url = '/templates/' || id || '.svg',
          updated_at = now()
      WHERE thumbnail_url LIKE '/templates/%thumb.jpg'
      RETURNING id
    `);

    console.log(`✅ Updated ${updateResult.rowCount} template records in database`);
    console.log('\n✅ Placeholder thumbnails generated successfully!');

  } catch (error) {
    console.error('❌ Error generating placeholders:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
generatePlaceholders();
