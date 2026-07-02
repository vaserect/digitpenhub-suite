-- Pass 4: published-site SEO essentials (Step 1f)
ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS canonical_url TEXT;
