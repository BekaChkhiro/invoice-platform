import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SearchParams {
  q?: string
  limit: number
  active_only: boolean
}

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
    const searchData: SearchParams = {
      q: searchParams.get('q') || undefined,
      limit: Math.min(parseInt(searchParams.get('limit') || '10'), 50),
      active_only: searchParams.get('active_only') === 'true'
    }

    // Build search query
    let query = supabase
      .from('services')
      .select('id, name, description, default_price, unit, is_active')
      .eq('company_id', company.id)

    // Add search filter if query is provided
    if (searchData.q && searchData.q.trim()) {
      query = query.or(`name.ilike.%${searchData.q}%, description.ilike.%${searchData.q}%`)
    }

    // Filter active services only if requested
    if (searchData.active_only) {
      query = query.eq('is_active', true)
    }

    // Apply limit and ordering
    query = query
      .order('name', { ascending: true })
      .limit(searchData.limit)

    // Execute query
    const { data: services, error: servicesError } = await query

    if (servicesError) {
      console.error('Error searching services:', servicesError)
      return NextResponse.json(
        { error: 'სერვისების ძიება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      services: services || [],
      total: services?.length || 0
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/services/search:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}