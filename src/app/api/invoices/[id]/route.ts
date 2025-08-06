import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateInvoiceSchema } from '@/lib/validations/invoice'

export async function GET(
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
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'კომპანია ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Fetch invoice with all related data
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
        company:companies!inner(
          id,
          name,
          tax_id,
          email,
          phone,
          address_line1,
          address_line2,
          city,
          postal_code,
          website,
          logo_url,
          bank_name,
          bank_account,
          bank_swift,
          invoice_prefix,
          invoice_notes,
          payment_terms,
          vat_rate,
          currency
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
      .eq('id', params.id)
      .eq('company_id', company.id)
      .order('sort_order', { foreignTable: 'invoice_items', ascending: true })
      .single()

    if (invoiceError) {
      if (invoiceError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'ინვოისი ვერ მოიძებნა' },
          { status: 404 }
        )
      }
      console.error('Error fetching invoice:', invoiceError)
      return NextResponse.json(
        { error: 'ინვოისის მიღება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    return NextResponse.json(invoice)

  } catch (error) {
    console.error('Unexpected error in GET /api/invoices/[id]:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const { data: existingInvoice, error: checkError } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('id', params.id)
      .eq('company_id', company.id)
      .single()

    if (checkError || !existingInvoice) {
      return NextResponse.json(
        { error: 'ინვოისი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Check if invoice can be edited (only draft and sent statuses)
    if (!['draft', 'sent'].includes(existingInvoice.status)) {
      return NextResponse.json(
        { error: 'ინვოისის რედაქტირება შეუძლებელია ამ სტატუსში' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateInvoiceSchema.safeParse({ ...body, id: params.id })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'არასწორი მონაცემები', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { items, ...invoiceUpdateData } = validationResult.data

    // Remove fields that shouldn't be updated
    delete invoiceUpdateData.id
    delete invoiceUpdateData.company_id
    delete invoiceUpdateData.invoice_number

    // Calculate new totals if items are provided
    if (items && items.length > 0) {
      const subtotal = items.reduce((sum, item) => {
        const lineTotal = item.quantity * item.unit_price
        return sum + lineTotal
      }, 0)

      const vatRate = invoiceUpdateData.vat_rate ?? existingInvoice.vat_rate ?? 18
      const vatAmount = subtotal * (vatRate / 100)
      const total = subtotal + vatAmount

      invoiceUpdateData.subtotal = Math.round(subtotal * 100) / 100
      invoiceUpdateData.vat_amount = Math.round(vatAmount * 100) / 100
      invoiceUpdateData.total = Math.round(total * 100) / 100
    }

    // Update invoice
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        ...invoiceUpdateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating invoice:', updateError)
      return NextResponse.json(
        { error: 'ინვოისის განახლება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // Update items if provided
    if (items && items.length > 0) {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', params.id)

      if (deleteError) {
        console.error('Error deleting invoice items:', deleteError)
      }

      // Insert new items
      const invoiceItems = items.map((item: any, index: number) => ({
        invoice_id: params.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price,
        sort_order: item.sort_order || index
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems)

      if (itemsError) {
        console.error('Error creating invoice items:', itemsError)
        return NextResponse.json(
          { error: 'ინვოისის პროდუქტების განახლება ვერ მოხერხდა' },
          { status: 500 }
        )
      }
    }

    // Fetch complete updated invoice
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
      .eq('id', params.id)
      .single()

    if (fetchError || !completeInvoice) {
      return NextResponse.json(updatedInvoice)
    }

    return NextResponse.json(completeInvoice)

  } catch (error) {
    console.error('Unexpected error in PUT /api/invoices/[id]:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'კომპანია ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Check if invoice exists and can be deleted
    const { data: invoice, error: checkError } = await supabase
      .from('invoices')
      .select('id, status')
      .eq('id', params.id)
      .eq('company_id', company.id)
      .single()

    if (checkError || !invoice) {
      return NextResponse.json(
        { error: 'ინვოისი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Only allow deletion of draft invoices
    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'მხოლოდ მონახაზის სტატუსის ინვოისის წაშლა შეიძლება' },
        { status: 403 }
      )
    }

    // Soft delete - add deleted_at timestamp
    const { error: deleteError } = await supabase
      .from('invoices')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting invoice:', deleteError)
      return NextResponse.json(
        { error: 'ინვოისის წაშლა ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // Return credit to user
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('used_credits')
      .eq('user_id', user.id)
      .single()

    if (!creditsError && credits && credits.used_credits > 0) {
      await supabase
        .from('user_credits')
        .update({ used_credits: credits.used_credits - 1 })
        .eq('user_id', user.id)
    }

    return NextResponse.json(
      { message: 'ინვოისი წარმატებით წაიშალა' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Unexpected error in DELETE /api/invoices/[id]:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}