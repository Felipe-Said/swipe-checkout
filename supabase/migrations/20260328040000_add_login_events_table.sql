CREATE TABLE IF NOT EXISTS login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES managed_accounts(id) ON DELETE SET NULL,
  device TEXT NOT NULL,
  location TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE login_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own login events"
ON login_events
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own login events"
ON login_events
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all login events"
ON login_events
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);
