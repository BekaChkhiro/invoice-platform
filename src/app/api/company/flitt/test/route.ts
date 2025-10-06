import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FlittClient } from '@/lib/flitt/client'

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

    if (companyError) {
      return NextResponse.json(
        { error: 'კომპანია ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Create Flitt client for this company
    const flittClient = await FlittClient.forCompany(company.id)
    if (!flittClient) {
      return NextResponse.json(
        { error: 'Flitt კონფიგურაცია არ არის დაყენებული' },
        { status: 400 }
      )
    }

    // Test connection
    const testResult = await flittClient.testConnection()
    
    // Update last test timestamp
    await supabase
      .from('companies')
      .update({ 
        flitt_last_test_at: new Date().toISOString(),
        flitt_enabled: testResult.success // Enable if test succeeds
      })
      .eq('id', company.id)

    if (testResult.success) {
      return NextResponse.json({ 
        success: true,
        message: 'Flitt კავშირი წარმატებულია',
        details: testResult.details
      })
    } else {
      return NextResponse.json({ 
        success: false,
        error: testResult.error || 'კავშირის ტესტი ჩაიშალა',
        details: testResult.details
      })
    }

  } catch (error) {
    console.error('Unexpected error in POST /api/company/flitt/test:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}