-- Create status enums
CREATE TYPE account_status AS ENUM ('pending_approval', 'approved', 'rejected', 'blocked');
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Profiles table: extension of auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'user',
  status account_status DEFAULT 'pending_approval',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Managed Accounts (formerly in account-metrics.ts)
CREATE TABLE managed_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fee_rate NUMERIC DEFAULT 10,
  billing_cycle_days INTEGER DEFAULT 2,
  payment_mode TEXT DEFAULT 'manual',
  settlement_started_at TIMESTAMPTZ,
  
  -- Whop Integration
  whop_key TEXT,
  whop_integration_status TEXT DEFAULT 'Pendente',
  whop_last_validation TEXT,
  whop_permissions_valid BOOLEAN DEFAULT FALSE,
  whop_checkout_ready BOOLEAN DEFAULT FALSE,
  whop_webhook_active BOOLEAN DEFAULT FALSE,
  whop_company_id TEXT,
  whop_environment TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checkouts
CREATE TABLE checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES managed_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Ativo',
  type TEXT DEFAULT 'Custom',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Domains
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES managed_accounts(id) ON DELETE CASCADE,
  host TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'Aguardando DNS',
  ssl_status TEXT DEFAULT 'Provisionando',
  is_primary BOOLEAN DEFAULT FALSE,
  checkout_id UUID REFERENCES checkouts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  account_id UUID REFERENCES managed_accounts(id) ON DELETE CASCADE,
  customer_name TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT DEFAULT 'Pago',
  date TIMESTAMPTZ DEFAULT NOW()
);

-- Withdrawals
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES managed_accounts(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'Pendente',
  pix_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE managed_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- User visibility
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Managed accounts: only if approved
CREATE POLICY "Users can view their own accounts" ON managed_accounts FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can insert their own accounts" ON managed_accounts FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Admin visibility: admins can see everything
CREATE POLICY "Admins can view all profiles" ON profiles FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can view all accounts" ON managed_accounts FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, status)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email, 'user', 'pending_approval');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
