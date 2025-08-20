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
  bank_accounts?: Array<{
    id: string
    bank_name: string
    account_number: string
    account_name?: string | null
    is_default?: boolean
  }>
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
        bank_account:company_bank_accounts(
          id,
          bank_name,
          account_number,
          account_name
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

    // Extract selected bank account IDs from notes field
    let bankAccounts = null
    let selectedBankAccountIds: string[] = []
    
    // Try to parse selected bank accounts from notes field
    if (data.notes) {
      try {
        const notesData = JSON.parse(data.notes)
        if (notesData.selected_bank_account_ids && Array.isArray(notesData.selected_bank_account_ids)) {
          selectedBankAccountIds = notesData.selected_bank_account_ids
        }
      } catch (error) {
        console.error('Error parsing notes field:', error)
      }
    }
    
    // Fetch selected bank accounts if we have IDs
    if (selectedBankAccountIds.length > 0 && data.company_id) {
      const { data: selectedBankAccounts } = await supabase
        .from('company_bank_accounts')
        .select(`
          id,
          bank_name,
          account_number,
          account_name,
          is_default
        `)
        .in('id', selectedBankAccountIds)
        .eq('company_id', data.company_id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })

      bankAccounts = selectedBankAccounts || []
    }

    // Fallback to single bank account if no selected accounts
    if (!bankAccounts || bankAccounts.length === 0) {
      if (data.bank_account) {
        bankAccounts = [data.bank_account]
      }
    }

    // Add bank_accounts to the response
    const invoiceWithBankAccounts = {
      ...data,
      bank_accounts: bankAccounts
    }

    // Check if the public link has expired
    if (invoiceWithBankAccounts.public_expires_at) {
      const expiresAt = new Date(invoiceWithBankAccounts.public_expires_at)
      const now = new Date()
      
      if (now > expiresAt) {
        return { data: null, error: 'პუბლიკური ლინკის ვადა გადის' }
      }
    }

    // Ensure items are sorted for display
    if (invoiceWithBankAccounts.items) {
      invoiceWithBankAccounts.items.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    }

    return { data: invoiceWithBankAccounts as PublicInvoice, error: null }
  } catch (e: any) {
    return { data: null, error: e?.message || 'პუბლიკური ინვოისის წაკითხვა ვერ მოხერხდა' }
  }
}
