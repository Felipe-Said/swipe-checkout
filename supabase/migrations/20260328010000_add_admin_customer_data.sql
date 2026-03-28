ALTER TABLE managed_accounts
ADD COLUMN IF NOT EXISTS key_frozen BOOLEAN DEFAULT FALSE;

ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES managed_accounts(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  holder_name TEXT,
  document TEXT,
  bank_name TEXT,
  agency TEXT,
  account_number TEXT,
  pix_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (account_id, currency)
);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES managed_accounts(id) ON DELETE CASCADE,
  from_role TEXT NOT NULL CHECK (from_role IN ('admin', 'user')),
  text TEXT DEFAULT '',
  image_src TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bank accounts"
ON bank_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = bank_accounts.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can upsert their own bank accounts"
ON bank_accounts
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = bank_accounts.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = bank_accounts.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all bank accounts"
ON bank_accounts
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view their own support messages"
ON support_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = support_messages.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own support messages"
ON support_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM managed_accounts
    WHERE managed_accounts.id = support_messages.account_id
      AND managed_accounts.profile_id = auth.uid()
  )
  AND from_role = 'user'
);

CREATE POLICY "Admins can manage all support messages"
ON support_messages
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);
