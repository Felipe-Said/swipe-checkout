CREATE TABLE IF NOT EXISTS catalog_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES managed_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  variant_label TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  image_src TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS catalog_products_account_idx
ON catalog_products (account_id);

CREATE UNIQUE INDEX IF NOT EXISTS catalog_products_account_slug_idx
ON catalog_products (account_id, slug);

ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own catalog products"
ON catalog_products;

CREATE POLICY "Users can manage their own catalog products"
ON catalog_products
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = catalog_products.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = catalog_products.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all catalog products"
ON catalog_products;

CREATE POLICY "Admins can manage all catalog products"
ON catalog_products
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);
