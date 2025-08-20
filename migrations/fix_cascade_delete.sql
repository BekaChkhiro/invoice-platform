-- Fix cascade delete for clients and invoices
-- This migration updates foreign key constraints to CASCADE on delete

-- 1. Fix invoice items -> invoices relationship
ALTER TABLE invoice_items
DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey;

ALTER TABLE invoice_items
ADD CONSTRAINT invoice_items_invoice_id_fkey 
FOREIGN KEY (invoice_id) 
REFERENCES invoices(id) 
ON DELETE CASCADE;

-- 2. Fix invoices -> clients relationship  
ALTER TABLE invoices
DROP CONSTRAINT IF EXISTS invoices_client_id_fkey;

ALTER TABLE invoices
ADD CONSTRAINT invoices_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES clients(id) 
ON DELETE CASCADE;

-- This will allow:
-- - Deleting a client will automatically delete all their invoices and invoice items
-- - Deleting an invoice will automatically delete all its invoice items