ALTER TABLE checkout_pixel_configs
ADD COLUMN IF NOT EXISTS meta_pixel_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS google_ads_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tiktok_pixel_ids TEXT[] DEFAULT '{}';

UPDATE checkout_pixel_configs
SET meta_pixel_ids = ARRAY[meta_pixel_id]
WHERE coalesce(array_length(meta_pixel_ids, 1), 0) = 0
  AND coalesce(meta_pixel_id, '') <> '';

UPDATE checkout_pixel_configs
SET google_ads_ids = ARRAY[google_ads_id]
WHERE coalesce(array_length(google_ads_ids, 1), 0) = 0
  AND coalesce(google_ads_id, '') <> '';

UPDATE checkout_pixel_configs
SET tiktok_pixel_ids = ARRAY[tiktok_pixel_id]
WHERE coalesce(array_length(tiktok_pixel_ids, 1), 0) = 0
  AND coalesce(tiktok_pixel_id, '') <> '';

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS attribution_source TEXT,
ADD COLUMN IF NOT EXISTS attribution_medium TEXT,
ADD COLUMN IF NOT EXISTS attribution_campaign TEXT,
ADD COLUMN IF NOT EXISTS attribution_content TEXT,
ADD COLUMN IF NOT EXISTS attribution_term TEXT,
ADD COLUMN IF NOT EXISTS attribution_gclid TEXT,
ADD COLUMN IF NOT EXISTS attribution_fbclid TEXT,
ADD COLUMN IF NOT EXISTS attribution_ttclid TEXT,
ADD COLUMN IF NOT EXISTS attribution_referrer TEXT,
ADD COLUMN IF NOT EXISTS attribution_landing_url TEXT;
