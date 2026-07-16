/**
 * Seed Script: Feature Components
 * Creates 10 premium feature section components with different styles
 * 
 * Usage: node scripts/seed-feature-components.js
 */

require('dotenv').config();
const db = require('../src/db');

const featureComponents = [
  {
    name: 'Feature Grid - 3 Column',
    description: 'Three-column feature grid with icons and descriptions',
    category: 'features',
    is_global: true,
    is_active: true,
    tags: ['features', 'grid', '3-column', 'icons'],
    component_data: {
      type: 'features',
      variant: 'grid-3col',
      html: `<section class="features-grid-3"><div class="features-container"><div class="features-header"><h2 class="features-title">{{title}}</h2><p class="features-subtitle">{{subtitle}}</p></div><div class="features-grid"><div class="feature-card"><div class="feature-icon">{{icon1}}</div><h3 class="feature-title">{{feature1Title}}</h3><p class="feature-desc">{{feature1Desc}}</p></div><div class="feature-card"><div class="feature-icon">{{icon2}}</div><h3 class="feature-title">{{feature2Title}}</h3><p class="feature-desc">{{feature2Desc}}</p></div><div class="feature-card"><div class="feature-icon">{{icon3}}</div><h3 class="feature-title">{{feature3Title}}</h3><p class="feature-desc">{{feature3Desc}}</p></div></div></div></section>`,
      css: `.features-grid-3{padding:6rem 2rem;background:white}.features-container{max-width:1200px;margin:0 auto}.features-header{text-align:center;margin-bottom:4rem}.features-title{font-size:2.5rem;font-weight:800;color:#111827;margin-bottom:1rem}.features-subtitle{font-size:1.25rem;color:#6b7280;max-width:700px;margin:0 auto}.features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3rem}.feature-card{text-align:center;padding:2rem}.feature-icon{font-size:3rem;margin-bottom:1.5rem}.feature-title{font-size:1.5rem;font-weight:700;color:#111827;margin-bottom:1rem}.feature-desc{font-size:1rem;color:#6b7280;line-height:1.6}@media(max-width:768px){.features-grid{grid-template-columns:1fr;gap:2rem}}`,
      schema: {
        title: { type: 'text', label: 'Section Title', default: 'Powerful Features' },
        subtitle: { type: 'textarea', label: 'Section Subtitle', default: 'Everything you need to succeed' },
        icon1: { type: 'text', label: 'Icon 1', default: '🚀' },
        feature1Title: { type: 'text', label: 'Feature 1 Title', default: 'Fast Performance' },
        feature1Desc: { type: 'textarea', label: 'Feature 1 Description', default: 'Lightning-fast load times' },
        icon2: { type: 'text', label: 'Icon 2', default: '🔒' },
        feature2Title: { type: 'text', label: 'Feature 2 Title', default: 'Secure & Safe' },
        feature2Desc: { type: 'textarea', label: 'Feature 2 Description', default: 'Enterprise-grade security' },
        icon3: { type: 'text', label: 'Icon 3', default: '📱' },
        feature3Title: { type: 'text', label: 'Feature 3 Title', default: 'Mobile Ready' },
        feature3Desc: { type: 'textarea', label: 'Feature 3 Description', default: 'Fully responsive design' }
      },
      defaultProps: {
        title: 'Powerful Features',
        subtitle: 'Everything you need to succeed',
        icon1: '🚀',
        feature1Title: 'Fast Performance',
        feature1Desc: 'Lightning-fast load times',
        icon2: '🔒',
        feature2Title: 'Secure & Safe',
        feature2Desc: 'Enterprise-grade security',
        icon3: '📱',
        feature3Title: 'Mobile Ready',
        feature3Desc: 'Fully responsive design'
      }
    }
  },
  {
    name: 'Feature Grid - 4 Column',
    description: 'Four-column feature grid with icons',
    category: 'features',
    is_global: true,
    is_active: true,
    tags: ['features', 'grid', '4-column', 'icons'],
    component_data: {
      type: 'features',
      variant: 'grid-4col',
      html: `<section class="features-grid-4"><div class="features-container"><h2 class="features-title">{{title}}</h2><div class="features-grid"><div class="feature-item"><div class="feature-icon">{{icon1}}</div><h3>{{feature1Title}}</h3><p>{{feature1Desc}}</p></div><div class="feature-item"><div class="feature-icon">{{icon2}}</div><h3>{{feature2Title}}</h3><p>{{feature2Desc}}</p></div><div class="feature-item"><div class="feature-icon">{{icon3}}</div><h3>{{feature3Title}}</h3><p>{{feature3Desc}}</p></div><div class="feature-item"><div class="feature-icon">{{icon4}}</div><h3>{{feature4Title}}</h3><p>{{feature4Desc}}</p></div></div></div></section>`,
      css: `.features-grid-4{padding:6rem 2rem;background:#f9fafb}.features-container{max-width:1200px;margin:0 auto}.features-title{font-size:2.5rem;font-weight:800;color:#111827;text-align:center;margin-bottom:4rem}.features-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2rem}.feature-item{background:white;padding:2rem;border-radius:1rem;text-align:center;transition:transform .2s,box-shadow .2s}.feature-item:hover{transform:translateY(-5px);box-shadow:0 10px 30px rgba(0,0,0,.1)}.feature-icon{font-size:2.5rem;margin-bottom:1rem}.feature-item h3{font-size:1.25rem;font-weight:700;color:#111827;margin-bottom:.75rem}.feature-item p{font-size:.875rem;color:#6b7280;line-height:1.5}@media(max-width:1024px){.features-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:640px){.features-grid{grid-template-columns:1fr}}`,
      schema: {
        title: { type: 'text', label: 'Section Title', default: 'Why Choose Us' },
        icon1: { type: 'text', label: 'Icon 1', default: '⚡' },
        feature1Title: { type: 'text', label: 'Feature 1', default: 'Lightning Fast' },
        feature1Desc: { type: 'text', label: 'Description 1', default: 'Optimized for speed' },
        icon2: { type: 'text', label: 'Icon 2', default: '🎨' },
        feature2Title: { type: 'text', label: 'Feature 2', default: 'Beautiful Design' },
        feature2Desc: { type: 'text', label: 'Description 2', default: 'Stunning visuals' },
        icon3: { type: 'text', label: 'Icon 3', default: '🔧' },
        feature3Title: { type: 'text', label: 'Feature 3', default: 'Easy to Use' },
        feature3Desc: { type: 'text', label: 'Description 3', default: 'Intuitive interface' },
        icon4: { type: 'text', label: 'Icon 4', default: '💎' },
        feature4Title: { type: 'text', label: 'Feature 4', default: 'Premium Quality' },
        feature4Desc: { type: 'text', label: 'Description 4', default: 'Top-tier features' }
      },
      defaultProps: {
        title: 'Why Choose Us',
        icon1: '⚡',
        feature1Title: 'Lightning Fast',
        feature1Desc: 'Optimized for speed',
        icon2: '🎨',
        feature2Title: 'Beautiful Design',
        feature2Desc: 'Stunning visuals',
        icon3: '🔧',
        feature3Title: 'Easy to Use',
        feature3Desc: 'Intuitive interface',
        icon4: '💎',
        feature4Title: 'Premium Quality',
        feature4Desc: 'Top-tier features'
      }
    }
  },
  {
    name: 'Feature List - Image Left',
    description: 'Feature list with image on left',
    category: 'features',
    is_global: true,
    is_active: true,
    tags: ['features', 'list', 'image'],
    component_data: {
      type: 'features',
      variant: 'list-image',
      html: `<section class="features-list"><div class="features-container"><div class="features-image"><img src="{{imageUrl}}" alt="Features"/></div><div class="features-content"><h2>{{title}}</h2><p>{{subtitle}}</p><ul><li><span>✓</span><div><strong>{{feature1}}</strong><p>{{desc1}}</p></div></li><li><span>✓</span><div><strong>{{feature2}}</strong><p>{{desc2}}</p></div></li><li><span>✓</span><div><strong>{{feature3}}</strong><p>{{desc3}}</p></div></li></ul></div></div></section>`,
      css: `.features-list{padding:6rem 2rem;background:white}.features-container{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}.features-image img{width:100%;border-radius:1rem;box-shadow:0 20px 50px rgba(0,0,0,.1)}.features-content h2{font-size:2.5rem;font-weight:800;color:#111827;margin-bottom:1rem}.features-content p{font-size:1.125rem;color:#6b7280;margin-bottom:2rem}.features-content ul{list-style:none;padding:0}.features-content li{display:flex;gap:1rem;margin-bottom:1.5rem}.features-content li span{flex-shrink:0;width:24px;height:24px;background:#10b981;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.875rem;font-weight:700}.features-content strong{display:block;font-size:1.125rem;color:#111827;margin-bottom:.25rem}.features-content li p{font-size:.875rem;color:#6b7280;margin:0}@media(max-width:768px){.features-container{grid-template-columns:1fr}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Everything You Need' },
        subtitle: { type: 'textarea', label: 'Subtitle', default: 'Powerful features' },
        imageUrl: { type: 'image', label: 'Image', default: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600' },
        feature1: { type: 'text', label: 'Feature 1', default: 'Advanced Analytics' },
        desc1: { type: 'text', label: 'Description 1', default: 'Track your progress' },
        feature2: { type: 'text', label: 'Feature 2', default: 'Team Collaboration' },
        desc2: { type: 'text', label: 'Description 2', default: 'Work together' },
        feature3: { type: 'text', label: 'Feature 3', default: 'Cloud Storage' },
        desc3: { type: 'text', label: 'Description 3', default: 'Access anywhere' }
      },
      defaultProps: {
        title: 'Everything You Need',
        subtitle: 'Powerful features',
        imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600',
        feature1: 'Advanced Analytics',
        desc1: 'Track your progress',
        feature2: 'Team Collaboration',
        desc2: 'Work together',
        feature3: 'Cloud Storage',
        desc3: 'Access anywhere'
      }
    }
  },
  {
    name: 'Feature Cards - Gradient',
    description: 'Feature cards with gradient backgrounds',
    category: 'features',
    is_global: true,
    is_active: true,
    tags: ['features', 'cards', 'gradient'],
    component_data: {
      type: 'features',
      variant: 'cards-gradient',
      html: `<section class="features-cards"><div class="features-container"><h2>{{title}}</h2><p>{{subtitle}}</p><div class="cards-grid"><div class="card card-1"><div class="icon">{{icon1}}</div><h3>{{feature1}}</h3><p>{{desc1}}</p></div><div class="card card-2"><div class="icon">{{icon2}}</div><h3>{{feature2}}</h3><p>{{desc2}}</p></div><div class="card card-3"><div class="icon">{{icon3}}</div><h3>{{feature3}}</h3><p>{{desc3}}</p></div></div></div></section>`,
      css: `.features-cards{padding:6rem 2rem;background:#f9fafb}.features-container{max-width:1200px;margin:0 auto;text-align:center}.features-container h2{font-size:2.5rem;font-weight:800;color:#111827;margin-bottom:1rem}.features-container>p{font-size:1.125rem;color:#6b7280;margin-bottom:4rem}.cards-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem}.card{padding:3rem 2rem;border-radius:1rem;color:white;transition:transform .3s}.card:hover{transform:translateY(-10px)}.card-1{background:linear-gradient(135deg,#667eea,#764ba2)}.card-2{background:linear-gradient(135deg,#f093fb,#f5576c)}.card-3{background:linear-gradient(135deg,#4facfe,#00f2fe)}.icon{font-size:3rem;margin-bottom:1.5rem}.card h3{font-size:1.5rem;font-weight:700;margin-bottom:1rem}.card p{opacity:.9}@media(max-width:768px){.cards-grid{grid-template-columns:1fr}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Amazing Features' },
        subtitle: { type: 'text', label: 'Subtitle', default: 'Discover what makes us different' },
        icon1: { type: 'text', label: 'Icon 1', default: '🎯' },
        feature1: { type: 'text', label: 'Feature 1', default: 'Precision' },
        desc1: { type: 'text', label: 'Description 1', default: 'Accurate results' },
        icon2: { type: 'text', label: 'Icon 2', default: '⚡' },
        feature2: { type: 'text', label: 'Feature 2', default: 'Speed' },
        desc2: { type: 'text', label: 'Description 2', default: 'Lightning fast' },
        icon3: { type: 'text', label: 'Icon 3', default: '🛡️' },
        feature3: { type: 'text', label: 'Feature 3', default: 'Security' },
        desc3: { type: 'text', label: 'Description 3', default: 'Always protected' }
      },
      defaultProps: {
        title: 'Amazing Features',
        subtitle: 'Discover what makes us different',
        icon1: '🎯',
        feature1: 'Precision',
        desc1: 'Accurate results',
        icon2: '⚡',
        feature2: 'Speed',
        desc2: 'Lightning fast',
        icon3: '🛡️',
        feature3: 'Security',
        desc3: 'Always protected'
      }
    }
  },
  {
    name: 'Feature Timeline',
    description: 'Vertical timeline for features',
    category: 'features',
    is_global: true,
    is_active: true,
    tags: ['features', 'timeline', 'process'],
    component_data: {
      type: 'features',
      variant: 'timeline',
      html: `<section class="features-timeline"><div class="container"><h2>{{title}}</h2><p>{{subtitle}}</p><div class="timeline"><div class="item"><div class="marker">1</div><div class="content"><h3>{{step1}}</h3><p>{{desc1}}</p></div></div><div class="item"><div class="marker">2</div><div class="content"><h3>{{step2}}</h3><p>{{desc2}}</p></div></div><div class="item"><div class="marker">3</div><div class="content"><h3>{{step3}}</h3><p>{{desc3}}</p></div></div><div class="item"><div class="marker">4</div><div class="content"><h3>{{step4}}</h3><p>{{desc4}}</p></div></div></div></div></section>`,
      css: `.features-timeline{padding:6rem 2rem;background:white}.features-timeline .container{max-width:800px;margin:0 auto}.features-timeline h2{font-size:2.5rem;font-weight:800;text-align:center;margin-bottom:1rem}.features-timeline>div>p{text-align:center;color:#6b7280;margin-bottom:4rem}.timeline{position:relative;padding-left:3rem}.timeline:before{content:"";position:absolute;left:1.5rem;top:0;bottom:0;width:2px;background:#e5e7eb}.item{position:relative;margin-bottom:3rem}.marker{position:absolute;left:-3rem;width:3rem;height:3rem;background:#3b82f6;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.25rem;box-shadow:0 0 0 4px white,0 0 0 6px #3b82f6}.content{background:#f9fafb;padding:2rem;border-radius:1rem;margin-left:1rem}.content h3{font-size:1.5rem;font-weight:700;margin-bottom:.75rem}.content p{color:#6b7280}@media(max-width:640px){.timeline{padding-left:2rem}.marker{left:-2rem;width:2.5rem;height:2.5rem}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'How It Works' },
        subtitle: { type: 'text', label: 'Subtitle', default: 'Simple steps' },
        step1: { type: 'text', label: 'Step 1', default: 'Sign Up' },
        desc1: { type: 'text', label: 'Description 1', default: 'Create account' },
        step2: { type: 'text', label: 'Step 2', default: 'Customize' },
        desc2: { type: 'text', label: 'Description 2', default: 'Set preferences' },
        step3: { type: 'text', label: 'Step 3', default: 'Launch' },
        desc3: { type: 'text', label: 'Description 3', default: 'Go live' },
        step4: { type: 'text', label: 'Step 4', default: 'Grow' },
        desc4: { type: 'text', label: 'Description 4', default: 'Scale success' }
      },
      defaultProps: {
        title: 'How It Works',
        subtitle: 'Simple steps',
        step1: 'Sign Up',
        desc1: 'Create account',
        step2: 'Customize',
        desc2: 'Set preferences',
        step3: 'Launch',
        desc3: 'Go live',
        step4: 'Grow',
        desc4: 'Scale success'
      }
    }
  },
  {
    name: 'Feature Alternating',
    description: 'Alternating image and text',
    category: 'features',
    is_global: true,
    is_active: true,
    tags: ['features', 'alternating'],
    component_data: {
      type: 'features',
      variant: 'alternating',
      html: `<section class="features-alt"><div class="container"><h2>{{title}}</h2><div class="row"><div class="image"><img src="{{image1}}" alt="Feature"/></div><div class="content"><h3>{{feature1}}</h3><p>{{desc1}}</p></div></div><div class="row reverse"><div class="image"><img src="{{image2}}" alt="Feature"/></div><div class="content"><h3>{{feature2}}</h3><p>{{desc2}}</p></div></div></div></section>`,
      css: `.features-alt{padding:6rem 2rem;background:#f9fafb}.features-alt .container{max-width:1200px;margin:0 auto}.features-alt h2{font-size:2.5rem;font-weight:800;text-align:center;margin-bottom:4rem}.row{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center;margin-bottom:4rem}.row.reverse{direction:rtl}.row.reverse>*{direction:ltr}.image img{width:100%;border-radius:1rem;box-shadow:0 20px 50px rgba(0,0,0,.1)}.content h3{font-size:2rem;font-weight:700;margin-bottom:1rem}.content p{font-size:1.125rem;color:#6b7280;line-height:1.6}@media(max-width:768px){.row,.row.reverse{grid-template-columns:1fr;direction:ltr}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Powerful Features' },
        image1: { type: 'image', label: 'Image 1', default: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600' },
        feature1: { type: 'text', label: 'Feature 1', default: 'Advanced Dashboard' },
        desc1: { type: 'textarea', label: 'Description 1', default: 'Monitor everything' },
        image2: { type: 'image', label: 'Image 2', default: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600' },
        feature2: { type: 'text', label: 'Feature 2', default: 'Smart Automation' },
        desc2: { type: 'textarea', label: 'Description 2', default: 'Save time' }
      },
      defaultProps: {
        title: 'Powerful Features',
        image1: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600',
        feature1: 'Advanced Dashboard',
        desc1: 'Monitor everything',
        image2: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600',
        feature2: 'Smart Automation',
        desc2: 'Save time'
      }
    }
  },
  {
    name: 'Feature Icons Grid',
    description: 'Simple icon grid',
    category: 'features',
    is_global: true,
    is_active: true,
    tags: ['features', 'icons', 'minimal'],
    component_data: {
      type: 'features',
      variant: 'icons',
      html: `<section class="features-icons"><div class="container"><h2>{{title}}</h2><div class="grid"><div class="item"><div class="icon">{{icon1}}</div><h4>{{feature1}}</h4></div><div class="item"><div class="icon">{{icon2}}</div><h4>{{feature2}}</h4></div><div class="item"><div class="icon">{{icon3}}</div><h4>{{feature3}}</h4></div><div class="item"><div class="icon">{{icon4}}</div><h4>{{feature4}}</h4></div><div class="item"><div class="icon">{{icon5}}</div><h4>{{feature5}}</h4></div><div class="item"><div class="icon">{{icon6}}</div><h4>{{feature6}}</h4></div></div></div></section>`,
      css: `.features-icons{padding:6rem 2rem;background:white}.features-icons .container{max-width:1200px;margin:0 auto}.features-icons h2{font-size:2.5rem;font-weight:800;text-align:center;margin-bottom:4rem}.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:2rem}.item{text-align:center}.icon{font-size:3rem;margin-bottom:1rem}.item h4{font-size:1rem;font-weight:600;color:#374151}@media(max-width:1024px){.grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:640px){.grid{grid-template-columns:repeat(2,1fr)}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'What We Offer' },
        icon1: { type: 'text', label: 'Icon 1', default: '🚀' },
        feature1: { type: 'text', label: 'Feature 1', default: 'Fast' },
        icon2: { type: 'text', label: 'Icon 2', default: '🔒' },
        feature2: { type: 'text', label: 'Feature 2', default: 'Secure' },
        icon3: { type: 'text', label: 'Icon 3', default: '📱' },
        feature3: { type: 'text', label: 'Feature 3', default: 'Mobile' },
        icon4: { type: 'text', label: 'Icon 4', default: '⚡' },
        feature4: { type: 'text', label: 'Feature 4', default: 'Powerful' },
        icon5: { type: 'text', label: 'Icon 5', default: '🎨' },
        feature5: { type: 'text', label: 'Feature 5', default: 'Beautiful' },
        icon6: { type: 'text', label: 'Icon 6', default: '💎' },
        feature6: { type: 'text', label: 'Feature 6', default: 'Premium' }
      },
      defaultProps: {
        title: 'What We Offer',
        icon1: '🚀',
        feature1: 'Fast',
        icon2: '🔒',
        feature2: 'Secure',
        icon3: '📱',
        feature3: 'Mobile',
        icon4: '⚡',
        feature4: 'Powerful',
        icon5: '🎨',
        feature5: 'Beautiful',
        icon6: '💎',
        feature6: 'Premium'
      }
    }
  },
  {
    name: 'Feature Bento Grid',
    description: 'Modern bento-style grid',
    category: 'features',
    is_global: true,
    is_active: true,
    tags: ['features', 'bento', 'modern'],
    component_data: {
      type: 'features',
      variant: 'bento',
      html: `<section class="features-bento"><div class="container"><h2>{{title}}</h2><div class="grid"><div class="item large"><div class="icon">{{icon1}}</div><h3>{{feature1}}</h3><p>{{desc1}}</p></div><div class="item"><div class="icon">{{icon2}}</div><h3>{{feature2}}</h3><p>{{desc2}}</p></div><div class="item"><div class="icon">{{icon3}}</div><h3>{{feature3}}</h3><p>{{desc3}}</p></div><div class="item tall"><div class="icon">{{icon4}}</div><h3>{{feature4}}</h3><p>{{desc4}}</p></div><div class="item"><div class="icon">{{icon5}}</div><h3>{{feature5}}</h3><p>{{desc5}}</p></div></div></div></section>`,
      css: `.features-bento{padding:6rem 2rem;background:#f9fafb}.features-bento .container{max-width:1200px;margin:0 auto}.features-bento h2{font-size:2.5rem;font-weight:800;text-align:center;margin-bottom:4rem}.grid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:200px;gap:1.5rem}.item{background:white;padding:2rem;border-radius:1.5rem;box-shadow:0 4px 20px rgba(0,0,0,.05);transition:transform .2s}.item:hover{transform:translateY(-5px)}.item.large{grid-column:span 2;grid-row:span 2}.item.tall{grid-row:span 2}.icon{font-size:2.5rem;margin-bottom:1rem}.item h3{font-size:1.25rem;font-weight:700;margin-bottom:.75rem}.item p{font-size:.875rem;color:#6b7280}@media(max-width:768px){.grid{grid-template-columns:1fr;grid-auto-rows:auto}.item.large,.item.tall{grid-column:span 1;grid-row:span 1}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Explore Features' },
        icon1: { type: 'text', label: 'Icon 1', default: '🎯' },
        feature1: { type: 'text', label: 'Feature 1', default: 'Main Feature' },
        desc1: { type: 'text', label: 'Description 1', default: 'Flagship capability' },
        icon2: { type: 'text', label: 'Icon 2', default: '⚡' },
        feature2: { type: 'text', label: 'Feature 2', default: 'Fast' },
        desc2: { type: 'text', label: 'Description 2', default: 'Lightning speed' },
        icon3: { type: 'text', label: 'Icon 3', default: '🔒' },
        feature3: { type: 'text', label: 'Feature 3', default: 'Secure' },
        desc3: { type: 'text', label: 'Description 3', default: 'Bank-level security' },
        icon4: { type: 'text', label: 'Icon 4', default: '🎨' },
        feature4: { type: 'text', label: 'Feature 4', default: 'Beautiful' },
        desc4: { type: 'text', label: 'Description 4', default: 'Stunning design' },
        icon5: { type: 'text', label: 'Icon 5', default: '💎' },
        feature5: { type: 'text', label: 'Feature 5', default: 'Premium' },
        desc5: { type: 'text', label: 'Description 5', default: 'Top quality' }
      },
      defaultProps: {
        title: 'Explore Features',
        icon1: '🎯',
        feature1: 'Main Feature',
        desc1: 'Flagship capability',
        icon2: '⚡',
        feature2: 'Fast',
        desc2: 'Lightning speed',
        icon3: '🔒',
        feature3: 'Secure',
        desc3: 'Bank-level security',
        icon4: '🎨',
        feature4: 'Beautiful',
        desc4: 'Stunning design',
        icon5: '💎',
        feature5: 'Premium',
        desc5: 'Top quality'
      }
    }
  },
  {
    name: 'Feature Stats',
    description: 'Feature section with statistics',
    category: 'features',
    is_global: true,
    is_active: true,
    tags: ['features', 'stats', 'metrics'],
    component_data: {
      type: 'features',
      variant: 'stats',
      html: `<section class="features-stats"><div class="container"><h2>{{title}}</h2><p>{{subtitle}}</p><div class="grid"><div class="stat"><div class="number">{{stat1}}</div><div class="label">{{label1}}</div></div><div class="stat"><div class="number">{{stat2}}</div><div class="label">{{label2}}</div></div><div class="stat"><div class="number">{{stat3}}</div><div class="label">{{label3}}</div></div><div class="stat"><div class="number">{{stat4}}</div><div class="label">{{label4}}</div></div></div></div></section>`,
      css: `.features-stats{padding:6rem 2rem;background:linear-gradient(135deg,#667eea,#764ba2);color:white}.features-stats .container{max-width:1200px;margin:0 auto;text-align:center}.features-stats h2{font-size:2.5rem;font-weight:800;margin-bottom:1rem}.features-stats>div>p{font-size:1.125rem;opacity:.9;margin-bottom:4rem}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2rem}.stat{background:rgba(255,255,255,.1);backdrop-filter:blur(10px);padding:2rem;border-radius:1rem;border:1px solid rgba(255,255,255,.2)}.number{font-size:3rem;font-weight:900;margin-bottom:.5rem}.label{font-size:1.125rem;font-weight:600;opacity:.9}@media(max-width:1024px){.grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:640px){.grid{grid-template-columns:1fr}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Trusted by Thousands' },
        subtitle: { type: 'text', label: 'Subtitle', default: 'Join the community' },
        stat1: { type: 'text', label: 'Stat 1', default: '50K+' },
        label1: { type: 'text', label: 'Label 1', default: 'Active Users' },
        stat2: { type: 'text', label: 'Stat 2', default: '99.9%' },
        label2: { type: 'text', label: 'Label 2', default: 'Uptime' },
        stat3: { type: 'text', label: 'Stat 3', default: '24/7' },
        label3: { type: 'text', label: 'Label 3', default: 'Support' },
        stat4: { type: 'text', label: 'Stat 4', default: '4.9/5' },
        label4: { type: 'text', label: 'Label 4', default: 'Rating' }
      },
      defaultProps: {
        title: 'Trusted by Thousands',
        subtitle: 'Join the community',
        stat1: '50K+',
        label1: 'Active Users',
        stat2: '99.9%',
        label2: 'Uptime',
        stat3: '24/7',
        label3: 'Support',
        stat4: '4.9/5',
        label4: 'Rating'
      }
    }
  },
  {
    name: 'Feature Comparison',
    description: 'Feature comparison table',
    category: 'features',
    is_global: true,
    is_active: true,
    tags: ['features', 'comparison', 'table'],
    component_data: {
      type: 'features',
      variant: 'comparison',
      html: `<section class="features-comparison"><div class="container"><h2>{{title}}</h2><div class="table"><div class="header"><div></div><div><h3>{{plan1}}</h3></div><div><h3>{{plan2}}</h3></div><div><h3>{{plan3}}</h3></div></div><div class="row"><div>{{feature1}}</div><div>✓</div><div>✓</div><div>✓</div></div><div class="row"><div>{{feature2}}</div><div>✓</div><div>✓</div><div>✓</div></div><div class="row"><div>{{feature3}}</div><div>-</div><div>✓</div><div>✓</div></div><div class="row"><div>{{feature4}}</div><div>-</div><div>-</div><div>✓</div></div></div></div></section>`,
      css: `.features-comparison{padding:6rem 2rem;background:white}.features-comparison .container{max-width:1000px;margin:0 auto}.features-comparison h2{font-size:2.5rem;font-weight:800;text-align:center;margin-bottom:4rem}.table{background:white;border-radius:1rem;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.05)}.header{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;border-bottom:2px solid #e5e7eb}.header>div{padding:2rem;text-align:center}.header h3{font-size:1.25rem;font-weight:700}.row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;border-bottom:1px solid #e5e7eb}.row:last-child{border-bottom:none}.row>div{padding:1.5rem;text-align:center}.row>div:first-child{text-align:left;font-weight:600}@media(max-width:768px){.header,.row{grid-template-columns:1fr;text-align:left}.header>div,.row>div{text-align:left}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Compare Plans' },
        plan1: { type: 'text', label: 'Plan 1', default: 'Basic' },
        plan2: { type: 'text', label: 'Plan 2', default: 'Pro' },
        plan3: { type: 'text', label: 'Plan 3', default: 'Enterprise' },
        feature1: { type: 'text', label: 'Feature 1', default: 'Basic Features' },
        feature2: { type: 'text', label: 'Feature 2', default: 'Advanced Analytics' },
        feature3: { type: 'text', label: 'Feature 3', default: 'Priority Support' },
        feature4: { type: 'text', label: 'Feature 4', default: 'Custom Integration' }
      },
      defaultProps: {
        title: 'Compare Plans',
        plan1: 'Basic',
        plan2: 'Pro',
        plan3: 'Enterprise',
        feature1: 'Basic Features',
        feature2: 'Advanced Analytics',
        feature3: 'Priority Support',
        feature4: 'Custom Integration'
      }
    }
  }
];

async function seedFeatureComponents() {
  console.log('🌱 Seeding feature components...\n');
  
  try {
    let successCount = 0;
    let errorCount = 0;

    for (const component of featureComponents) {
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
    console.log(`   Success: ${successCount}/${featureComponents.length}`);
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
  seedFeatureComponents();
}

module.exports = { seedFeatureComponents, featureComponents };
