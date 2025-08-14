import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import type { InvoiceWithDetails, ServiceResult } from '@/lib/services/invoice'

export type PublicInvoice = InvoiceWithDetails & {
  company?: {
    id: string
    name: string | null
    tax_id: string | null
    address_line1: string | null
    address_line2: string | null
    city: string | null
    postal_code: string | null
    phone: string | null
    email: string | null
  } | null
}

// Public invoice service (server-side only)
// Fetches invoice by public token when invoice is marked public.

export const getInvoiceByPublicToken = async (
  token: string
): Promise<ServiceResult<PublicInvoice>> => {
  // Use service role client to bypass RLS for public invoices
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables')
    return { data: null, error: 'სერვისი დროებით მიუწვდომელია' }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        company:companies(
          id,
          name,
          tax_id,
          address_line1,
          address_line2,
          city,
          postal_code,
          phone,
          email
        ),
        client:clients(
          id,
          name,
          email,
          type,
          phone,
          address_line1,
          address_line2,
          city,
          postal_code,
          tax_id
        ),
        items:invoice_items(
          id,
          description,
          quantity,
          unit_price,
          line_total,
          sort_order
        )
      `)
      .eq('public_token', token)
      .eq('public_enabled', true)
      .maybeSingle()

    if (error) {
      return { data: null, error: error.message }
    }

    if (!data) {
      return { data: null, error: 'პუბლიკური ინვოისი ვერ მოიძებნა' }
    }

    // Check if the public link has expired
    if (data.public_expires_at) {
      const expiresAt = new Date(data.public_expires_at)
      const now = new Date()
      
      if (now > expiresAt) {
        return { data: null, error: 'პუბლიკური ლინკის ვადა გადის' }
      }
    }

    // Ensure items are sorted for display
    if ((data as any).items) {
      ;(data as any).items.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    }

    return { data: data as PublicInvoice, error: null }
  } catch (e: any) {
    return { data: null, error: e?.message || 'პუბლიკური ინვოისის წაკითხვა ვერ მოხერხდა' }
  }
}
