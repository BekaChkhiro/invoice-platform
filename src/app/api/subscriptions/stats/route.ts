import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SubscriptionStatsResponse } from '@/types'

// GET /api/subscriptions/stats - Get subscription statistics
export async function GET(req: NextRequest) {
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

    const company_id = company.id

    // Get all subscriptions for the company
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('client_subscriptions')
      .select('*')
      .eq('company_id', company_id)

    if (subscriptionsError) {
      console.error('Error fetching subscriptions for stats:', subscriptionsError)
      return NextResponse.json(
        { error: 'სტატისტიკის ჩატვირთვა ჩაიშალა' },
        { status: 500 }
      )
    }

    // Calculate basic counts
    const totalSubscriptions = subscriptions.length
    const activeCount = subscriptions.filter(s => s.status === 'active').length
    const pausedCount = subscriptions.filter(s => s.status === 'paused').length
    const cancelledCount = subscriptions.filter(s => s.status === 'cancelled').length

    // Calculate unique clients
    const uniqueClients = new Set(subscriptions.map(s => s.client_id)).size

    // Calculate monthly recurring revenue (MRR)
    const monthlyRevenue = subscriptions
      .filter(s => s.status === 'active')
      .reduce((total, subscription) => {
        let monthlyAmount: number
        
        switch (subscription.billing_cycle) {
          case 'weekly':
            monthlyAmount = subscription.amount * 4.33 // Average weeks per month
            break
          case 'monthly':
            monthlyAmount = subscription.amount
            break
          case 'quarterly':
            monthlyAmount = subscription.amount / 3
            break
          case 'yearly':
            monthlyAmount = subscription.amount / 12
            break
          default:
            monthlyAmount = subscription.amount
        }
        
        return total + monthlyAmount
      }, 0)

    // Calculate annual recurring revenue (ARR)
    const annualRevenue = monthlyRevenue * 12

    // Calculate average revenue per user (ARPU)
    const arpu = uniqueClients > 0 ? monthlyRevenue / uniqueClients : 0

    // Calculate churn rate (simplified - cancelled subscriptions / total ever created)
    const churnRate = totalSubscriptions > 0 ? (cancelledCount / totalSubscriptions) * 100 : 0

    // Calculate MRR growth (simplified - would need historical data for accurate calculation)
    // For now, we'll use a placeholder value
    const mrrGrowth = 0 // TODO: Implement proper MRR growth calculation with historical data

    // Get recent payments from subscription_invoices for more detailed stats
    const { data: recentInvoices, error: invoicesError } = await supabase
      .from('subscription_invoices')
      .select('*')
      .eq('subscription_id', subscriptions.map(s => s.id))
      .gte('billing_period_start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('billing_period_start', { ascending: false })

    if (invoicesError) {
      console.error('Error fetching recent invoices:', invoicesError)
      // Continue without recent invoice data
    }

    const stats: SubscriptionStatsResponse = {
      total_subscriptions: totalSubscriptions,
      active_count: activeCount,
      paused_count: pausedCount,
      cancelled_count: cancelledCount,
      unique_clients: uniqueClients,
      monthly_revenue: Math.round(monthlyRevenue * 100) / 100, // Round to 2 decimal places
      annual_revenue: Math.round(annualRevenue * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      churn_rate: Math.round(churnRate * 10) / 10, // Round to 1 decimal place
      mrr_growth: mrrGrowth,
      recent_payments: recentInvoices?.length || 0
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error calculating subscription stats:', error)
    return NextResponse.json(
      { error: 'სერვერის შიდა შეცდომა' },
      { status: 500 }
    )
  }
}