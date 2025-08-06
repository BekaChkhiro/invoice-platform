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

    // Get user credits
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (creditsError) {
      // If no credits record exists, create one with default values
      if (creditsError.code === 'PGRST116') {
        const { data: newCredits, error: createError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            total_credits: 5,
            used_credits: 0,
            plan_type: 'free'
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating user credits:', createError)
          return NextResponse.json(
            { error: 'კრედიტების ინფორმაციის შექმნა ვერ მოხერხდა' },
            { status: 500 }
          )
        }

        return NextResponse.json(newCredits)
      }

      console.error('Error fetching user credits:', creditsError)
      return NextResponse.json(
        { error: 'კრედიტების ინფორმაციის მიღება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    return NextResponse.json(credits)

  } catch (error) {
    console.error('Unexpected error in GET /api/user/credits:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}