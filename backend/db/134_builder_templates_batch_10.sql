-- Migration 134: Website Builder Templates - Batch 10 (Final - Specialized & Emerging Markets)
-- Creates 50 templates to complete 500 total templates

-- Genealogy & Family History Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Genealogy Service', 'Heritage template for genealogy services', 'Genealogy', 'services', 'classic', true, false, false, '/templates/genealogy-thumb.jpg', ARRAY['/templates/genealogy-1.jpg'], 'https://demo.digitpenhub.com/genealogy', ARRAY['genealogy', 'family', 'history', 'ancestry'], 'Genealogy Service Template', 'Professional template for genealogy services'),

('Family Tree Builder', 'Interactive template for family trees', 'Genealogy', 'software', 'minimal', true, false, false, '/templates/family-tree-thumb.jpg', ARRAY['/templates/family-tree-1.jpg'], 'https://demo.digitpenhub.com/family-tree', ARRAY['family-tree', 'genealogy', 'ancestry', 'heritage'], 'Family Tree Builder Template', 'Clean template for family tree builders'),

('DNA Testing', 'Scientific template for ancestry DNA', 'Genealogy', 'services', 'modern', true, false, false, '/templates/ancestry-dna-thumb.jpg', ARRAY['/templates/ancestry-dna-1.jpg'], 'https://demo.digitpenhub.com/ancestry-dna', ARRAY['dna', 'ancestry', 'genetic', 'testing'], 'DNA Testing Template', 'Modern template for ancestry DNA testing'),

('Historical Research', 'Academic template for historical research', 'Genealogy', 'services', 'classic', true, false, false, '/templates/historical-research-thumb.jpg', ARRAY['/templates/historical-research-1.jpg'], 'https://demo.digitpenhub.com/historical-research', ARRAY['history', 'research', 'genealogy', 'archives'], 'Historical Research Template', 'Professional template for historical research'),

('Heritage Tours', 'Cultural template for heritage tours', 'Genealogy', 'services', 'modern', true, false, false, '/templates/heritage-tours-thumb.jpg', ARRAY['/templates/heritage-tours-1.jpg'], 'https://demo.digitpenhub.com/heritage-tours', ARRAY['heritage', 'tours', 'ancestry', 'travel'], 'Heritage Tours Template', 'Engaging template for heritage tours');

-- Astrology & Spirituality Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Astrology Service', 'Mystical template for astrologers', 'Astrology', 'services', 'minimal', true, false, false, '/templates/astrology-thumb.jpg', ARRAY['/templates/astrology-1.jpg'], 'https://demo.digitpenhub.com/astrology', ARRAY['astrology', 'horoscope', 'zodiac', 'spiritual'], 'Astrology Service Template', 'Mystical template for astrology services'),

('Tarot Reading', 'Intuitive template for tarot readers', 'Astrology', 'services', 'minimal', true, false, false, '/templates/tarot-thumb.jpg', ARRAY['/templates/tarot-1.jpg'], 'https://demo.digitpenhub.com/tarot', ARRAY['tarot', 'reading', 'psychic', 'spiritual'], 'Tarot Reading Template', 'Mystical template for tarot readers'),

('Psychic Medium', 'Spiritual template for psychic mediums', 'Astrology', 'services', 'minimal', true, false, false, '/templates/psychic-thumb.jpg', ARRAY['/templates/psychic-1.jpg'], 'https://demo.digitpenhub.com/psychic', ARRAY['psychic', 'medium', 'spiritual', 'readings'], 'Psychic Medium Template', 'Spiritual template for psychic mediums'),

('Crystal Shop', 'Healing template for crystal shops', 'Astrology', 'online-store', 'minimal', true, false, false, '/templates/crystal-shop-thumb.jpg', ARRAY['/templates/crystal-shop-1.jpg'], 'https://demo.digitpenhub.com/crystal-shop', ARRAY['crystals', 'healing', 'spiritual', 'shop'], 'Crystal Shop Template', 'Beautiful template for crystal shops'),

('Reiki Healing', 'Energy template for reiki practitioners', 'Astrology', 'services', 'minimal', true, false, false, '/templates/reiki-thumb.jpg', ARRAY['/templates/reiki-1.jpg'], 'https://demo.digitpenhub.com/reiki', ARRAY['reiki', 'healing', 'energy', 'spiritual'], 'Reiki Healing Template', 'Peaceful template for reiki practitioners');

-- Escape Room & Entertainment Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Escape Room', 'Mysterious template for escape rooms', 'Entertainment', 'services', 'bold', true, true, false, '/templates/escape-room-thumb.jpg', ARRAY['/templates/escape-room-1.jpg'], 'https://demo.digitpenhub.com/escape-room', ARRAY['escape-room', 'puzzle', 'entertainment', 'game'], 'Escape Room Template', 'Exciting template for escape rooms'),

('Arcade', 'Retro template for arcades', 'Entertainment', 'services', 'bold', true, false, false, '/templates/arcade-thumb.jpg', ARRAY['/templates/arcade-1.jpg'], 'https://demo.digitpenhub.com/arcade', ARRAY['arcade', 'games', 'entertainment', 'retro'], 'Arcade Template', 'Fun template for arcades'),

('Bowling Alley', 'Social template for bowling alleys', 'Entertainment', 'services', 'modern', true, false, false, '/templates/bowling-thumb.jpg', ARRAY['/templates/bowling-1.jpg'], 'https://demo.digitpenhub.com/bowling', ARRAY['bowling', 'entertainment', 'sports', 'social'], 'Bowling Alley Template', 'Fun template for bowling alleys'),

('Laser Tag', 'Action template for laser tag', 'Entertainment', 'services', 'bold', true, false, false, '/templates/laser-tag-thumb.jpg', ARRAY['/templates/laser-tag-1.jpg'], 'https://demo.digitpenhub.com/laser-tag', ARRAY['laser-tag', 'entertainment', 'game', 'action'], 'Laser Tag Template', 'Exciting template for laser tag arenas'),

('Trampoline Park', 'Energetic template for trampoline parks', 'Entertainment', 'services', 'bold', true, false, false, '/templates/trampoline-park-thumb.jpg', ARRAY['/templates/trampoline-park-1.jpg'], 'https://demo.digitpenhub.com/trampoline-park', ARRAY['trampoline', 'park', 'entertainment', 'fitness'], 'Trampoline Park Template', 'Dynamic template for trampoline parks');

-- Auction & Bidding Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Online Auction', 'Bidding template for online auctions', 'Auction', 'online-store', 'modern', true, true, false, '/templates/online-auction-thumb.jpg', ARRAY['/templates/online-auction-1.jpg'], 'https://demo.digitpenhub.com/online-auction', ARRAY['auction', 'bidding', 'online', 'marketplace'], 'Online Auction Template', 'Professional template for online auctions'),

('Art Auction', 'Gallery template for art auctions', 'Auction', 'online-store', 'classic', true, false, true, '/templates/art-auction-thumb.jpg', ARRAY['/templates/art-auction-1.jpg'], 'https://demo.digitpenhub.com/art-auction', ARRAY['art', 'auction', 'gallery', 'bidding'], 'Art Auction Template', 'Elegant template for art auctions'),

('Estate Sale', 'Traditional template for estate sales', 'Auction', 'online-store', 'classic', true, false, false, '/templates/estate-sale-thumb.jpg', ARRAY['/templates/estate-sale-1.jpg'], 'https://demo.digitpenhub.com/estate-sale', ARRAY['estate', 'sale', 'auction', 'liquidation'], 'Estate Sale Template', 'Professional template for estate sales'),

('Car Auction', 'Automotive template for car auctions', 'Auction', 'online-store', 'modern', true, false, false, '/templates/car-auction-thumb.jpg', ARRAY['/templates/car-auction-1.jpg'], 'https://demo.digitpenhub.com/car-auction', ARRAY['car', 'auction', 'auto', 'bidding'], 'Car Auction Template', 'Professional template for car auctions'),

('Charity Auction', 'Fundraising template for charity auctions', 'Auction', 'online-store', 'modern', true, false, false, '/templates/charity-auction-thumb.jpg', ARRAY['/templates/charity-auction-1.jpg'], 'https://demo.digitpenhub.com/charity-auction', ARRAY['charity', 'auction', 'fundraising', 'nonprofit'], 'Charity Auction Template', 'Professional template for charity auctions');

-- Rental Services Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Equipment Rental', 'Industrial template for equipment rentals', 'Rental', 'services', 'modern', true, false, false, '/templates/equipment-rental-thumb.jpg', ARRAY['/templates/equipment-rental-1.jpg'], 'https://demo.digitpenhub.com/equipment-rental', ARRAY['equipment', 'rental', 'tools', 'machinery'], 'Equipment Rental Template', 'Professional template for equipment rentals'),

('Party Rental', 'Festive template for party rentals', 'Rental', 'services', 'bold', true, false, false, '/templates/party-rental-thumb.jpg', ARRAY['/templates/party-rental-1.jpg'], 'https://demo.digitpenhub.com/party-rental', ARRAY['party', 'rental', 'events', 'supplies'], 'Party Rental Template', 'Fun template for party rental services'),

('Costume Rental', 'Theatrical template for costume rentals', 'Rental', 'services', 'bold', true, false, false, '/templates/costume-rental-thumb.jpg', ARRAY['/templates/costume-rental-1.jpg'], 'https://demo.digitpenhub.com/costume-rental', ARRAY['costume', 'rental', 'theater', 'halloween'], 'Costume Rental Template', 'Creative template for costume rentals'),

('Camera Rental', 'Professional template for camera rentals', 'Rental', 'services', 'modern', true, false, false, '/templates/camera-rental-thumb.jpg', ARRAY['/templates/camera-rental-1.jpg'], 'https://demo.digitpenhub.com/camera-rental', ARRAY['camera', 'rental', 'photography', 'video'], 'Camera Rental Template', 'Professional template for camera rentals'),

('RV Rental', 'Adventure template for RV rentals', 'Rental', 'services', 'modern', true, false, false, '/templates/rv-rental-thumb.jpg', ARRAY['/templates/rv-rental-1.jpg'], 'https://demo.digitpenhub.com/rv-rental', ARRAY['rv', 'rental', 'motorhome', 'travel'], 'RV Rental Template', 'Exciting template for RV rentals');

-- Translation & Language Services Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Translation Service', 'Multilingual template for translation services', 'Translation', 'professional-services', 'modern', true, false, false, '/templates/translation-thumb.jpg', ARRAY['/templates/translation-1.jpg'], 'https://demo.digitpenhub.com/translation', ARRAY['translation', 'language', 'multilingual', 'service'], 'Translation Service Template', 'Professional template for translation services'),

('Interpretation Service', 'Communication template for interpreters', 'Translation', 'professional-services', 'modern', true, false, false, '/templates/interpretation-thumb.jpg', ARRAY['/templates/interpretation-1.jpg'], 'https://demo.digitpenhub.com/interpretation', ARRAY['interpretation', 'language', 'interpreter', 'service'], 'Interpretation Service Template', 'Professional template for interpretation services'),

('Localization Service', 'Global template for localization', 'Translation', 'professional-services', 'modern', true, false, false, '/templates/localization-thumb.jpg', ARRAY['/templates/localization-1.jpg'], 'https://demo.digitpenhub.com/localization', ARRAY['localization', 'translation', 'global', 'service'], 'Localization Service Template', 'Professional template for localization services'),

('Transcription Service', 'Audio template for transcription', 'Translation', 'professional-services', 'minimal', true, false, false, '/templates/transcription-thumb.jpg', ARRAY['/templates/transcription-1.jpg'], 'https://demo.digitpenhub.com/transcription', ARRAY['transcription', 'audio', 'text', 'service'], 'Transcription Service Template', 'Professional template for transcription services'),

('Subtitling Service', 'Video template for subtitling', 'Translation', 'professional-services', 'modern', true, false, false, '/templates/subtitling-thumb.jpg', ARRAY['/templates/subtitling-1.jpg'], 'https://demo.digitpenhub.com/subtitling', ARRAY['subtitling', 'video', 'translation', 'service'], 'Subtitling Service Template', 'Professional template for subtitling services');

-- Voice Over & Audio Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Voice Over Artist', 'Audio template for voice over artists', 'Audio', 'services', 'modern', true, false, false, '/templates/voice-over-thumb.jpg', ARRAY['/templates/voice-over-1.jpg'], 'https://demo.digitpenhub.com/voice-over', ARRAY['voice-over', 'audio', 'narration', 'talent'], 'Voice Over Artist Template', 'Professional template for voice over artists'),

('Audio Production', 'Studio template for audio production', 'Audio', 'services', 'modern', true, false, false, '/templates/audio-production-thumb.jpg', ARRAY['/templates/audio-production-1.jpg'], 'https://demo.digitpenhub.com/audio-production', ARRAY['audio', 'production', 'studio', 'sound'], 'Audio Production Template', 'Professional template for audio production'),

('Audiobook Narrator', 'Literary template for audiobook narrators', 'Audio', 'services', 'classic', true, false, false, '/templates/audiobook-narrator-thumb.jpg', ARRAY['/templates/audiobook-narrator-1.jpg'], 'https://demo.digitpenhub.com/audiobook-narrator', ARRAY['audiobook', 'narrator', 'voice', 'books'], 'Audiobook Narrator Template', 'Professional template for audiobook narrators'),

('Sound Design', 'Creative template for sound designers', 'Audio', 'services', 'modern', true, false, false, '/templates/sound-design-thumb.jpg', ARRAY['/templates/sound-design-1.jpg'], 'https://demo.digitpenhub.com/sound-design', ARRAY['sound', 'design', 'audio', 'creative'], 'Sound Design Template', 'Professional template for sound designers'),

('Podcast Production', 'Media template for podcast production', 'Audio', 'services', 'modern', true, false, false, '/templates/podcast-production-thumb.jpg', ARRAY['/templates/podcast-production-1.jpg'], 'https://demo.digitpenhub.com/podcast-production', ARRAY['podcast', 'production', 'audio', 'media'], 'Podcast Production Template', 'Professional template for podcast production');

-- Video Production Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Video Production', 'Cinematic template for video production', 'Video', 'services', 'modern', true, true, false, '/templates/video-production-thumb.jpg', ARRAY['/templates/video-production-1.jpg'], 'https://demo.digitpenhub.com/video-production', ARRAY['video', 'production', 'film', 'creative'], 'Video Production Template', 'Professional template for video production'),

('Animation Studio', 'Creative template for animation studios', 'Video', 'services', 'bold', true, false, false, '/templates/animation-studio-thumb.jpg', ARRAY['/templates/animation-studio-1.jpg'], 'https://demo.digitpenhub.com/animation-studio', ARRAY['animation', 'studio', 'video', 'creative'], 'Animation Studio Template', 'Creative template for animation studios'),

('Video Editor', 'Professional template for video editors', 'Video', 'services', 'modern', true, false, false, '/templates/video-editor-thumb.jpg', ARRAY['/templates/video-editor-1.jpg'], 'https://demo.digitpenhub.com/video-editor', ARRAY['video', 'editor', 'editing', 'post-production'], 'Video Editor Template', 'Professional template for video editors'),

('Videography', 'Event template for videographers', 'Video', 'services', 'modern', true, false, false, '/templates/videography-thumb.jpg', ARRAY['/templates/videography-1.jpg'], 'https://demo.digitpenhub.com/videography', ARRAY['videography', 'video', 'events', 'filming'], 'Videography Template', 'Professional template for videographers'),

('YouTube Channel', 'Content template for YouTube creators', 'Video', 'content', 'bold', true, false, false, '/templates/youtube-channel-thumb.jpg', ARRAY['/templates/youtube-channel-1.jpg'], 'https://demo.digitpenhub.com/youtube-channel', ARRAY['youtube', 'channel', 'video', 'content'], 'YouTube Channel Template', 'Engaging template for YouTube channels');

-- 3D & Modeling Services Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('3D Modeling', 'Technical template for 3D modeling', '3D Services', 'services', 'modern', true, false, false, '/templates/3d-modeling-thumb.jpg', ARRAY['/templates/3d-modeling-1.jpg'], 'https://demo.digitpenhub.com/3d-modeling', ARRAY['3d', 'modeling', 'design', 'rendering'], '3D Modeling Template', 'Professional template for 3D modeling services'),

('Architectural Visualization', 'Rendering template for arch viz', '3D Services', 'services', 'modern', true, false, true, '/templates/arch-viz-thumb.jpg', ARRAY['/templates/arch-viz-1.jpg'], 'https://demo.digitpenhub.com/arch-viz', ARRAY['architectural', 'visualization', '3d', 'rendering'], 'Architectural Visualization Template', 'Professional template for architectural visualization'),

('Product Rendering', 'Commercial template for product rendering', '3D Services', 'services', 'modern', true, false, false, '/templates/product-rendering-thumb.jpg', ARRAY['/templates/product-rendering-1.jpg'], 'https://demo.digitpenhub.com/product-rendering', ARRAY['product', 'rendering', '3d', 'visualization'], 'Product Rendering Template', 'Professional template for product rendering'),

('Character Design', 'Creative template for character designers', '3D Services', 'services', 'bold', true, false, false, '/templates/character-design-thumb.jpg', ARRAY['/templates/character-design-1.jpg'], 'https://demo.digitpenhub.com/character-design', ARRAY['character', 'design', '3d', 'animation'], 'Character Design Template', 'Creative template for character designers'),

('VFX Studio', 'Effects template for VFX studios', '3D Services', 'services', 'bold', true, false, true, '/templates/vfx-studio-thumb.jpg', ARRAY['/templates/vfx-studio-1.jpg'], 'https://demo.digitpenhub.com/vfx-studio', ARRAY['vfx', 'visual-effects', '3d', 'post-production'], 'VFX Studio Template', 'Professional template for VFX studios');

-- Specialized Retail Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Vape Shop', 'Modern template for vape shops', 'Retail', 'online-store', 'modern', true, false, false, '/templates/vape-shop-thumb.jpg', ARRAY['/templates/vape-shop-1.jpg'], 'https://demo.digitpenhub.com/vape-shop', ARRAY['vape', 'shop', 'e-cigarette', 'retail'], 'Vape Shop Template', 'Modern template for vape shops'),

('CBD Store', 'Wellness template for CBD stores', 'Retail', 'online-store', 'minimal', true, false, false, '/templates/cbd-store-thumb.jpg', ARRAY['/templates/cbd-store-1.jpg'], 'https://demo.digitpenhub.com/cbd-store', ARRAY['cbd', 'wellness', 'hemp', 'retail'], 'CBD Store Template', 'Natural template for CBD stores'),

('Smoke Shop', 'Alternative template for smoke shops', 'Retail', 'online-store', 'modern', true, false, false, '/templates/smoke-shop-thumb.jpg', ARRAY['/templates/smoke-shop-1.jpg'], 'https://demo.digitpenhub.com/smoke-shop', ARRAY['smoke', 'shop', 'tobacco', 'retail'], 'Smoke Shop Template', 'Professional template for smoke shops'),

('Tattoo Supply', 'Artistic template for tattoo supplies', 'Retail', 'online-store', 'bold', true, false, false, '/templates/tattoo-supply-thumb.jpg', ARRAY['/templates/tattoo-supply-1.jpg'], 'https://demo.digitpenhub.com/tattoo-supply', ARRAY['tattoo', 'supply', 'ink', 'retail'], 'Tattoo Supply Template', 'Edgy template for tattoo supply stores'),

('Pawn Shop', 'Traditional template for pawn shops', 'Retail', 'online-store', 'classic', true, false, false, '/templates/pawn-shop-thumb.jpg', ARRAY['/templates/pawn-shop-1.jpg'], 'https://demo.digitpenhub.com/pawn-shop', ARRAY['pawn', 'shop', 'secondhand', 'retail'], 'Pawn Shop Template', 'Professional template for pawn shops');

COMMIT;
