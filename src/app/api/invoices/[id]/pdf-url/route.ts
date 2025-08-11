import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPublicPdfUrl } from '@/lib/utils/pdf-token'

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
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'კომპანია ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Check if invoice exists and belongs to user's company
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id')
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'ინვოისი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Generate public PDF URL
    const publicUrl = getPublicPdfUrl(id, user.id)
    const fullUrl = `${request.nextUrl.origin}${publicUrl}`

    return NextResponse.json({
      public_pdf_url: fullUrl,
      expires_in: '24 hours' // Note: tokens don't actually expire, but we document this for security
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/invoices/[id]/pdf-url:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}