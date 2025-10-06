'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/use-auth'

export interface FlittConfig {
  merchant_id: string | null
  has_secret_key: boolean
  enabled: boolean
  test_mode: boolean
  setup_completed_at: string | null
  last_test_at: string | null
}

export interface FlittCredentials {
  merchant_id: string
  secret_key: string
  test_mode: boolean
}

export interface FlittSettings {
  enabled?: boolean
  test_mode?: boolean
}

export function useFlittConfig() {
  const { company } = useAuth()
  const queryClient = useQueryClient()

  // Get current Flitt configuration
  const {
    data: config,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['flitt-config', company?.id],
    queryFn: async () => {
      if (!company?.id) return null
      
      const response = await fetch('/api/company/flitt')
      if (!response.ok) {
        throw new Error('Failed to fetch Flitt configuration')
      }
      
      const data = await response.json()
      return data.config as FlittConfig
    },
    enabled: !!company?.id
  })

  // Save Flitt credentials
  const saveCredentials = useMutation({
    mutationFn: async (credentials: FlittCredentials) => {
      const response = await fetch('/api/company/flitt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save credentials')
      }

      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flitt-config'] })
      toast.success('Flitt კრედენციალები შენახულია')
    },
    onError: (error: Error) => {
      toast.error(`კრედენციალების შენახვა ჩაიშალა: ${error.message}`)
    }
  })

  // Update Flitt settings
  const updateSettings = useMutation({
    mutationFn: async (settings: FlittSettings) => {
      const response = await fetch('/api/company/flitt', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update settings')
      }

      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flitt-config'] })
      toast.success('პარამეტრები განახლდა')
    },
    onError: (error: Error) => {
      toast.error(`პარამეტრების განახლება ჩაიშალა: ${error.message}`)
    }
  })

  // Test Flitt connection
  const testConnection = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/company/flitt/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Connection test failed')
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flitt-config'] })
      if (data.success) {
        toast.success('Flitt კავშირი წარმატებულია')
      } else {
        toast.error('Flitt კავშირი ჩაიშალა')
      }
    },
    onError: (error: Error) => {
      toast.error(`კავშირის ტესტი ჩაიშალა: ${error.message}`)
    }
  })

  // Remove Flitt configuration
  const removeConfiguration = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/company/flitt', {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove configuration')
      }

      return await response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flitt-config'] })
      toast.success('Flitt კონფიგურაცია წაიშალა')
    },
    onError: (error: Error) => {
      toast.error(`კონფიგურაციის წაშლა ჩაიშალა: ${error.message}`)
    }
  })

  return {
    // Data
    config,
    isLoading,
    error,

    // Actions
    saveCredentials: (credentials: FlittCredentials) => 
      saveCredentials.mutateAsync(credentials),
    updateSettings: (settings: FlittSettings) => 
      updateSettings.mutateAsync(settings),
    testConnection: () => 
      testConnection.mutateAsync(),
    removeConfiguration: () => 
      removeConfiguration.mutateAsync(),
    refetch,

    // Loading states
    isSaving: saveCredentials.isPending || updateSettings.isPending,
    isTesting: testConnection.isPending,
    isRemoving: removeConfiguration.isPending
  }
}