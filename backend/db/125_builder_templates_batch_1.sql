-- Migration 125: Website Builder Templates - Batch 1 (Business & Professional Services)
-- Creates 50 templates across 10 industries

-- E-Commerce Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Modern Fashion Store', 'Sleek e-commerce template for fashion brands with product showcase and shopping cart', 'E-Commerce', 'online-store', 'modern', true, true, false, '/templates/fashion-store-thumb.jpg', ARRAY['/templates/fashion-store-1.jpg', '/templates/fashion-store-2.jpg'], 'https://demo.digitpenhub.com/fashion-store', ARRAY['fashion', 'clothing', 'shop', 'e-commerce'], 'Modern Fashion Store Template | E-Commerce Website', 'Professional fashion e-commerce template with product galleries, shopping cart, and checkout'),

('Electronics Marketplace', 'Tech-focused e-commerce template with advanced filtering and product comparisons', 'E-Commerce', 'online-store', 'modern', true, false, false, '/templates/electronics-thumb.jpg', ARRAY['/templates/electronics-1.jpg'], 'https://demo.digitpenhub.com/electronics', ARRAY['electronics', 'tech', 'gadgets', 'shop'], 'Electronics Marketplace Template', 'Feature-rich electronics store template with product filters and comparisons'),

('Handmade Crafts Shop', 'Artisan marketplace template for handmade goods and crafts', 'E-Commerce', 'online-store', 'classic', true, false, false, '/templates/crafts-thumb.jpg', ARRAY['/templates/crafts-1.jpg'], 'https://demo.digitpenhub.com/crafts', ARRAY['handmade', 'crafts', 'artisan', 'shop'], 'Handmade Crafts Shop Template', 'Beautiful template for selling handmade crafts and artisan products'),

('Organic Food Store', 'Fresh and clean template for organic food and grocery delivery', 'E-Commerce', 'online-store', 'minimal', true, false, false, '/templates/organic-thumb.jpg', ARRAY['/templates/organic-1.jpg'], 'https://demo.digitpenhub.com/organic', ARRAY['organic', 'food', 'grocery', 'delivery'], 'Organic Food Store Template', 'Clean template for organic food stores and grocery delivery services'),

('Jewelry Boutique', 'Elegant template for luxury jewelry and accessories', 'E-Commerce', 'online-store', 'bold', true, true, true, '/templates/jewelry-thumb.jpg', ARRAY['/templates/jewelry-1.jpg', '/templates/jewelry-2.jpg'], 'https://demo.digitpenhub.com/jewelry', ARRAY['jewelry', 'luxury', 'accessories', 'boutique'], 'Luxury Jewelry Boutique Template', 'Sophisticated template for high-end jewelry and luxury accessories');

-- SaaS Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Project Management SaaS', 'Modern SaaS landing page for project management tools', 'SaaS', 'software', 'modern', true, true, false, '/templates/pm-saas-thumb.jpg', ARRAY['/templates/pm-saas-1.jpg'], 'https://demo.digitpenhub.com/pm-saas', ARRAY['saas', 'project-management', 'productivity', 'software'], 'Project Management SaaS Template', 'Professional landing page for project management software'),

('CRM Software', 'Clean template for CRM and customer management platforms', 'SaaS', 'software', 'modern', true, false, false, '/templates/crm-thumb.jpg', ARRAY['/templates/crm-1.jpg'], 'https://demo.digitpenhub.com/crm', ARRAY['crm', 'sales', 'customer-management', 'software'], 'CRM Software Template', 'Modern template for CRM and customer relationship management tools'),

('Analytics Platform', 'Data-focused template for analytics and business intelligence tools', 'SaaS', 'software', 'minimal', true, false, false, '/templates/analytics-thumb.jpg', ARRAY['/templates/analytics-1.jpg'], 'https://demo.digitpenhub.com/analytics', ARRAY['analytics', 'data', 'business-intelligence', 'saas'], 'Analytics Platform Template', 'Professional template for analytics and BI platforms'),

('Email Marketing Tool', 'Vibrant template for email marketing and automation platforms', 'SaaS', 'software', 'bold', true, true, false, '/templates/email-marketing-thumb.jpg', ARRAY['/templates/email-marketing-1.jpg'], 'https://demo.digitpenhub.com/email-marketing', ARRAY['email', 'marketing', 'automation', 'saas'], 'Email Marketing Tool Template', 'Eye-catching template for email marketing platforms'),

('Cloud Storage Service', 'Secure and trustworthy template for cloud storage providers', 'SaaS', 'software', 'classic', true, false, true, '/templates/cloud-storage-thumb.jpg', ARRAY['/templates/cloud-storage-1.jpg'], 'https://demo.digitpenhub.com/cloud-storage', ARRAY['cloud', 'storage', 'backup', 'security'], 'Cloud Storage Service Template', 'Professional template for cloud storage and backup services');

-- Healthcare Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Medical Clinic', 'Professional template for medical clinics and healthcare providers', 'Healthcare', 'medical', 'modern', true, true, false, '/templates/medical-clinic-thumb.jpg', ARRAY['/templates/medical-clinic-1.jpg'], 'https://demo.digitpenhub.com/medical-clinic', ARRAY['medical', 'clinic', 'healthcare', 'doctor'], 'Medical Clinic Template', 'Professional website template for medical clinics and healthcare providers'),

('Dental Practice', 'Clean and friendly template for dental offices', 'Healthcare', 'medical', 'classic', true, false, false, '/templates/dental-thumb.jpg', ARRAY['/templates/dental-1.jpg'], 'https://demo.digitpenhub.com/dental', ARRAY['dental', 'dentist', 'teeth', 'healthcare'], 'Dental Practice Template', 'Welcoming template for dental practices and orthodontists'),

('Mental Health Counseling', 'Calming template for therapists and mental health professionals', 'Healthcare', 'medical', 'minimal', true, false, false, '/templates/therapy-thumb.jpg', ARRAY['/templates/therapy-1.jpg'], 'https://demo.digitpenhub.com/therapy', ARRAY['therapy', 'counseling', 'mental-health', 'wellness'], 'Mental Health Counseling Template', 'Peaceful template for therapists and counseling services'),

('Veterinary Clinic', 'Pet-friendly template for veterinary practices', 'Healthcare', 'medical', 'modern', true, false, false, '/templates/vet-thumb.jpg', ARRAY['/templates/vet-1.jpg'], 'https://demo.digitpenhub.com/vet', ARRAY['veterinary', 'pets', 'animals', 'clinic'], 'Veterinary Clinic Template', 'Friendly template for veterinary clinics and pet care services'),

('Pharmacy', 'Trustworthy template for pharmacies and drugstores', 'Healthcare', 'medical', 'classic', true, false, false, '/templates/pharmacy-thumb.jpg', ARRAY['/templates/pharmacy-1.jpg'], 'https://demo.digitpenhub.com/pharmacy', ARRAY['pharmacy', 'drugstore', 'medicine', 'healthcare'], 'Pharmacy Template', 'Professional template for pharmacies and drugstores');

-- Education Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Online Course Platform', 'Modern template for online learning and course platforms', 'Education', 'learning', 'modern', true, true, false, '/templates/online-course-thumb.jpg', ARRAY['/templates/online-course-1.jpg'], 'https://demo.digitpenhub.com/online-course', ARRAY['education', 'courses', 'learning', 'online'], 'Online Course Platform Template', 'Professional template for online course platforms and e-learning'),

('Private School', 'Traditional template for private schools and academies', 'Education', 'learning', 'classic', true, false, false, '/templates/private-school-thumb.jpg', ARRAY['/templates/private-school-1.jpg'], 'https://demo.digitpenhub.com/private-school', ARRAY['school', 'education', 'academy', 'learning'], 'Private School Template', 'Classic template for private schools and educational institutions'),

('Tutoring Service', 'Friendly template for tutoring and educational services', 'Education', 'learning', 'minimal', true, false, false, '/templates/tutoring-thumb.jpg', ARRAY['/templates/tutoring-1.jpg'], 'https://demo.digitpenhub.com/tutoring', ARRAY['tutoring', 'education', 'learning', 'teaching'], 'Tutoring Service Template', 'Clean template for tutoring services and private instruction'),

('Language School', 'Multilingual template for language learning centers', 'Education', 'learning', 'modern', true, false, false, '/templates/language-school-thumb.jpg', ARRAY['/templates/language-school-1.jpg'], 'https://demo.digitpenhub.com/language-school', ARRAY['language', 'learning', 'school', 'education'], 'Language School Template', 'Modern template for language schools and learning centers'),

('Music Academy', 'Creative template for music schools and instructors', 'Education', 'learning', 'bold', true, false, false, '/templates/music-academy-thumb.jpg', ARRAY['/templates/music-academy-1.jpg'], 'https://demo.digitpenhub.com/music-academy', ARRAY['music', 'academy', 'lessons', 'education'], 'Music Academy Template', 'Vibrant template for music schools and instructors');

-- Fitness & Wellness Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Gym & Fitness Center', 'Energetic template for gyms and fitness centers', 'Fitness', 'wellness', 'bold', true, true, false, '/templates/gym-thumb.jpg', ARRAY['/templates/gym-1.jpg'], 'https://demo.digitpenhub.com/gym', ARRAY['gym', 'fitness', 'workout', 'health'], 'Gym & Fitness Center Template', 'Dynamic template for gyms and fitness centers'),

('Yoga Studio', 'Peaceful template for yoga studios and instructors', 'Fitness', 'wellness', 'minimal', true, false, false, '/templates/yoga-thumb.jpg', ARRAY['/templates/yoga-1.jpg'], 'https://demo.digitpenhub.com/yoga', ARRAY['yoga', 'wellness', 'meditation', 'studio'], 'Yoga Studio Template', 'Serene template for yoga studios and wellness centers'),

('Personal Trainer', 'Professional template for personal trainers and coaches', 'Fitness', 'wellness', 'modern', true, false, false, '/templates/personal-trainer-thumb.jpg', ARRAY['/templates/personal-trainer-1.jpg'], 'https://demo.digitpenhub.com/personal-trainer', ARRAY['trainer', 'fitness', 'coaching', 'health'], 'Personal Trainer Template', 'Professional template for personal trainers and fitness coaches'),

('Spa & Wellness', 'Luxurious template for spas and wellness centers', 'Fitness', 'wellness', 'classic', true, true, true, '/templates/spa-thumb.jpg', ARRAY['/templates/spa-1.jpg'], 'https://demo.digitpenhub.com/spa', ARRAY['spa', 'wellness', 'massage', 'relaxation'], 'Spa & Wellness Template', 'Elegant template for spas and wellness centers'),

('Nutrition Coaching', 'Clean template for nutritionists and diet coaches', 'Fitness', 'wellness', 'minimal', true, false, false, '/templates/nutrition-thumb.jpg', ARRAY['/templates/nutrition-1.jpg'], 'https://demo.digitpenhub.com/nutrition', ARRAY['nutrition', 'diet', 'health', 'coaching'], 'Nutrition Coaching Template', 'Professional template for nutritionists and diet coaches');

-- Legal Services Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Law Firm', 'Professional template for law firms and legal practices', 'Legal', 'professional-services', 'classic', true, true, false, '/templates/law-firm-thumb.jpg', ARRAY['/templates/law-firm-1.jpg'], 'https://demo.digitpenhub.com/law-firm', ARRAY['law', 'legal', 'attorney', 'lawyer'], 'Law Firm Template', 'Professional template for law firms and legal practices'),

('Personal Injury Attorney', 'Trustworthy template for personal injury lawyers', 'Legal', 'professional-services', 'modern', true, false, false, '/templates/injury-attorney-thumb.jpg', ARRAY['/templates/injury-attorney-1.jpg'], 'https://demo.digitpenhub.com/injury-attorney', ARRAY['attorney', 'injury', 'legal', 'lawyer'], 'Personal Injury Attorney Template', 'Professional template for personal injury attorneys'),

('Family Law Practice', 'Compassionate template for family law attorneys', 'Legal', 'professional-services', 'minimal', true, false, false, '/templates/family-law-thumb.jpg', ARRAY['/templates/family-law-1.jpg'], 'https://demo.digitpenhub.com/family-law', ARRAY['family-law', 'divorce', 'legal', 'attorney'], 'Family Law Practice Template', 'Compassionate template for family law attorneys'),

('Corporate Law Firm', 'Sophisticated template for corporate legal services', 'Legal', 'professional-services', 'classic', true, false, true, '/templates/corporate-law-thumb.jpg', ARRAY['/templates/corporate-law-1.jpg'], 'https://demo.digitpenhub.com/corporate-law', ARRAY['corporate', 'business', 'legal', 'law'], 'Corporate Law Firm Template', 'Sophisticated template for corporate law firms'),

('Immigration Attorney', 'Welcoming template for immigration lawyers', 'Legal', 'professional-services', 'modern', true, false, false, '/templates/immigration-thumb.jpg', ARRAY['/templates/immigration-1.jpg'], 'https://demo.digitpenhub.com/immigration', ARRAY['immigration', 'visa', 'legal', 'attorney'], 'Immigration Attorney Template', 'Professional template for immigration attorneys');

-- Financial Services Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Financial Advisor', 'Trustworthy template for financial advisors and planners', 'Finance', 'professional-services', 'classic', true, true, false, '/templates/financial-advisor-thumb.jpg', ARRAY['/templates/financial-advisor-1.jpg'], 'https://demo.digitpenhub.com/financial-advisor', ARRAY['finance', 'advisor', 'planning', 'investment'], 'Financial Advisor Template', 'Professional template for financial advisors and planners'),

('Accounting Firm', 'Professional template for accounting and bookkeeping services', 'Finance', 'professional-services', 'modern', true, false, false, '/templates/accounting-thumb.jpg', ARRAY['/templates/accounting-1.jpg'], 'https://demo.digitpenhub.com/accounting', ARRAY['accounting', 'bookkeeping', 'tax', 'finance'], 'Accounting Firm Template', 'Clean template for accounting firms and bookkeepers'),

('Investment Company', 'Sophisticated template for investment firms', 'Finance', 'professional-services', 'classic', true, false, true, '/templates/investment-thumb.jpg', ARRAY['/templates/investment-1.jpg'], 'https://demo.digitpenhub.com/investment', ARRAY['investment', 'wealth', 'finance', 'portfolio'], 'Investment Company Template', 'Sophisticated template for investment companies'),

('Insurance Agency', 'Reliable template for insurance providers', 'Finance', 'professional-services', 'modern', true, false, false, '/templates/insurance-thumb.jpg', ARRAY['/templates/insurance-1.jpg'], 'https://demo.digitpenhub.com/insurance', ARRAY['insurance', 'coverage', 'protection', 'agency'], 'Insurance Agency Template', 'Professional template for insurance agencies'),

('Mortgage Broker', 'Trustworthy template for mortgage and loan services', 'Finance', 'professional-services', 'minimal', true, false, false, '/templates/mortgage-thumb.jpg', ARRAY['/templates/mortgage-1.jpg'], 'https://demo.digitpenhub.com/mortgage', ARRAY['mortgage', 'loan', 'broker', 'finance'], 'Mortgage Broker Template', 'Clean template for mortgage brokers and lenders');

-- Home Services Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Plumbing Service', 'Reliable template for plumbers and plumbing companies', 'Home Services', 'services', 'modern', true, false, false, '/templates/plumbing-thumb.jpg', ARRAY['/templates/plumbing-1.jpg'], 'https://demo.digitpenhub.com/plumbing', ARRAY['plumbing', 'plumber', 'repair', 'service'], 'Plumbing Service Template', 'Professional template for plumbing services'),

('Electrical Contractor', 'Professional template for electricians and electrical services', 'Home Services', 'services', 'modern', true, false, false, '/templates/electrical-thumb.jpg', ARRAY['/templates/electrical-1.jpg'], 'https://demo.digitpenhub.com/electrical', ARRAY['electrical', 'electrician', 'wiring', 'service'], 'Electrical Contractor Template', 'Professional template for electrical contractors'),

('HVAC Company', 'Reliable template for heating and cooling services', 'Home Services', 'services', 'classic', true, false, false, '/templates/hvac-thumb.jpg', ARRAY['/templates/hvac-1.jpg'], 'https://demo.digitpenhub.com/hvac', ARRAY['hvac', 'heating', 'cooling', 'service'], 'HVAC Company Template', 'Professional template for HVAC companies'),

('Cleaning Service', 'Fresh template for cleaning and maid services', 'Home Services', 'services', 'minimal', true, false, false, '/templates/cleaning-thumb.jpg', ARRAY['/templates/cleaning-1.jpg'], 'https://demo.digitpenhub.com/cleaning', ARRAY['cleaning', 'maid', 'housekeeping', 'service'], 'Cleaning Service Template', 'Clean template for cleaning services'),

('Landscaping Company', 'Green template for landscaping and lawn care', 'Home Services', 'services', 'modern', true, false, false, '/templates/landscaping-thumb.jpg', ARRAY['/templates/landscaping-1.jpg'], 'https://demo.digitpenhub.com/landscaping', ARRAY['landscaping', 'lawn-care', 'gardening', 'service'], 'Landscaping Company Template', 'Professional template for landscaping companies');

-- Automotive Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Auto Repair Shop', 'Professional template for auto repair and mechanic services', 'Automotive', 'services', 'modern', true, false, false, '/templates/auto-repair-thumb.jpg', ARRAY['/templates/auto-repair-1.jpg'], 'https://demo.digitpenhub.com/auto-repair', ARRAY['auto', 'repair', 'mechanic', 'service'], 'Auto Repair Shop Template', 'Professional template for auto repair shops'),

('Car Dealership', 'Sleek template for car dealerships and auto sales', 'Automotive', 'services', 'bold', true, true, false, '/templates/car-dealership-thumb.jpg', ARRAY['/templates/car-dealership-1.jpg'], 'https://demo.digitpenhub.com/car-dealership', ARRAY['cars', 'dealership', 'auto', 'sales'], 'Car Dealership Template', 'Modern template for car dealerships'),

('Auto Detailing', 'Clean template for car detailing and wash services', 'Automotive', 'services', 'minimal', true, false, false, '/templates/auto-detailing-thumb.jpg', ARRAY['/templates/auto-detailing-1.jpg'], 'https://demo.digitpenhub.com/auto-detailing', ARRAY['detailing', 'car-wash', 'auto', 'service'], 'Auto Detailing Template', 'Clean template for auto detailing services'),

('Tire Shop', 'Reliable template for tire shops and services', 'Automotive', 'services', 'modern', true, false, false, '/templates/tire-shop-thumb.jpg', ARRAY['/templates/tire-shop-1.jpg'], 'https://demo.digitpenhub.com/tire-shop', ARRAY['tires', 'wheels', 'auto', 'service'], 'Tire Shop Template', 'Professional template for tire shops'),

('Body Shop', 'Professional template for auto body repair and paint', 'Automotive', 'services', 'classic', true, false, false, '/templates/body-shop-thumb.jpg', ARRAY['/templates/body-shop-1.jpg'], 'https://demo.digitpenhub.com/body-shop', ARRAY['body-shop', 'collision', 'auto', 'repair'], 'Body Shop Template', 'Professional template for auto body shops');

-- Construction Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('General Contractor', 'Professional template for general contractors and builders', 'Construction', 'services', 'modern', true, true, false, '/templates/contractor-thumb.jpg', ARRAY['/templates/contractor-1.jpg'], 'https://demo.digitpenhub.com/contractor', ARRAY['contractor', 'construction', 'builder', 'remodeling'], 'General Contractor Template', 'Professional template for general contractors'),

('Roofing Company', 'Reliable template for roofing contractors', 'Construction', 'services', 'classic', true, false, false, '/templates/roofing-thumb.jpg', ARRAY['/templates/roofing-1.jpg'], 'https://demo.digitpenhub.com/roofing', ARRAY['roofing', 'contractor', 'construction', 'repair'], 'Roofing Company Template', 'Professional template for roofing companies'),

('Home Remodeling', 'Inspiring template for home remodeling services', 'Construction', 'services', 'modern', true, false, false, '/templates/remodeling-thumb.jpg', ARRAY['/templates/remodeling-1.jpg'], 'https://demo.digitpenhub.com/remodeling', ARRAY['remodeling', 'renovation', 'construction', 'home'], 'Home Remodeling Template', 'Modern template for home remodeling services'),

('Painting Contractor', 'Colorful template for painting contractors', 'Construction', 'services', 'bold', true, false, false, '/templates/painting-thumb.jpg', ARRAY['/templates/painting-1.jpg'], 'https://demo.digitpenhub.com/painting', ARRAY['painting', 'contractor', 'interior', 'exterior'], 'Painting Contractor Template', 'Vibrant template for painting contractors'),

('Flooring Company', 'Professional template for flooring installation', 'Construction', 'services', 'minimal', true, false, false, '/templates/flooring-thumb.jpg', ARRAY['/templates/flooring-1.jpg'], 'https://demo.digitpenhub.com/flooring', ARRAY['flooring', 'installation', 'hardwood', 'tile'], 'Flooring Company Template', 'Clean template for flooring companies');

COMMIT;
