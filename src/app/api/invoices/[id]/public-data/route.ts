import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'აუცილებელია ტოკენი' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'სერვისი მიუწვდომელია' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      issue_date,
      due_date,
      status,
      currency,
      vat_rate,
      subtotal,
      vat_amount,
      total,
      notes,
      company_id,
      public_expires_at,
      company:companies(
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
        name,
        type,
        tax_id,
        email,
        phone,
        address_line1,
        address_line2,
        city,
        postal_code,
        contact_person
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
    .eq('id', id)
    .eq('public_token', token)
    .eq('public_enabled', true)
    .order('sort_order', { foreignTable: 'invoice_items', ascending: true })
    .maybeSingle()

  if (error || !invoice) {
    return NextResponse.json({ error: 'ინვოისი ვერ მოიძებნა' }, { status: 404 })
  }

  if (invoice.public_expires_at && new Date(invoice.public_expires_at) < new Date()) {
    return NextResponse.json({ error: 'პუბლიკური ლინკის ვადა ამოიწურა' }, { status: 410 })
  }

  // Resolve selected bank accounts (stored inside notes JSON workaround)
  let bankAccounts: any[] | undefined
  if (typeof invoice.notes === 'string') {
    try {
      const parsed = JSON.parse(invoice.notes)
      if (Array.isArray(parsed?.selected_bank_account_ids) && parsed.selected_bank_account_ids.length > 0 && invoice.company_id) {
        const { data: accounts } = await supabase
          .from('company_bank_accounts')
          .select('id, bank_name, account_number, account_name, is_default')
          .in('id', parsed.selected_bank_account_ids)
          .eq('company_id', invoice.company_id)
          .eq('is_active', true)
          .order('is_default', { ascending: false })
        if (accounts && accounts.length > 0) bankAccounts = accounts
      }
    } catch {}
  }

  // Fallback: default bank account if invoice has none selected
  if ((!bankAccounts || bankAccounts.length === 0) && invoice.company_id) {
    const { data: defaults } = await supabase
      .from('company_bank_accounts')
      .select('id, bank_name, account_number, account_name, is_default')
      .eq('company_id', invoice.company_id)
      .eq('is_active', true)
      .eq('is_default', true)
      .limit(1)
    if (defaults && defaults.length > 0) bankAccounts = defaults
  }

  return NextResponse.json({
    invoice_number: invoice.invoice_number,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    status: invoice.status,
    currency: invoice.currency,
    vat_rate: invoice.vat_rate,
    subtotal: invoice.subtotal,
    vat_amount: invoice.vat_amount,
    total: invoice.total,
    company: invoice.company,
    client: invoice.client,
    bank_account: bankAccounts ? null : invoice.bank_account,
    bank_accounts: bankAccounts,
    items: invoice.items || [],
  })
}
