-- Add missing fields to client_subscriptions table

-- Add flitt_subscription_id field (different from flitt_order_id)
ALTER TABLE client_subscriptions
ADD COLUMN IF NOT EXISTS flitt_subscription_id TEXT UNIQUE;

-- Add flitt_payment_url for Flitt checkout URL
ALTER TABLE client_subscriptions
ADD COLUMN IF NOT EXISTS flitt_payment_url TEXT;

-- Add cancelled_at timestamp
ALTER TABLE client_subscriptions
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- Add index on flitt_subscription_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_flitt_subscription_id
ON client_subscriptions(flitt_subscription_id);

-- Add index on next_billing_date for automation queries
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_next_billing_date
ON client_subscriptions(next_billing_date)
WHERE status = 'active';

-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_status
ON client_subscriptions(status);

COMMENT ON COLUMN client_subscriptions.flitt_subscription_id IS 'Flitt recurring subscription ID';
COMMENT ON COLUMN client_subscriptions.flitt_payment_url IS 'Flitt payment/checkout URL for client';
COMMENT ON COLUMN client_subscriptions.cancelled_at IS 'Timestamp when subscription was cancelled';
