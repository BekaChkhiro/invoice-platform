import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invoiceFilterSchema } from '@/lib/validations/invoice'

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

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const filterData = {
      status: searchParams.get('status') || 'all',
      client_id: searchParams.get('client_id') || undefined,
      date_from: searchParams.get('date_from') ? new Date(searchParams.get('date_from')!) : undefined,
      date_to: searchParams.get('date_to') ? new Date(searchParams.get('date_to')!) : undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '10'),
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
        client:clients!inner(
          id,
          name,
          type,
          tax_id,
          email
        )
      `, { count: 'exact' })
      .eq('company_id', company.id)

    // Apply filters
    if (filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.client_id) {
      query = query.eq('client_id', filters.client_id)
    }

    if (filters.date_from) {
      query = query.gte('issue_date', filters.date_from.toISOString().split('T')[0])
    }

    if (filters.date_to) {
      query = query.lte('issue_date', filters.date_to.toISOString().split('T')[0])
    }

    if (filters.search) {
      query = query.or(`invoice_number.ilike.%${filters.search}%,clients.name.ilike.%${filters.search}%`)
    }

    // Apply sorting
    const sortColumn = filters.sort_by === 'client' ? 'clients.name' : filters.sort_by
    query = query.order(sortColumn, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1)

    // Execute query
    const { data: invoices, error: invoicesError, count } = await query

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return NextResponse.json(
        { error: 'ინვოისების მიღება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // Return response with pagination info
    return NextResponse.json({
      invoices: invoices || [],
      pagination: {
        total: count || 0,
        limit: filters.limit,
        offset: filters.offset,
        page: Math.floor(filters.offset / filters.limit) + 1,
        totalPages: Math.ceil((count || 0) / filters.limit)
      }
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/invoices:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'კომპანია ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Check user credits
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (creditsError || !credits) {
      return NextResponse.json(
        { error: 'კრედიტების ინფორმაცია ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Check if user has available credits
    const availableCredits = credits.total_credits - credits.used_credits
    if (availableCredits <= 0) {
      return NextResponse.json(
        { error: 'არასაკმარისი კრედიტები' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { due_days, items, ...invoiceData } = body

    // Calculate due date if due_days is provided
    if (due_days) {
      const issueDate = invoiceData.issue_date ? new Date(invoiceData.issue_date) : new Date()
      const dueDate = new Date(issueDate)
      dueDate.setDate(dueDate.getDate() + due_days)
      invoiceData.due_date = dueDate
    }

    // Set company_id
    invoiceData.company_id = company.id

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => {
      const lineTotal = item.quantity * item.unit_price
      return sum + lineTotal
    }, 0)

    const vatRate = invoiceData.vat_rate ?? company.default_vat_rate ?? 18
    const vatAmount = subtotal * (vatRate / 100)
    const total = subtotal + vatAmount

    // Generate invoice number
    const currentYear = new Date().getFullYear()
    const nextCounter = (company.invoice_counter || 0) + 1
    const invoiceNumber = `${company.invoice_prefix || 'INV'}-${currentYear}-${String(nextCounter).padStart(4, '0')}`

    // Start transaction
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        invoice_number: invoiceNumber,
        subtotal: Math.round(subtotal * 100) / 100,
        vat_rate: vatRate,
        vat_amount: Math.round(vatAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
        status: 'draft'
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      return NextResponse.json(
        { error: 'ინვოისის შექმნა ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // Insert invoice items
    const invoiceItems = items.map((item: any, index: number) => ({
      invoice_id: invoice.id,
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
      // Rollback - delete the invoice
      await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id)

      console.error('Error creating invoice items:', itemsError)
      return NextResponse.json(
        { error: 'ინვოისის პროდუქტების შექმნა ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // Update company invoice counter
    const { error: counterError } = await supabase
      .from('companies')
      .update({ invoice_counter: nextCounter })
      .eq('id', company.id)

    if (counterError) {
      console.error('Error updating invoice counter:', counterError)
    }

    // Deduct credit
    const { error: creditError } = await supabase
      .from('user_credits')
      .update({ used_credits: credits.used_credits + 1 })
      .eq('user_id', user.id)

    if (creditError) {
      console.error('Error updating credits:', creditError)
    }

    // Fetch complete invoice with items
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
      .eq('id', invoice.id)
      .single()

    if (fetchError || !completeInvoice) {
      return NextResponse.json(invoice)
    }

    return NextResponse.json(completeInvoice, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in POST /api/invoices:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}