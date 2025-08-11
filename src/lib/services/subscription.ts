import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { SubscriptionFormData, PaymentFormData, CancellationFormData, UsageFilter } from '@/lib/validations/subscription'
import type { 
  SubscriptionPlan, 
  UserSubscription, 
  PaymentRecord, 
  UsageLog, 
  UsageStats,
  PlanUpgradeRequest,
  SubscriptionCancellationRequest 
} from '@/types/subscription'

export const subscriptionService = {
  async getAvailablePlans() {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data as SubscriptionPlan[]
  },

  async getCurrentUserPlan(userId: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No active subscription found, assign FREE plan
        return await this.assignFreePlan(userId)
      }
      throw error
    }
    
    return data as UserSubscription & { plan: SubscriptionPlan }
  },

  async assignFreePlan(userId: string) {
    const supabase = createClient()
    
    try {
      // Get FREE plan
      const { data: freePlan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', 'FREE')
        .single()
      
      if (planError) throw planError
      
      // Create subscription for user
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: freePlan.id,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          auto_renew: false
        })
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .single()
      
      if (error) throw error
      
      return data as UserSubscription & { plan: SubscriptionPlan }
    } catch (error) {
      console.error('Error assigning free plan:', error)
      return null
    }
  },

  async checkInvoiceLimit(userId: string) {
    // No limits - all features are unlimited
    return {
      allowed: true,
      reason: 'Unlimited access',
      remaining: null,
      used: 0,
      limit: null
    }
  },

  async upgradePlan(userId: string, planId: string) {
    const supabase = createClient()
    
    try {
      const currentSubscription = await this.getCurrentUserPlan(userId)
      
      if (!currentSubscription) {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancel_at_period_end: false
          })
          .select()
          .single()
        
        if (error) throw error
        return data
      }
      
      if (currentSubscription.status === 'cancelled') {
        throw new Error('Cannot upgrade a cancelled subscription. Please reactivate first.')
      }
      
      const { data: newPlan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single()
      
      if (planError) throw planError
      
      const { data: currentPlan, error: currentPlanError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', currentSubscription.plan_id)
        .single()
      
      if (currentPlanError) throw currentPlanError
      
      const prorateAmount = this.calculateProration(
        currentPlan.price_monthly,
        newPlan.price_monthly,
        currentSubscription.current_period_start,
        currentSubscription.current_period_end
      )
      
      const { data: payment, error: paymentError } = await supabase
        .from('payment_records')
        .insert({
          subscription_id: currentSubscription.id,
          user_id: userId,
          amount: prorateAmount,
          currency: newPlan.currency,
          status: 'pending',
          metadata: {
            type: 'upgrade',
            from_plan: currentSubscription.plan_id,
            to_plan: planId
          }
        })
        .select()
        .single()
      
      if (paymentError) throw paymentError
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          plan_id: planId,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSubscription.id)
        .select()
        .single()
      
      if (error) throw error
      
      await supabase
        .from('payment_records')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString()
        })
        .eq('id', payment.id)
      
      await this.logUsage(userId, 'update', 'subscription', planId, {
        action: 'upgrade',
        from_plan: currentSubscription.plan_id,
        to_plan: planId
      })
      
      return data
    } catch (error) {
      console.error('Error upgrading plan:', error)
      throw error
    }
  },

  async cancelSubscription(userId: string) {
    const supabase = createClient()
    
    try {
      const subscription = await this.getCurrentUserPlan(userId)
      
      if (!subscription) {
        throw new Error('No active subscription found')
      }
      
      if (subscription.status === 'cancelled' || subscription.cancel_at_period_end) {
        throw new Error('Subscription is already cancelled')
      }
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: true,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)
        .select()
        .single()
      
      if (error) throw error
      
      await this.logUsage(userId, 'update', 'subscription', subscription.id, {
        action: 'cancel',
        cancel_at_period_end: true
      })
      
      return data
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }
  },

  async getUsageStats(userId: string, period?: UsageFilter) {
    const supabase = createClient()
    
    try {
      let startDate: Date
      let endDate: Date
      
      if (period?.start_date && period?.end_date) {
        startDate = new Date(period.start_date)
        endDate = new Date(period.end_date)
      } else {
        const now = new Date()
        endDate = now
        
        switch (period?.period || 'month') {
          case 'day':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'quarter':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            break
          case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            break
          case 'month':
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      }
      
      let query = supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (period?.resource_type && period.resource_type !== 'all') {
        query = query.eq('resource_type', period.resource_type)
      }
      
      if (period?.action && period.action !== 'all') {
        query = query.eq('action', period.action)
      }
      
      const { data: logs, error } = await query
      
      if (error) throw error
      
      const { data: invoiceStats, error: invoiceError } = await supabase
        .from('invoices')
        .select('total_amount', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (invoiceError) throw invoiceError
      
      const { data: clientCount, error: clientError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (clientError) throw clientError
      
      const { data: productCount, error: productError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (productError) throw productError
      
      const invoicesCreated = logs.filter(l => l.resource_type === 'invoice' && l.action === 'create').length
      const invoicesSent = logs.filter(l => l.resource_type === 'invoice' && l.action === 'send').length
      const totalRevenue = invoiceStats?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
      
      const stats: UsageStats = {
        period_start: startDate.toISOString(),
        period_end: endDate.toISOString(),
        invoices_created: invoicesCreated,
        invoices_sent: invoicesSent,
        clients_added: clientCount || 0,
        products_added: productCount || 0,
        total_revenue: totalRevenue,
        storage_used_mb: 0,
        api_calls: logs.filter(l => l.metadata?.source === 'api').length,
        team_members_active: 0
      }
      
      return stats
    } catch (error) {
      console.error('Error getting usage stats:', error)
      throw error
    }
  },

  async logUsage(
    userId: string, 
    action: UsageLog['action'], 
    resourceType: UsageLog['resource_type'], 
    resourceId?: string | null,
    metadata?: Record<string, any> | null
  ) {
    const supabase = createClient()
    
    try {
      const subscription = await this.getCurrentUserPlan(userId)
      
      const { data, error } = await supabase
        .from('usage_logs')
        .insert({
          user_id: userId,
          subscription_id: subscription?.id || null,
          action,
          resource_type: resourceType,
          resource_id: resourceId || null,
          metadata: metadata || null
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error logging usage:', error)
      return null
    }
  },

  async checkFeatureAccess(userId: string, feature: keyof PlanFeatures) {
    try {
      const subscription = await this.getCurrentUserPlan(userId)
      
      if (!subscription || !subscription.plan) {
        return false
      }
      
      const featureValue = subscription.plan.features[feature]
      
      if (typeof featureValue === 'boolean') {
        return featureValue
      }
      
      if (typeof featureValue === 'number') {
        return featureValue > 0
      }
      
      return featureValue !== null
    } catch (error) {
      console.error('Error checking feature access:', error)
      return false
    }
  },

  async getPaymentHistory(userId: string, limit = 10) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('payment_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data as PaymentRecord[]
  },

  async processPayment(userId: string, paymentData: PaymentFormData) {
    const supabase = createClient()
    
    try {
      const subscription = await this.getCurrentUserPlan(userId)
      
      if (!subscription) {
        throw new Error('No active subscription found')
      }
      
      const { data, error } = await supabase
        .from('payment_records')
        .insert({
          subscription_id: subscription.id,
          user_id: userId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: 'pending',
          payment_method: paymentData.payment_method,
          metadata: {
            payment_details: paymentData.payment_method === 'card' 
              ? { last4: paymentData.card_details?.number.slice(-4) }
              : paymentData.payment_method === 'bank_transfer'
              ? { bank_name: paymentData.bank_details?.bank_name }
              : { paypal_email: paymentData.paypal_email }
          }
        })
        .select()
        .single()
      
      if (error) throw error
      
      setTimeout(async () => {
        await supabase
          .from('payment_records')
          .update({
            status: 'completed',
            paid_at: new Date().toISOString()
          })
          .eq('id', data.id)
      }, 1000)
      
      return data
    } catch (error) {
      console.error('Error processing payment:', error)
      throw error
    }
  },

  calculateProration(
    currentPrice: number,
    newPrice: number,
    periodStart: string,
    periodEnd: string
  ): number {
    const now = Date.now()
    const start = new Date(periodStart).getTime()
    const end = new Date(periodEnd).getTime()
    
    const totalDays = (end - start) / (1000 * 60 * 60 * 24)
    const remainingDays = (end - now) / (1000 * 60 * 60 * 24)
    const usedDays = totalDays - remainingDays
    
    const currentCost = (currentPrice / totalDays) * usedDays
    const newCost = (newPrice / totalDays) * remainingDays
    
    return Math.max(0, newCost - (currentPrice - currentCost))
  },

  async reactivateSubscription(userId: string) {
    const supabase = createClient()
    
    try {
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('cancel_at_period_end', true)
        .single()
      
      if (subError) throw subError
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: false,
          cancelled_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)
        .select()
        .single()
      
      if (error) throw error
      
      await this.logUsage(userId, 'update', 'subscription', subscription.id, {
        action: 'reactivate'
      })
      
      return data
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      throw error
    }
  }
}