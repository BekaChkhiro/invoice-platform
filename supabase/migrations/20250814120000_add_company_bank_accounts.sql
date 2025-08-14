-- Create bank accounts table for companies
CREATE TABLE IF NOT EXISTS company_bank_accounts (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_company_bank_accounts_company_id ON company_bank_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_bank_accounts_default ON company_bank_accounts(company_id, is_default) WHERE is_default = TRUE;

-- Enable RLS
ALTER TABLE company_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company bank accounts" ON company_bank_accounts
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert bank accounts for their company" ON company_bank_accounts
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company bank accounts" ON company_bank_accounts
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company bank accounts" ON company_bank_accounts
  FOR DELETE USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()
    )
  );

-- Create trigger to ensure only one default account per company
CREATE OR REPLACE FUNCTION ensure_single_default_bank_account()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this account as default, unset others
  IF NEW.is_default = TRUE THEN
    UPDATE company_bank_accounts 
    SET is_default = FALSE 
    WHERE company_id = NEW.company_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_bank_account
  BEFORE INSERT OR UPDATE ON company_bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_bank_account();

-- Add bank_account_id to invoices table to reference which bank account to use
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES company_bank_accounts(id);