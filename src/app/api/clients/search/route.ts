import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const searchSchema = z.object({
  q: z.string().min(1, 'საძიებო ტექსტი აუცილებელია').max(50, 'საძიებო ტექსტი ძალიან გრძელია'),
  limit: z.number().min(1).max(20).default(10)
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
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    const validationResult = searchSchema.safeParse({ q: query, limit })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'არასწორი პარამეტრები', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { q: searchQuery, limit: searchLimit } = validationResult.data

    // Search clients by name or email
    const { data: clients, error: searchError } = await supabase
      .from('clients')
      .select('id, name, email, type, tax_id')
      .eq('company_id', company.id)
      .eq('is_active', true) // Only search active clients
      .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .order('name', { ascending: true })
      .limit(searchLimit)

    if (searchError) {
      console.error('Error searching clients:', searchError)
      return NextResponse.json(
        { error: 'კლიენტების ძებნა ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // Format results for autocomplete
    const results = (clients || []).map(client => ({
      id: client.id,
      name: client.name,
      email: client.email || '',
      type: client.type,
      display_name: client.type === 'company' && client.tax_id 
        ? `${client.name} (${client.tax_id})`
        : client.name,
      subtitle: client.email || (client.type === 'company' ? 'იურიდიული პირი' : 'ფიზიკური პირი')
    }))

    return NextResponse.json({
      results,
      query: searchQuery,
      count: results.length
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/clients/search:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}