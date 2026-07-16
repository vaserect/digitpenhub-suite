/**
 * Week 2 - Gallery Components
 * 10 image gallery components
 */

require('dotenv').config();
const db = require('../src/db');

const components = [
  {
    name: 'Gallery - Grid 3 Column',
    description: 'Simple 3-column image grid',
    category: 'gallery',
    tags: ['gallery', 'grid', 'images', 'photos'],
    html: `<section class="gallery-grid-3"><div class="gallery-container"><h2>Our Gallery</h2><div class="gallery-grid"><img src="https://via.placeholder.com/400x300?text=Image+1" alt="Gallery 1"><img src="https://via.placeholder.com/400x300?text=Image+2" alt="Gallery 2"><img src="https://via.placeholder.com/400x300?text=Image+3" alt="Gallery 3"><img src="https://via.placeholder.com/400x300?text=Image+4" alt="Gallery 4"><img src="https://via.placeholder.com/400x300?text=Image+5" alt="Gallery 5"><img src="https://via.placeholder.com/400x300?text=Image+6" alt="Gallery 6"></div></div></section>`,
    css: `.gallery-grid-3{padding:5rem 2rem;background:white}.gallery-container{max-width:1200px;margin:0 auto}.gallery-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:3rem}.gallery-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem}.gallery-grid img{width:100%;height:300px;object-fit:cover;border-radius:0.5rem;transition:transform 0.3s}.gallery-grid img:hover{transform:scale(1.05)}@media(max-width:768px){.gallery-grid{grid-template-columns:1fr;gap:1.5rem}}`
  },
  {
    name: 'Gallery - Masonry',
    description: 'Pinterest-style masonry gallery',
    category: 'gallery',
    tags: ['gallery', 'masonry', 'pinterest', 'images'],
    html: `<section class="gallery-masonry"><div class="gallery-container"><h2>Photo Gallery</h2><div class="masonry-grid"><img src="https://via.placeholder.com/400x300?text=Image+1" alt="Gallery 1"><img src="https://via.placeholder.com/400x500?text=Image+2" alt="Gallery 2"><img src="https://via.placeholder.com/400x400?text=Image+3" alt="Gallery 3"><img src="https://via.placeholder.com/400x350?text=Image+4" alt="Gallery 4"><img src="https://via.placeholder.com/400x450?text=Image+5" alt="Gallery 5"><img src="https://via.placeholder.com/400x300?text=Image+6" alt="Gallery 6"></div></div></section>`,
    css: `.gallery-masonry{padding:5rem 2rem;background:#f9fafb}.gallery-container{max-width:1200px;margin:0 auto}.gallery-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:3rem}.masonry-grid{column-count:3;column-gap:2rem}.masonry-grid img{width:100%;margin-bottom:2rem;border-radius:0.5rem;transition:transform 0.3s;cursor:pointer}.masonry-grid img:hover{transform:scale(1.02)}@media(max-width:768px){.masonry-grid{column-count:1}}`
  },
  {
    name: 'Gallery - With Captions',
    description: 'Gallery with image captions',
    category: 'gallery',
    tags: ['gallery', 'captions', 'images', 'descriptions'],
    html: `<section class="gallery-captions"><div class="gallery-container"><h2>Featured Work</h2><div class="gallery-grid"><div class="gallery-item"><img src="https://via.placeholder.com/400x300?text=Project+1" alt="Project 1"><div class="caption"><h3>Project Title 1</h3><p>Brief description</p></div></div><div class="gallery-item"><img src="https://via.placeholder.com/400x300?text=Project+2" alt="Project 2"><div class="caption"><h3>Project Title 2</h3><p>Brief description</p></div></div><div class="gallery-item"><img src="https://via.placeholder.com/400x300?text=Project+3" alt="Project 3"><div class="caption"><h3>Project Title 3</h3><p>Brief description</p></div></div><div class="gallery-item"><img src="https://via.placeholder.com/400x300?text=Project+4" alt="Project 4"><div class="caption"><h3>Project Title 4</h3><p>Brief description</p></div></div></div></div></section>`,
    css: `.gallery-captions{padding:5rem 2rem;background:white}.gallery-container{max-width:1200px;margin:0 auto}.gallery-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:3rem}.gallery-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:3rem}.gallery-item{position:relative;overflow:hidden;border-radius:0.5rem}.gallery-item img{width:100%;height:350px;object-fit:cover;transition:transform 0.3s}.gallery-item:hover img{transform:scale(1.1)}.caption{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,0.8),transparent);color:white;padding:2rem;transform:translateY(100%);transition:transform 0.3s}.gallery-item:hover .caption{transform:translateY(0)}.caption h3{font-size:1.25rem;font-weight:600;margin-bottom:0.5rem}.caption p{font-size:0.875rem;opacity:0.9}@media(max-width:768px){.gallery-grid{grid-template-columns:1fr}}`
  },
  {
    name: 'Gallery - Lightbox',
    description: 'Gallery with lightbox overlay effect',
    category: 'gallery',
    tags: ['gallery', 'lightbox', 'overlay', 'modal'],
    html: `<section class="gallery-lightbox"><div class="gallery-container"><h2>Portfolio</h2><div class="gallery-grid"><div class="gallery-item"><img src="https://via.placeholder.com/400x300?text=Image+1" alt="Image 1"><div class="overlay"><span>View</span></div></div><div class="gallery-item"><img src="https://via.placeholder.com/400x300?text=Image+2" alt="Image 2"><div class="overlay"><span>View</span></div></div><div class="gallery-item"><img src="https://via.placeholder.com/400x300?text=Image+3" alt="Image 3"><div class="overlay"><span>View</span></div></div><div class="gallery-item"><img src="https://via.placeholder.com/400x300?text=Image+4" alt="Image 4"><div class="overlay"><span>View</span></div></div><div class="gallery-item"><img src="https://via.placeholder.com/400x300?text=Image+5" alt="Image 5"><div class="overlay"><span>View</span></div></div><div class="gallery-item"><img src="https://via.placeholder.com/400x300?text=Image+6" alt="Image 6"><div class="overlay"><span>View</span></div></div></div></div></section>`,
    css: `.gallery-lightbox{padding:5rem 2rem;background:#f9fafb}.gallery-container{max-width:1200px;margin:0 auto}.gallery-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:3rem}.gallery-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}.gallery-item{position:relative;overflow:hidden;border-radius:0.5rem;cursor:pointer}.gallery-item img{width:100%;height:250px;object-fit:cover;transition:transform 0.3s}.overlay{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s}.gallery-item:hover .overlay{opacity:1}.gallery-item:hover img{transform:scale(1.1)}.overlay span{color:white;font-size:1.125rem;font-weight:600;padding:0.75rem 2rem;border:2px solid white;border-radius:0.5rem}@media(max-width:768px){.gallery-grid{grid-template-columns:repeat(2,1fr)}}`
  },
  {
    name: 'Gallery - Slider',
    description: 'Horizontal scrolling gallery slider',
    category: 'gallery',
    tags: ['gallery', 'slider', 'carousel', 'scroll'],
    html: `<section class="gallery-slider"><div class="gallery-container"><h2>Image Slider</h2><div class="slider-wrapper"><div class="slider-track"><img src="https://via.placeholder.com/600x400?text=Slide+1" alt="Slide 1"><img src="https://via.placeholder.com/600x400?text=Slide+2" alt="Slide 2"><img src="https://via.placeholder.com/600x400?text=Slide+3" alt="Slide 3"><img src="https://via.placeholder.com/600x400?text=Slide+4" alt="Slide 4"></div></div></div></section>`,
    css: `.gallery-slider{padding:5rem 2rem;background:white}.gallery-container{max-width:1200px;margin:0 auto}.gallery-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:3rem}.slider-wrapper{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:thin}.slider-track{display:flex;gap:2rem;padding-bottom:1rem}.slider-track img{flex:0 0 600px;height:400px;object-fit:cover;border-radius:0.5rem;transition:transform 0.3s}.slider-track img:hover{transform:scale(1.02)}@media(max-width:768px){.slider-track img{flex:0 0 90vw;height:300px}}`
  },
  {
    name: 'Gallery - Full Width',
    description: 'Full-width gallery showcase',
    category: 'gallery',
    tags: ['gallery', 'full-width', 'showcase', 'hero'],
    html: `<section class="gallery-fullwidth"><div class="gallery-grid"><img src="https://via.placeholder.com/1200x600?text=Image+1" alt="Image 1"><img src="https://via.placeholder.com/1200x600?text=Image+2" alt="Image 2"><img src="https://via.placeholder.com/1200x600?text=Image+3" alt="Image 3"></div></section>`,
    css: `.gallery-fullwidth{padding:0}.gallery-grid{display:grid;grid-template-columns:1fr;gap:0}.gallery-grid img{width:100%;height:600px;object-fit:cover}@media(max-width:768px){.gallery-grid img{height:400px}}`
  },
  {
    name: 'Gallery - Grid 4 Column',
    description: '4-column compact gallery grid',
    category: 'gallery',
    tags: ['gallery', 'grid', '4-column', 'compact'],
    html: `<section class="gallery-grid-4"><div class="gallery-container"><h2>Image Gallery</h2><div class="gallery-grid"><img src="https://via.placeholder.com/300x300?text=1" alt="Image 1"><img src="https://via.placeholder.com/300x300?text=2" alt="Image 2"><img src="https://via.placeholder.com/300x300?text=3" alt="Image 3"><img src="https://via.placeholder.com/300x300?text=4" alt="Image 4"><img src="https://via.placeholder.com/300x300?text=5" alt="Image 5"><img src="https://via.placeholder.com/300x300?text=6" alt="Image 6"><img src="https://via.placeholder.com/300x300?text=7" alt="Image 7"><img src="https://via.placeholder.com/300x300?text=8" alt="Image 8"></div></div></section>`,
    css: `.gallery-grid-4{padding:5rem 2rem;background:white}.gallery-container{max-width:1200px;margin:0 auto}.gallery-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:3rem}.gallery-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}.gallery-grid img{width:100%;height:250px;object-fit:cover;border-radius:0.25rem;transition:opacity 0.3s}.gallery-grid img:hover{opacity:0.8}@media(max-width:768px){.gallery-grid{grid-template-columns:repeat(2,1fr)}}`
  },
  {
    name: 'Gallery - With Filters',
    description: 'Gallery with category filters',
    category: 'gallery',
    tags: ['gallery', 'filters', 'categories', 'tabs'],
    html: `<section class="gallery-filters"><div class="gallery-container"><h2>Filtered Gallery</h2><div class="filter-tabs"><button class="filter-btn active">All</button><button class="filter-btn">Nature</button><button class="filter-btn">Architecture</button><button class="filter-btn">People</button></div><div class="gallery-grid"><img src="https://via.placeholder.com/400x300?text=Nature+1" alt="Nature 1" data-category="nature"><img src="https://via.placeholder.com/400x300?text=Architecture+1" alt="Architecture 1" data-category="architecture"><img src="https://via.placeholder.com/400x300?text=People+1" alt="People 1" data-category="people"><img src="https://via.placeholder.com/400x300?text=Nature+2" alt="Nature 2" data-category="nature"><img src="https://via.placeholder.com/400x300?text=Architecture+2" alt="Architecture 2" data-category="architecture"><img src="https://via.placeholder.com/400x300?text=People+2" alt="People 2" data-category="people"></div></div></section>`,
    css: `.gallery-filters{padding:5rem 2rem;background:#f9fafb}.gallery-container{max-width:1200px;margin:0 auto}.gallery-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:2rem}.filter-tabs{display:flex;justify-content:center;gap:1rem;margin-bottom:3rem;flex-wrap:wrap}.filter-btn{padding:0.75rem 2rem;background:white;border:1px solid #e5e7eb;border-radius:0.5rem;font-weight:500;color:#6b7280;cursor:pointer;transition:all 0.3s}.filter-btn:hover,.filter-btn.active{background:#2563eb;color:white;border-color:#2563eb}.gallery-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem}.gallery-grid img{width:100%;height:300px;object-fit:cover;border-radius:0.5rem;transition:transform 0.3s}.gallery-grid img:hover{transform:scale(1.05)}@media(max-width:768px){.gallery-grid{grid-template-columns:1fr}}`
  },
  {
    name: 'Gallery - Polaroid Style',
    description: 'Polaroid-style photo gallery',
    category: 'gallery',
    tags: ['gallery', 'polaroid', 'vintage', 'photos'],
    html: `<section class="gallery-polaroid"><div class="gallery-container"><h2>Memories</h2><div class="gallery-grid"><div class="polaroid"><img src="https://via.placeholder.com/300x300?text=Photo+1" alt="Photo 1"><p>Summer 2024</p></div><div class="polaroid"><img src="https://via.placeholder.com/300x300?text=Photo+2" alt="Photo 2"><p>Beach Day</p></div><div class="polaroid"><img src="https://via.placeholder.com/300x300?text=Photo+3" alt="Photo 3"><p>City Life</p></div><div class="polaroid"><img src="https://via.placeholder.com/300x300?text=Photo+4" alt="Photo 4"><p>Adventure</p></div><div class="polaroid"><img src="https://via.placeholder.com/300x300?text=Photo+5" alt="Photo 5"><p>Friends</p></div><div class="polaroid"><img src="https://via.placeholder.com/300x300?text=Photo+6" alt="Photo 6"><p>Sunset</p></div></div></div></section>`,
    css: `.gallery-polaroid{padding:5rem 2rem;background:#f9fafb}.gallery-container{max-width:1200px;margin:0 auto}.gallery-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:3rem}.gallery-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3rem}.polaroid{background:white;padding:1rem;padding-bottom:3rem;box-shadow:0 4px 6px rgba(0,0,0,0.1);transform:rotate(-2deg);transition:all 0.3s}.polaroid:nth-child(even){transform:rotate(2deg)}.polaroid:hover{transform:rotate(0deg) scale(1.05);box-shadow:0 10px 25px rgba(0,0,0,0.15)}.polaroid img{width:100%;height:300px;object-fit:cover;margin-bottom:1rem}.polaroid p{text-align:center;font-family:'Courier New',monospace;color:#6b7280;font-size:0.875rem}@media(max-width:768px){.gallery-grid{grid-template-columns:1fr;gap:2rem}}`
  },
  {
    name: 'Gallery - Hover Zoom',
    description: 'Gallery with smooth hover zoom effect',
    category: 'gallery',
    tags: ['gallery', 'hover', 'zoom', 'interactive'],
    html: `<section class="gallery-zoom"><div class="gallery-container"><h2>Explore</h2><div class="gallery-grid"><div class="zoom-item"><img src="https://via.placeholder.com/500x400?text=Image+1" alt="Image 1"></div><div class="zoom-item"><img src="https://via.placeholder.com/500x400?text=Image+2" alt="Image 2"></div><div class="zoom-item"><img src="https://via.placeholder.com/500x400?text=Image+3" alt="Image 3"></div><div class="zoom-item"><img src="https://via.placeholder.com/500x400?text=Image+4" alt="Image 4"></div></div></div></section>`,
    css: `.gallery-zoom{padding:5rem 2rem;background:white}.gallery-container{max-width:1200px;margin:0 auto}.gallery-container h2{text-align:center;font-size:2.5rem;font-weight:700;color:#111827;margin-bottom:3rem}.gallery-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:2rem}.zoom-item{overflow:hidden;border-radius:1rem;cursor:pointer}.zoom-item img{width:100%;height:400px;object-fit:cover;transition:transform 0.5s ease}.zoom-item:hover img{transform:scale(1.2)}@media(max-width:768px){.gallery-grid{grid-template-columns:1fr}.zoom-item img{height:300px}}`
  }
];

async function seed() {
  console.log('\n🌱 Starting Gallery components seeding...\n');
  let success = 0, errors = 0;
  
  for (const c of components) {
    try {
      const data = { block_type: 'gallery', html: c.html, css: c.css, js: null, schema: {}, default_props: {}, responsive_settings: {} };
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
