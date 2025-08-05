import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { 
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  duplicateInvoice,
  getInvoiceStats,
  checkInvoicePermission
} from '@/lib/services/invoice'
import type {
  Invoice,
  InvoiceWithClient,
  InvoiceWithDetails,
  CreateInvoice,
  UpdateInvoice,
  UpdateInvoiceStatus,
  InvoiceFilter,
  InvoiceStats
} from '@/lib/services/invoice'

// =====================================
// QUERY KEYS FACTORY
// =====================================

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filter: InvoiceFilter) => [...invoiceKeys.lists(), filter] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  stats: (companyId: string) => [...invoiceKeys.all, 'stats', companyId] as const,
  infinite: (filter: InvoiceFilter) => [...invoiceKeys.all, 'infinite', filter] as const,
  permissions: () => [...invoiceKeys.all, 'permissions'] as const,
  permission: (id: string) => [...invoiceKeys.permissions(), id] as const
}

// =====================================
// TOAST MESSAGES
// =====================================

const messages = {
  createSuccess: (number: string) => `ინვოისი ${number} წარმატებით შეიქმნა`,
  updateSuccess: 'ინვოისი წარმატებით განახლდა',
  deleteSuccess: 'ინვოისი წაშლილია და კრედიტი დაბრუნდა',
  duplicateSuccess: (number: string) => `ინვოისი ${number}-ის კოპია შეიქმნა`,
  statusSent: 'ინვოისი მონიშნულია როგორც გაგზავნილი',
  statusPaid: 'ინვოისი მონიშნულია როგორც გადახდილი',
  statusDraft: 'ინვოისი დაბრუნდა მონახაზის სტატუსზე',
  statusOverdue: 'ინვოისი მონიშნულია როგორც ვადაგადაცილებული',
  statusCancelled: 'ინვოისი გაუქმებულია',
  errorGeneral: 'დაფიქსირდა შეცდომა. სცადეთ ხელახლა',
  errorPermission: 'არასაკმარისი უფლებები',
  errorCredits: 'არასაკმარისი კრედიტები',
  errorNotFound: 'ინვოისი ვერ მოიძებნა',
  errorNetwork: 'ქსელის შეცდომა. შეამოწმეთ ინტერნეტ კავშირი'
}

// =====================================
// QUERY HOOKS
// =====================================

/**
 * Get paginated invoice list with filtering
 */
export const useInvoices = (filter: InvoiceFilter) => {
  return useQuery({
    queryKey: invoiceKeys.list(filter),
    queryFn: () => getInvoices(filter),
    enabled: !!filter,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    onError: (error) => {
      console.error('Failed to fetch invoices:', error)
      toast.error(messages.errorGeneral)
    },
    select: (response) => {
      if (response.error) {
        throw new Error(response.error)
      }
      return {
        invoices: response.data,
        totalCount: response.count
      }
    }
  })
}

/**
 * Get single invoice with details
 */
export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => getInvoice(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      // Don't retry if invoice not found
      if (error?.message?.includes('ვერ მოიძებნა')) {
        return false
      }
      return failureCount < 3
    },
    onError: (error) => {
      console.error('Failed to fetch invoice:', error)
      if (error.message?.includes('ვერ მოიძებნა')) {
        toast.error(messages.errorNotFound)
      } else {
        toast.error(messages.errorGeneral)
      }
    },
    select: (response) => {
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data
    }
  })
}

/**
 * Get dashboard statistics
 */
export const useInvoiceStats = (companyId: string) => {
  return useQuery({
    queryKey: invoiceKeys.stats(companyId),
    queryFn: () => getInvoiceStats(companyId),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes for fresh stats
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: 3,
    onError: (error) => {
      console.error('Failed to fetch invoice stats:', error)
      // Don't show toast for stats errors (dashboard can handle gracefully)
    },
    select: (response) => {
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data
    }
  })
}

/**
 * Check user permission for invoice
 */
export const useInvoicePermission = (invoiceId: string, userId: string) => {
  return useQuery({
    queryKey: invoiceKeys.permission(invoiceId),
    queryFn: () => checkInvoicePermission(invoiceId, userId),
    enabled: !!invoiceId && !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 2 * 60 * 1000, // 2 minutes
    retry: 1, // Quick fail for permission checks
    onError: (error) => {
      console.error('Permission check failed:', error)
    }
  })
}

/**
 * Infinite scroll for invoice list
 */
export const useInfiniteInvoices = (filter: InvoiceFilter) => {
  return useInfiniteQuery({
    queryKey: invoiceKeys.infinite(filter),
    queryFn: ({ pageParam = 0 }) => 
      getInvoices({ ...filter, offset: pageParam }),
    enabled: !!filter,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.error) return undefined
      
      const loadedCount = allPages.reduce((sum, page) => 
        sum + (page.data?.length || 0), 0
      )
      
      return loadedCount < (lastPage.count || 0) 
        ? loadedCount 
        : undefined
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    onError: (error) => {
      console.error('Failed to fetch infinite invoices:', error)
      toast.error(messages.errorGeneral)
    }
  })
}

// =====================================
// MUTATION HOOKS
// =====================================

/**
 * Create new invoice mutation
 */
export const useCreateInvoice = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useMutation({
    mutationFn: createInvoice,
    onMutate: async (newInvoice) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: invoiceKeys.lists() })
      
      // Snapshot previous value
      const previousInvoices = queryClient.getQueriesData({ queryKey: invoiceKeys.lists() })
      
      // Optimistically update invoice lists
      queryClient.setQueriesData(
        { queryKey: invoiceKeys.lists() },
        (old: any) => {
          if (!old) return old
          
          const optimisticInvoice = {
            id: `temp-${Date.now()}`,
            ...newInvoice,
            invoice_number: 'GENERATING...',
            status: 'draft',
            subtotal: 0,
            vat_amount: 0,
            total: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          return {
            ...old,
            data: [optimisticInvoice, ...(old.data || [])],
            count: (old.count || 0) + 1
          }
        }
      )
      
      return { previousInvoices }
    },
    onError: (error, newInvoice, context) => {
      // Rollback
      if (context?.previousInvoices) {
        context.previousInvoices.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      console.error('Failed to create invoice:', error)
      const errorMessage = error.message?.includes('კრედიტ') 
        ? messages.errorCredits 
        : messages.errorGeneral
      toast.error(errorMessage)
    },
    onSuccess: (response, variables) => {
      if (response.error) {
        toast.error(response.error)
        return
      }
      
      if (response.data) {
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
        queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() })
        
        // Show success message
        const invoiceNumber = response.data.invoice_number || 'ახალი ინვოისი'
        toast.success(messages.createSuccess(invoiceNumber))
        
        // Navigate to created invoice
        router.push(`/dashboard/invoices/${response.data.id}`)
      }
    }
  })
}

/**
 * Update existing invoice mutation
 */
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateInvoice,
    onMutate: async (updatedInvoice) => {
      await queryClient.cancelQueries({ queryKey: invoiceKeys.detail(updatedInvoice.id!) })
      
      const previousInvoice = queryClient.getQueryData(invoiceKeys.detail(updatedInvoice.id!))
      
      // Optimistically update
      queryClient.setQueryData(
        invoiceKeys.detail(updatedInvoice.id!),
        (old: any) => ({
          ...old,
          ...updatedInvoice,
          updated_at: new Date().toISOString()
        })
      )
      
      return { previousInvoice, invoiceId: updatedInvoice.id! }
    },
    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousInvoice) {
        queryClient.setQueryData(
          invoiceKeys.detail(context.invoiceId),
          context.previousInvoice
        )
      }
      
      console.error('Failed to update invoice:', error)
      toast.error(error.message || messages.errorGeneral)
    },
    onSuccess: (response, variables) => {
      if (response.error) {
        toast.error(response.error)
        return
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.id!) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
      
      toast.success(messages.updateSuccess)
    }
  })
}

/**
 * Update invoice status mutation
 */
export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateInvoiceStatus,
    onMutate: async (statusUpdate) => {
      await queryClient.cancelQueries({ queryKey: invoiceKeys.detail(statusUpdate.id) })
      
      const previousInvoice = queryClient.getQueryData(invoiceKeys.detail(statusUpdate.id))
      
      // Optimistically update status
      queryClient.setQueryData(
        invoiceKeys.detail(statusUpdate.id),
        (old: any) => {
          if (!old) return old
          
          const updates: any = {
            ...old,
            status: statusUpdate.status,
            updated_at: new Date().toISOString()
          }
          
          if (statusUpdate.sent_at) {
            updates.sent_at = statusUpdate.sent_at.toISOString()
          }
          
          if (statusUpdate.paid_at) {
            updates.paid_at = statusUpdate.paid_at.toISOString()
          }
          
          return updates
        }
      )
      
      return { previousInvoice, invoiceId: statusUpdate.id }
    },
    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousInvoice) {
        queryClient.setQueryData(
          invoiceKeys.detail(context.invoiceId),
          context.previousInvoice
        )
      }
      
      console.error('Failed to update invoice status:', error)
      toast.error(error.message || messages.errorGeneral)
    },
    onSuccess: (response, variables) => {
      if (response.error) {
        toast.error(response.error)
        return
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() })
      
      // Status-specific success messages
      const statusMessages = {
        sent: messages.statusSent,
        paid: messages.statusPaid,
        draft: messages.statusDraft,
        overdue: messages.statusOverdue,
        cancelled: messages.statusCancelled
      }
      
      toast.success(statusMessages[variables.status] || messages.updateSuccess)
    }
  })
}

/**
 * Delete invoice mutation
 */
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useMutation({
    mutationFn: deleteInvoice,
    onMutate: async (invoiceId) => {
      await queryClient.cancelQueries({ queryKey: invoiceKeys.lists() })
      
      const previousQueries = queryClient.getQueriesData({ queryKey: invoiceKeys.lists() })
      
      // Optimistically remove from lists
      queryClient.setQueriesData(
        { queryKey: invoiceKeys.lists() },
        (old: any) => {
          if (!old) return old
          
          return {
            ...old,
            data: old.data?.filter((invoice: any) => invoice.id !== invoiceId) || [],
            count: Math.max(0, (old.count || 1) - 1)
          }
        }
      )
      
      return { previousQueries, invoiceId }
    },
    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      console.error('Failed to delete invoice:', error)
      toast.error(error.message || messages.errorGeneral)
    },
    onSuccess: (response, invoiceId) => {
      if (!response.success) {
        toast.error(response.error || messages.errorGeneral)
        return
      }
      
      // Remove from cache completely
      queryClient.removeQueries({ queryKey: invoiceKeys.detail(invoiceId) })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() })
      
      toast.success(messages.deleteSuccess)
      
      // Navigate away if currently viewing this invoice
      if (window.location.pathname.includes(invoiceId)) {
        router.push('/dashboard/invoices')
      }
    }
  })
}

/**
 * Duplicate invoice mutation
 */
export const useDuplicateInvoice = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  
  return useMutation({
    mutationFn: duplicateInvoice,
    onError: (error) => {
      console.error('Failed to duplicate invoice:', error)
      const errorMessage = error.message?.includes('კრედიტ') 
        ? messages.errorCredits 
        : messages.errorGeneral
      toast.error(errorMessage)
    },
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error)
        return
      }
      
      if (response.data) {
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
        queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() })
        
        const invoiceNumber = response.data.invoice_number || 'კოპია'
        toast.success(messages.duplicateSuccess(invoiceNumber))
        
        // Navigate to duplicated invoice
        router.push(`/dashboard/invoices/${response.data.id}`)
      }
    }
  })
}

// =====================================
// UTILITY HOOKS
// =====================================

/**
 * Combined hook for invoice operations
 */
export const useInvoiceOperations = () => {
  const createMutation = useCreateInvoice()
  const updateMutation = useUpdateInvoice()
  const statusMutation = useUpdateInvoiceStatus()
  const deleteMutation = useDeleteInvoice()
  const duplicateMutation = useDuplicateInvoice()
  
  return {
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    updateStatus: statusMutation.mutate,
    updateStatusAsync: statusMutation.mutateAsync,
    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    duplicate: duplicateMutation.mutate,
    duplicateAsync: duplicateMutation.mutateAsync,
    
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isUpdatingStatus: statusMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isDuplicating: duplicateMutation.isLoading,
    
    isLoading: 
      createMutation.isLoading ||
      updateMutation.isLoading ||
      statusMutation.isLoading ||
      deleteMutation.isLoading ||
      duplicateMutation.isLoading
  }
}

/**
 * Hook for invoice form state
 */
export const useInvoiceForm = (invoiceId?: string) => {
  const { data: invoice, isLoading } = useInvoice(invoiceId || '')
  const operations = useInvoiceOperations()
  
  const canEdit = invoice?.status === 'draft'
  const canDelete = invoice?.status === 'draft'
  const canDuplicate = !!invoice
  const canSend = invoice?.status === 'draft'
  const canMarkPaid = invoice?.status === 'sent' || invoice?.status === 'overdue'
  
  return {
    invoice,
    isLoading,
    canEdit,
    canDelete,
    canDuplicate,
    canSend,
    canMarkPaid,
    ...operations
  }
}

/**
 * Hook for bulk invoice operations
 */
export const useBulkInvoiceOperations = () => {
  const queryClient = useQueryClient()
  const statusMutation = useUpdateInvoiceStatus()
  
  const bulkUpdateStatus = async (invoiceIds: string[], status: Invoice['status']) => {
    const results = await Promise.allSettled(
      invoiceIds.map(id => 
        statusMutation.mutateAsync({ 
          id, 
          status,
          ...(status === 'sent' && { sent_at: new Date() }),
          ...(status === 'paid' && { paid_at: new Date() })
        })
      )
    )
    
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.length - successful
    
    if (successful > 0) {
      toast.success(`${successful} ინვოისი წარმატებით განახლდა`)
    }
    
    if (failed > 0) {
      toast.error(`${failed} ინვოისის განახლება ვერ მოხერხდა`)
    }
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
    queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() })
  }
  
  return {
    bulkUpdateStatus,
    isLoading: statusMutation.isLoading
  }
}

// =====================================
// EXPORTS
// =====================================

export {
  messages as invoiceMessages,
  type InvoiceWithClient,
  type InvoiceWithDetails,
  type InvoiceStats
}