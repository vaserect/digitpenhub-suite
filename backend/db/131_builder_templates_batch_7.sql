-- Migration 131: Website Builder Templates - Batch 7 (Retail, Wholesale & Distribution)
-- Creates 50 templates across 10 industries

-- Retail Store Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Retail Store', 'Modern template for retail stores', 'Retail', 'online-store', 'modern', true, true, false, '/templates/retail-store-thumb.jpg', ARRAY['/templates/retail-store-1.jpg'], 'https://demo.digitpenhub.com/retail-store', ARRAY['retail', 'store', 'shop', 'commerce'], 'Retail Store Template', 'Professional template for retail stores'),

('Bookstore', 'Literary template for bookstores', 'Retail', 'online-store', 'classic', true, false, false, '/templates/bookstore-thumb.jpg', ARRAY['/templates/bookstore-1.jpg'], 'https://demo.digitpenhub.com/bookstore', ARRAY['bookstore', 'books', 'literature', 'retail'], 'Bookstore Template', 'Elegant template for bookstores'),

('Toy Store', 'Playful template for toy stores', 'Retail', 'online-store', 'bold', true, false, false, '/templates/toy-store-thumb.jpg', ARRAY['/templates/toy-store-1.jpg'], 'https://demo.digitpenhub.com/toy-store', ARRAY['toys', 'store', 'children', 'retail'], 'Toy Store Template', 'Fun template for toy stores'),

('Home Decor Store', 'Stylish template for home decor', 'Retail', 'online-store', 'minimal', true, false, false, '/templates/home-decor-thumb.jpg', ARRAY['/templates/home-decor-1.jpg'], 'https://demo.digitpenhub.com/home-decor', ARRAY['home-decor', 'furniture', 'interior', 'retail'], 'Home Decor Store Template', 'Beautiful template for home decor stores'),

('Gift Shop', 'Charming template for gift shops', 'Retail', 'online-store', 'modern', true, false, false, '/templates/gift-shop-thumb.jpg', ARRAY['/templates/gift-shop-1.jpg'], 'https://demo.digitpenhub.com/gift-shop', ARRAY['gifts', 'shop', 'presents', 'retail'], 'Gift Shop Template', 'Delightful template for gift shops');

-- Wholesale & Distribution Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Wholesale Distributor', 'B2B template for wholesale distributors', 'Wholesale', 'services', 'modern', true, true, false, '/templates/wholesale-thumb.jpg', ARRAY['/templates/wholesale-1.jpg'], 'https://demo.digitpenhub.com/wholesale', ARRAY['wholesale', 'distributor', 'b2b', 'bulk'], 'Wholesale Distributor Template', 'Professional template for wholesale distributors'),

('Import Export', 'Global template for import/export', 'Wholesale', 'services', 'modern', true, false, false, '/templates/import-export-thumb.jpg', ARRAY['/templates/import-export-1.jpg'], 'https://demo.digitpenhub.com/import-export', ARRAY['import', 'export', 'trade', 'international'], 'Import Export Template', 'Professional template for import/export businesses'),

('Food Distributor', 'Fresh template for food distribution', 'Wholesale', 'services', 'modern', true, false, false, '/templates/food-distributor-thumb.jpg', ARRAY['/templates/food-distributor-1.jpg'], 'https://demo.digitpenhub.com/food-distributor', ARRAY['food', 'distributor', 'wholesale', 'supply'], 'Food Distributor Template', 'Professional template for food distributors'),

('Medical Supply', 'Healthcare template for medical supplies', 'Wholesale', 'services', 'classic', true, false, false, '/templates/medical-supply-thumb.jpg', ARRAY['/templates/medical-supply-1.jpg'], 'https://demo.digitpenhub.com/medical-supply', ARRAY['medical', 'supply', 'healthcare', 'wholesale'], 'Medical Supply Template', 'Professional template for medical supply distributors'),

('Industrial Supply', 'B2B template for industrial supplies', 'Wholesale', 'services', 'modern', true, false, true, '/templates/industrial-supply-thumb.jpg', ARRAY['/templates/industrial-supply-1.jpg'], 'https://demo.digitpenhub.com/industrial-supply', ARRAY['industrial', 'supply', 'wholesale', 'b2b'], 'Industrial Supply Template', 'Professional template for industrial suppliers');

-- Jewelry & Accessories Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Watch Store', 'Luxury template for watch retailers', 'Jewelry', 'online-store', 'classic', true, false, true, '/templates/watch-store-thumb.jpg', ARRAY['/templates/watch-store-1.jpg'], 'https://demo.digitpenhub.com/watch-store', ARRAY['watches', 'luxury', 'timepieces', 'jewelry'], 'Watch Store Template', 'Elegant template for watch stores'),

('Custom Jewelry', 'Artisan template for custom jewelry', 'Jewelry', 'online-store', 'minimal', true, false, false, '/templates/custom-jewelry-thumb.jpg', ARRAY['/templates/custom-jewelry-1.jpg'], 'https://demo.digitpenhub.com/custom-jewelry', ARRAY['jewelry', 'custom', 'handmade', 'artisan'], 'Custom Jewelry Template', 'Beautiful template for custom jewelry'),

('Diamond Dealer', 'Premium template for diamond dealers', 'Jewelry', 'online-store', 'classic', true, false, true, '/templates/diamond-dealer-thumb.jpg', ARRAY['/templates/diamond-dealer-1.jpg'], 'https://demo.digitpenhub.com/diamond-dealer', ARRAY['diamonds', 'jewelry', 'luxury', 'gems'], 'Diamond Dealer Template', 'Luxurious template for diamond dealers'),

('Fashion Accessories', 'Trendy template for accessories', 'Jewelry', 'online-store', 'modern', true, false, false, '/templates/fashion-accessories-thumb.jpg', ARRAY['/templates/fashion-accessories-1.jpg'], 'https://demo.digitpenhub.com/fashion-accessories', ARRAY['accessories', 'fashion', 'jewelry', 'style'], 'Fashion Accessories Template', 'Stylish template for fashion accessories'),

('Piercing Studio', 'Edgy template for piercing studios', 'Jewelry', 'services', 'bold', true, false, false, '/templates/piercing-studio-thumb.jpg', ARRAY['/templates/piercing-studio-1.jpg'], 'https://demo.digitpenhub.com/piercing-studio', ARRAY['piercing', 'body-art', 'jewelry', 'studio'], 'Piercing Studio Template', 'Bold template for piercing studios');

-- Furniture & Home Goods Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Furniture Store', 'Spacious template for furniture stores', 'Furniture', 'online-store', 'modern', true, true, false, '/templates/furniture-store-thumb.jpg', ARRAY['/templates/furniture-store-1.jpg'], 'https://demo.digitpenhub.com/furniture-store', ARRAY['furniture', 'store', 'home', 'retail'], 'Furniture Store Template', 'Modern template for furniture stores'),

('Custom Furniture', 'Artisan template for custom furniture', 'Furniture', 'online-store', 'minimal', true, false, false, '/templates/custom-furniture-thumb.jpg', ARRAY['/templates/custom-furniture-1.jpg'], 'https://demo.digitpenhub.com/custom-furniture', ARRAY['furniture', 'custom', 'handmade', 'woodwork'], 'Custom Furniture Template', 'Elegant template for custom furniture makers'),

('Office Furniture', 'Professional template for office furniture', 'Furniture', 'online-store', 'modern', true, false, false, '/templates/office-furniture-thumb.jpg', ARRAY['/templates/office-furniture-1.jpg'], 'https://demo.digitpenhub.com/office-furniture', ARRAY['office', 'furniture', 'commercial', 'business'], 'Office Furniture Template', 'Professional template for office furniture'),

('Antique Furniture', 'Classic template for antique dealers', 'Furniture', 'online-store', 'classic', true, false, true, '/templates/antique-furniture-thumb.jpg', ARRAY['/templates/antique-furniture-1.jpg'], 'https://demo.digitpenhub.com/antique-furniture', ARRAY['antique', 'furniture', 'vintage', 'collectibles'], 'Antique Furniture Template', 'Timeless template for antique furniture'),

('Mattress Store', 'Comfortable template for mattress stores', 'Furniture', 'online-store', 'minimal', true, false, false, '/templates/mattress-store-thumb.jpg', ARRAY['/templates/mattress-store-1.jpg'], 'https://demo.digitpenhub.com/mattress-store', ARRAY['mattress', 'bedding', 'sleep', 'furniture'], 'Mattress Store Template', 'Relaxing template for mattress stores');

-- Sporting Goods Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Sporting Goods Store', 'Active template for sporting goods', 'Sporting Goods', 'online-store', 'bold', true, true, false, '/templates/sporting-goods-thumb.jpg', ARRAY['/templates/sporting-goods-1.jpg'], 'https://demo.digitpenhub.com/sporting-goods', ARRAY['sports', 'equipment', 'athletic', 'retail'], 'Sporting Goods Store Template', 'Dynamic template for sporting goods stores'),

('Bike Shop', 'Cycling template for bike shops', 'Sporting Goods', 'online-store', 'modern', true, false, false, '/templates/bike-shop-thumb.jpg', ARRAY['/templates/bike-shop-1.jpg'], 'https://demo.digitpenhub.com/bike-shop', ARRAY['bikes', 'cycling', 'bicycles', 'shop'], 'Bike Shop Template', 'Professional template for bike shops'),

('Outdoor Gear', 'Adventure template for outdoor equipment', 'Sporting Goods', 'online-store', 'bold', true, false, false, '/templates/outdoor-gear-thumb.jpg', ARRAY['/templates/outdoor-gear-1.jpg'], 'https://demo.digitpenhub.com/outdoor-gear', ARRAY['outdoor', 'gear', 'camping', 'hiking'], 'Outdoor Gear Template', 'Rugged template for outdoor gear'),

('Golf Shop', 'Premium template for golf equipment', 'Sporting Goods', 'online-store', 'classic', true, false, false, '/templates/golf-shop-thumb.jpg', ARRAY['/templates/golf-shop-1.jpg'], 'https://demo.digitpenhub.com/golf-shop', ARRAY['golf', 'equipment', 'sports', 'shop'], 'Golf Shop Template', 'Refined template for golf shops'),

('Fishing Tackle', 'Outdoor template for fishing supplies', 'Sporting Goods', 'online-store', 'modern', true, false, false, '/templates/fishing-tackle-thumb.jpg', ARRAY['/templates/fishing-tackle-1.jpg'], 'https://demo.digitpenhub.com/fishing-tackle', ARRAY['fishing', 'tackle', 'outdoor', 'sports'], 'Fishing Tackle Template', 'Professional template for fishing tackle shops');

-- Music & Instruments Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Music Store', 'Harmonious template for music stores', 'Music', 'online-store', 'modern', true, false, false, '/templates/music-store-thumb.jpg', ARRAY['/templates/music-store-1.jpg'], 'https://demo.digitpenhub.com/music-store', ARRAY['music', 'store', 'instruments', 'retail'], 'Music Store Template', 'Professional template for music stores'),

('Guitar Shop', 'Rock template for guitar shops', 'Music', 'online-store', 'bold', true, false, false, '/templates/guitar-shop-thumb.jpg', ARRAY['/templates/guitar-shop-1.jpg'], 'https://demo.digitpenhub.com/guitar-shop', ARRAY['guitar', 'shop', 'music', 'instruments'], 'Guitar Shop Template', 'Dynamic template for guitar shops'),

('Piano Store', 'Classical template for piano dealers', 'Music', 'online-store', 'classic', true, false, true, '/templates/piano-store-thumb.jpg', ARRAY['/templates/piano-store-1.jpg'], 'https://demo.digitpenhub.com/piano-store', ARRAY['piano', 'music', 'instruments', 'classical'], 'Piano Store Template', 'Elegant template for piano stores'),

('DJ Equipment', 'Electronic template for DJ gear', 'Music', 'online-store', 'bold', true, false, false, '/templates/dj-equipment-thumb.jpg', ARRAY['/templates/dj-equipment-1.jpg'], 'https://demo.digitpenhub.com/dj-equipment', ARRAY['dj', 'equipment', 'music', 'electronic'], 'DJ Equipment Template', 'Modern template for DJ equipment'),

('Recording Studio', 'Professional template for recording studios', 'Music', 'services', 'modern', true, false, false, '/templates/recording-studio-thumb.jpg', ARRAY['/templates/recording-studio-1.jpg'], 'https://demo.digitpenhub.com/recording-studio', ARRAY['recording', 'studio', 'music', 'production'], 'Recording Studio Template', 'Professional template for recording studios');

-- Baby & Kids Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Baby Store', 'Gentle template for baby stores', 'Baby & Kids', 'online-store', 'minimal', true, true, false, '/templates/baby-store-thumb.jpg', ARRAY['/templates/baby-store-1.jpg'], 'https://demo.digitpenhub.com/baby-store', ARRAY['baby', 'store', 'children', 'retail'], 'Baby Store Template', 'Soft template for baby stores'),

('Kids Clothing', 'Playful template for children''s clothing', 'Baby & Kids', 'online-store', 'bold', true, false, false, '/templates/kids-clothing-thumb.jpg', ARRAY['/templates/kids-clothing-1.jpg'], 'https://demo.digitpenhub.com/kids-clothing', ARRAY['kids', 'clothing', 'children', 'fashion'], 'Kids Clothing Template', 'Fun template for kids clothing stores'),

('Daycare Center', 'Caring template for daycare centers', 'Baby & Kids', 'services', 'minimal', true, false, false, '/templates/daycare-thumb.jpg', ARRAY['/templates/daycare-1.jpg'], 'https://demo.digitpenhub.com/daycare', ARRAY['daycare', 'childcare', 'preschool', 'kids'], 'Daycare Center Template', 'Nurturing template for daycare centers'),

('Children''s Party', 'Festive template for party services', 'Baby & Kids', 'services', 'bold', true, false, false, '/templates/childrens-party-thumb.jpg', ARRAY['/templates/childrens-party-1.jpg'], 'https://demo.digitpenhub.com/childrens-party', ARRAY['party', 'children', 'entertainment', 'events'], 'Children''s Party Template', 'Exciting template for children''s party services'),

('Maternity Store', 'Comfortable template for maternity wear', 'Baby & Kids', 'online-store', 'minimal', true, false, false, '/templates/maternity-store-thumb.jpg', ARRAY['/templates/maternity-store-1.jpg'], 'https://demo.digitpenhub.com/maternity-store', ARRAY['maternity', 'pregnancy', 'clothing', 'retail'], 'Maternity Store Template', 'Elegant template for maternity stores');

-- Craft & Hobby Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Craft Store', 'Creative template for craft stores', 'Crafts', 'online-store', 'modern', true, false, false, '/templates/craft-store-thumb.jpg', ARRAY['/templates/craft-store-1.jpg'], 'https://demo.digitpenhub.com/craft-store', ARRAY['crafts', 'store', 'diy', 'hobby'], 'Craft Store Template', 'Colorful template for craft stores'),

('Knitting & Yarn', 'Cozy template for yarn shops', 'Crafts', 'online-store', 'minimal', true, false, false, '/templates/yarn-shop-thumb.jpg', ARRAY['/templates/yarn-shop-1.jpg'], 'https://demo.digitpenhub.com/yarn-shop', ARRAY['yarn', 'knitting', 'crafts', 'hobby'], 'Knitting & Yarn Template', 'Warm template for yarn shops'),

('Scrapbooking', 'Memory template for scrapbooking supplies', 'Crafts', 'online-store', 'modern', true, false, false, '/templates/scrapbooking-thumb.jpg', ARRAY['/templates/scrapbooking-1.jpg'], 'https://demo.digitpenhub.com/scrapbooking', ARRAY['scrapbooking', 'crafts', 'memory', 'hobby'], 'Scrapbooking Template', 'Creative template for scrapbooking supplies'),

('Art Supply Store', 'Artistic template for art supplies', 'Crafts', 'online-store', 'bold', true, false, false, '/templates/art-supply-thumb.jpg', ARRAY['/templates/art-supply-1.jpg'], 'https://demo.digitpenhub.com/art-supply', ARRAY['art', 'supplies', 'crafts', 'creative'], 'Art Supply Store Template', 'Vibrant template for art supply stores'),

('Model Building', 'Detailed template for model supplies', 'Crafts', 'online-store', 'modern', true, false, false, '/templates/model-building-thumb.jpg', ARRAY['/templates/model-building-1.jpg'], 'https://demo.digitpenhub.com/model-building', ARRAY['models', 'hobby', 'building', 'crafts'], 'Model Building Template', 'Professional template for model building supplies');

-- Collectibles & Memorabilia Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Collectibles Store', 'Nostalgic template for collectibles', 'Collectibles', 'online-store', 'classic', true, true, false, '/templates/collectibles-thumb.jpg', ARRAY['/templates/collectibles-1.jpg'], 'https://demo.digitpenhub.com/collectibles', ARRAY['collectibles', 'memorabilia', 'vintage', 'rare'], 'Collectibles Store Template', 'Classic template for collectibles stores'),

('Comic Book Shop', 'Heroic template for comic shops', 'Collectibles', 'online-store', 'bold', true, false, false, '/templates/comic-shop-thumb.jpg', ARRAY['/templates/comic-shop-1.jpg'], 'https://demo.digitpenhub.com/comic-shop', ARRAY['comics', 'books', 'collectibles', 'shop'], 'Comic Book Shop Template', 'Dynamic template for comic book shops'),

('Trading Cards', 'Competitive template for trading cards', 'Collectibles', 'online-store', 'modern', true, false, false, '/templates/trading-cards-thumb.jpg', ARRAY['/templates/trading-cards-1.jpg'], 'https://demo.digitpenhub.com/trading-cards', ARRAY['trading-cards', 'collectibles', 'games', 'hobby'], 'Trading Cards Template', 'Exciting template for trading card stores'),

('Coin & Stamp Shop', 'Traditional template for numismatics', 'Collectibles', 'online-store', 'classic', true, false, false, '/templates/coin-stamp-thumb.jpg', ARRAY['/templates/coin-stamp-1.jpg'], 'https://demo.digitpenhub.com/coin-stamp', ARRAY['coins', 'stamps', 'collectibles', 'numismatics'], 'Coin & Stamp Shop Template', 'Classic template for coin and stamp dealers'),

('Sports Memorabilia', 'Athletic template for sports collectibles', 'Collectibles', 'online-store', 'bold', true, false, true, '/templates/sports-memorabilia-thumb.jpg', ARRAY['/templates/sports-memorabilia-1.jpg'], 'https://demo.digitpenhub.com/sports-memorabilia', ARRAY['sports', 'memorabilia', 'collectibles', 'autographs'], 'Sports Memorabilia Template', 'Dynamic template for sports memorabilia');

COMMIT;
