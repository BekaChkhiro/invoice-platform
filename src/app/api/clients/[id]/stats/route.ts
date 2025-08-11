import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      .select('id, name, created_at')
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'კლიენტი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Get all invoices for comprehensive statistics
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', id)
      .eq('company_id', company.id)
      .order('issue_date', { ascending: true })

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return NextResponse.json(
        { error: 'სტატისტიკის მიღება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    const allInvoices = invoices || []

    // Basic statistics
    const totalInvoices = allInvoices.length
    const totalRevenue = allInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)
    const paidInvoices = allInvoices.filter(inv => inv.status === 'paid')
    const pendingInvoices = allInvoices.filter(inv => ['draft', 'sent'].includes(inv.status))
    const overdueInvoices = allInvoices.filter(inv => 
      inv.status === 'overdue' || 
      (inv.status === 'sent' && new Date(inv.due_date) < new Date())
    )
    const cancelledInvoices = allInvoices.filter(inv => inv.status === 'cancelled')

    // Payment behavior analysis
    const paidWithDates = paidInvoices.filter(inv => inv.paid_at)
    let totalPaymentDays = 0
    let onTimePayments = 0
    let latePayments = 0
    let veryLatePayments = 0 // More than 30 days late

    paidWithDates.forEach(invoice => {
      const issueDate = new Date(invoice.issue_date)
      const dueDate = new Date(invoice.due_date)
      const paidDate = new Date(invoice.paid_at)
      
      const daysFromIssue = Math.floor((paidDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysAfterDue = Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      
      totalPaymentDays += Math.max(0, daysFromIssue)
      
      if (daysAfterDue <= 0) {
        onTimePayments++
      } else {
        latePayments++
        if (daysAfterDue > 30) {
          veryLatePayments++
        }
      }
    })

    const averagePaymentDays = paidWithDates.length > 0 
      ? Math.round(totalPaymentDays / paidWithDates.length)
      : 0

    // Monthly breakdown (last 12 months)
    const monthlyBreakdown = generateMonthlyBreakdown(allInvoices)

    // Currency breakdown
    const currencyBreakdown = allInvoices.reduce((acc, inv) => {
      const currency = inv.currency || 'GEL'
      if (!acc[currency]) {
        acc[currency] = {
          total_amount: 0,
          invoice_count: 0
        }
      }
      acc[currency].total_amount += Number(inv.total)
      acc[currency].invoice_count += 1
      return acc
    }, {} as Record<string, { total_amount: number; invoice_count: number }>)

    // Client lifecycle metrics
    const firstInvoiceDate = allInvoices.length > 0 
      ? new Date(allInvoices[0].issue_date)
      : new Date(client.created_at)
    
    const lastInvoiceDate = allInvoices.length > 0
      ? new Date(allInvoices[allInvoices.length - 1].issue_date)
      : null

    const clientAgeDays = Math.floor(
      (new Date().getTime() - firstInvoiceDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const daysSinceLastInvoice = lastInvoiceDate
      ? Math.floor((new Date().getTime() - lastInvoiceDate.getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Compile comprehensive statistics
    const statistics = {
      overview: {
        total_invoices: totalInvoices,
        total_revenue: totalRevenue,
        average_invoice_value: totalInvoices > 0 ? totalRevenue / totalInvoices : 0,
        paid_invoices: paidInvoices.length,
        pending_invoices: pendingInvoices.length,
        overdue_invoices: overdueInvoices.length,
        cancelled_invoices: cancelledInvoices.length
      },
      payment_behavior: {
        average_payment_days: averagePaymentDays,
        on_time_payments: onTimePayments,
        late_payments: latePayments,
        very_late_payments: veryLatePayments,
        payment_rate: totalInvoices > 0 
          ? (paidInvoices.length / totalInvoices * 100).toFixed(1) + '%'
          : '0%',
        on_time_rate: paidWithDates.length > 0
          ? (onTimePayments / paidWithDates.length * 100).toFixed(1) + '%'
          : '0%'
      },
      financial_summary: {
        total_invoiced: totalRevenue,
        total_paid: paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0),
        total_pending: pendingInvoices.reduce((sum, inv) => sum + Number(inv.total), 0),
        total_overdue: overdueInvoices.reduce((sum, inv) => sum + Number(inv.total), 0),
        currency_breakdown: currencyBreakdown
      },
      monthly_breakdown: monthlyBreakdown,
      lifecycle: {
        client_age_days: clientAgeDays,
        client_age_months: Math.floor(clientAgeDays / 30),
        first_invoice_date: firstInvoiceDate.toISOString(),
        last_invoice_date: lastInvoiceDate?.toISOString() || null,
        days_since_last_invoice: daysSinceLastInvoice,
        average_invoices_per_month: clientAgeDays > 30 
          ? (totalInvoices / (clientAgeDays / 30)).toFixed(1)
          : totalInvoices.toString()
      }
    }

    return NextResponse.json({
      client_id: id,
      client_name: client.name,
      statistics
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/clients/[id]/stats:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}

function generateMonthlyBreakdown(invoices: Array<{ total_amount: number; due_date: string; status: string }>) {
  const breakdown: Record<string, { total: number; count: number; paid: number; overdue: number }> = {}
  const now = new Date()
  
  // Generate last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    breakdown[monthKey] = {
      month: monthKey,
      invoice_count: 0,
      total_amount: 0,
      paid_amount: 0,
      pending_amount: 0,
      overdue_amount: 0,
      invoices: []
    }
  }

  // Populate with invoice data
  invoices.forEach(invoice => {
    const issueDate = new Date(invoice.issue_date)
    const monthKey = `${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, '0')}`
    
    if (breakdown[monthKey]) {
      breakdown[monthKey].invoice_count += 1
      breakdown[monthKey].total_amount += Number(invoice.total)
      
      if (invoice.status === 'paid') {
        breakdown[monthKey].paid_amount += Number(invoice.total)
      } else if (['draft', 'sent'].includes(invoice.status)) {
        breakdown[monthKey].pending_amount += Number(invoice.total)
      } else if (invoice.status === 'overdue' || 
                (invoice.status === 'sent' && new Date(invoice.due_date) < new Date())) {
        breakdown[monthKey].overdue_amount += Number(invoice.total)
      }
      
      breakdown[monthKey].invoices.push({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        amount: invoice.total,
        status: invoice.status
      })
    }
  })

  // Convert to array and sort by month
  return Object.values(breakdown).sort((a, b) => 
    a.month.localeCompare(b.month)
  )
}