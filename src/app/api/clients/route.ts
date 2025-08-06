import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clientSchema } from '@/lib/validations/client'
import { z } from 'zod'

// Validation schema for listing clients
const listClientsSchema = z.object({
  search: z.string().max(100, 'ძებნის ტექსტი ძალიან გრძელია').optional(),
  type: z.enum(['all', 'individual', 'company']).default('all'),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
  sort_by: z.enum(['name', 'created_at', 'last_invoice_date']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
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
      search: searchParams.get('search') || undefined,
      type: searchParams.get('type') || 'all',
      status: searchParams.get('status') || 'all',
      limit: parseInt(searchParams.get('limit') || '10'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sort_by: searchParams.get('sort_by') || 'name',
      sort_order: searchParams.get('sort_order') || 'asc'
    }

    const validationResult = listClientsSchema.safeParse(filterData)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'არასწორი პარამეტრები', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const filters = validationResult.data

    // Build base query with statistics
    let query = supabase
      .from('clients')
      .select(`
        *,
        invoices:invoices(count)
      `, { count: 'exact' })
      .eq('company_id', company.id)

    // Apply filters
    if (filters.type !== 'all') {
      query = query.eq('type', filters.type)
    }

    if (filters.status === 'active') {
      query = query.eq('is_active', true)
    } else if (filters.status === 'inactive') {
      query = query.eq('is_active', false)
    }

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,tax_id.ilike.%${filters.search}%`
      )
    }

    // Apply sorting
    if (filters.sort_by === 'last_invoice_date') {
      // This requires a different approach - we'll sort by latest invoice date
      query = query.order('created_at', { ascending: filters.sort_order === 'asc' })
    } else {
      query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })
    }

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1)

    // Execute query
    const { data: clients, error: clientsError, count } = await query

    if (clientsError) {
      console.error('Error fetching clients:', clientsError)
      return NextResponse.json(
        { error: 'კლიენტების მიღება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // Get invoice statistics for each client
    const clientIds = clients?.map(c => c.id) || []
    
    if (clientIds.length > 0) {
      // Get invoice statistics
      const { data: invoiceStats } = await supabase
        .from('invoices')
        .select('client_id, total, status')
        .in('client_id', clientIds)
        .eq('company_id', company.id)

      // Calculate statistics for each client
      const clientStats = clientIds.reduce((acc, clientId) => {
        const clientInvoices = invoiceStats?.filter(inv => inv.client_id === clientId) || []
        const totalRevenue = clientInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)
        const totalInvoices = clientInvoices.length
        
        acc[clientId] = {
          total_invoices: totalInvoices,
          total_revenue: totalRevenue
        }
        return acc
      }, {} as Record<string, { total_invoices: number; total_revenue: number }>)

      // Merge statistics with client data
      const clientsWithStats = clients?.map(client => ({
        ...client,
        statistics: clientStats[client.id] || { total_invoices: 0, total_revenue: 0 }
      }))

      return NextResponse.json({
        clients: clientsWithStats || [],
        pagination: {
          total: count || 0,
          limit: filters.limit,
          offset: filters.offset,
          page: Math.floor(filters.offset / filters.limit) + 1,
          totalPages: Math.ceil((count || 0) / filters.limit)
        }
      })
    }

    return NextResponse.json({
      clients: clients || [],
      pagination: {
        total: count || 0,
        limit: filters.limit,
        offset: filters.offset,
        page: Math.floor(filters.offset / filters.limit) + 1,
        totalPages: Math.ceil((count || 0) / filters.limit)
      }
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/clients:', error)
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
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'კომპანია ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = clientSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'არასწორი მონაცემები', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const clientData = validationResult.data

    // Format phone number (remove spaces and special characters)
    if (clientData.phone) {
      clientData.phone = clientData.phone.replace(/[\s\-\(\)]/g, '')
    }

    // Check for unique email within company
    if (clientData.email) {
      const { data: existingEmail } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', company.id)
        .eq('email', clientData.email)
        .single()

      if (existingEmail) {
        return NextResponse.json(
          { error: 'კლიენტი ამ ელ.ფოსტით უკვე არსებობს' },
          { status: 409 }
        )
      }
    }

    // Check for unique tax_id within company
    if (clientData.tax_id) {
      const { data: existingTaxId } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', company.id)
        .eq('tax_id', clientData.tax_id)
        .single()

      if (existingTaxId) {
        return NextResponse.json(
          { error: 'კლიენტი ამ საიდენტიფიკაციო კოდით უკვე არსებობს' },
          { status: 409 }
        )
      }
    }

    // Type-specific validation
    if (clientData.type === 'company' && !clientData.tax_id) {
      return NextResponse.json(
        { error: 'იურიდიული პირისთვის საიდენტიფიკაციო კოდი სავალდებულოა' },
        { status: 400 }
      )
    }

    // Create client
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert({
        ...clientData,
        company_id: company.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating client:', createError)
      return NextResponse.json(
        { error: 'კლიენტის შექმნა ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    return NextResponse.json(newClient, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in POST /api/clients:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}