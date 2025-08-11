'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useDebounce } from './use-debounce'

import { clientService } from '@/lib/services/client'
import type { ClientFormData, ClientFilter } from '@/lib/validations/client'

// Extended types for client management
export interface ClientFilters {
  search?: string
  type?: 'all' | 'individual' | 'company'
  status?: 'all' | 'active' | 'inactive'
  payment_behavior?: 'all' | 'excellent' | 'good' | 'average' | 'poor'
  created_after?: string
  limit: number
  offset: number
  sort_by: 'name' | 'created_at' | 'updated_at' | 'total_revenue'
  sort_order: 'asc' | 'desc'
}

export interface ClientListResponse {
  clients: Client[]
  pagination: {
    total: number
    limit: number
    offset: number
    page: number
    totalPages: number
  }
}

export interface ClientStats {
  total_clients: number
  active_clients: number
  inactive_clients: number
  individuals: number
  companies: number
  new_this_month: number
  growth_percentage: number
  payment_behavior_distribution: {
    excellent: number
    good: number
    average: number
    poor: number
  }
  revenue_stats: {
    total_revenue: number
    average_per_client: number
    top_clients_revenue: number
  }
}

const DEFAULT_FILTERS: ClientFilters = {
  search: '',
  type: 'all',
  status: 'all',
  payment_behavior: 'all',
  limit: 20,
  offset: 0,
  sort_by: 'created_at',
  sort_order: 'desc'
}

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
    queryFn: () => clientService.getClient(clientId),
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

/**
 * Advanced hook for managing client list with filtering, pagination, and URL sync
 */
export function useClientList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  
  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<ClientFilters>(() => {
    return {
      search: searchParams.get('search') || DEFAULT_FILTERS.search,
      type: (searchParams.get('type') as ClientFilters['type']) || DEFAULT_FILTERS.type,
      status: (searchParams.get('status') as ClientFilters['status']) || DEFAULT_FILTERS.status,
      payment_behavior: (searchParams.get('payment_behavior') as ClientFilters['payment_behavior']) || DEFAULT_FILTERS.payment_behavior,
      created_after: searchParams.get('created_after') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sort_by: (searchParams.get('sort_by') as ClientFilters['sort_by']) || DEFAULT_FILTERS.sort_by,
      sort_order: (searchParams.get('sort_order') as ClientFilters['sort_order']) || DEFAULT_FILTERS.sort_order
    }
  })

  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const debouncedSearch = useDebounce(filters.search, 500)

  // Sync filters to URL
  const updateURL = useCallback((newFilters: Partial<ClientFilters>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === DEFAULT_FILTERS[key as keyof ClientFilters]) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    const newURL = `${window.location.pathname}?${params.toString()}`
    router.replace(newURL, { scroll: false })
  }, [router, searchParams])

  // Update filters and sync to URL
  const updateFilters = useCallback((newFilters: Partial<ClientFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    
    // Reset offset when changing filters (except for pagination)
    if (!('offset' in newFilters)) {
      updatedFilters.offset = 0
    }
    
    setFilters(updatedFilters)
    updateURL(updatedFilters)
  }, [filters, updateURL])

  // Fetch clients with debounced search
  const filtersWithDebouncedSearch = useMemo(() => ({
    ...filters,
    search: debouncedSearch
  }), [filters, debouncedSearch])

  const {
    data: clientData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['clients-advanced', filtersWithDebouncedSearch],
    queryFn: async (): Promise<ClientListResponse> => {
      const params = new URLSearchParams()
      
      Object.entries(filtersWithDebouncedSearch).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== 'all') {
          params.append(key, String(value))
        }
      })

      const response = await fetch(`/api/clients?${params.toString()}`)
      if (!response.ok) {
        throw new Error('კლიენტების მიღება ვერ მოხერხდა')
      }
      return response.json()
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000
  })

  // Fetch overall client statistics
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['clients-stats-overall'],
    queryFn: async (): Promise<ClientStats> => {
      const response = await fetch('/api/clients/stats')
      if (!response.ok) {
        throw new Error('სტატისტიკის მიღება ვერ მოხერხდა')
      }
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000
  })

  // Pagination helpers
  const currentPage = Math.floor(filters.offset / filters.limit) + 1
  const totalPages = clientData?.pagination.totalPages || 0

  const goToPage = useCallback((page: number) => {
    const newOffset = (page - 1) * filters.limit
    updateFilters({ offset: newOffset })
  }, [filters.limit, updateFilters])

  const goToPrevious = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }, [currentPage, goToPage])

  const goToNext = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }, [currentPage, totalPages, goToPage])

  // Sorting helpers
  const toggleSort = useCallback((column: ClientFilters['sort_by']) => {
    const newOrder = filters.sort_by === column && filters.sort_order === 'asc' ? 'desc' : 'asc'
    updateFilters({ sort_by: column, sort_order: newOrder })
  }, [filters.sort_by, filters.sort_order, updateFilters])

  // Selection helpers
  const toggleClientSelection = useCallback((clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }, [])

  const toggleAllClients = useCallback(() => {
    const allClientIds = clientData?.clients.map(client => client.id) || []
    setSelectedClients(prev => 
      prev.length === allClientIds.length ? [] : allClientIds
    )
  }, [clientData?.clients])

  const clearSelection = useCallback(() => {
    setSelectedClients([])
  }, [])

  // Quick filters
  const quickFilters = useMemo(() => ({
    all: () => updateFilters({ type: 'all', status: 'all', payment_behavior: 'all', created_after: undefined }),
    individuals: () => updateFilters({ type: 'individual' }),
    companies: () => updateFilters({ type: 'company' }),
    active: () => updateFilters({ status: 'active' }),
    inactive: () => updateFilters({ status: 'inactive' }),
    excellentPayers: () => updateFilters({ payment_behavior: 'excellent' }),
    poorPayers: () => updateFilters({ payment_behavior: 'poor' }),
    thisMonth: () => {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      updateFilters({
        created_after: firstDay.toISOString().split('T')[0]
      })
    }
  }), [updateFilters])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setSelectedClients([])
    updateURL(DEFAULT_FILTERS)
  }, [updateURL])

  // Export functionality
  const exportClients = useCallback(async (format: 'csv' | 'excel' | 'pdf', selectedOnly = false) => {
    try {
      const exportFilters = selectedOnly 
        ? { ids: selectedClients }
        : filtersWithDebouncedSearch

      const params = new URLSearchParams()
      Object.entries(exportFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== 'all') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, String(v)))
          } else {
            params.append(key, String(value))
          }
        }
      })

      const response = await fetch(`/api/clients/export?format=${format}&${params.toString()}`)
      if (!response.ok) {
        throw new Error('ექსპორტი ვერ მოხერხდა')
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clients_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('ფაილი წარმატებით ჩამოიტვირთა')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('ექსპორტი ვერ მოხერხდა')
    }
  }, [filtersWithDebouncedSearch, selectedClients])

  return {
    // Data
    clients: clientData?.clients || [],
    pagination: clientData?.pagination,
    stats,
    isLoading,
    statsLoading,
    error,
    
    // Filters
    filters,
    updateFilters,
    resetFilters,
    quickFilters,
    
    // Pagination
    currentPage,
    totalPages,
    goToPage,
    goToPrevious,
    goToNext,
    
    // Sorting
    toggleSort,
    
    // Selection
    selectedClients,
    toggleClientSelection,
    toggleAllClients,
    clearSelection,
    isAllSelected: selectedClients.length > 0 && selectedClients.length === (clientData?.clients.length || 0),
    hasSelection: selectedClients.length > 0,
    
    // Actions
    refetch,
    exportClients
  }
}

/**
 * Hook for client operations (toggle status, delete)
 */
export function useClientOperations() {
  const queryClient = useQueryClient()

  const toggleStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const response = await fetch(`/api/clients/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'სტატუსის განახლება ვერ მოხერხდა')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients-advanced'] })
      queryClient.invalidateQueries({ queryKey: ['clients-stats-overall'] })
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
      toast.success('კლიენტის სტატუსი წარმატებით განახლდა')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  return {
    toggleStatus,
    deleteClient: useDeleteClient()
  }
}

/**
 * Hook for client invoices with filtering
 */
export function useClientInvoices(clientId: string, invoiceFilters?: any) {
  return useQuery({
    queryKey: ['client-invoices', clientId, invoiceFilters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('client_id', clientId)
      
      if (invoiceFilters) {
        Object.entries(invoiceFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== '' && value !== 'all') {
            params.append(key, String(value))
          }
        })
      }

      const response = await fetch(`/api/invoices?${params.toString()}`)
      if (!response.ok) {
        throw new Error('კლიენტის ინვოისების მიღება ვერ მოხერხდა')
      }
      return response.json()
    },
    enabled: !!clientId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  })
}

// =====================================
// EXPORT TYPES
// =====================================

export type { Client, CreateClient, UpdateClient, ClientFilter, ClientFilters, ClientListResponse, ClientStats }