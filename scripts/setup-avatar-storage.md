# Avatar Upload Fix - URGENT SETUP REQUIRED

## Error: "Bucket not found"
The avatars storage bucket doesn't exist yet. Follow these steps **immediately** to fix the upload:

## QUICK FIX - Option 1 (Recommended): Using Supabase Dashboard

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: kexehgriwlfvjdbccrag
3. **Navigate to Storage** in the left sidebar
4. **Click "Create Bucket"**
5. **Configure the bucket**:
   - Bucket name: `avatars`
   - Public bucket: ✅ **ENABLED**
   - File size limit: `2 MB`
   - Allowed MIME types: `image/jpeg,image/jpg,image/png,image/gif,image/webp`

6. **Set up RLS Policies** - Go to SQL Editor and run:
```sql
-- RLS policies for avatars bucket
CREATE POLICY "Users can view all avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Option 2: Using Migration File
If using Supabase CLI locally:
```bash
supabase migration up
```

Or run the SQL from `supabase/migrations/20250105_setup_avatars_storage.sql` in SQL Editor

### 2. Verify bucket creation
Check in Supabase Dashboard → Storage that:
- `avatars` bucket exists
- Bucket is public
- File size limit is 2MB
- Allowed MIME types include image formats

### 3. Test the functionality
1. Start the development server: `npm run dev`
2. Navigate to Settings → Profile
3. Try uploading an avatar image
4. Check browser console and network tab for any errors

## Key improvements made:

- **Better validation**: More specific file type checking
- **Atomic operations**: Upload first, then update profile, then cleanup
- **Error recovery**: Clean up uploaded files if profile update fails
- **Better error messages**: More descriptive Georgian error messages
- **Input reset**: Prevent issues with re-uploading same file
- **URL parsing**: Proper extraction of file paths for deletion

## Files modified:
- `src/app/(dashboard)/dashboard/settings/profile/page.tsx` - Avatar upload logic
- `supabase/migrations/20250105_setup_avatars_storage.sql` - Storage setup

The avatar upload should now work properly with proper error handling and storage configuration.