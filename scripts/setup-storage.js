// Run this script to set up the avatars storage bucket
// Usage: node scripts/setup-storage.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // You'll need to add this to .env.local

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorage() {
  console.log('Setting up avatars storage bucket...')
  
  try {
    // Create bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 2097152, // 2MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    })
    
    if (bucketError && !bucketError.message.includes('already exists')) {
      throw bucketError
    }
    
    console.log('✅ Bucket created or already exists')
    
    // Note: RLS policies need to be set up via SQL in the Supabase Dashboard
    console.log('⚠️  Please run the following SQL in your Supabase Dashboard SQL Editor:')
    console.log(`
-- RLS policies for avatars bucket
CREATE POLICY "Users can view all avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
    `)
    
  } catch (error) {
    console.error('Error setting up storage:', error)
    process.exit(1)
  }
}

setupStorage()