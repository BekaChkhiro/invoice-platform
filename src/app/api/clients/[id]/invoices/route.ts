import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const invoiceFilterSchema = z.object({
  status: z.enum(['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled']).default('all'),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sort_by: z.enum(['issue_date', 'due_date', 'total', 'status']).default('issue_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

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

    // Verify client belongs to company
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'კლიენტი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const filterData = {
      status: searchParams.get('status') || 'all',
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sort_by: searchParams.get('sort_by') || 'issue_date',
      sort_order: searchParams.get('sort_order') || 'desc'
    }

    const validationResult = invoiceFilterSchema.safeParse(filterData)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'არასწორი პარამეტრები', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const filters = validationResult.data

    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(count)
      `, { count: 'exact' })
      .eq('client_id', id)
      .eq('company_id', company.id)

    // Apply filters
    if (filters.status !== 'all') {
      if (filters.status === 'overdue') {
        // Handle overdue specially - either marked as overdue or sent and past due date
        query = query.or(
          `status.eq.overdue,and(status.eq.sent,due_date.lt.${new Date().toISOString().split('T')[0]})`
        )
      } else {
        query = query.eq('status', filters.status)
      }
    }

    if (filters.date_from) {
      query = query.gte('issue_date', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('issue_date', filters.date_to)
    }

    // Apply sorting
    query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1)

    // Execute query
    const { data: invoices, error: invoicesError, count } = await query

    if (invoicesError) {
      console.error('Error fetching client invoices:', invoicesError)
      return NextResponse.json(
        { error: 'ინვოისების მიღება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // Calculate summary statistics
    const allInvoicesQuery = supabase
      .from('invoices')
      .select('total, status')
      .eq('client_id', id)
      .eq('company_id', company.id)

    if (filters.status !== 'all') {
      if (filters.status === 'overdue') {
        allInvoicesQuery.or(
          `status.eq.overdue,and(status.eq.sent,due_date.lt.${new Date().toISOString().split('T')[0]})`
        )
      } else {
        allInvoicesQuery.eq('status', filters.status)
      }
    }

    if (filters.date_from) {
      allInvoicesQuery.gte('issue_date', filters.date_from)
    }

    if (filters.date_to) {
      allInvoicesQuery.lte('issue_date', filters.date_to)
    }

    const { data: allFilteredInvoices } = await allInvoicesQuery

    const summary = {
      total_invoices: count || 0,
      total_amount: allFilteredInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0,
      status_breakdown: {
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
        cancelled: 0
      }
    }

    // Calculate status breakdown
    allFilteredInvoices?.forEach(inv => {
      if (inv.status === 'overdue' || 
          (inv.status === 'sent' && new Date(inv.due_date) < new Date())) {
        summary.status_breakdown.overdue++
      } else if (inv.status in summary.status_breakdown) {
        summary.status_breakdown[inv.status as keyof typeof summary.status_breakdown]++
      }
    })

    // Format invoices with additional info
    const formattedInvoices = invoices?.map(invoice => ({
      ...invoice,
      is_overdue: invoice.status === 'sent' && new Date(invoice.due_date) < new Date(),
      days_overdue: invoice.status === 'sent' && new Date(invoice.due_date) < new Date()
        ? Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      item_count: invoice.items?.[0]?.count || 0
    }))

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name
      },
      invoices: formattedInvoices || [],
      pagination: {
        total: count || 0,
        limit: filters.limit,
        offset: filters.offset,
        page: Math.floor(filters.offset / filters.limit) + 1,
        totalPages: Math.ceil((count || 0) / filters.limit)
      },
      summary
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/clients/[id]/invoices:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}