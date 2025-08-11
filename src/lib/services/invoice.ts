import { createClient } from '@/lib/supabase/client'
import type { 
  Invoice, 
  InvoiceItem, 
  CreateInvoice, 
  UpdateInvoice, 
  UpdateInvoiceStatus,
  InvoiceFilter 
} from '@/lib/validations/invoice'

// =====================================
// TYPE DEFINITIONS
// =====================================

export type InvoiceWithClient = Invoice & {
  client: {
    id: string
    name: string
    email: string | null
    type: 'individual' | 'company'
  }
}

export type InvoiceWithDetails = InvoiceWithClient & {
  items: InvoiceItem[]
}

export type InvoiceStats = {
  totalInvoices: number
  draftCount: number
  sentCount: number
  paidCount: number
  overdueCount: number
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
  thisMonthRevenue: number
  lastMonthRevenue: number
  averageInvoiceValue: number
  topClients: Array<{
    client_id: string
    client_name: string
    total_amount: number
    invoice_count: number
  }>
}

export type ServiceResult<T> = {
  data: T | null
  error: string | null
}

export type ServiceListResult<T> = {
  data: T[]
  count: number
  error: string | null
}

// =====================================
// HELPER FUNCTIONS
// =====================================

/**
 * Get Supabase client instance
 */
const getSupabase = () => createClient()

/**
 * Transform Supabase error to user-friendly message
 */
const handleError = (error: any, context: string): string => {
  console.error(`Invoice Service Error (${context}):`, error)
  
  if (error?.code === '23505') {
    return 'ინვოისის ნომერი უკვე არსებობს'
  }
  
  if (error?.code === '23503') {
    return 'მონაცემთა კავშირის შეცდომა'
  }
  
  if (error?.code === 'PGRST116') {
    return 'ინვოისი ვერ მოიძებნა'
  }
  
  return error?.message || 'დაფიქსირდა შეცდომა'
}

// Credit system removed - all features are now unlimited

// =====================================
// MAIN SERVICE FUNCTIONS
// =====================================

/**
 * Get paginated list of invoices with filtering
 */
export const getInvoices = async (filter: InvoiceFilter): Promise<ServiceListResult<InvoiceWithClient>> => {
  const supabase = getSupabase()
  
  try {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients!inner(
          id,
          name,
          email,
          type
        )
      `, { count: 'exact' })
    
    // Apply status filter
    if (filter.status && filter.status !== 'all') {
      query = query.eq('status', filter.status)
    }
    
    // Apply client filter
    if (filter.client_id) {
      query = query.eq('client_id', filter.client_id)
    }
    
    // Apply date range filters
    if (filter.date_from) {
      query = query.gte('issue_date', filter.date_from.toISOString().split('T')[0])
    }
    
    if (filter.date_to) {
      query = query.lte('issue_date', filter.date_to.toISOString().split('T')[0])
    }
    
    // Apply search filter
    if (filter.search) {
      query = query.or(`
        invoice_number.ilike.%${filter.search}%,
        notes.ilike.%${filter.search}%,
        clients.name.ilike.%${filter.search}%
      `)
    }
    
    // Apply sorting
    const sortDirection = filter.sort_order === 'asc'
    query = query.order(filter.sort_by, { ascending: sortDirection })
    
    // Apply pagination
    const from = filter.offset
    const to = filter.offset + filter.limit - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      return {
        data: [],
        count: 0,
        error: handleError(error, 'getInvoices')
      }
    }
    
    return {
      data: data as InvoiceWithClient[],
      count: count || 0,
      error: null
    }
    
  } catch (error) {
    return {
      data: [],
      count: 0,
      error: handleError(error, 'getInvoices')
    }
  }
}

/**
 * Get single invoice with items and client details
 */
export const getInvoice = async (id: string): Promise<ServiceResult<InvoiceWithDetails>> => {
  const supabase = getSupabase()
  
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(
          id,
          name,
          email,
          type,
          phone,
          address_line1,
          address_line2,
          city,
          postal_code,
          tax_id
        ),
        items:invoice_items(
          id,
          description,
          quantity,
          unit_price,
          line_total,
          sort_order
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      return {
        data: null,
        error: handleError(error, 'getInvoice')
      }
    }
    
    if (!data) {
      return {
        data: null,
        error: 'ინვოისი ვერ მოიძებნა'
      }
    }
    
    // Sort items by sort_order
    if (data.items) {
      data.items.sort((a: InvoiceItem, b: InvoiceItem) => 
        (a.sort_order || 0) - (b.sort_order || 0)
      )
    }
    
    return {
      data: data as InvoiceWithDetails,
      error: null
    }
    
  } catch (error) {
    return {
      data: null,
      error: handleError(error, 'getInvoice')
    }
  }
}

/**
 * Create new invoice with items
 */
export const createInvoice = async (data: CreateInvoice): Promise<ServiceResult<Invoice>> => {
  const supabase = getSupabase()
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'მომხმარებელი ვერ მოიძებნა' }
    }
    
    // No credit check needed - unlimited access
    
    // Calculate due_date
    const due_date = new Date(data.issue_date)
    due_date.setDate(due_date.getDate() + (data.due_days || 14))
    
    // Start transaction
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        company_id: data.company_id,
        client_id: data.client_id,
        issue_date: data.issue_date.toISOString().split('T')[0],
        due_date: due_date.toISOString().split('T')[0],
        currency: data.currency,
        vat_rate: data.vat_rate,
        notes: data.notes,
        payment_instructions: data.payment_instructions
      })
      .select()
      .single()
    
    if (invoiceError) {
      return {
        data: null,
        error: handleError(invoiceError, 'createInvoice - invoice')
      }
    }
    
    // Generate invoice number using database function
    const { data: numberData, error: numberError } = await supabase
      .rpc('generate_invoice_number', { p_company_id: data.company_id })
    
    if (numberError) {
      // Rollback - delete the invoice
      await supabase.from('invoices').delete().eq('id', invoiceData.id)
      return {
        data: null,
        error: handleError(numberError, 'createInvoice - generate number')
      }
    }
    
    // Update invoice with generated number
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ invoice_number: numberData })
      .eq('id', invoiceData.id)
    
    if (updateError) {
      // Rollback
      await supabase.from('invoices').delete().eq('id', invoiceData.id)
      return {
        data: null,
        error: handleError(updateError, 'createInvoice - update number')
      }
    }
    
    // Create invoice items
    const itemsToInsert = data.items.map((item, index) => ({
      invoice_id: invoiceData.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.quantity * item.unit_price,
      sort_order: index
    }))
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert)
    
    if (itemsError) {
      // Rollback
      await supabase.from('invoices').delete().eq('id', invoiceData.id)
      return {
        data: null,
        error: handleError(itemsError, 'createInvoice - items')
      }
    }
    
    // No credit deduction - unlimited access
    
    // Calculate totals using database function
    await supabase.rpc('calculate_invoice_totals', { p_invoice_id: invoiceData.id })
    
    // Get final invoice data
    const finalInvoice = { ...invoiceData, invoice_number: numberData }
    
    return {
      data: finalInvoice as Invoice,
      error: null
    }
    
  } catch (error) {
    return {
      data: null,
      error: handleError(error, 'createInvoice')
    }
  }
}

/**
 * Update existing invoice and items
 */
export const updateInvoice = async (data: UpdateInvoice): Promise<ServiceResult<Invoice>> => {
  const supabase = getSupabase()
  
  try {
    // Check if invoice can be edited
    const { data: currentInvoice, error: checkError } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', data.id)
      .single()
    
    if (checkError) {
      return {
        data: null,
        error: handleError(checkError, 'updateInvoice - check')
      }
    }
    
    if (currentInvoice.status !== 'draft') {
      return {
        data: null,
        error: 'მხოლოდ მონახაზის სტატუსის ინვოისები შეიძლება რედაქტირდეს'
      }
    }
    
    // Update invoice
    const updateData: any = { ...data }
    delete updateData.id
    delete updateData.items
    
    if (updateData.issue_date) {
      updateData.issue_date = updateData.issue_date.toISOString().split('T')[0]
    }
    if (updateData.due_date) {
      updateData.due_date = updateData.due_date.toISOString().split('T')[0]
    }
    
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single()
    
    if (invoiceError) {
      return {
        data: null,
        error: handleError(invoiceError, 'updateInvoice - invoice')
      }
    }
    
    // Update items if provided
    if (data.items) {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', data.id)
      
      if (deleteError) {
        return {
          data: null,
          error: handleError(deleteError, 'updateInvoice - delete items')
        }
      }
      
      // Insert new items
      const itemsToInsert = data.items.map((item, index) => ({
        invoice_id: data.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price,
        sort_order: index
      }))
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert)
      
      if (itemsError) {
        return {
          data: null,
          error: handleError(itemsError, 'updateInvoice - items')
        }
      }
      
      // Recalculate totals
      await supabase.rpc('calculate_invoice_totals', { p_invoice_id: data.id })
    }
    
    return {
      data: invoiceData as Invoice,
      error: null
    }
    
  } catch (error) {
    return {
      data: null,
      error: handleError(error, 'updateInvoice')
    }
  }
}

/**
 * Update invoice status with timestamps
 */
export const updateInvoiceStatus = async (data: UpdateInvoiceStatus): Promise<ServiceResult<Invoice>> => {
  const supabase = getSupabase()
  
  try {
    const updateData: any = { status: data.status }
    
    // Set timestamps based on status
    if (data.status === 'sent' && data.sent_at) {
      updateData.sent_at = data.sent_at.toISOString()
    }
    
    if (data.status === 'paid' && data.paid_at) {
      updateData.paid_at = data.paid_at.toISOString()
    }
    
    const { data: invoiceData, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single()
    
    if (error) {
      return {
        data: null,
        error: handleError(error, 'updateInvoiceStatus')
      }
    }
    
    return {
      data: invoiceData as Invoice,
      error: null
    }
    
  } catch (error) {
    return {
      data: null,
      error: handleError(error, 'updateInvoiceStatus')
    }
  }
}

/**
 * Delete invoice and all items
 */
export const deleteInvoice = async (id: string): Promise<{ success: boolean; error: string | null }> => {
  const supabase = getSupabase()
  
  try {
    // Check if invoice can be deleted
    const { data: invoice, error: checkError } = await supabase
      .from('invoices')
      .select('status')
      .eq('id', id)
      .single()
    
    if (checkError) {
      return {
        success: false,
        error: handleError(checkError, 'deleteInvoice - check')
      }
    }
    
    if (invoice.status !== 'draft') {
      return {
        success: false,
        error: 'მხოლოდ მონახაზის სტატუსის ინვოისები შეიძლება წაიშალოს'
      }
    }
    
    // Delete invoice (items will be deleted by cascade)
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
    
    if (error) {
      return {
        success: false,
        error: handleError(error, 'deleteInvoice')
      }
    }
    
    // Return credit to user
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await updateUserCredits(user.id, 1)
    }
    
    return {
      success: true,
      error: null
    }
    
  } catch (error) {
    return {
      success: false,
      error: handleError(error, 'deleteInvoice')
    }
  }
}

/**
 * Create copy of existing invoice as draft
 */
export const duplicateInvoice = async (id: string): Promise<ServiceResult<Invoice>> => {
  const supabase = getSupabase()
  
  try {
    // Get original invoice with items
    const originalResult = await getInvoice(id)
    if (originalResult.error || !originalResult.data) {
      return {
        data: null,
        error: originalResult.error || 'ორიგინალი ინვოისი ვერ მოიძებნა'
      }
    }
    
    const original = originalResult.data
    
    // Create new invoice data
    const newInvoiceData: CreateInvoice = {
      company_id: original.company_id,
      client_id: original.client_id,
      issue_date: new Date(),
      due_days: 14,
      currency: original.currency,
      vat_rate: original.vat_rate,
      notes: original.notes,
      payment_instructions: original.payment_instructions,
      items: original.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))
    }
    
    // Create the duplicate
    return await createInvoice(newInvoiceData)
    
  } catch (error) {
    return {
      data: null,
      error: handleError(error, 'duplicateInvoice')
    }
  }
}

/**
 * Get dashboard statistics for company
 */
export const getInvoiceStats = async (companyId: string): Promise<ServiceResult<InvoiceStats>> => {
  const supabase = getSupabase()
  
  try {
    // Get basic counts and totals
    const { data: statsData, error: statsError } = await supabase
      .from('invoices')
      .select('status, total, issue_date')
      .eq('company_id', companyId)
    
    if (statsError) {
      return {
        data: null,
        error: handleError(statsError, 'getInvoiceStats - basic')
      }
    }
    
    // Calculate statistics
    const stats: InvoiceStats = {
      totalInvoices: statsData.length,
      draftCount: 0,
      sentCount: 0,
      paidCount: 0,
      overdueCount: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      thisMonthRevenue: 0,
      lastMonthRevenue: 0,
      averageInvoiceValue: 0,
      topClients: []
    }
    
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const lastMonth = new Date(thisMonth)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    statsData.forEach(invoice => {
      // Count by status
      if (invoice.status === 'draft') stats.draftCount++
      else if (invoice.status === 'sent') stats.sentCount++
      else if (invoice.status === 'paid') stats.paidCount++
      else if (invoice.status === 'overdue') stats.overdueCount++
      
      // Sum amounts
      stats.totalAmount += invoice.total
      
      if (invoice.status === 'paid') {
        stats.paidAmount += invoice.total
      } else if (invoice.status === 'sent') {
        stats.pendingAmount += invoice.total
      } else if (invoice.status === 'overdue') {
        stats.overdueAmount += invoice.total
      }
      
      // Monthly revenue
      const issueDate = new Date(invoice.issue_date)
      if (issueDate >= thisMonth && invoice.status === 'paid') {
        stats.thisMonthRevenue += invoice.total
      } else if (issueDate >= lastMonth && issueDate < thisMonth && invoice.status === 'paid') {
        stats.lastMonthRevenue += invoice.total
      }
    })
    
    // Calculate average
    if (stats.totalInvoices > 0) {
      stats.averageInvoiceValue = stats.totalAmount / stats.totalInvoices
    }
    
    // Get top clients
    const { data: clientsData, error: clientsError } = await supabase
      .from('invoices')
      .select(`
        client_id,
        total,
        client:clients(name)
      `)
      .eq('company_id', companyId)
      .eq('status', 'paid')
    
    if (!clientsError && clientsData) {
      const clientMap = new Map<string, { name: string; total: number; count: number }>()
      
      clientsData.forEach(invoice => {
        const existing = clientMap.get(invoice.client_id)
        if (existing) {
          existing.total += invoice.total
          existing.count += 1
        } else {
          clientMap.set(invoice.client_id, {
            name: invoice.client.name,
            total: invoice.total,
            count: 1
          })
        }
      })
      
      stats.topClients = Array.from(clientMap.entries())
        .map(([client_id, data]) => ({
          client_id,
          client_name: data.name,
          total_amount: data.total,
          invoice_count: data.count
        }))
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, 5)
    }
    
    return {
      data: stats,
      error: null
    }
    
  } catch (error) {
    return {
      data: null,
      error: handleError(error, 'getInvoiceStats')
    }
  }
}

// =====================================
// ADMIN FUNCTIONS
// =====================================

/**
 * Mark invoices as overdue (admin/cron function)
 */
export const markInvoicesOverdue = async (): Promise<{ count: number; error: string | null }> => {
  const supabase = getSupabase()
  
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('invoices')
      .update({ status: 'overdue' })
      .eq('status', 'sent')
      .lt('due_date', today)
      .select('id')
    
    if (error) {
      return {
        count: 0,
        error: handleError(error, 'markInvoicesOverdue')
      }
    }
    
    return {
      count: data?.length || 0,
      error: null
    }
    
  } catch (error) {
    return {
      count: 0,
      error: handleError(error, 'markInvoicesOverdue')
    }
  }
}

/**
 * Check if user can access invoice
 */
export const checkInvoicePermission = async (invoiceId: string, userId: string): Promise<boolean> => {
  const supabase = getSupabase()
  
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id')
      .eq('id', invoiceId)
      .single()
    
    // RLS will automatically filter based on user's company
    return !error && !!data
    
  } catch (error) {
    return false
  }
}

// =====================================
// UTILITY FUNCTIONS
// =====================================

/**
 * Get invoice number for display
 */
export const getInvoiceDisplayNumber = (invoice: Invoice): string => {
  return invoice.invoice_number || `DRAFT-${invoice.id.slice(0, 8)}`
}

/**
 * Get invoice status color class
 */
export const getInvoiceStatusColor = (status: Invoice['status']): string => {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-500'
  }
  return colors[status] || colors.draft
}

/**
 * Check if invoice can be edited
 */
export const canEditInvoice = (status: Invoice['status']): boolean => {
  return status === 'draft'
}

/**
 * Check if invoice can be deleted
 */
export const canDeleteInvoice = (status: Invoice['status']): boolean => {
  return status === 'draft'
}

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number, currency: string = 'GEL'): string => {
  const symbols = {
    GEL: '₾',
    USD: '$',
    EUR: '€'
  }
  
  return `${symbols[currency as keyof typeof symbols] || currency} ${amount.toFixed(2)}`
}