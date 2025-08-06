import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Check user credits before duplication
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (creditsError || !credits) {
      return NextResponse.json(
        { error: 'კრედიტების ინფორმაცია ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Check if user has available credits
    const availableCredits = credits.total_credits - credits.used_credits
    if (availableCredits <= 0) {
      return NextResponse.json(
        { error: 'არასაკმარისი კრედიტები ინვოისის დუბლირებისთვის' },
        { status: 403 }
      )
    }

    // Get original invoice with items
    const { data: originalInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*)
      `)
      .eq('id', params.id)
      .eq('company_id', company.id)
      .single()

    if (invoiceError || !originalInvoice) {
      return NextResponse.json(
        { error: 'ინვოისი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Generate new invoice number
    const currentYear = new Date().getFullYear()
    const nextCounter = (company.invoice_counter || 0) + 1
    const newInvoiceNumber = `${company.invoice_prefix || 'INV'}-${currentYear}-${String(nextCounter).padStart(4, '0')}`

    // Create duplicate invoice data
    const { 
      id, 
      invoice_number, 
      status, 
      created_at, 
      updated_at,
      sent_at,
      paid_at,
      items,
      ...invoiceData 
    } = originalInvoice

    // Create new invoice with reset status and dates
    const newInvoiceData = {
      ...invoiceData,
      invoice_number: newInvoiceNumber,
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + (company.default_due_days || 14) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert the duplicate invoice
    const { data: newInvoice, error: insertError } = await supabase
      .from('invoices')
      .insert(newInvoiceData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating duplicate invoice:', insertError)
      return NextResponse.json(
        { error: 'ინვოისის დუბლირება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // Duplicate invoice items if they exist
    if (items && items.length > 0) {
      const newItems = items.map((item: any) => ({
        invoice_id: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        sort_order: item.sort_order
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(newItems)

      if (itemsError) {
        // Rollback - delete the invoice
        await supabase
          .from('invoices')
          .delete()
          .eq('id', newInvoice.id)

        console.error('Error duplicating invoice items:', itemsError)
        return NextResponse.json(
          { error: 'ინვოისის პროდუქტების დუბლირება ვერ მოხერხდა' },
          { status: 500 }
        )
      }
    }

    // Update company invoice counter
    const { error: counterError } = await supabase
      .from('companies')
      .update({ invoice_counter: nextCounter })
      .eq('id', company.id)

    if (counterError) {
      console.error('Error updating invoice counter:', counterError)
    }

    // Deduct credit
    const { error: creditError } = await supabase
      .from('user_credits')
      .update({ used_credits: credits.used_credits + 1 })
      .eq('user_id', user.id)

    if (creditError) {
      console.error('Error updating credits:', creditError)
    }

    // Fetch complete new invoice with all relations
    const { data: completeInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(
          id,
          name,
          type,
          tax_id,
          email
        ),
        items:invoice_items(*)
      `)
      .eq('id', newInvoice.id)
      .single()

    if (fetchError || !completeInvoice) {
      return NextResponse.json({
        ...newInvoice,
        message: 'ინვოისი წარმატებით დუბლირდა',
        originalInvoiceId: params.id
      }, { status: 201 })
    }

    return NextResponse.json({
      ...completeInvoice,
      message: 'ინვოისი წარმატებით დუბლირდა',
      originalInvoiceId: params.id
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in POST /api/invoices/[id]/duplicate:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}