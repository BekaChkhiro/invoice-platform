import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceSchema } from '@/lib/validations/service'

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

    // Get service with usage statistics
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select(`
        *,
        invoice_items:invoice_items(
          id,
          line_total,
          quantity,
          invoice:invoices(
            id,
            invoice_number,
            total,
            status,
            created_at,
            client:clients(name)
          )
        )
      `)
      .eq('id', params.id)
      .eq('company_id', company.id)
      .single()

    if (serviceError) {
      if (serviceError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'სერვისი ვერ მოიძებნა' },
          { status: 404 }
        )
      }
      console.error('Error fetching service:', serviceError)
      return NextResponse.json(
        { error: 'სერვისის მიღება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // Calculate usage statistics
    const invoiceItems = service.invoice_items || []
    const totalRevenue = invoiceItems.reduce((sum, item) => sum + Number(item.line_total), 0)
    const timesUsed = invoiceItems.length
    const uniqueInvoices = new Set(invoiceItems.map(item => item.invoice?.id)).size

    const serviceWithStats = {
      ...service,
      statistics: {
        times_used: timesUsed,
        total_revenue: totalRevenue,
        unique_invoices: uniqueInvoices,
        recent_usage: invoiceItems
          .map(item => ({
            invoice_number: item.invoice?.invoice_number,
            client_name: item.invoice?.client?.name,
            amount: item.line_total,
            quantity: item.quantity,
            date: item.invoice?.created_at
          }))
          .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
          .slice(0, 10)
      }
    }

    return NextResponse.json(serviceWithStats)

  } catch (error) {
    console.error('Unexpected error in GET /api/services/[id]:', error)
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

    // Verify service exists and belongs to company
    const { data: existingService, error: serviceError } = await supabase
      .from('services')
      .select('id, name')
      .eq('id', params.id)
      .eq('company_id', company.id)
      .single()

    if (serviceError || !existingService) {
      return NextResponse.json(
        { error: 'სერვისი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = serviceSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'არასწორი მონაცემები', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const serviceData = validationResult.data

    // Check for unique service name within company (excluding current service)
    if (serviceData.name !== existingService.name) {
      const { data: duplicateService } = await supabase
        .from('services')
        .select('id')
        .eq('company_id', company.id)
        .eq('name', serviceData.name)
        .neq('id', params.id)
        .single()

      if (duplicateService) {
        return NextResponse.json(
          { error: 'სერვისი ამ სახელით უკვე არსებობს' },
          { status: 409 }
        )
      }
    }

    // Update service
    const { data: updatedService, error: updateError } = await supabase
      .from('services')
      .update({
        ...serviceData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('company_id', company.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating service:', updateError)
      return NextResponse.json(
        { error: 'სერვისის განახლება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedService)

  } catch (error) {
    console.error('Unexpected error in PUT /api/services/[id]:', error)
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

    // Check if service is used in any invoice items
    const { data: usageCount, error: usageError } = await supabase
      .from('invoice_items')
      .select('id', { count: 'exact' })
      .eq('service_id', params.id)

    if (usageError) {
      console.error('Error checking service usage:', usageError)
      return NextResponse.json(
        { error: 'სერვისის გამოყენების შემოწმება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // If service is used, deactivate instead of delete
    if (usageCount && usageCount.length > 0) {
      const { data: deactivatedService, error: deactivateError } = await supabase
        .from('services')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('company_id', company.id)
        .select()
        .single()

      if (deactivateError) {
        console.error('Error deactivating service:', deactivateError)
        return NextResponse.json(
          { error: 'სერვისის დეაქტივაცია ვერ მოხერხდა' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'სერვისი გამოყენებული იყო ინვოისებში, ამიტომ დეაქტივირებულია წაშლის ნაცვლად',
        service: deactivatedService
      })
    }

    // Delete service if not used
    const { error: deleteError } = await supabase
      .from('services')
      .delete()
      .eq('id', params.id)
      .eq('company_id', company.id)

    if (deleteError) {
      console.error('Error deleting service:', deleteError)
      return NextResponse.json(
        { error: 'სერვისის წაშლა ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'სერვისი წარმატებით წაიშალა' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Unexpected error in DELETE /api/services/[id]:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}