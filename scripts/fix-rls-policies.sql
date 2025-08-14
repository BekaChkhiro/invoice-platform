-- Fix RLS policies for public invoices by removing problematic ones and creating better ones

-- Remove the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Public can view company for public invoices" ON "public"."companies";
DROP POLICY IF EXISTS "Public can view client for public invoices" ON "public"."clients";

-- Create better policies that don't cause recursion
-- For companies: Allow public access only when company_id is in a public invoice
CREATE POLICY "Allow public access to companies for public invoices" ON "public"."companies"
  AS PERMISSIVE FOR SELECT
  TO public
  USING (
    id IN (
      SELECT DISTINCT company_id 
      FROM invoices 
      WHERE public_enabled = true 
      AND public_token IS NOT NULL
    )
  );

-- For clients: Allow public access only when client_id is in a public invoice  
CREATE POLICY "Allow public access to clients for public invoices" ON "public"."clients"
  AS PERMISSIVE FOR SELECT
  TO public
  USING (
    id IN (
      SELECT DISTINCT client_id 
      FROM invoices 
      WHERE public_enabled = true 
      AND public_token IS NOT NULL
    )
  );