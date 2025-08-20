-- Remove notes and payment_instructions columns from invoices table
ALTER TABLE invoices 
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS payment_instructions;