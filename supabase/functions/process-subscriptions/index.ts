import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessSubscriptionsRequest {
  process_type: 'billing' | 'notifications' | 'cleanup'
  dry_run?: boolean
}

interface SubscriptionRecord {
  id: string
  client_id: string
  company_id: string
  service_name: string
  amount: number
  billing_cycle: string
  status: string
  next_billing_date: string
  auto_invoice: boolean
  flitt_subscription_id?: string
  clients: {
    name: string
    email: string
    type: string
  }
  companies: {
    name: string
    email: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { process_type, dry_run = false }: ProcessSubscriptionsRequest = await req.json()

    console.log(`Processing subscriptions: ${process_type}, dry_run: ${dry_run}`)

    let results = {}

    switch (process_type) {
      case 'billing':
        results = await processBilling(supabase, dry_run)
        break
      case 'notifications':
        results = await processNotifications(supabase, dry_run)
        break
      case 'cleanup':
        results = await processCleanup(supabase, dry_run)
        break
      default:
        throw new Error('Invalid process_type')
    }

    return new Response(
      JSON.stringify({
        success: true,
        process_type,
        dry_run,
        results,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error processing subscriptions:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// Process billing - create invoices for due subscriptions
async function processBilling(supabase: any, dryRun: boolean) {
  const today = new Date().toISOString().split('T')[0]
  
  // Find subscriptions due for billing
  const { data: dueSubscriptions, error } = await supabase
    .from('client_subscriptions')
    .select(`
      *,
      clients!inner(name, email, type),
      companies!inner(name, email)
    `)
    .eq('status', 'active')
    .eq('auto_invoice', true)
    .lte('next_billing_date', `${today}T23:59:59.999Z`)

  if (error) {
    throw new Error(`Error fetching due subscriptions: ${error.message}`)
  }

  const results = {
    due_subscriptions: dueSubscriptions.length,
    processed: 0,
    invoices_created: 0,
    errors: []
  }

  console.log(`Found ${dueSubscriptions.length} subscriptions due for billing`)

  for (const subscription of dueSubscriptions as SubscriptionRecord[]) {
    try {
      if (!dryRun) {
        // Calculate next billing date
        const nextBillingDate = calculateNextBillingDate(
          subscription.next_billing_date, 
          subscription.billing_cycle
        )

        // Create invoice record (if auto_invoice enabled)
        // First, create an actual invoice in the invoices table
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('invoice_prefix, invoice_counter')
          .eq('id', subscription.company_id)
          .single()

        if (companyError) {
          results.errors.push(`Company fetch failed for subscription ${subscription.id}: ${companyError.message}`)
          continue
        }

        const invoiceNumber = `${company.invoice_prefix || 'INV'}-${String(company.invoice_counter + 1).padStart(5, '0')}`

        // Calculate due date (14 days from now)
        const dueDate = new Date(subscription.next_billing_date)
        dueDate.setDate(dueDate.getDate() + 14)

        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            company_id: subscription.company_id,
            client_id: subscription.client_id,
            invoice_number: invoiceNumber,
            issue_date: subscription.next_billing_date,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'sent',
            subtotal: subscription.amount,
            vat_rate: 0,
            vat_amount: 0,
            total: subscription.amount,
            currency: 'GEL',
            notes: `საბსქრიფშენი: ${subscription.service_name}`
          })
          .select()
          .single()

        if (invoiceError) {
          results.errors.push(`Invoice creation failed for subscription ${subscription.id}: ${invoiceError.message}`)
          continue
        }

        // Add invoice item
        await supabase
          .from('invoice_items')
          .insert({
            invoice_id: invoice.id,
            description: subscription.service_name + (subscription.description ? ` - ${subscription.description}` : ''),
            quantity: 1,
            unit_price: subscription.amount,
            line_total: subscription.amount
          })

        // Update company invoice counter
        await supabase
          .from('companies')
          .update({ invoice_counter: company.invoice_counter + 1 })
          .eq('id', subscription.company_id)

        // Create subscription invoice record linking to the actual invoice
        const { error: subInvoiceError } = await supabase
          .from('subscription_invoices')
          .insert({
            subscription_id: subscription.id,
            invoice_id: invoice.id,
            billing_period_start: subscription.next_billing_date,
            billing_period_end: calculateNextBillingDate(subscription.next_billing_date, subscription.billing_cycle).split('T')[0],
            payment_status: 'pending'
          })

        if (subInvoiceError) {
          results.errors.push(`Subscription invoice link failed for subscription ${subscription.id}: ${subInvoiceError.message}`)
          // Don't continue - invoice was created successfully
        }

        // Update next billing date
        const { error: updateError } = await supabase
          .from('client_subscriptions')
          .update({ next_billing_date: nextBillingDate })
          .eq('id', subscription.id)

        if (updateError) {
          results.errors.push(`Next billing date update failed for subscription ${subscription.id}: ${updateError.message}`)
          continue
        }

        results.invoices_created++
      }

      results.processed++
      
      console.log(`Processed subscription ${subscription.id} - ${subscription.service_name}`)
      
    } catch (error) {
      results.errors.push(`Processing failed for subscription ${subscription.id}: ${error.message}`)
    }
  }

  return results
}

// Process notifications - send email reminders, confirmations, etc.
async function processNotifications(supabase: any, dryRun: boolean) {
  const results = {
    payment_confirmations: 0,
    upcoming_payment_reminders: 0,
    failed_payment_notifications: 0,
    errors: []
  }

  // Get recent successful payments (last 24 hours) for confirmations
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const { data: recentPayments, error: paymentsError } = await supabase
    .from('subscription_invoices')
    .select(`
      *,
      client_subscriptions!inner(
        service_name,
        clients!inner(name, email),
        companies!inner(name, email)
      )
    `)
    .eq('status', 'completed')
    .gte('payment_date', yesterday.toISOString())
    .is('notification_sent', false)

  if (paymentsError) {
    results.errors.push(`Error fetching recent payments: ${paymentsError.message}`)
  } else {
    for (const payment of recentPayments) {
      try {
        if (!dryRun) {
          // TODO: Send payment confirmation email
          console.log(`Would send payment confirmation for ${payment.id} to ${payment.client_subscriptions.clients.email}`)
          
          // Mark notification as sent
          await supabase
            .from('subscription_invoices')
            .update({ notification_sent: true })
            .eq('id', payment.id)
        }
        
        results.payment_confirmations++
      } catch (error) {
        results.errors.push(`Notification failed for payment ${payment.id}: ${error.message}`)
      }
    }
  }

  // Get upcoming payments (next 3 days) for reminders
  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

  const { data: upcomingSubscriptions, error: upcomingError } = await supabase
    .from('client_subscriptions')
    .select(`
      *,
      clients!inner(name, email),
      companies!inner(name, email)
    `)
    .eq('status', 'active')
    .lte('next_billing_date', threeDaysFromNow.toISOString())
    .gte('next_billing_date', new Date().toISOString())

  if (upcomingError) {
    results.errors.push(`Error fetching upcoming subscriptions: ${upcomingError.message}`)
  } else {
    for (const subscription of upcomingSubscriptions) {
      try {
        if (!dryRun) {
          // TODO: Send upcoming payment reminder
          console.log(`Would send payment reminder for ${subscription.id} to ${subscription.clients.email}`)
        }
        
        results.upcoming_payment_reminders++
      } catch (error) {
        results.errors.push(`Reminder failed for subscription ${subscription.id}: ${error.message}`)
      }
    }
  }

  return results
}

// Process cleanup - clean old access tokens, expired sessions, etc.
async function processCleanup(supabase: any, dryRun: boolean) {
  const results = {
    expired_tokens_cleaned: 0,
    old_sessions_cleaned: 0,
    errors: []
  }

  // Clean expired access tokens (older than 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  try {
    if (!dryRun) {
      const { count: expiredTokensCount, error: tokenError } = await supabase
        .from('subscription_access_tokens')
        .delete()
        .lt('expires_at', sevenDaysAgo.toISOString())

      if (tokenError) {
        results.errors.push(`Error cleaning expired tokens: ${tokenError.message}`)
      } else {
        results.expired_tokens_cleaned = expiredTokensCount || 0
      }
    } else {
      // Count what would be deleted
      const { count } = await supabase
        .from('subscription_access_tokens')
        .select('*', { count: 'exact', head: true })
        .lt('expires_at', sevenDaysAgo.toISOString())
        
      results.expired_tokens_cleaned = count || 0
    }
  } catch (error) {
    results.errors.push(`Token cleanup failed: ${error.message}`)
  }

  // Clean old sessions (older than 30 days and not used)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  try {
    if (!dryRun) {
      const { count: oldSessionsCount, error: sessionError } = await supabase
        .from('subscription_access_tokens')
        .delete()
        .lt('session_expires_at', thirtyDaysAgo.toISOString())
        .lt('last_used_at', thirtyDaysAgo.toISOString())

      if (sessionError) {
        results.errors.push(`Error cleaning old sessions: ${sessionError.message}`)
      } else {
        results.old_sessions_cleaned = oldSessionsCount || 0
      }
    } else {
      // Count what would be deleted
      const { count } = await supabase
        .from('subscription_access_tokens')
        .select('*', { count: 'exact', head: true })
        .lt('session_expires_at', thirtyDaysAgo.toISOString())
        .lt('last_used_at', thirtyDaysAgo.toISOString())
        
      results.old_sessions_cleaned = count || 0
    }
  } catch (error) {
    results.errors.push(`Session cleanup failed: ${error.message}`)
  }

  return results
}

// Helper function to calculate next billing date
function calculateNextBillingDate(currentDate: string, billingCycle: string): string {
  const date = new Date(currentDate)
  
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