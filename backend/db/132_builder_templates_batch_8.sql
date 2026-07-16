-- Migration 132: Website Builder Templates - Batch 8 (Specialized Services & Industries)
-- Creates 50 templates across 10 industries

-- Marine & Boating Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Boat Dealer', 'Nautical template for boat dealers', 'Marine', 'services', 'modern', true, true, false, '/templates/boat-dealer-thumb.jpg', ARRAY['/templates/boat-dealer-1.jpg'], 'https://demo.digitpenhub.com/boat-dealer', ARRAY['boats', 'marine', 'dealer', 'watercraft'], 'Boat Dealer Template', 'Professional template for boat dealers'),

('Marina', 'Waterfront template for marinas', 'Marine', 'services', 'minimal', true, false, false, '/templates/marina-thumb.jpg', ARRAY['/templates/marina-1.jpg'], 'https://demo.digitpenhub.com/marina', ARRAY['marina', 'harbor', 'docking', 'boating'], 'Marina Template', 'Clean template for marinas'),

('Yacht Charter', 'Luxury template for yacht charters', 'Marine', 'services', 'classic', true, false, true, '/templates/yacht-charter-thumb.jpg', ARRAY['/templates/yacht-charter-1.jpg'], 'https://demo.digitpenhub.com/yacht-charter', ARRAY['yacht', 'charter', 'luxury', 'sailing'], 'Yacht Charter Template', 'Elegant template for yacht charters'),

('Boat Repair', 'Service template for boat repair', 'Marine', 'services', 'modern', true, false, false, '/templates/boat-repair-thumb.jpg', ARRAY['/templates/boat-repair-1.jpg'], 'https://demo.digitpenhub.com/boat-repair', ARRAY['boat', 'repair', 'marine', 'service'], 'Boat Repair Template', 'Professional template for boat repair services'),

('Fishing Charter', 'Adventure template for fishing charters', 'Marine', 'services', 'bold', true, false, false, '/templates/fishing-charter-thumb.jpg', ARRAY['/templates/fishing-charter-1.jpg'], 'https://demo.digitpenhub.com/fishing-charter', ARRAY['fishing', 'charter', 'boat', 'sport'], 'Fishing Charter Template', 'Exciting template for fishing charters');

-- Aviation Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Flight School', 'Professional template for flight schools', 'Aviation', 'services', 'modern', true, true, false, '/templates/flight-school-thumb.jpg', ARRAY['/templates/flight-school-1.jpg'], 'https://demo.digitpenhub.com/flight-school', ARRAY['flight', 'school', 'aviation', 'pilot'], 'Flight School Template', 'Professional template for flight schools'),

('Private Jet Charter', 'Luxury template for private aviation', 'Aviation', 'services', 'classic', true, false, true, '/templates/private-jet-thumb.jpg', ARRAY['/templates/private-jet-1.jpg'], 'https://demo.digitpenhub.com/private-jet', ARRAY['private-jet', 'charter', 'aviation', 'luxury'], 'Private Jet Charter Template', 'Luxurious template for private jet charters'),

('Aircraft Maintenance', 'Technical template for aircraft service', 'Aviation', 'services', 'modern', true, false, false, '/templates/aircraft-maintenance-thumb.jpg', ARRAY['/templates/aircraft-maintenance-1.jpg'], 'https://demo.digitpenhub.com/aircraft-maintenance', ARRAY['aircraft', 'maintenance', 'aviation', 'service'], 'Aircraft Maintenance Template', 'Professional template for aircraft maintenance'),

('Helicopter Tours', 'Aerial template for helicopter tours', 'Aviation', 'services', 'bold', true, false, false, '/templates/helicopter-tours-thumb.jpg', ARRAY['/templates/helicopter-tours-1.jpg'], 'https://demo.digitpenhub.com/helicopter-tours', ARRAY['helicopter', 'tours', 'aviation', 'sightseeing'], 'Helicopter Tours Template', 'Exciting template for helicopter tours'),

('Drone Services', 'Tech template for drone services', 'Aviation', 'services', 'modern', true, false, false, '/templates/drone-services-thumb.jpg', ARRAY['/templates/drone-services-1.jpg'], 'https://demo.digitpenhub.com/drone-services', ARRAY['drone', 'aerial', 'photography', 'services'], 'Drone Services Template', 'Modern template for drone services');

-- Insurance Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Life Insurance', 'Trustworthy template for life insurance', 'Insurance', 'professional-services', 'classic', true, false, false, '/templates/life-insurance-thumb.jpg', ARRAY['/templates/life-insurance-1.jpg'], 'https://demo.digitpenhub.com/life-insurance', ARRAY['life', 'insurance', 'coverage', 'protection'], 'Life Insurance Template', 'Professional template for life insurance'),

('Auto Insurance', 'Reliable template for auto insurance', 'Insurance', 'professional-services', 'modern', true, false, false, '/templates/auto-insurance-thumb.jpg', ARRAY['/templates/auto-insurance-1.jpg'], 'https://demo.digitpenhub.com/auto-insurance', ARRAY['auto', 'insurance', 'car', 'coverage'], 'Auto Insurance Template', 'Professional template for auto insurance'),

('Health Insurance', 'Caring template for health insurance', 'Insurance', 'professional-services', 'minimal', true, false, false, '/templates/health-insurance-thumb.jpg', ARRAY['/templates/health-insurance-1.jpg'], 'https://demo.digitpenhub.com/health-insurance', ARRAY['health', 'insurance', 'medical', 'coverage'], 'Health Insurance Template', 'Professional template for health insurance'),

('Business Insurance', 'Corporate template for business insurance', 'Insurance', 'professional-services', 'classic', true, false, false, '/templates/business-insurance-thumb.jpg', ARRAY['/templates/business-insurance-1.jpg'], 'https://demo.digitpenhub.com/business-insurance', ARRAY['business', 'insurance', 'commercial', 'liability'], 'Business Insurance Template', 'Professional template for business insurance'),

('Property Insurance', 'Protective template for property insurance', 'Insurance', 'professional-services', 'modern', true, false, false, '/templates/property-insurance-thumb.jpg', ARRAY['/templates/property-insurance-1.jpg'], 'https://demo.digitpenhub.com/property-insurance', ARRAY['property', 'insurance', 'home', 'coverage'], 'Property Insurance Template', 'Professional template for property insurance');

-- Veterinary & Animal Care Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Emergency Vet', 'Urgent template for emergency veterinary', 'Veterinary', 'medical', 'modern', true, false, false, '/templates/emergency-vet-thumb.jpg', ARRAY['/templates/emergency-vet-1.jpg'], 'https://demo.digitpenhub.com/emergency-vet', ARRAY['veterinary', 'emergency', 'pets', 'clinic'], 'Emergency Vet Template', 'Professional template for emergency veterinary clinics'),

('Exotic Animal Vet', 'Specialized template for exotic pets', 'Veterinary', 'medical', 'modern', true, false, false, '/templates/exotic-vet-thumb.jpg', ARRAY['/templates/exotic-vet-1.jpg'], 'https://demo.digitpenhub.com/exotic-vet', ARRAY['exotic', 'veterinary', 'pets', 'animals'], 'Exotic Animal Vet Template', 'Professional template for exotic animal vets'),

('Mobile Vet', 'Convenient template for mobile vets', 'Veterinary', 'medical', 'minimal', true, false, false, '/templates/mobile-vet-thumb.jpg', ARRAY['/templates/mobile-vet-1.jpg'], 'https://demo.digitpenhub.com/mobile-vet', ARRAY['mobile', 'veterinary', 'house-calls', 'pets'], 'Mobile Vet Template', 'Professional template for mobile veterinary services'),

('Animal Hospital', 'Comprehensive template for animal hospitals', 'Veterinary', 'medical', 'modern', true, false, false, '/templates/animal-hospital-thumb.jpg', ARRAY['/templates/animal-hospital-1.jpg'], 'https://demo.digitpenhub.com/animal-hospital', ARRAY['animal', 'hospital', 'veterinary', 'care'], 'Animal Hospital Template', 'Professional template for animal hospitals'),

('Equine Veterinary', 'Specialized template for horse vets', 'Veterinary', 'medical', 'classic', true, false, false, '/templates/equine-vet-thumb.jpg', ARRAY['/templates/equine-vet-1.jpg'], 'https://demo.digitpenhub.com/equine-vet', ARRAY['equine', 'veterinary', 'horses', 'care'], 'Equine Veterinary Template', 'Professional template for equine veterinarians');

-- Dental Specialties Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Orthodontist', 'Smile template for orthodontists', 'Healthcare', 'medical', 'modern', true, false, false, '/templates/orthodontist-thumb.jpg', ARRAY['/templates/orthodontist-1.jpg'], 'https://demo.digitpenhub.com/orthodontist', ARRAY['orthodontist', 'braces', 'dental', 'teeth'], 'Orthodontist Template', 'Professional template for orthodontists'),

('Cosmetic Dentistry', 'Beautiful template for cosmetic dentists', 'Healthcare', 'medical', 'minimal', true, false, true, '/templates/cosmetic-dentistry-thumb.jpg', ARRAY['/templates/cosmetic-dentistry-1.jpg'], 'https://demo.digitpenhub.com/cosmetic-dentistry', ARRAY['cosmetic', 'dentistry', 'smile', 'dental'], 'Cosmetic Dentistry Template', 'Elegant template for cosmetic dentistry'),

('Pediatric Dentist', 'Kid-friendly template for pediatric dentists', 'Healthcare', 'medical', 'bold', true, false, false, '/templates/pediatric-dentist-thumb.jpg', ARRAY['/templates/pediatric-dentist-1.jpg'], 'https://demo.digitpenhub.com/pediatric-dentist', ARRAY['pediatric', 'dentist', 'children', 'dental'], 'Pediatric Dentist Template', 'Fun template for pediatric dentists'),

('Oral Surgery', 'Professional template for oral surgeons', 'Healthcare', 'medical', 'classic', true, false, false, '/templates/oral-surgery-thumb.jpg', ARRAY['/templates/oral-surgery-1.jpg'], 'https://demo.digitpenhub.com/oral-surgery', ARRAY['oral', 'surgery', 'dental', 'surgeon'], 'Oral Surgery Template', 'Professional template for oral surgeons'),

('Dental Implants', 'Advanced template for implant dentistry', 'Healthcare', 'medical', 'modern', true, false, false, '/templates/dental-implants-thumb.jpg', ARRAY['/templates/dental-implants-1.jpg'], 'https://demo.digitpenhub.com/dental-implants', ARRAY['dental', 'implants', 'dentistry', 'restoration'], 'Dental Implants Template', 'Professional template for dental implant specialists');

-- Medical Specialties Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Dermatology', 'Skin-focused template for dermatologists', 'Healthcare', 'medical', 'minimal', true, false, false, '/templates/dermatology-thumb.jpg', ARRAY['/templates/dermatology-1.jpg'], 'https://demo.digitpenhub.com/dermatology', ARRAY['dermatology', 'skin', 'medical', 'healthcare'], 'Dermatology Template', 'Professional template for dermatologists'),

('Cardiology', 'Heart-focused template for cardiologists', 'Healthcare', 'medical', 'modern', true, false, false, '/templates/cardiology-thumb.jpg', ARRAY['/templates/cardiology-1.jpg'], 'https://demo.digitpenhub.com/cardiology', ARRAY['cardiology', 'heart', 'medical', 'healthcare'], 'Cardiology Template', 'Professional template for cardiologists'),

('Pediatrics', 'Child-friendly template for pediatricians', 'Healthcare', 'medical', 'bold', true, false, false, '/templates/pediatrics-thumb.jpg', ARRAY['/templates/pediatrics-1.jpg'], 'https://demo.digitpenhub.com/pediatrics', ARRAY['pediatrics', 'children', 'medical', 'healthcare'], 'Pediatrics Template', 'Friendly template for pediatricians'),

('Orthopedics', 'Bone-focused template for orthopedists', 'Healthcare', 'medical', 'modern', true, false, false, '/templates/orthopedics-thumb.jpg', ARRAY['/templates/orthopedics-1.jpg'], 'https://demo.digitpenhub.com/orthopedics', ARRAY['orthopedics', 'bones', 'medical', 'healthcare'], 'Orthopedics Template', 'Professional template for orthopedic surgeons'),

('Ophthalmology', 'Vision-focused template for eye doctors', 'Healthcare', 'medical', 'minimal', true, false, false, '/templates/ophthalmology-thumb.jpg', ARRAY['/templates/ophthalmology-1.jpg'], 'https://demo.digitpenhub.com/ophthalmology', ARRAY['ophthalmology', 'eyes', 'vision', 'medical'], 'Ophthalmology Template', 'Professional template for ophthalmologists');

-- Alternative Medicine Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Acupuncture', 'Holistic template for acupuncturists', 'Healthcare', 'wellness', 'minimal', true, false, false, '/templates/acupuncture-thumb.jpg', ARRAY['/templates/acupuncture-1.jpg'], 'https://demo.digitpenhub.com/acupuncture', ARRAY['acupuncture', 'holistic', 'wellness', 'alternative'], 'Acupuncture Template', 'Peaceful template for acupuncture practices'),

('Chiropractic', 'Alignment template for chiropractors', 'Healthcare', 'wellness', 'modern', true, false, false, '/templates/chiropractic-thumb.jpg', ARRAY['/templates/chiropractic-1.jpg'], 'https://demo.digitpenhub.com/chiropractic', ARRAY['chiropractic', 'spine', 'wellness', 'healthcare'], 'Chiropractic Template', 'Professional template for chiropractors'),

('Naturopathy', 'Natural template for naturopaths', 'Healthcare', 'wellness', 'minimal', true, false, false, '/templates/naturopathy-thumb.jpg', ARRAY['/templates/naturopathy-1.jpg'], 'https://demo.digitpenhub.com/naturopathy', ARRAY['naturopathy', 'natural', 'wellness', 'holistic'], 'Naturopathy Template', 'Natural template for naturopathic doctors'),

('Homeopathy', 'Gentle template for homeopaths', 'Healthcare', 'wellness', 'minimal', true, false, false, '/templates/homeopathy-thumb.jpg', ARRAY['/templates/homeopathy-1.jpg'], 'https://demo.digitpenhub.com/homeopathy', ARRAY['homeopathy', 'alternative', 'wellness', 'natural'], 'Homeopathy Template', 'Gentle template for homeopathic practitioners'),

('Massage Therapy', 'Relaxing template for massage therapists', 'Healthcare', 'wellness', 'minimal', true, false, false, '/templates/massage-therapy-thumb.jpg', ARRAY['/templates/massage-therapy-1.jpg'], 'https://demo.digitpenhub.com/massage-therapy', ARRAY['massage', 'therapy', 'wellness', 'relaxation'], 'Massage Therapy Template', 'Soothing template for massage therapists');

-- Repair Services Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Computer Repair', 'Tech template for computer repair', 'Repair', 'services', 'modern', true, false, false, '/templates/computer-repair-thumb.jpg', ARRAY['/templates/computer-repair-1.jpg'], 'https://demo.digitpenhub.com/computer-repair', ARRAY['computer', 'repair', 'tech', 'service'], 'Computer Repair Template', 'Professional template for computer repair services'),

('Phone Repair', 'Mobile template for phone repair', 'Repair', 'services', 'modern', true, false, false, '/templates/phone-repair-thumb.jpg', ARRAY['/templates/phone-repair-1.jpg'], 'https://demo.digitpenhub.com/phone-repair', ARRAY['phone', 'repair', 'mobile', 'service'], 'Phone Repair Template', 'Professional template for phone repair services'),

('Appliance Repair', 'Home template for appliance repair', 'Repair', 'services', 'modern', true, false, false, '/templates/appliance-repair-thumb.jpg', ARRAY['/templates/appliance-repair-1.jpg'], 'https://demo.digitpenhub.com/appliance-repair', ARRAY['appliance', 'repair', 'home', 'service'], 'Appliance Repair Template', 'Professional template for appliance repair'),

('Watch Repair', 'Precision template for watch repair', 'Repair', 'services', 'classic', true, false, false, '/templates/watch-repair-thumb.jpg', ARRAY['/templates/watch-repair-1.jpg'], 'https://demo.digitpenhub.com/watch-repair', ARRAY['watch', 'repair', 'jewelry', 'service'], 'Watch Repair Template', 'Professional template for watch repair services'),

('Shoe Repair', 'Traditional template for shoe repair', 'Repair', 'services', 'classic', true, false, false, '/templates/shoe-repair-thumb.jpg', ARRAY['/templates/shoe-repair-1.jpg'], 'https://demo.digitpenhub.com/shoe-repair', ARRAY['shoe', 'repair', 'cobbler', 'service'], 'Shoe Repair Template', 'Traditional template for shoe repair services');

-- Laundry & Dry Cleaning Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Dry Cleaning', 'Clean template for dry cleaners', 'Laundry', 'services', 'modern', true, false, false, '/templates/dry-cleaning-thumb.jpg', ARRAY['/templates/dry-cleaning-1.jpg'], 'https://demo.digitpenhub.com/dry-cleaning', ARRAY['dry-cleaning', 'laundry', 'cleaning', 'service'], 'Dry Cleaning Template', 'Professional template for dry cleaning services'),

('Laundromat', 'Self-service template for laundromats', 'Laundry', 'services', 'minimal', true, false, false, '/templates/laundromat-thumb.jpg', ARRAY['/templates/laundromat-1.jpg'], 'https://demo.digitpenhub.com/laundromat', ARRAY['laundromat', 'laundry', 'self-service', 'washing'], 'Laundromat Template', 'Clean template for laundromats'),

('Laundry Pickup', 'Convenient template for laundry pickup', 'Laundry', 'services', 'modern', true, false, false, '/templates/laundry-pickup-thumb.jpg', ARRAY['/templates/laundry-pickup-1.jpg'], 'https://demo.digitpenhub.com/laundry-pickup', ARRAY['laundry', 'pickup', 'delivery', 'service'], 'Laundry Pickup Template', 'Modern template for laundry pickup services'),

('Alterations', 'Tailoring template for alterations', 'Laundry', 'services', 'classic', true, false, false, '/templates/alterations-thumb.jpg', ARRAY['/templates/alterations-1.jpg'], 'https://demo.digitpenhub.com/alterations', ARRAY['alterations', 'tailoring', 'sewing', 'service'], 'Alterations Template', 'Professional template for alteration services'),

('Commercial Laundry', 'Industrial template for commercial laundry', 'Laundry', 'services', 'modern', true, false, false, '/templates/commercial-laundry-thumb.jpg', ARRAY['/templates/commercial-laundry-1.jpg'], 'https://demo.digitpenhub.com/commercial-laundry', ARRAY['commercial', 'laundry', 'industrial', 'service'], 'Commercial Laundry Template', 'Professional template for commercial laundry services');

COMMIT;
