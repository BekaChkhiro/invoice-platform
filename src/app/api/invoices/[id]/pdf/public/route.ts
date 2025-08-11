import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json(
        { error: 'აუცილებელია ტოკენი' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get invoice with company info to verify token
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        company:companies!inner(
          id,
          user_id,
          name,
          tax_id,
          address_line1,
          address_line2,
          city,
          postal_code,
          phone,
          email,
          bank_name,
          bank_account_number
        ),
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
      .order('sort_order', { foreignTable: 'invoice_items', ascending: true })
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'ინვოისი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Verify token - create the same hash that should be used to generate the token
    const expectedToken = createHash('sha256')
      .update(`${invoice.id}-${invoice.company.user_id}-${process.env.SUPABASE_JWT_SECRET}`)
      .digest('hex')
      .substring(0, 32)

    if (token !== expectedToken) {
      return NextResponse.json(
        { error: 'არასწორი ტოკენი' },
        { status: 403 }
      )
    }

    // Call the PDF generation Edge Function
    const { data: pdfResult, error: pdfError } = await supabase.functions.invoke('generate-invoice-pdf', {
      body: {
        invoice: {
          ...invoice,
          company: invoice.company
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
        'X-Robots-Tag': 'noindex, nofollow' // Prevent search engine indexing
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