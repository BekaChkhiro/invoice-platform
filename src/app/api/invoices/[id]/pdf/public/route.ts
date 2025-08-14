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
          email,
          bank_name,
          bank_account,
          bank_swift
        ),
        client:clients(
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
      .eq('public_enabled', true)
      .eq('public_token', token)
      .order('sort_order', { foreignTable: 'invoice_items', ascending: true })
      .maybeSingle()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'ინვოისი ვერ მოიძებნა' }, { status: 404 })
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
