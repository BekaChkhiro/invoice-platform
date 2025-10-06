import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// POST /api/subscription/access - Request access to subscription management
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { token, email } = await req.json()

    console.log('[API] POST /api/subscription/access - Request:', { token, email })

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token და email სავალდებულოა' },
        { status: 400 }
      )
    }

    // Find subscription by public token
    const { data: subscription, error: subscriptionError } = await supabase
      .from('client_subscriptions')
      .select(`
        *,
        clients!inner(id, name, email, type)
      `)
      .eq('public_token', token)
      .single()

    console.log('[API] POST /api/subscription/access - Subscription lookup:', {
      found: !!subscription,
      error: subscriptionError,
      clientEmail: subscription?.clients?.email
    })

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'საბსქრიბშენი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Check if client has email
    if (!subscription.clients.email || subscription.clients.email.trim() === '') {
      console.log('[API] POST /api/subscription/access - Client has no email')
      return NextResponse.json(
        { error: 'კლიენტს არ აქვს ელფოსტა მითითებული. გთხოვთ დაუკავშირდეთ კომპანიას.' },
        { status: 400 }
      )
    }

    // Verify email matches client email
    console.log('[API] POST /api/subscription/access - Email comparison:', {
      provided: email.toLowerCase(),
      client: subscription.clients.email.toLowerCase()
    })

    if (subscription.clients.email.toLowerCase() !== email.toLowerCase()) {
      console.log('[API] POST /api/subscription/access - Email mismatch')
      return NextResponse.json(
        { error: 'ელფოსტა არ ემთხვევა საბსქრიბშენის მფლობელს' },
        { status: 403 }
      )
    }

    // Generate verification code
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15) // 15 minutes

    // Save or update access token
    const { data: existingToken } = await supabase
      .from('subscription_access_tokens')
      .select('id')
      .eq('subscription_id', subscription.id)
      .eq('email', email.toLowerCase())
      .single()

    if (existingToken) {
      // Update existing token
      const { error: updateError } = await supabase
        .from('subscription_access_tokens')
        .update({
          verification_code: verificationCode,
          expires_at: expiresAt.toISOString(),
          verified: false,
          used_count: 0
        })
        .eq('id', existingToken.id)

      if (updateError) {
        console.error('Error updating access token:', updateError)
        return NextResponse.json(
          { error: 'Access token-ის განახლება ჩაიშალა' },
          { status: 500 }
        )
      }
    } else {
      // Create new access token
      const { error: insertError } = await supabase
        .from('subscription_access_tokens')
        .insert({
          subscription_id: subscription.id,
          email: email.toLowerCase(),
          verification_code: verificationCode,
          expires_at: expiresAt.toISOString(),
          verified: false,
          used_count: 0
        })

      if (insertError) {
        console.error('Error creating access token:', insertError)
        return NextResponse.json(
          { error: 'Access token-ის შექმნა ჩაიშალა' },
          { status: 500 }
        )
      }
    }

    // TODO: Send verification email (Phase 6)
    // For now, we'll just return the code for development
    console.log(`Verification code for ${email}: ${verificationCode}`)

    return NextResponse.json({
      message: 'ვერიფიკაციის კოდი გაიგზავნა თქვენს ელფოსტაზე',
      // Remove this in production - only for development
      dev_code: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    })

  } catch (error) {
    console.error('Error in subscription access:', error)
    return NextResponse.json(
      { error: 'სერვერის შიდა შეცდომა' },
      { status: 500 }
    )
  }
}

// PUT /api/subscription/access - Verify email with code
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { token, email, code } = await req.json()

    if (!token || !email || !code) {
      return NextResponse.json(
        { error: 'Token, email და code სავალდებულოა' },
        { status: 400 }
      )
    }

    // Find subscription by public token
    const { data: subscription, error: subscriptionError } = await supabase
      .from('client_subscriptions')
      .select('*')
      .eq('public_token', token)
      .single()

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'საბსქრიბშენი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Find and verify access token
    const { data: accessToken, error: tokenError } = await supabase
      .from('subscription_access_tokens')
      .select('*')
      .eq('subscription_id', subscription.id)
      .eq('email', email.toLowerCase())
      .eq('verification_code', code.toUpperCase())
      .single()

    if (tokenError || !accessToken) {
      return NextResponse.json(
        { error: 'ვერიფიკაციის კოდი არასწორია' },
        { status: 401 }
      )
    }

    // Check if code is expired
    if (new Date() > new Date(accessToken.expires_at)) {
      return NextResponse.json(
        { error: 'ვერიფიკაციის კოდის ვადა ამოიწურა' },
        { status: 401 }
      )
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const sessionExpiresAt = new Date()
    sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 24) // 24 hours

    // Update access token
    const { error: updateError } = await supabase
      .from('subscription_access_tokens')
      .update({
        verified: true,
        session_token: sessionToken,
        session_expires_at: sessionExpiresAt.toISOString(),
        used_count: (accessToken.used_count || 0) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', accessToken.id)

    if (updateError) {
      console.error('Error updating access token:', updateError)
      return NextResponse.json(
        { error: 'Session-ის შექმნა ჩაიშალა' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      session_token: sessionToken,
      expires_at: sessionExpiresAt.toISOString(),
      message: 'წარმატებით ავტორიზირდით'
    })

  } catch (error) {
    console.error('Error in subscription verification:', error)
    return NextResponse.json(
      { error: 'სერვერის შიდა შეცდომა' },
      { status: 500 }
    )
  }
}