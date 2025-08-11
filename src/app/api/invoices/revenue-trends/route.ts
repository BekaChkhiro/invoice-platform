import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns'
import { ka } from 'date-fns/locale'

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

    // Get period parameter (default to 12 months)
    const searchParams = request.nextUrl.searchParams
    const periodParam = searchParams.get('period') || '12'
    const period = parseInt(periodParam, 10)

    // Validate period
    if (![1, 3, 6, 12].includes(period)) {
      return NextResponse.json(
        { error: 'არასწორი პერიოდი. მხოლოდ 1, 3, 6, ან 12 თვე' },
        { status: 400 }
      )
    }

    const now = new Date()
    const startDate = subMonths(startOfMonth(now), period - 1)
    
    // Fetch invoices for the specified period
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('total, status, issue_date, paid_at')
      .eq('company_id', company.id)
      .gte('issue_date', startDate.toISOString().split('T')[0])
      .order('issue_date', { ascending: true })

    if (invoicesError) {
      console.error('Error fetching invoices for revenue trends:', invoicesError)
      return NextResponse.json(
        { error: 'შემოსავლების ტენდენციის მიღება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    const allInvoices = invoices || []

    // Generate monthly revenue data
    const monthlyData = []
    for (let i = period - 1; i >= 0; i--) {
      const monthDate = subMonths(startOfMonth(now), i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      const monthName = format(monthDate, 'MMM yyyy', { locale: ka })
      const shortMonthName = format(monthDate, 'MMM', { locale: ka })

      // Calculate revenue for this month
      const monthInvoices = allInvoices.filter(invoice => {
        if (!invoice.issue_date) return false
        const issueDate = new Date(invoice.issue_date)
        return issueDate >= monthStart && issueDate <= monthEnd
      })

      // Calculate different revenue types
      const totalRevenue = monthInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
      const paidRevenue = monthInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + Number(inv.total || 0), 0)
      const pendingRevenue = monthInvoices
        .filter(inv => ['sent', 'overdue'].includes(inv.status))
        .reduce((sum, inv) => sum + Number(inv.total || 0), 0)

      monthlyData.push({
        month: shortMonthName,
        fullMonth: monthName,
        date: monthDate.toISOString(),
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        paidRevenue: Math.round(paidRevenue * 100) / 100,
        pendingRevenue: Math.round(pendingRevenue * 100) / 100,
        invoiceCount: monthInvoices.length,
        paidCount: monthInvoices.filter(inv => inv.status === 'paid').length
      })
    }

    // Calculate trend statistics
    const currentPeriodRevenue = monthlyData.reduce((sum, data) => sum + data.totalRevenue, 0)
    const averageMonthlyRevenue = monthlyData.length > 0 ? currentPeriodRevenue / monthlyData.length : 0
    
    // Calculate growth from first to last month (if we have enough data)
    const firstMonth = monthlyData[0]
    const lastMonth = monthlyData[monthlyData.length - 1]
    const growthPercentage = firstMonth && firstMonth.totalRevenue > 0
      ? ((lastMonth.totalRevenue - firstMonth.totalRevenue) / firstMonth.totalRevenue) * 100
      : lastMonth.totalRevenue > 0 ? 100 : 0

    const response = {
      period,
      monthlyData,
      summary: {
        totalRevenue: Math.round(currentPeriodRevenue * 100) / 100,
        averageMonthlyRevenue: Math.round(averageMonthlyRevenue * 100) / 100,
        growthPercentage: Math.round(growthPercentage * 100) / 100,
        totalInvoices: monthlyData.reduce((sum, data) => sum + data.invoiceCount, 0),
        bestMonth: monthlyData.reduce((max, current) => 
          current.totalRevenue > max.totalRevenue ? current : max, 
          monthlyData[0]
        ),
        worstMonth: monthlyData.reduce((min, current) => 
          current.totalRevenue < min.totalRevenue ? current : min, 
          monthlyData[0]
        )
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Unexpected error in GET /api/invoices/revenue-trends:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}