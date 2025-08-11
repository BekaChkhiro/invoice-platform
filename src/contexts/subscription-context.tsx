"use client"

// All subscription features are now unlimited - no restrictions
// This file is kept for backward compatibility but all functions return unlimited access

import * as React from "react"

// Mock types for backward compatibility
export interface SubscriptionContextValue {
  currentPlan: Record<string, unknown> | null
  subscription: Record<string, unknown> | null
  usage: Record<string, unknown>
  isLoading: boolean
  error: Error | null
  hasFeature: (feature: string) => boolean
  features: Record<string, boolean>
  invoiceLimit: {
    used: number
    limit: number | null
    remaining: number | null
    percentage: number
    canCreateMore: boolean
    isApproachingLimit: boolean
    isNearLimit: boolean
    isAtLimit: boolean
  }
  canCreateInvoice: () => boolean
  canSendEmail: () => boolean
  canExport: () => boolean
  canUseApi: () => boolean
  upgradePlan: (planId: string) => Promise<void>
  incrementUsage: (type: string, amount?: number) => void
  refreshData: () => Promise<void>
  requiresPlan: (requiredPlan: string) => boolean
  getPlanLevel: () => number
  getRequiredPlanForFeature: (feature: string) => string | null
}

// Mock context value with unlimited access
const mockContextValue: SubscriptionContextValue = {
  currentPlan: null,
  subscription: null,
  usage: {},
  isLoading: false,
  error: null,
  hasFeature: () => true,
  features: {},
  invoiceLimit: {
    used: 0,
    limit: null,
    remaining: null,
    percentage: 0,
    canCreateMore: true,
    isApproachingLimit: false,
    isNearLimit: false,
    isAtLimit: false,
  },
  canCreateInvoice: () => true,
  canSendEmail: () => true,
  canExport: () => true,
  canUseApi: () => true,
  upgradePlan: async () => {},
  incrementUsage: () => {},
  refreshData: async () => {},
  requiresPlan: () => true,
  getPlanLevel: () => 999,
  getRequiredPlanForFeature: () => null,
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function useSubscription(): SubscriptionContextValue {
  return mockContextValue
}

export function useSubscriptionGating() {
  return {
    requiresPlan: () => true,
    hasFeature: () => true,
    getRequiredPlanForFeature: () => null,
    canAccess: () => true,
    getUpgradeUrl: () => null,
    showUpgradeModal: () => {},
    hideUpgradeModal: () => {},
  }
}

export function useSubscriptionAlerts() {
  return {
    alerts: [],
    dismissAlert: () => {},
    showAlert: () => {},
  }
}

export function useSubscriptionAnalytics() {
  return {
    trackFeatureUsage: () => {},
    trackUpgrade: () => {},
    trackDowngrade: () => {},
    getUsageMetrics: () => ({}),
  }
}

export function useSubscriptionDebug() {
  return mockContextValue
}