import { NextRequest, NextResponse } from 'next/server'

interface AutomationRequest {
  action: 'process_subscriptions' | 'send_email' | 'test_automation'
  process_type?: 'billing' | 'notifications' | 'cleanup'
  email_type?: 'payment_confirmation' | 'payment_reminder' | 'subscription_created' | 'subscription_cancelled' | 'verification_code'
  subscription_id?: string
  client_email?: string
  client_name?: string
  company_name?: string
  verification_code?: string
  dry_run?: boolean
}

// POST /api/automation - Trigger automation processes
export async function POST(req: NextRequest) {
  try {
    const body: AutomationRequest = await req.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    let result: any

    switch (body.action) {
      case 'process_subscriptions':
        result = await triggerProcessSubscriptions(supabaseUrl, supabaseAnonKey, body)
        break
      
      case 'send_email':
        result = await triggerSendEmail(supabaseUrl, supabaseAnonKey, body)
        break
      
      case 'test_automation':
        result = await testAutomation(supabaseUrl, supabaseAnonKey)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      action: body.action,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in automation API:', error)
    return NextResponse.json(
      { error: 'Automation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Trigger subscription processing Edge Function
async function triggerProcessSubscriptions(supabaseUrl: string, supabaseAnonKey: string, body: AutomationRequest) {
  const functionUrl = `${supabaseUrl}/functions/v1/process-subscriptions`
  
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      process_type: body.process_type || 'billing',
      dry_run: body.dry_run || false
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Process subscriptions failed: ${error}`)
  }

  return await response.json()
}

// Trigger email sending Edge Function
async function triggerSendEmail(supabaseUrl: string, supabaseAnonKey: string, body: AutomationRequest) {
  const functionUrl = `${supabaseUrl}/functions/v1/send-invoice-email`
  
  const emailPayload: any = {
    type: body.email_type
  }

  if (body.subscription_id) emailPayload.subscription_id = body.subscription_id
  if (body.client_email) emailPayload.client_email = body.client_email
  if (body.client_name) emailPayload.client_name = body.client_name
  if (body.company_name) emailPayload.company_name = body.company_name
  if (body.verification_code) emailPayload.verification_code = body.verification_code

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailPayload)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Send email failed: ${error}`)
  }

  return await response.json()
}

// Test automation connectivity
async function testAutomation(supabaseUrl: string, supabaseAnonKey: string) {
  const tests = []

  // Test process-subscriptions function
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/process-subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        process_type: 'billing',
        dry_run: true
      })
    })
    
    tests.push({
      function: 'process-subscriptions',
      success: response.ok,
      status: response.status,
      result: response.ok ? await response.json() : await response.text()
    })
  } catch (error) {
    tests.push({
      function: 'process-subscriptions',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test send-invoice-email function
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-invoice-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'verification_code',
        client_email: 'test@example.com',
        client_name: 'Test User',
        company_name: 'Test Company',
        verification_code: 'TEST123'
      })
    })
    
    tests.push({
      function: 'send-invoice-email',
      success: response.ok,
      status: response.status,
      result: response.ok ? await response.json() : await response.text()
    })
  } catch (error) {
    tests.push({
      function: 'send-invoice-email',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return {
    tests,
    summary: {
      total: tests.length,
      passed: tests.filter(t => t.success).length,
      failed: tests.filter(t => !t.success).length
    }
  }
}

// GET /api/automation - Get automation status and logs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    // Basic automation status
    const status = {
      edge_functions_available: true,
      last_billing_run: null, // Would come from database
      last_notification_run: null, // Would come from database  
      last_cleanup_run: null, // Would come from database
      pending_subscriptions: 0, // Would query database
      pending_notifications: 0 // Would query database
    }

    if (action === 'health') {
      // Test connectivity to Edge Functions
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseAnonKey) {
        const healthCheck = await testAutomation(supabaseUrl, supabaseAnonKey)
        return NextResponse.json({
          status: 'healthy',
          edge_functions: healthCheck.summary,
          automation_status: status,
          timestamp: new Date().toISOString()
        })
      }
    }

    return NextResponse.json({
      automation_status: status,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting automation status:', error)
    return NextResponse.json(
      { error: 'Failed to get automation status' },
      { status: 500 }
    )
  }
}