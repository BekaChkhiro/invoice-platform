'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import * as clientService from '@/lib/services/client'
import type { Client, CreateClient, UpdateClient, ClientFilter } from '@/lib/services/client'

// =====================================
// QUERY KEY FACTORY
// =====================================

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filter: ClientFilter) => [...clientKeys.lists(), filter] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
  stats: (companyId: string) => [...clientKeys.all, 'stats', companyId] as const,
}

// =====================================
// MAIN HOOKS
// =====================================

/**
 * Hook to fetch paginated clients list with filtering
 */
export function useClients(filter: ClientFilter = {}) {
  return useQuery({
    queryKey: clientKeys.list(filter),
    queryFn: () => clientService.getClients(filter),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch a single client by ID
 */
export function useClient(clientId: string) {
  return useQuery({
    queryKey: clientKeys.detail(clientId),
    queryFn: () => clientService.getClientById(clientId),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook to fetch client statistics
 */
export function useClientStats(companyId: string) {
  return useQuery({
    queryKey: clientKeys.stats(companyId),
    queryFn: () => clientService.getClientStats(companyId),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes for stats
    gcTime: 5 * 60 * 1000,
  })
}

// =====================================
// MUTATION HOOKS
// =====================================

/**
 * Hook to create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClient) => clientService.createClient(data),
    
    onSuccess: (result, variables) => {
      if (result.data) {
        // Show success message
        toast.success('კლიენტი წარმატებით შეიქმნა')
        
        // Invalidate and refetch clients lists
        queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
        
        // Invalidate stats if company_id is available
        if (variables.company_id) {
          queryClient.invalidateQueries({ queryKey: clientKeys.stats(variables.company_id) })
        }
        
        // Add the new client to cache
        queryClient.setQueryData(
          clientKeys.detail(result.data.id),
          { data: result.data, error: null }
        )
      }
    },
    
    onError: (error, variables) => {
      console.error('Failed to create client:', error)
      const errorMessage = error instanceof Error ? error.message : 'კლიენტის შექმნა ვერ მოხერხდა'
      toast.error(errorMessage)
    }
  })
}

/**
 * Hook to update an existing client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClient }) =>
      clientService.updateClient(id, data),
    
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: clientKeys.detail(id) })
      
      // Snapshot the previous value
      const previousClient = queryClient.getQueryData(clientKeys.detail(id))
      
      // Optimistically update to the new value
      if (previousClient) {
        queryClient.setQueryData(clientKeys.detail(id), {
          data: { ...previousClient.data, ...data },
          error: null
        })
      }
      
      return { previousClient }
    },
    
    onSuccess: (result, { id }) => {
      if (result.data) {
        // Show success message
        toast.success('კლიენტი წარმატებით განახლდა')
        
        // Update cached data
        queryClient.setQueryData(
          clientKeys.detail(id),
          { data: result.data, error: null }
        )
        
        // Invalidate lists to ensure consistency
        queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
      }
    },
    
    onError: (error, { id }, context) => {
      // Rollback to previous data on error
      if (context?.previousClient) {
        queryClient.setQueryData(clientKeys.detail(id), context.previousClient)
      }
      
      console.error('Failed to update client:', error)
      const errorMessage = error instanceof Error ? error.message : 'კლიენტის განახლება ვერ მოხერხდა'
      toast.error(errorMessage)
    }
  })
}

/**
 * Hook to delete a client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (clientId: string) => clientService.deleteClient(clientId),
    
    onMutate: async (clientId) => {
      // Cancel queries for this client
      await queryClient.cancelQueries({ queryKey: clientKeys.detail(clientId) })
      
      // Get the client data for potential rollback
      const previousClient = queryClient.getQueryData(clientKeys.detail(clientId))
      
      // Remove from cache optimistically
      queryClient.removeQueries({ queryKey: clientKeys.detail(clientId) })
      
      return { previousClient, clientId }
    },
    
    onSuccess: (result, clientId) => {
      if (result.success) {
        // Show success message
        toast.success('კლიენტი წარმატებით წაიშალა')
        
        // Invalidate lists to remove deleted client
        queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
        
        // Invalidate stats
        queryClient.invalidateQueries({ queryKey: clientKeys.all })
      }
    },
    
    onError: (error, clientId, context) => {
      // Restore previous data on error
      if (context?.previousClient) {
        queryClient.setQueryData(
          clientKeys.detail(clientId),
          context.previousClient
        )
      }
      
      console.error('Failed to delete client:', error)
      const errorMessage = error instanceof Error ? error.message : 'კლიენტის წაშლა ვერ მოხერხდა'
      toast.error(errorMessage)
    }
  })
}

// =====================================
// UTILITY HOOKS
// =====================================

/**
 * Hook to prefetch a client by ID
 */
export function usePrefetchClient() {
  const queryClient = useQueryClient()

  return (clientId: string) => {
    queryClient.prefetchQuery({
      queryKey: clientKeys.detail(clientId),
      queryFn: () => clientService.getClientById(clientId),
      staleTime: 5 * 60 * 1000,
    })
  }
}

/**
 * Hook to get client data from cache without triggering fetch
 */
export function useClientFromCache(clientId: string) {
  const queryClient = useQueryClient()
  return queryClient.getQueryData(clientKeys.detail(clientId))
}

/**
 * Hook to invalidate all client queries
 */
export function useInvalidateClients() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: clientKeys.all })
  }
}

// =====================================
// EXPORT TYPES
// =====================================

export type { Client, CreateClient, UpdateClient, ClientFilter }