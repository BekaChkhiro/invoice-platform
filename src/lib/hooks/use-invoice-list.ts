'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from './use-debounce'
import { toast } from 'sonner'

export interface InvoiceFilters {
  status: 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  client_id?: string
  date_from?: string
  date_to?: string
  search?: string
  limit: number
  offset: number
  sort_by: 'issue_date' | 'due_date' | 'total' | 'status' | 'client'
  sort_order: 'asc' | 'desc'
}

export interface InvoiceListResponse {
  invoices: any[]
  pagination: {
    total: number
    limit: number
    offset: number
    page: number
    totalPages: number
  }
}

export interface InvoiceStats {
  total_invoices: number
  total_amount: number
  paid_amount: number
  overdue_amount: number
  overdue_count: number
  average_invoice_value: number
  monthly_stats: {
    current_month_total: number
    current_month_count: number
    previous_month_total: number
    growth_percentage: number
  }
}

const DEFAULT_FILTERS: InvoiceFilters = {
  status: 'all',
  search: '',
  limit: 20,
  offset: 0,
  sort_by: 'issue_date',
  sort_order: 'desc'
}

/**
 * Hook for managing invoice list with URL state sync
 */
export function useInvoiceList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<InvoiceFilters>(() => {
    return {
      status: (searchParams.get('status') as InvoiceFilters['status']) || DEFAULT_FILTERS.status,
      client_id: searchParams.get('client_id') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || DEFAULT_FILTERS.search,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sort_by: (searchParams.get('sort_by') as InvoiceFilters['sort_by']) || DEFAULT_FILTERS.sort_by,
      sort_order: (searchParams.get('sort_order') as InvoiceFilters['sort_order']) || DEFAULT_FILTERS.sort_order
    }
  })

  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const debouncedSearch = useDebounce(filters.search, 500)

  // Sync filters to URL
  const updateURL = useCallback((newFilters: Partial<InvoiceFilters>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === DEFAULT_FILTERS[key as keyof InvoiceFilters]) {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })

    const newURL = `${window.location.pathname}?${params.toString()}`
    router.replace(newURL, { scroll: false })
  }, [router, searchParams])

  // Update filters and sync to URL
  const updateFilters = useCallback((newFilters: Partial<InvoiceFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    
    // Reset offset when changing filters (except for pagination)
    if (!('offset' in newFilters)) {
      updatedFilters.offset = 0
    }
    
    setFilters(updatedFilters)
    updateURL(updatedFilters)
  }, [filters, updateURL])

  // Fetch invoices
  const filtersWithDebouncedSearch = useMemo(() => ({
    ...filters,
    search: debouncedSearch
  }), [filters, debouncedSearch])

  const {
    data: invoiceData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['invoices', filtersWithDebouncedSearch],
    queryFn: async (): Promise<InvoiceListResponse> => {
      const params = new URLSearchParams()
      
      Object.entries(filtersWithDebouncedSearch).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== 'all') {
          params.append(key, String(value))
        }
      })

      const response = await fetch(`/api/invoices?${params.toString()}`)
      if (!response.ok) {
        throw new Error('ინვოისების მიღება ვერ მოხერხდა')
      }
      return response.json()
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true
  })

  // Fetch statistics
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: async (): Promise<InvoiceStats> => {
      const response = await fetch('/api/invoices/stats')
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
  const totalPages = invoiceData?.pagination.totalPages || 0

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
  const toggleSort = useCallback((column: InvoiceFilters['sort_by']) => {
    const newOrder = filters.sort_by === column && filters.sort_order === 'asc' ? 'desc' : 'asc'
    updateFilters({ sort_by: column, sort_order: newOrder })
  }, [filters.sort_by, filters.sort_order, updateFilters])

  // Selection helpers
  const toggleInvoiceSelection = useCallback((invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    )
  }, [])

  const toggleAllInvoices = useCallback(() => {
    const allInvoiceIds = invoiceData?.invoices.map(inv => inv.id) || []
    setSelectedInvoices(prev => 
      prev.length === allInvoiceIds.length ? [] : allInvoiceIds
    )
  }, [invoiceData?.invoices])

  const clearSelection = useCallback(() => {
    setSelectedInvoices([])
  }, [])

  // Quick filters
  const quickFilters = useMemo(() => ({
    all: () => updateFilters({ status: 'all', client_id: undefined, date_from: undefined, date_to: undefined }),
    overdue: () => updateFilters({ status: 'overdue' }),
    unpaid: () => updateFilters({ status: 'sent' }),
    drafts: () => updateFilters({ status: 'draft' }),
    thisMonth: () => {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      updateFilters({
        date_from: firstDay.toISOString().split('T')[0],
        date_to: lastDay.toISOString().split('T')[0]
      })
    },
    thisWeek: () => {
      const now = new Date()
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()))
      const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6))
      
      updateFilters({
        date_from: firstDay.toISOString().split('T')[0],
        date_to: lastDay.toISOString().split('T')[0]
      })
    }
  }), [updateFilters])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setSelectedInvoices([])
    updateURL(DEFAULT_FILTERS)
  }, [updateURL])

  // Export functionality
  const exportInvoices = useCallback(async (format: 'csv' | 'excel' | 'pdf', selectedOnly = false) => {
    try {
      const exportFilters = selectedOnly 
        ? { ids: selectedInvoices }
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

      const response = await fetch(`/api/invoices/export?format=${format}&${params.toString()}`)
      if (!response.ok) {
        throw new Error('ექსპორტი ვერ მოხერხდა')
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoices_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('ფაილი წარმატებით ჩამოიტვირთა')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('ექსპორტი ვერ მოხერხდა')
    }
  }, [filtersWithDebouncedSearch, selectedInvoices])

  return {
    // Data
    invoices: invoiceData?.invoices || [],
    pagination: invoiceData?.pagination,
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
    selectedInvoices,
    toggleInvoiceSelection,
    toggleAllInvoices,
    clearSelection,
    isAllSelected: selectedInvoices.length > 0 && selectedInvoices.length === (invoiceData?.invoices.length || 0),
    hasSelection: selectedInvoices.length > 0,
    
    // Actions
    refetch,
    exportInvoices
  }
}