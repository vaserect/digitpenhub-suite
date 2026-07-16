/**
 * Seed Script: Footer Components
 * Creates 5 premium footer components with different layouts
 * 
 * Usage: node scripts/seed-footer-components.js
 */

require('dotenv').config();
const db = require('../src/db');

const footerComponents = [
  {
    name: 'Footer - Simple Centered',
    description: 'Clean centered footer with social links',
    category: 'footer',
    is_global: true,
    is_active: true,
    tags: ['footer', 'simple', 'centered', 'social'],
    component_data: {
      type: 'footer',
      variant: 'simple-centered',
      html: `<footer class="footer-simple"><div class="footer-container"><div class="footer-logo"><img src="{{logoUrl}}" alt="{{companyName}}"/></div><p class="footer-tagline">{{tagline}}</p><div class="footer-social"><a href="{{twitterUrl}}" aria-label="Twitter"><svg width="24" height="24" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg></a><a href="{{facebookUrl}}" aria-label="Facebook"><svg width="24" height="24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></a><a href="{{linkedinUrl}}" aria-label="LinkedIn"><svg width="24" height="24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg></a><a href="{{instagramUrl}}" aria-label="Instagram"><svg width="24" height="24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a></div><div class="footer-links"><a href="{{privacyUrl}}">Privacy Policy</a><span>•</span><a href="{{termsUrl}}">Terms of Service</a></div><p class="footer-copyright">{{copyright}}</p></div></footer>`,
      css: `.footer-simple{padding:4rem 2rem 2rem;background:#111827;color:white;text-align:center}.footer-container{max-width:600px;margin:0 auto}.footer-logo{margin-bottom:1.5rem}.footer-logo img{height:40px;width:auto}.footer-tagline{font-size:1rem;color:#9ca3af;margin-bottom:2rem;line-height:1.6}.footer-social{display:flex;justify-content:center;gap:1.5rem;margin-bottom:2rem}.footer-social a{color:#9ca3af;transition:color .2s}.footer-social a:hover{color:white}.footer-links{display:flex;justify-content:center;align-items:center;gap:1rem;margin-bottom:1.5rem;font-size:.875rem}.footer-links a{color:#9ca3af;text-decoration:none;transition:color .2s}.footer-links a:hover{color:white}.footer-links span{color:#4b5563}.footer-copyright{font-size:.875rem;color:#6b7280}`,
      schema: {
        logoUrl: { type: 'image', label: 'Logo URL', default: 'https://via.placeholder.com/120x40/667eea/ffffff?text=Logo' },
        companyName: { type: 'text', label: 'Company Name', default: 'Your Company' },
        tagline: { type: 'text', label: 'Tagline', default: 'Building amazing products for amazing people' },
        twitterUrl: { type: 'text', label: 'Twitter URL', default: '#' },
        facebookUrl: { type: 'text', label: 'Facebook URL', default: '#' },
        linkedinUrl: { type: 'text', label: 'LinkedIn URL', default: '#' },
        instagramUrl: { type: 'text', label: 'Instagram URL', default: '#' },
        privacyUrl: { type: 'text', label: 'Privacy Policy URL', default: '#' },
        termsUrl: { type: 'text', label: 'Terms URL', default: '#' },
        copyright: { type: 'text', label: 'Copyright', default: '© 2024 Your Company. All rights reserved.' }
      },
      defaultProps: {
        logoUrl: 'https://via.placeholder.com/120x40/667eea/ffffff?text=Logo',
        companyName: 'Your Company',
        tagline: 'Building amazing products for amazing people',
        twitterUrl: '#',
        facebookUrl: '#',
        linkedinUrl: '#',
        instagramUrl: '#',
        privacyUrl: '#',
        termsUrl: '#',
        copyright: '© 2024 Your Company. All rights reserved.'
      }
    }
  },
  {
    name: 'Footer - Multi-Column',
    description: 'Comprehensive footer with multiple link columns',
    category: 'footer',
    is_global: true,
    is_active: true,
    tags: ['footer', 'multi-column', 'links', 'comprehensive'],
    component_data: {
      type: 'footer',
      variant: 'multi-column',
      html: `<footer class="footer-multi"><div class="footer-multi-container"><div class="footer-multi-brand"><img src="{{logoUrl}}" alt="{{companyName}}" class="footer-multi-logo"/><p class="footer-multi-desc">{{description}}</p><div class="footer-multi-social"><a href="{{twitterUrl}}"><svg width="20" height="20" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg></a><a href="{{facebookUrl}}"><svg width="20" height="20" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></a><a href="{{linkedinUrl}}"><svg width="20" height="20" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg></a></div></div><div class="footer-multi-links"><div class="footer-multi-column"><h4>{{column1Title}}</h4><a href="#">{{column1Link1}}</a><a href="#">{{column1Link2}}</a><a href="#">{{column1Link3}}</a><a href="#">{{column1Link4}}</a></div><div class="footer-multi-column"><h4>{{column2Title}}</h4><a href="#">{{column2Link1}}</a><a href="#">{{column2Link2}}</a><a href="#">{{column2Link3}}</a><a href="#">{{column2Link4}}</a></div><div class="footer-multi-column"><h4>{{column3Title}}</h4><a href="#">{{column3Link1}}</a><a href="#">{{column3Link2}}</a><a href="#">{{column3Link3}}</a><a href="#">{{column3Link4}}</a></div></div></div><div class="footer-multi-bottom"><p>{{copyright}}</p><div class="footer-multi-legal"><a href="{{privacyUrl}}">Privacy</a><a href="{{termsUrl}}">Terms</a><a href="{{cookiesUrl}}">Cookies</a></div></div></footer>`,
      css: `.footer-multi{padding:4rem 2rem 2rem;background:#111827;color:white}.footer-multi-container{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 3fr;gap:4rem;margin-bottom:3rem}.footer-multi-brand{}.footer-multi-logo{height:40px;width:auto;margin-bottom:1.5rem}.footer-multi-desc{color:#9ca3af;line-height:1.6;margin-bottom:1.5rem}.footer-multi-social{display:flex;gap:1rem}.footer-multi-social a{color:#9ca3af;transition:color .2s}.footer-multi-social a:hover{color:white}.footer-multi-links{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem}.footer-multi-column h4{font-size:.875rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:1rem;color:white}.footer-multi-column a{display:block;color:#9ca3af;text-decoration:none;margin-bottom:.75rem;transition:color .2s}.footer-multi-column a:hover{color:white}.footer-multi-bottom{max-width:1200px;margin:0 auto;padding-top:2rem;border-top:1px solid #374151;display:flex;justify-content:space-between;align-items:center;font-size:.875rem;color:#6b7280}.footer-multi-legal{display:flex;gap:1.5rem}.footer-multi-legal a{color:#9ca3af;text-decoration:none;transition:color .2s}.footer-multi-legal a:hover{color:white}@media(max-width:768px){.footer-multi-container{grid-template-columns:1fr}.footer-multi-links{grid-template-columns:1fr}.footer-multi-bottom{flex-direction:column;gap:1rem;text-align:center}}`,
      schema: {
        logoUrl: { type: 'image', label: 'Logo URL', default: 'https://via.placeholder.com/120x40/667eea/ffffff?text=Logo' },
        companyName: { type: 'text', label: 'Company Name', default: 'Your Company' },
        description: { type: 'textarea', label: 'Description', default: 'Making the world a better place through innovative technology solutions.' },
        twitterUrl: { type: 'text', label: 'Twitter URL', default: '#' },
        facebookUrl: { type: 'text', label: 'Facebook URL', default: '#' },
        linkedinUrl: { type: 'text', label: 'LinkedIn URL', default: '#' },
        column1Title: { type: 'text', label: 'Column 1 Title', default: 'Product' },
        column1Link1: { type: 'text', label: 'Column 1 Link 1', default: 'Features' },
        column1Link2: { type: 'text', label: 'Column 1 Link 2', default: 'Pricing' },
        column1Link3: { type: 'text', label: 'Column 1 Link 3', default: 'Integrations' },
        column1Link4: { type: 'text', label: 'Column 1 Link 4', default: 'Changelog' },
        column2Title: { type: 'text', label: 'Column 2 Title', default: 'Company' },
        column2Link1: { type: 'text', label: 'Column 2 Link 1', default: 'About' },
        column2Link2: { type: 'text', label: 'Column 2 Link 2', default: 'Blog' },
        column2Link3: { type: 'text', label: 'Column 2 Link 3', default: 'Careers' },
        column2Link4: { type: 'text', label: 'Column 2 Link 4', default: 'Press' },
        column3Title: { type: 'text', label: 'Column 3 Title', default: 'Support' },
        column3Link1: { type: 'text', label: 'Column 3 Link 1', default: 'Help Center' },
        column3Link2: { type: 'text', label: 'Column 3 Link 2', default: 'Contact' },
        column3Link3: { type: 'text', label: 'Column 3 Link 3', default: 'Status' },
        column3Link4: { type: 'text', label: 'Column 3 Link 4', default: 'API Docs' },
        copyright: { type: 'text', label: 'Copyright', default: '© 2024 Your Company. All rights reserved.' },
        privacyUrl: { type: 'text', label: 'Privacy URL', default: '#' },
        termsUrl: { type: 'text', label: 'Terms URL', default: '#' },
        cookiesUrl: { type: 'text', label: 'Cookies URL', default: '#' }
      },
      defaultProps: {
        logoUrl: 'https://via.placeholder.com/120x40/667eea/ffffff?text=Logo',
        companyName: 'Your Company',
        description: 'Making the world a better place through innovative technology solutions.',
        twitterUrl: '#',
        facebookUrl: '#',
        linkedinUrl: '#',
        column1Title: 'Product',
        column1Link1: 'Features',
        column1Link2: 'Pricing',
        column1Link3: 'Integrations',
        column1Link4: 'Changelog',
        column2Title: 'Company',
        column2Link1: 'About',
        column2Link2: 'Blog',
        column2Link3: 'Careers',
        column2Link4: 'Press',
        column3Title: 'Support',
        column3Link1: 'Help Center',
        column3Link2: 'Contact',
        column3Link3: 'Status',
        column3Link4: 'API Docs',
        copyright: '© 2024 Your Company. All rights reserved.',
        privacyUrl: '#',
        termsUrl: '#',
        cookiesUrl: '#'
      }
    }
  },
  {
    name: 'Footer - Newsletter',
    description: 'Footer with newsletter subscription form',
    category: 'footer',
    is_global: true,
    is_active: true,
    tags: ['footer', 'newsletter', 'subscription', 'email'],
    component_data: {
      type: 'footer',
      variant: 'newsletter',
      html: `<footer class="footer-newsletter"><div class="footer-newsletter-container"><div class="footer-newsletter-content"><h3 class="footer-newsletter-title">{{title}}</h3><p class="footer-newsletter-text">{{text}}</p><form class="footer-newsletter-form"><input type="email" placeholder="{{emailPlaceholder}}" class="newsletter-email"/><button type="submit" class="newsletter-btn">{{submitText}}</button></form></div><div class="footer-newsletter-links"><div class="footer-newsletter-column"><h4>{{column1Title}}</h4><a href="#">{{column1Link1}}</a><a href="#">{{column1Link2}}</a><a href="#">{{column1Link3}}</a></div><div class="footer-newsletter-column"><h4>{{column2Title}}</h4><a href="#">{{column2Link1}}</a><a href="#">{{column2Link2}}</a><a href="#">{{column2Link3}}</a></div></div></div><div class="footer-newsletter-bottom"><p>{{copyright}}</p></div></footer>`,
      css: `.footer-newsletter{padding:4rem 2rem 2rem;background:#1f2937;color:white}.footer-newsletter-container{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr;gap:4rem;margin-bottom:3rem}.footer-newsletter-title{font-size:1.5rem;font-weight:700;margin-bottom:.75rem}.footer-newsletter-text{color:#9ca3af;margin-bottom:1.5rem;line-height:1.6}.footer-newsletter-form{display:flex;gap:.5rem}.newsletter-email{flex:1;padding:.875rem 1rem;background:#374151;border:1px solid #4b5563;border-radius:.375rem;color:white;outline:none}.newsletter-email::placeholder{color:#9ca3af}.newsletter-btn{padding:.875rem 1.5rem;background:#3b82f6;color:white;border:none;border-radius:.375rem;font-weight:600;cursor:pointer;transition:background .2s;white-space:nowrap}.newsletter-btn:hover{background:#2563eb}.footer-newsletter-links{display:grid;grid-template-columns:repeat(2,1fr);gap:2rem}.footer-newsletter-column h4{font-size:.875rem;font-weight:600;margin-bottom:1rem;color:white}.footer-newsletter-column a{display:block;color:#9ca3af;text-decoration:none;margin-bottom:.75rem;font-size:.875rem;transition:color .2s}.footer-newsletter-column a:hover{color:white}.footer-newsletter-bottom{max-width:1200px;margin:0 auto;padding-top:2rem;border-top:1px solid #374151;text-align:center;font-size:.875rem;color:#6b7280}@media(max-width:768px){.footer-newsletter-container{grid-template-columns:1fr}.footer-newsletter-form{flex-direction:column}.newsletter-email,.newsletter-btn{width:100%}}`,
      schema: {
        title: { type: 'text', label: 'Title', default: 'Subscribe to our newsletter' },
        text: { type: 'textarea', label: 'Text', default: 'Get the latest news and updates delivered to your inbox.' },
        emailPlaceholder: { type: 'text', label: 'Email Placeholder', default: 'Enter your email' },
        submitText: { type: 'text', label: 'Submit Button', default: 'Subscribe' },
        column1Title: { type: 'text', label: 'Column 1 Title', default: 'Quick Links' },
        column1Link1: { type: 'text', label: 'Column 1 Link 1', default: 'About Us' },
        column1Link2: { type: 'text', label: 'Column 1 Link 2', default: 'Contact' },
        column1Link3: { type: 'text', label: 'Column 1 Link 3', default: 'Blog' },
        column2Title: { type: 'text', label: 'Column 2 Title', default: 'Legal' },
        column2Link1: { type: 'text', label: 'Column 2 Link 1', default: 'Privacy' },
        column2Link2: { type: 'text', label: 'Column 2 Link 2', default: 'Terms' },
        column2Link3: { type: 'text', label: 'Column 2 Link 3', default: 'Cookies' },
        copyright: { type: 'text', label: 'Copyright', default: '© 2024 Your Company. All rights reserved.' }
      },
      defaultProps: {
        title: 'Subscribe to our newsletter',
        text: 'Get the latest news and updates delivered to your inbox.',
        emailPlaceholder: 'Enter your email',
        submitText: 'Subscribe',
        column1Title: 'Quick Links',
        column1Link1: 'About Us',
        column1Link2: 'Contact',
        column1Link3: 'Blog',
        column2Title: 'Legal',
        column2Link1: 'Privacy',
        column2Link2: 'Terms',
        column2Link3: 'Cookies',
        copyright: '© 2024 Your Company. All rights reserved.'
      }
    }
  },
  {
    name: 'Footer - Minimal',
    description: 'Ultra-minimal footer with essential links only',
    category: 'footer',
    is_global: true,
    is_active: true,
    tags: ['footer', 'minimal', 'simple', 'clean'],
    component_data: {
      type: 'footer',
      variant: 'minimal',
      html: `<footer class="footer-minimal"><div class="footer-minimal-container"><div class="footer-minimal-links"><a href="{{link1Url}}">{{link1Text}}</a><span>•</span><a href="{{link2Url}}">{{link2Text}}</a><span>•</span><a href="{{link3Url}}">{{link3Text}}</a><span>•</span><a href="{{link4Url}}">{{link4Text}}</a></div><p class="footer-minimal-copyright">{{copyright}}</p></div></footer>`,
      css: `.footer-minimal{padding:2rem;background:#f9fafb;border-top:1px solid #e5e7eb}.footer-minimal-container{max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}.footer-minimal-links{display:flex;align-items:center;gap:1rem;font-size:.875rem}.footer-minimal-links a{color:#6b7280;text-decoration:none;transition:color .2s}.footer-minimal-links a:hover{color:#111827}.footer-minimal-links span{color:#d1d5db}.footer-minimal-copyright{font-size:.875rem;color:#9ca3af}@media(max-width:640px){.footer-minimal-container{flex-direction:column;gap:1rem;text-align:center}}`,
      schema: {
        link1Text: { type: 'text', label: 'Link 1 Text', default: 'About' },
        link1Url: { type: 'text', label: 'Link 1 URL', default: '#' },
        link2Text: { type: 'text', label: 'Link 2 Text', default: 'Privacy' },
        link2Url: { type: 'text', label: 'Link 2 URL', default: '#' },
        link3Text: { type: 'text', label: 'Link 3 Text', default: 'Terms' },
        link3Url: { type: 'text', label: 'Link 3 URL', default: '#' },
        link4Text: { type: 'text', label: 'Link 4 Text', default: 'Contact' },
        link4Url: { type: 'text', label: 'Link 4 URL', default: '#' },
        copyright: { type: 'text', label: 'Copyright', default: '© 2024 Your Company' }
      },
      defaultProps: {
        link1Text: 'About',
        link1Url: '#',
        link2Text: 'Privacy',
        link2Url: '#',
        link3Text: 'Terms',
        link3Url: '#',
        link4Text: 'Contact',
        link4Url: '#',
        copyright: '© 2024 Your Company'
      }
    }
  },
  {
    name: 'Footer - App Download',
    description: 'Footer with app store download buttons',
    category: 'footer',
    is_global: true,
    is_active: true,
    tags: ['footer', 'app', 'download', 'mobile'],
    component_data: {
      type: 'footer',
      variant: 'app-download',
      html: `<footer class="footer-app"><div class="footer-app-container"><div class="footer-app-content"><img src="{{logoUrl}}" alt="{{companyName}}" class="footer-app-logo"/><p class="footer-app-text">{{text}}</p><div class="footer-app-badges"><a href="{{appStoreUrl}}" class="app-badge"><svg width="120" height="40" viewBox="0 0 120 40"><rect width="120" height="40" rx="5" fill="#000"/><text x="60" y="15" fill="#fff" font-size="8" text-anchor="middle">Download on the</text><text x="60" y="28" fill="#fff" font-size="14" font-weight="bold" text-anchor="middle">App Store</text></svg></a><a href="{{playStoreUrl}}" class="app-badge"><svg width="135" height="40" viewBox="0 0 135 40"><rect width="135" height="40" rx="5" fill="#000"/><text x="67.5" y="15" fill="#fff" font-size="8" text-anchor="middle">GET IT ON</text><text x="67.5" y="28" fill="#fff" font-size="14" font-weight="bold" text-anchor="middle">Google Play</text></svg></a></div></div><div class="footer-app-links"><div class="footer-app-column"><h4>{{column1Title}}</h4><a href="#">{{column1Link1}}</a><a href="#">{{column1Link2}}</a><a href="#">{{column1Link3}}</a></div><div class="footer-app-column"><h4>{{column2Title}}</h4><a href="#">{{column2Link1}}</a><a href="#">{{column2Link2}}</a><a href="#">{{column2Link3}}</a></div></div></div><div class="footer-app-bottom"><p>{{copyright}}</p></div></footer>`,
      css: `.footer-app{padding:4rem 2rem 2rem;background:#111827;color:white}.footer-app-container{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr;gap:4rem;margin-bottom:3rem}.footer-app-logo{height:40px;width:auto;margin-bottom:1.5rem}.footer-app-text{color:#9ca3af;line-height:1.6;margin-bottom:2rem}.footer-app-badges{display:flex;gap:1rem}.app-badge{display:block;transition:opacity .2s}.app-badge:hover{opacity:.8}.footer-app-links{display:grid;grid-template-columns:repeat(2,1fr);gap:2rem}.footer-app-column h4{font-size:.875rem;font-weight:600;margin-bottom:1rem;color:white}.footer-app-column a{display:block;color:#9ca3af;text-decoration:none;margin-bottom:.75rem;font-size:.875rem;transition:color .2s}.footer-app-column a:hover{color:white}.footer-app-bottom{max-width:1200px;margin:0 auto;padding-top:2rem;border-top:1px solid #374151;text-align:center;font-size:.875rem;color:#6b7280}@media(max-width:768px){.footer-app-container{grid-template-columns:1fr}.footer-app-badges{flex-direction:column}}`,
      schema: {
        logoUrl: { type: 'image', label: 'Logo URL', default: 'https://via.placeholder.com/120x40/667eea/ffffff?text=Logo' },
        companyName: { type: 'text', label: 'Company Name', default: 'Your Company' },
        text: { type: 'textarea', label: 'Text', default: 'Download our app and take your experience to the next level.' },
        appStoreUrl: { type: 'text', label: 'App Store URL', default: '#' },
        playStoreUrl: { type: 'text', label: 'Play Store URL', default: '#' },
        column1Title: { type: 'text', label: 'Column 1 Title', default: 'Product' },
        column1Link1: { type: 'text', label: 'Column 1 Link 1', default: 'Features' },
        column1Link2: { type: 'text', label: 'Column 1 Link 2', default: 'Pricing' },
        column1Link3: { type: 'text', label: 'Column 1 Link 3', default: 'FAQ' },
        column2Title: { type: 'text', label: 'Column 2 Title', default: 'Company' },
        column2Link1: { type: 'text', label: 'Column 2 Link 1', default: 'About' },
        column2Link2: { type: 'text', label: 'Column 2 Link 2', default: 'Blog' },
        column2Link3: { type: 'text', label: 'Column 2 Link 3', default: 'Contact' },
        copyright: { type: 'text', label: 'Copyright', default: '© 2024 Your Company. All rights reserved.' }
      },
      defaultProps: {
        logoUrl: 'https://via.placeholder.com/120x40/667eea/ffffff?text=Logo',
        companyName: 'Your Company',
        text: 'Download our app and take your experience to the next level.',
        appStoreUrl: '#',
        playStoreUrl: '#',
        column1Title: 'Product',
        column1Link1: 'Features',
        column1Link2: 'Pricing',
        column1Link3: 'FAQ',
        column2Title: 'Company',
        column2Link1: 'About',
        column2Link2: 'Blog',
        column2Link3: 'Contact',
        copyright: '© 2024 Your Company. All rights reserved.'
      }
    }
  }
];

async function seedFooterComponents() {
  console.log('🌱 Seeding Footer components...\n');
  
  try {
    let successCount = 0;
    let errorCount = 0;

    for (const component of footerComponents) {
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
    console.log(`   Success: ${successCount}/${footerComponents.length}`);
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
  seedFooterComponents();
}

module.exports = { seedFooterComponents, footerComponents };
