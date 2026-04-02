ALTER TABLE orders
ADD COLUMN IF NOT EXISTS whop_return_token TEXT;

CREATE INDEX IF NOT EXISTS orders_whop_return_token_idx
ON orders (whop_return_token);
