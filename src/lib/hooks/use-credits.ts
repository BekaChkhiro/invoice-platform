'use client'

// Credits system disabled - returning unlimited access

interface CreditBalance {
  total_credits: number
  used_credits: number
  remaining_credits: number
  plan_type: string
  is_low: boolean
  is_depleted: boolean
}

/**
 * Hook for getting user's credit balance - now returns unlimited credits
 */
export function useCredits() {
  // Always return unlimited credits
  const mockCredits: CreditBalance = {
    total_credits: 999999,
    used_credits: 0,
    remaining_credits: 999999,
    plan_type: 'unlimited',
    is_low: false,
    is_depleted: false
  }

  return {
    credits: mockCredits,
    isLoading: false,
    error: null,
    refetch: async () => {},
    getCreditWarning: () => null,
    isDepleted: false,
    isLow: false,
    hasCredits: true
  }
}