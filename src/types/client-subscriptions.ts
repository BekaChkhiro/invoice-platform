// Client subscriptions types
export interface ClientSubscription {
  id: string
  client_id: string
  client_name: string
  client_email: string | null
  client_type: 'individual' | 'company'
  company_id: string
  service_name: string
  description: string | null
  amount: number
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  status: 'active' | 'paused' | 'cancelled'
  start_date: string
  next_billing_date: string | null
  cancelled_at: string | null
  created_at: string
  public_token: string
  auto_invoice: boolean
  flitt_subscription_id: string | null
  flitt_payment_url: string | null
}

export interface CreateSubscriptionRequest {
  client_id: string
  service_name: string
  description?: string
  amount: number
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  start_date: string
  auto_invoice?: boolean
  use_flitt?: boolean
}

export interface UpdateSubscriptionRequest {
  service_name?: string
  description?: string
  amount?: number
  billing_cycle?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  status?: 'active' | 'paused' | 'cancelled'
  auto_invoice?: boolean
}

export interface SubscriptionStatsResponse {
  total_subscriptions: number
  active_subscriptions: number
  paused_subscriptions: number
  total_monthly_revenue: number
  revenue_by_cycle: {
    weekly: number
    monthly: number
    quarterly: number
    yearly: number
  }
}
