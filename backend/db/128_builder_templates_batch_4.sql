-- Migration 128: Website Builder Templates - Batch 4 (Professional & Personal)
-- Creates 50 templates across 10 industries

-- Podcast Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Podcast Show', 'Modern template for podcast shows', 'Media', 'content', 'modern', true, true, false, '/templates/podcast-thumb.jpg', ARRAY['/templates/podcast-1.jpg'], 'https://demo.digitpenhub.com/podcast', ARRAY['podcast', 'audio', 'show', 'media'], 'Podcast Show Template', 'Professional template for podcast shows'),

('True Crime Podcast', 'Dark template for true crime podcasts', 'Media', 'content', 'bold', true, false, false, '/templates/true-crime-thumb.jpg', ARRAY['/templates/true-crime-1.jpg'], 'https://demo.digitpenhub.com/true-crime', ARRAY['true-crime', 'podcast', 'mystery', 'investigation'], 'True Crime Podcast Template', 'Dramatic template for true crime podcasts'),

('Business Podcast', 'Professional template for business podcasts', 'Media', 'content', 'classic', true, false, false, '/templates/business-podcast-thumb.jpg', ARRAY['/templates/business-podcast-1.jpg'], 'https://demo.digitpenhub.com/business-podcast', ARRAY['business', 'podcast', 'entrepreneurship', 'leadership'], 'Business Podcast Template', 'Professional template for business podcasts'),

('Comedy Podcast', 'Fun template for comedy podcasts', 'Media', 'content', 'bold', true, false, false, '/templates/comedy-podcast-thumb.jpg', ARRAY['/templates/comedy-podcast-1.jpg'], 'https://demo.digitpenhub.com/comedy-podcast', ARRAY['comedy', 'podcast', 'humor', 'entertainment'], 'Comedy Podcast Template', 'Entertaining template for comedy podcasts'),

('Educational Podcast', 'Clean template for educational podcasts', 'Media', 'content', 'minimal', true, false, false, '/templates/edu-podcast-thumb.jpg', ARRAY['/templates/edu-podcast-1.jpg'], 'https://demo.digitpenhub.com/edu-podcast', ARRAY['education', 'podcast', 'learning', 'knowledge'], 'Educational Podcast Template', 'Professional template for educational podcasts');

-- Blog & Content Creator Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Personal Blog', 'Clean template for personal blogs', 'Media', 'content', 'minimal', true, true, false, '/templates/personal-blog-thumb.jpg', ARRAY['/templates/personal-blog-1.jpg'], 'https://demo.digitpenhub.com/personal-blog', ARRAY['blog', 'personal', 'writing', 'content'], 'Personal Blog Template', 'Beautiful template for personal blogs'),

('Tech Blog', 'Modern template for technology blogs', 'Media', 'content', 'modern', true, false, false, '/templates/tech-blog-thumb.jpg', ARRAY['/templates/tech-blog-1.jpg'], 'https://demo.digitpenhub.com/tech-blog', ARRAY['tech', 'blog', 'technology', 'reviews'], 'Tech Blog Template', 'Professional template for tech blogs'),

('Food Blog', 'Appetizing template for food blogs', 'Media', 'content', 'modern', true, false, false, '/templates/food-blog-thumb.jpg', ARRAY['/templates/food-blog-1.jpg'], 'https://demo.digitpenhub.com/food-blog', ARRAY['food', 'blog', 'recipes', 'cooking'], 'Food Blog Template', 'Delicious template for food blogs'),

('Travel Blog', 'Adventurous template for travel blogs', 'Media', 'content', 'bold', true, false, false, '/templates/travel-blog-thumb.jpg', ARRAY['/templates/travel-blog-1.jpg'], 'https://demo.digitpenhub.com/travel-blog', ARRAY['travel', 'blog', 'adventure', 'destinations'], 'Travel Blog Template', 'Inspiring template for travel blogs'),

('Lifestyle Blog', 'Stylish template for lifestyle blogs', 'Media', 'content', 'classic', true, false, false, '/templates/lifestyle-blog-thumb.jpg', ARRAY['/templates/lifestyle-blog-1.jpg'], 'https://demo.digitpenhub.com/lifestyle-blog', ARRAY['lifestyle', 'blog', 'fashion', 'wellness'], 'Lifestyle Blog Template', 'Elegant template for lifestyle blogs');

-- Author & Writer Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Author Portfolio', 'Literary template for authors', 'Media', 'content', 'classic', true, true, false, '/templates/author-thumb.jpg', ARRAY['/templates/author-1.jpg'], 'https://demo.digitpenhub.com/author', ARRAY['author', 'writer', 'books', 'portfolio'], 'Author Portfolio Template', 'Professional template for authors'),

('Fiction Writer', 'Creative template for fiction writers', 'Media', 'content', 'minimal', true, false, false, '/templates/fiction-writer-thumb.jpg', ARRAY['/templates/fiction-writer-1.jpg'], 'https://demo.digitpenhub.com/fiction-writer', ARRAY['fiction', 'writer', 'novels', 'stories'], 'Fiction Writer Template', 'Elegant template for fiction writers'),

('Copywriter', 'Professional template for copywriters', 'Media', 'content', 'modern', true, false, false, '/templates/copywriter-thumb.jpg', ARRAY['/templates/copywriter-1.jpg'], 'https://demo.digitpenhub.com/copywriter', ARRAY['copywriter', 'writing', 'content', 'marketing'], 'Copywriter Template', 'Professional template for copywriters'),

('Journalist', 'News-focused template for journalists', 'Media', 'content', 'modern', true, false, false, '/templates/journalist-thumb.jpg', ARRAY['/templates/journalist-1.jpg'], 'https://demo.digitpenhub.com/journalist', ARRAY['journalist', 'news', 'reporting', 'media'], 'Journalist Template', 'Professional template for journalists'),

('Poet', 'Artistic template for poets', 'Media', 'content', 'minimal', true, false, false, '/templates/poet-thumb.jpg', ARRAY['/templates/poet-1.jpg'], 'https://demo.digitpenhub.com/poet', ARRAY['poet', 'poetry', 'writing', 'literature'], 'Poet Template', 'Beautiful template for poets');

-- Artist & Gallery Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Art Gallery', 'Sophisticated template for art galleries', 'Art', 'creative', 'minimal', true, true, true, '/templates/art-gallery-thumb.jpg', ARRAY['/templates/art-gallery-1.jpg'], 'https://demo.digitpenhub.com/art-gallery', ARRAY['art', 'gallery', 'exhibition', 'museum'], 'Art Gallery Template', 'Elegant template for art galleries'),

('Artist Portfolio', 'Creative template for artists', 'Art', 'creative', 'bold', true, true, false, '/templates/artist-portfolio-thumb.jpg', ARRAY['/templates/artist-portfolio-1.jpg'], 'https://demo.digitpenhub.com/artist-portfolio', ARRAY['artist', 'portfolio', 'art', 'creative'], 'Artist Portfolio Template', 'Stunning template for artists'),

('Painter', 'Colorful template for painters', 'Art', 'creative', 'bold', true, false, false, '/templates/painter-thumb.jpg', ARRAY['/templates/painter-1.jpg'], 'https://demo.digitpenhub.com/painter', ARRAY['painter', 'painting', 'art', 'canvas'], 'Painter Template', 'Vibrant template for painters'),

('Sculptor', 'Dimensional template for sculptors', 'Art', 'creative', 'minimal', true, false, false, '/templates/sculptor-thumb.jpg', ARRAY['/templates/sculptor-1.jpg'], 'https://demo.digitpenhub.com/sculptor', ARRAY['sculptor', 'sculpture', 'art', '3d'], 'Sculptor Template', 'Clean template for sculptors'),

('Digital Artist', 'Modern template for digital artists', 'Art', 'creative', 'modern', true, false, false, '/templates/digital-artist-thumb.jpg', ARRAY['/templates/digital-artist-1.jpg'], 'https://demo.digitpenhub.com/digital-artist', ARRAY['digital-art', 'artist', 'illustration', 'design'], 'Digital Artist Template', 'Contemporary template for digital artists');

-- Musician & Band Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Solo Musician', 'Personal template for solo musicians', 'Music', 'creative', 'modern', true, false, false, '/templates/solo-musician-thumb.jpg', ARRAY['/templates/solo-musician-1.jpg'], 'https://demo.digitpenhub.com/solo-musician', ARRAY['musician', 'solo', 'music', 'artist'], 'Solo Musician Template', 'Professional template for solo musicians'),

('Rock Band', 'Edgy template for rock bands', 'Music', 'creative', 'bold', true, false, false, '/templates/rock-band-thumb.jpg', ARRAY['/templates/rock-band-1.jpg'], 'https://demo.digitpenhub.com/rock-band', ARRAY['rock', 'band', 'music', 'concert'], 'Rock Band Template', 'Powerful template for rock bands'),

('Classical Musician', 'Elegant template for classical musicians', 'Music', 'creative', 'classic', true, false, false, '/templates/classical-musician-thumb.jpg', ARRAY['/templates/classical-musician-1.jpg'], 'https://demo.digitpenhub.com/classical-musician', ARRAY['classical', 'musician', 'orchestra', 'music'], 'Classical Musician Template', 'Refined template for classical musicians'),

('Hip Hop Artist', 'Urban template for hip hop artists', 'Music', 'creative', 'bold', true, false, false, '/templates/hiphop-artist-thumb.jpg', ARRAY['/templates/hiphop-artist-1.jpg'], 'https://demo.digitpenhub.com/hiphop-artist', ARRAY['hip-hop', 'rap', 'music', 'artist'], 'Hip Hop Artist Template', 'Dynamic template for hip hop artists'),

('Jazz Musician', 'Smooth template for jazz musicians', 'Music', 'creative', 'classic', true, false, false, '/templates/jazz-musician-thumb.jpg', ARRAY['/templates/jazz-musician-1.jpg'], 'https://demo.digitpenhub.com/jazz-musician', ARRAY['jazz', 'musician', 'music', 'band'], 'Jazz Musician Template', 'Sophisticated template for jazz musicians');

-- Coach & Mentor Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Life Coach', 'Inspiring template for life coaches', 'Coaching', 'professional-services', 'minimal', true, true, false, '/templates/life-coach-thumb.jpg', ARRAY['/templates/life-coach-1.jpg'], 'https://demo.digitpenhub.com/life-coach', ARRAY['life-coach', 'coaching', 'personal-development', 'mentor'], 'Life Coach Template', 'Professional template for life coaches'),

('Business Coach', 'Professional template for business coaches', 'Coaching', 'professional-services', 'modern', true, false, false, '/templates/business-coach-thumb.jpg', ARRAY['/templates/business-coach-1.jpg'], 'https://demo.digitpenhub.com/business-coach', ARRAY['business-coach', 'coaching', 'entrepreneur', 'mentor'], 'Business Coach Template', 'Professional template for business coaches'),

('Career Coach', 'Strategic template for career coaches', 'Coaching', 'professional-services', 'modern', true, false, false, '/templates/career-coach-thumb.jpg', ARRAY['/templates/career-coach-1.jpg'], 'https://demo.digitpenhub.com/career-coach', ARRAY['career-coach', 'coaching', 'job', 'professional'], 'Career Coach Template', 'Professional template for career coaches'),

('Health Coach', 'Wellness template for health coaches', 'Coaching', 'professional-services', 'minimal', true, false, false, '/templates/health-coach-thumb.jpg', ARRAY['/templates/health-coach-1.jpg'], 'https://demo.digitpenhub.com/health-coach', ARRAY['health-coach', 'wellness', 'nutrition', 'fitness'], 'Health Coach Template', 'Clean template for health coaches'),

('Executive Coach', 'Corporate template for executive coaches', 'Coaching', 'professional-services', 'classic', true, false, true, '/templates/executive-coach-thumb.jpg', ARRAY['/templates/executive-coach-1.jpg'], 'https://demo.digitpenhub.com/executive-coach', ARRAY['executive-coach', 'leadership', 'coaching', 'corporate'], 'Executive Coach Template', 'Sophisticated template for executive coaches');

-- Speaker & Presenter Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Keynote Speaker', 'Professional template for keynote speakers', 'Speaking', 'professional-services', 'modern', true, true, false, '/templates/keynote-speaker-thumb.jpg', ARRAY['/templates/keynote-speaker-1.jpg'], 'https://demo.digitpenhub.com/keynote-speaker', ARRAY['speaker', 'keynote', 'presentation', 'public-speaking'], 'Keynote Speaker Template', 'Professional template for keynote speakers'),

('Motivational Speaker', 'Inspiring template for motivational speakers', 'Speaking', 'professional-services', 'bold', true, false, false, '/templates/motivational-speaker-thumb.jpg', ARRAY['/templates/motivational-speaker-1.jpg'], 'https://demo.digitpenhub.com/motivational-speaker', ARRAY['motivational', 'speaker', 'inspiration', 'public-speaking'], 'Motivational Speaker Template', 'Inspiring template for motivational speakers'),

('TEDx Speaker', 'Modern template for TEDx speakers', 'Speaking', 'professional-services', 'modern', true, false, false, '/templates/tedx-speaker-thumb.jpg', ARRAY['/templates/tedx-speaker-1.jpg'], 'https://demo.digitpenhub.com/tedx-speaker', ARRAY['tedx', 'speaker', 'ideas', 'presentation'], 'TEDx Speaker Template', 'Professional template for TEDx speakers'),

('Corporate Trainer', 'Professional template for corporate trainers', 'Speaking', 'professional-services', 'classic', true, false, false, '/templates/corporate-trainer-thumb.jpg', ARRAY['/templates/corporate-trainer-1.jpg'], 'https://demo.digitpenhub.com/corporate-trainer', ARRAY['trainer', 'corporate', 'training', 'professional'], 'Corporate Trainer Template', 'Professional template for corporate trainers'),

('Workshop Facilitator', 'Engaging template for workshop facilitators', 'Speaking', 'professional-services', 'minimal', true, false, false, '/templates/workshop-facilitator-thumb.jpg', ARRAY['/templates/workshop-facilitator-1.jpg'], 'https://demo.digitpenhub.com/workshop-facilitator', ARRAY['workshop', 'facilitator', 'training', 'education'], 'Workshop Facilitator Template', 'Professional template for workshop facilitators');

-- Influencer & Creator Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Social Media Influencer', 'Trendy template for social media influencers', 'Influencer', 'content', 'bold', true, true, false, '/templates/influencer-thumb.jpg', ARRAY['/templates/influencer-1.jpg'], 'https://demo.digitpenhub.com/influencer', ARRAY['influencer', 'social-media', 'content-creator', 'brand'], 'Social Media Influencer Template', 'Stylish template for social media influencers'),

('YouTube Creator', 'Video-focused template for YouTube creators', 'Influencer', 'content', 'modern', true, false, false, '/templates/youtube-creator-thumb.jpg', ARRAY['/templates/youtube-creator-1.jpg'], 'https://demo.digitpenhub.com/youtube-creator', ARRAY['youtube', 'creator', 'video', 'content'], 'YouTube Creator Template', 'Modern template for YouTube creators'),

('Instagram Influencer', 'Visual template for Instagram influencers', 'Influencer', 'content', 'minimal', true, false, false, '/templates/instagram-influencer-thumb.jpg', ARRAY['/templates/instagram-influencer-1.jpg'], 'https://demo.digitpenhub.com/instagram-influencer', ARRAY['instagram', 'influencer', 'photos', 'social-media'], 'Instagram Influencer Template', 'Beautiful template for Instagram influencers'),

('TikTok Creator', 'Dynamic template for TikTok creators', 'Influencer', 'content', 'bold', true, false, false, '/templates/tiktok-creator-thumb.jpg', ARRAY['/templates/tiktok-creator-1.jpg'], 'https://demo.digitpenhub.com/tiktok-creator', ARRAY['tiktok', 'creator', 'video', 'viral'], 'TikTok Creator Template', 'Energetic template for TikTok creators'),

('Twitch Streamer', 'Gaming template for Twitch streamers', 'Influencer', 'content', 'bold', true, false, false, '/templates/twitch-streamer-thumb.jpg', ARRAY['/templates/twitch-streamer-1.jpg'], 'https://demo.digitpenhub.com/twitch-streamer', ARRAY['twitch', 'streamer', 'gaming', 'live'], 'Twitch Streamer Template', 'Dynamic template for Twitch streamers');

-- Freelancer Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Freelance Developer', 'Professional template for freelance developers', 'Freelance', 'professional-services', 'modern', true, false, false, '/templates/freelance-dev-thumb.jpg', ARRAY['/templates/freelance-dev-1.jpg'], 'https://demo.digitpenhub.com/freelance-dev', ARRAY['freelance', 'developer', 'programming', 'portfolio'], 'Freelance Developer Template', 'Professional template for freelance developers'),

('Freelance Designer', 'Creative template for freelance designers', 'Freelance', 'professional-services', 'bold', true, false, false, '/templates/freelance-designer-thumb.jpg', ARRAY['/templates/freelance-designer-1.jpg'], 'https://demo.digitpenhub.com/freelance-designer', ARRAY['freelance', 'designer', 'creative', 'portfolio'], 'Freelance Designer Template', 'Creative template for freelance designers'),

('Virtual Assistant', 'Professional template for virtual assistants', 'Freelance', 'professional-services', 'minimal', true, false, false, '/templates/virtual-assistant-thumb.jpg', ARRAY['/templates/virtual-assistant-1.jpg'], 'https://demo.digitpenhub.com/virtual-assistant', ARRAY['virtual-assistant', 'freelance', 'admin', 'support'], 'Virtual Assistant Template', 'Professional template for virtual assistants'),

('Freelance Writer', 'Clean template for freelance writers', 'Freelance', 'professional-services', 'minimal', true, false, false, '/templates/freelance-writer-thumb.jpg', ARRAY['/templates/freelance-writer-1.jpg'], 'https://demo.digitpenhub.com/freelance-writer', ARRAY['freelance', 'writer', 'content', 'copywriting'], 'Freelance Writer Template', 'Professional template for freelance writers'),

('Freelance Consultant', 'Professional template for freelance consultants', 'Freelance', 'professional-services', 'classic', true, false, false, '/templates/freelance-consultant-thumb.jpg', ARRAY['/templates/freelance-consultant-1.jpg'], 'https://demo.digitpenhub.com/freelance-consultant', ARRAY['freelance', 'consultant', 'advisor', 'professional'], 'Freelance Consultant Template', 'Professional template for freelance consultants');

COMMIT;
