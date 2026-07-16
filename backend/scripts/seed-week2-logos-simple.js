/**
 * Week 2 - Logo Components (Simplified)
 * 10 logo showcase components
 */

require('dotenv').config();
const db = require('../src/db');

const components = [
  {
    name: 'Logos - Simple Grid',
    description: 'Clean grid of client/partner logos',
    category: 'logos',
    tags: ['logos', 'clients', 'partners', 'grid'],
    html: `<section class="logos-simple"><div class="logos-container"><h3>Trusted by leading companies</h3><div class="logos-grid"><img src="https://via.placeholder.com/150x60?text=Logo+1" alt="Company 1"><img src="https://via.placeholder.com/150x60?text=Logo+2" alt="Company 2"><img src="https://via.placeholder.com/150x60?text=Logo+3" alt="Company 3"><img src="https://via.placeholder.com/150x60?text=Logo+4" alt="Company 4"><img src="https://via.placeholder.com/150x60?text=Logo+5" alt="Company 5"><img src="https://via.placeholder.com/150x60?text=Logo+6" alt="Company 6"></div></div></section>`,
    css: `.logos-simple{padding:4rem 2rem;background:#f9fafb}.logos-container{max-width:1200px;margin:0 auto}.logos-container h3{text-align:center;font-size:0.875rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3rem;font-weight:600}.logos-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:3rem;align-items:center}.logos-grid img{width:100%;height:auto;max-height:60px;object-fit:contain;filter:grayscale(100%);opacity:0.6;transition:all 0.3s}.logos-grid img:hover{filter:grayscale(0%);opacity:1}@media(max-width:768px){.logos-grid{grid-template-columns:repeat(3,1fr);gap:2rem}}`
  },
  {
    name: 'Logos - With Cards',
    description: 'Logos in card containers with hover effects',
    category: 'logos',
    tags: ['logos', 'cards', 'partners', 'hover'],
    html: `<section class="logos-cards"><div class="logos-container"><h2>Our Partners</h2><p class="logos-subtitle">Working with the best companies worldwide</p><div class="logos-grid"><div class="logo-card"><img src="https://via.placeholder.com/150x60?text=Logo+1" alt="Partner 1"></div><div class="logo-card"><img src="https://via.placeholder.com/150x60?text=Logo+2" alt="Partner 2"></div><div class="logo-card"><img src="https://via.placeholder.com/150x60?text=Logo+3" alt="Partner 3"></div><div class="logo-card"><img src="https://via.placeholder.com/150x60?text=Logo+4" alt="Partner 4"></div><div class="logo-card"><img src="https://via.placeholder.com/150x60?text=Logo+5" alt="Partner 5"></div><div class="logo-card"><img src="https://via.placeholder.com/150x60?text=Logo+6" alt="Partner 6"></div></div></div></section>`,
    css: `.logos-cards{padding:5rem 2rem;background:white}.logos-container{max-width:1200px;margin:0 auto}.logos-container h2{text-align:center;font-size:2rem;font-weight:700;color:#111827;margin-bottom:1rem}.logos-subtitle{text-align:center;font-size:1.125rem;color:#6b7280;margin-bottom:3rem}.logos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem}.logo-card{background:#f9fafb;padding:3rem 2rem;border-radius:1rem;display:flex;align-items:center;justify-content:center;transition:all 0.3s;border:1px solid #e5e7eb}.logo-card:hover{background:white;box-shadow:0 10px 25px rgba(0,0,0,0.1);transform:translateY(-4px)}.logo-card img{max-width:100%;height:60px;object-fit:contain;filter:grayscale(100%);opacity:0.7;transition:all 0.3s}.logo-card:hover img{filter:grayscale(0%);opacity:1}@media(max-width:768px){.logos-grid{grid-template-columns:repeat(2,1fr)}}`
  },
  {
    name: 'Logos - Dark Background',
    description: 'Logo grid on dark background',
    category: 'logos',
    tags: ['logos', 'dark', 'clients', 'grid'],
    html: `<section class="logos-dark"><div class="logos-container"><h3>Powering innovation for</h3><div class="logos-grid"><img src="https://via.placeholder.com/150x60?text=Logo+1" alt="Company 1"><img src="https://via.placeholder.com/150x60?text=Logo+2" alt="Company 2"><img src="https://via.placeholder.com/150x60?text=Logo+3" alt="Company 3"><img src="https://via.placeholder.com/150x60?text=Logo+4" alt="Company 4"><img src="https://via.placeholder.com/150x60?text=Logo+5" alt="Company 5"><img src="https://via.placeholder.com/150x60?text=Logo+6" alt="Company 6"></div></div></section>`,
    css: `.logos-dark{padding:4rem 2rem;background:#111827}.logos-container{max-width:1200px;margin:0 auto}.logos-container h3{text-align:center;font-size:0.875rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3rem;font-weight:600}.logos-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:3rem;align-items:center}.logos-grid img{width:100%;height:auto;max-height:60px;object-fit:contain;filter:brightness(0) invert(1);opacity:0.5;transition:opacity 0.3s}.logos-grid img:hover{opacity:0.8}@media(max-width:768px){.logos-grid{grid-template-columns:repeat(3,1fr);gap:2rem}}`
  },
  {
    name: 'Logos - Minimal List',
    description: 'Simple vertical list of logos',
    category: 'logos',
    tags: ['logos', 'list', 'minimal', 'vertical'],
    html: `<section class="logos-list"><div class="logos-container"><div class="logo-item"><img src="https://via.placeholder.com/200x60?text=Logo+1" alt="Company 1"></div><div class="logo-item"><img src="https://via.placeholder.com/200x60?text=Logo+2" alt="Company 2"></div><div class="logo-item"><img src="https://via.placeholder.com/200x60?text=Logo+3" alt="Company 3"></div><div class="logo-item"><img src="https://via.placeholder.com/200x60?text=Logo+4" alt="Company 4"></div></div></section>`,
    css: `.logos-list{padding:3rem 2rem;background:white}.logos-container{max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:2rem}.logo-item{padding:2rem;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center}.logo-item:last-child{border-bottom:none}.logo-item img{max-width:200px;height:60px;object-fit:contain;filter:grayscale(100%);opacity:0.6;transition:all 0.3s}.logo-item:hover img{filter:grayscale(0%);opacity:1}`
  },
  {
    name: 'Logos - With Stats',
    description: 'Logos combined with statistics',
    category: 'logos',
    tags: ['logos', 'stats', 'combined', 'social-proof'],
    html: `<section class="logos-stats"><div class="logos-container"><div class="stats-section"><div class="stat"><div class="stat-value">500+</div><div class="stat-label">Companies</div></div><div class="stat"><div class="stat-value">50K+</div><div class="stat-label">Users</div></div><div class="stat"><div class="stat-value">99%</div><div class="stat-label">Satisfaction</div></div></div><div class="divider"></div><div class="logos-section"><h3>Trusted by</h3><div class="logos-grid"><img src="https://via.placeholder.com/150x60?text=Logo+1" alt="Company 1"><img src="https://via.placeholder.com/150x60?text=Logo+2" alt="Company 2"><img src="https://via.placeholder.com/150x60?text=Logo+3" alt="Company 3"><img src="https://via.placeholder.com/150x60?text=Logo+4" alt="Company 4"></div></div></div></section>`,
    css: `.logos-stats{padding:5rem 2rem;background:#f9fafb}.logos-container{max-width:1200px;margin:0 auto}.stats-section{display:grid;grid-template-columns:repeat(3,1fr);gap:3rem;margin-bottom:3rem}.stat{text-align:center}.stat-value{font-size:3rem;font-weight:700;color:#2563eb;margin-bottom:0.5rem}.stat-label{font-size:0.875rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em}.divider{height:1px;background:#e5e7eb;margin:3rem 0}.logos-section h3{text-align:center;font-size:0.875rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2rem;font-weight:600}.logos-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:3rem;align-items:center}.logos-grid img{width:100%;height:auto;max-height:60px;object-fit:contain;filter:grayscale(100%);opacity:0.6}@media(max-width:768px){.stats-section{grid-template-columns:1fr;gap:2rem}.logos-grid{grid-template-columns:repeat(2,1fr)}}`
  },
  {
    name: 'Logos - Compact Inline',
    description: 'Compact inline logo display',
    category: 'logos',
    tags: ['logos', 'inline', 'compact', 'featured'],
    html: `<section class="logos-inline"><div class="logos-container"><span class="logos-text">As featured in</span><div class="logos-row"><img src="https://via.placeholder.com/120x40?text=Logo+1" alt="Publication 1"><img src="https://via.placeholder.com/120x40?text=Logo+2" alt="Publication 2"><img src="https://via.placeholder.com/120x40?text=Logo+3" alt="Publication 3"><img src="https://via.placeholder.com/120x40?text=Logo+4" alt="Publication 4"></div></div></section>`,
    css: `.logos-inline{padding:2rem;background:white;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb}.logos-container{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:3rem;flex-wrap:wrap}.logos-text{font-size:0.875rem;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em}.logos-row{display:flex;align-items:center;gap:3rem}.logos-row img{height:40px;width:auto;object-fit:contain;filter:grayscale(100%);opacity:0.6}@media(max-width:768px){.logos-container{flex-direction:column;gap:1.5rem}.logos-row{gap:2rem}}`
  },
  {
    name: 'Logos - Staggered Grid',
    description: 'Logos in staggered/masonry layout',
    category: 'logos',
    tags: ['logos', 'staggered', 'masonry', 'grid'],
    html: `<section class="logos-staggered"><div class="logos-container"><h2>Trusted Partners</h2><div class="logos-masonry"><div class="logo-box logo-large"><img src="https://via.placeholder.com/150x80?text=Logo+1" alt="Partner 1"></div><div class="logo-box"><img src="https://via.placeholder.com/150x60?text=Logo+2" alt="Partner 2"></div><div class="logo-box"><img src="https://via.placeholder.com/150x60?text=Logo+3" alt="Partner 3"></div><div class="logo-box logo-large"><img src="https://via.placeholder.com/150x80?text=Logo+4" alt="Partner 4"></div><div class="logo-box"><img src="https://via.placeholder.com/150x60?text=Logo+5" alt="Partner 5"></div><div class="logo-box"><img src="https://via.placeholder.com/150x60?text=Logo+6" alt="Partner 6"></div></div></div></section>`,
    css: `.logos-staggered{padding:5rem 2rem;background:white}.logos-container{max-width:1200px;margin:0 auto}.logos-container h2{text-align:center;font-size:2rem;font-weight:700;color:#111827;margin-bottom:3rem}.logos-masonry{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:2rem;grid-auto-rows:150px}.logo-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:1rem;padding:2rem;display:flex;align-items:center;justify-content:center;transition:all 0.3s}.logo-box:hover{background:white;box-shadow:0 4px 6px rgba(0,0,0,0.1);transform:translateY(-4px)}.logo-large{grid-row:span 2}.logo-box img{max-width:100%;max-height:80px;object-fit:contain;filter:grayscale(100%);opacity:0.7;transition:all 0.3s}.logo-box:hover img{filter:grayscale(0%);opacity:1}@media(max-width:768px){.logos-masonry{grid-template-columns:repeat(2,1fr);grid-auto-rows:120px}.logo-large{grid-row:span 1}}`
  },
  {
    name: 'Logos - With Testimonial',
    description: 'Logo showcase with featured testimonial',
    category: 'logos',
    tags: ['logos', 'testimonial', 'social-proof', 'combined'],
    html: `<section class="logos-testimonial"><div class="logos-container"><div class="testimonial-section"><blockquote><p>"This platform has transformed how we work. The results speak for themselves."</p><footer><strong>Sarah Johnson</strong><span>CEO, TechCorp</span></footer></blockquote></div><div class="logos-section"><h3>Join these companies</h3><div class="logos-grid"><img src="https://via.placeholder.com/150x60?text=Logo+1" alt="Company 1"><img src="https://via.placeholder.com/150x60?text=Logo+2" alt="Company 2"><img src="https://via.placeholder.com/150x60?text=Logo+3" alt="Company 3"><img src="https://via.placeholder.com/150x60?text=Logo+4" alt="Company 4"><img src="https://via.placeholder.com/150x60?text=Logo+5" alt="Company 5"><img src="https://via.placeholder.com/150x60?text=Logo+6" alt="Company 6"></div></div></div></section>`,
    css: `.logos-testimonial{padding:5rem 2rem;background:linear-gradient(to bottom,#f9fafb 0%,white 100%)}.logos-container{max-width:1200px;margin:0 auto}.testimonial-section{margin-bottom:4rem}blockquote{max-width:800px;margin:0 auto;text-align:center}blockquote p{font-size:1.5rem;font-weight:500;color:#111827;line-height:1.6;margin-bottom:2rem}blockquote footer{display:flex;flex-direction:column;gap:0.25rem}blockquote strong{font-size:1rem;color:#111827}blockquote span{font-size:0.875rem;color:#6b7280}.logos-section h3{text-align:center;font-size:0.875rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2rem;font-weight:600}.logos-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:3rem;align-items:center}.logos-grid img{width:100%;height:auto;max-height:60px;object-fit:contain;filter:grayscale(100%);opacity:0.6}@media(max-width:768px){.logos-grid{grid-template-columns:repeat(3,1fr);gap:2rem}}`
  },
  {
    name: 'Logos - Gradient Background',
    description: 'Logos on gradient background with glow effect',
    category: 'logos',
    tags: ['logos', 'gradient', 'glow', 'premium'],
    html: `<section class="logos-gradient"><div class="logos-container"><h2>Powering Innovation</h2><p class="logos-subtitle">Trusted by forward-thinking companies worldwide</p><div class="logos-grid"><div class="logo-glow"><img src="https://via.placeholder.com/150x60?text=Logo+1" alt="Company 1"></div><div class="logo-glow"><img src="https://via.placeholder.com/150x60?text=Logo+2" alt="Company 2"></div><div class="logo-glow"><img src="https://via.placeholder.com/150x60?text=Logo+3" alt="Company 3"></div><div class="logo-glow"><img src="https://via.placeholder.com/150x60?text=Logo+4" alt="Company 4"></div><div class="logo-glow"><img src="https://via.placeholder.com/150x60?text=Logo+5" alt="Company 5"></div><div class="logo-glow"><img src="https://via.placeholder.com/150x60?text=Logo+6" alt="Company 6"></div></div></div></section>`,
    css: `.logos-gradient{padding:5rem 2rem;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);position:relative;overflow:hidden}.logos-gradient::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 30% 50%,rgba(255,255,255,0.1) 0%,transparent 50%)}.logos-container{max-width:1200px;margin:0 auto;position:relative;z-index:1}.logos-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:white;margin-bottom:1rem}.logos-subtitle{text-align:center;font-size:1.125rem;color:rgba(255,255,255,0.9);margin-bottom:3rem}.logos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3rem}.logo-glow{background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);padding:3rem 2rem;border-radius:1rem;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.2);transition:all 0.3s}.logo-glow:hover{background:rgba(255,255,255,0.15);transform:translateY(-4px);box-shadow:0 20px 40px rgba(0,0,0,0.2)}.logo-glow img{max-width:100%;height:60px;object-fit:contain;filter:brightness(0) invert(1)}@media(max-width:768px){.logos-grid{grid-template-columns:repeat(2,1fr);gap:2rem}}`
  },
  {
    name: 'Logos - Marquee Scroll',
    description: 'Infinite scrolling logo marquee',
    category: 'logos',
    tags: ['logos', 'marquee', 'scroll', 'animated'],
    html: `<section class="logos-marquee"><div class="logos-container"><h3>Trusted by industry leaders</h3><div class="marquee"><div class="marquee-content"><img src="https://via.placeholder.com/150x60?text=Logo+1" alt="Company 1"><img src="https://via.placeholder.com/150x60?text=Logo+2" alt="Company 2"><img src="https://via.placeholder.com/150x60?text=Logo+3" alt="Company 3"><img src="https://via.placeholder.com/150x60?text=Logo+4" alt="Company 4"><img src="https://via.placeholder.com/150x60?text=Logo+5" alt="Company 5"><img src="https://via.placeholder.com/150x60?text=Logo+6" alt="Company 6"><img src="https://via.placeholder.com/150x60?text=Logo+1" alt="Company 1"><img src="https://via.placeholder.com/150x60?text=Logo+2" alt="Company 2"><img src="https://via.placeholder.com/150x60?text=Logo+3" alt="Company 3"><img src="https://via.placeholder.com/150x60?text=Logo+4" alt="Company 4"><img src="https://via.placeholder.com/150x60?text=Logo+5" alt="Company 5"><img src="https://via.placeholder.com/150x60?text=Logo+6" alt="Company 6"></div></div></div></section>`,
    css: `.logos-marquee{padding:4rem 2rem;background:white;overflow:hidden}.logos-container h3{text-align:center;font-size:0.875rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3rem;font-weight:600}.marquee{overflow:hidden;position:relative}.marquee-content{display:flex;gap:4rem;animation:scroll 30s linear infinite}.marquee-content img{height:60px;width:auto;object-fit:contain;filter:grayscale(100%);opacity:0.6}@keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}@media(max-width:768px){.marquee-content{gap:2rem}.marquee-content img{height:40px}}`
  }
];

async function seed() {
  console.log('\n🌱 Starting Logo components seeding...\n');
  let success = 0, errors = 0;
  
  for (const c of components) {
    try {
      const data = { block_type: 'logos', html: c.html, css: c.css, js: null, schema: {}, default_props: {}, responsive_settings: {} };
      const result = await db.query(
        `INSERT INTO builder_components (name, description, category, is_global, component_data, tags) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [c.name, c.description, c.category, true, JSON.stringify(data), c.tags]
      );
      console.log(`✅ Created: ${c.name} (ID: ${result.rows[0].id})`);
      success++;
    } catch (error) {
      console.error(`❌ Error: ${c.name}:`, error.message);
      errors++;
    }
  }
  
  console.log(`\n📊 Summary: ✅ ${success} | ❌ ${errors} | 📦 ${components.length}`);
  await db.end();
}

if (require.main === module) seed();
module.exports = { components, seed };
