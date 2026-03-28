CREATE TABLE IF NOT EXISTS checkout_pushcut_configs (
  checkout_id UUID PRIMARY KEY REFERENCES checkouts(id) ON DELETE CASCADE,
  webhook_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checkout_pixel_configs (
  checkout_id UUID PRIMARY KEY REFERENCES checkouts(id) ON DELETE CASCADE,
  meta_pixel_id TEXT DEFAULT '',
  google_ads_id TEXT DEFAULT '',
  tiktok_pixel_id TEXT DEFAULT '',
  track_campaign_source BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE checkout_pushcut_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_pixel_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checkout pushcut configs"
ON checkout_pushcut_configs
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM checkouts
    JOIN managed_accounts ON managed_accounts.id = checkouts.account_id
    WHERE checkouts.id = checkout_pushcut_configs.checkout_id
      AND managed_accounts.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own checkout pushcut configs"
ON checkout_pushcut_configs
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM checkouts
    JOIN managed_accounts ON managed_accounts.id = checkouts.account_id
    WHERE checkouts.id = checkout_pushcut_configs.checkout_id
      AND managed_accounts.profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM checkouts
    JOIN managed_accounts ON managed_accounts.id = checkouts.account_id
    WHERE checkouts.id = checkout_pushcut_configs.checkout_id
      AND managed_accounts.profile_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all checkout pushcut configs"
ON checkout_pushcut_configs
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view their own checkout pixel configs"
ON checkout_pixel_configs
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM checkouts
    JOIN managed_accounts ON managed_accounts.id = checkouts.account_id
    WHERE checkouts.id = checkout_pixel_configs.checkout_id
      AND managed_accounts.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own checkout pixel configs"
ON checkout_pixel_configs
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM checkouts
    JOIN managed_accounts ON managed_accounts.id = checkouts.account_id
    WHERE checkouts.id = checkout_pixel_configs.checkout_id
      AND managed_accounts.profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM checkouts
    JOIN managed_accounts ON managed_accounts.id = checkouts.account_id
    WHERE checkouts.id = checkout_pixel_configs.checkout_id
      AND managed_accounts.profile_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all checkout pixel configs"
ON checkout_pixel_configs
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);
