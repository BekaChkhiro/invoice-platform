export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  price_monthly: number
  price_yearly: number
  currency: string
  features: PlanFeatures
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  plan?: SubscriptionPlan
  status: 'active' | 'cancelled' | 'expired' | 'past_due'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  cancelled_at: string | null
  payment_method: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

export interface PaymentRecord {
  id: string
  subscription_id: string
  user_id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method: string | null
  transaction_id: string | null
  invoice_id: string | null
  paid_at: string | null
  failed_at: string | null
  refunded_at: string | null
  failure_reason: string | null
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface UsageLog {
  id: string
  user_id: string
  subscription_id: string | null
  action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'send'
  resource_type: 'invoice' | 'client' | 'product' | 'report'
  resource_id: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export type PlanFeatures = {
  max_invoices_per_month: number | null
  max_clients: number | null
  max_products: number | null
  can_export_pdf: boolean
  can_send_email: boolean
  can_use_api: boolean
  can_use_recurring_invoices: boolean
  can_use_multi_currency: boolean
  can_use_custom_branding: boolean
  can_use_team_members: boolean
  max_team_members: number | null
  storage_limit_mb: number | null
  priority_support: boolean
  custom_domain: boolean
  webhook_integrations: boolean
  advanced_analytics: boolean
  audit_logs: boolean
  data_retention_days: number
}

export interface UsageStats {
  period_start: string
  period_end: string
  invoices_created: number
  invoices_sent: number
  clients_added: number
  products_added: number
  total_revenue: number
  storage_used_mb: number
  api_calls: number
  team_members_active: number
}

export interface PlanUpgradeRequest {
  user_id: string
  current_plan_id: string
  new_plan_id: string
  payment_method?: string
  prorate?: boolean
}

export interface SubscriptionCancellationRequest {
  user_id: string
  subscription_id: string
  reason?: string
  feedback?: string
  cancel_immediately?: boolean
}