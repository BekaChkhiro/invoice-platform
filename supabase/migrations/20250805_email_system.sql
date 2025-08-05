-- Create email_history table for tracking email communications
CREATE TABLE IF NOT EXISTS email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'invoice', -- 'invoice', 'reminder', 'confirmation', 'notification'
  recipient VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked'
  message_id VARCHAR(255), -- External email service message ID
  error_message TEXT, -- Error details if failed
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_history_invoice_id ON email_history(invoice_id);
CREATE INDEX IF NOT EXISTS idx_email_history_user_id ON email_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_history_company_id ON email_history(company_id);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON email_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_history_status ON email_history(status);
CREATE INDEX IF NOT EXISTS idx_email_history_type ON email_history(type);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_email_history_invoice_type ON email_history(invoice_id, type);
CREATE INDEX IF NOT EXISTS idx_email_history_user_sent ON email_history(user_id, sent_at DESC);

-- Add RLS (Row Level Security)
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own email history
CREATE POLICY "Users can view their own email history" ON email_history
  FOR SELECT USING (
    user_id = auth.uid() OR
    company_id IN (
      SELECT company_id FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert their own email history
CREATE POLICY "Users can insert their own email history" ON email_history
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    company_id IN (
      SELECT company_id FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update their own email history (for delivery tracking)
CREATE POLICY "Users can update their own email history" ON email_history
  FOR UPDATE USING (
    user_id = auth.uid() OR
    company_id IN (
      SELECT company_id FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_history_updated_at
  BEFORE UPDATE ON email_history
  FOR EACH ROW
  EXECUTE FUNCTION update_email_history_updated_at();

-- Add helpful comments
COMMENT ON TABLE email_history IS 'Tracks all email communications sent through the system';
COMMENT ON COLUMN email_history.type IS 'Type of email: invoice, reminder, confirmation, notification';
COMMENT ON COLUMN email_history.status IS 'Email delivery status: pending, sent, delivered, failed, bounced, opened, clicked';
COMMENT ON COLUMN email_history.recipient IS 'Email recipient address (may include CC: or BCC: prefix)';
COMMENT ON COLUMN email_history.message_id IS 'External email service message identifier';
COMMENT ON COLUMN email_history.error_message IS 'Error details if email sending failed';

-- Note: companies and user_companies tables should be created first via 20250805_companies_and_users.sql

-- Create email analytics view for better performance
CREATE OR REPLACE VIEW email_analytics AS
SELECT
  e.user_id,
  e.company_id,
  e.type,
  COUNT(*) as total_emails,
  COUNT(CASE WHEN e.status = 'sent' THEN 1 END) as sent_emails,
  COUNT(CASE WHEN e.status = 'delivered' THEN 1 END) as delivered_emails,
  COUNT(CASE WHEN e.status = 'failed' THEN 1 END) as failed_emails,
  COUNT(CASE WHEN e.opened_at IS NOT NULL THEN 1 END) as opened_emails,
  COUNT(CASE WHEN e.clicked_at IS NOT NULL THEN 1 END) as clicked_emails,
  ROUND(
    COUNT(CASE WHEN e.status = 'delivered' THEN 1 END)::numeric / 
    NULLIF(COUNT(CASE WHEN e.status IN ('sent', 'delivered') THEN 1 END), 0) * 100, 
    2
  ) as delivery_rate,
  ROUND(
    COUNT(CASE WHEN e.opened_at IS NOT NULL THEN 1 END)::numeric / 
    NULLIF(COUNT(CASE WHEN e.status = 'delivered' THEN 1 END), 0) * 100, 
    2
  ) as open_rate,
  ROUND(
    COUNT(CASE WHEN e.clicked_at IS NOT NULL THEN 1 END)::numeric / 
    NULLIF(COUNT(CASE WHEN e.opened_at IS NOT NULL THEN 1 END), 0) * 100, 
    2
  ) as click_rate
FROM email_history e
GROUP BY e.user_id, e.company_id, e.type;