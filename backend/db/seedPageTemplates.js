// Seeds the starter page/landing template library, pulling real imagery from
// Pexels for each template. Idempotent — skips any template name that
// already exists, so re-running is safe and only adds new ones.
require('dotenv').config();
const { Pool } = require('pg');
const { searchImages } = require('../src/utils/pexels');

function blk(type, fields) {
  return { id: `blk_${Math.random().toString(36).slice(2, 10)}`, type, ...fields };
}

async function img(query) {
  try {
    const results = await searchImages(query, { perPage: 1, orientation: 'landscape' });
    return results[0]?.url || '';
  } catch (err) {
    console.warn(`  ! image search failed for "${query}": ${err.message}`);
    return '';
  }
}

const TEMPLATES = [
  {
    category: 'Finance & Fintech',
    pageType: 'page',
    name: 'Digital Banking Homepage',
    description: 'A trust-focused homepage for a modern digital bank.',
    imageQuery: 'mobile banking app',
    build: (heroImg) => [
      blk('hero', { heading: 'Banking that moves as fast as you do', subheading: 'Open an account in minutes. No hidden fees, ever.', ctaText: 'Open an account', ctaUrl: '#', bgColor: '#0f172a', textColor: '#ffffff', align: 'center' }),
      blk('features', { heading: 'Built for how you actually bank', items: [
        { icon: '🔒', title: 'Bank-grade security', desc: '256-bit encryption and real-time fraud monitoring on every transaction.' },
        { icon: '⚡', title: 'Instant transfers', desc: 'Send and receive money in seconds, not business days.' },
        { icon: '💬', title: '24/7 support', desc: 'Real humans, real answers, any time you need us.' },
      ] }),
      blk('image', { url: heroImg, alt: 'Mobile banking app', caption: '' }),
      blk('testimonials', { heading: 'Trusted by thousands', items: [
        { quote: 'Switched my whole business banking over in a weekend. Wish I\'d done it years ago.', author: 'Amara O.', role: 'Small business owner' },
      ] }),
      blk('cta', { heading: 'Ready to switch banks?', body: 'It takes less time than your coffee break.', buttonText: 'Get started', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Finance & Fintech',
    pageType: 'landing',
    name: 'Investment Platform Landing Page',
    description: 'A conversion-focused opt-in page for an investing app.',
    imageQuery: 'stock market trading screen',
    build: (heroImg) => [
      blk('hero', { heading: 'Invest smarter, grow faster', subheading: 'Commission-free trading, powerful tools, zero jargon.', ctaText: 'Start investing', ctaUrl: '#', bgColor: '#052e16', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Investment dashboard', caption: '' }),
      blk('features', { heading: 'Everything you need to invest with confidence', items: [
        { icon: '📈', title: 'Real-time data', desc: 'Live market data and portfolio tracking, always up to date.' },
        { icon: '🎯', title: 'Zero commission', desc: 'Keep more of what you earn — no trading fees.' },
        { icon: '🤝', title: 'Guided investing', desc: 'Personalized recommendations based on your goals.' },
      ] }),
      blk('cta', { heading: 'Your first trade is on us', body: 'Sign up today and get a free stock when you fund your account.', buttonText: 'Claim your offer', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Real Estate',
    pageType: 'page',
    name: 'Real Estate Agency Homepage',
    description: 'A polished homepage for a residential real estate agency.',
    imageQuery: 'modern house exterior',
    build: (heroImg) => [
      blk('hero', { heading: 'Find your dream home', subheading: 'Curated listings, expert agents, zero guesswork.', ctaText: 'Browse listings', ctaUrl: '#', bgColor: '#1c1917', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Modern house exterior', caption: '' }),
      blk('features', { heading: 'Why buyers choose us', items: [
        { icon: '🏠', title: 'Exclusive listings', desc: 'Access homes before they hit the open market.' },
        { icon: '🧑‍💼', title: 'Expert agents', desc: 'Local specialists who know every neighborhood inside out.' },
        { icon: '📋', title: 'Effortless paperwork', desc: 'We handle the contracts so you can focus on the move.' },
      ] }),
      blk('testimonials', { heading: 'What our clients say', items: [
        { quote: 'They found us a home in a neighborhood we hadn\'t even considered — it was perfect.', author: 'The Adeyemi family', role: 'Homebuyers' },
      ] }),
      blk('cta', { heading: 'Ready to start looking?', body: 'Tell us what you\'re looking for and we\'ll do the rest.', buttonText: 'Get in touch', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Real Estate',
    pageType: 'landing',
    name: 'Property Listing Landing Page',
    description: 'A single-property showcase page built to drive viewing requests.',
    imageQuery: 'luxury living room interior',
    build: (heroImg) => [
      blk('hero', { heading: 'A home that has it all', subheading: '4 bed · 3 bath · Move-in ready', ctaText: 'Schedule a viewing', ctaUrl: '#', bgColor: '#292524', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Living room interior', caption: 'Spacious open-plan living area' }),
      blk('text', { heading: 'About this property', body: 'This beautifully renovated home combines modern finishes with timeless architecture. Every room is filled with natural light, and the open floor plan makes it perfect for entertaining.' }),
      blk('features', { heading: 'Property highlights', items: [
        { icon: '🛏️', title: '4 Bedrooms', desc: 'Generously sized, all with built-in storage.' },
        { icon: '🚗', title: '2-Car Garage', desc: 'Plus additional off-street parking.' },
        { icon: '🌳', title: 'Private Garden', desc: 'Landscaped backyard with covered patio.' },
      ] }),
      blk('cta', { heading: 'Don\'t miss this one', body: 'Homes like this move fast — book your viewing today.', buttonText: 'Book a viewing', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'E-commerce & Retail',
    pageType: 'page',
    name: 'Online Storefront Homepage',
    description: 'A clean, product-forward homepage for a retail storefront.',
    imageQuery: 'fashion retail store display',
    build: (heroImg) => [
      blk('hero', { heading: 'Shop the new arrivals', subheading: 'Fresh styles, dropped weekly.', ctaText: 'Shop now', ctaUrl: '#', bgColor: '#7c2d12', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Retail store display', caption: '' }),
      blk('features', { heading: 'Why shop with us', items: [
        { icon: '🚚', title: 'Free shipping', desc: 'On every order over $50, no code needed.' },
        { icon: '↩️', title: 'Easy returns', desc: '30-day no-questions-asked return policy.' },
        { icon: '⭐', title: 'Loved by 50k+ customers', desc: 'Rated 4.8/5 across thousands of reviews.' },
      ] }),
      blk('cta', { heading: 'Get 10% off your first order', body: 'Sign up for our newsletter and save on your first purchase.', buttonText: 'Sign up & save', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'E-commerce & Retail',
    pageType: 'landing',
    name: 'Product Launch Landing Page',
    description: 'A single-product launch page built for pre-orders.',
    imageQuery: 'product photography studio',
    build: (heroImg) => [
      blk('hero', { heading: 'Introducing something new', subheading: 'The product you didn\'t know you needed — until now.', ctaText: 'Pre-order now', ctaUrl: '#', bgColor: '#18181b', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Product photography', caption: '' }),
      blk('features', { heading: 'Why it\'s different', items: [
        { icon: '✨', title: 'Thoughtfully designed', desc: 'Every detail considered, nothing wasted.' },
        { icon: '♻️', title: 'Sustainably made', desc: 'Responsibly sourced materials, every time.' },
        { icon: '🎁', title: 'Launch week bonus', desc: 'Pre-order now and get a free gift with your order.' },
      ] }),
      blk('cta', { heading: 'Be first in line', body: 'Limited launch quantity available — reserve yours today.', buttonText: 'Reserve now', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'SaaS & Tech Startups',
    pageType: 'page',
    name: 'SaaS Product Homepage',
    description: 'A crisp, benefit-led homepage for a B2B SaaS product.',
    imageQuery: 'team working laptops office',
    build: (heroImg) => [
      blk('hero', { heading: 'The all-in-one platform your team actually enjoys using', subheading: 'Replace five tools with one. Set up in minutes.', ctaText: 'Start free trial', ctaUrl: '#', bgColor: '#1e1b4b', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Team working on laptops', caption: '' }),
      blk('features', { heading: 'Everything your team needs, in one place', items: [
        { icon: '🔗', title: 'Integrates with your stack', desc: 'Connects to the tools you already use in minutes.' },
        { icon: '📊', title: 'Real-time reporting', desc: 'See what\'s working, instantly, no spreadsheets required.' },
        { icon: '🔐', title: 'Enterprise-grade security', desc: 'SOC 2 compliant with SSO and role-based access.' },
      ] }),
      blk('testimonials', { heading: 'Loved by teams everywhere', items: [
        { quote: 'We cut our onboarding time in half in the first month. Genuinely game-changing.', author: 'Chidi N.', role: 'Head of Operations' },
      ] }),
      blk('cta', { heading: 'See it in action', body: 'Start your free 14-day trial — no credit card required.', buttonText: 'Start free trial', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'SaaS & Tech Startups',
    pageType: 'landing',
    name: 'Free Trial Signup Landing Page',
    description: 'A focused, single-goal landing page built to drive trial signups.',
    imageQuery: 'software dashboard screen',
    build: (heroImg) => [
      blk('hero', { heading: 'Start your free trial today', subheading: 'No credit card. No commitment. Cancel any time.', ctaText: 'Get started free', ctaUrl: '#', bgColor: '#0c4a6e', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Software dashboard', caption: '' }),
      blk('features', { heading: 'What you get, free for 14 days', items: [
        { icon: '✅', title: 'Full feature access', desc: 'No limited "trial mode" — the whole product, unlocked.' },
        { icon: '⏱️', title: '5-minute setup', desc: 'Be up and running before your coffee gets cold.' },
        { icon: '🙋', title: 'Live onboarding help', desc: 'A real person to help you get set up, on us.' },
      ] }),
      blk('cta', { heading: 'Ready when you are', body: 'Join thousands of teams already using the platform.', buttonText: 'Start free trial', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Health, Fitness & Wellness',
    pageType: 'page',
    name: 'Gym & Fitness Homepage',
    description: 'An energetic homepage for a gym or fitness studio.',
    imageQuery: 'gym workout fitness training',
    build: (heroImg) => [
      blk('hero', { heading: 'Transform your body, transform your life', subheading: 'State-of-the-art equipment. World-class trainers.', ctaText: 'Claim a free pass', ctaUrl: '#', bgColor: '#7f1d1d', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Gym workout', caption: '' }),
      blk('features', { heading: 'Everything you need to reach your goals', items: [
        { icon: '🏋️', title: 'Premium equipment', desc: 'The latest strength and cardio equipment, always maintained.' },
        { icon: '👥', title: 'Group classes', desc: 'From HIIT to yoga — 40+ classes a week included.' },
        { icon: '🥗', title: 'Nutrition coaching', desc: 'Personalized meal plans from certified nutritionists.' },
      ] }),
      blk('cta', { heading: 'Your first week is free', body: 'No commitment, no pressure — just come try it out.', buttonText: 'Claim a free pass', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Health, Fitness & Wellness',
    pageType: 'landing',
    name: 'Personal Training Landing Page',
    description: 'A lead-gen page for a personal trainer or coach.',
    imageQuery: 'personal trainer coaching client',
    build: (heroImg) => [
      blk('hero', { heading: '1-on-1 coaching that actually gets results', subheading: 'Custom programs built around your body and your goals.', ctaText: 'Book a free consult', ctaUrl: '#', bgColor: '#14532d', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Personal training session', caption: '' }),
      blk('testimonials', { heading: 'Real results, real people', items: [
        { quote: 'Lost 15kg in 4 months and actually kept it off. The accountability made all the difference.', author: 'Tunde A.', role: 'Client since 2024' },
      ] }),
      blk('cta', { heading: 'Ready to get started?', body: 'Book a free consultation and let\'s build your plan together.', buttonText: 'Book your free consult', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Restaurants & Food Delivery',
    pageType: 'page',
    name: 'Restaurant Homepage',
    description: 'A warm, appetite-driven homepage for a restaurant.',
    imageQuery: 'restaurant fine dining food plating',
    build: (heroImg) => [
      blk('hero', { heading: 'Fresh flavors, unforgettable nights', subheading: 'Locally sourced ingredients, crafted with care.', ctaText: 'Reserve a table', ctaUrl: '#', bgColor: '#451a03', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Restaurant food plating', caption: '' }),
      blk('features', { heading: 'A menu worth the trip', items: [
        { icon: '🌿', title: 'Locally sourced', desc: 'Ingredients from farms within 50 miles, every dish.' },
        { icon: '🍷', title: 'Curated wine list', desc: 'Hand-picked pairings from our in-house sommelier.' },
        { icon: '🎉', title: 'Private events', desc: 'Book our private dining room for your next celebration.' },
      ] }),
      blk('cta', { heading: 'Table for two?', body: 'Reserve online in under a minute.', buttonText: 'Reserve a table', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Restaurants & Food Delivery',
    pageType: 'landing',
    name: 'Food Delivery Landing Page',
    description: 'A fast-moving landing page for a food delivery service.',
    imageQuery: 'food delivery bag',
    build: (heroImg) => [
      blk('hero', { heading: 'Your favorite meals, delivered fast', subheading: 'Order from 200+ local restaurants in one app.', ctaText: 'Order now', ctaUrl: '#', bgColor: '#7c2d12', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Food delivery', caption: '' }),
      blk('features', { heading: 'Delivery, done right', items: [
        { icon: '⏱️', title: 'Under 30 minutes', desc: 'Average delivery time across our network.' },
        { icon: '📍', title: 'Live tracking', desc: 'Watch your order every step of the way.' },
        { icon: '💳', title: 'No hidden fees', desc: 'The price you see is the price you pay.' },
      ] }),
      blk('cta', { heading: 'Get 20% off your first order', body: 'Download the app and use code WELCOME20.', buttonText: 'Order now', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Legal & Professional Services',
    pageType: 'page',
    name: 'Law Firm Homepage',
    description: 'A trust-building homepage for a law firm or legal practice.',
    imageQuery: 'law office meeting professional',
    build: (heroImg) => [
      blk('hero', { heading: 'Experienced counsel, straightforward advice', subheading: 'Protecting your interests for over 20 years.', ctaText: 'Book a consultation', ctaUrl: '#', bgColor: '#1e293b', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Law office meeting', caption: '' }),
      blk('features', { heading: 'Practice areas', items: [
        { icon: '⚖️', title: 'Corporate Law', desc: 'Contracts, formation, and compliance for growing businesses.' },
        { icon: '🏠', title: 'Real Estate Law', desc: 'Closings, disputes, and title work handled end to end.' },
        { icon: '👨‍👩‍👧', title: 'Family Law', desc: 'Compassionate representation for sensitive matters.' },
      ] }),
      blk('testimonials', { heading: 'Trusted by our clients', items: [
        { quote: 'They walked us through every step and never once made us feel like just a case number.', author: 'Grace E.', role: 'Client' },
      ] }),
      blk('cta', { heading: 'Speak with an attorney today', body: 'Free initial consultation, no obligation.', buttonText: 'Book a consultation', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Legal & Professional Services',
    pageType: 'landing',
    name: 'Free Consultation Landing Page',
    description: 'A focused lead-gen page for booking legal consultations.',
    imageQuery: 'consultation handshake office',
    build: (heroImg) => [
      blk('hero', { heading: 'Get a free case review today', subheading: 'Talk to a licensed attorney — no cost, no obligation.', ctaText: 'Get my free review', ctaUrl: '#', bgColor: '#0f172a', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Consultation handshake', caption: '' }),
      blk('features', { heading: 'Why people choose us', items: [
        { icon: '⏱️', title: 'Response within 24 hours', desc: 'We respond fast — your situation won\'t wait.' },
        { icon: '💰', title: 'No win, no fee', desc: 'For applicable cases, you pay nothing unless we win.' },
        { icon: '📄', title: 'Clear, plain-language advice', desc: 'No legal jargon — just straight answers.' },
      ] }),
      blk('cta', { heading: 'Don\'t wait to get answers', body: 'Fill out a short form and we\'ll call you back today.', buttonText: 'Request my free review', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Nonprofit & Fundraising',
    pageType: 'page',
    name: 'Nonprofit Homepage',
    description: 'A mission-driven homepage for a nonprofit or charity.',
    imageQuery: 'volunteers community charity work',
    build: (heroImg) => [
      blk('hero', { heading: 'Together, we can change lives', subheading: 'Join thousands of donors making a real difference every day.', ctaText: 'Donate now', ctaUrl: '#', bgColor: '#78350f', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Volunteers at work', caption: '' }),
      blk('features', { heading: 'Our impact', items: [
        { icon: '🍲', title: '2M+ meals served', desc: 'Delivered to families facing food insecurity since 2018.' },
        { icon: '🏫', title: '150 schools built', desc: 'Across underserved communities worldwide.' },
        { icon: '💧', title: 'Clean water for 80k people', desc: 'Wells and filtration systems installed and maintained.' },
      ] }),
      blk('testimonials', { heading: 'Stories from the field', items: [
        { quote: 'The well your donors funded changed everything for our village. Thank you.', author: 'Community Elder', role: 'Partner village' },
      ] }),
      blk('cta', { heading: 'Every donation matters', body: '100% of your first donation goes directly to programs.', buttonText: 'Donate now', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Nonprofit & Fundraising',
    pageType: 'landing',
    name: 'Fundraising Campaign Landing Page',
    description: 'A single-campaign donation page built to convert.',
    imageQuery: 'charity fundraiser event',
    build: (heroImg) => [
      blk('hero', { heading: 'Help us reach our goal', subheading: '$42,000 raised of $60,000 goal — every dollar counts.', ctaText: 'Give now', ctaUrl: '#', bgColor: '#7c2d12', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Charity fundraiser event', caption: '' }),
      blk('text', { heading: 'Why this campaign matters', body: 'This campaign funds emergency shelter, meals, and medical care for families displaced by natural disaster. Every contribution — big or small — goes directly toward relief efforts on the ground.' }),
      blk('cta', { heading: 'Be part of the solution', body: 'Recurring or one-time — every gift helps us reach our goal faster.', buttonText: 'Give now', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Events & Weddings',
    pageType: 'page',
    name: 'Wedding & Events Planner Homepage',
    description: 'An elegant homepage for a wedding or event planning business.',
    imageQuery: 'wedding reception decoration elegant',
    build: (heroImg) => [
      blk('hero', { heading: 'Your day, beautifully planned', subheading: 'Full-service wedding and event planning, from vision to reality.', ctaText: 'Check availability', ctaUrl: '#', bgColor: '#831843', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Elegant wedding reception', caption: '' }),
      blk('features', { heading: 'What we handle', items: [
        { icon: '📋', title: 'Full planning & design', desc: 'From venue selection to the final send-off.' },
        { icon: '🌸', title: 'Florals & décor', desc: 'Custom designs tailored to your style and budget.' },
        { icon: '🎶', title: 'Day-of coordination', desc: 'So you can actually enjoy your own celebration.' },
      ] }),
      blk('testimonials', { heading: 'Happily ever afters', items: [
        { quote: 'Every detail was perfect. We didn\'t worry about a single thing on our wedding day.', author: 'Chioma & David', role: 'Married 2025' },
      ] }),
      blk('cta', { heading: 'Let\'s plan something beautiful', body: 'Book a free discovery call to talk through your vision.', buttonText: 'Check availability', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Events & Weddings',
    pageType: 'landing',
    name: 'Event RSVP Landing Page',
    description: 'A clean RSVP/registration page for a single event.',
    imageQuery: 'conference event venue',
    build: (heroImg) => [
      blk('hero', { heading: 'You\'re invited', subheading: 'Join us for an evening to remember — [Event Name], [Date].', ctaText: 'RSVP now', ctaUrl: '#', bgColor: '#3b0764', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Event venue', caption: '' }),
      blk('features', { heading: 'Event details', items: [
        { icon: '📅', title: 'Date & Time', desc: 'Saturday, 6:00 PM — doors open at 5:30 PM.' },
        { icon: '📍', title: 'Location', desc: 'Grand Ballroom, City Center Hotel.' },
        { icon: '👔', title: 'Dress Code', desc: 'Cocktail attire.' },
      ] }),
      blk('cta', { heading: 'Seats are limited', body: 'Please RSVP by [date] to secure your spot.', buttonText: 'RSVP now', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Travel & Hospitality',
    pageType: 'page',
    name: 'Boutique Hotel Homepage',
    description: 'A warm, image-forward homepage for a hotel or resort.',
    imageQuery: 'boutique hotel resort pool',
    build: (heroImg) => [
      blk('hero', { heading: 'Your escape starts here', subheading: 'Boutique comfort, unforgettable views.', ctaText: 'Check availability', ctaUrl: '#', bgColor: '#164e63', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Boutique hotel resort pool', caption: '' }),
      blk('features', { heading: 'Why stay with us', items: [
        { icon: '🏊', title: 'Infinity pool & spa', desc: 'Open year-round with ocean views.' },
        { icon: '🍽️', title: 'On-site dining', desc: 'Award-winning restaurant featuring local cuisine.' },
        { icon: '🚗', title: 'Airport transfers', desc: 'Complimentary pickup for all guests.' },
      ] }),
      blk('cta', { heading: 'Book your stay', body: 'Best rate guaranteed when you book direct.', buttonText: 'Check availability', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Travel & Hospitality',
    pageType: 'landing',
    name: 'Tour Package Landing Page',
    description: 'A destination-focused landing page for a tour or travel package.',
    imageQuery: 'travel destination scenic tour',
    build: (heroImg) => [
      blk('hero', { heading: 'Adventure is calling', subheading: '7-day guided tour — flights, hotels, and excursions included.', ctaText: 'Reserve your spot', ctaUrl: '#', bgColor: '#0c4a6e', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Scenic travel destination', caption: '' }),
      blk('features', { heading: 'What\'s included', items: [
        { icon: '✈️', title: 'Round-trip flights', desc: 'Economy flights included in every package.' },
        { icon: '🏨', title: '4-star accommodation', desc: '6 nights in hand-picked boutique hotels.' },
        { icon: '🗺️', title: 'Guided excursions', desc: 'Daily activities led by local expert guides.' },
      ] }),
      blk('cta', { heading: 'Limited spots available', body: 'Only 12 spots per departure — book early.', buttonText: 'Reserve your spot', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Beauty & Fashion',
    pageType: 'page',
    name: 'Beauty Salon & Spa Homepage',
    description: 'A polished homepage for a salon, spa, or beauty studio.',
    imageQuery: 'beauty salon spa treatment',
    build: (heroImg) => [
      blk('hero', { heading: 'Look good. Feel better.', subheading: 'Premium hair, skin, and nail care in a relaxing space.', ctaText: 'Book an appointment', ctaUrl: '#', bgColor: '#831843', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Beauty salon spa treatment', caption: '' }),
      blk('features', { heading: 'Our services', items: [
        { icon: '💇', title: 'Hair styling & color', desc: 'From everyday cuts to full transformations.' },
        { icon: '💅', title: 'Nail care', desc: 'Manicures, pedicures, and nail art.' },
        { icon: '🧖', title: 'Facials & skincare', desc: 'Customized treatments for every skin type.' },
      ] }),
      blk('cta', { heading: 'Treat yourself today', body: 'New clients get 15% off their first visit.', buttonText: 'Book an appointment', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Beauty & Fashion',
    pageType: 'landing',
    name: 'Fashion Collection Launch Landing Page',
    description: 'A stylish landing page for a new fashion collection drop.',
    imageQuery: 'fashion model runway collection',
    build: (heroImg) => [
      blk('hero', { heading: 'The new collection has arrived', subheading: 'Limited pieces. Available now.', ctaText: 'Shop the collection', ctaUrl: '#', bgColor: '#111827', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Fashion collection', caption: '' }),
      blk('cta', { heading: 'Don\'t miss out', body: 'Once it\'s gone, it\'s gone — shop before it sells out.', buttonText: 'Shop the collection', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Education & Online Courses',
    pageType: 'page',
    name: 'Online Course Platform Homepage',
    description: 'A homepage for an online course or e-learning platform.',
    imageQuery: 'online learning student laptop course',
    build: (heroImg) => [
      blk('hero', { heading: 'Learn new skills, on your schedule', subheading: 'Expert-led courses in tech, business, and creative fields.', ctaText: 'Browse courses', ctaUrl: '#', bgColor: '#1e1b4b', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Online learning student', caption: '' }),
      blk('features', { heading: 'Why learn with us', items: [
        { icon: '🎓', title: 'Expert instructors', desc: 'Learn from working professionals in their field.' },
        { icon: '📱', title: 'Learn anywhere', desc: 'Mobile-friendly courses you can take on the go.' },
        { icon: '🏆', title: 'Certificates included', desc: 'Shareable certificates on completion.' },
      ] }),
      blk('testimonials', { heading: 'What learners say', items: [
        { quote: 'Landed a new job three months after finishing the program. Worth every naira.', author: 'Fatima B.', role: 'Graduate' },
      ] }),
      blk('cta', { heading: 'Start learning today', body: 'New courses added every month.', buttonText: 'Browse courses', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Education & Online Courses',
    pageType: 'landing',
    name: 'Course Enrollment Landing Page',
    description: 'A conversion-focused page for a single flagship course.',
    imageQuery: 'instructor teaching online course',
    build: (heroImg) => [
      blk('hero', { heading: 'Master [Skill] in 6 weeks', subheading: 'A step-by-step program built for beginners — no experience needed.', ctaText: 'Enroll now', ctaUrl: '#', bgColor: '#0c4a6e', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Instructor teaching online course', caption: '' }),
      blk('features', { heading: 'What you\'ll get', items: [
        { icon: '🎥', title: '40+ video lessons', desc: 'Bite-sized lessons you can complete in 20 minutes a day.' },
        { icon: '💬', title: 'Private community', desc: 'Get support from instructors and fellow students.' },
        { icon: '📜', title: 'Certificate of completion', desc: 'Show off your new skill on LinkedIn.' },
      ] }),
      blk('cta', { heading: 'Enrollment closes soon', body: 'Join the next cohort before spots fill up.', buttonText: 'Enroll now', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Marketplace',
    pageType: 'page',
    name: 'Multi-Vendor Marketplace Homepage',
    description: 'A homepage for a multi-vendor marketplace connecting buyers and independent sellers.',
    imageQuery: 'online marketplace shopping products',
    build: (heroImg) => [
      blk('hero', { heading: 'Thousands of sellers. One marketplace.', subheading: 'Discover unique products from independent makers and trusted brands.', ctaText: 'Start shopping', ctaUrl: '#', bgColor: '#7c2d12', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Marketplace products', caption: '' }),
      blk('features', { heading: 'Why buyers and sellers choose us', items: [
        { icon: '🛍️', title: '10,000+ sellers', desc: 'A curated network of vetted, independent vendors.' },
        { icon: '🔒', title: 'Buyer protection', desc: 'Every order is covered by our purchase guarantee.' },
        { icon: '🚀', title: 'Start selling in minutes', desc: 'List your first product free — no setup fees.' },
      ] }),
      blk('testimonials', { heading: 'Loved by our community', items: [
        { quote: 'I opened my shop here and made my first sale within a week. The tools just work.', author: 'Ifeoma K.', role: 'Independent seller' },
      ] }),
      blk('cta', { heading: 'Ready to join the marketplace?', body: 'Whether you\'re buying or selling, getting started takes minutes.', buttonText: 'Get started', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Marketplace',
    pageType: 'landing',
    name: 'Become a Seller Landing Page',
    description: 'A recruitment-focused landing page for onboarding new marketplace sellers.',
    imageQuery: 'small business owner packing orders',
    build: (heroImg) => [
      blk('hero', { heading: 'Turn your products into a business', subheading: 'Reach millions of buyers already shopping on our platform.', ctaText: 'Start selling free', ctaUrl: '#', bgColor: '#78350f', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Small business owner packing orders', caption: '' }),
      blk('features', { heading: 'Everything you need to sell', items: [
        { icon: '📦', title: 'Simple order management', desc: 'Track orders, shipping, and returns from one dashboard.' },
        { icon: '💳', title: 'Fast payouts', desc: 'Get paid directly to your bank account, twice a week.' },
        { icon: '📣', title: 'Built-in marketing', desc: 'Get discovered through search, promotions, and featured spots.' },
      ] }),
      blk('cta', { heading: 'Your shop could be live today', body: 'No listing fees for your first 30 days.', buttonText: 'Open your shop', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Automotive',
    pageType: 'page',
    name: 'Auto Dealership Homepage',
    description: 'A homepage for a car dealership showcasing new and used inventory.',
    imageQuery: 'car dealership showroom vehicles',
    build: (heroImg) => [
      blk('hero', { heading: 'Find your next vehicle', subheading: 'New, used, and certified pre-owned — with financing to fit your budget.', ctaText: 'Browse inventory', ctaUrl: '#', bgColor: '#0f172a', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Car dealership showroom', caption: '' }),
      blk('features', { heading: 'Why buy from us', items: [
        { icon: '🚗', title: '500+ vehicles in stock', desc: 'The largest selection in the region, updated daily.' },
        { icon: '🔧', title: 'Certified service center', desc: 'Factory-trained technicians and genuine parts.' },
        { icon: '💵', title: 'Flexible financing', desc: 'Options for every credit profile, approved in minutes.' },
      ] }),
      blk('testimonials', { heading: 'What our customers say', items: [
        { quote: 'No pressure, no games — just a fair price and a great car. Highly recommend.', author: 'Emeka U.', role: 'Customer' },
      ] }),
      blk('cta', { heading: 'Ready for a test drive?', body: 'Schedule a visit or get pre-approved online first.', buttonText: 'Schedule a test drive', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Automotive',
    pageType: 'landing',
    name: 'Auto Service & Repair Landing Page',
    description: 'A lead-generation landing page for an auto repair or service shop.',
    imageQuery: 'car mechanic repair garage',
    build: (heroImg) => [
      blk('hero', { heading: 'Honest auto repair, done right the first time', subheading: 'Same-day service on most repairs. Free estimates.', ctaText: 'Book a service', ctaUrl: '#', bgColor: '#1c1917', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Car mechanic repair garage', caption: '' }),
      blk('features', { heading: 'Our services', items: [
        { icon: '🛢️', title: 'Oil changes & maintenance', desc: 'Keep your car running smoothly with routine service.' },
        { icon: '🛑', title: 'Brakes & suspension', desc: 'Inspected and repaired by certified technicians.' },
        { icon: '🔍', title: 'Free diagnostic check', desc: 'We\'ll find the problem before we quote the fix.' },
      ] }),
      blk('cta', { heading: 'Get back on the road faster', body: 'Book online and get $20 off your first service.', buttonText: 'Book your service', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Coaching & Consulting',
    pageType: 'page',
    name: 'Business Consulting Homepage',
    description: 'A credibility-focused homepage for a business or management consultant.',
    imageQuery: 'business consultant meeting presentation',
    build: (heroImg) => [
      blk('hero', { heading: 'Clarity for the decisions that matter most', subheading: 'Strategic consulting for founders and executives who need answers, not theory.', ctaText: 'Book a discovery call', ctaUrl: '#', bgColor: '#1e293b', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Business consulting meeting', caption: '' }),
      blk('features', { heading: 'How we help', items: [
        { icon: '📊', title: 'Growth strategy', desc: 'Data-backed roadmaps to scale revenue and operations.' },
        { icon: '🧭', title: 'Operational audits', desc: 'Find and fix the bottlenecks slowing your team down.' },
        { icon: '🤝', title: 'Executive coaching', desc: '1-on-1 support for founders navigating high-stakes growth.' },
      ] }),
      blk('testimonials', { heading: 'Results our clients have seen', items: [
        { quote: 'Within one quarter of working together we\'d fixed the exact bottleneck that had stalled us for a year.', author: 'Bola A.', role: 'Founder & CEO' },
      ] }),
      blk('cta', { heading: 'Let\'s solve your hardest problem', body: 'Book a free 30-minute discovery call — no obligation.', buttonText: 'Book a discovery call', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Coaching & Consulting',
    pageType: 'landing',
    name: 'Life Coach Discovery Call Landing Page',
    description: 'A warm, personal landing page for a life or career coach driving free-call bookings.',
    imageQuery: 'life coach conversation client',
    build: (heroImg) => [
      blk('hero', { heading: 'Stop feeling stuck. Start moving forward.', subheading: '1-on-1 coaching to help you find clarity and take action.', ctaText: 'Book your free call', ctaUrl: '#', bgColor: '#581c87', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Coaching conversation', caption: '' }),
      blk('features', { heading: 'What coaching with me looks like', items: [
        { icon: '🎯', title: 'Personalized plan', desc: 'No cookie-cutter programs — built entirely around your goals.' },
        { icon: '📞', title: 'Weekly 1-on-1 sessions', desc: 'Real accountability, not just a workbook you\'ll never open.' },
        { icon: '💌', title: 'Support between sessions', desc: 'Message me anytime you need a nudge or a gut-check.' },
      ] }),
      blk('cta', { heading: 'Your free discovery call is waiting', body: '30 minutes, zero pressure — just an honest conversation about where you\'re headed.', buttonText: 'Book your free call', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Creative Portfolio & Agency',
    pageType: 'page',
    name: 'Creative Agency Homepage',
    description: 'A bold, visual homepage for a design, branding, or creative agency.',
    imageQuery: 'creative agency design studio workspace',
    build: (heroImg) => [
      blk('hero', { heading: 'Design that moves your business forward', subheading: 'Brand, web, and product design for companies who refuse to look average.', ctaText: 'See our work', ctaUrl: '#', bgColor: '#111827', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Creative agency studio', caption: '' }),
      blk('features', { heading: 'What we do', items: [
        { icon: '🎨', title: 'Brand identity', desc: 'Logos, systems, and guidelines built to last a decade, not a trend cycle.' },
        { icon: '💻', title: 'Web & product design', desc: 'Interfaces that are as functional as they are beautiful.' },
        { icon: '📸', title: 'Content & motion', desc: 'Photography, video, and animation that actually gets watched.' },
      ] }),
      blk('testimonials', { heading: 'What clients say', items: [
        { quote: 'They didn\'t just redesign our brand — they made us understand what we actually stood for.', author: 'Kemi F.', role: 'Marketing Director' },
      ] }),
      blk('cta', { heading: 'Have a project in mind?', body: 'Tell us about it — we reply to every inquiry within a day.', buttonText: 'Start a project', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Creative Portfolio & Agency',
    pageType: 'landing',
    name: 'Freelancer Portfolio Landing Page',
    description: 'A personal-brand landing page for a freelance designer, photographer, or creative.',
    imageQuery: 'freelance designer portfolio work',
    build: (heroImg) => [
      blk('hero', { heading: 'Hi, I\'m a freelance creative', subheading: 'I help brands look and feel like they mean it.', ctaText: 'View my portfolio', ctaUrl: '#', bgColor: '#0f172a', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Freelance creative work', caption: 'Selected recent work' }),
      blk('text', { heading: 'About me', body: 'I\'m a designer with a focus on clean, purposeful visual work — from brand identities to full websites. I\'ve worked with startups and established brands alike, and I take on a small number of projects at a time so every client gets my full attention.' }),
      blk('testimonials', { heading: 'Kind words from clients', items: [
        { quote: 'Fast, communicative, and genuinely talented — exactly what we needed for our launch.', author: 'Tobi S.', role: 'Startup founder' },
      ] }),
      blk('cta', { heading: 'Let\'s work together', body: 'Currently booking projects for next month.', buttonText: 'Get in touch', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Construction & Home Services',
    pageType: 'page',
    name: 'Construction Company Homepage',
    description: 'A homepage for a general contractor or construction company.',
    imageQuery: 'construction site builders working',
    build: (heroImg) => [
      blk('hero', { heading: 'Built right. On time. On budget.', subheading: 'Residential and commercial construction with 25 years of local experience.', ctaText: 'Get a free quote', ctaUrl: '#', bgColor: '#78350f', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Construction site', caption: '' }),
      blk('features', { heading: 'What we build', items: [
        { icon: '🏗️', title: 'New construction', desc: 'From groundbreaking to final walkthrough, fully managed.' },
        { icon: '🏠', title: 'Renovations & additions', desc: 'Extend or transform your existing space without the stress.' },
        { icon: '📐', title: 'Licensed & insured', desc: 'Fully bonded, licensed, and insured on every job.' },
      ] }),
      blk('testimonials', { heading: 'What homeowners say', items: [
        { quote: 'They finished two weeks ahead of schedule and the quality was better than we expected.', author: 'The Okafor family', role: 'Homeowners' },
      ] }),
      blk('cta', { heading: 'Ready to start your project?', body: 'Get a free, no-obligation quote within 48 hours.', buttonText: 'Get a free quote', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Construction & Home Services',
    pageType: 'landing',
    name: 'Home Services Quote Request Landing Page',
    description: 'A lead-gen landing page for a plumbing, electrical, HVAC, or similar home service business.',
    imageQuery: 'home repair technician service',
    build: (heroImg) => [
      blk('hero', { heading: 'Fast, reliable home repairs', subheading: 'Same-day appointments available. Upfront pricing, no surprises.', ctaText: 'Request a free quote', ctaUrl: '#', bgColor: '#164e63', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Home repair technician', caption: '' }),
      blk('features', { heading: 'Why homeowners call us first', items: [
        { icon: '🚐', title: 'Same-day service', desc: 'Technicians available 7 days a week, including emergencies.' },
        { icon: '💯', title: 'Upfront, flat-rate pricing', desc: 'You approve the price before any work begins.' },
        { icon: '🛡️', title: '1-year workmanship warranty', desc: 'Every job backed by a real guarantee.' },
      ] }),
      blk('cta', { heading: 'Something need fixing?', body: 'Request a free quote and we\'ll call you back within the hour.', buttonText: 'Request a free quote', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Crypto & Web3',
    pageType: 'page',
    name: 'Crypto Exchange Homepage',
    description: 'A homepage for a cryptocurrency exchange or trading platform.',
    imageQuery: 'cryptocurrency trading blockchain technology',
    build: (heroImg) => [
      blk('hero', { heading: 'Buy, sell, and hold crypto with confidence', subheading: 'Bank-grade security meets a beginner-friendly interface.', ctaText: 'Create free account', ctaUrl: '#', bgColor: '#0f172a', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Cryptocurrency trading', caption: '' }),
      blk('features', { heading: 'Why traders choose us', items: [
        { icon: '🔐', title: 'Cold storage security', desc: '98% of assets held offline, protected from online threats.' },
        { icon: '⚡', title: 'Instant trades', desc: 'Deep liquidity means your orders fill in milliseconds.' },
        { icon: '📉', title: 'Low, transparent fees', desc: 'No hidden spreads — see exactly what you pay, every trade.' },
      ] }),
      blk('cta', { heading: 'Start trading in minutes', body: 'Verify your identity and fund your account to get started.', buttonText: 'Create free account', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
  {
    category: 'Crypto & Web3',
    pageType: 'landing',
    name: 'Web3 Project Token Launch Landing Page',
    description: 'A hype-building landing page for a token, NFT, or Web3 project launch.',
    imageQuery: 'digital token nft abstract technology',
    build: (heroImg) => [
      blk('hero', { heading: 'The future of [Project Name] starts here', subheading: 'Join the whitelist before public launch.', ctaText: 'Join the whitelist', ctaUrl: '#', bgColor: '#3b0764', textColor: '#ffffff', align: 'center' }),
      blk('image', { url: heroImg, alt: 'Digital token concept', caption: '' }),
      blk('features', { heading: 'Why this project', items: [
        { icon: '🔗', title: 'Fully on-chain', desc: 'Transparent, auditable smart contracts — verify it yourself.' },
        { icon: '🌍', title: 'Real utility', desc: 'Built for actual use, not just speculation.' },
        { icon: '👥', title: 'Community-first', desc: 'Governance and roadmap decisions shaped by holders.' },
      ] }),
      blk('cta', { heading: 'Whitelist spots are limited', body: 'Early supporters get priority access and reduced fees at launch.', buttonText: 'Join the whitelist', buttonUrl: '#', bgColor: '#f8fafc' }),
    ],
  },
];

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let inserted = 0;
  let skipped = 0;
  for (const [i, t] of TEMPLATES.entries()) {
    const { rows: existing } = await pool.query(`SELECT 1 FROM page_templates WHERE name = $1`, [t.name]);
    if (existing.length) {
      console.log(`Skipping "${t.name}" (already seeded)`);
      skipped += 1;
      continue;
    }
    console.log(`Fetching image for "${t.name}" ("${t.imageQuery}")...`);
    const heroImg = await img(t.imageQuery);
    const blocks = t.build(heroImg);
    await pool.query(
      `INSERT INTO page_templates (category, page_type, name, description, thumbnail_url, blocks, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [t.category, t.pageType, t.name, t.description, heroImg, JSON.stringify(blocks), i]
    );
    console.log(`  ✓ Inserted "${t.name}"`);
    inserted += 1;
  }
  console.log(`\nDone. Inserted ${inserted}, skipped ${skipped} (already existed).`);
  await pool.end();
})().catch((err) => { console.error(err); process.exit(1); });
