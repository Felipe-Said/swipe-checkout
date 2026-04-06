CREATE TABLE IF NOT EXISTS safe_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL UNIQUE REFERENCES managed_accounts(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT '',
  domain_host TEXT UNIQUE,
  demo_client_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS safe_pages_account_idx
ON safe_pages (account_id);

CREATE INDEX IF NOT EXISTS safe_pages_domain_host_idx
ON safe_pages (domain_host);

ALTER TABLE safe_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own safe pages"
ON safe_pages;

CREATE POLICY "Users can manage their own safe pages"
ON safe_pages
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = safe_pages.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = safe_pages.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all safe pages"
ON safe_pages;

CREATE POLICY "Admins can manage all safe pages"
ON safe_pages
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
