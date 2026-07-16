/**
 * Week 2 - Video Components
 * 10 video embed and player components
 */

require('dotenv').config();
const db = require('../src/db');

const components = [
  {
    name: 'Video - YouTube Embed',
    description: 'Responsive YouTube video embed',
    category: 'video',
    tags: ['video', 'youtube', 'embed', 'responsive'],
    html: `<section class="video-youtube"><div class="video-container"><h2>Watch Our Video</h2><div class="video-wrapper"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></div></section>`,
    css: `.video-youtube{padding:5rem 2rem;background:white}.video-container{max-width:1200px;margin:0 auto}.video-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:3rem}.video-wrapper{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:1rem;box-shadow:0 10px 25px rgba(0,0,0,0.1)}.video-wrapper iframe{position:absolute;top:0;left:0;width:100%;height:100%}`
  },
  {
    name: 'Video - With Thumbnail',
    description: 'Video player with custom thumbnail',
    category: 'video',
    tags: ['video', 'thumbnail', 'player', 'custom'],
    html: `<section class="video-thumbnail"><div class="video-container"><h2>Featured Video</h2><div class="video-player"><img src="https://via.placeholder.com/1200x675?text=Video+Thumbnail" alt="Video thumbnail" class="thumbnail"><button class="play-btn">▶</button></div></div></section>`,
    css: `.video-thumbnail{padding:5rem 2rem;background:#f9fafb}.video-container{max-width:1200px;margin:0 auto}.video-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:3rem}.video-player{position:relative;border-radius:1rem;overflow:hidden;cursor:pointer}.thumbnail{width:100%;height:auto;display:block}.play-btn{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:80px;height:80px;background:rgba(255,255,255,0.9);border:none;border-radius:50%;font-size:2rem;color:#2563eb;cursor:pointer;transition:all 0.3s}.play-btn:hover{background:white;transform:translate(-50%,-50%) scale(1.1)}`
  },
  {
    name: 'Video - Background',
    description: 'Full-width background video hero',
    category: 'video',
    tags: ['video', 'background', 'hero', 'fullscreen'],
    html: `<section class="video-background"><video autoplay muted loop class="bg-video"><source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4"></video><div class="video-overlay"><h1>Welcome</h1><p>Experience the difference</p><button class="cta-btn">Learn More</button></div></section>`,
    css: `.video-background{position:relative;height:100vh;overflow:hidden}.bg-video{position:absolute;top:50%;left:50%;min-width:100%;min-height:100%;width:auto;height:auto;transform:translate(-50%,-50%);object-fit:cover}.video-overlay{position:relative;z-index:1;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);color:white;text-align:center;padding:2rem}.video-overlay h1{font-size:4rem;font-weight:700;margin-bottom:1rem}.video-overlay p{font-size:1.5rem;margin-bottom:2rem}.cta-btn{padding:1rem 3rem;background:white;color:#111827;border:none;border-radius:0.5rem;font-size:1.125rem;font-weight:600;cursor:pointer;transition:transform 0.3s}.cta-btn:hover{transform:scale(1.05)}@media(max-width:768px){.video-overlay h1{font-size:2.5rem}.video-overlay p{font-size:1.125rem}}`
  },
  {
    name: 'Video - Grid',
    description: 'Grid of multiple video embeds',
    category: 'video',
    tags: ['video', 'grid', 'multiple', 'gallery'],
    html: `<section class="video-grid"><div class="video-container"><h2>Video Gallery</h2><div class="videos-grid"><div class="video-item"><div class="video-wrapper"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe></div><h3>Video Title 1</h3></div><div class="video-item"><div class="video-wrapper"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe></div><h3>Video Title 2</h3></div><div class="video-item"><div class="video-wrapper"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe></div><h3>Video Title 3</h3></div></div></div></section>`,
    css: `.video-grid{padding:5rem 2rem;background:white}.video-container{max-width:1200px;margin:0 auto}.video-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:3rem}.videos-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3rem}.video-item h3{margin-top:1rem;font-size:1.125rem;font-weight:600;color:#111827}.video-wrapper{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:0.5rem}.video-wrapper iframe{position:absolute;top:0;left:0;width:100%;height:100%}@media(max-width:768px){.videos-grid{grid-template-columns:1fr}}`
  },
  {
    name: 'Video - Vimeo Embed',
    description: 'Responsive Vimeo video embed',
    category: 'video',
    tags: ['video', 'vimeo', 'embed', 'responsive'],
    html: `<section class="video-vimeo"><div class="video-container"><h2>Our Story</h2><div class="video-wrapper"><iframe src="https://player.vimeo.com/video/148751763" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div><p class="video-caption">Watch how we started our journey</p></div></section>`,
    css: `.video-vimeo{padding:5rem 2rem;background:#f9fafb}.video-container{max-width:900px;margin:0 auto}.video-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:3rem}.video-wrapper{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:1rem;box-shadow:0 10px 25px rgba(0,0,0,0.1);margin-bottom:2rem}.video-wrapper iframe{position:absolute;top:0;left:0;width:100%;height:100%}.video-caption{text-align:center;font-size:1.125rem;color:#6b7280}`
  },
  {
    name: 'Video - Modal Popup',
    description: 'Video that opens in modal/lightbox',
    category: 'video',
    tags: ['video', 'modal', 'popup', 'lightbox'],
    html: `<section class="video-modal"><div class="video-container"><h2>Watch Demo</h2><div class="video-trigger"><img src="https://via.placeholder.com/800x450?text=Click+to+Play" alt="Video preview"><button class="modal-play-btn">▶ Play Video</button></div></div></section>`,
    css: `.video-modal{padding:5rem 2rem;background:white}.video-container{max-width:900px;margin:0 auto}.video-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:3rem}.video-trigger{position:relative;border-radius:1rem;overflow:hidden;cursor:pointer}.video-trigger img{width:100%;height:auto;display:block}.modal-play-btn{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);padding:1.5rem 3rem;background:rgba(37,99,235,0.9);color:white;border:none;border-radius:0.5rem;font-size:1.25rem;font-weight:600;cursor:pointer;transition:all 0.3s}.modal-play-btn:hover{background:#2563eb;transform:translate(-50%,-50%) scale(1.05)}`
  },
  {
    name: 'Video - Split Screen',
    description: 'Video with side-by-side content',
    category: 'video',
    tags: ['video', 'split', 'content', 'layout'],
    html: `<section class="video-split"><div class="split-container"><div class="split-video"><div class="video-wrapper"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe></div></div><div class="split-content"><h2>Why Choose Us</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p><ul><li>✓ Feature one</li><li>✓ Feature two</li><li>✓ Feature three</li></ul><button class="cta-btn">Get Started</button></div></div></section>`,
    css: `.video-split{padding:5rem 2rem;background:#f9fafb}.split-container{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}.video-wrapper{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:1rem}.video-wrapper iframe{position:absolute;top:0;left:0;width:100%;height:100%}.split-content h2{font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:1.5rem}.split-content p{font-size:1.125rem;color:#6b7280;margin-bottom:2rem;line-height:1.6}.split-content ul{list-style:none;padding:0;margin-bottom:2rem}.split-content li{font-size:1.125rem;color:#374151;margin-bottom:1rem}.cta-btn{padding:1rem 2rem;background:#2563eb;color:white;border:none;border-radius:0.5rem;font-size:1.125rem;font-weight:600;cursor:pointer;transition:background 0.3s}.cta-btn:hover{background:#1d4ed8}@media(max-width:768px){.split-container{grid-template-columns:1fr;gap:3rem}}`
  },
  {
    name: 'Video - Testimonial',
    description: 'Video testimonial with speaker info',
    category: 'video',
    tags: ['video', 'testimonial', 'review', 'customer'],
    html: `<section class="video-testimonial"><div class="video-container"><h2>Customer Stories</h2><div class="testimonial-video"><div class="video-wrapper"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe></div><div class="speaker-info"><img src="https://via.placeholder.com/80x80?text=JS" alt="Speaker" class="speaker-avatar"><div class="speaker-details"><h3>John Smith</h3><p>CEO, TechCorp</p></div></div></div></div></section>`,
    css: `.video-testimonial{padding:5rem 2rem;background:white}.video-container{max-width:900px;margin:0 auto}.video-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:3rem}.video-wrapper{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:1rem;margin-bottom:2rem}.video-wrapper iframe{position:absolute;top:0;left:0;width:100%;height:100%}.speaker-info{display:flex;align-items:center;gap:1.5rem;padding:2rem;background:#f9fafb;border-radius:0.5rem}.speaker-avatar{width:80px;height:80px;border-radius:50%;object-fit:cover}.speaker-details h3{font-size:1.25rem;font-weight:600;color:#111827;margin-bottom:0.25rem}.speaker-details p{font-size:0.875rem;color:#6b7280}`
  },
  {
    name: 'Video - Playlist',
    description: 'Video player with playlist sidebar',
    category: 'video',
    tags: ['video', 'playlist', 'sidebar', 'multiple'],
    html: `<section class="video-playlist"><div class="video-container"><h2>Video Series</h2><div class="playlist-wrapper"><div class="main-video"><div class="video-wrapper"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe></div><h3>Episode 1: Introduction</h3></div><div class="playlist-sidebar"><div class="playlist-item active"><img src="https://via.placeholder.com/120x68?text=Ep1" alt="Episode 1"><span>Episode 1</span></div><div class="playlist-item"><img src="https://via.placeholder.com/120x68?text=Ep2" alt="Episode 2"><span>Episode 2</span></div><div class="playlist-item"><img src="https://via.placeholder.com/120x68?text=Ep3" alt="Episode 3"><span>Episode 3</span></div></div></div></div></section>`,
    css: `.video-playlist{padding:5rem 2rem;background:#f9fafb}.video-container{max-width:1200px;margin:0 auto}.video-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:3rem}.playlist-wrapper{display:grid;grid-template-columns:2fr 1fr;gap:2rem}.video-wrapper{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:0.5rem;margin-bottom:1rem}.video-wrapper iframe{position:absolute;top:0;left:0;width:100%;height:100%}.main-video h3{font-size:1.5rem;font-weight:600;color:#111827}.playlist-sidebar{display:flex;flex-direction:column;gap:1rem}.playlist-item{display:flex;align-items:center;gap:1rem;padding:1rem;background:white;border-radius:0.5rem;cursor:pointer;transition:all 0.3s}.playlist-item:hover,.playlist-item.active{background:#2563eb;color:white}.playlist-item img{width:120px;height:68px;object-fit:cover;border-radius:0.25rem}.playlist-item span{font-weight:500}@media(max-width:768px){.playlist-wrapper{grid-template-columns:1fr}}`
  },
  {
    name: 'Video - Hero Banner',
    description: 'Video hero section with overlay text',
    category: 'video',
    tags: ['video', 'hero', 'banner', 'header'],
    html: `<section class="video-hero"><div class="video-wrapper"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ" frameborder="0" allow="autoplay" allowfullscreen></iframe></div><div class="hero-overlay"><div class="hero-content"><h1>Transform Your Business</h1><p>Watch how we help companies succeed</p><button class="hero-btn">Watch Full Story</button></div></div></section>`,
    css: `.video-hero{position:relative;height:80vh;overflow:hidden}.video-wrapper{position:absolute;top:0;left:0;width:100%;height:100%}.video-wrapper iframe{width:100vw;height:56.25vw;min-height:100vh;min-width:177.77vh;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.hero-overlay{position:relative;z-index:1;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5)}.hero-content{text-align:center;color:white;padding:2rem}.hero-content h1{font-size:4rem;font-weight:700;margin-bottom:1.5rem}.hero-content p{font-size:1.5rem;margin-bottom:2rem}.hero-btn{padding:1rem 3rem;background:white;color:#111827;border:none;border-radius:0.5rem;font-size:1.125rem;font-weight:600;cursor:pointer;transition:transform 0.3s}.hero-btn:hover{transform:scale(1.05)}@media(max-width:768px){.video-hero{height:60vh}.hero-content h1{font-size:2.5rem}.hero-content p{font-size:1.125rem}}`
  }
];

async function seed() {
  console.log('\n🌱 Starting Video components seeding...\n');
  let success = 0, errors = 0;
  
  for (const c of components) {
    try {
      const data = { block_type: 'video', html: c.html, css: c.css, js: null, schema: {}, default_props: {}, responsive_settings: {} };
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
