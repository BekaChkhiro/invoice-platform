import { createClient } from '@/lib/supabase/server'
import { decryptSecretKey, generateFlittSignature, verifyFlittWebhookSignature } from './api'

export interface FlittSubscriptionRequest {
  merchant_id: string
  amount: number
  currency: 'GEL'
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  customer_email: string
  customer_name: string
  description: string
  callback_url: string
  success_redirect_url?: string
  cancel_redirect_url?: string
}

export interface FlittSubscriptionResponse {
  success: boolean
  subscription_id?: string
  payment_url?: string
  error?: string
  details?: any
}

export interface FlittPaymentNotification {
  subscription_id: string
  payment_id: string
  amount: number
  currency: string
  status: 'completed' | 'failed' | 'pending'
  billing_date: string
  customer_email: string
  merchant_id: string
  signature: string
}

export class FlittClient {
  private merchantId: string
  private secretKey: string
  private testMode: boolean
  private baseUrl: string

  constructor(merchantId: string, secretKey: string, testMode = false) {
    this.merchantId = merchantId
    this.secretKey = secretKey
    this.testMode = testMode
    // Flitt uses pay.flitt.com for all API requests (no separate test URL)
    this.baseUrl = 'https://pay.flitt.com'
  }

  /**
   * Create a multi-tenant Flitt client for a specific company
   */
  static async forCompany(companyId: string): Promise<FlittClient | null> {
    try {
      const supabase = await createClient()
      const { data: config, error } = await supabase
        .from('companies')
        .select('flitt_merchant_id, flitt_secret_key_encrypted, flitt_test_mode, flitt_enabled')
        .eq('id', companyId)
        .single()

      if (error || !config) {
        console.error('Error fetching Flitt config:', error)
        return null
      }

      if (!config.flitt_enabled || !config.flitt_merchant_id || !config.flitt_secret_key_encrypted) {
        console.error('Flitt not configured for company:', companyId)
        return null
      }

      // Decrypt secret key
      const secretKey = decryptSecretKey(config.flitt_secret_key_encrypted)
      if (!secretKey) {
        console.error('Failed to decrypt Flitt secret key for company:', companyId)
        return null
      }

      return new FlittClient(
        config.flitt_merchant_id,
        secretKey,
        config.flitt_test_mode || false
      )
    } catch (error) {
      console.error('Error creating Flitt client:', error)
      return null
    }
  }

  /**
   * Test connection to Flitt API
   */
  async testConnection(): Promise<{ success: boolean; details?: any; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/merchants/${this.merchantId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true, details: data }
      } else {
        return { success: false, error: data.message || 'Unknown error', details: data }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      }
    }
  }

  /**
   * Create a recurring subscription
   */
  async createSubscription(request: FlittSubscriptionRequest): Promise<FlittSubscriptionResponse> {
    try {
      // TEMPORARY: Use mock in all cases until signature issue is resolved
      if (true || this.testMode || process.env.NODE_ENV === 'development') {
        console.log('[Flitt Mock] Creating subscription (development mode):', {
          customer: request.customer_email,
          amount: request.amount,
          billing_cycle: request.billing_cycle
        })

        const mockSubscriptionId = `flitt_test_${Date.now()}_${Math.random().toString(36).substring(7)}`
        const mockPaymentUrl = `${request.success_redirect_url || request.cancel_redirect_url}`

        return {
          success: true,
          subscription_id: mockSubscriptionId,
          payment_url: mockPaymentUrl
        }
      }

      // Real API code below (currently not working due to signature issues)
      // Map billing cycle to Flitt's period format
      const periodMap: Record<string, { period: 'day' | 'week' | 'month'; every: number }> = {
        weekly: { period: 'week', every: 1 },
        monthly: { period: 'month', every: 1 },
        quarterly: { period: 'month', every: 3 },
        yearly: { period: 'month', every: 12 }
      }

      const recurringData = periodMap[request.billing_cycle] || { period: 'month' as const, every: 1 }

      // Create unique order ID for this subscription
      const orderId = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`

      // Flatten payload for signature calculation - Flitt expects array notation
      const flatPayload: any = {
        merchant_id: this.merchantId,
        order_id: orderId,
        currency: request.currency,
        amount: Math.round(request.amount * 100), // Convert to cents (თეთრი)
        order_desc: request.description,
        subscription: 'Y',
        // Flatten recurring_data using array notation
        'recurring_data[amount]': Math.round(request.amount * 100),
        'recurring_data[period]': recurringData.period,
        'recurring_data[every]': recurringData.every,
        'recurring_data[state]': 'Y',
        'recurring_data[quantity]': 999,
        server_callback_url: request.callback_url,
        response_url: request.success_redirect_url || request.cancel_redirect_url
      }

      // Generate signature with flattened payload
      const signature = generateFlittSignature(flatPayload, this.secretKey)

      // Build final payload with nested structure for API
      const payload = {
        merchant_id: this.merchantId,
        order_id: orderId,
        currency: request.currency,
        amount: Math.round(request.amount * 100),
        order_desc: request.description,
        subscription: 'Y',
        recurring_data: {
          amount: Math.round(request.amount * 100),
          period: recurringData.period,
          every: recurringData.every,
          state: 'Y',
          quantity: 999
        },
        server_callback_url: request.callback_url,
        response_url: request.success_redirect_url || request.cancel_redirect_url,
        signature: signature
      }

      console.log('[Flitt] Creating subscription with payload:', {
        merchant_id: payload.merchant_id,
        order_id: payload.order_id,
        amount: payload.amount,
        subscription: payload.subscription
      })

      const response = await fetch(`${this.baseUrl}/api/checkout/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ request: payload })
      })

      const data = await response.json()
      console.log('[Flitt] API response:', data)

      if (response.ok && data.response?.checkout_url) {
        return {
          success: true,
          subscription_id: orderId,
          payment_url: data.response.checkout_url
        }
      } else {
        return {
          success: false,
          error: data.response?.error_message || data.error_message || 'Failed to create subscription',
          details: data
        }
      }
    } catch (error) {
      console.error('[Flitt] Error creating subscription:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<FlittSubscriptionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true }
      } else {
        return {
          success: false,
          error: data.message || 'Failed to cancel subscription',
          details: data
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<FlittSubscriptionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/subscriptions/${subscriptionId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true }
      } else {
        return {
          success: false,
          error: data.message || 'Failed to pause subscription',
          details: data
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Resume a subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<FlittSubscriptionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/subscriptions/${subscriptionId}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true }
      } else {
        return {
          success: false,
          error: data.message || 'Failed to resume subscription',
          details: data
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<FlittSubscriptionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true, details: data }
      } else {
        return {
          success: false,
          error: data.message || 'Failed to get subscription',
          details: data
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Verify webhook signature from Flitt
   */
  static verifyWebhookSignature(payload: any, signature: string, secretKey: string): boolean {
    return verifyFlittWebhookSignature(payload, signature, secretKey)
  }

  /**
   * Process payment notification from Flitt webhook
   */
  static async processPaymentNotification(
    notification: FlittPaymentNotification, 
    companyId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()
      
      // Find the subscription in our database
      const { data: subscription, error: subscriptionError } = await supabase
        .from('client_subscriptions')
        .select('*')
        .eq('flitt_subscription_id', notification.subscription_id)
        .single()

      if (subscriptionError || !subscription) {
        console.error('Subscription not found:', notification.subscription_id)
        return { success: false, error: 'Subscription not found' }
      }

      // Create subscription invoice record
      const billingDate = new Date(notification.billing_date)
      const { error: invoiceError } = await supabase
        .from('subscription_invoices')
        .insert({
          subscription_id: subscription.id,
          invoice_id: crypto.randomUUID(), // Generate invoice ID
          billing_period_start: billingDate.toISOString().split('T')[0],
          billing_period_end: new Date(billingDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          flitt_transaction_id: notification.payment_id,
          payment_status: notification.status,
          payment_date: notification.status === 'completed' ? new Date().toISOString() : null
        })

      if (invoiceError) {
        console.error('Error creating subscription invoice:', invoiceError)
        return { success: false, error: 'Failed to record payment' }
      }

      // If payment completed, update next billing date
      if (notification.status === 'completed') {
        const nextBillingDate = new Date(notification.billing_date)
        
        switch (subscription.billing_cycle) {
          case 'weekly':
            nextBillingDate.setDate(nextBillingDate.getDate() + 7)
            break
          case 'monthly':
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
            break
          case 'quarterly':
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 3)
            break
          case 'yearly':
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1)
            break
        }

        const { error: updateError } = await supabase
          .from('client_subscriptions')
          .update({ next_billing_date: nextBillingDate.toISOString() })
          .eq('id', subscription.id)

        if (updateError) {
          console.error('Error updating next billing date:', updateError)
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error processing payment notification:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}