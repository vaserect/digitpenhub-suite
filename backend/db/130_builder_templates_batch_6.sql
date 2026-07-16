-- Migration 130: Website Builder Templates - Batch 6 (Manufacturing, Agriculture & Industrial)
-- Creates 50 templates across 10 industries

-- Manufacturing Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Manufacturing Company', 'Industrial template for manufacturing companies', 'Manufacturing', 'industrial', 'modern', true, true, false, '/templates/manufacturing-thumb.jpg', ARRAY['/templates/manufacturing-1.jpg'], 'https://demo.digitpenhub.com/manufacturing', ARRAY['manufacturing', 'industrial', 'production', 'factory'], 'Manufacturing Company Template', 'Professional template for manufacturing companies'),

('Custom Fabrication', 'Specialized template for custom fabrication', 'Manufacturing', 'industrial', 'modern', true, false, false, '/templates/fabrication-thumb.jpg', ARRAY['/templates/fabrication-1.jpg'], 'https://demo.digitpenhub.com/fabrication', ARRAY['fabrication', 'custom', 'manufacturing', 'metalwork'], 'Custom Fabrication Template', 'Professional template for fabrication services'),

('3D Printing Service', 'Tech-forward template for 3D printing', 'Manufacturing', 'industrial', 'modern', true, false, false, '/templates/3d-printing-thumb.jpg', ARRAY['/templates/3d-printing-1.jpg'], 'https://demo.digitpenhub.com/3d-printing', ARRAY['3d-printing', 'additive', 'manufacturing', 'prototyping'], '3D Printing Service Template', 'Modern template for 3D printing services'),

('Industrial Equipment', 'Heavy-duty template for equipment manufacturers', 'Manufacturing', 'industrial', 'classic', true, false, false, '/templates/industrial-equipment-thumb.jpg', ARRAY['/templates/industrial-equipment-1.jpg'], 'https://demo.digitpenhub.com/industrial-equipment', ARRAY['industrial', 'equipment', 'machinery', 'manufacturing'], 'Industrial Equipment Template', 'Professional template for equipment manufacturers'),

('Contract Manufacturing', 'B2B template for contract manufacturers', 'Manufacturing', 'industrial', 'classic', true, false, true, '/templates/contract-manufacturing-thumb.jpg', ARRAY['/templates/contract-manufacturing-1.jpg'], 'https://demo.digitpenhub.com/contract-manufacturing', ARRAY['contract', 'manufacturing', 'oem', 'production'], 'Contract Manufacturing Template', 'Professional template for contract manufacturers');

-- Agriculture & Farming Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Farm', 'Rural template for farms and ranches', 'Agriculture', 'services', 'minimal', true, true, false, '/templates/farm-thumb.jpg', ARRAY['/templates/farm-1.jpg'], 'https://demo.digitpenhub.com/farm', ARRAY['farm', 'agriculture', 'farming', 'rural'], 'Farm Template', 'Authentic template for farms and ranches'),

('Organic Farm', 'Natural template for organic farms', 'Agriculture', 'services', 'minimal', true, false, false, '/templates/organic-farm-thumb.jpg', ARRAY['/templates/organic-farm-1.jpg'], 'https://demo.digitpenhub.com/organic-farm', ARRAY['organic', 'farm', 'sustainable', 'agriculture'], 'Organic Farm Template', 'Natural template for organic farms'),

('Agricultural Equipment', 'Industrial template for farm equipment', 'Agriculture', 'services', 'modern', true, false, false, '/templates/ag-equipment-thumb.jpg', ARRAY['/templates/ag-equipment-1.jpg'], 'https://demo.digitpenhub.com/ag-equipment', ARRAY['agriculture', 'equipment', 'machinery', 'farming'], 'Agricultural Equipment Template', 'Professional template for farm equipment'),

('Farmers Market', 'Fresh template for farmers markets', 'Agriculture', 'services', 'modern', true, false, false, '/templates/farmers-market-thumb.jpg', ARRAY['/templates/farmers-market-1.jpg'], 'https://demo.digitpenhub.com/farmers-market', ARRAY['farmers-market', 'local', 'produce', 'community'], 'Farmers Market Template', 'Vibrant template for farmers markets'),

('Agricultural Cooperative', 'Community template for ag cooperatives', 'Agriculture', 'services', 'classic', true, false, false, '/templates/ag-coop-thumb.jpg', ARRAY['/templates/ag-coop-1.jpg'], 'https://demo.digitpenhub.com/ag-coop', ARRAY['cooperative', 'agriculture', 'farming', 'community'], 'Agricultural Cooperative Template', 'Professional template for ag cooperatives');

-- Energy & Utilities Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Solar Energy', 'Green template for solar companies', 'Energy', 'services', 'modern', true, true, false, '/templates/solar-energy-thumb.jpg', ARRAY['/templates/solar-energy-1.jpg'], 'https://demo.digitpenhub.com/solar-energy', ARRAY['solar', 'energy', 'renewable', 'green'], 'Solar Energy Template', 'Modern template for solar energy companies'),

('Wind Energy', 'Sustainable template for wind power', 'Energy', 'services', 'modern', true, false, false, '/templates/wind-energy-thumb.jpg', ARRAY['/templates/wind-energy-1.jpg'], 'https://demo.digitpenhub.com/wind-energy', ARRAY['wind', 'energy', 'renewable', 'power'], 'Wind Energy Template', 'Professional template for wind energy'),

('Electrical Utility', 'Reliable template for utility companies', 'Energy', 'services', 'classic', true, false, false, '/templates/utility-thumb.jpg', ARRAY['/templates/utility-1.jpg'], 'https://demo.digitpenhub.com/utility', ARRAY['utility', 'electricity', 'power', 'energy'], 'Electrical Utility Template', 'Professional template for utility companies'),

('Energy Consulting', 'Expert template for energy consultants', 'Energy', 'professional-services', 'modern', true, false, false, '/templates/energy-consulting-thumb.jpg', ARRAY['/templates/energy-consulting-1.jpg'], 'https://demo.digitpenhub.com/energy-consulting', ARRAY['energy', 'consulting', 'efficiency', 'sustainability'], 'Energy Consulting Template', 'Professional template for energy consultants'),

('Battery Storage', 'Tech template for energy storage', 'Energy', 'services', 'modern', true, false, true, '/templates/battery-storage-thumb.jpg', ARRAY['/templates/battery-storage-1.jpg'], 'https://demo.digitpenhub.com/battery-storage', ARRAY['battery', 'storage', 'energy', 'technology'], 'Battery Storage Template', 'Modern template for energy storage companies');

-- Environmental Services Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Waste Management', 'Efficient template for waste management', 'Environmental', 'services', 'modern', true, false, false, '/templates/waste-management-thumb.jpg', ARRAY['/templates/waste-management-1.jpg'], 'https://demo.digitpenhub.com/waste-management', ARRAY['waste', 'management', 'recycling', 'environmental'], 'Waste Management Template', 'Professional template for waste management'),

('Recycling Center', 'Green template for recycling centers', 'Environmental', 'services', 'minimal', true, false, false, '/templates/recycling-thumb.jpg', ARRAY['/templates/recycling-1.jpg'], 'https://demo.digitpenhub.com/recycling', ARRAY['recycling', 'waste', 'sustainability', 'green'], 'Recycling Center Template', 'Eco-friendly template for recycling centers'),

('Environmental Consulting', 'Expert template for environmental consultants', 'Environmental', 'professional-services', 'modern', true, false, false, '/templates/environmental-consulting-thumb.jpg', ARRAY['/templates/environmental-consulting-1.jpg'], 'https://demo.digitpenhub.com/environmental-consulting', ARRAY['environmental', 'consulting', 'sustainability', 'compliance'], 'Environmental Consulting Template', 'Professional template for environmental consultants'),

('Water Treatment', 'Clean template for water treatment', 'Environmental', 'services', 'modern', true, false, false, '/templates/water-treatment-thumb.jpg', ARRAY['/templates/water-treatment-1.jpg'], 'https://demo.digitpenhub.com/water-treatment', ARRAY['water', 'treatment', 'purification', 'environmental'], 'Water Treatment Template', 'Professional template for water treatment'),

('Air Quality Testing', 'Scientific template for air quality services', 'Environmental', 'services', 'minimal', true, false, false, '/templates/air-quality-thumb.jpg', ARRAY['/templates/air-quality-1.jpg'], 'https://demo.digitpenhub.com/air-quality', ARRAY['air-quality', 'testing', 'environmental', 'monitoring'], 'Air Quality Testing Template', 'Professional template for air quality services');

-- Logistics & Transportation Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Logistics Company', 'Efficient template for logistics companies', 'Logistics', 'services', 'modern', true, true, false, '/templates/logistics-thumb.jpg', ARRAY['/templates/logistics-1.jpg'], 'https://demo.digitpenhub.com/logistics', ARRAY['logistics', 'shipping', 'freight', 'transportation'], 'Logistics Company Template', 'Professional template for logistics companies'),

('Freight Forwarding', 'Global template for freight forwarders', 'Logistics', 'services', 'modern', true, false, false, '/templates/freight-forwarding-thumb.jpg', ARRAY['/templates/freight-forwarding-1.jpg'], 'https://demo.digitpenhub.com/freight-forwarding', ARRAY['freight', 'forwarding', 'shipping', 'international'], 'Freight Forwarding Template', 'Professional template for freight forwarders'),

('Trucking Company', 'Road-focused template for trucking', 'Logistics', 'services', 'modern', true, false, false, '/templates/trucking-thumb.jpg', ARRAY['/templates/trucking-1.jpg'], 'https://demo.digitpenhub.com/trucking', ARRAY['trucking', 'transportation', 'freight', 'delivery'], 'Trucking Company Template', 'Professional template for trucking companies'),

('Courier Service', 'Fast template for courier services', 'Logistics', 'services', 'bold', true, false, false, '/templates/courier-thumb.jpg', ARRAY['/templates/courier-1.jpg'], 'https://demo.digitpenhub.com/courier', ARRAY['courier', 'delivery', 'express', 'shipping'], 'Courier Service Template', 'Dynamic template for courier services'),

('Warehouse Services', 'Storage template for warehousing', 'Logistics', 'services', 'modern', true, false, false, '/templates/warehouse-thumb.jpg', ARRAY['/templates/warehouse-1.jpg'], 'https://demo.digitpenhub.com/warehouse', ARRAY['warehouse', 'storage', 'logistics', 'fulfillment'], 'Warehouse Services Template', 'Professional template for warehouse services');

-- Security Services Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Security Company', 'Protective template for security companies', 'Security', 'services', 'modern', true, true, false, '/templates/security-company-thumb.jpg', ARRAY['/templates/security-company-1.jpg'], 'https://demo.digitpenhub.com/security-company', ARRAY['security', 'protection', 'guard', 'safety'], 'Security Company Template', 'Professional template for security companies'),

('Alarm Systems', 'Tech template for alarm companies', 'Security', 'services', 'modern', true, false, false, '/templates/alarm-systems-thumb.jpg', ARRAY['/templates/alarm-systems-1.jpg'], 'https://demo.digitpenhub.com/alarm-systems', ARRAY['alarm', 'security', 'monitoring', 'systems'], 'Alarm Systems Template', 'Professional template for alarm companies'),

('Private Investigation', 'Discreet template for private investigators', 'Security', 'services', 'classic', true, false, false, '/templates/private-investigation-thumb.jpg', ARRAY['/templates/private-investigation-1.jpg'], 'https://demo.digitpenhub.com/private-investigation', ARRAY['investigation', 'detective', 'private', 'security'], 'Private Investigation Template', 'Professional template for private investigators'),

('Locksmith', 'Reliable template for locksmiths', 'Security', 'services', 'modern', true, false, false, '/templates/locksmith-thumb.jpg', ARRAY['/templates/locksmith-1.jpg'], 'https://demo.digitpenhub.com/locksmith', ARRAY['locksmith', 'locks', 'keys', 'security'], 'Locksmith Template', 'Professional template for locksmiths'),

('Surveillance Systems', 'High-tech template for surveillance', 'Security', 'services', 'modern', true, false, false, '/templates/surveillance-thumb.jpg', ARRAY['/templates/surveillance-1.jpg'], 'https://demo.digitpenhub.com/surveillance', ARRAY['surveillance', 'cctv', 'security', 'monitoring'], 'Surveillance Systems Template', 'Professional template for surveillance systems');

-- Printing & Publishing Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Print Shop', 'Creative template for print shops', 'Printing', 'services', 'modern', true, false, false, '/templates/print-shop-thumb.jpg', ARRAY['/templates/print-shop-1.jpg'], 'https://demo.digitpenhub.com/print-shop', ARRAY['printing', 'print-shop', 'design', 'commercial'], 'Print Shop Template', 'Professional template for print shops'),

('Publishing House', 'Literary template for publishers', 'Printing', 'services', 'classic', true, true, false, '/templates/publishing-house-thumb.jpg', ARRAY['/templates/publishing-house-1.jpg'], 'https://demo.digitpenhub.com/publishing-house', ARRAY['publishing', 'books', 'literature', 'press'], 'Publishing House Template', 'Elegant template for publishing houses'),

('Magazine', 'Editorial template for magazines', 'Printing', 'content', 'modern', true, false, false, '/templates/magazine-thumb.jpg', ARRAY['/templates/magazine-1.jpg'], 'https://demo.digitpenhub.com/magazine', ARRAY['magazine', 'editorial', 'publication', 'media'], 'Magazine Template', 'Modern template for magazines'),

('Newspaper', 'News template for newspapers', 'Printing', 'content', 'classic', true, false, false, '/templates/newspaper-thumb.jpg', ARRAY['/templates/newspaper-1.jpg'], 'https://demo.digitpenhub.com/newspaper', ARRAY['newspaper', 'news', 'journalism', 'media'], 'Newspaper Template', 'Professional template for newspapers'),

('Custom Printing', 'Specialized template for custom printing', 'Printing', 'services', 'bold', true, false, false, '/templates/custom-printing-thumb.jpg', ARRAY['/templates/custom-printing-1.jpg'], 'https://demo.digitpenhub.com/custom-printing', ARRAY['custom', 'printing', 'merchandise', 'promotional'], 'Custom Printing Template', 'Creative template for custom printing');

-- Laboratory & Testing Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Medical Laboratory', 'Clinical template for medical labs', 'Laboratory', 'medical', 'modern', true, false, false, '/templates/medical-lab-thumb.jpg', ARRAY['/templates/medical-lab-1.jpg'], 'https://demo.digitpenhub.com/medical-lab', ARRAY['laboratory', 'medical', 'testing', 'diagnostics'], 'Medical Laboratory Template', 'Professional template for medical laboratories'),

('Testing Laboratory', 'Scientific template for testing labs', 'Laboratory', 'services', 'modern', true, false, false, '/templates/testing-lab-thumb.jpg', ARRAY['/templates/testing-lab-1.jpg'], 'https://demo.digitpenhub.com/testing-lab', ARRAY['testing', 'laboratory', 'analysis', 'quality'], 'Testing Laboratory Template', 'Professional template for testing laboratories'),

('Research Lab', 'Academic template for research labs', 'Laboratory', 'services', 'minimal', true, false, false, '/templates/research-lab-thumb.jpg', ARRAY['/templates/research-lab-1.jpg'], 'https://demo.digitpenhub.com/research-lab', ARRAY['research', 'laboratory', 'science', 'academic'], 'Research Lab Template', 'Professional template for research laboratories'),

('DNA Testing', 'Genetic template for DNA testing', 'Laboratory', 'medical', 'modern', true, false, false, '/templates/dna-testing-thumb.jpg', ARRAY['/templates/dna-testing-1.jpg'], 'https://demo.digitpenhub.com/dna-testing', ARRAY['dna', 'testing', 'genetic', 'laboratory'], 'DNA Testing Template', 'Modern template for DNA testing services'),

('Drug Testing', 'Compliance template for drug testing', 'Laboratory', 'services', 'modern', true, false, false, '/templates/drug-testing-thumb.jpg', ARRAY['/templates/drug-testing-1.jpg'], 'https://demo.digitpenhub.com/drug-testing', ARRAY['drug', 'testing', 'screening', 'laboratory'], 'Drug Testing Template', 'Professional template for drug testing services');

-- Telecommunications Templates (5 templates)
INSERT INTO builder_templates (name, description, industry, category, style_variant, is_global, is_featured, is_premium, thumbnail_url, preview_images, demo_url, tags,  seo_title, seo_description) VALUES
('Telecom Provider', 'Connected template for telecom providers', 'Telecommunications', 'services', 'modern', true, true, false, '/templates/telecom-thumb.jpg', ARRAY['/templates/telecom-1.jpg'], 'https://demo.digitpenhub.com/telecom', ARRAY['telecom', 'telecommunications', 'mobile', 'internet'], 'Telecom Provider Template', 'Modern template for telecom providers'),

('Internet Service Provider', 'Fast template for ISPs', 'Telecommunications', 'services', 'modern', true, false, false, '/templates/isp-thumb.jpg', ARRAY['/templates/isp-1.jpg'], 'https://demo.digitpenhub.com/isp', ARRAY['isp', 'internet', 'broadband', 'provider'], 'Internet Service Provider Template', 'Professional template for ISPs'),

('VoIP Service', 'Communication template for VoIP', 'Telecommunications', 'services', 'modern', true, false, false, '/templates/voip-thumb.jpg', ARRAY['/templates/voip-1.jpg'], 'https://demo.digitpenhub.com/voip', ARRAY['voip', 'phone', 'communication', 'business'], 'VoIP Service Template', 'Modern template for VoIP services'),

('Mobile Network', 'Wireless template for mobile networks', 'Telecommunications', 'services', 'modern', true, false, false, '/templates/mobile-network-thumb.jpg', ARRAY['/templates/mobile-network-1.jpg'], 'https://demo.digitpenhub.com/mobile-network', ARRAY['mobile', 'network', 'wireless', 'cellular'], 'Mobile Network Template', 'Professional template for mobile networks'),

('Satellite Communications', 'Global template for satellite services', 'Telecommunications', 'services', 'modern', true, false, true, '/templates/satellite-comm-thumb.jpg', ARRAY['/templates/satellite-comm-1.jpg'], 'https://demo.digitpenhub.com/satellite-comm', ARRAY['satellite', 'communications', 'global', 'technology'], 'Satellite Communications Template', 'Advanced template for satellite communications');

COMMIT;
