import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { invoiceKeys } from './use-invoices'

interface Invoice {
  id: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
}

/**
 * Real-time subscription hook for invoice updates
 * Automatically updates React Query cache when invoices change
 */
export const useInvoiceRealtime = (companyId?: string) => {
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Handle invoice updates
  const handleInvoiceUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        // Invalidate list queries to include new invoice
        queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
        queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() })
        break

      case 'UPDATE':
        // Update specific invoice detail if cached
        if (newRecord?.id) {
          queryClient.setQueryData(
            invoiceKeys.detail(newRecord.id),
            (oldData: any) => {
              if (!oldData) return newRecord
              return { ...oldData, ...newRecord }
            }
          )
        }

        // Update invoice in lists
        queryClient.setQueriesData(
          { queryKey: invoiceKeys.lists() },
          (oldData: any) => {
            if (!oldData?.data) return oldData

            const updatedData = oldData.data.map((invoice: Invoice) => 
              invoice.id === newRecord.id ? { ...invoice, ...newRecord } : invoice
            )

            return {
              ...oldData,
              data: updatedData
            }
          }
        )

        // Invalidate stats if status changed (affects statistics)
        if (oldRecord?.status !== newRecord?.status) {
          queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() })
        }
        break

      case 'DELETE':
        // Remove from detail cache
        if (oldRecord?.id) {
          queryClient.removeQueries({ queryKey: invoiceKeys.detail(oldRecord.id) })
        }

        // Remove from lists
        queryClient.setQueriesData(
          { queryKey: invoiceKeys.lists() },
          (oldData: any) => {
            if (!oldData?.data) return oldData

            return {
              ...oldData,
              data: oldData.data.filter((invoice: Invoice) => invoice.id !== oldRecord.id),
              count: Math.max(0, (oldData.count || 1) - 1)
            }
          }
        )

        // Invalidate stats
        queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() })
        break
    }
  }, [queryClient])

  // Set up real-time subscription
  useEffect(() => {
    if (!companyId) return

    // Subscribe to invoice changes for this company
    const channel = supabase
      .channel(`invoices-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `company_id=eq.${companyId}`
        },
        handleInvoiceUpdate
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel)
    }
  }, [companyId, handleInvoiceUpdate, supabase])

  return {
    isConnected: true // You could track connection status here if needed
  }
}

/**
 * Real-time subscription hook for a specific invoice
 */
export const useInvoiceRealtimeDetail = (invoiceId?: string) => {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const handleSingleInvoiceUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord } = payload

    if (eventType === 'UPDATE' && newRecord?.id === invoiceId) {
      queryClient.setQueryData(
        invoiceKeys.detail(invoiceId),
        (oldData: any) => {
          if (!oldData) return newRecord
          return { ...oldData, ...newRecord }
        }
      )

      // Also update in any list queries that might contain this invoice
      queryClient.setQueriesData(
        { queryKey: invoiceKeys.lists() },
        (oldData: any) => {
          if (!oldData?.data) return oldData

          const updatedData = oldData.data.map((invoice: Invoice) => 
            invoice.id === newRecord.id ? { ...invoice, ...newRecord } : invoice
          )

          return {
            ...oldData,
            data: updatedData
          }
        }
      )
    }
  }, [queryClient, invoiceId])

  useEffect(() => {
    if (!invoiceId) return

    const channel = supabase
      .channel(`invoice-detail-${invoiceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'invoices',
          filter: `id=eq.${invoiceId}`
        },
        handleSingleInvoiceUpdate
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [invoiceId, handleSingleInvoiceUpdate, supabase])
}