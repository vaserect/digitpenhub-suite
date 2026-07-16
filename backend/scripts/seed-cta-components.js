/**
 * Seed Script: CTA Components
 * Creates 5 premium call-to-action components with different styles
 * 
 * Usage: node scripts/seed-cta-components.js
 */

require('dotenv').config();
const db = require('../src/db');

const ctaComponents = [
  {
    name: 'CTA - Centered with Button',
    description: 'Centered CTA with gradient background and primary button',
    category: 'cta',
    is_global: true,
    is_active: true,
    tags: ['cta', 'centered', 'gradient', 'button'],
    component_data: {
      type: 'cta',
      variant: 'centered',
      html: `<section class="cta-centered"><div class="cta-container"><h2 class="cta-title">{{title}}</h2><p class="cta-subtitle">{{subtitle}}</p><div class="cta-buttons"><a href="{{primaryLink}}" class="btn-primary">{{primaryText}}</a><a href="{{secondaryLink}}" class="btn-secondary">{{secondaryText}}</a></div></div></section>`,
      css: `.cta-centered{padding:6rem 2rem;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);text-align:center}.cta-container{max-width:800px;margin:0 auto;color:white}.cta-title{font-size:3rem;font-weight:900;margin-bottom:1.5rem;line-height:1.2}.cta-subtitle{font-size:1.5rem;margin-bottom:2.5rem;opacity:.95;line-height:1.6}.cta-buttons{display:flex;justify-content:center;gap:1rem}.btn-primary{padding:1.25rem 3rem;background:white;color:#667eea;font-weight:700;font-size:1.125rem;border-radius:.5rem;text-decoration:none;transition:transform .2s,box-shadow .2s}.btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(0,0,0,.2)}.btn-secondary{padding:1.25rem 3rem;background:transparent;color:white;font-weight:700;font-size:1.125rem;border:2px solid white;border-radius:.5rem;text-decoration:none;transition:all .2s}.btn-secondary:hover{background:rgba(255,255,255,.1)}@media(max-width:640px){.cta-buttons{flex-direction:column}.btn-primary,.btn-secondary{width:100%}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Ready to Get Started?' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'Join thousands of satisfied customers today' },
        primaryText: { type: 'text', label: 'Primary Button', default: 'Start Free Trial' },
        primaryLink: { type: 'text', label: 'Primary Link', default: '#' },
        secondaryText: { type: 'text', label: 'Secondary Button', default: 'Learn More' },
        secondaryLink: { type: 'text', label: 'Secondary Link', default: '#' }
      },
      defaultProps: {
        title: 'Ready to Get Started?',
        subtitle: 'Join thousands of satisfied customers today',
        primaryText: 'Start Free Trial',
        primaryLink: '#',
        secondaryText: 'Learn More',
        secondaryLink: '#'
      }
    }
  },
  {
    name: 'CTA - Split with Image',
    description: 'Two-column CTA with content and image',
    category: 'cta',
    is_global: true,
    is_active: true,
    tags: ['cta', 'split', 'image', 'two-column'],
    component_data: {
      type: 'cta',
      variant: 'split',
      html: `<section class="cta-split"><div class="cta-split-container"><div class="cta-split-content"><h2 class="cta-split-title">{{title}}</h2><p class="cta-split-subtitle">{{subtitle}}</p><ul class="cta-split-features"><li>✓ {{feature1}}</li><li>✓ {{feature2}}</li><li>✓ {{feature3}}</li></ul><a href="{{ctaLink}}" class="btn-cta">{{ctaText}}</a></div><div class="cta-split-image"><img src="{{imageUrl}}" alt="{{imageAlt}}"/></div></div></section>`,
      css: `.cta-split{padding:6rem 2rem;background:#f9fafb}.cta-split-container{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}.cta-split-title{font-size:2.5rem;font-weight:800;color:#111827;margin-bottom:1rem}.cta-split-subtitle{font-size:1.25rem;color:#6b7280;margin-bottom:2rem;line-height:1.6}.cta-split-features{list-style:none;padding:0;margin:0 0 2rem 0}.cta-split-features li{padding:.75rem 0;color:#374151;font-size:1.125rem}.btn-cta{display:inline-block;padding:1rem 2.5rem;background:#3b82f6;color:white;font-weight:600;border-radius:.5rem;text-decoration:none;transition:background .2s}.btn-cta:hover{background:#2563eb}.cta-split-image img{width:100%;height:auto;border-radius:1rem;box-shadow:0 20px 50px rgba(0,0,0,.1)}@media(max-width:768px){.cta-split-container{grid-template-columns:1fr;gap:2rem}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Transform Your Business Today' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'Everything you need to succeed in one platform' },
        feature1: { type: 'text', label: 'Feature 1', default: 'No credit card required' },
        feature2: { type: 'text', label: 'Feature 2', default: 'Cancel anytime' },
        feature3: { type: 'text', label: 'Feature 3', default: '24/7 support' },
        ctaText: { type: 'text', label: 'Button Text', default: 'Get Started Free' },
        ctaLink: { type: 'text', label: 'Button Link', default: '#' },
        imageUrl: { type: 'image', label: 'Image URL', default: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600' },
        imageAlt: { type: 'text', label: 'Image Alt', default: 'CTA Image' }
      },
      defaultProps: {
        title: 'Transform Your Business Today',
        subtitle: 'Everything you need to succeed in one platform',
        feature1: 'No credit card required',
        feature2: 'Cancel anytime',
        feature3: '24/7 support',
        ctaText: 'Get Started Free',
        ctaLink: '#',
        imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600',
        imageAlt: 'CTA Image'
      }
    }
  },
  {
    name: 'CTA - Banner with Urgency',
    description: 'Compact banner CTA with urgency messaging',
    category: 'cta',
    is_global: true,
    is_active: true,
    tags: ['cta', 'banner', 'urgency', 'compact'],
    component_data: {
      type: 'cta',
      variant: 'banner',
      html: `<section class="cta-banner"><div class="cta-banner-container"><div class="cta-banner-content"><div class="cta-banner-badge">{{badge}}</div><h3 class="cta-banner-title">{{title}}</h3><p class="cta-banner-text">{{text}}</p></div><div class="cta-banner-action"><a href="{{ctaLink}}" class="btn-banner">{{ctaText}}</a></div></div></section>`,
      css: `.cta-banner{padding:2rem;background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%)}.cta-banner-container{max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;gap:2rem}.cta-banner-content{color:white}.cta-banner-badge{display:inline-block;padding:.5rem 1rem;background:rgba(255,255,255,.2);border-radius:2rem;font-size:.875rem;font-weight:600;margin-bottom:.75rem}.cta-banner-title{font-size:1.75rem;font-weight:800;margin-bottom:.5rem}.cta-banner-text{font-size:1rem;opacity:.95}.btn-banner{display:inline-block;padding:1rem 2.5rem;background:white;color:#f5576c;font-weight:700;border-radius:.5rem;text-decoration:none;white-space:nowrap;transition:transform .2s}.btn-banner:hover{transform:scale(1.05)}@media(max-width:768px){.cta-banner-container{flex-direction:column;text-align:center}.btn-banner{width:100%}}`,
      schema: {
        badge: { type: 'text', label: 'Badge', default: '⏰ Limited Time Offer' },
        title: { type: 'text', label: 'Title', default: 'Get 50% Off Your First Month' },
        text: { type: 'text', label: 'Text', default: 'Offer ends soon. Don\'t miss out!' },
        ctaText: { type: 'text', label: 'Button Text', default: 'Claim Offer' },
        ctaLink: { type: 'text', label: 'Button Link', default: '#' }
      },
      defaultProps: {
        badge: '⏰ Limited Time Offer',
        title: 'Get 50% Off Your First Month',
        text: 'Offer ends soon. Don\'t miss out!',
        ctaText: 'Claim Offer',
        ctaLink: '#'
      }
    }
  },
  {
    name: 'CTA - Card with Stats',
    description: 'CTA card with social proof statistics',
    category: 'cta',
    is_global: true,
    is_active: true,
    tags: ['cta', 'card', 'stats', 'social-proof'],
    component_data: {
      type: 'cta',
      variant: 'card-stats',
      html: `<section class="cta-card-stats"><div class="cta-card-container"><div class="cta-card"><h2 class="cta-card-title">{{title}}</h2><p class="cta-card-subtitle">{{subtitle}}</p><div class="cta-card-stats"><div class="stat"><div class="stat-value">{{stat1Value}}</div><div class="stat-label">{{stat1Label}}</div></div><div class="stat"><div class="stat-value">{{stat2Value}}</div><div class="stat-label">{{stat2Label}}</div></div><div class="stat"><div class="stat-value">{{stat3Value}}</div><div class="stat-label">{{stat3Label}}</div></div></div><a href="{{ctaLink}}" class="btn-card-cta">{{ctaText}}</a><p class="cta-card-note">{{note}}</p></div></div></section>`,
      css: `.cta-card-stats{padding:6rem 2rem;background:#f9fafb}.cta-card-container{max-width:800px;margin:0 auto}.cta-card{background:white;padding:4rem 3rem;border-radius:1.5rem;box-shadow:0 20px 60px rgba(0,0,0,.1);text-align:center}.cta-card-title{font-size:2.5rem;font-weight:800;color:#111827;margin-bottom:1rem}.cta-card-subtitle{font-size:1.25rem;color:#6b7280;margin-bottom:3rem;line-height:1.6}.cta-card-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;margin-bottom:3rem;padding:2rem 0;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb}.stat-value{font-size:2rem;font-weight:800;color:#3b82f6;margin-bottom:.5rem}.stat-label{font-size:.875rem;color:#6b7280;font-weight:500}.btn-card-cta{display:inline-block;padding:1.25rem 3rem;background:#3b82f6;color:white;font-weight:700;font-size:1.125rem;border-radius:.5rem;text-decoration:none;transition:background .2s}.btn-card-cta:hover{background:#2563eb}.cta-card-note{margin-top:1.5rem;font-size:.875rem;color:#9ca3af}@media(max-width:640px){.cta-card{padding:3rem 2rem}.cta-card-stats{grid-template-columns:1fr;gap:1.5rem}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Join Our Community' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'Trusted by thousands of professionals worldwide' },
        stat1Value: { type: 'text', label: 'Stat 1 Value', default: '50K+' },
        stat1Label: { type: 'text', label: 'Stat 1 Label', default: 'Active Users' },
        stat2Value: { type: 'text', label: 'Stat 2 Value', default: '99.9%' },
        stat2Label: { type: 'text', label: 'Stat 2 Label', default: 'Uptime' },
        stat3Value: { type: 'text', label: 'Stat 3 Value', default: '4.9/5' },
        stat3Label: { type: 'text', label: 'Stat 3 Label', default: 'Rating' },
        ctaText: { type: 'text', label: 'Button Text', default: 'Get Started Now' },
        ctaLink: { type: 'text', label: 'Button Link', default: '#' },
        note: { type: 'text', label: 'Note', default: 'No credit card required • Free 14-day trial' }
      },
      defaultProps: {
        title: 'Join Our Community',
        subtitle: 'Trusted by thousands of professionals worldwide',
        stat1Value: '50K+',
        stat1Label: 'Active Users',
        stat2Value: '99.9%',
        stat2Label: 'Uptime',
        stat3Value: '4.9/5',
        stat3Label: 'Rating',
        ctaText: 'Get Started Now',
        ctaLink: '#',
        note: 'No credit card required • Free 14-day trial'
      }
    }
  },
  {
    name: 'CTA - Newsletter Signup',
    description: 'Newsletter subscription CTA with email input',
    category: 'cta',
    is_global: true,
    is_active: true,
    tags: ['cta', 'newsletter', 'email', 'subscription'],
    component_data: {
      type: 'cta',
      variant: 'newsletter',
      html: `<section class="cta-newsletter"><div class="cta-newsletter-container"><div class="cta-newsletter-content"><h2 class="cta-newsletter-title">{{title}}</h2><p class="cta-newsletter-subtitle">{{subtitle}}</p><form class="cta-newsletter-form"><input type="email" placeholder="{{emailPlaceholder}}" class="newsletter-input"/><button type="submit" class="newsletter-submit">{{submitText}}</button></form><p class="cta-newsletter-note">{{note}}</p><div class="cta-newsletter-social"><span>{{socialText}}</span><div class="social-proof"><img src="https://i.pravatar.cc/32?img=1" alt="User" class="avatar"/><img src="https://i.pravatar.cc/32?img=2" alt="User" class="avatar"/><img src="https://i.pravatar.cc/32?img=3" alt="User" class="avatar"/><img src="https://i.pravatar.cc/32?img=4" alt="User" class="avatar"/><span class="social-count">{{socialCount}}</span></div></div></div></div></section>`,
      css: `.cta-newsletter{padding:6rem 2rem;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}.cta-newsletter-container{max-width:700px;margin:0 auto;text-align:center;color:white}.cta-newsletter-title{font-size:3rem;font-weight:900;margin-bottom:1rem;line-height:1.2}.cta-newsletter-subtitle{font-size:1.25rem;margin-bottom:2.5rem;opacity:.95;line-height:1.6}.cta-newsletter-form{display:flex;gap:.75rem;margin-bottom:1rem}.newsletter-input{flex:1;padding:1rem 1.5rem;border:none;border-radius:.5rem;font-size:1rem;outline:none}.newsletter-submit{padding:1rem 2.5rem;background:#111827;color:white;border:none;border-radius:.5rem;font-weight:700;cursor:pointer;transition:background .2s;white-space:nowrap}.newsletter-submit:hover{background:#1f2937}.cta-newsletter-note{font-size:.875rem;margin-bottom:2rem;opacity:.9}.cta-newsletter-social{display:flex;flex-direction:column;align-items:center;gap:.75rem;font-size:.875rem}.social-proof{display:flex;align-items:center;gap:.5rem}.avatar{width:32px;height:32px;border-radius:50%;border:2px solid white;margin-left:-.5rem}.avatar:first-child{margin-left:0}.social-count{font-weight:600}@media(max-width:640px){.cta-newsletter-form{flex-direction:column}.newsletter-input,.newsletter-submit{width:100%}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Stay in the Loop' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'Get the latest updates, tips, and exclusive offers delivered to your inbox' },
        emailPlaceholder: { type: 'text', label: 'Email Placeholder', default: 'Enter your email' },
        submitText: { type: 'text', label: 'Submit Button', default: 'Subscribe' },
        note: { type: 'text', label: 'Note', default: 'We respect your privacy. Unsubscribe at any time.' },
        socialText: { type: 'text', label: 'Social Text', default: 'Join our community:' },
        socialCount: { type: 'text', label: 'Social Count', default: '+10,000 subscribers' }
      },
      defaultProps: {
        title: 'Stay in the Loop',
        subtitle: 'Get the latest updates, tips, and exclusive offers delivered to your inbox',
        emailPlaceholder: 'Enter your email',
        submitText: 'Subscribe',
        note: 'We respect your privacy. Unsubscribe at any time.',
        socialText: 'Join our community:',
        socialCount: '+10,000 subscribers'
      }
    }
  }
];

async function seedCtaComponents() {
  console.log('🌱 Seeding CTA components...\n');
  
  try {
    let successCount = 0;
    let errorCount = 0;

    for (const component of ctaComponents) {
      try {
        await db.query(
          `INSERT INTO builder_components (
            name, description, category, is_global, is_active,
            component_data, tags
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT DO NOTHING`,
          [
            component.name,
            component.description,
            component.category,
            component.is_global,
            component.is_active,
            JSON.stringify(component.component_data),
            component.tags
          ]
        );
        successCount++;
        console.log(`✓ Created: ${component.name}`);
      } catch (err) {
        errorCount++;
        console.error(`✗ Failed to create ${component.name}:`, err.message);
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Success: ${successCount}/${ctaComponents.length}`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount}`);
    }
    
    await db.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedCtaComponents();
}

module.exports = { seedCtaComponents, ctaComponents };
