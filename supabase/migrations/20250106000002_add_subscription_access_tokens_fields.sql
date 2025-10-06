-- Add missing fields to subscription_access_tokens table
ALTER TABLE subscription_access_tokens
ADD COLUMN IF NOT EXISTS verification_code TEXT,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS session_token TEXT,
ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Rename verification_token to be consistent (if it exists)
-- The verification_token column appears to be the old name for verification_code
-- We'll keep both for backward compatibility and add an index

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_access_tokens_verification_code
ON subscription_access_tokens(verification_code);

CREATE INDEX IF NOT EXISTS idx_subscription_access_tokens_session_token
ON subscription_access_tokens(session_token);

CREATE INDEX IF NOT EXISTS idx_subscription_access_tokens_email
ON subscription_access_tokens(email);
