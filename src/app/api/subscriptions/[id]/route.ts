import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateSubscriptionRequest } from '@/types'
import { FlittClient } from '@/lib/flitt/client'

// GET /api/subscriptions/[id] - Get single subscription
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`[API] GET /api/subscriptions/[id] - STARTING for id: ${id}`);

    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.warn('[API] GET /api/subscriptions/[id] auth failed', { authError })
      return NextResponse.json(
        { error: 'არაავტორიზებული' },
        { status: 401 }
      )
    }
    console.log(`[API] GET /api/subscriptions/[id] - User authenticated: ${user.id}`);

    // Get user's company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (companyError || !company) {
      console.warn('[API] GET /api/subscriptions/[id] company not found for user', { userId: user.id, companyError });
      return NextResponse.json(
        { error: 'კომპანია ვერ მოიძებნა' },
        { status: 404 }
      )
    }
    console.log(`[API] GET /api/subscriptions/[id] - User company found: ${company.id}`);

    // First, find the subscription by ID to check for existence
    console.log(`[API] GET /api/subscriptions/[id] - Fetching subscription by id: ${id}`);
    const { data: subscriptionById, error: fetchError } = await supabase
      .from('client_subscriptions')
      .select('id, company_id')
      .eq('id', id)
      .single()

    if (fetchError || !subscriptionById) {
      console.warn('[API] GET /api/subscriptions/[id] not found by id', { id, error: fetchError })
      return NextResponse.json(
        { error: 'საბსქრიბშენი ვერ მოიძებნა' },
        { status: 404 }
      )
    }
    console.log(`[API] GET /api/subscriptions/[id] - Found subscription by id: ${subscriptionById.id}, company_id: ${subscriptionById.company_id}`);


    // Now, check if the subscription belongs to the user's company
    console.log(`[API] GET /api/subscriptions/[id] - Comparing company ids: userCompany=${company.id}, subCompany=${subscriptionById.company_id}`);
    if (subscriptionById.company_id !== company.id) {
      console.warn('[API] GET /api/subscriptions/[id] forbidden', { id, userCompanyId: company.id, subscriptionCompanyId: subscriptionById.company_id })
      return NextResponse.json(
        { error: 'წვდომა აკრძალულია' }, // Access denied
        { status: 403 }
      )
    }
    console.log(`[API] GET /api/subscriptions/[id] - Company ID check passed.`);

    // If everything is fine, fetch the full subscription data with proper joins
    console.log(`[API] GET /api/subscriptions/[id] - Fetching full subscription data for id: ${id}`);
    const { data: subscription, error } = await supabase
      .from('client_subscriptions')
      .select(`
        *,
        clients!client_id(id, name, email, type, phone)
      `)
      .eq('id', id)
      .single()

    if (error || !subscription) {
        // This should not happen if we already found it, but as a safeguard
      console.warn('[API] GET /api/subscriptions/[id] not found after check', { id, companyId: company.id, error })
      return NextResponse.json(
        { error: 'საბსქრიბშენი ვერ მოიძებნა' },
        { status: 404 }
      )
    }
    console.log('[API] GET /api/subscriptions/[id] success', { id: subscription.id, companyId: company.id })

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        client_id: subscription.client_id,
        client_name: subscription.clients?.name,
        client_email: subscription.clients?.email || subscription.client_email,
        client_type: subscription.clients?.type,
        client_phone: subscription.clients?.phone,
        service_name: subscription.service_name,
        description: subscription.description,
        amount: subscription.amount,
        currency: subscription.currency,
        billing_cycle: subscription.billing_cycle,
        status: subscription.status,
        start_date: subscription.start_date,
        next_billing_date: subscription.next_billing_date,
        cancelled_at: subscription.cancelled_at,
        created_at: subscription.created_at,
        updated_at: subscription.updated_at,
        public_token: subscription.public_token,
        auto_invoice: subscription.auto_invoice,
        flitt_subscription_id: subscription.flitt_subscription_id,
        flitt_payment_url: subscription.flitt_payment_url
      }
    })

  } catch (error) {
    console.error('[API] GET /api/subscriptions/[id] exception', error)
    return NextResponse.json(
      { error: 'სერვერის შიდა შეცდომა' },
      { status: 500 }
    )
  }
}

// PUT /api/subscriptions/[id] - Update subscription
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateSubscriptionRequest = await req.json()
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

    // Get existing subscription
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('client_subscriptions')
      .select('*, companies!inner(id, flitt_enabled)')
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (fetchError || !existingSubscription) {
      return NextResponse.json(
        { error: 'საბსქრიბშენი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Validate status change
    if (body.status && existingSubscription.status === 'cancelled' && body.status !== 'cancelled') {
      return NextResponse.json(
        { error: 'გაუქმებული საბსქრიბშენის სტატუსის შეცვლა შეუძლებელია' },
        { status: 400 }
      )
    }

    // Update subscription in database
    const updateData: any = {}
    
    if (body.service_name !== undefined) updateData.service_name = body.service_name
    if (body.description !== undefined) updateData.description = body.description
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.billing_cycle !== undefined) updateData.billing_cycle = body.billing_cycle
    if (body.auto_invoice !== undefined) updateData.auto_invoice = body.auto_invoice
    if (body.status !== undefined) updateData.status = body.status

    const { data: updatedSubscription, error: updateError } = await supabase
      .from('client_subscriptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return NextResponse.json(
        { error: 'საბსქრიბშენის განახლება ჩაიშალა' },
        { status: 500 }
      )
    }

    // Handle Flitt integration if status changed and Flitt is enabled
    if (body.status && existingSubscription.status !== body.status && 
        existingSubscription.companies.flitt_enabled && 
        existingSubscription.flitt_subscription_id) {
      
      const flittClient = await FlittClient.forCompany(existingSubscription.companies.id)
      
      if (flittClient) {
        try {
          let flittResponse
          
          switch (body.status) {
            case 'paused':
              flittResponse = await flittClient.pauseSubscription(existingSubscription.flitt_subscription_id)
              break
            case 'active':
              if (existingSubscription.status === 'paused') {
                flittResponse = await flittClient.resumeSubscription(existingSubscription.flitt_subscription_id)
              }
              break
            case 'cancelled':
              flittResponse = await flittClient.cancelSubscription(existingSubscription.flitt_subscription_id)
              // Set cancelled_at timestamp
              await supabase
                .from('client_subscriptions')
                .update({ cancelled_at: new Date().toISOString() })
                .eq('id', id)
              break
          }

          if (flittResponse && !flittResponse.success) {
            console.error('Flitt status update failed:', flittResponse.error)
            // Note: We don't fail the entire request since local update succeeded
          } else {
            console.log(`Flitt subscription ${existingSubscription.flitt_subscription_id} status updated to ${body.status}`)
          }
        } catch (error) {
          console.error('Error updating Flitt subscription status:', error)
        }
      }
    }

    return NextResponse.json({
      message: 'საბსქრიბშენი წარმატებით განახლდა',
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

// DELETE /api/subscriptions/[id] - Cancel subscription
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Get subscription details
    const { data: subscription, error: fetchError } = await supabase
      .from('client_subscriptions')
      .select('*, companies!inner(id, flitt_enabled)')
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'საბსქრიბშენი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { error: 'საბსქრიბშენი უკვე გაუქმებულია' },
        { status: 400 }
      )
    }

    // Cancel in Flitt first if enabled
    if (subscription.companies.flitt_enabled && subscription.flitt_subscription_id) {
      const flittClient = await FlittClient.forCompany(subscription.companies.id)
      
      if (flittClient) {
        const flittResponse = await flittClient.cancelSubscription(subscription.flitt_subscription_id)
        
        if (!flittResponse.success) {
          console.error('Failed to cancel Flitt subscription:', flittResponse.error)
          return NextResponse.json(
            { error: 'Flitt-ში საბსქრიბშენის გაუქმება ჩაიშალა' },
            { status: 500 }
          )
        }
        
        console.log(`Cancelled Flitt subscription: ${subscription.flitt_subscription_id}`)
      }
    }

    // Update subscription status to cancelled
    const { data: cancelledSubscription, error: cancelError } = await supabase
      .from('client_subscriptions')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (cancelError) {
      console.error('Error cancelling subscription:', cancelError)
      return NextResponse.json(
        { error: 'საბსქრიბშენის გაუქმება ჩაიშალა' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'საბსქრიბშენი წარმატებით გაუქმდა',
      subscription: cancelledSubscription
    })

  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'სერვერის შიდა შეცდომა' },
      { status: 500 }
    )
  }
}
