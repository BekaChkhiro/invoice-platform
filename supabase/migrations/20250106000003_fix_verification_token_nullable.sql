-- Make verification_token nullable since we're using verification_code now
ALTER TABLE subscription_access_tokens
ALTER COLUMN verification_token DROP NOT NULL;

-- Add comments to clarify
COMMENT ON COLUMN subscription_access_tokens.verification_token IS 'Deprecated: use verification_code instead';
COMMENT ON COLUMN subscription_access_tokens.verification_code IS 'Email verification code sent to user';
