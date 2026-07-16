/**
 * Seed Script: Testimonial Components
 * Creates 5 premium testimonial/review components with different layouts
 * 
 * Usage: node scripts/seed-testimonial-components.js
 */

require('dotenv').config();
const db = require('../src/db');

const testimonialComponents = [
  {
    name: 'Testimonials - Grid Layout',
    description: 'Three-column grid of customer testimonials',
    category: 'testimonials',
    is_global: true,
    is_active: true,
    tags: ['testimonials', 'grid', 'reviews', 'social-proof'],
    component_data: {
      type: 'testimonials',
      variant: 'grid',
      html: `<section class="testimonials-grid"><div class="testimonials-container"><div class="testimonials-header"><h2 class="testimonials-title">{{title}}</h2><p class="testimonials-subtitle">{{subtitle}}</p></div><div class="testimonials-grid-layout"><div class="testimonial-card"><div class="testimonial-rating">★★★★★</div><p class="testimonial-text">"{{testimonial1Text}}"</p><div class="testimonial-author"><img src="{{testimonial1Avatar}}" alt="{{testimonial1Name}}" class="author-avatar"/><div class="author-info"><div class="author-name">{{testimonial1Name}}</div><div class="author-role">{{testimonial1Role}}</div></div></div></div><div class="testimonial-card"><div class="testimonial-rating">★★★★★</div><p class="testimonial-text">"{{testimonial2Text}}"</p><div class="testimonial-author"><img src="{{testimonial2Avatar}}" alt="{{testimonial2Name}}" class="author-avatar"/><div class="author-info"><div class="author-name">{{testimonial2Name}}</div><div class="author-role">{{testimonial2Role}}</div></div></div></div><div class="testimonial-card"><div class="testimonial-rating">★★★★★</div><p class="testimonial-text">"{{testimonial3Text}}"</p><div class="testimonial-author"><img src="{{testimonial3Avatar}}" alt="{{testimonial3Name}}" class="author-avatar"/><div class="author-info"><div class="author-name">{{testimonial3Name}}</div><div class="author-role">{{testimonial3Role}}</div></div></div></div></div></div></section>`,
      css: `.testimonials-grid{padding:6rem 2rem;background:#f9fafb}.testimonials-container{max-width:1200px;margin:0 auto}.testimonials-header{text-align:center;margin-bottom:4rem}.testimonials-title{font-size:2.5rem;font-weight:800;color:#111827;margin-bottom:1rem}.testimonials-subtitle{font-size:1.25rem;color:#6b7280;line-height:1.6}.testimonials-grid-layout{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem}.testimonial-card{background:white;padding:2rem;border-radius:1rem;box-shadow:0 4px 20px rgba(0,0,0,.08);transition:transform .2s,box-shadow .2s}.testimonial-card:hover{transform:translateY(-4px);box-shadow:0 8px 30px rgba(0,0,0,.12)}.testimonial-rating{color:#fbbf24;font-size:1.25rem;margin-bottom:1rem}.testimonial-text{color:#374151;line-height:1.6;margin-bottom:1.5rem;font-size:1rem}.testimonial-author{display:flex;align-items:center;gap:1rem}.author-avatar{width:48px;height:48px;border-radius:50%;object-fit:cover}.author-name{font-weight:600;color:#111827;font-size:.875rem}.author-role{color:#6b7280;font-size:.875rem}@media(max-width:1024px){.testimonials-grid-layout{grid-template-columns:1fr}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'What Our Customers Say' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'Don\'t just take our word for it - hear from our satisfied customers' },
        testimonial1Text: { type: 'textarea', label: 'Testimonial 1', default: 'This product has completely transformed how we work. The team is responsive and the features are exactly what we needed.' },
        testimonial1Name: { type: 'text', label: 'Name 1', default: 'Sarah Johnson' },
        testimonial1Role: { type: 'text', label: 'Role 1', default: 'CEO, TechCorp' },
        testimonial1Avatar: { type: 'image', label: 'Avatar 1', default: 'https://i.pravatar.cc/96?img=1' },
        testimonial2Text: { type: 'textarea', label: 'Testimonial 2', default: 'Outstanding service and support. We saw results within the first week of implementation. Highly recommended!' },
        testimonial2Name: { type: 'text', label: 'Name 2', default: 'Michael Chen' },
        testimonial2Role: { type: 'text', label: 'Role 2', default: 'CTO, StartupXYZ' },
        testimonial2Avatar: { type: 'image', label: 'Avatar 2', default: 'https://i.pravatar.cc/96?img=2' },
        testimonial3Text: { type: 'textarea', label: 'Testimonial 3', default: 'The best investment we\'ve made this year. Simple to use, powerful features, and excellent ROI.' },
        testimonial3Name: { type: 'text', label: 'Name 3', default: 'Emily Rodriguez' },
        testimonial3Role: { type: 'text', label: 'Role 3', default: 'Marketing Director, GrowthCo' },
        testimonial3Avatar: { type: 'image', label: 'Avatar 3', default: 'https://i.pravatar.cc/96?img=3' }
      },
      defaultProps: {
        title: 'What Our Customers Say',
        subtitle: 'Don\'t just take our word for it - hear from our satisfied customers',
        testimonial1Text: 'This product has completely transformed how we work. The team is responsive and the features are exactly what we needed.',
        testimonial1Name: 'Sarah Johnson',
        testimonial1Role: 'CEO, TechCorp',
        testimonial1Avatar: 'https://i.pravatar.cc/96?img=1',
        testimonial2Text: 'Outstanding service and support. We saw results within the first week of implementation. Highly recommended!',
        testimonial2Name: 'Michael Chen',
        testimonial2Role: 'CTO, StartupXYZ',
        testimonial2Avatar: 'https://i.pravatar.cc/96?img=2',
        testimonial3Text: 'The best investment we\'ve made this year. Simple to use, powerful features, and excellent ROI.',
        testimonial3Name: 'Emily Rodriguez',
        testimonial3Role: 'Marketing Director, GrowthCo',
        testimonial3Avatar: 'https://i.pravatar.cc/96?img=3'
      }
    }
  },
  {
    name: 'Testimonials - Featured Quote',
    description: 'Large featured testimonial with company logo',
    category: 'testimonials',
    is_global: true,
    is_active: true,
    tags: ['testimonials', 'featured', 'quote', 'large'],
    component_data: {
      type: 'testimonials',
      variant: 'featured',
      html: `<section class="testimonials-featured"><div class="testimonials-featured-container"><div class="featured-quote-mark">"</div><blockquote class="featured-quote">{{quote}}</blockquote><div class="featured-author"><img src="{{authorAvatar}}" alt="{{authorName}}" class="featured-avatar"/><div class="featured-info"><div class="featured-name">{{authorName}}</div><div class="featured-role">{{authorRole}}</div></div></div><img src="{{companyLogo}}" alt="{{companyName}}" class="featured-company-logo"/></div></section>`,
      css: `.testimonials-featured{padding:6rem 2rem;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white}.testimonials-featured-container{max-width:900px;margin:0 auto;text-align:center}.featured-quote-mark{font-size:8rem;line-height:1;opacity:.2;font-family:Georgia,serif}.featured-quote{font-size:2rem;font-weight:500;line-height:1.5;margin:2rem 0;font-style:italic}.featured-author{display:flex;justify-content:center;align-items:center;gap:1.5rem;margin:3rem 0}.featured-avatar{width:64px;height:64px;border-radius:50%;border:3px solid rgba(255,255,255,.3);object-fit:cover}.featured-info{text-align:left}.featured-name{font-size:1.25rem;font-weight:700;margin-bottom:.25rem}.featured-role{font-size:1rem;opacity:.9}.featured-company-logo{height:40px;width:auto;opacity:.8;margin-top:2rem}@media(max-width:768px){.featured-quote{font-size:1.5rem}}`,
      schema: {
        quote: { type: 'textarea', label: 'Quote', default: 'This is hands down the best solution we\'ve found. It\'s intuitive, powerful, and has saved us countless hours. Our entire team loves it!' },
        authorName: { type: 'text', label: 'Author Name', default: 'David Martinez' },
        authorRole: { type: 'text', label: 'Author Role', default: 'VP of Operations, Enterprise Inc.' },
        authorAvatar: { type: 'image', label: 'Author Avatar', default: 'https://i.pravatar.cc/128?img=5' },
        companyLogo: { type: 'image', label: 'Company Logo', default: 'https://via.placeholder.com/120x40/ffffff/667eea?text=Company' },
        companyName: { type: 'text', label: 'Company Name', default: 'Enterprise Inc.' }
      },
      defaultProps: {
        quote: 'This is hands down the best solution we\'ve found. It\'s intuitive, powerful, and has saved us countless hours. Our entire team loves it!',
        authorName: 'David Martinez',
        authorRole: 'VP of Operations, Enterprise Inc.',
        authorAvatar: 'https://i.pravatar.cc/128?img=5',
        companyLogo: 'https://via.placeholder.com/120x40/ffffff/667eea?text=Company',
        companyName: 'Enterprise Inc.'
      }
    }
  },
  {
    name: 'Testimonials - Carousel',
    description: 'Sliding carousel of customer testimonials',
    category: 'testimonials',
    is_global: true,
    is_active: true,
    tags: ['testimonials', 'carousel', 'slider', 'interactive'],
    component_data: {
      type: 'testimonials',
      variant: 'carousel',
      html: `<section class="testimonials-carousel"><div class="testimonials-carousel-container"><h2 class="carousel-title">{{title}}</h2><div class="carousel-wrapper"><div class="carousel-slide active"><div class="carousel-content"><div class="carousel-rating">★★★★★</div><p class="carousel-text">"{{slide1Text}}"</p><div class="carousel-author"><img src="{{slide1Avatar}}" alt="{{slide1Name}}"/><div><div class="carousel-name">{{slide1Name}}</div><div class="carousel-role">{{slide1Role}}</div></div></div></div></div></div><div class="carousel-dots"><span class="dot active"></span><span class="dot"></span><span class="dot"></span></div></div></section>`,
      css: `.testimonials-carousel{padding:6rem 2rem;background:white}.testimonials-carousel-container{max-width:800px;margin:0 auto;text-align:center}.carousel-title{font-size:2.5rem;font-weight:800;color:#111827;margin-bottom:3rem}.carousel-wrapper{position:relative;min-height:300px}.carousel-slide{opacity:0;transition:opacity .5s}.carousel-slide.active{opacity:1}.carousel-content{background:#f9fafb;padding:3rem;border-radius:1rem;box-shadow:0 4px 20px rgba(0,0,0,.08)}.carousel-rating{color:#fbbf24;font-size:1.5rem;margin-bottom:1.5rem}.carousel-text{font-size:1.25rem;color:#374151;line-height:1.6;margin-bottom:2rem;font-style:italic}.carousel-author{display:flex;justify-content:center;align-items:center;gap:1rem}.carousel-author img{width:56px;height:56px;border-radius:50%;object-fit:cover}.carousel-name{font-weight:600;color:#111827;margin-bottom:.25rem}.carousel-role{color:#6b7280;font-size:.875rem}.carousel-dots{display:flex;justify-content:center;gap:.75rem;margin-top:2rem}.dot{width:12px;height:12px;border-radius:50%;background:#d1d5db;cursor:pointer;transition:background .2s}.dot.active{background:#3b82f6}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Trusted by Thousands' },
        slide1Text: { type: 'textarea', label: 'Slide 1 Text', default: 'Game-changing product! Our productivity has increased by 40% since we started using it. The support team is also incredibly helpful.' },
        slide1Name: { type: 'text', label: 'Slide 1 Name', default: 'Jessica Lee' },
        slide1Role: { type: 'text', label: 'Slide 1 Role', default: 'Product Manager, InnovateCo' },
        slide1Avatar: { type: 'image', label: 'Slide 1 Avatar', default: 'https://i.pravatar.cc/112?img=4' }
      },
      defaultProps: {
        title: 'Trusted by Thousands',
        slide1Text: 'Game-changing product! Our productivity has increased by 40% since we started using it. The support team is also incredibly helpful.',
        slide1Name: 'Jessica Lee',
        slide1Role: 'Product Manager, InnovateCo',
        slide1Avatar: 'https://i.pravatar.cc/112?img=4'
      }
    }
  },
  {
    name: 'Testimonials - Video Style',
    description: 'Testimonial with video thumbnail and play button',
    category: 'testimonials',
    is_global: true,
    is_active: true,
    tags: ['testimonials', 'video', 'multimedia', 'interactive'],
    component_data: {
      type: 'testimonials',
      variant: 'video',
      html: `<section class="testimonials-video"><div class="testimonials-video-container"><div class="video-content"><div class="video-thumbnail"><img src="{{thumbnailUrl}}" alt="Video testimonial"/><div class="play-button"><svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="rgba(255,255,255,0.9)"/><path d="M26 20 L26 44 L44 32 Z" fill="#3b82f6"/></svg></div></div></div><div class="video-text-content"><div class="video-rating">★★★★★</div><h3 class="video-quote">{{quote}}</h3><p class="video-description">{{description}}</p><div class="video-author"><img src="{{authorAvatar}}" alt="{{authorName}}"/><div><div class="video-name">{{authorName}}</div><div class="video-role">{{authorRole}}</div></div></div></div></div></section>`,
      css: `.testimonials-video{padding:6rem 2rem;background:#f9fafb}.testimonials-video-container{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}.video-thumbnail{position:relative;border-radius:1rem;overflow:hidden;cursor:pointer;box-shadow:0 20px 50px rgba(0,0,0,.15)}.video-thumbnail img{width:100%;height:auto;display:block}.play-button{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transition:transform .2s}.video-thumbnail:hover .play-button{transform:translate(-50%,-50%) scale(1.1)}.video-rating{color:#fbbf24;font-size:1.5rem;margin-bottom:1rem}.video-quote{font-size:1.75rem;font-weight:700;color:#111827;margin-bottom:1rem;line-height:1.3}.video-description{font-size:1.125rem;color:#6b7280;line-height:1.6;margin-bottom:2rem}.video-author{display:flex;align-items:center;gap:1rem}.video-author img{width:56px;height:56px;border-radius:50%;object-fit:cover}.video-name{font-weight:600;color:#111827;margin-bottom:.25rem}.video-role{color:#6b7280;font-size:.875rem}@media(max-width:768px){.testimonials-video-container{grid-template-columns:1fr}}`,
      schema: {
        thumbnailUrl: { type: 'image', label: 'Video Thumbnail', default: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600' },
        quote: { type: 'text', label: 'Quote', default: 'A Complete Game Changer' },
        description: { type: 'textarea', label: 'Description', default: 'Watch how our platform helped this company achieve 3x growth in just 6 months. Real results from real customers.' },
        authorName: { type: 'text', label: 'Author Name', default: 'Robert Kim' },
        authorRole: { type: 'text', label: 'Author Role', default: 'Founder, GrowthStartup' },
        authorAvatar: { type: 'image', label: 'Author Avatar', default: 'https://i.pravatar.cc/112?img=6' }
      },
      defaultProps: {
        thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600',
        quote: 'A Complete Game Changer',
        description: 'Watch how our platform helped this company achieve 3x growth in just 6 months. Real results from real customers.',
        authorName: 'Robert Kim',
        authorRole: 'Founder, GrowthStartup',
        authorAvatar: 'https://i.pravatar.cc/112?img=6'
      }
    }
  },
  {
    name: 'Testimonials - Stats Banner',
    description: 'Testimonial combined with key statistics',
    category: 'testimonials',
    is_global: true,
    is_active: true,
    tags: ['testimonials', 'stats', 'metrics', 'social-proof'],
    component_data: {
      type: 'testimonials',
      variant: 'stats-banner',
      html: `<section class="testimonials-stats"><div class="testimonials-stats-container"><div class="stats-testimonial"><div class="stats-rating">★★★★★</div><blockquote class="stats-quote">"{{quote}}"</blockquote><div class="stats-author"><img src="{{authorAvatar}}" alt="{{authorName}}"/><div><div class="stats-name">{{authorName}}</div><div class="stats-role">{{authorRole}}</div></div></div></div><div class="stats-metrics"><div class="stat-item"><div class="stat-value">{{stat1Value}}</div><div class="stat-label">{{stat1Label}}</div></div><div class="stat-item"><div class="stat-value">{{stat2Value}}</div><div class="stat-label">{{stat2Label}}</div></div><div class="stat-item"><div class="stat-value">{{stat3Value}}</div><div class="stat-label">{{stat3Label}}</div></div></div></div></section>`,
      css: `.testimonials-stats{padding:6rem 2rem;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:white}.testimonials-stats-container{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}.stats-rating{color:#fbbf24;font-size:1.5rem;margin-bottom:1.5rem}.stats-quote{font-size:1.5rem;font-weight:500;line-height:1.5;margin-bottom:2rem;font-style:italic}.stats-author{display:flex;align-items:center;gap:1rem}.stats-author img{width:56px;height:56px;border-radius:50%;border:2px solid rgba(255,255,255,.3);object-fit:cover}.stats-name{font-weight:600;font-size:1.125rem;margin-bottom:.25rem}.stats-role{opacity:.9;font-size:.875rem}.stats-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem}.stat-item{text-align:center;padding:1.5rem;background:rgba(255,255,255,.1);border-radius:.75rem;backdrop-filter:blur(10px)}.stat-value{font-size:2.5rem;font-weight:800;margin-bottom:.5rem}.stat-label{font-size:.875rem;opacity:.9}@media(max-width:768px){.testimonials-stats-container{grid-template-columns:1fr}.stats-metrics{grid-template-columns:1fr}}`,
      schema: {
        quote: { type: 'textarea', label: 'Quote', default: 'The results speak for themselves. We\'ve seen incredible growth and our customers are happier than ever.' },
        authorName: { type: 'text', label: 'Author Name', default: 'Amanda Foster' },
        authorRole: { type: 'text', label: 'Author Role', default: 'Head of Growth, ScaleUp' },
        authorAvatar: { type: 'image', label: 'Author Avatar', default: 'https://i.pravatar.cc/112?img=7' },
        stat1Value: { type: 'text', label: 'Stat 1 Value', default: '300%' },
        stat1Label: { type: 'text', label: 'Stat 1 Label', default: 'Revenue Growth' },
        stat2Value: { type: 'text', label: 'Stat 2 Value', default: '50K+' },
        stat2Label: { type: 'text', label: 'Stat 2 Label', default: 'Happy Customers' },
        stat3Value: { type: 'text', label: 'Stat 3 Value', default: '99.9%' },
        stat3Label: { type: 'text', label: 'Stat 3 Label', default: 'Satisfaction Rate' }
      },
      defaultProps: {
        quote: 'The results speak for themselves. We\'ve seen incredible growth and our customers are happier than ever.',
        authorName: 'Amanda Foster',
        authorRole: 'Head of Growth, ScaleUp',
        authorAvatar: 'https://i.pravatar.cc/112?img=7',
        stat1Value: '300%',
        stat1Label: 'Revenue Growth',
        stat2Value: '50K+',
        stat2Label: 'Happy Customers',
        stat3Value: '99.9%',
        stat3Label: 'Satisfaction Rate'
      }
    }
  }
];

async function seedTestimonialComponents() {
  console.log('🌱 Seeding Testimonial components...\n');
  
  try {
    let successCount = 0;
    let errorCount = 0;

    for (const component of testimonialComponents) {
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
    console.log(`   Success: ${successCount}/${testimonialComponents.length}`);
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
  seedTestimonialComponents();
}

module.exports = { seedTestimonialComponents, testimonialComponents };
