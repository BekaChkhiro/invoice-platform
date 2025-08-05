import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error_code = searchParams.get('error_code')
  const error_description = searchParams.get('error_description')

  console.log('🔄 Auth callback triggered:', {
    hasCode: !!code,
    errorCode: error_code,
    errorDescription: error_description,
    redirectUrl: `${origin}${next}`
  })

  // Handle error cases first
  if (error_code || error_description) {
    console.error('❌ Auth callback error:', { error_code, error_description })
    
    const errorMessage = error_description || 'Email confirmation failed'
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', errorMessage)
    
    return NextResponse.redirect(loginUrl.toString())
  }

  if (!code) {
    console.log('❌ No code provided in callback')
    return NextResponse.redirect(`${origin}/login?error=No authentication code provided`)
  }

  try {
    const supabase = await createClient()
    
    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('🔄 Code exchange result:', { 
      hasUser: !!data.user, 
      hasSession: !!data.session,
      emailConfirmed: data.user?.email_confirmed_at,
      error: error?.message 
    })
    
    if (error) {
      console.error('❌ Code exchange failed:', error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    if (!data.user || !data.session) {
      console.error('❌ No user or session after code exchange')
      return NextResponse.redirect(`${origin}/login?error=Authentication failed`)
    }

    const user = data.user
    console.log('✅ User authenticated:', {
      id: user.id,
      email: user.email,
      emailConfirmed: user.email_confirmed_at,
      createdAt: user.created_at
    })

    // Create user profile and credits if they don't exist
    await createUserProfileAndCredits(supabase, user)

    // Redirect to dashboard on successful authentication
    console.log('✅ Redirecting to dashboard')
    return NextResponse.redirect(`${origin}${next}`)

  } catch (error) {
    console.error('❌ Auth callback exception:', error)
    return NextResponse.redirect(`${origin}/login?error=Authentication failed`)
  }
}

/**
 * Create user profile and credits if they don't exist
 */
async function createUserProfileAndCredits(supabase: Awaited<ReturnType<typeof createClient>>, user: { id: string; email?: string }) {
  try {
    // Check if profile already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is expected for new users
      console.error('❌ Error checking existing profile:', profileCheckError)
      return
    }

    if (existingProfile) {
      console.log('👤 Profile already exists, skipping creation')
      return
    }

    console.log('👤 Creating new profile and credits for user:', user.id)
    
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('❌ Error creating profile:', profileError)
    } else {
      console.log('✅ Profile created successfully')
    }

    // Create user credits with 5 free credits
    const { error: creditsError } = await supabase
      .from('user_credits')
      .insert({
        user_id: user.id,
        total_credits: 5,
        used_credits: 0,
        plan_type: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (creditsError) {
      console.error('❌ Error creating user credits:', creditsError)
    } else {
      console.log('✅ User credits created successfully')
    }

  } catch (error) {
    console.error('❌ Error in createUserProfileAndCredits:', error)
  }
}