import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'აუცილებელია ტოკენი' }, { status: 400 })
    }

    // Use service role client to bypass RLS for public invoices
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables')
      return NextResponse.json({ error: 'სერვისი დროებით მიუწვდომელია' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Fetch invoice by public token (must be enabled)
    const { data: invoice, error: invoiceError } = await supabase
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
      .eq('id', id)
      .eq('public_enabled', true)
      .eq('public_token', token)
      .order('sort_order', { foreignTable: 'invoice_items', ascending: true })
      .maybeSingle()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'ინვოისი ვერ მოიძებნა' }, { status: 404 })
    }

    // Extract selected bank account IDs from notes field
    let bankAccounts = null
    let selectedBankAccountIds: string[] = []
    
    // Try to parse selected bank accounts from notes field
    if (invoice.notes) {
      try {
        const notesData = JSON.parse(invoice.notes)
        if (notesData.selected_bank_account_ids && Array.isArray(notesData.selected_bank_account_ids)) {
          selectedBankAccountIds = notesData.selected_bank_account_ids
        }
      } catch (error) {
        console.error('Error parsing notes field:', error)
      }
    }
    
    // Fetch selected bank accounts if we have IDs
    if (selectedBankAccountIds.length > 0 && invoice.company_id) {
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
        .eq('company_id', invoice.company_id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })

      bankAccounts = selectedBankAccounts || []
    }

    // Fallback to single bank account if no company accounts
    if (!bankAccounts || bankAccounts.length === 0) {
      if (invoice.bank_account) {
        bankAccounts = [invoice.bank_account]
      }
    }

    // Check if the public link has expired
    if (invoice.public_expires_at) {
      const expiresAt = new Date(invoice.public_expires_at)
      const now = new Date()
      
      if (now > expiresAt) {
        return NextResponse.json({ error: 'პუბლიკური ლინკის ვადა გადის' }, { status: 410 })
      }
    }

    // Debug log to check invoice data
    console.log('Public PDF invoice data:', {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      bank_account: invoice.bank_account,
      bank_accounts: bankAccounts,
      notes: invoice.notes,
      company: invoice.company?.name
    })
    
    // Call the PDF generation Edge Function
    const { data: pdfResult, error: pdfError } = await supabase.functions.invoke('generate-invoice-pdf', {
      body: {
        invoice: {
          ...invoice,
          company: invoice.company,
          bank_account: invoice.bank_account,
          bank_accounts: bankAccounts
        }
      },
      headers: {
        'Accept': 'application/pdf'
      }
    })

    if (pdfError) {
      console.error('PDF generation error:', pdfError)
      return NextResponse.json(
        { error: 'PDF-ის გენერაცია ვერ მოხერხდა', details: pdfError },
        { status: 500 }
      )
    }

    if (!pdfResult) {
      console.error('No response from PDF function')
      return NextResponse.json(
        { error: 'PDF-ის გენერაცია ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // Create filename
    const filename = `invoice-${invoice.invoice_number || invoice.id.slice(0, 8)}.html`

    // Return HTML that can be printed as PDF
    return new NextResponse(pdfResult, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Robots-Tag': 'noindex, nofollow'
      }
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/invoices/[id]/pdf/public:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}
