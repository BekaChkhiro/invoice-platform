import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
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

    // Get current client status
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, is_active, name')
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'კლიენტი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    const newStatus = !client.is_active

    // If activating, no additional checks needed
    // If deactivating, check for pending invoices
    if (!newStatus) {
      const { data: pendingInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, invoice_number, status')
        .eq('client_id', id)
        .eq('company_id', company.id)
        .in('status', ['draft', 'sent', 'overdue'])
        .limit(1)

      if (invoicesError) {
        console.error('Error checking pending invoices:', invoicesError)
      }

      if (pendingInvoices && pendingInvoices.length > 0) {
        return NextResponse.json(
          { 
            error: 'კლიენტის დეაქტივაცია შეუძლებელია - არსებობს გადაუხდელი ინვოისები',
            pending_invoice: pendingInvoices[0].invoice_number
          },
          { status: 400 }
        )
      }
    }

    // Toggle status
    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update({ 
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, is_active, name')
      .single()

    if (updateError) {
      console.error('Error toggling client status:', updateError)
      return NextResponse.json(
        { error: 'კლიენტის სტატუსის შეცვლა ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      client: updatedClient,
      message: newStatus 
        ? `კლიენტი "${client.name}" აქტივირებულია`
        : `კლიენტი "${client.name}" დეაქტივირებულია`
    })

  } catch (error) {
    console.error('Unexpected error in PATCH /api/clients/[id]/toggle-status:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}