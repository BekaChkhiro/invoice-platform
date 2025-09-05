import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceSchema } from '@/lib/validations/service'
import { z } from 'zod'

// Validation schema for listing services
const listServicesSchema = z.object({
  search: z.string().max(100, 'ძებნის ტექსტი ძალიან გრძელია').optional(),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
  sort_by: z.enum(['name', 'default_price', 'created_at']).default('name'),
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
      status: searchParams.get('status') || 'all',
      limit: parseInt(searchParams.get('limit') || '10'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sort_by: searchParams.get('sort_by') || 'name',
      sort_order: searchParams.get('sort_order') || 'asc'
    }

    const validationResult = listServicesSchema.safeParse(filterData)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'არასწორი პარამეტრები', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const filters = validationResult.data

    // Build base query with usage statistics
    let query = supabase
      .from('services')
      .select(`
        *,
        invoice_items:invoice_items(count)
      `, { count: 'exact' })
      .eq('company_id', company.id)

    // Apply filters
    if (filters.status === 'active') {
      query = query.eq('is_active', true)
    } else if (filters.status === 'inactive') {
      query = query.eq('is_active', false)
    }

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      )
    }

    // Apply sorting
    query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1)

    // Execute query
    const { data: services, error: servicesError, count } = await query

    if (servicesError) {
      console.error('Error fetching services:', servicesError)
      return NextResponse.json(
        { error: 'სერვისების მიღება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // Get usage statistics for each service
    const serviceIds = services?.map(s => s.id) || []
    
    if (serviceIds.length > 0) {
      // Get invoice item statistics
      const { data: usageStats } = await supabase
        .from('invoice_items')
        .select(`
          service_id,
          line_total,
          invoice:invoices(total, status, created_at)
        `)
        .in('service_id', serviceIds)

      // Calculate statistics for each service
      const serviceStats = serviceIds.reduce((acc, serviceId) => {
        const serviceUsage = usageStats?.filter(item => item.service_id === serviceId) || []
        const totalRevenue = serviceUsage.reduce((sum, item) => sum + Number(item.line_total), 0)
        const timesUsed = serviceUsage.length
        
        acc[serviceId] = {
          times_used: timesUsed,
          total_revenue: totalRevenue
        }
        return acc
      }, {} as Record<string, { times_used: number; total_revenue: number }>)

      // Merge statistics with service data
      const servicesWithStats = services?.map(service => ({
        ...service,
        statistics: serviceStats[service.id] || { times_used: 0, total_revenue: 0 }
      }))

      return NextResponse.json({
        services: servicesWithStats || [],
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
      services: services || [],
      pagination: {
        total: count || 0,
        limit: filters.limit,
        offset: filters.offset,
        page: Math.floor(filters.offset / filters.limit) + 1,
        totalPages: Math.ceil((count || 0) / filters.limit)
      }
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/services:', error)
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
    const validationResult = serviceSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'არასწორი მონაცემები', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const serviceData = validationResult.data

    // Check for unique service name within company
    const { data: existingService } = await supabase
      .from('services')
      .select('id')
      .eq('company_id', company.id)
      .eq('name', serviceData.name)
      .single()

    if (existingService) {
      return NextResponse.json(
        { error: 'სერვისი ამ სახელით უკვე არსებობს' },
        { status: 409 }
      )
    }

    // Create service
    const { data: newService, error: createError } = await supabase
      .from('services')
      .insert({
        ...serviceData,
        company_id: company.id,
        is_active: serviceData.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating service:', createError)
      return NextResponse.json(
        { error: 'სერვისის შექმნა ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    return NextResponse.json(newService, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in POST /api/services:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}