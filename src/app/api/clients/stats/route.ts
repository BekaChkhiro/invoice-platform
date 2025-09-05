import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Get all clients for statistics
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, type, is_active, created_at')
      .eq('company_id', company.id)

    if (clientsError) {
      console.error('Error fetching clients:', clientsError)
      return NextResponse.json(
        { error: 'კლიენტების სტატისტიკის მიღება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // Get invoice statistics
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('client_id, total, status')
      .eq('company_id', company.id)

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
    }

    // Calculate revenue statistics
    const clientRevenue = new Map()
    invoices?.forEach(invoice => {
      const current = clientRevenue.get(invoice.client_id) || 0
      clientRevenue.set(invoice.client_id, current + Number(invoice.total))
    })

    const totalRevenue = Array.from(clientRevenue.values()).reduce((sum, val) => sum + val, 0)
    const avgPerClient = clients?.length > 0 ? totalRevenue / clients.length : 0

    // Calculate payment behavior
    const paidInvoices = invoices?.filter(inv => inv.status === 'paid').length || 0
    const totalInvoices = invoices?.length || 0
    const paymentRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0

    // Calculate growth (clients added in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const newClients = clients?.filter(c => new Date(c.created_at) > thirtyDaysAgo).length || 0
    const growthPercentage = clients?.length > 0 ? (newClients / clients.length) * 100 : 0

    // Calculate payment behavior distribution based on payment rates per client
    const paymentBehaviorDistribution = {
      excellent: 0,
      good: 0,
      average: 0,
      poor: 0
    }

    // Calculate payment behavior for each client
    clients?.forEach(client => {
      const clientInvoices = invoices?.filter(inv => inv.client_id === client.id) || []
      const clientPaidInvoices = clientInvoices.filter(inv => inv.status === 'paid').length
      const clientTotalInvoices = clientInvoices.length
      
      if (clientTotalInvoices === 0) {
        // No invoices yet - treat as average
        paymentBehaviorDistribution.average++
      } else {
        const clientPaymentRate = (clientPaidInvoices / clientTotalInvoices) * 100
        
        if (clientPaymentRate >= 90) {
          paymentBehaviorDistribution.excellent++
        } else if (clientPaymentRate >= 70) {
          paymentBehaviorDistribution.good++
        } else if (clientPaymentRate >= 40) {
          paymentBehaviorDistribution.average++
        } else {
          paymentBehaviorDistribution.poor++
        }
      }
    })

    // Get top clients by revenue for additional stats
    const sortedClients = Array.from(clientRevenue.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // top 5 clients
    
    const topClientsRevenue = sortedClients.reduce((sum, [, revenue]) => sum + revenue, 0)

    // Build comprehensive stats object
    const stats = {
      // Basic counts
      total_clients: clients?.length || 0,
      active_clients: clients?.filter(c => c.is_active).length || 0,
      inactive_clients: clients?.filter(c => !c.is_active).length || 0,
      companies: clients?.filter(c => c.type === 'company').length || 0,
      individuals: clients?.filter(c => c.type === 'individual').length || 0,
      new_this_month: newClients,
      
      // Growth stats
      growth_percentage: growthPercentage,
      
      // Payment behavior distribution
      payment_behavior_distribution: paymentBehaviorDistribution,
      
      // Revenue stats
      revenue_stats: {
        total_revenue: totalRevenue,
        average_per_client: avgPerClient,
        top_clients_revenue: topClientsRevenue
      },
      
      // Payment stats (for backward compatibility)
      payment_stats: {
        payment_rate: paymentRate,
        total_invoices: totalInvoices,
        paid_invoices: paidInvoices
      },
      
      // For backward compatibility
      total: clients?.length || 0,
      active: clients?.filter(c => c.is_active).length || 0,
      inactive: clients?.filter(c => !c.is_active).length || 0,
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Unexpected error in GET /api/clients/stats:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}