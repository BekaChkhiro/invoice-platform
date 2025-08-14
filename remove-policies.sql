-- წაშალეთ ეს policies Supabase Dashboard-ში SQL Editor-ით ან CLI-ით

-- Remove problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Public can view company for public invoices" ON "public"."companies";
DROP POLICY IF EXISTS "Public can view client for public invoices" ON "public"."clients";