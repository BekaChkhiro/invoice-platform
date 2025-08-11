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

    // Fetch all invoices for statistics
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('total, status, issue_date, due_date, paid_at')
      .eq('company_id', company.id)

    if (invoicesError) {
      console.error('Error fetching invoices for stats:', invoicesError)
      return NextResponse.json(
        { error: 'სტატისტიკის მიღება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    const allInvoices = invoices || []
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Calculate basic statistics
    const totalInvoices = allInvoices.length
    const totalAmount = allInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const paidInvoices = allInvoices.filter(inv => inv.status === 'paid')
    const paidAmount = paidInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    
    // Calculate overdue statistics
    const overdueInvoices = allInvoices.filter(inv => {
      if (inv.status === 'overdue') return true
      if (inv.status === 'sent' && inv.due_date) {
        return new Date(inv.due_date) < now
      }
      return false
    })
    const overdueCount = overdueInvoices.length
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)

    // Calculate average invoice value
    const averageInvoiceValue = totalInvoices > 0 ? totalAmount / totalInvoices : 0

    // Calculate monthly statistics
    const currentMonthInvoices = allInvoices.filter(inv => {
      if (!inv.issue_date) return false
      const issueDate = new Date(inv.issue_date)
      return issueDate >= currentMonth && issueDate < nextMonth
    })
    
    const previousMonthInvoices = allInvoices.filter(inv => {
      if (!inv.issue_date) return false
      const issueDate = new Date(inv.issue_date)
      return issueDate >= previousMonth && issueDate < currentMonth
    })

    const currentMonthTotal = currentMonthInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const currentMonthCount = currentMonthInvoices.length
    const previousMonthTotal = previousMonthInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    
    const growthPercentage = previousMonthTotal > 0 
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
      : currentMonthTotal > 0 ? 100 : 0

    const stats = {
      total_invoices: totalInvoices,
      total_amount: Math.round(totalAmount * 100) / 100,
      paid_amount: Math.round(paidAmount * 100) / 100,
      overdue_amount: Math.round(overdueAmount * 100) / 100,
      overdue_count: overdueCount,
      average_invoice_value: Math.round(averageInvoiceValue * 100) / 100,
      monthly_stats: {
        current_month_total: Math.round(currentMonthTotal * 100) / 100,
        current_month_count: currentMonthCount,
        previous_month_total: Math.round(previousMonthTotal * 100) / 100,
        growth_percentage: Math.round(growthPercentage * 100) / 100
      }
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Unexpected error in GET /api/invoices/stats:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}