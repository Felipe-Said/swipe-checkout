ALTER TABLE managed_accounts
ADD COLUMN IF NOT EXISTS withdrawals_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS messenger_enabled BOOLEAN DEFAULT TRUE;

UPDATE managed_accounts
SET withdrawals_enabled = TRUE
WHERE withdrawals_enabled IS NULL;

UPDATE managed_accounts
SET messenger_enabled = TRUE
WHERE messenger_enabled IS NULL;
