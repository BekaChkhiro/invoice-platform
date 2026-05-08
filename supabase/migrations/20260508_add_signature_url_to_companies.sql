ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS signature_url TEXT;

COMMENT ON COLUMN companies.signature_url IS 'Public URL of the company signature image rendered on invoice PDFs';
