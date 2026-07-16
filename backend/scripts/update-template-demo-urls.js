#!/usr/bin/env node

/**
 * Update Template Demo URLs
 * 
 * Updates all template demo URLs to point to the new preview system
 * instead of placeholder external URLs.
 */

require('dotenv').config();
const { Pool } = require('pg');

async function updateDemoUrls() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🔄 Updating template demo URLs...\n');

    // Get all templates
    const { rows: templates } = await pool.query(
      'SELECT id, name, demo_url FROM builder_templates ORDER BY id'
    );

    console.log(`Found ${templates.length} templates to update\n`);

    let updated = 0;
    let skipped = 0;

    for (const template of templates) {
      const newDemoUrl = `/templates/preview/${template.id}`;
      
      // Only update if the current URL is a placeholder
      if (template.demo_url && template.demo_url.includes('demo.digitpenhub.com')) {
        await pool.query(
          'UPDATE builder_templates SET demo_url = $1, updated_at = now() WHERE id = $2',
          [newDemoUrl, template.id]
        );
        console.log(`✅ Updated: ${template.name} -> ${newDemoUrl}`);
        updated++;
      } else {
        console.log(`⏭️  Skipped: ${template.name} (already has custom URL or no URL)`);
        skipped++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${templates.length}`);
    console.log('\n✅ Demo URLs updated successfully!');

  } catch (error) {
    console.error('❌ Error updating demo URLs:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
updateDemoUrls();
