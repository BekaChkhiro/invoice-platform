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

    // Prepare invoice data with company info
    const invoiceWithCompany = {
      ...invoice,
      company
    }

    // Call the PDF generation Edge Function
    const { data: pdfResult, error: pdfError } = await supabase.functions.invoke('generate-invoice-pdf', {
      body: {
        invoice: invoiceWithCompany
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