-- Create company-signatures storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-signatures',
  'company-signatures',
  true,
  2097152, -- 2MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Public read: signatures are embedded in shared/emailed invoice PDFs
CREATE POLICY "Anyone can view company signatures" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-signatures');

-- Writes scoped to the uploading user's folder ({user_id}/<file>),
-- matching the existing company-logos convention.
CREATE POLICY "Users can upload their own company signature" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company-signatures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own company signature" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'company-signatures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own company signature" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'company-signatures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
