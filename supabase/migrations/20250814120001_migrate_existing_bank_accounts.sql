-- Migrate existing bank account data from companies table to company_bank_accounts table
INSERT INTO company_bank_accounts (company_id, bank_name, account_number, is_default, is_active)
SELECT 
  id as company_id,
  COALESCE(bank_name, 'Default Bank') as bank_name,
  COALESCE(bank_account, '') as account_number,
  true as is_default,
  true as is_active
FROM companies 
WHERE bank_name IS NOT NULL OR bank_account IS NOT NULL
ON CONFLICT DO NOTHING;