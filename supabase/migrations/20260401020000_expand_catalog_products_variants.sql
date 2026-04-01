ALTER TABLE catalog_products
ADD COLUMN IF NOT EXISTS option_name TEXT NOT NULL DEFAULT 'Variante',
ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE catalog_products
SET variants = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'name', COALESCE(NULLIF(variant_label, ''), 'Padrao'),
    'price', price,
    'imageSrc', image_src
  )
)
WHERE variants = '[]'::jsonb;
