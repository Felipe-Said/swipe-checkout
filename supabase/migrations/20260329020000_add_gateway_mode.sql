CREATE TABLE IF NOT EXISTS platform_gateway_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  whop_api_key TEXT,
  whop_company_id TEXT,
  fee_rate NUMERIC NOT NULL DEFAULT 0,
  platform_covers_fees BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_gateway_settings (id, enabled, fee_rate, platform_covers_fees)
VALUES ('default', FALSE, 0, FALSE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE platform_gateway_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage platform gateway settings"
ON platform_gateway_settings
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

ALTER TABLE managed_accounts
ADD COLUMN IF NOT EXISTS gateway_payout_method_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_payout_method_label TEXT,
ADD COLUMN IF NOT EXISTS gateway_auto_payout_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS payout_provider TEXT,
ADD COLUMN IF NOT EXISTS gateway_mode BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gateway_gross_amount NUMERIC,
ADD COLUMN IF NOT EXISTS gateway_fee_amount NUMERIC,
ADD COLUMN IF NOT EXISTS gateway_net_amount NUMERIC,
ADD COLUMN IF NOT EXISTS whop_withdrawal_id TEXT,
ADD COLUMN IF NOT EXISTS whop_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS whop_payout_method_id TEXT;
