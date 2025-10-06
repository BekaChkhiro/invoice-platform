'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  ClientSubscription, 
  CreateSubscriptionRequest, 
  UpdateSubscriptionRequest,
  SubscriptionStatsResponse 
} from '@/types'

export function useClientSubscriptions(companyId?: string, enableStats = true) {
  const queryClient = useQueryClient()

  // Get all subscriptions
  const {
    data: subscriptions = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await fetch(`/api/subscriptions`)
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions')
      }
      const data = await response.json()
      return data.subscriptions as ClientSubscription[]
    },
    enabled: enableStats // Enable only when needed
  })

  // Get subscription statistics
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      const response = await fetch(`/api/subscriptions/stats`)
      if (!response.ok) {
        throw new Error('Failed to fetch subscription stats')
      }
      return await response.json() as SubscriptionStatsResponse
    },
    enabled: enableStats
  })

  // Create subscription
  const createSubscription = useMutation({
    mutationFn: async (data: CreateSubscriptionRequest) => {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create subscription')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-stats'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] }) // Refresh clients to show updated subscription counts
      toast.success('საბსქრიბშენი წარმატებით შეიქმნა!')
    },
    onError: (error: Error) => {
      toast.error(`საბსქრიბშენის შექმნა ჩაიშალა: ${error.message}`)
    }
  })

  // Update subscription
  const updateSubscription = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSubscriptionRequest }) => {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update subscription')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-stats'] })
      toast.success('საბსქრიბშენი განახლდა!')
    },
    onError: (error: Error) => {
      toast.error(`საბსქრიბშენის განახლება ჩაიშალა: ${error.message}`)
    }
  })

  // Cancel subscription
  const cancelSubscription = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel subscription')
      }
      
      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-stats'] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('საბსქრიბშენი გაუქმდა!')
    },
    onError: (error: Error) => {
      toast.error(`საბსქრიბშენის გაუქმება ჩაიშალა: ${error.message}`)
    }
  })

  return {
    // Data
    subscriptions,
    stats,
    isLoading,
    statsLoading,
    error,

    // Actions
    createSubscription,
    updateSubscription,
    cancelSubscription,
    refetch
  }
}

// Get subscriptions for specific client
export function useClientSubscriptionsList(clientId: string) {
  const queryClient = useQueryClient()

  const {
    data: subscriptions = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['client-subscriptions', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/subscriptions?client_id=${clientId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch client subscriptions')
      }
      const data = await response.json()
      return data.subscriptions as ClientSubscription[]
    },
    enabled: !!clientId
  })

  // Calculate totals for client
  const totals = {
    active: subscriptions.filter(s => s.status === 'active').length,
    paused: subscriptions.filter(s => s.status === 'paused').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
    monthlyRevenue: subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => {
        const monthlyAmount = s.billing_cycle === 'monthly' ? s.amount :
          s.billing_cycle === 'quarterly' ? s.amount / 3 :
          s.amount / 12
        return sum + monthlyAmount
      }, 0)
  }

  return {
    subscriptions,
    totals,
    isLoading,
    error,
    refetch
  }
}

// Get single subscription
export function useSubscription(id: string) {
  const {
    data: subscription,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['subscription', id],
    queryFn: async () => {
      console.debug('[useSubscription] Fetch start', { id })
      const response = await fetch(`/api/subscriptions/${id}`)
      console.debug('[useSubscription] Response received', { id, status: response.status })
      // Treat 404 as a valid "not found" state instead of an error
      if (response.status === 404) {
        console.warn('[useSubscription] Not found (404)', { id })
        return null
      }
      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        console.error('[useSubscription] Non-OK response', { id, status: response.status, errText })
        throw new Error(errText || 'Failed to fetch subscription')
      }
      const data = await response.json()
      const sub = data.subscription as ClientSubscription
      console.debug('[useSubscription] Success', { id: sub?.id })
      return sub
    },
    enabled: !!id,
    retry: false
  })

  return {
    subscription,
    isLoading,
    error,
    refetch
  }
}
