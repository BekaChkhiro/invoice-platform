import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  sendInvoiceEmail,
  sendPaymentReminder,
  sendPaymentConfirmation,
  getEmailHistory,
  getEmailTemplates
} from '@/lib/services/email'

import type {
  EmailOptions,
  EmailResponse,
  EmailHistory,
  EmailTemplate,
  ReminderType,
  ServiceResult
} from '@/lib/services/email'
import type { InvoiceWithDetails } from '@/lib/services/invoice'

// =====================================
// QUERY KEYS
// =====================================

export const emailKeys = {
  all: ['emails'] as const,
  history: (invoiceId: string) => [...emailKeys.all, 'history', invoiceId] as const,
  templates: () => [...emailKeys.all, 'templates'] as const,
}

// =====================================
// EMAIL SENDING HOOKS
// =====================================

interface SendEmailOptions {
  invoice: InvoiceWithDetails
  options: Partial<EmailOptions>
}

/**
 * Hook for sending invoice emails
 */
export const useSendEmail = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoice, options }: SendEmailOptions) => 
      sendInvoiceEmail(invoice, options),
    
    onMutate: async ({ invoice }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: emailKeys.history(invoice.id) })
      
      // Snapshot the previous value
      const previousHistory = queryClient.getQueryData(emailKeys.history(invoice.id))
      
      // Optimistically add sending status
      const optimisticEmail: Partial<EmailHistory> = {
        id: `temp-${Date.now()}`,
        invoice_id: invoice.id,
        type: 'invoice',
        recipient: invoice.client.email || '',
        subject: `ინვოისი #${invoice.invoice_number}`,
        sent_at: new Date(),
        status: 'pending'
      }
      
      queryClient.setQueryData(
        emailKeys.history(invoice.id),
        (old: EmailHistory[] | undefined) => 
          old ? [optimisticEmail as EmailHistory, ...old] : [optimisticEmail as EmailHistory]
      )
      
      return { previousHistory, invoiceId: invoice.id }
    },
    
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousHistory !== undefined) {
        queryClient.setQueryData(
          emailKeys.history(context.invoiceId),
          context.previousHistory
        )
      }
      
      console.error('Email sending failed:', error)
      toast.error('ემაილის გაგზავნა ვერ მოხერხდა')
    },
    
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      
      if (result.data?.success) {
        // Invalidate and refetch email history
        queryClient.invalidateQueries({ queryKey: emailKeys.history(variables.invoice.id) })
        
        // Show success message
        toast.success('ემაილი წარმატებით გაიგზავნა')
      } else {
        toast.error('ემაილის გაგზავნა ვერ მოხერხდა')
      }
    }
  })
}

/**
 * Hook for sending payment reminders
 */
export const useSendPaymentReminder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoice, reminderType }: { 
      invoice: InvoiceWithDetails
      reminderType: ReminderType['type']
    }) => sendPaymentReminder(invoice, reminderType),
    
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      
      if (result.data?.success) {
        queryClient.invalidateQueries({ queryKey: emailKeys.history(variables.invoice.id) })
        
        const reminderMessages = {
          gentle: 'ნაზი შეხსენება გაიგზავნა',
          firm: 'მკაცრი შეხსენება გაიგზავნა',
          final: 'საბოლოო შეხსენება გაიგზავნა'
        }
        
        toast.success(reminderMessages[variables.reminderType])
      }
    },
    
    onError: (error) => {
      console.error('Reminder sending failed:', error)
      toast.error('შეხსენების გაგზავნა ვერ მოხერხდა')
    }
  })
}

/**
 * Hook for sending payment confirmations
 */
export const useSendPaymentConfirmation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invoice: InvoiceWithDetails) => sendPaymentConfirmation(invoice),
    
    onSuccess: (result, invoice) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      
      if (result.data?.success) {
        queryClient.invalidateQueries({ queryKey: emailKeys.history(invoice.id) })
        toast.success('გადახდის დადასტურება გაიგზავნა')
      }
    },
    
    onError: (error) => {
      console.error('Confirmation sending failed:', error)
      toast.error('დადასტურების გაგზავნა ვერ მოხერხდა')
    }
  })
}

// =====================================
// EMAIL QUERY HOOKS
// =====================================

/**
 * Hook for fetching email history
 */
export const useEmailHistory = (invoiceId: string) => {
  return useQuery({
    queryKey: emailKeys.history(invoiceId),
    queryFn: () => getEmailHistory(invoiceId),
    enabled: !!invoiceId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes (replaces cacheTime)
    refetchOnWindowFocus: true,
    select: (response: ServiceResult<EmailHistory[]>) => {
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data || []
    }
  })
}

/**
 * Hook for getting email templates
 */
export const useEmailTemplates = () => {
  return useQuery({
    queryKey: emailKeys.templates(),
    queryFn: () => getEmailTemplates(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  })
}

// =====================================
// BULK EMAIL OPERATIONS
// =====================================

/**
 * Hook for bulk email operations
 */
export const useBulkEmailOperations = () => {
  const queryClient = useQueryClient()
  const sendEmail = useSendEmail()
  const sendReminder = useSendPaymentReminder()

  const bulkSendInvoices = async (
    invoices: InvoiceWithDetails[],
    options: Partial<EmailOptions> = {}
  ) => {
    const results = await Promise.allSettled(
      invoices.map(invoice => 
        sendEmail.mutateAsync({ invoice, options })
      )
    )
    
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.length - successful
    
    if (successful > 0) {
      toast.success(`${successful} ინვოისი წარმატებით გაიგზავნა`)
    }
    
    if (failed > 0) {
      toast.error(`${failed} ინვოისის გაგზავნა ვერ მოხერხდა`)
    }
    
    // Invalidate all email histories
    invoices.forEach(invoice => {
      queryClient.invalidateQueries({ queryKey: emailKeys.history(invoice.id) })
    })
  }

  const bulkSendReminders = async (
    invoices: InvoiceWithDetails[],
    reminderType: ReminderType['type'] = 'gentle'
  ) => {
    const results = await Promise.allSettled(
      invoices.map(invoice => 
        sendReminder.mutateAsync({ invoice, reminderType })
      )
    )
    
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.length - successful
    
    if (successful > 0) {
      toast.success(`${successful} შეხსენება გაიგზავნა`)
    }
    
    if (failed > 0) {
      toast.error(`${failed} შეხსენების გაგზავნა ვერ მოხერხდა`)
    }
    
    // Invalidate all email histories
    invoices.forEach(invoice => {
      queryClient.invalidateQueries({ queryKey: emailKeys.history(invoice.id) })
    })
  }

  return {
    bulkSendInvoices,
    bulkSendReminders,
    isLoading: sendEmail.isPending || sendReminder.isPending
  }
}

// =====================================
// EMAIL STATUS TRACKING
// =====================================

/**
 * Hook for tracking email delivery status
 */
export const useEmailDeliveryStatus = (invoiceId: string) => {
  const { data: emailHistory, isLoading } = useEmailHistory(invoiceId)
  
  if (!emailHistory || isLoading) {
    return {
      hasEmailsSent: false,
      lastEmailSent: null,
      deliveryStatus: null,
      totalEmailsSent: 0
    }
  }

  const invoiceEmails = emailHistory.filter(email => email.type === 'invoice')
  const reminderEmails = emailHistory.filter(email => email.type === 'reminder')
  
  const lastEmail = emailHistory[0] // Most recent
  
  return {
    hasEmailsSent: emailHistory.length > 0,
    lastEmailSent: lastEmail?.sent_at || null,
    deliveryStatus: lastEmail?.status || null,
    totalEmailsSent: emailHistory.length,
    invoiceEmailCount: invoiceEmails.length,
    reminderEmailCount: reminderEmails.length,
    lastInvoiceEmail: invoiceEmails[0] || null,
    lastReminderEmail: reminderEmails[0] || null
  }
}

// =====================================
// EMAIL UTILITY HOOKS
// =====================================

/**
 * Hook for email composition helpers
 */
export const useEmailComposition = (invoice: InvoiceWithDetails) => {
  const { data: templates } = useEmailTemplates()
  
  const getTemplateForInvoice = (templateId: string) => {
    return templates?.find(t => t.id === templateId)
  }
  
  const generateSubject = (templateId: string) => {
    const template = getTemplateForInvoice(templateId)
    if (!template) return ''
    
    return template.subject
      .replace('{invoice_number}', invoice.invoice_number || '')
      .replace('{company_name}', 'თქვენი კომპანია') // Should come from company data
  }
  
  const getDefaultRecipients = () => {
    const recipients = []
    
    if (invoice.client.email) {
      recipients.push(invoice.client.email)
    }
    
    return recipients
  }
  
  const canSendEmail = () => {
    return !!(invoice.client.email && invoice.client.email.includes('@'))
  }
  
  return {
    templates: templates || [],
    getTemplateForInvoice,
    generateSubject,
    getDefaultRecipients,
    canSendEmail: canSendEmail()
  }
}

/**
 * Hook for email analytics
 */
export const useEmailAnalytics = (invoiceIds: string[]) => {
  // Note: Hooks cannot be called inside loops or callbacks
  // This function should be refactored to use a single query for multiple invoice IDs
  // For now, returning a placeholder implementation
  
  const analytics = {
    totalEmailsSent: 0,
    deliveredEmails: 0,
    openedEmails: 0,
    clickedEmails: 0,
    failedEmails: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0
  }
  
  return {
    analytics,
    isLoading: false,
    error: null
  }
}

// =====================================
// COMBINED EMAIL OPERATIONS HOOK
// =====================================

/**
 * Combined hook for all email operations
 */
export const useEmailOperations = (invoice: InvoiceWithDetails) => {
  const sendInvoiceEmail = useSendEmail()
  const sendReminder = useSendPaymentReminder()
  const sendConfirmation = useSendPaymentConfirmation()
  const emailHistory = useEmailHistory(invoice.id)
  const deliveryStatus = useEmailDeliveryStatus(invoice.id)
  const composition = useEmailComposition(invoice)
  
  return {
    // Mutations
    sendInvoice: sendInvoiceEmail.mutate,
    sendInvoiceAsync: sendInvoiceEmail.mutateAsync,
    sendReminder: sendReminder.mutate,
    sendReminderAsync: sendReminder.mutateAsync,
    sendConfirmation: sendConfirmation.mutate,
    sendConfirmationAsync: sendConfirmation.mutateAsync,
    
    // Loading states
    isSendingInvoice: sendInvoiceEmail.isPending,
    isSendingReminder: sendReminder.isPending,
    isSendingConfirmation: sendConfirmation.isPending,
    isLoading: sendInvoiceEmail.isPending || sendReminder.isPending || sendConfirmation.isPending,
    
    // Data
    emailHistory: emailHistory.data || [],
    deliveryStatus,
    composition,
    
    // States
    canSendEmail: composition.canSendEmail,
    hasEmailHistory: (emailHistory.data || []).length > 0
  }
}

export {
  type EmailOptions,
  type EmailResponse,
  type EmailHistory,
  type EmailTemplate,
  type ReminderType
}