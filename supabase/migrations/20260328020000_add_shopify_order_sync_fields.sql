ALTER TABLE orders
ADD COLUMN IF NOT EXISTS checkout_id UUID REFERENCES checkouts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS shopify_store_id UUID REFERENCES shopify_stores(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS shopify_draft_order_id TEXT,
ADD COLUMN IF NOT EXISTS shopify_order_id TEXT,
ADD COLUMN IF NOT EXISTS shopify_order_name TEXT,
ADD COLUMN IF NOT EXISTS shopify_sync_status TEXT,
ADD COLUMN IF NOT EXISTS shopify_sync_error TEXT;
