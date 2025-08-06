'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from './use-debounce'

interface ClientSearchResult {
  id: string
  name: string
  email: string
  type: 'individual' | 'company'
  display_name: string
  subtitle: string
}

interface ClientSearchResponse {
  results: ClientSearchResult[]
  query: string
  count: number
}

/**
 * Hook for searching clients with debounced input
 */
export function useClientSearch() {
  const [query, setQuery] = useState('')
  const [recentClients, setRecentClients] = useState<ClientSearchResult[]>([])
  const [isClient, setIsClient] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  // Set client flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Get all clients for initial load - only on client side
  const {
    data: allClients,
    isLoading: allClientsLoading
  } = useQuery({
    queryKey: ['all-clients'],
    queryFn: async (): Promise<ClientSearchResult[]> => {
      const response = await fetch('/api/clients?limit=50')
      if (!response.ok) {
        throw new Error('კლიენტების ჩატვირთვა ვერ მოხერხდა')
      }
      const data = await response.json()
      return (data.clients || []).map((client: any) => ({
        id: client.id,
        name: client.name,
        email: client.email || '',
        type: client.type,
        display_name: client.type === 'company' && client.tax_id 
          ? `${client.name} (${client.tax_id})`
          : client.name,
        subtitle: client.email || (client.type === 'company' ? 'იურიდიული პირი' : 'ფიზიკური პირი')
      }))
    },
    enabled: isClient,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })

  // Search query
  const {
    data: searchResults,
    isLoading: searchLoading,
    error
  } = useQuery({
    queryKey: ['client-search', debouncedQuery],
    queryFn: async (): Promise<ClientSearchResponse> => {
      if (!debouncedQuery.trim()) {
        return { results: [], query: '', count: 0 }
      }

      const response = await fetch(`/api/clients/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`)
      if (!response.ok) {
        throw new Error('ძებნა ვერ მოხერხდა')
      }
      return response.json()
    },
    enabled: isClient && debouncedQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })

  // Get recent clients when component mounts - only on client
  useEffect(() => {
    if (isClient) {
      const stored = localStorage.getItem('recentClients')
      if (stored) {
        try {
          setRecentClients(JSON.parse(stored))
        } catch (error) {
          console.warn('Failed to parse recent clients from localStorage')
          localStorage.removeItem('recentClients')
        }
      }
    }
  }, [isClient])

  // Add client to recent clients
  const addToRecentClients = (client: ClientSearchResult) => {
    const updated = [
      client,
      ...recentClients.filter(c => c.id !== client.id)
    ].slice(0, 5) // Keep only last 5

    setRecentClients(updated)
    if (isClient) {
      localStorage.setItem('recentClients', JSON.stringify(updated))
    }
  }

  // Clear search
  const clearSearch = () => {
    setQuery('')
  }

  // Get suggestions (search results when query exists, recent clients or all clients when no query)
  const suggestions = debouncedQuery.trim() 
    ? searchResults?.results || []
    : recentClients.length > 0 
      ? recentClients 
      : allClients?.slice(0, 10) || []

  const isLoading = debouncedQuery.trim().length > 0 ? searchLoading : allClientsLoading

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
    hasQuery: debouncedQuery.trim().length > 0,
    addToRecentClients,
    clearSearch,
    recentClients,
    allClients: allClients || [],
    isClient
  }
}

/**
 * Hook for getting client details by ID
 */
export function useClientDetails(clientId: string | null) {
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null

      const response = await fetch(`/api/clients/${clientId}`)
      if (!response.ok) {
        throw new Error('კლიენტის მონაცემების მიღება ვერ მოხერხდა')
      }
      return response.json()
    },
    enabled: !!clientId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  })
}

/**
 * Hook for creating a new client inline
 */
export function useCreateClientInline() {
  const [isOpen, setIsOpen] = useState(false)

  const createClient = async (clientData: any) => {
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clientData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'კლიენტის შექმნა ვერ მოხერხდა')
    }

    const result = await response.json()
    setIsOpen(false)
    return result
  }

  return {
    isOpen,
    setIsOpen,
    createClient
  }
}