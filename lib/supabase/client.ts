import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!url || !key) {
    console.error('Missing Supabase environment variables!')
    console.error('URL:', url)
    console.error('Key:', key)
  }
  
  return createBrowserClient<Database>(url, key)
}