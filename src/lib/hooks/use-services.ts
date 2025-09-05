'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useDebounce } from './use-debounce'

import { serviceService, type ServiceFilter, type ServiceWithStats, type ServiceListResponse, type ServiceStatsResponse } from '@/lib/services/service'
import type { ServiceFormData } from '@/lib/validations/service'
import type { Service } from '@/types/database'

// Extended types for service management
export interface ServiceFilters {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  limit: number
  offset: number
  sort_by: 'name' | 'default_price' | 'created_at'
  sort_order: 'asc' | 'desc'
}

const DEFAULT_FILTERS: ServiceFilters = {
  search: '',
  status: 'all',
  limit: 20,
  offset: 0,
  sort_by: 'name',
  sort_order: 'asc'
}

// =====================================
// QUERY KEY FACTORY
// =====================================

export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (filter: ServiceFilter) => [...serviceKeys.lists(), filter] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
  stats: (filters?: any) => [...serviceKeys.all, 'stats', filters] as const,
}

// =====================================
// MAIN HOOKS
// =====================================

/**
 * Hook to fetch paginated services list with filtering
 */
export function useServices(filter: ServiceFilter = {}) {
  return useQuery({
    queryKey: serviceKeys.list(filter),
    queryFn: () => serviceService.getServices(filter),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch service statistics
 */
export function useServiceStats(filters?: {
  date_from?: string
  date_to?: string
  service_ids?: string[]
  limit?: number
}) {
  return useQuery({
    queryKey: serviceKeys.stats(filters),
    queryFn: () => serviceService.getServiceStats(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes for stats
    gcTime: 5 * 60 * 1000,
  })
}

// =====================================
// MUTATION HOOKS
// =====================================

/**
 * Hook to create a new service
 */
export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ServiceFormData) => serviceService.createService(data),
    
    onSuccess: (result) => {
      if (result) {
        // Show success message
        toast.success('სერვისი წარმატებით შეიქმნა')
        
        // Invalidate and refetch services lists
        queryClient.invalidateQueries({ queryKey: serviceKeys.lists() })
        
        // Invalidate stats
        queryClient.invalidateQueries({ queryKey: serviceKeys.stats() })
      }
    },
    
    onError: (error) => {
      console.error('Failed to create service:', error)
      const errorMessage = error instanceof Error ? error.message : 'სერვისის შექმნა ვერ მოხერხდა'
      toast.error(errorMessage)
    }
  })
}

/**
 * Hook to update an existing service
 */
export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceFormData> }) =>
      serviceService.updateService(id, data),
    
    onSuccess: (result, { id }) => {
      if (result) {
        // Show success message
        toast.success('სერვისი წარმატებით განახლდა')
        
        // Update cached data
        queryClient.setQueryData(
          serviceKeys.detail(id),
          result
        )
        
        // Invalidate lists to ensure consistency
        queryClient.invalidateQueries({ queryKey: serviceKeys.lists() })
        queryClient.invalidateQueries({ queryKey: serviceKeys.stats() })
      }
    },
    
    onError: (error) => {
      console.error('Failed to update service:', error)
      const errorMessage = error instanceof Error ? error.message : 'სერვისის განახლება ვერ მოხერხდა'
      toast.error(errorMessage)
    }
  })
}

/**
 * Hook to delete a service
 */
export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (serviceId: string) => serviceService.deleteService(serviceId),
    
    onSuccess: (result, serviceId) => {
      if (result && result.success) {
        // Show success message
        toast.success(result.message || 'სერვისი წარმატებით წაიშალა')
        
        // Remove from cache
        queryClient.removeQueries({ queryKey: serviceKeys.detail(serviceId) })
        
        // Invalidate lists to remove deleted service
        queryClient.invalidateQueries({ queryKey: serviceKeys.lists() })
        queryClient.invalidateQueries({ queryKey: serviceKeys.stats() })
      } else {
        // Show error if deletion failed
        toast.error(result?.message || 'სერვისის წაშლა ვერ მოხერხდა')
      }
    },
    
    onError: (error) => {
      console.error('Failed to delete service:', error)
      const errorMessage = error instanceof Error ? error.message : 'სერვისის წაშლა ვერ მოხერხდა'
      toast.error(errorMessage)
    }
  })
}

/**
 * Advanced hook for managing service list with filtering, pagination, and URL sync
 */
export function useServiceList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  
  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<ServiceFilters>(() => {
    return {
      search: searchParams.get('search') || DEFAULT_FILTERS.search,
      status: (searchParams.get('status') as ServiceFilters['status']) || DEFAULT_FILTERS.status,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sort_by: (searchParams.get('sort_by') as ServiceFilters['sort_by']) || DEFAULT_FILTERS.sort_by,
      sort_order: (searchParams.get('sort_order') as ServiceFilters['sort_order']) || DEFAULT_FILTERS.sort_order
    }
  })

  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const debouncedSearch = useDebounce(filters.search, 500)

  // Sync filters to URL
  const updateURL = useCallback((newFilters: Partial<ServiceFilters>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === DEFAULT_FILTERS[key as keyof ServiceFilters]) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    const newURL = `${window.location.pathname}?${params.toString()}`
    router.replace(newURL, { scroll: false })
  }, [router, searchParams])

  // Update filters and sync to URL
  const updateFilters = useCallback((newFilters: Partial<ServiceFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    
    // Reset offset when changing filters (except for pagination)
    if (!('offset' in newFilters)) {
      updatedFilters.offset = 0
    }
    
    setFilters(updatedFilters)
    updateURL(updatedFilters)
  }, [filters, updateURL])

  // Fetch services with debounced search
  const filtersWithDebouncedSearch = useMemo(() => ({
    ...filters,
    search: debouncedSearch
  }), [filters, debouncedSearch])

  const {
    data: serviceData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['services-advanced', filtersWithDebouncedSearch],
    queryFn: async (): Promise<ServiceListResponse> => {
      return serviceService.getServices(filtersWithDebouncedSearch)
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000
  })

  // Fetch service statistics
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['services-stats-overall'],
    queryFn: async (): Promise<ServiceStatsResponse> => {
      return serviceService.getServiceStats({ limit: 10 })
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000
  })

  // Pagination helpers
  const currentPage = Math.floor(filters.offset / filters.limit) + 1
  const totalPages = serviceData?.pagination.totalPages || 0

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
  const toggleSort = useCallback((column: ServiceFilters['sort_by']) => {
    const newOrder = filters.sort_by === column && filters.sort_order === 'asc' ? 'desc' : 'asc'
    updateFilters({ sort_by: column, sort_order: newOrder })
  }, [filters.sort_by, filters.sort_order, updateFilters])

  // Selection helpers
  const toggleServiceSelection = useCallback((serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }, [])

  const toggleAllServices = useCallback(() => {
    const allServiceIds = serviceData?.services.map(service => service.id) || []
    setSelectedServices(prev => 
      prev.length === allServiceIds.length ? [] : allServiceIds
    )
  }, [serviceData?.services])

  const clearSelection = useCallback(() => {
    setSelectedServices([])
  }, [])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setSelectedServices([])
    updateURL(DEFAULT_FILTERS)
  }, [updateURL])

  return {
    // Data
    services: serviceData?.services || [],
    pagination: serviceData?.pagination,
    stats,
    isLoading,
    statsLoading,
    error,
    
    // Filters
    filters,
    updateFilters,
    resetFilters,
    
    // Pagination
    currentPage,
    totalPages,
    goToPage,
    goToPrevious,
    goToNext,
    
    // Sorting
    toggleSort,
    
    // Selection
    selectedServices,
    toggleServiceSelection,
    toggleAllServices,
    clearSelection,
    isAllSelected: selectedServices.length > 0 && selectedServices.length === (serviceData?.services.length || 0),
    hasSelection: selectedServices.length > 0,
    
    // Actions
    refetch
  }
}

/**
 * Hook for service operations (toggle status, delete)
 */
export function useServiceOperations() {
  const queryClient = useQueryClient()

  const toggleStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      return serviceService.toggleServiceStatus(id, is_active)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-advanced'] })
      queryClient.invalidateQueries({ queryKey: ['services-stats-overall'] })
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() })
      toast.success('სერვისის სტატუსი წარმატებით განახლდა')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  return {
    toggleStatus,
    deleteService: useDeleteService()
  }
}

// =====================================
// EXPORT TYPES
// =====================================

export type { Service, ServiceFormData, ServiceFilter, ServiceFilters, ServiceListResponse, ServiceWithStats, ServiceStatsResponse }