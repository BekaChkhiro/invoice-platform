import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/subscription/[token] - Get subscription details by public token
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = await createClient()
    const sessionToken = req.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Token სავალდებულოა' },
        { status: 400 }
      )
    }

    // Find subscription by public token (fetch subscription without joins first)
    const { data: subscription, error: subscriptionError } = await supabase
      .from('client_subscriptions')
      .select('*')
      .eq('public_token', token)
      .single()

    if (subscriptionError || !subscription) {
      console.error('[API] GET /api/subscription/[token] - Error or not found:', subscriptionError)
      return NextResponse.json(
        { error: 'საბსქრიბშენი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Fetch client and company details separately
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, email, type, phone')
      .eq('id', subscription.client_id)
      .single()

    const { data: company } = await supabase
      .from('companies')
      .select('id, name, email, phone')
      .eq('id', subscription.company_id)
      .single()

    // If session token provided, verify it
    if (sessionToken) {
      const { data: accessToken, error: tokenError } = await supabase
        .from('subscription_access_tokens')
        .select('*')
        .eq('subscription_id', subscription.id)
        .eq('session_token', sessionToken)
        .eq('verified', true)
        .single()

      if (tokenError || !accessToken) {
        return NextResponse.json(
          { error: 'არავალიდური session token' },
          { status: 401 }
        )
      }

      // Check if session is expired
      if (new Date() > new Date(accessToken.session_expires_at)) {
        return NextResponse.json(
          { error: 'Session-ის ვადა ამოიწურა' },
          { status: 401 }
        )
      }

      // Return full details for authenticated users
      return NextResponse.json({
        subscription: {
          id: subscription.id,
          service_name: subscription.service_name,
          description: subscription.description,
          amount: subscription.amount,
          billing_cycle: subscription.billing_cycle,
          status: subscription.status,
          start_date: subscription.start_date,
          next_billing_date: subscription.next_billing_date,
          cancelled_at: subscription.cancelled_at,
          created_at: subscription.created_at,
          auto_invoice: subscription.auto_invoice,
          flitt_payment_url: subscription.flitt_payment_url,
          client: client ? {
            id: client.id,
            name: client.name,
            email: client.email,
            type: client.type,
            phone: client.phone
          } : null,
          company: company ? {
            id: company.id,
            name: company.name,
            email: company.email,
            phone: company.phone
          } : null
        },
        authenticated: true
      })
    }

    // Return limited details for non-authenticated users
    return NextResponse.json({
      subscription: {
        service_name: subscription.service_name,
        description: subscription.description,
        amount: subscription.amount,
        billing_cycle: subscription.billing_cycle,
        status: subscription.status,
        client: client ? {
          name: client.name,
          type: client.type
        } : null,
        company: company ? {
          name: company.name
        } : null
      },
      authenticated: false,
      requires_verification: true,
      client_email_hint: client?.email ?
        client.email.replace(/(.{2}).*(@.*)/, '$1***$2') : null
    })

  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'სერვერის შიდა შეცდომა' },
      { status: 500 }
    )
  }
}

// PUT /api/subscription/[token] - Update subscription status (pause/resume)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = await createClient()
    const { action } = await req.json()
    const sessionToken = req.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token || !sessionToken) {
      return NextResponse.json(
        { error: 'Token და Authorization სავალდებულოა' },
        { status: 400 }
      )
    }

    if (!['pause', 'resume'].includes(action)) {
      return NextResponse.json(
        { error: 'მხოლოდ pause და resume მოქმედებები ნებადართულია' },
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

    // Verify session token
    const { data: accessToken, error: tokenError } = await supabase
      .from('subscription_access_tokens')
      .select('*')
      .eq('subscription_id', subscription.id)
      .eq('session_token', sessionToken)
      .eq('verified', true)
      .single()

    if (tokenError || !accessToken) {
      return NextResponse.json(
        { error: 'არავალიდური session token' },
        { status: 401 }
      )
    }

    // Check if session is expired
    if (new Date() > new Date(accessToken.session_expires_at)) {
      return NextResponse.json(
        { error: 'Session-ის ვადა ამოიწურა' },
        { status: 401 }
      )
    }

    // Check if subscription can be modified
    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { error: 'გაუქმებული საბსქრიბშენის სტატუსის შეცვლა შეუძლებელია' },
        { status: 400 }
      )
    }

    // Update subscription status
    const newStatus = action === 'pause' ? 'paused' : 'active'
    
    if (subscription.status === newStatus) {
      return NextResponse.json(
        { error: `საბსქრიბშენი უკვე ${newStatus === 'active' ? 'აქტიურია' : 'პაუზაზეა'}` },
        { status: 400 }
      )
    }

    const { data: updatedSubscription, error: updateError } = await supabase
      .from('client_subscriptions')
      .update({ status: newStatus })
      .eq('id', subscription.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return NextResponse.json(
        { error: 'საბსქრიბშენის განახლება ჩაიშალა' },
        { status: 500 }
      )
    }

    // Update access token usage
    await supabase
      .from('subscription_access_tokens')
      .update({
        used_count: (accessToken.used_count || 0) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', accessToken.id)

    return NextResponse.json({
      message: action === 'pause' ? 
        'საბსქრიბშენი წარმატებით შეჩერდა' : 
        'საბსქრიბშენი წარმატებით განახლდა',
      subscription: updatedSubscription
    })

  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'სერვერის შიდა შეცდომა' },
      { status: 500 }
    )
  }
}