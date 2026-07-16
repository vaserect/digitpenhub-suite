-- Migration 133: Website Builder Templates - Batch 9 (Niche & Emerging Industries)
-- Creates 50 templates across 10 industries

-- Cryptocurrency & Blockchain Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Crypto Exchange', 'Modern template for crypto exchanges', 'Cryptocurrency', 'software', 'modern', true, true, false, '/templates/crypto-exchange-thumb.jpg', ARRAY['/templates/crypto-exchange-1.jpg'], 'https://demo.digitpenhub.com/crypto-exchange', ARRAY['crypto', 'exchange', 'blockchain', 'trading'], 'Crypto Exchange Template', 'Professional template for cryptocurrency exchanges'),

('NFT Marketplace', 'Digital template for NFT platforms', 'Cryptocurrency', 'software', 'bold', true, true, false, '/templates/nft-marketplace-thumb.jpg', ARRAY['/templates/nft-marketplace-1.jpg'], 'https://demo.digitpenhub.com/nft-marketplace', ARRAY['nft', 'marketplace', 'crypto', 'digital-art'], 'NFT Marketplace Template', 'Modern template for NFT marketplaces'),

('DeFi Platform', 'Financial template for DeFi projects', 'Cryptocurrency', 'software', 'modern', true, false, true, '/templates/defi-platform-thumb.jpg', ARRAY['/templates/defi-platform-1.jpg'], 'https://demo.digitpenhub.com/defi-platform', ARRAY['defi', 'finance', 'crypto', 'blockchain'], 'DeFi Platform Template', 'Advanced template for DeFi platforms'),

('Crypto Wallet', 'Secure template for crypto wallets', 'Cryptocurrency', 'software', 'modern', true, false, false, '/templates/crypto-wallet-thumb.jpg', ARRAY['/templates/crypto-wallet-1.jpg'], 'https://demo.digitpenhub.com/crypto-wallet', ARRAY['wallet', 'crypto', 'blockchain', 'security'], 'Crypto Wallet Template', 'Secure template for cryptocurrency wallets'),

('Blockchain Consulting', 'Expert template for blockchain consultants', 'Cryptocurrency', 'professional-services', 'modern', true, false, false, '/templates/blockchain-consulting-thumb.jpg', ARRAY['/templates/blockchain-consulting-1.jpg'], 'https://demo.digitpenhub.com/blockchain-consulting', ARRAY['blockchain', 'consulting', 'crypto', 'advisory'], 'Blockchain Consulting Template', 'Professional template for blockchain consultants');

-- AI & Machine Learning Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('AI Startup', 'Futuristic template for AI startups', 'AI', 'software', 'modern', true, true, false, '/templates/ai-startup-thumb.jpg', ARRAY['/templates/ai-startup-1.jpg'], 'https://demo.digitpenhub.com/ai-startup', ARRAY['ai', 'artificial-intelligence', 'startup', 'technology'], 'AI Startup Template', 'Modern template for AI startups'),

('Machine Learning Platform', 'Technical template for ML platforms', 'AI', 'software', 'modern', true, false, true, '/templates/ml-platform-thumb.jpg', ARRAY['/templates/ml-platform-1.jpg'], 'https://demo.digitpenhub.com/ml-platform', ARRAY['machine-learning', 'ai', 'platform', 'data'], 'Machine Learning Platform Template', 'Professional template for ML platforms'),

('Computer Vision', 'Visual template for computer vision', 'AI', 'software', 'modern', true, false, false, '/templates/computer-vision-thumb.jpg', ARRAY['/templates/computer-vision-1.jpg'], 'https://demo.digitpenhub.com/computer-vision', ARRAY['computer-vision', 'ai', 'image', 'recognition'], 'Computer Vision Template', 'Advanced template for computer vision companies'),

('NLP Service', 'Language template for NLP services', 'AI', 'software', 'modern', true, false, false, '/templates/nlp-service-thumb.jpg', ARRAY['/templates/nlp-service-1.jpg'], 'https://demo.digitpenhub.com/nlp-service', ARRAY['nlp', 'ai', 'language', 'processing'], 'NLP Service Template', 'Professional template for NLP services'),

('AI Consulting', 'Strategic template for AI consultants', 'AI', 'professional-services', 'modern', true, false, false, '/templates/ai-consulting-thumb.jpg', ARRAY['/templates/ai-consulting-1.jpg'], 'https://demo.digitpenhub.com/ai-consulting', ARRAY['ai', 'consulting', 'strategy', 'advisory'], 'AI Consulting Template', 'Professional template for AI consultants');

-- Virtual Reality & AR Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('VR Studio', 'Immersive template for VR studios', 'VR/AR', 'software', 'bold', true, true, false, '/templates/vr-studio-thumb.jpg', ARRAY['/templates/vr-studio-1.jpg'], 'https://demo.digitpenhub.com/vr-studio', ARRAY['vr', 'virtual-reality', 'studio', 'immersive'], 'VR Studio Template', 'Futuristic template for VR studios'),

('AR Application', 'Augmented template for AR apps', 'VR/AR', 'software', 'modern', true, false, false, '/templates/ar-app-thumb.jpg', ARRAY['/templates/ar-app-1.jpg'], 'https://demo.digitpenhub.com/ar-app', ARRAY['ar', 'augmented-reality', 'app', 'mobile'], 'AR Application Template', 'Modern template for AR applications'),

('VR Gaming', 'Gaming template for VR games', 'VR/AR', 'software', 'bold', true, false, false, '/templates/vr-gaming-thumb.jpg', ARRAY['/templates/vr-gaming-1.jpg'], 'https://demo.digitpenhub.com/vr-gaming', ARRAY['vr', 'gaming', 'virtual-reality', 'entertainment'], 'VR Gaming Template', 'Exciting template for VR gaming'),

('VR Training', 'Educational template for VR training', 'VR/AR', 'software', 'modern', true, false, false, '/templates/vr-training-thumb.jpg', ARRAY['/templates/vr-training-1.jpg'], 'https://demo.digitpenhub.com/vr-training', ARRAY['vr', 'training', 'education', 'simulation'], 'VR Training Template', 'Professional template for VR training'),

('Metaverse Platform', 'Virtual template for metaverse platforms', 'VR/AR', 'software', 'bold', true, false, true, '/templates/metaverse-thumb.jpg', ARRAY['/templates/metaverse-1.jpg'], 'https://demo.digitpenhub.com/metaverse', ARRAY['metaverse', 'virtual-world', 'vr', 'platform'], 'Metaverse Platform Template', 'Futuristic template for metaverse platforms');

-- IoT & Smart Home Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Smart Home', 'Connected template for smart home systems', 'IoT', 'software', 'modern', true, true, false, '/templates/smart-home-thumb.jpg', ARRAY['/templates/smart-home-1.jpg'], 'https://demo.digitpenhub.com/smart-home', ARRAY['smart-home', 'iot', 'automation', 'connected'], 'Smart Home Template', 'Modern template for smart home systems'),

('IoT Platform', 'Technical template for IoT platforms', 'IoT', 'software', 'modern', true, false, false, '/templates/iot-platform-thumb.jpg', ARRAY['/templates/iot-platform-1.jpg'], 'https://demo.digitpenhub.com/iot-platform', ARRAY['iot', 'platform', 'connected', 'devices'], 'IoT Platform Template', 'Professional template for IoT platforms'),

('Wearable Tech', 'Fitness template for wearable devices', 'IoT', 'software', 'modern', true, false, false, '/templates/wearable-tech-thumb.jpg', ARRAY['/templates/wearable-tech-1.jpg'], 'https://demo.digitpenhub.com/wearable-tech', ARRAY['wearable', 'tech', 'fitness', 'iot'], 'Wearable Tech Template', 'Modern template for wearable technology'),

('Industrial IoT', 'B2B template for industrial IoT', 'IoT', 'software', 'modern', true, false, false, '/templates/industrial-iot-thumb.jpg', ARRAY['/templates/industrial-iot-1.jpg'], 'https://demo.digitpenhub.com/industrial-iot', ARRAY['industrial', 'iot', 'manufacturing', 'automation'], 'Industrial IoT Template', 'Professional template for industrial IoT'),

('Smart City', 'Urban template for smart city solutions', 'IoT', 'software', 'modern', true, false, true, '/templates/smart-city-thumb.jpg', ARRAY['/templates/smart-city-1.jpg'], 'https://demo.digitpenhub.com/smart-city', ARRAY['smart-city', 'iot', 'urban', 'technology'], 'Smart City Template', 'Advanced template for smart city solutions');

-- Sustainability & Green Tech Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Carbon Offset', 'Green template for carbon offset programs', 'Sustainability', 'services', 'minimal', true, false, false, '/templates/carbon-offset-thumb.jpg', ARRAY['/templates/carbon-offset-1.jpg'], 'https://demo.digitpenhub.com/carbon-offset', ARRAY['carbon', 'offset', 'sustainability', 'green'], 'Carbon Offset Template', 'Eco-friendly template for carbon offset programs'),

('Green Building', 'Sustainable template for green construction', 'Sustainability', 'services', 'modern', true, false, false, '/templates/green-building-thumb.jpg', ARRAY['/templates/green-building-1.jpg'], 'https://demo.digitpenhub.com/green-building', ARRAY['green', 'building', 'sustainable', 'construction'], 'Green Building Template', 'Professional template for green building'),

('Eco Products', 'Natural template for eco-friendly products', 'Sustainability', 'online-store', 'minimal', true, false, false, '/templates/eco-products-thumb.jpg', ARRAY['/templates/eco-products-1.jpg'], 'https://demo.digitpenhub.com/eco-products', ARRAY['eco', 'products', 'sustainable', 'green'], 'Eco Products Template', 'Natural template for eco-friendly products'),

('Sustainability Consulting', 'Expert template for sustainability consultants', 'Sustainability', 'professional-services', 'minimal', true, false, false, '/templates/sustainability-consulting-thumb.jpg', ARRAY['/templates/sustainability-consulting-1.jpg'], 'https://demo.digitpenhub.com/sustainability-consulting', ARRAY['sustainability', 'consulting', 'green', 'advisory'], 'Sustainability Consulting Template', 'Professional template for sustainability consultants'),

('Zero Waste', 'Circular template for zero waste initiatives', 'Sustainability', 'services', 'minimal', true, false, false, '/templates/zero-waste-thumb.jpg', ARRAY['/templates/zero-waste-1.jpg'], 'https://demo.digitpenhub.com/zero-waste', ARRAY['zero-waste', 'sustainability', 'circular', 'green'], 'Zero Waste Template', 'Eco-friendly template for zero waste initiatives');

-- Coworking & Shared Spaces Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Coworking Space', 'Collaborative template for coworking spaces', 'Coworking', 'services', 'modern', true, true, false, '/templates/coworking-thumb.jpg', ARRAY['/templates/coworking-1.jpg'], 'https://demo.digitpenhub.com/coworking', ARRAY['coworking', 'workspace', 'office', 'shared'], 'Coworking Space Template', 'Modern template for coworking spaces'),

('Maker Space', 'Creative template for maker spaces', 'Coworking', 'services', 'bold', true, false, false, '/templates/maker-space-thumb.jpg', ARRAY['/templates/maker-space-1.jpg'], 'https://demo.digitpenhub.com/maker-space', ARRAY['maker', 'space', 'workshop', 'creative'], 'Maker Space Template', 'Creative template for maker spaces'),

('Business Incubator', 'Startup template for incubators', 'Coworking', 'services', 'modern', true, false, false, '/templates/incubator-thumb.jpg', ARRAY['/templates/incubator-1.jpg'], 'https://demo.digitpenhub.com/incubator', ARRAY['incubator', 'startup', 'accelerator', 'business'], 'Business Incubator Template', 'Professional template for business incubators'),

('Virtual Office', 'Remote template for virtual offices', 'Coworking', 'services', 'minimal', true, false, false, '/templates/virtual-office-thumb.jpg', ARRAY['/templates/virtual-office-1.jpg'], 'https://demo.digitpenhub.com/virtual-office', ARRAY['virtual', 'office', 'remote', 'workspace'], 'Virtual Office Template', 'Modern template for virtual office services'),

('Meeting Rooms', 'Professional template for meeting room rentals', 'Coworking', 'services', 'modern', true, false, false, '/templates/meeting-rooms-thumb.jpg', ARRAY['/templates/meeting-rooms-1.jpg'], 'https://demo.digitpenhub.com/meeting-rooms', ARRAY['meeting', 'rooms', 'rental', 'conference'], 'Meeting Rooms Template', 'Professional template for meeting room rentals');

-- Subscription Services Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Meal Kit Delivery', 'Fresh template for meal kit subscriptions', 'Subscription', 'online-store', 'modern', true, false, false, '/templates/meal-kit-thumb.jpg', ARRAY['/templates/meal-kit-1.jpg'], 'https://demo.digitpenhub.com/meal-kit', ARRAY['meal-kit', 'subscription', 'food', 'delivery'], 'Meal Kit Delivery Template', 'Fresh template for meal kit subscriptions'),

('Beauty Box', 'Glamorous template for beauty subscriptions', 'Subscription', 'online-store', 'bold', true, false, false, '/templates/beauty-box-thumb.jpg', ARRAY['/templates/beauty-box-1.jpg'], 'https://demo.digitpenhub.com/beauty-box', ARRAY['beauty', 'box', 'subscription', 'cosmetics'], 'Beauty Box Template', 'Stylish template for beauty box subscriptions'),

('Book Club', 'Literary template for book subscriptions', 'Subscription', 'online-store', 'classic', true, false, false, '/templates/book-club-thumb.jpg', ARRAY['/templates/book-club-1.jpg'], 'https://demo.digitpenhub.com/book-club', ARRAY['book', 'club', 'subscription', 'reading'], 'Book Club Template', 'Elegant template for book club subscriptions'),

('Coffee Subscription', 'Aromatic template for coffee subscriptions', 'Subscription', 'online-store', 'minimal', true, false, false, '/templates/coffee-subscription-thumb.jpg', ARRAY['/templates/coffee-subscription-1.jpg'], 'https://demo.digitpenhub.com/coffee-subscription', ARRAY['coffee', 'subscription', 'beans', 'delivery'], 'Coffee Subscription Template', 'Warm template for coffee subscriptions'),

('Pet Box', 'Playful template for pet subscriptions', 'Subscription', 'online-store', 'bold', true, false, false, '/templates/pet-box-thumb.jpg', ARRAY['/templates/pet-box-1.jpg'], 'https://demo.digitpenhub.com/pet-box', ARRAY['pet', 'box', 'subscription', 'animals'], 'Pet Box Template', 'Fun template for pet box subscriptions');

-- Personal Services Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Personal Shopper', 'Stylish template for personal shoppers', 'Personal Services', 'services', 'modern', true, false, false, '/templates/personal-shopper-thumb.jpg', ARRAY['/templates/personal-shopper-1.jpg'], 'https://demo.digitpenhub.com/personal-shopper', ARRAY['personal', 'shopper', 'styling', 'fashion'], 'Personal Shopper Template', 'Chic template for personal shoppers'),

('Concierge Service', 'Luxury template for concierge services', 'Personal Services', 'services', 'classic', true, false, true, '/templates/concierge-thumb.jpg', ARRAY['/templates/concierge-1.jpg'], 'https://demo.digitpenhub.com/concierge', ARRAY['concierge', 'luxury', 'service', 'lifestyle'], 'Concierge Service Template', 'Elegant template for concierge services'),

('Errand Service', 'Convenient template for errand services', 'Personal Services', 'services', 'minimal', true, false, false, '/templates/errand-service-thumb.jpg', ARRAY['/templates/errand-service-1.jpg'], 'https://demo.digitpenhub.com/errand-service', ARRAY['errand', 'service', 'tasks', 'assistance'], 'Errand Service Template', 'Simple template for errand services'),

('Personal Assistant', 'Professional template for personal assistants', 'Personal Services', 'services', 'modern', true, false, false, '/templates/personal-assistant-thumb.jpg', ARRAY['/templates/personal-assistant-1.jpg'], 'https://demo.digitpenhub.com/personal-assistant', ARRAY['assistant', 'personal', 'service', 'support'], 'Personal Assistant Template', 'Professional template for personal assistants'),

('Life Organization', 'Organized template for life organizers', 'Personal Services', 'services', 'minimal', true, false, false, '/templates/life-organization-thumb.jpg', ARRAY['/templates/life-organization-1.jpg'], 'https://demo.digitpenhub.com/life-organization', ARRAY['organization', 'life', 'declutter', 'service'], 'Life Organization Template', 'Clean template for life organization services');

-- Dating & Matchmaking Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Dating App', 'Romantic template for dating apps', 'Dating', 'software', 'modern', true, true, false, '/templates/dating-app-thumb.jpg', ARRAY['/templates/dating-app-1.jpg'], 'https://demo.digitpenhub.com/dating-app', ARRAY['dating', 'app', 'romance', 'matchmaking'], 'Dating App Template', 'Modern template for dating apps'),

('Matchmaking Service', 'Personal template for matchmakers', 'Dating', 'services', 'classic', true, false, true, '/templates/matchmaking-thumb.jpg', ARRAY['/templates/matchmaking-1.jpg'], 'https://demo.digitpenhub.com/matchmaking', ARRAY['matchmaking', 'dating', 'service', 'relationships'], 'Matchmaking Service Template', 'Elegant template for matchmaking services'),

('Speed Dating', 'Event template for speed dating', 'Dating', 'services', 'bold', true, false, false, '/templates/speed-dating-thumb.jpg', ARRAY['/templates/speed-dating-1.jpg'], 'https://demo.digitpenhub.com/speed-dating', ARRAY['speed-dating', 'events', 'singles', 'dating'], 'Speed Dating Template', 'Exciting template for speed dating events'),

('Singles Events', 'Social template for singles events', 'Dating', 'services', 'modern', true, false, false, '/templates/singles-events-thumb.jpg', ARRAY['/templates/singles-events-1.jpg'], 'https://demo.digitpenhub.com/singles-events', ARRAY['singles', 'events', 'social', 'dating'], 'Singles Events Template', 'Fun template for singles events'),

('Relationship Coaching', 'Supportive template for relationship coaches', 'Dating', 'services', 'minimal', true, false, false, '/templates/relationship-coaching-thumb.jpg', ARRAY['/templates/relationship-coaching-1.jpg'], 'https://demo.digitpenhub.com/relationship-coaching', ARRAY['relationship', 'coaching', 'counseling', 'dating'], 'Relationship Coaching Template', 'Professional template for relationship coaches');

COMMIT;
