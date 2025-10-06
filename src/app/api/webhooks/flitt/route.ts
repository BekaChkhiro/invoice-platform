import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FlittClient, FlittPaymentNotification } from '@/lib/flitt/client'
import { decryptSecretKey } from '@/lib/flitt/api'

// POST /api/webhooks/flitt - Handle Flitt payment notifications
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const signature = req.headers.get('x-flitt-signature') || req.headers.get('flitt-signature')

    if (!signature) {
      console.error('Missing Flitt webhook signature')
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      )
    }

    // Extract merchant_id from the notification
    const notification: FlittPaymentNotification = body

    if (!notification.merchant_id || !notification.subscription_id) {
      console.error('Invalid webhook payload:', body)
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    // Find company by merchant_id
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, flitt_merchant_id, flitt_secret_key_encrypted, flitt_enabled')
      .eq('flitt_merchant_id', notification.merchant_id)
      .eq('flitt_enabled', true)
      .single()

    if (companyError || !company) {
      console.error('Company not found for merchant_id:', notification.merchant_id)
      return NextResponse.json(
        { error: 'Company not found or Flitt not enabled' },
        { status: 404 }
      )
    }

    // Decrypt and verify signature
    const secretKey = decryptSecretKey(company.flitt_secret_key_encrypted)
    if (!secretKey) {
      console.error('Failed to decrypt secret key for company:', company.id)
      return NextResponse.json(
        { error: 'Invalid configuration' },
        { status: 500 }
      )
    }

    const isValidSignature = FlittClient.verifyWebhookSignature(body, signature, secretKey)
    if (!isValidSignature) {
      console.error('Invalid webhook signature for company:', company.id)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Process the payment notification
    const result = await FlittClient.processPaymentNotification(notification, company.id)

    if (!result.success) {
      console.error('Failed to process payment notification:', result.error)
      return NextResponse.json(
        { error: result.error || 'Processing failed' },
        { status: 500 }
      )
    }

    // Log successful webhook processing
    console.log(`Successfully processed Flitt webhook for subscription: ${notification.subscription_id}`)

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully' 
    })

  } catch (error) {
    console.error('Error processing Flitt webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/webhooks/flitt - Webhook verification endpoint for Flitt
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get('challenge')
  
  if (challenge) {
    // Flitt webhook verification - echo back the challenge
    return new Response(challenge, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  }

  return NextResponse.json({ 
    message: 'Flitt webhook endpoint is active',
    timestamp: new Date().toISOString() 
  })
}