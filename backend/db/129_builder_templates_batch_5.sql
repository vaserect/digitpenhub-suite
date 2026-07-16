-- Migration 129: Website Builder Templates - Batch 5 (Sports, Gaming & Community)
-- Creates 50 templates across 10 industries

-- Sports & Recreation Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Sports Team', 'Dynamic template for sports teams', 'Sports', 'organization', 'bold', true, true, false, '/templates/sports-team-thumb.jpg', ARRAY['/templates/sports-team-1.jpg'], 'https://demo.digitpenhub.com/sports-team', ARRAY['sports', 'team', 'athletics', 'competition'], 'Sports Team Template', 'Energetic template for sports teams'),

('Martial Arts School', 'Powerful template for martial arts schools', 'Sports', 'organization', 'bold', true, false, false, '/templates/martial-arts-thumb.jpg', ARRAY['/templates/martial-arts-1.jpg'], 'https://demo.digitpenhub.com/martial-arts', ARRAY['martial-arts', 'karate', 'training', 'dojo'], 'Martial Arts School Template', 'Strong template for martial arts schools'),

('Golf Course', 'Elegant template for golf courses', 'Sports', 'organization', 'classic', true, false, true, '/templates/golf-course-thumb.jpg', ARRAY['/templates/golf-course-1.jpg'], 'https://demo.digitpenhub.com/golf-course', ARRAY['golf', 'course', 'club', 'sports'], 'Golf Course Template', 'Refined template for golf courses'),

('Tennis Club', 'Active template for tennis clubs', 'Sports', 'organization', 'modern', true, false, false, '/templates/tennis-club-thumb.jpg', ARRAY['/templates/tennis-club-1.jpg'], 'https://demo.digitpenhub.com/tennis-club', ARRAY['tennis', 'club', 'sports', 'recreation'], 'Tennis Club Template', 'Professional template for tennis clubs'),

('Swimming Pool', 'Refreshing template for swimming facilities', 'Sports', 'organization', 'modern', true, false, false, '/templates/swimming-pool-thumb.jpg', ARRAY['/templates/swimming-pool-1.jpg'], 'https://demo.digitpenhub.com/swimming-pool', ARRAY['swimming', 'pool', 'aquatics', 'recreation'], 'Swimming Pool Template', 'Clean template for swimming facilities');

-- Gaming & Esports Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Esports Team', 'Competitive template for esports teams', 'Gaming', 'organization', 'bold', true, true, false, '/templates/esports-team-thumb.jpg', ARRAY['/templates/esports-team-1.jpg'], 'https://demo.digitpenhub.com/esports-team', ARRAY['esports', 'gaming', 'team', 'competitive'], 'Esports Team Template', 'Dynamic template for esports teams'),

('Gaming Clan', 'Community template for gaming clans', 'Gaming', 'organization', 'bold', true, false, false, '/templates/gaming-clan-thumb.jpg', ARRAY['/templates/gaming-clan-1.jpg'], 'https://demo.digitpenhub.com/gaming-clan', ARRAY['gaming', 'clan', 'community', 'multiplayer'], 'Gaming Clan Template', 'Energetic template for gaming clans'),

('Game Developer', 'Creative template for game developers', 'Gaming', 'software', 'modern', true, false, false, '/templates/game-dev-thumb.jpg', ARRAY['/templates/game-dev-1.jpg'], 'https://demo.digitpenhub.com/game-dev', ARRAY['game', 'developer', 'indie', 'studio'], 'Game Developer Template', 'Professional template for game developers'),

('Gaming News', 'News-focused template for gaming media', 'Gaming', 'content', 'modern', true, false, false, '/templates/gaming-news-thumb.jpg', ARRAY['/templates/gaming-news-1.jpg'], 'https://demo.digitpenhub.com/gaming-news', ARRAY['gaming', 'news', 'reviews', 'media'], 'Gaming News Template', 'Modern template for gaming news sites'),

('Game Store', 'Retail template for game stores', 'Gaming', 'online-store', 'bold', true, false, false, '/templates/game-store-thumb.jpg', ARRAY['/templates/game-store-1.jpg'], 'https://demo.digitpenhub.com/game-store', ARRAY['games', 'store', 'retail', 'shop'], 'Game Store Template', 'Exciting template for game stores');

-- Community & Social Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Community Forum', 'Engaging template for online communities', 'Community', 'organization', 'modern', true, false, false, '/templates/community-forum-thumb.jpg', ARRAY['/templates/community-forum-1.jpg'], 'https://demo.digitpenhub.com/community-forum', ARRAY['community', 'forum', 'discussion', 'social'], 'Community Forum Template', 'Interactive template for online communities'),

('Neighborhood Association', 'Local template for neighborhood groups', 'Community', 'organization', 'minimal', true, false, false, '/templates/neighborhood-thumb.jpg', ARRAY['/templates/neighborhood-1.jpg'], 'https://demo.digitpenhub.com/neighborhood', ARRAY['neighborhood', 'community', 'local', 'association'], 'Neighborhood Association Template', 'Friendly template for neighborhood associations'),

('Social Club', 'Social template for clubs and groups', 'Community', 'organization', 'modern', true, false, false, '/templates/social-club-thumb.jpg', ARRAY['/templates/social-club-1.jpg'], 'https://demo.digitpenhub.com/social-club', ARRAY['club', 'social', 'community', 'group'], 'Social Club Template', 'Welcoming template for social clubs'),

('Meetup Group', 'Event-focused template for meetup groups', 'Community', 'organization', 'minimal', true, false, false, '/templates/meetup-group-thumb.jpg', ARRAY['/templates/meetup-group-1.jpg'], 'https://demo.digitpenhub.com/meetup-group', ARRAY['meetup', 'group', 'events', 'community'], 'Meetup Group Template', 'Friendly template for meetup groups'),

('Alumni Network', 'Professional template for alumni associations', 'Community', 'organization', 'classic', true, false, false, '/templates/alumni-thumb.jpg', ARRAY['/templates/alumni-1.jpg'], 'https://demo.digitpenhub.com/alumni', ARRAY['alumni', 'network', 'school', 'university'], 'Alumni Network Template', 'Professional template for alumni networks');

-- Religious & Spiritual Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Church', 'Welcoming template for churches', 'Religious', 'organization', 'classic', true, true, false, '/templates/church-thumb.jpg', ARRAY['/templates/church-1.jpg'], 'https://demo.digitpenhub.com/church', ARRAY['church', 'religious', 'worship', 'community'], 'Church Template', 'Welcoming template for churches'),

('Mosque', 'Peaceful template for mosques', 'Religious', 'organization', 'minimal', true, false, false, '/templates/mosque-thumb.jpg', ARRAY['/templates/mosque-1.jpg'], 'https://demo.digitpenhub.com/mosque', ARRAY['mosque', 'islamic', 'worship', 'community'], 'Mosque Template', 'Peaceful template for mosques'),

('Synagogue', 'Traditional template for synagogues', 'Religious', 'organization', 'classic', true, false, false, '/templates/synagogue-thumb.jpg', ARRAY['/templates/synagogue-1.jpg'], 'https://demo.digitpenhub.com/synagogue', ARRAY['synagogue', 'jewish', 'worship', 'community'], 'Synagogue Template', 'Traditional template for synagogues'),

('Temple', 'Serene template for temples', 'Religious', 'organization', 'minimal', true, false, false, '/templates/temple-thumb.jpg', ARRAY['/templates/temple-1.jpg'], 'https://demo.digitpenhub.com/temple', ARRAY['temple', 'buddhist', 'worship', 'meditation'], 'Temple Template', 'Serene template for temples'),

('Spiritual Center', 'Holistic template for spiritual centers', 'Religious', 'organization', 'minimal', true, false, false, '/templates/spiritual-center-thumb.jpg', ARRAY['/templates/spiritual-center-1.jpg'], 'https://demo.digitpenhub.com/spiritual-center', ARRAY['spiritual', 'center', 'wellness', 'meditation'], 'Spiritual Center Template', 'Peaceful template for spiritual centers');

-- Political & Advocacy Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Political Campaign', 'Persuasive template for political campaigns', 'Political', 'organization', 'bold', true, true, false, '/templates/political-campaign-thumb.jpg', ARRAY['/templates/political-campaign-1.jpg'], 'https://demo.digitpenhub.com/political-campaign', ARRAY['political', 'campaign', 'election', 'candidate'], 'Political Campaign Template', 'Powerful template for political campaigns'),

('Advocacy Group', 'Activist template for advocacy organizations', 'Political', 'organization', 'modern', true, false, false, '/templates/advocacy-group-thumb.jpg', ARRAY['/templates/advocacy-group-1.jpg'], 'https://demo.digitpenhub.com/advocacy-group', ARRAY['advocacy', 'activism', 'cause', 'organization'], 'Advocacy Group Template', 'Impactful template for advocacy groups'),

('Political Party', 'Official template for political parties', 'Political', 'organization', 'classic', true, false, false, '/templates/political-party-thumb.jpg', ARRAY['/templates/political-party-1.jpg'], 'https://demo.digitpenhub.com/political-party', ARRAY['political', 'party', 'government', 'organization'], 'Political Party Template', 'Professional template for political parties'),

('Petition Platform', 'Action-focused template for petitions', 'Political', 'organization', 'modern', true, false, false, '/templates/petition-thumb.jpg', ARRAY['/templates/petition-1.jpg'], 'https://demo.digitpenhub.com/petition', ARRAY['petition', 'activism', 'change', 'advocacy'], 'Petition Platform Template', 'Engaging template for petition platforms'),

('Think Tank', 'Research-focused template for think tanks', 'Political', 'organization', 'classic', true, false, true, '/templates/think-tank-thumb.jpg', ARRAY['/templates/think-tank-1.jpg'], 'https://demo.digitpenhub.com/think-tank', ARRAY['think-tank', 'research', 'policy', 'analysis'], 'Think Tank Template', 'Professional template for think tanks');

-- Event & Conference Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Conference', 'Professional template for conferences', 'Events', 'organization', 'modern', true, true, false, '/templates/conference-thumb.jpg', ARRAY['/templates/conference-1.jpg'], 'https://demo.digitpenhub.com/conference', ARRAY['conference', 'event', 'business', 'networking'], 'Conference Template', 'Professional template for conferences'),

('Trade Show', 'Exhibition template for trade shows', 'Events', 'organization', 'modern', true, false, false, '/templates/trade-show-thumb.jpg', ARRAY['/templates/trade-show-1.jpg'], 'https://demo.digitpenhub.com/trade-show', ARRAY['trade-show', 'exhibition', 'expo', 'event'], 'Trade Show Template', 'Professional template for trade shows'),

('Music Festival', 'Vibrant template for music festivals', 'Events', 'organization', 'bold', true, true, false, '/templates/music-festival-thumb.jpg', ARRAY['/templates/music-festival-1.jpg'], 'https://demo.digitpenhub.com/music-festival', ARRAY['festival', 'music', 'concert', 'event'], 'Music Festival Template', 'Exciting template for music festivals'),

('Tech Summit', 'Innovation-focused template for tech events', 'Events', 'organization', 'modern', true, false, false, '/templates/tech-summit-thumb.jpg', ARRAY['/templates/tech-summit-1.jpg'], 'https://demo.digitpenhub.com/tech-summit', ARRAY['tech', 'summit', 'conference', 'innovation'], 'Tech Summit Template', 'Modern template for tech summits'),

('Charity Gala', 'Elegant template for charity galas', 'Events', 'organization', 'classic', true, false, true, '/templates/charity-gala-thumb.jpg', ARRAY['/templates/charity-gala-1.jpg'], 'https://demo.digitpenhub.com/charity-gala', ARRAY['gala', 'charity', 'fundraiser', 'event'], 'Charity Gala Template', 'Elegant template for charity galas');

-- Membership & Subscription Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Membership Site', 'Exclusive template for membership sites', 'Membership', 'online-store', 'modern', true, true, false, '/templates/membership-site-thumb.jpg', ARRAY['/templates/membership-site-1.jpg'], 'https://demo.digitpenhub.com/membership-site', ARRAY['membership', 'subscription', 'exclusive', 'community'], 'Membership Site Template', 'Professional template for membership sites'),

('Subscription Box', 'Exciting template for subscription boxes', 'Membership', 'online-store', 'bold', true, false, false, '/templates/subscription-box-thumb.jpg', ARRAY['/templates/subscription-box-1.jpg'], 'https://demo.digitpenhub.com/subscription-box', ARRAY['subscription', 'box', 'monthly', 'delivery'], 'Subscription Box Template', 'Engaging template for subscription boxes'),

('Premium Content', 'Exclusive template for premium content', 'Membership', 'online-store', 'minimal', true, false, false, '/templates/premium-content-thumb.jpg', ARRAY['/templates/premium-content-1.jpg'], 'https://demo.digitpenhub.com/premium-content', ARRAY['premium', 'content', 'subscription', 'exclusive'], 'Premium Content Template', 'Clean template for premium content'),

('Online Community', 'Social template for paid communities', 'Membership', 'online-store', 'modern', true, false, false, '/templates/online-community-thumb.jpg', ARRAY['/templates/online-community-1.jpg'], 'https://demo.digitpenhub.com/online-community', ARRAY['community', 'membership', 'social', 'forum'], 'Online Community Template', 'Engaging template for online communities'),

('VIP Club', 'Luxurious template for VIP clubs', 'Membership', 'online-store', 'classic', true, false, true, '/templates/vip-club-thumb.jpg', ARRAY['/templates/vip-club-1.jpg'], 'https://demo.digitpenhub.com/vip-club', ARRAY['vip', 'club', 'exclusive', 'luxury'], 'VIP Club Template', 'Elegant template for VIP clubs');

-- Crowdfunding & Fundraising Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Crowdfunding Campaign', 'Compelling template for crowdfunding', 'Fundraising', 'organization', 'modern', true, true, false, '/templates/crowdfunding-thumb.jpg', ARRAY['/templates/crowdfunding-1.jpg'], 'https://demo.digitpenhub.com/crowdfunding', ARRAY['crowdfunding', 'campaign', 'fundraising', 'kickstarter'], 'Crowdfunding Campaign Template', 'Engaging template for crowdfunding campaigns'),

('Donation Platform', 'Trustworthy template for donations', 'Fundraising', 'organization', 'minimal', true, false, false, '/templates/donation-platform-thumb.jpg', ARRAY['/templates/donation-platform-1.jpg'], 'https://demo.digitpenhub.com/donation-platform', ARRAY['donation', 'fundraising', 'charity', 'giving'], 'Donation Platform Template', 'Professional template for donation platforms'),

('Scholarship Fund', 'Educational template for scholarships', 'Fundraising', 'organization', 'classic', true, false, false, '/templates/scholarship-fund-thumb.jpg', ARRAY['/templates/scholarship-fund-1.jpg'], 'https://demo.digitpenhub.com/scholarship-fund', ARRAY['scholarship', 'education', 'fund', 'students'], 'Scholarship Fund Template', 'Professional template for scholarship funds'),

('Medical Fundraiser', 'Compassionate template for medical fundraising', 'Fundraising', 'organization', 'minimal', true, false, false, '/templates/medical-fundraiser-thumb.jpg', ARRAY['/templates/medical-fundraiser-1.jpg'], 'https://demo.digitpenhub.com/medical-fundraiser', ARRAY['medical', 'fundraiser', 'health', 'donation'], 'Medical Fundraiser Template', 'Caring template for medical fundraisers'),

('Capital Campaign', 'Professional template for capital campaigns', 'Fundraising', 'organization', 'classic', true, false, true, '/templates/capital-campaign-thumb.jpg', ARRAY['/templates/capital-campaign-1.jpg'], 'https://demo.digitpenhub.com/capital-campaign', ARRAY['capital', 'campaign', 'fundraising', 'major-gifts'], 'Capital Campaign Template', 'Professional template for capital campaigns');

-- Job Board & Recruitment Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Job Board', 'Professional template for job boards', 'Recruitment', 'software', 'modern', true, true, false, '/templates/job-board-thumb.jpg', ARRAY['/templates/job-board-1.jpg'], 'https://demo.digitpenhub.com/job-board', ARRAY['jobs', 'board', 'recruitment', 'careers'], 'Job Board Template', 'Professional template for job boards'),

('Recruitment Agency', 'Corporate template for recruitment agencies', 'Recruitment', 'professional-services', 'classic', true, false, false, '/templates/recruitment-agency-thumb.jpg', ARRAY['/templates/recruitment-agency-1.jpg'], 'https://demo.digitpenhub.com/recruitment-agency', ARRAY['recruitment', 'agency', 'staffing', 'hiring'], 'Recruitment Agency Template', 'Professional template for recruitment agencies'),

('Career Portal', 'Comprehensive template for career portals', 'Recruitment', 'software', 'modern', true, false, false, '/templates/career-portal-thumb.jpg', ARRAY['/templates/career-portal-1.jpg'], 'https://demo.digitpenhub.com/career-portal', ARRAY['career', 'portal', 'jobs', 'employment'], 'Career Portal Template', 'Modern template for career portals'),

('Freelance Marketplace', 'Platform template for freelance marketplaces', 'Recruitment', 'software', 'modern', true, false, false, '/templates/freelance-marketplace-thumb.jpg', ARRAY['/templates/freelance-marketplace-1.jpg'], 'https://demo.digitpenhub.com/freelance-marketplace', ARRAY['freelance', 'marketplace', 'gigs', 'platform'], 'Freelance Marketplace Template', 'Modern template for freelance marketplaces'),

('Executive Search', 'Premium template for executive search firms', 'Recruitment', 'professional-services', 'classic', true, false, true, '/templates/executive-search-thumb.jpg', ARRAY['/templates/executive-search-1.jpg'], 'https://demo.digitpenhub.com/executive-search', ARRAY['executive', 'search', 'recruitment', 'headhunter'], 'Executive Search Template', 'Sophisticated template for executive search');

COMMIT;
