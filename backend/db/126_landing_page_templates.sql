-- ============================================================================
-- Migration 126: Landing Page Templates
-- Conversion-focused templates matching Leadpages/Instapage benchmarks
-- ============================================================================

-- Insert 20+ conversion-optimized landing page templates
INSERT INTO page_templates (
  category,
  page_type,
  name, 
  description, 
  thumbnail_url, 
  blocks,
  sort_order,
  created_at,
  updated_at
) VALUES
('lead-generation', 'landing', 'Lead Magnet Download', 'High-converting template for offering free downloads in exchange for email addresses', '/templates/thumbnails/lead-magnet-download.jpg', '[]'::jsonb, 1, NOW(), NOW()),
('lead-generation', 'landing', 'Webinar Registration', 'Optimized for webinar signups with countdown timer and social proof', '/templates/thumbnails/webinar-registration.jpg', '[]'::jsonb, 2, NOW(), NOW()),
('lead-generation', 'landing', 'Free Trial Signup', 'SaaS-focused template for free trial conversions', '/templates/thumbnails/free-trial.jpg', '[]'::jsonb, 3, NOW(), NOW()),
('sales', 'landing', 'Product Launch', 'High-energy template for product launches with video and countdown', '/templates/thumbnails/product-launch.jpg', '[]'::jsonb, 4, NOW(), NOW()),
('sales', 'landing', 'Pricing Page', 'Clean pricing comparison template with feature matrix', '/templates/thumbnails/pricing-page.jpg', '[]'::jsonb, 5, NOW(), NOW()),
('sales', 'landing', 'Sales Letter', 'Long-form sales page with storytelling and testimonials', '/templates/thumbnails/sales-letter.jpg', '[]'::jsonb, 6, NOW(), NOW()),
('events', 'landing', 'Event Registration', 'Professional event landing page with agenda and speakers', '/templates/thumbnails/event-registration.jpg', '[]'::jsonb, 7, NOW(), NOW()),
('services', 'landing', 'Consultation Booking', 'Service-based template for booking consultations', '/templates/thumbnails/consultation-booking.jpg', '[]'::jsonb, 8, NOW(), NOW()),
('education', 'landing', 'Course Landing Page', 'Educational template for online courses with curriculum', '/templates/thumbnails/course-landing.jpg', '[]'::jsonb, 9, NOW(), NOW()),
('content', 'landing', 'Newsletter Signup', 'Minimalist template focused on email list building', '/templates/thumbnails/newsletter-signup.jpg', '[]'::jsonb, 10, NOW(), NOW()),
('app', 'landing', 'App Download', 'Mobile app landing page with app store badges', '/templates/thumbnails/app-download.jpg', '[]'::jsonb, 11, NOW(), NOW()),
('saas', 'landing', 'SaaS Homepage', 'Modern SaaS landing page with features and pricing', '/templates/thumbnails/saas-homepage.jpg', '[]'::jsonb, 12, NOW(), NOW()),
('ecommerce', 'landing', 'Product Showcase', 'E-commerce product page with gallery and specifications', '/templates/thumbnails/product-showcase.jpg', '[]'::jsonb, 13, NOW(), NOW()),
('ecommerce', 'landing', 'Limited Offer', 'Urgency-driven template with countdown timer', '/templates/thumbnails/limited-offer.jpg', '[]'::jsonb, 14, NOW(), NOW()),
('agency', 'landing', 'Agency Services', 'Professional services page showcasing offerings', '/templates/thumbnails/agency-services.jpg', '[]'::jsonb, 15, NOW(), NOW()),
('portfolio', 'landing', 'Portfolio Showcase', 'Creative portfolio template for designers', '/templates/thumbnails/portfolio-showcase.jpg', '[]'::jsonb, 16, NOW(), NOW()),
('launch', 'landing', 'Coming Soon', 'Pre-launch page with email capture and countdown', '/templates/thumbnails/coming-soon.jpg', '[]'::jsonb, 17, NOW(), NOW()),
('conversion', 'landing', 'Thank You Page', 'Post-conversion thank you page with next steps', '/templates/thumbnails/thank-you.jpg', '[]'::jsonb, 18, NOW(), NOW()),
('sales', 'landing', 'Video Sales Letter', 'Video-first sales page with transcript', '/templates/thumbnails/video-sales-letter.jpg', '[]'::jsonb, 19, NOW(), NOW()),
('lead-generation', 'landing', 'Squeeze Page', 'Minimal single-purpose page focused on email capture', '/templates/thumbnails/squeeze-page.jpg', '[]'::jsonb, 20, NOW(), NOW()),
('conversion', 'landing', 'Exit Intent Popup', 'Last-chance offer template for exit-intent', '/templates/thumbnails/exit-intent.jpg', '[]'::jsonb, 21, NOW(), NOW());

-- Migration tracking is handled automatically by migrate.js