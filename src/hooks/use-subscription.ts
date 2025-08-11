"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useUser } from "@supabase/auth-helpers-react"
import { subscriptionService } from "@/lib/services/subscription"
import type { 
  SubscriptionPlan, 
  UserSubscription, 
  UsageStats, 
  PlanFeatures,
  UsageTrendData 
} from "@/types/subscription"

// Hook return types
export interface CurrentPlanData {
  plan: SubscriptionPlan | null
  subscription: UserSubscription | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export interface InvoiceLimitData {
  used: number
  limit: number | null // null for unlimited
  remaining: number | null
  percentage: number
  canCreateMore: boolean
  isApproachingLimit: boolean // > 80%
  isNearLimit: boolean // > 90%
  isAtLimit: boolean // >= 100%
}

export interface FeatureAccessData {
  hasAccess: boolean
  requiredPlan: string | null
  isLoading: boolean
}

export interface UsageStatsData {
  current: UsageStats
  previous?: UsageStats
  growth: {
    invoices: number
    emails: number
    clients: number
  }
  trends: UsageTrendData[]
  isLoading: boolean
}

// Plan level mappings
const PLAN_LEVELS = {
  'უფასო': 0,
  'free': 0,
  'ძირითადი': 1,
  'basic': 1,
  'პროფესიონალური': 2,
  'pro': 2,
} as const

const FEATURE_PLAN_REQUIREMENTS = {
  can_send_email: 'basic',
  can_use_custom_branding: 'basic',
  advanced_analytics: 'basic',
  can_export_pdf: 'pro',
  can_use_api: 'pro',
  can_use_team_members: 'pro',
  webhook_integrations: 'pro',
  audit_logs: 'pro',
} as const

/**
 * Hook to get current user's plan and subscription data
 */
export function useCurrentPlan(): CurrentPlanData {
  const user = useUser()
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['current-plan', user?.id],
    queryFn: () => subscriptionService.getCurrentUserPlan(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  })

  return React.useMemo(() => ({
    plan: data?.plan || null,
    subscription: data || null,
    isLoading,
    error: error as Error | null,
    refetch,
  }), [data, isLoading, error, refetch])
}

/**
 * Hook to track invoice usage against plan limits - now always returns unlimited
 */
export function useInvoiceLimit(): InvoiceLimitData {
  // Always return unlimited access
  return React.useMemo(() => ({
    used: 0,
    limit: null,
    remaining: null,
    percentage: 0,
    canCreateMore: true,
    isApproachingLimit: false,
    isNearLimit: false,
    isAtLimit: false,
  }), [])
}

/**
 * Hook to check if user has access to specific feature
 */
export function useFeatureAccess(feature: keyof PlanFeatures): FeatureAccessData {
  // Always return unlimited access
  return React.useMemo(() => ({
    hasAccess: true,
    requiredPlan: null,
    isLoading: false,
  }), [feature])
}

/**
 * Hook to get comprehensive usage statistics
 */
export function useUsageStats(period: string = 'month'): UsageStatsData {
  const user = useUser()
  
  const { data: currentStats, isLoading: currentLoading } = useQuery({
    queryKey: ['usage-stats', user?.id, period],
    queryFn: () => subscriptionService.getUsageStats(user!.id, { period: period as any }),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })

  const { data: previousStats } = useQuery({
    queryKey: ['usage-stats-previous', user?.id, period],
    queryFn: () => {
      // Calculate previous period dates
      const now = new Date()
      let previousStart: Date
      let previousEnd: Date

      switch (period) {
        case 'week':
          previousStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
          previousEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'quarter':
          previousStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
          previousEnd = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          previousStart = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)
          previousEnd = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default: // month
          previousStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
          previousEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      return subscriptionService.getUsageStats(user!.id, {
        period: 'custom',
        start_date: previousStart.toISOString(),
        end_date: previousEnd.toISOString(),
      })
    },
    enabled: !!user?.id && !!currentStats,
    staleTime: 10 * 60 * 1000,
  })

  // Mock trends data - in production this would come from API
  const trends = React.useMemo<UsageTrendData[]>(() => {
    if (!currentStats) return []
    
    const months = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ']
    
    return Array.from({ length: 12 }, (_, i) => ({
      month: months[i],
      invoices: Math.floor(Math.random() * 30) + 5,
      emails: Math.floor(Math.random() * 50) + 10,
      limit: 50,
      year: new Date().getFullYear(),
    }))
  }, [currentStats])

  return React.useMemo(() => {
    const defaultStats: UsageStats = {
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
      invoices_created: 0,
      invoices_sent: 0,
      clients_added: 0,
      products_added: 0,
      total_revenue: 0,
      storage_used_mb: 0,
      api_calls: 0,
      team_members_active: 0,
    }

    const current = currentStats || defaultStats
    const previous = previousStats || defaultStats

    const growth = {
      invoices: current.invoices_created - previous.invoices_created,
      emails: current.invoices_sent - previous.invoices_sent,
      clients: current.clients_added - previous.clients_added,
    }

    return {
      current,
      previous,
      growth,
      trends,
      isLoading: currentLoading,
    }
  }, [currentStats, previousStats, trends, currentLoading])
}

/**
 * Hook to check multiple features at once
 */
export function useFeatureFlags(features: Array<keyof PlanFeatures>) {
  const { plan } = useCurrentPlan()
  
  return React.useMemo(() => {
    if (!plan) {
      return features.reduce((acc, feature) => {
        acc[feature] = false
        return acc
      }, {} as Record<keyof PlanFeatures, boolean>)
    }

    return features.reduce((acc, feature) => {
      acc[feature] = Boolean(plan.features[feature])
      return acc
    }, {} as Record<keyof PlanFeatures, boolean>)
  }, [plan, features])
}

/**
 * Hook to determine if user can upgrade to specific plan
 */
export function useCanUpgrade(targetPlan: string): boolean {
  const { plan } = useCurrentPlan()
  
  return React.useMemo(() => {
    if (!plan) return true
    
    const currentLevel = PLAN_LEVELS[plan.name.toLowerCase() as keyof typeof PLAN_LEVELS] || 0
    const targetLevel = PLAN_LEVELS[targetPlan.toLowerCase() as keyof typeof PLAN_LEVELS] || 0
    
    return targetLevel > currentLevel
  }, [plan, targetPlan])
}

/**
 * Hook to get plan comparison data
 */
export function usePlanComparison(comparePlan: string) {
  const { plan: currentPlan } = useCurrentPlan()
  
  const { data: compareData } = useQuery({
    queryKey: ['plan-comparison', comparePlan],
    queryFn: async () => {
      const plans = await subscriptionService.getAvailablePlans()
      return plans.find(p => p.name.toLowerCase() === comparePlan.toLowerCase())
    },
    staleTime: 10 * 60 * 1000,
  })

  return React.useMemo(() => {
    if (!currentPlan || !compareData) return null

    const differences: Array<{
      feature: string
      current: any
      target: any
      improved: boolean
    }> = []

    Object.keys(currentPlan.features).forEach(featureKey => {
      const current = currentPlan.features[featureKey as keyof PlanFeatures]
      const target = compareData.features[featureKey as keyof PlanFeatures]
      
      if (current !== target) {
        differences.push({
          feature: featureKey,
          current,
          target,
          improved: Boolean(target) && !Boolean(current)
        })
      }
    })

    return {
      currentPlan,
      comparePlan: compareData,
      differences,
      priceIncrease: compareData.price_monthly - currentPlan.price_monthly,
    }
  }, [currentPlan, compareData])
}

/**
 * Hook to track real-time usage updates
 */
export function useUsageTracker() {
  const user = useUser()
  const [realtimeUsage, setRealtimeUsage] = React.useState<Partial<UsageStats>>({})

  const incrementUsage = React.useCallback((type: keyof UsageStats, amount = 1) => {
    setRealtimeUsage(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + amount
    }))

    // Log usage to backend
    if (user?.id) {
      subscriptionService.logUsage(
        user.id,
        'create',
        type as any,
        null,
        { increment: amount }
      ).catch(console.error)
    }
  }, [user?.id])

  const resetUsage = React.useCallback(() => {
    setRealtimeUsage({})
  }, [])

  return {
    realtimeUsage,
    incrementUsage,
    resetUsage,
  }
}

/**
 * Hook for optimistic updates when creating resources
 */
export function useOptimisticUsage() {
  const { data: limitCheck, refetch } = useQuery({
    queryKey: ['invoice-limit-optimistic'],
    queryFn: () => subscriptionService.checkInvoiceLimit(''),
    enabled: false,
  })

  const optimisticallyUseInvoice = React.useCallback(() => {
    // Optimistically update the cache
    if (limitCheck) {
      // Update React Query cache with new usage
      refetch()
    }
  }, [limitCheck, refetch])

  return { optimisticallyUseInvoice }
}