CREATE TABLE IF NOT EXISTS checkout_behavior_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id UUID NOT NULL REFERENCES checkouts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES managed_accounts(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (checkout_id, session_id, event_type)
);

CREATE INDEX IF NOT EXISTS checkout_behavior_events_account_idx
ON checkout_behavior_events (account_id);

CREATE INDEX IF NOT EXISTS checkout_behavior_events_checkout_idx
ON checkout_behavior_events (checkout_id);

CREATE INDEX IF NOT EXISTS checkout_behavior_events_last_seen_idx
ON checkout_behavior_events (last_seen_at DESC);

ALTER TABLE checkout_behavior_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all checkout behavior events"
ON checkout_behavior_events
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);
