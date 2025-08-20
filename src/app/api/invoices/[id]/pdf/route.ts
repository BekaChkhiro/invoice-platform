import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'არაავტორიზებული' },
        { status: 401 }
      )
    }

    // Get user's company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'კომპანია ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Get invoice with all details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients!inner(
          id,
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
      .eq('company_id', company.id)
      .order('sort_order', { foreignTable: 'invoice_items', ascending: true })
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'ინვოისი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Extract selected bank account IDs from notes field
    let bankAccounts = null
    let selectedBankAccountIds: string[] = []
    
    // Try to parse selected bank accounts from notes field
    if ((invoice as any).notes) {
      try {
        const notesData = JSON.parse((invoice as any).notes)
        if (notesData.selected_bank_account_ids && Array.isArray(notesData.selected_bank_account_ids)) {
          selectedBankAccountIds = notesData.selected_bank_account_ids
        }
      } catch (error) {
        console.error('Error parsing notes field:', error)
      }
    }
    
    // Fetch selected bank accounts if we have IDs
    if (selectedBankAccountIds.length > 0 && company.id) {
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
        .eq('company_id', company.id)
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

    // Prepare invoice data with company info  
    const invoiceWithCompany = {
      ...invoice,
      company,
      // Keep bank_account data from the original invoice query
      bank_account: invoice.bank_account
    }

    // Debug log to check invoice data
    console.log('Invoice data for PDF:', {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      bank_account: invoice.bank_account,
      bank_accounts: bankAccounts,
      notes: (invoice as any).notes,
      company: company.name
    })
    
    // Call the PDF generation Edge Function
    const { data: pdfResult, error: pdfError } = await supabase.functions.invoke('generate-invoice-pdf', {
      body: {
        invoice: {
          ...invoiceWithCompany,
          bank_account: invoiceWithCompany.bank_account,
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

    // Check if we got a valid response
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
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/invoices/[id]/pdf:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}