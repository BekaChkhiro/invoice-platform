-- Create companies table first
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  tax_id VARCHAR(100),
  logo_url TEXT,
  website VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_companies junction table
CREATE TABLE IF NOT EXISTS user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view companies they belong to" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update companies they belong to" ON companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM user_companies 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can insert companies" ON companies
  FOR INSERT WITH CHECK (true);

-- RLS Policies for user_companies
CREATE POLICY "Users can view their own company associations" ON user_companies
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own company associations" ON user_companies
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create trigger for updating companies updated_at
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

-- Add helpful comments
COMMENT ON TABLE companies IS 'Companies/organizations that users belong to';
COMMENT ON TABLE user_companies IS 'Junction table linking users to companies with roles';
COMMENT ON COLUMN user_companies.role IS 'User role in company: owner, admin, member, viewer';

-- Insert a default company for existing users (optional)
-- This helps with the migration process
INSERT INTO companies (name, email) 
SELECT 'Default Company', 'contact@company.com'
WHERE NOT EXISTS (SELECT 1 FROM companies LIMIT 1);

-- Link existing users to the default company (if any exist)
INSERT INTO user_companies (user_id, company_id, role)
SELECT 
  au.id as user_id,
  (SELECT id FROM companies LIMIT 1) as company_id,
  'owner' as role
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM user_companies)
AND EXISTS (SELECT 1 FROM companies LIMIT 1);