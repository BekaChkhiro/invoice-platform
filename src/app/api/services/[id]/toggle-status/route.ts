import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get current service status
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, is_active')
      .eq('id', params.id)
      .eq('company_id', company.id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'სერვისი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Toggle status
    const { data: updatedService, error: updateError } = await supabase
      .from('services')
      .update({
        is_active: !service.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('company_id', company.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error toggling service status:', updateError)
      return NextResponse.json(
        { error: 'სერვისის სტატუსის შეცვლა ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedService)

  } catch (error) {
    console.error('Unexpected error in PATCH /api/services/[id]/toggle-status:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}