/**
 * Master Seed Script: All Components
 * Runs all component seeding scripts in sequence
 * 
 * Usage: node scripts/seed-all-components.js
 */

require('dotenv').config();

async function seedAllComponents() {
  console.log('🌱 Starting complete component library seeding...\n');
  console.log('═'.repeat(60));
  
  const scripts = [
    { name: 'Hero Components', file: './seed-hero-components.js' },
    { name: 'Feature Components', file: './seed-feature-components.js' },
    { name: 'CTA Components', file: './seed-cta-components.js' },
    { name: 'Footer Components', file: './seed-footer-components.js' },
    { name: 'Testimonial Components', file: './seed-testimonial-components.js' }
  ];

  let totalSuccess = 0;
  let totalErrors = 0;
  const results = [];

  for (const script of scripts) {
    console.log(`\n📦 Seeding ${script.name}...`);
    console.log('─'.repeat(60));
    
    try {
      const { [Object.keys(require(script.file))[0]]: seedFunction } = require(script.file);
      
      // Run the seeding function
      await seedFunction();
      
      results.push({ name: script.name, status: '✅ Success' });
      console.log(`✅ ${script.name} completed successfully`);
    } catch (err) {
      results.push({ name: script.name, status: '❌ Failed', error: err.message });
      console.error(`❌ ${script.name} failed:`, err.message);
      totalErrors++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 SEEDING SUMMARY');
  console.log('═'.repeat(60));
  
  results.forEach(result => {
    console.log(`${result.status.padEnd(15)} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Successfully seeded: ${results.filter(r => r.status.includes('Success')).length}/${scripts.length} categories`);
  console.log(`📦 Total components: ~${scripts.length * 5} premium components`);
  
  if (totalErrors > 0) {
    console.log(`⚠️  Errors encountered: ${totalErrors}`);
  }
  
  console.log('═'.repeat(60));
  console.log('\n🎉 Component library seeding complete!');
  console.log('💡 Your Website Builder now has a full library of premium components.');
  console.log('🚀 Users can start building beautiful pages immediately!\n');
  
  process.exit(totalErrors > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  seedAllComponents().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { seedAllComponents };
