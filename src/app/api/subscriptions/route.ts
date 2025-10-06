import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateSubscriptionRequest } from '@/types'
import { FlittClient } from '@/lib/flitt/client'
import crypto from 'crypto'

// Helper function to generate public access token
function generatePublicToken(): string {
  return crypto.randomBytes(16).toString('hex')
}

// Helper function to calculate next billing date
function calculateNextBillingDate(startDate: string, billingCycle: string): string {
  const date = new Date(startDate)
  
  switch (billingCycle) {
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'quarterly':
      date.setMonth(date.getMonth() + 3)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
    default:
      date.setMonth(date.getMonth() + 1) // Default to monthly
  }
  
  return date.toISOString()
}

// GET /api/subscriptions - List subscriptions with filtering
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const client_id = searchParams.get('client_id')
    const status = searchParams.get('status')
    const billing_cycle = searchParams.get('billing_cycle')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('client_subscriptions')
      .select(`
        *,
        clients!inner(id, name, email, type),
        companies!inner(id, name, email)
      `)

    // Apply filters
    if (client_id) {
      query = query.eq('client_id', client_id)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (billing_cycle && billing_cycle !== 'all') {
      query = query.eq('billing_cycle', billing_cycle)
    }

    // Add pagination and ordering
    const { data: subscriptions, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json(
        { error: 'საბსქრიბშენების ჩატვირთვა ჩაიშალა' },
        { status: 500 }
      )
    }

    // Transform data for response
    const transformedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      client_id: sub.client_id,
      client_name: sub.clients.name,
      client_email: sub.clients.email,
      client_type: sub.clients.type,
      service_name: sub.service_name,
      description: sub.description,
      amount: sub.amount,
      billing_cycle: sub.billing_cycle,
      status: sub.status,
      start_date: sub.start_date,
      next_billing_date: sub.next_billing_date,
      cancelled_at: sub.cancelled_at,
      created_at: sub.created_at,
      public_token: sub.public_token,
      auto_invoice: sub.auto_invoice,
      flitt_subscription_id: sub.flitt_subscription_id
    }))

    return NextResponse.json({
      subscriptions: transformedSubscriptions,
      count: subscriptions.length,
      offset,
      limit
    })

  } catch (error) {
    console.error('Error in subscriptions GET:', error)
    return NextResponse.json(
      { error: 'სერვერის შიდა შეცდომა' },
      { status: 500 }
    )
  }
}

// POST /api/subscriptions - Create new subscription
export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/subscriptions called')
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('Authentication failed:', authError)
      return NextResponse.json(
        { error: 'არაავტორიზებული' },
        { status: 401 }
      )
    }
    console.log('User authenticated:', user.id)

    const body: CreateSubscriptionRequest = await req.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    // Validate required fields
    if (!body.client_id || !body.service_name || !body.amount || body.amount <= 0) {
      console.log('Validation failed:', { client_id: body.client_id, service_name: body.service_name, amount: body.amount })
      return NextResponse.json(
        { error: 'client_id, service_name და დადებითი amount სავალდებულოა' },
        { status: 400 }
      )
    }

    // Get user's company first
    console.log('Looking up company for user:', user.id)
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, flitt_enabled')
      .eq('user_id', user.id)
      .single()

    if (companyError || !company) {
      console.log('Company lookup failed:', companyError)
      return NextResponse.json(
        { error: 'კომპანია ვერ მოიძებნა' },
        { status: 404 }
      )
    }
    console.log('Company found:', company)

    // Get client details - make sure client belongs to user's company
    console.log('Looking up client:', body.client_id, 'for company:', company.id)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', body.client_id)
      .eq('company_id', company.id)
      .single()

    if (clientError || !client) {
      console.log('Client lookup failed:', clientError)
      return NextResponse.json(
        { error: 'კლიენტი ვერ მოიძებნა ან არ გეკუთვნით' },
        { status: 404 }
      )
    }
    console.log('Client found:', client.name)

    const companyId = company.id
    const publicToken = generatePublicToken()
    const nextBillingDate = calculateNextBillingDate(body.start_date, body.billing_cycle)

    // Create subscription in database first
    console.log('Creating subscription with data:', {
      client_id: body.client_id,
      company_id: companyId,
      service_name: body.service_name,
      amount: body.amount,
      billing_cycle: body.billing_cycle || 'monthly',
      start_date: body.start_date,
      next_billing_date: nextBillingDate
    })
    
    const { data: subscription, error: subscriptionError } = await supabase
      .from('client_subscriptions')
      .insert({
        client_id: body.client_id,
        company_id: companyId,
        service_name: body.service_name,
        description: body.description,
        amount: body.amount,
        billing_cycle: body.billing_cycle || 'monthly',
        status: 'active',
        start_date: body.start_date,
        next_billing_date: nextBillingDate,
        public_token: publicToken,
        auto_invoice: body.auto_invoice !== false,
        client_email: client.email || ''
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError)
      return NextResponse.json(
        { error: 'საბსქრიბშენის შექმნა ჩაიშალა' },
        { status: 500 }
      )
    }
    console.log('Subscription created successfully:', subscription.id)

    // If Flitt is enabled for the company AND user wants to use it, create Flitt subscription
    let flittSubscriptionId: string | null = null
    console.log('Flitt integration check:', {
      company_flitt_enabled: company.flitt_enabled,
      use_flitt: body.use_flitt,
      will_create: company.flitt_enabled && body.use_flitt
    })

    if (company.flitt_enabled && body.use_flitt) {
      console.log('Creating Flitt subscription...')
      const flittClient = await FlittClient.forCompany(companyId)
      
      if (flittClient) {
        const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhooks/flitt`
        const successUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/subscription/${publicToken}?success=true`
        const cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/subscription/${publicToken}?cancelled=true`

        const flittResponse = await flittClient.createSubscription({
          merchant_id: '', // This will be set by FlittClient
          amount: body.amount,
          currency: 'GEL',
          billing_cycle: body.billing_cycle || 'monthly',
          customer_email: client.email || '',
          customer_name: client.name,
          description: body.service_name,
          callback_url: callbackUrl,
          success_redirect_url: successUrl,
          cancel_redirect_url: cancelUrl
        })

        if (flittResponse.success && flittResponse.subscription_id) {
          flittSubscriptionId = flittResponse.subscription_id
          
          // Update subscription with Flitt ID
          await supabase
            .from('client_subscriptions')
            .update({ 
              flitt_subscription_id: flittSubscriptionId,
              flitt_payment_url: flittResponse.payment_url
            })
            .eq('id', subscription.id)

          console.log(`Created Flitt subscription: ${flittSubscriptionId} for internal subscription: ${subscription.id}`)
        } else {
          console.error('Failed to create Flitt subscription:', flittResponse.error)
          // Don't fail the entire request - subscription was created locally
        }
      }
    }

    // Return success response
    return NextResponse.json({
      message: 'საბსქრიბშენი წარმატებით შეიქმნა',
      subscription: {
        ...subscription,
        flitt_subscription_id: flittSubscriptionId,
        client_name: client.name,
        client_email: client.email,
        client_type: client.type
      }
    })

  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'სერვერის შიდა შეცდომა' },
      { status: 500 }
    )
  }
}