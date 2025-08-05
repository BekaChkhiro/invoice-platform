// Test if avatars bucket exists and works
// Run with: node scripts/test-storage.js

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = 'https://kexehgriwlfvjdbccrag.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtleGVoZ3Jpd2xmdmpkYmNjcmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTUyNTgsImV4cCI6MjA2OTg3MTI1OH0.mzCPXUPErfh5ztVHIqWAWEUqKS9Lmjl85hNXptSfOiw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testStorage() {
  console.log('🔍 Testing Supabase Storage...')
  
  try {
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
      return
    }
    
    console.log('📦 Available buckets:', buckets.map(b => b.name))
    
    // Check if avatars bucket exists
    const avatarsBucket = buckets.find(b => b.name === 'avatars')
    
    if (!avatarsBucket) {
      console.error('❌ avatars bucket not found!')
      console.log('Please run the SQL script in scripts/create-avatars-bucket.sql')
      return
    }
    
    console.log('✅ avatars bucket found:', avatarsBucket)
    
    // Test file upload (requires authentication)
    console.log('⚠️  To test file upload, you need to be logged in via the app')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testStorage()