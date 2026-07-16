-- Migration 126: Website Builder Templates - Batch 2 (Creative & Technology)
-- Creates 50 templates across 10 industries

-- Photography Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Wedding Photography', 'Romantic template for wedding photographers', 'Photography', 'creative', 'classic', true, true, false, '/templates/wedding-photo-thumb.jpg', ARRAY['/templates/wedding-photo-1.jpg'], 'https://demo.digitpenhub.com/wedding-photo', ARRAY['wedding', 'photography', 'photographer', 'portfolio'], 'Wedding Photography Template', 'Beautiful template for wedding photographers'),

('Portrait Studio', 'Professional template for portrait photographers', 'Photography', 'creative', 'minimal', true, false, false, '/templates/portrait-thumb.jpg', ARRAY['/templates/portrait-1.jpg'], 'https://demo.digitpenhub.com/portrait', ARRAY['portrait', 'photography', 'studio', 'headshots'], 'Portrait Studio Template', 'Clean template for portrait photography studios'),

('Commercial Photography', 'Bold template for commercial photographers', 'Photography', 'creative', 'bold', true, false, false, '/templates/commercial-photo-thumb.jpg', ARRAY['/templates/commercial-photo-1.jpg'], 'https://demo.digitpenhub.com/commercial-photo', ARRAY['commercial', 'photography', 'product', 'business'], 'Commercial Photography Template', 'Professional template for commercial photographers'),

('Real Estate Photography', 'Clean template for real estate photographers', 'Photography', 'creative', 'modern', true, false, false, '/templates/realestate-photo-thumb.jpg', ARRAY['/templates/realestate-photo-1.jpg'], 'https://demo.digitpenhub.com/realestate-photo', ARRAY['real-estate', 'photography', 'property', 'architectural'], 'Real Estate Photography Template', 'Modern template for real estate photographers'),

('Event Photography', 'Dynamic template for event photographers', 'Photography', 'creative', 'modern', true, false, false, '/templates/event-photo-thumb.jpg', ARRAY['/templates/event-photo-1.jpg'], 'https://demo.digitpenhub.com/event-photo', ARRAY['event', 'photography', 'corporate', 'parties'], 'Event Photography Template', 'Vibrant template for event photographers');

-- Design & Creative Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Graphic Design Studio', 'Creative template for graphic designers and studios', 'Design', 'creative', 'bold', true, true, false, '/templates/graphic-design-thumb.jpg', ARRAY['/templates/graphic-design-1.jpg'], 'https://demo.digitpenhub.com/graphic-design', ARRAY['graphic-design', 'creative', 'studio', 'portfolio'], 'Graphic Design Studio Template', 'Creative template for graphic design studios'),

('Interior Design', 'Elegant template for interior designers', 'Design', 'creative', 'classic', true, true, true, '/templates/interior-design-thumb.jpg', ARRAY['/templates/interior-design-1.jpg'], 'https://demo.digitpenhub.com/interior-design', ARRAY['interior-design', 'home', 'decor', 'designer'], 'Interior Design Template', 'Sophisticated template for interior designers'),

('Web Design Agency', 'Modern template for web design agencies', 'Design', 'creative', 'modern', true, false, false, '/templates/web-design-thumb.jpg', ARRAY['/templates/web-design-1.jpg'], 'https://demo.digitpenhub.com/web-design', ARRAY['web-design', 'agency', 'digital', 'creative'], 'Web Design Agency Template', 'Modern template for web design agencies'),

('UX/UI Designer', 'Minimal template for UX/UI designers', 'Design', 'creative', 'minimal', true, false, false, '/templates/ux-designer-thumb.jpg', ARRAY['/templates/ux-designer-1.jpg'], 'https://demo.digitpenhub.com/ux-designer', ARRAY['ux', 'ui', 'design', 'portfolio'], 'UX/UI Designer Template', 'Clean template for UX/UI designers'),

('Brand Design Agency', 'Bold template for branding agencies', 'Design', 'creative', 'bold', true, false, false, '/templates/brand-design-thumb.jpg', ARRAY['/templates/brand-design-1.jpg'], 'https://demo.digitpenhub.com/brand-design', ARRAY['branding', 'design', 'agency', 'identity'], 'Brand Design Agency Template', 'Creative template for branding agencies');

-- Marketing Agency Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Digital Marketing Agency', 'Modern template for digital marketing agencies', 'Marketing', 'agency', 'modern', true, true, false, '/templates/digital-marketing-thumb.jpg', ARRAY['/templates/digital-marketing-1.jpg'], 'https://demo.digitpenhub.com/digital-marketing', ARRAY['marketing', 'digital', 'agency', 'seo'], 'Digital Marketing Agency Template', 'Professional template for digital marketing agencies'),

('Social Media Agency', 'Vibrant template for social media marketing', 'Marketing', 'agency', 'bold', true, false, false, '/templates/social-media-thumb.jpg', ARRAY['/templates/social-media-1.jpg'], 'https://demo.digitpenhub.com/social-media', ARRAY['social-media', 'marketing', 'agency', 'content'], 'Social Media Agency Template', 'Dynamic template for social media agencies'),

('SEO Agency', 'Professional template for SEO services', 'Marketing', 'agency', 'modern', true, false, false, '/templates/seo-agency-thumb.jpg', ARRAY['/templates/seo-agency-1.jpg'], 'https://demo.digitpenhub.com/seo-agency', ARRAY['seo', 'marketing', 'agency', 'optimization'], 'SEO Agency Template', 'Professional template for SEO agencies'),

('Content Marketing', 'Clean template for content marketing agencies', 'Marketing', 'agency', 'minimal', true, false, false, '/templates/content-marketing-thumb.jpg', ARRAY['/templates/content-marketing-1.jpg'], 'https://demo.digitpenhub.com/content-marketing', ARRAY['content', 'marketing', 'agency', 'writing'], 'Content Marketing Template', 'Clean template for content marketing agencies'),

('PPC Agency', 'Results-focused template for PPC advertising', 'Marketing', 'agency', 'modern', true, false, false, '/templates/ppc-agency-thumb.jpg', ARRAY['/templates/ppc-agency-1.jpg'], 'https://demo.digitpenhub.com/ppc-agency', ARRAY['ppc', 'advertising', 'agency', 'google-ads'], 'PPC Agency Template', 'Professional template for PPC agencies');

-- Consulting Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Business Consultant', 'Professional template for business consultants', 'Consulting', 'professional-services', 'classic', true, true, false, '/templates/business-consultant-thumb.jpg', ARRAY['/templates/business-consultant-1.jpg'], 'https://demo.digitpenhub.com/business-consultant', ARRAY['consulting', 'business', 'strategy', 'advisor'], 'Business Consultant Template', 'Professional template for business consultants'),

('Management Consulting', 'Sophisticated template for management consultants', 'Consulting', 'professional-services', 'classic', true, false, true, '/templates/management-consulting-thumb.jpg', ARRAY['/templates/management-consulting-1.jpg'], 'https://demo.digitpenhub.com/management-consulting', ARRAY['management', 'consulting', 'strategy', 'business'], 'Management Consulting Template', 'Sophisticated template for management consulting firms'),

('IT Consultant', 'Modern template for IT consultants', 'Consulting', 'professional-services', 'modern', true, false, false, '/templates/it-consultant-thumb.jpg', ARRAY['/templates/it-consultant-1.jpg'], 'https://demo.digitpenhub.com/it-consultant', ARRAY['it', 'consulting', 'technology', 'advisor'], 'IT Consultant Template', 'Professional template for IT consultants'),

('HR Consultant', 'Professional template for HR consultants', 'Consulting', 'professional-services', 'minimal', true, false, false, '/templates/hr-consultant-thumb.jpg', ARRAY['/templates/hr-consultant-1.jpg'], 'https://demo.digitpenhub.com/hr-consultant', ARRAY['hr', 'consulting', 'human-resources', 'recruitment'], 'HR Consultant Template', 'Clean template for HR consultants'),

('Marketing Consultant', 'Strategic template for marketing consultants', 'Consulting', 'professional-services', 'modern', true, false, false, '/templates/marketing-consultant-thumb.jpg', ARRAY['/templates/marketing-consultant-1.jpg'], 'https://demo.digitpenhub.com/marketing-consultant', ARRAY['marketing', 'consulting', 'strategy', 'advisor'], 'Marketing Consultant Template', 'Professional template for marketing consultants');

-- Technology Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Software Development', 'Modern template for software development companies', 'Technology', 'software', 'modern', true, true, false, '/templates/software-dev-thumb.jpg', ARRAY['/templates/software-dev-1.jpg'], 'https://demo.digitpenhub.com/software-dev', ARRAY['software', 'development', 'programming', 'tech'], 'Software Development Template', 'Professional template for software development companies'),

('Mobile App Development', 'Sleek template for mobile app developers', 'Technology', 'software', 'modern', true, false, false, '/templates/mobile-dev-thumb.jpg', ARRAY['/templates/mobile-dev-1.jpg'], 'https://demo.digitpenhub.com/mobile-dev', ARRAY['mobile', 'app', 'development', 'ios-android'], 'Mobile App Development Template', 'Modern template for mobile app developers'),

('IT Support Services', 'Reliable template for IT support companies', 'Technology', 'software', 'classic', true, false, false, '/templates/it-support-thumb.jpg', ARRAY['/templates/it-support-1.jpg'], 'https://demo.digitpenhub.com/it-support', ARRAY['it', 'support', 'helpdesk', 'technology'], 'IT Support Services Template', 'Professional template for IT support services'),

('Cybersecurity Firm', 'Secure template for cybersecurity companies', 'Technology', 'software', 'modern', true, false, true, '/templates/cybersecurity-thumb.jpg', ARRAY['/templates/cybersecurity-1.jpg'], 'https://demo.digitpenhub.com/cybersecurity', ARRAY['cybersecurity', 'security', 'protection', 'tech'], 'Cybersecurity Firm Template', 'Professional template for cybersecurity firms'),

('Blockchain Company', 'Futuristic template for blockchain companies', 'Technology', 'software', 'bold', true, false, false, '/templates/blockchain-thumb.jpg', ARRAY['/templates/blockchain-1.jpg'], 'https://demo.digitpenhub.com/blockchain', ARRAY['blockchain', 'crypto', 'technology', 'web3'], 'Blockchain Company Template', 'Modern template for blockchain companies');

-- Architecture Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Architecture Firm', 'Sophisticated template for architecture firms', 'Architecture', 'creative', 'minimal', true, true, true, '/templates/architecture-thumb.jpg', ARRAY['/templates/architecture-1.jpg'], 'https://demo.digitpenhub.com/architecture', ARRAY['architecture', 'design', 'building', 'firm'], 'Architecture Firm Template', 'Elegant template for architecture firms'),

('Residential Architect', 'Modern template for residential architects', 'Architecture', 'creative', 'modern', true, false, false, '/templates/residential-arch-thumb.jpg', ARRAY['/templates/residential-arch-1.jpg'], 'https://demo.digitpenhub.com/residential-arch', ARRAY['residential', 'architecture', 'home', 'design'], 'Residential Architect Template', 'Modern template for residential architects'),

('Commercial Architect', 'Professional template for commercial architects', 'Architecture', 'creative', 'classic', true, false, false, '/templates/commercial-arch-thumb.jpg', ARRAY['/templates/commercial-arch-1.jpg'], 'https://demo.digitpenhub.com/commercial-arch', ARRAY['commercial', 'architecture', 'building', 'design'], 'Commercial Architect Template', 'Professional template for commercial architects'),

('Landscape Architect', 'Natural template for landscape architects', 'Architecture', 'creative', 'minimal', true, false, false, '/templates/landscape-arch-thumb.jpg', ARRAY['/templates/landscape-arch-1.jpg'], 'https://demo.digitpenhub.com/landscape-arch', ARRAY['landscape', 'architecture', 'outdoor', 'design'], 'Landscape Architect Template', 'Beautiful template for landscape architects'),

('Urban Planning', 'Strategic template for urban planners', 'Architecture', 'creative', 'modern', true, false, false, '/templates/urban-planning-thumb.jpg', ARRAY['/templates/urban-planning-1.jpg'], 'https://demo.digitpenhub.com/urban-planning', ARRAY['urban', 'planning', 'city', 'development'], 'Urban Planning Template', 'Professional template for urban planners');

-- Entertainment Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Music Band', 'Energetic template for music bands and artists', 'Entertainment', 'creative', 'bold', true, true, false, '/templates/music-band-thumb.jpg', ARRAY['/templates/music-band-1.jpg'], 'https://demo.digitpenhub.com/music-band', ARRAY['music', 'band', 'artist', 'entertainment'], 'Music Band Template', 'Dynamic template for music bands'),

('DJ & Producer', 'Vibrant template for DJs and music producers', 'Entertainment', 'creative', 'bold', true, false, false, '/templates/dj-thumb.jpg', ARRAY['/templates/dj-1.jpg'], 'https://demo.digitpenhub.com/dj', ARRAY['dj', 'producer', 'music', 'entertainment'], 'DJ & Producer Template', 'Energetic template for DJs and producers'),

('Event Venue', 'Elegant template for event venues', 'Entertainment', 'creative', 'classic', true, false, false, '/templates/event-venue-thumb.jpg', ARRAY['/templates/event-venue-1.jpg'], 'https://demo.digitpenhub.com/event-venue', ARRAY['venue', 'events', 'weddings', 'parties'], 'Event Venue Template', 'Beautiful template for event venues'),

('Theater Company', 'Dramatic template for theater companies', 'Entertainment', 'creative', 'classic', true, false, false, '/templates/theater-thumb.jpg', ARRAY['/templates/theater-1.jpg'], 'https://demo.digitpenhub.com/theater', ARRAY['theater', 'drama', 'performance', 'arts'], 'Theater Company Template', 'Dramatic template for theater companies'),

('Film Production', 'Cinematic template for film production companies', 'Entertainment', 'creative', 'modern', true, false, true, '/templates/film-production-thumb.jpg', ARRAY['/templates/film-production-1.jpg'], 'https://demo.digitpenhub.com/film-production', ARRAY['film', 'production', 'video', 'cinema'], 'Film Production Template', 'Cinematic template for film production');

-- Travel & Tourism Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Travel Agency', 'Inspiring template for travel agencies', 'Travel', 'services', 'modern', true, true, false, '/templates/travel-agency-thumb.jpg', ARRAY['/templates/travel-agency-1.jpg'], 'https://demo.digitpenhub.com/travel-agency', ARRAY['travel', 'agency', 'vacation', 'tourism'], 'Travel Agency Template', 'Beautiful template for travel agencies'),

('Tour Operator', 'Adventure template for tour operators', 'Travel', 'services', 'bold', true, false, false, '/templates/tour-operator-thumb.jpg', ARRAY['/templates/tour-operator-1.jpg'], 'https://demo.digitpenhub.com/tour-operator', ARRAY['tours', 'operator', 'travel', 'adventure'], 'Tour Operator Template', 'Exciting template for tour operators'),

('Hotel & Resort', 'Luxurious template for hotels and resorts', 'Travel', 'services', 'classic', true, true, true, '/templates/hotel-thumb.jpg', ARRAY['/templates/hotel-1.jpg'], 'https://demo.digitpenhub.com/hotel', ARRAY['hotel', 'resort', 'accommodation', 'hospitality'], 'Hotel & Resort Template', 'Elegant template for hotels and resorts'),

('Vacation Rental', 'Welcoming template for vacation rentals', 'Travel', 'services', 'minimal', true, false, false, '/templates/vacation-rental-thumb.jpg', ARRAY['/templates/vacation-rental-1.jpg'], 'https://demo.digitpenhub.com/vacation-rental', ARRAY['vacation', 'rental', 'airbnb', 'property'], 'Vacation Rental Template', 'Clean template for vacation rentals'),

('Adventure Travel', 'Thrilling template for adventure travel companies', 'Travel', 'services', 'bold', true, false, false, '/templates/adventure-travel-thumb.jpg', ARRAY['/templates/adventure-travel-1.jpg'], 'https://demo.digitpenhub.com/adventure-travel', ARRAY['adventure', 'travel', 'outdoor', 'extreme'], 'Adventure Travel Template', 'Exciting template for adventure travel');

-- Non-Profit Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Charity Organization', 'Compassionate template for charities', 'Non-Profit', 'organization', 'minimal', true, true, false, '/templates/charity-thumb.jpg', ARRAY['/templates/charity-1.jpg'], 'https://demo.digitpenhub.com/charity', ARRAY['charity', 'non-profit', 'donation', 'cause'], 'Charity Organization Template', 'Heartfelt template for charity organizations'),

('Environmental NGO', 'Green template for environmental organizations', 'Non-Profit', 'organization', 'modern', true, false, false, '/templates/environmental-ngo-thumb.jpg', ARRAY['/templates/environmental-ngo-1.jpg'], 'https://demo.digitpenhub.com/environmental-ngo', ARRAY['environment', 'ngo', 'conservation', 'green'], 'Environmental NGO Template', 'Eco-friendly template for environmental NGOs'),

('Animal Rescue', 'Caring template for animal rescue organizations', 'Non-Profit', 'organization', 'minimal', true, false, false, '/templates/animal-rescue-thumb.jpg', ARRAY['/templates/animal-rescue-1.jpg'], 'https://demo.digitpenhub.com/animal-rescue', ARRAY['animal', 'rescue', 'shelter', 'adoption'], 'Animal Rescue Template', 'Compassionate template for animal rescue'),

('Community Foundation', 'Professional template for community foundations', 'Non-Profit', 'organization', 'classic', true, false, false, '/templates/foundation-thumb.jpg', ARRAY['/templates/foundation-1.jpg'], 'https://demo.digitpenhub.com/foundation', ARRAY['foundation', 'community', 'non-profit', 'grants'], 'Community Foundation Template', 'Professional template for foundations'),

('Youth Organization', 'Vibrant template for youth organizations', 'Non-Profit', 'organization', 'bold', true, false, false, '/templates/youth-org-thumb.jpg', ARRAY['/templates/youth-org-1.jpg'], 'https://demo.digitpenhub.com/youth-org', ARRAY['youth', 'organization', 'education', 'mentoring'], 'Youth Organization Template', 'Energetic template for youth organizations');

COMMIT;
