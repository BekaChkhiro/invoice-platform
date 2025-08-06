'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from './use-auth'

interface UserCredits {
  id: string
  user_id: string
  total_credits: number
  used_credits: number
  plan_type: 'free' | 'basic' | 'pro'
  plan_expires_at: string | null
  created_at: string
  updated_at: string
}

interface CreditBalance {
  total_credits: number
  used_credits: number
  remaining_credits: number
  plan_type: string
  is_low: boolean // Less than 5 credits
  is_depleted: boolean // No credits left
}

/**
 * Hook for getting user's credit balance
 */
export function useCredits() {
  const { user } = useAuth()

  const {
    data: credits,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async (): Promise<CreditBalance> => {
      const response = await fetch('/api/user/credits')
      if (!response.ok) {
        throw new Error('კრედიტების ინფორმაციის მიღება ვერ მოხერხდა')
      }
      
      const data: UserCredits = await response.json()
      const remaining = data.total_credits - data.used_credits

      return {
        total_credits: data.total_credits,
        used_credits: data.used_credits,
        remaining_credits: Math.max(0, remaining),
        plan_type: data.plan_type,
        is_low: remaining <= 5 && remaining > 0,
        is_depleted: remaining <= 0
      }
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute - credits should be fresh
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000 // Auto-refresh every 2 minutes
  })

  /**
   * Check if user has enough credits for an operation
   */
  const hasCreditsFor = (requiredCredits: number = 1): boolean => {
    if (!credits) return false
    return credits.remaining_credits >= requiredCredits
  }

  /**
   * Get credit warning message
   */
  const getCreditWarning = (): string | null => {
    if (!credits) return null
    
    if (credits.is_depleted) {
      return 'კრედიტები ამოიწურა. გთხოვთ შეიძინოთ დამატებითი კრედიტები.'
    }
    
    if (credits.is_low) {
      return `დარჩენილია მხოლოდ ${credits.remaining_credits} კრედიტი. გისურვებთ შეიძინოთ დამატებითი?`
    }
    
    return null
  }

  return {
    credits,
    isLoading,
    error,
    refetch,
    hasCreditsFor,
    getCreditWarning,
    isLow: credits?.is_low || false,
    isDepleted: credits?.is_depleted || false,
    remainingCredits: credits?.remaining_credits || 0
  }
}

/**
 * Hook for upgrading plan (placeholder for future implementation)
 */
export function useUpgradePlan() {
  const upgradePlan = async (planType: 'basic' | 'pro') => {
    // This would integrate with payment system
    // For now, just show a message
    console.log(`Upgrade to ${planType} plan`)
    throw new Error('პლანის განახლება ჯერ არ არის ხელმისაწვდომი')
  }

  return {
    upgradePlan
  }
}

/**
 * Hook for credit-related operations
 */
export function useCreditOperations() {
  const { credits, refetch } = useCredits()

  const checkAndDeductCredit = async (operation: string): Promise<boolean> => {
    if (!credits || credits.remaining_credits <= 0) {
      throw new Error('არასაკმარისი კრედიტები')
    }

    // The actual credit deduction happens on the backend during invoice creation
    // This is just a client-side check
    return true
  }

  const returnCredit = async (operation: string): Promise<void> => {
    // Credit return also happens on backend during invoice deletion
    // Refresh credits after operation
    await refetch()
  }

  return {
    checkAndDeductCredit,
    returnCredit,
    refreshCredits: refetch
  }
}