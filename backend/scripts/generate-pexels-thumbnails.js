#!/usr/bin/env node

/**
 * Generate Real Thumbnails from Pexels API
 * 
 * Fetches relevant images from Pexels for each template based on industry/category
 * and downloads them to replace SVG placeholders.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const { Pool } = require('pg');
const { firstImage } = require('../src/utils/pexels');

// Map industries to Pexels search queries
const industrySearchQueries = {
  'real-estate': 'modern house architecture',
  'restaurant': 'restaurant interior dining',
  'healthcare': 'medical clinic hospital',
  'technology': 'technology office workspace',
  'education': 'classroom learning students',
  'retail': 'retail store shopping',
  'finance': 'finance business office',
  'legal': 'law office professional',
  'fitness': 'gym fitness workout',
  'beauty': 'beauty salon spa',
  'automotive': 'car dealership showroom',
  'construction': 'construction building site',
  'consulting': 'business meeting office',
  'photography': 'photography studio camera',
  'design': 'design studio creative',
  'marketing': 'marketing team office',
  'hotel': 'hotel luxury interior',
  'travel': 'travel destination vacation',
  'food': 'food restaurant kitchen',
  'fashion': 'fashion boutique clothing',
  'jewelry': 'jewelry store luxury',
  'furniture': 'furniture showroom modern',
  'sporting-goods': 'sports equipment store',
  'music': 'music studio instruments',
  'baby-kids': 'children toys store',
  'crafts': 'craft supplies creative',
  'collectibles': 'collectibles vintage store',
  'wholesale': 'warehouse distribution',
  'manufacturing': 'factory manufacturing',
  'agriculture': 'farm agriculture field',
  'default': 'modern business office'
};

function getSearchQuery(template) {
  const industry = template.industry.toLowerCase().replace(/[^a-z]/g, '-');
  return industrySearchQueries[industry] || 
         industrySearchQueries[template.category] || 
         `${template.industry} business` ||
         industrySearchQueries.default;
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function generatePexelsThumbnails() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🖼️  Generating real thumbnails from Pexels API...\n');

    // Check if Pexels API keys are configured
    const hasKeys = [1, 2, 3, 4, 5, 6, 7].some(n => process.env[`PEXELS_API_KEY_${n}`]);
    if (!hasKeys) {
      console.error('❌ No PEXELS_API_KEY_* environment variables found!');
      console.log('Please configure at least one PEXELS_API_KEY_1 in your .env file');
      process.exit(1);
    }

    // Create thumbnails directory
    const thumbnailsDir = path.join(__dirname, '../../frontend/public/templates');
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

    // Get all templates
    const { rows: templates } = await pool.query(
      'SELECT id, name, industry, category, style_variant FROM builder_templates ORDER BY name'
    );

    console.log(`Found ${templates.length} templates\n`);
    console.log('Fetching images from Pexels (this may take a while)...\n');

    let downloaded = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      const filename = `${template.id}.jpg`;
      const filepath = path.join(thumbnailsDir, filename);
      
      // Skip if JPG already exists
      if (fs.existsSync(filepath)) {
        skipped++;
        continue;
      }

      try {
        // Get search query for this template
        const query = getSearchQuery(template);
        
        // Fetch image from Pexels
        const image = await firstImage(query, { orientation: 'landscape' });
        
        if (!image) {
          console.log(`⚠️  No image found for: ${template.name} (${query})`);
          failed++;
          continue;
        }

        // Download the image
        await downloadImage(image.url, filepath);
        
        downloaded++;
        if (downloaded % 10 === 0) {
          console.log(`Downloaded ${downloaded}/${templates.length - skipped} images...`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Failed for ${template.name}:`, error.message);
        failed++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Downloaded: ${downloaded}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${templates.length}`);

    if (downloaded > 0) {
      // Update database with new thumbnail URLs
      console.log(`\n🔄 Updating database with new thumbnail URLs...`);
      
      const updateResult = await pool.query(`
        UPDATE builder_templates 
        SET thumbnail_url = '/templates/' || id || '.jpg',
            updated_at = now()
        WHERE EXISTS (
          SELECT 1 FROM unnest(ARRAY[id::text]) 
          WHERE true
        )
        RETURNING id
      `);

      console.log(`✅ Updated ${updateResult.rowCount} template records in database`);
    }

    console.log('\n✅ Pexels thumbnail generation complete!');

  } catch (error) {
    console.error('❌ Error generating Pexels thumbnails:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
generatePexelsThumbnails();
