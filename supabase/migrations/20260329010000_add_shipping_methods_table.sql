CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES managed_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  eta TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shipping_methods_account_idx
ON shipping_methods (account_id);

ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shipping methods"
ON shipping_methods
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = shipping_methods.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own shipping methods"
ON shipping_methods
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = shipping_methods.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = shipping_methods.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all shipping methods"
ON shipping_methods
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);
