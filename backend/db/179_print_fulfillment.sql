-- Migration 179: Print Fulfillment for Business Cards/Signage
-- Module 38 of Marketing Category
-- Benchmark: Vistaprint / Moo (print-on-demand)

-- Drop tables if they exist
DROP TABLE IF EXISTS print_analytics_daily CASCADE;
DROP TABLE IF EXISTS print_orders CASCADE;
DROP TABLE IF EXISTS print_products CASCADE;

-- Print Catalog Products
CREATE TABLE print_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('business_cards', 'signage', 'brochures', 'banners', 'marketing_materials')),
    base_price NUMERIC(10,2) NOT NULL,
    spec_options JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Print Fulfillment Orders
CREATE TABLE print_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES print_products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    specs JSONB NOT NULL,
    artwork_url TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    shipping_method VARCHAR(50) DEFAULT 'standard' CHECK (shipping_method IN ('standard', 'express', 'overnight')),
    shipping_cost NUMERIC(10,2) DEFAULT 0.00,
    total_price NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ordered' CHECK (status IN ('ordered', 'proofing', 'printing', 'shipped', 'delivered', 'cancelled')),
    status_details TEXT,
    tracking_number VARCHAR(100),
    tracking_carrier VARCHAR(50) DEFAULT 'FedEx',
    provider_order_id VARCHAR(100),
    estimated_delivery_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_print_orders_org_id ON print_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_print_orders_product_id ON print_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_print_orders_status ON print_orders(status);

-- Print Analytics Aggregation
CREATE TABLE print_analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    orders INTEGER DEFAULT 0,
    revenue NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, date)
);

CREATE INDEX IF NOT EXISTS idx_print_analytics_daily_org_id ON print_analytics_daily(org_id);
CREATE INDEX IF NOT EXISTS idx_print_analytics_daily_date ON print_analytics_daily(date);

-- Pre-seed Print Catalog Products
INSERT INTO print_products (name, description, category, base_price, spec_options) VALUES
(
  'Standard Business Cards',
  'Classic business cards printed on high-quality cardstock. Ideal for networking events.',
  'business_cards',
  19.99,
  '{
    "sizes": ["3.5x2.0"],
    "paper_stocks": ["14pt Matte", "14pt Glossy", "16pt Premium Matte", "16pt Premium Glossy"],
    "finishes": ["None", "Matte Coated", "UV Glossy Coated"],
    "quantities": [100, 250, 500, 1000]
  }'
),
(
  'Premium Rounded Corner Business Cards',
  'Distinctive business cards with smooth rounded corners to stand out from the crowd.',
  'business_cards',
  29.99,
  '{
    "sizes": ["3.5x2.0"],
    "paper_stocks": ["16pt Premium Matte", "16pt Premium Glossy", "18pt Ultra Thick"],
    "finishes": ["Matte", "Spot UV", "Gold Foil Edge"],
    "quantities": [100, 250, 500]
  }'
),
(
  'Outdoor Vinyl Banner',
  'Durable, weather-resistant vinyl banners. Perfect for storefront openings and outdoor signs.',
  'banners',
  49.99,
  '{
    "sizes": ["2x6 ft", "3x8 ft", "4x10 ft"],
    "paper_stocks": ["13oz Vinyl Banner", "15oz Premium Vinyl"],
    "finishes": ["Grommets every 2ft", "Wind slits", "Reinforced Hems"],
    "quantities": [1, 2, 5, 10]
  }'
),
(
  'Retractable Pull-Up Banner',
  'Compact, lightweight aluminum stand with retractable banner graphic. Ideal for trade shows.',
  'banners',
  89.99,
  '{
    "sizes": ["33x81 inches"],
    "paper_stocks": ["10pt Premium Blockout Film"],
    "finishes": ["Standard Stand", "Premium Stand"],
    "quantities": [1, 2, 5]
  }'
),
(
  'Tri-Fold Marketing Brochures',
  'High-impact brochures with a professional tri-fold layout. Great for products info.',
  'brochures',
  59.99,
  '{
    "sizes": ["8.5x11 folding to 3.6x8.5"],
    "paper_stocks": ["100lb Gloss Paper", "80lb Recycle Matte"],
    "finishes": ["Gloss AQ", "Matte Aqueous"],
    "quantities": [250, 500, 1000, 2500]
  }'
),
(
  'Retail Storefront Foam Signage',
  'Rigid, lightweight foam board signs designed for wall mounts and interior retail displays.',
  'signage',
  34.99,
  '{
    "sizes": ["18x24 inches", "24x36 inches"],
    "paper_stocks": ["3/16 inch Foam Board", "1/2 inch Gator Board"],
    "finishes": ["Direct Print Matte", "Direct Print Gloss"],
    "quantities": [1, 5, 10]
  }'
);

-- Update module route in registry
UPDATE modules SET route = '/modules/print-fulfillment' WHERE slug = 'print-fulfillment-for-business-cards-signage';
