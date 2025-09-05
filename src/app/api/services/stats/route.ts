import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const statsFilterSchema = z.object({
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  service_ids: z.array(z.string().uuid()).optional(),
  limit: z.number().min(1).max(100).default(10)
})

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const filterData = {
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      service_ids: searchParams.get('service_ids')?.split(',') || undefined,
      limit: parseInt(searchParams.get('limit') || '10')
    }

    const validationResult = statsFilterSchema.safeParse(filterData)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'არასწორი პარამეტრები', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const filters = validationResult.data

    // Build base query for service statistics
    let serviceStatsQuery = supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        default_price,
        unit,
        is_active,
        created_at,
        invoice_items:invoice_items!inner(
          id,
          line_total,
          quantity,
          unit_price,
          created_at,
          invoice:invoices!inner(
            id,
            status,
            created_at,
            client:clients(name)
          )
        )
      `)
      .eq('company_id', company.id)
      .eq('is_active', true)

    // Apply date filters to invoice items
    if (filters.date_from || filters.date_to) {
      // We need to filter via the invoice creation date
      let invoiceQuery = supabase
        .from('invoices')
        .select('id')
        .eq('company_id', company.id)

      if (filters.date_from) {
        invoiceQuery = invoiceQuery.gte('created_at', filters.date_from)
      }
      if (filters.date_to) {
        invoiceQuery = invoiceQuery.lte('created_at', filters.date_to)
      }

      const { data: filteredInvoices } = await invoiceQuery
      const invoiceIds = filteredInvoices?.map(inv => inv.id) || []

      if (invoiceIds.length === 0) {
        return NextResponse.json({
          services: [],
          summary: {
            total_services: 0,
            total_usage: 0,
            total_revenue: 0,
            average_price: 0,
            most_used_service: null,
            highest_revenue_service: null
          }
        })
      }

      // Filter service stats by invoice IDs
      serviceStatsQuery = serviceStatsQuery
        .in('invoice_items.invoice_id', invoiceIds)
    }

    // Apply service filter
    if (filters.service_ids && filters.service_ids.length > 0) {
      serviceStatsQuery = serviceStatsQuery.in('id', filters.service_ids)
    }

    // Execute query
    const { data: servicesData, error: servicesError } = await serviceStatsQuery

    if (servicesError) {
      console.error('Error fetching service stats:', servicesError)
      return NextResponse.json(
        { error: 'სტატისტიკის მიღება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // Calculate statistics for each service
    const serviceStats = (servicesData || []).map(service => {
      const items = service.invoice_items || []
      const totalUsage = items.length
      const totalRevenue = items.reduce((sum, item) => sum + Number(item.line_total), 0)
      const averagePrice = totalUsage > 0 ? totalRevenue / totalUsage : 0
      const uniqueClients = new Set(items.map(item => item.invoice?.client?.name).filter(Boolean)).size
      
      // Recent usage (last 10)
      const recentUsage = items
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(item => ({
          date: item.created_at,
          amount: item.line_total,
          quantity: item.quantity,
          client_name: item.invoice?.client?.name || 'უცნობი კლიენტი',
          invoice_status: item.invoice?.status || 'უცნობი'
        }))

      return {
        ...service,
        statistics: {
          total_usage: totalUsage,
          total_revenue: Math.round(totalRevenue * 100) / 100,
          average_price: Math.round(averagePrice * 100) / 100,
          unique_clients: uniqueClients,
          recent_usage: recentUsage
        }
      }
    })

    // Sort by total revenue (descending)
    serviceStats.sort((a, b) => b.statistics.total_revenue - a.statistics.total_revenue)

    // Calculate overall summary
    const totalServices = serviceStats.length
    const totalUsage = serviceStats.reduce((sum, s) => sum + s.statistics.total_usage, 0)
    const totalRevenue = serviceStats.reduce((sum, s) => sum + s.statistics.total_revenue, 0)
    const averagePrice = totalUsage > 0 ? totalRevenue / totalUsage : 0

    const mostUsedService = serviceStats.reduce((max, current) => 
      current.statistics.total_usage > (max?.statistics.total_usage || 0) ? current : max, 
      null
    )

    const highestRevenueService = serviceStats[0] || null // Already sorted by revenue

    // Apply limit
    const limitedServices = serviceStats.slice(0, filters.limit)

    return NextResponse.json({
      services: limitedServices,
      summary: {
        total_services: totalServices,
        total_usage: totalUsage,
        total_revenue: Math.round(totalRevenue * 100) / 100,
        average_price: Math.round(averagePrice * 100) / 100,
        most_used_service: mostUsedService ? {
          id: mostUsedService.id,
          name: mostUsedService.name,
          usage_count: mostUsedService.statistics.total_usage
        } : null,
        highest_revenue_service: highestRevenueService ? {
          id: highestRevenueService.id,
          name: highestRevenueService.name,
          revenue: highestRevenueService.statistics.total_revenue
        } : null
      }
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/services/stats:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}