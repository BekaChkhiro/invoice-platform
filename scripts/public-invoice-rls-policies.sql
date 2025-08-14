-- RLS policies to allow public access to company and client data for public invoices
-- This script should be run to enable company and client information visibility for public invoice links

-- Add RLS policy for companies table to allow public access when invoice is public
CREATE POLICY "Public can view company for public invoices" ON "public"."companies"
  AS PERMISSIVE FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.company_id = companies.id 
      AND invoices.public_enabled = true
    )
  );

-- Add RLS policy for clients table to allow public access when invoice is public  
CREATE POLICY "Public can view client for public invoices" ON "public"."clients"
  AS PERMISSIVE FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.client_id = clients.id 
      AND invoices.public_enabled = true
    )
  );