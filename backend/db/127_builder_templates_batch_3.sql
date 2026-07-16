-- Migration 127: Website Builder Templates - Batch 3 (Food, Real Estate & Lifestyle)
-- Creates 50 templates across 10 industries

-- Restaurant Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Fine Dining Restaurant', 'Elegant template for upscale restaurants', 'Food & Beverage', 'restaurant', 'classic', true, true, true, '/templates/fine-dining-thumb.jpg', ARRAY['/templates/fine-dining-1.jpg'], 'https://demo.digitpenhub.com/fine-dining', ARRAY['restaurant', 'fine-dining', 'food', 'luxury'], 'Fine Dining Restaurant Template', 'Sophisticated template for fine dining restaurants'),

('Cafe & Coffee Shop', 'Cozy template for cafes and coffee shops', 'Food & Beverage', 'restaurant', 'minimal', true, true, false, '/templates/cafe-thumb.jpg', ARRAY['/templates/cafe-1.jpg'], 'https://demo.digitpenhub.com/cafe', ARRAY['cafe', 'coffee', 'shop', 'food'], 'Cafe & Coffee Shop Template', 'Warm template for cafes and coffee shops'),

('Fast Food Restaurant', 'Bold template for fast food chains', 'Food & Beverage', 'restaurant', 'bold', true, false, false, '/templates/fast-food-thumb.jpg', ARRAY['/templates/fast-food-1.jpg'], 'https://demo.digitpenhub.com/fast-food', ARRAY['fast-food', 'restaurant', 'quick-service', 'food'], 'Fast Food Restaurant Template', 'Vibrant template for fast food restaurants'),

('Pizza Restaurant', 'Appetizing template for pizzerias', 'Food & Beverage', 'restaurant', 'modern', true, false, false, '/templates/pizza-thumb.jpg', ARRAY['/templates/pizza-1.jpg'], 'https://demo.digitpenhub.com/pizza', ARRAY['pizza', 'restaurant', 'italian', 'food'], 'Pizza Restaurant Template', 'Delicious template for pizza restaurants'),

('Sushi Restaurant', 'Zen template for sushi and Japanese restaurants', 'Food & Beverage', 'restaurant', 'minimal', true, false, false, '/templates/sushi-thumb.jpg', ARRAY['/templates/sushi-1.jpg'], 'https://demo.digitpenhub.com/sushi', ARRAY['sushi', 'japanese', 'restaurant', 'food'], 'Sushi Restaurant Template', 'Elegant template for sushi restaurants');

-- Bar & Nightlife Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Cocktail Bar', 'Sophisticated template for cocktail bars', 'Food & Beverage', 'bar', 'bold', true, false, false, '/templates/cocktail-bar-thumb.jpg', ARRAY['/templates/cocktail-bar-1.jpg'], 'https://demo.digitpenhub.com/cocktail-bar', ARRAY['bar', 'cocktails', 'drinks', 'nightlife'], 'Cocktail Bar Template', 'Stylish template for cocktail bars'),

('Sports Bar', 'Energetic template for sports bars', 'Food & Beverage', 'bar', 'modern', true, false, false, '/templates/sports-bar-thumb.jpg', ARRAY['/templates/sports-bar-1.jpg'], 'https://demo.digitpenhub.com/sports-bar', ARRAY['sports-bar', 'pub', 'bar', 'entertainment'], 'Sports Bar Template', 'Dynamic template for sports bars'),

('Wine Bar', 'Elegant template for wine bars', 'Food & Beverage', 'bar', 'classic', true, false, false, '/templates/wine-bar-thumb.jpg', ARRAY['/templates/wine-bar-1.jpg'], 'https://demo.digitpenhub.com/wine-bar', ARRAY['wine', 'bar', 'drinks', 'tasting'], 'Wine Bar Template', 'Refined template for wine bars'),

('Brewery', 'Rustic template for craft breweries', 'Food & Beverage', 'bar', 'modern', true, false, false, '/templates/brewery-thumb.jpg', ARRAY['/templates/brewery-1.jpg'], 'https://demo.digitpenhub.com/brewery', ARRAY['brewery', 'craft-beer', 'bar', 'taproom'], 'Brewery Template', 'Authentic template for craft breweries'),

('Nightclub', 'Electric template for nightclubs', 'Food & Beverage', 'bar', 'bold', true, false, false, '/templates/nightclub-thumb.jpg', ARRAY['/templates/nightclub-1.jpg'], 'https://demo.digitpenhub.com/nightclub', ARRAY['nightclub', 'club', 'nightlife', 'entertainment'], 'Nightclub Template', 'Vibrant template for nightclubs');

-- Real Estate Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Real Estate Agency', 'Professional template for real estate agencies', 'Real Estate', 'property', 'modern', true, true, false, '/templates/realestate-agency-thumb.jpg', ARRAY['/templates/realestate-agency-1.jpg'], 'https://demo.digitpenhub.com/realestate-agency', ARRAY['real-estate', 'agency', 'property', 'listings'], 'Real Estate Agency Template', 'Professional template for real estate agencies'),

('Luxury Real Estate', 'Sophisticated template for luxury properties', 'Real Estate', 'property', 'classic', true, true, true, '/templates/luxury-realestate-thumb.jpg', ARRAY['/templates/luxury-realestate-1.jpg'], 'https://demo.digitpenhub.com/luxury-realestate', ARRAY['luxury', 'real-estate', 'property', 'high-end'], 'Luxury Real Estate Template', 'Elegant template for luxury real estate'),

('Property Management', 'Reliable template for property management companies', 'Real Estate', 'property', 'modern', true, false, false, '/templates/property-mgmt-thumb.jpg', ARRAY['/templates/property-mgmt-1.jpg'], 'https://demo.digitpenhub.com/property-mgmt', ARRAY['property', 'management', 'rental', 'real-estate'], 'Property Management Template', 'Professional template for property management'),

('Commercial Real Estate', 'Corporate template for commercial properties', 'Real Estate', 'property', 'classic', true, false, false, '/templates/commercial-realestate-thumb.jpg', ARRAY['/templates/commercial-realestate-1.jpg'], 'https://demo.digitpenhub.com/commercial-realestate', ARRAY['commercial', 'real-estate', 'office', 'property'], 'Commercial Real Estate Template', 'Professional template for commercial real estate'),

('Real Estate Agent', 'Personal template for individual agents', 'Real Estate', 'property', 'minimal', true, false, false, '/templates/realestate-agent-thumb.jpg', ARRAY['/templates/realestate-agent-1.jpg'], 'https://demo.digitpenhub.com/realestate-agent', ARRAY['agent', 'realtor', 'real-estate', 'property'], 'Real Estate Agent Template', 'Clean template for real estate agents');

-- Beauty & Salon Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Hair Salon', 'Stylish template for hair salons', 'Beauty', 'salon', 'modern', true, true, false, '/templates/hair-salon-thumb.jpg', ARRAY['/templates/hair-salon-1.jpg'], 'https://demo.digitpenhub.com/hair-salon', ARRAY['salon', 'hair', 'beauty', 'stylist'], 'Hair Salon Template', 'Chic template for hair salons'),

('Nail Salon', 'Elegant template for nail salons', 'Beauty', 'salon', 'minimal', true, false, false, '/templates/nail-salon-thumb.jpg', ARRAY['/templates/nail-salon-1.jpg'], 'https://demo.digitpenhub.com/nail-salon', ARRAY['nails', 'salon', 'manicure', 'beauty'], 'Nail Salon Template', 'Beautiful template for nail salons'),

('Barbershop', 'Classic template for barbershops', 'Beauty', 'salon', 'classic', true, false, false, '/templates/barbershop-thumb.jpg', ARRAY['/templates/barbershop-1.jpg'], 'https://demo.digitpenhub.com/barbershop', ARRAY['barbershop', 'barber', 'grooming', 'men'], 'Barbershop Template', 'Traditional template for barbershops'),

('Beauty Spa', 'Luxurious template for beauty spas', 'Beauty', 'salon', 'classic', true, false, true, '/templates/beauty-spa-thumb.jpg', ARRAY['/templates/beauty-spa-1.jpg'], 'https://demo.digitpenhub.com/beauty-spa', ARRAY['spa', 'beauty', 'skincare', 'wellness'], 'Beauty Spa Template', 'Elegant template for beauty spas'),

('Makeup Artist', 'Creative template for makeup artists', 'Beauty', 'salon', 'bold', true, false, false, '/templates/makeup-artist-thumb.jpg', ARRAY['/templates/makeup-artist-1.jpg'], 'https://demo.digitpenhub.com/makeup-artist', ARRAY['makeup', 'artist', 'beauty', 'cosmetics'], 'Makeup Artist Template', 'Stunning template for makeup artists');

-- Fashion & Apparel Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Fashion Boutique', 'Chic template for fashion boutiques', 'Fashion', 'retail', 'modern', true, true, false, '/templates/fashion-boutique-thumb.jpg', ARRAY['/templates/fashion-boutique-1.jpg'], 'https://demo.digitpenhub.com/fashion-boutique', ARRAY['fashion', 'boutique', 'clothing', 'retail'], 'Fashion Boutique Template', 'Stylish template for fashion boutiques'),

('Streetwear Brand', 'Urban template for streetwear brands', 'Fashion', 'retail', 'bold', true, false, false, '/templates/streetwear-thumb.jpg', ARRAY['/templates/streetwear-1.jpg'], 'https://demo.digitpenhub.com/streetwear', ARRAY['streetwear', 'fashion', 'urban', 'clothing'], 'Streetwear Brand Template', 'Edgy template for streetwear brands'),

('Luxury Fashion', 'Sophisticated template for luxury fashion', 'Fashion', 'retail', 'classic', true, true, true, '/templates/luxury-fashion-thumb.jpg', ARRAY['/templates/luxury-fashion-1.jpg'], 'https://demo.digitpenhub.com/luxury-fashion', ARRAY['luxury', 'fashion', 'designer', 'high-end'], 'Luxury Fashion Template', 'Elegant template for luxury fashion brands'),

('Activewear Brand', 'Dynamic template for activewear brands', 'Fashion', 'retail', 'modern', true, false, false, '/templates/activewear-thumb.jpg', ARRAY['/templates/activewear-1.jpg'], 'https://demo.digitpenhub.com/activewear', ARRAY['activewear', 'fitness', 'sportswear', 'clothing'], 'Activewear Brand Template', 'Energetic template for activewear brands'),

('Vintage Clothing', 'Retro template for vintage clothing stores', 'Fashion', 'retail', 'classic', true, false, false, '/templates/vintage-clothing-thumb.jpg', ARRAY['/templates/vintage-clothing-1.jpg'], 'https://demo.digitpenhub.com/vintage-clothing', ARRAY['vintage', 'retro', 'clothing', 'thrift'], 'Vintage Clothing Template', 'Nostalgic template for vintage clothing');

-- Pet Services Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Pet Grooming', 'Friendly template for pet grooming services', 'Pet Services', 'services', 'modern', true, false, false, '/templates/pet-grooming-thumb.jpg', ARRAY['/templates/pet-grooming-1.jpg'], 'https://demo.digitpenhub.com/pet-grooming', ARRAY['pet', 'grooming', 'dog', 'cat'], 'Pet Grooming Template', 'Cheerful template for pet grooming services'),

('Dog Training', 'Professional template for dog trainers', 'Pet Services', 'services', 'minimal', true, false, false, '/templates/dog-training-thumb.jpg', ARRAY['/templates/dog-training-1.jpg'], 'https://demo.digitpenhub.com/dog-training', ARRAY['dog', 'training', 'obedience', 'pet'], 'Dog Training Template', 'Professional template for dog trainers'),

('Pet Sitting', 'Caring template for pet sitting services', 'Pet Services', 'services', 'minimal', true, false, false, '/templates/pet-sitting-thumb.jpg', ARRAY['/templates/pet-sitting-1.jpg'], 'https://demo.digitpenhub.com/pet-sitting', ARRAY['pet-sitting', 'dog-walking', 'pet-care', 'service'], 'Pet Sitting Template', 'Trustworthy template for pet sitting'),

('Pet Store', 'Colorful template for pet stores', 'Pet Services', 'services', 'bold', true, false, false, '/templates/pet-store-thumb.jpg', ARRAY['/templates/pet-store-1.jpg'], 'https://demo.digitpenhub.com/pet-store', ARRAY['pet-store', 'supplies', 'animals', 'retail'], 'Pet Store Template', 'Fun template for pet stores'),

('Animal Boarding', 'Comfortable template for pet boarding facilities', 'Pet Services', 'services', 'modern', true, false, false, '/templates/animal-boarding-thumb.jpg', ARRAY['/templates/animal-boarding-1.jpg'], 'https://demo.digitpenhub.com/animal-boarding', ARRAY['boarding', 'kennel', 'pet-care', 'animals'], 'Animal Boarding Template', 'Welcoming template for pet boarding');

-- Wedding Services Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Wedding Planner', 'Romantic template for wedding planners', 'Wedding', 'services', 'classic', true, true, false, '/templates/wedding-planner-thumb.jpg', ARRAY['/templates/wedding-planner-1.jpg'], 'https://demo.digitpenhub.com/wedding-planner', ARRAY['wedding', 'planner', 'event', 'marriage'], 'Wedding Planner Template', 'Beautiful template for wedding planners'),

('Wedding Venue', 'Elegant template for wedding venues', 'Wedding', 'services', 'classic', true, true, true, '/templates/wedding-venue-thumb.jpg', ARRAY['/templates/wedding-venue-1.jpg'], 'https://demo.digitpenhub.com/wedding-venue', ARRAY['wedding', 'venue', 'reception', 'event'], 'Wedding Venue Template', 'Stunning template for wedding venues'),

('Bridal Shop', 'Dreamy template for bridal shops', 'Wedding', 'services', 'minimal', true, false, false, '/templates/bridal-shop-thumb.jpg', ARRAY['/templates/bridal-shop-1.jpg'], 'https://demo.digitpenhub.com/bridal-shop', ARRAY['bridal', 'wedding-dress', 'shop', 'boutique'], 'Bridal Shop Template', 'Elegant template for bridal shops'),

('Wedding Catering', 'Delicious template for wedding caterers', 'Wedding', 'services', 'modern', true, false, false, '/templates/wedding-catering-thumb.jpg', ARRAY['/templates/wedding-catering-1.jpg'], 'https://demo.digitpenhub.com/wedding-catering', ARRAY['catering', 'wedding', 'food', 'event'], 'Wedding Catering Template', 'Professional template for wedding caterers'),

('Wedding DJ', 'Energetic template for wedding DJs', 'Wedding', 'services', 'bold', true, false, false, '/templates/wedding-dj-thumb.jpg', ARRAY['/templates/wedding-dj-1.jpg'], 'https://demo.digitpenhub.com/wedding-dj', ARRAY['dj', 'wedding', 'music', 'entertainment'], 'Wedding DJ Template', 'Dynamic template for wedding DJs');

-- Automotive Services Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Car Rental', 'Modern template for car rental services', 'Automotive', 'services', 'modern', true, false, false, '/templates/car-rental-thumb.jpg', ARRAY['/templates/car-rental-1.jpg'], 'https://demo.digitpenhub.com/car-rental', ARRAY['car-rental', 'vehicle', 'rental', 'auto'], 'Car Rental Template', 'Professional template for car rental services'),

('Luxury Car Rental', 'Sophisticated template for luxury car rentals', 'Automotive', 'services', 'classic', true, false, true, '/templates/luxury-car-rental-thumb.jpg', ARRAY['/templates/luxury-car-rental-1.jpg'], 'https://demo.digitpenhub.com/luxury-car-rental', ARRAY['luxury', 'car-rental', 'exotic', 'premium'], 'Luxury Car Rental Template', 'Elegant template for luxury car rentals'),

('Driving School', 'Safe template for driving schools', 'Automotive', 'services', 'modern', true, false, false, '/templates/driving-school-thumb.jpg', ARRAY['/templates/driving-school-1.jpg'], 'https://demo.digitpenhub.com/driving-school', ARRAY['driving-school', 'lessons', 'education', 'auto'], 'Driving School Template', 'Professional template for driving schools'),

('Towing Service', 'Reliable template for towing companies', 'Automotive', 'services', 'bold', true, false, false, '/templates/towing-thumb.jpg', ARRAY['/templates/towing-1.jpg'], 'https://demo.digitpenhub.com/towing', ARRAY['towing', 'roadside', 'emergency', 'auto'], 'Towing Service Template', 'Dependable template for towing services'),

('Parking Service', 'Efficient template for parking services', 'Automotive', 'services', 'minimal', true, false, false, '/templates/parking-thumb.jpg', ARRAY['/templates/parking-1.jpg'], 'https://demo.digitpenhub.com/parking', ARRAY['parking', 'valet', 'garage', 'service'], 'Parking Service Template', 'Clean template for parking services');

-- Moving & Storage Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Moving Company', 'Reliable template for moving companies', 'Moving', 'services', 'modern', true, false, false, '/templates/moving-company-thumb.jpg', ARRAY['/templates/moving-company-1.jpg'], 'https://demo.digitpenhub.com/moving-company', ARRAY['moving', 'movers', 'relocation', 'service'], 'Moving Company Template', 'Professional template for moving companies'),

('Storage Facility', 'Secure template for storage facilities', 'Moving', 'services', 'modern', true, false, false, '/templates/storage-facility-thumb.jpg', ARRAY['/templates/storage-facility-1.jpg'], 'https://demo.digitpenhub.com/storage-facility', ARRAY['storage', 'self-storage', 'warehouse', 'facility'], 'Storage Facility Template', 'Trustworthy template for storage facilities'),

('International Moving', 'Global template for international movers', 'Moving', 'services', 'classic', true, false, false, '/templates/international-moving-thumb.jpg', ARRAY['/templates/international-moving-1.jpg'], 'https://demo.digitpenhub.com/international-moving', ARRAY['international', 'moving', 'relocation', 'global'], 'International Moving Template', 'Professional template for international movers'),

('Packing Service', 'Organized template for packing services', 'Moving', 'services', 'minimal', true, false, false, '/templates/packing-service-thumb.jpg', ARRAY['/templates/packing-service-1.jpg'], 'https://demo.digitpenhub.com/packing-service', ARRAY['packing', 'moving', 'service', 'organization'], 'Packing Service Template', 'Clean template for packing services'),

('Furniture Moving', 'Specialized template for furniture movers', 'Moving', 'services', 'modern', true, false, false, '/templates/furniture-moving-thumb.jpg', ARRAY['/templates/furniture-moving-1.jpg'], 'https://demo.digitpenhub.com/furniture-moving', ARRAY['furniture', 'moving', 'delivery', 'service'], 'Furniture Moving Template', 'Professional template for furniture movers');

COMMIT;
