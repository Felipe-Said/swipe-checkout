CREATE TABLE IF NOT EXISTS shopify_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES managed_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shop_domain TEXT NOT NULL,
  storefront_token TEXT,
  checkout_type TEXT DEFAULT 'Shopify Hosted Checkout',
  status TEXT DEFAULT 'Em configuracao',
  product_count INTEGER DEFAULT 0,
  variant_count INTEGER DEFAULT 0,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shopify_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shopify stores"
ON shopify_stores
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = shopify_stores.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own shopify stores"
ON shopify_stores
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = shopify_stores.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own shopify stores"
ON shopify_stores
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = shopify_stores.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own shopify stores"
ON shopify_stores
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = shopify_stores.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all shopify stores"
ON shopify_stores
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);
