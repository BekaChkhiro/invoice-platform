import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clientSchema } from '@/lib/validations/client'

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

    // Get client with details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'კლიენტი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Get recent invoices (last 5)
    const { data: recentInvoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, issue_date, due_date, total, status, currency')
      .eq('client_id', id)
      .eq('company_id', company.id)
      .order('issue_date', { ascending: false })
      .limit(5)

    // Get client statistics
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('total, status, due_date, paid_at')
      .eq('client_id', id)
      .eq('company_id', company.id)

    // Calculate statistics
    const statistics = {
      total_invoices: allInvoices?.length || 0,
      total_revenue: allInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0,
      paid_invoices: allInvoices?.filter(inv => inv.status === 'paid').length || 0,
      pending_invoices: allInvoices?.filter(inv => ['draft', 'sent'].includes(inv.status)).length || 0,
      overdue_invoices: allInvoices?.filter(inv => {
        return inv.status === 'overdue' || 
          (inv.status === 'sent' && new Date(inv.due_date) < new Date())
      }).length || 0,
      average_invoice_value: allInvoices?.length 
        ? (allInvoices.reduce((sum, inv) => sum + Number(inv.total), 0) / allInvoices.length)
        : 0,
      payment_behavior: calculatePaymentBehavior(allInvoices || [])
    }

    // Return client with all details
    return NextResponse.json({
      ...client,
      recent_invoices: recentInvoices || [],
      statistics
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/clients/[id]:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    // Check if client exists
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('id, type')
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (checkError || !existingClient) {
      return NextResponse.json(
        { error: 'კლიენტი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = clientSchema.partial().safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'არასწორი მონაცემები', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Format phone number if provided
    if (updateData.phone) {
      updateData.phone = updateData.phone.replace(/[\s\-\(\)]/g, '')
    }

    // Check if changing type
    if (updateData.type && updateData.type !== existingClient.type) {
      // Check if client has invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('client_id', id)
        .limit(1)

      if (invoices && invoices.length > 0) {
        return NextResponse.json(
          { error: 'კლიენტის ტიპის შეცვლა შეუძლებელია, რადგან არსებობს ინვოისები' },
          { status: 400 }
        )
      }
    }

    // Check for unique email within company (excluding current client)
    if (updateData.email) {
      const { data: existingEmail } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', company.id)
        .eq('email', updateData.email)
        .neq('id', id)
        .single()

      if (existingEmail) {
        return NextResponse.json(
          { error: 'კლიენტი ამ ელ.ფოსტით უკვე არსებობს' },
          { status: 409 }
        )
      }
    }

    // Check for unique tax_id within company (excluding current client)
    if (updateData.tax_id) {
      const { data: existingTaxId } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', company.id)
        .eq('tax_id', updateData.tax_id)
        .neq('id', id)
        .single()

      if (existingTaxId) {
        return NextResponse.json(
          { error: 'კლიენტი ამ საიდენტიფიკაციო კოდით უკვე არსებობს' },
          { status: 409 }
        )
      }
    }

    // Type-specific validation
    const finalType = updateData.type || existingClient.type
    if (finalType === 'company' && updateData.tax_id === '') {
      return NextResponse.json(
        { error: 'იურიდიული პირისთვის საიდენტიფიკაციო კოდი სავალდებულოა' },
        { status: 400 }
      )
    }

    // Update client
    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating client:', updateError)
      return NextResponse.json(
        { error: 'კლიენტის განახლება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedClient)

  } catch (error) {
    console.error('Unexpected error in PUT /api/clients/[id]:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Check if client exists
    const { data: client, error: checkError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (checkError || !client) {
      return NextResponse.json(
        { error: 'კლიენტი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Check if client has invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id')
      .eq('client_id', id)
      .limit(1)

    if (invoicesError) {
      console.error('Error checking invoices:', invoicesError)
    }

    if (invoices && invoices.length > 0) {
      // Soft delete - set is_active to false
      const { error: softDeleteError } = await supabase
        .from('clients')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (softDeleteError) {
        console.error('Error soft deleting client:', softDeleteError)
        return NextResponse.json(
          { error: 'კლიენტის დეაქტივაცია ვერ მოხერხდა' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'კლიენტი დეაქტივირებულია (არსებობს ინვოისები)',
        soft_deleted: true
      })
    } else {
      // Hard delete - completely remove client
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Error deleting client:', deleteError)
        return NextResponse.json(
          { error: 'კლიენტის წაშლა ვერ მოხერხდა' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'კლიენტი წარმატებით წაიშალა',
        hard_deleted: true
      })
    }

  } catch (error) {
    console.error('Unexpected error in DELETE /api/clients/[id]:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}

// Helper function to calculate payment behavior
function calculatePaymentBehavior(invoices: Array<{ status: string; paid_at?: string; due_date?: string; created_at?: string }>) {
  const paidInvoices = invoices.filter(inv => inv.status === 'paid' && inv.paid_at)
  
  if (paidInvoices.length === 0) {
    return {
      average_payment_days: 0,
      on_time_payments: 0,
      late_payments: 0,
      payment_rating: 'new' // new client, no payment history
    }
  }

  let totalPaymentDays = 0
  let onTimePayments = 0
  let latePayments = 0

  paidInvoices.forEach(invoice => {
    const dueDate = new Date(invoice.due_date)
    const paidDate = new Date(invoice.paid_at)
    const daysDiff = Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    
    totalPaymentDays += Math.max(0, daysDiff) // Only count if paid after due date
    
    if (daysDiff <= 0) {
      onTimePayments++
    } else {
      latePayments++
    }
  })

  const averagePaymentDays = Math.round(totalPaymentDays / paidInvoices.length)
  const onTimePercentage = (onTimePayments / paidInvoices.length) * 100

  let paymentRating: string
  if (onTimePercentage >= 90) {
    paymentRating = 'excellent'
  } else if (onTimePercentage >= 70) {
    paymentRating = 'good'
  } else if (onTimePercentage >= 50) {
    paymentRating = 'fair'
  } else {
    paymentRating = 'poor'
  }

  return {
    average_payment_days: averagePaymentDays,
    on_time_payments: onTimePayments,
    late_payments: latePayments,
    payment_rating: paymentRating
  }
}