import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { ClientFormData, ClientFilter } from '@/lib/validations/client'
import type { Client } from '@/types/database'

export const clientService = {
  // Get all clients for a company
  async getClients(companyId: string, filters?: ClientFilter) {
    const supabase = createClient()
    
    let query = supabase
      .from('clients')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,tax_id.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  // Get single client
  async getClient(id: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create client
  async createClient(companyId: string, data: ClientFormData) {
    const supabase = createClient()
    
    try {
      // Comprehensive duplicate checks before insertion
      const duplicateChecks = []
      
      // Check for duplicate tax_id (for companies)
      if (data.type === 'company' && data.tax_id) {
        duplicateChecks.push(
          supabase
            .from('clients')
            .select('id, name')
            .eq('company_id', companyId)
            .eq('tax_id', data.tax_id)
            .maybeSingle()
        )
      }
      
      // Check for duplicate email (if provided)
      if (data.email && data.email.trim() !== '') {
        duplicateChecks.push(
          supabase
            .from('clients')
            .select('id, name')
            .eq('company_id', companyId)
            .eq('email', data.email.trim())
            .maybeSingle()
        )
      }
      
      // Check for duplicate name (exact match)
      if (data.name && data.name.trim() !== '') {
        duplicateChecks.push(
          supabase
            .from('clients')
            .select('id, name')
            .eq('company_id', companyId)
            .eq('name', data.name.trim())
            .maybeSingle()
        )
      }
      
      // Execute all duplicate checks
      if (duplicateChecks.length > 0) {
        const results = await Promise.all(duplicateChecks)
        
        // Check tax_id duplicate
        if (data.type === 'company' && data.tax_id && results[0]?.data) {
          throw new Error(`კლიენტი საიდენტიფიკაციო კოდით "${data.tax_id}" უკვე არსებობს`)
        }
        
        // Check email duplicate
        const emailCheckIndex = data.type === 'company' && data.tax_id ? 1 : 0
        if (data.email && data.email.trim() !== '' && results[emailCheckIndex]?.data) {
          throw new Error(`კლიენტი ელ.ფოსტით "${data.email}" უკვე არსებობს`)
        }
        
        // Check name duplicate
        const nameCheckIndex = emailCheckIndex + (data.email && data.email.trim() !== '' ? 1 : 0)
        if (data.name && results[nameCheckIndex]?.data) {
          throw new Error(`კლიენტი სახელით "${data.name}" უკვე არსებობს`)
        }
      }
      
      // Clean the data before insertion
      const cleanData = {
        ...data,
        name: data.name?.trim(),
        email: data.email?.trim() || null,
        tax_id: data.tax_id?.trim() || null,
        phone: data.phone?.trim() || null,
        address_line1: data.address_line1?.trim() || null,
        address_line2: data.address_line2?.trim() || null,
        city: data.city?.trim() || null,
        postal_code: data.postal_code?.trim() || null,
        contact_person: data.contact_person?.trim() || null,
        notes: data.notes?.trim() || null,
      }
      
      // Remove empty strings and convert to null
      Object.keys(cleanData).forEach(key => {
        const typedKey = key as keyof typeof cleanData
        if (cleanData[typedKey] === '') {
          (cleanData as any)[typedKey] = null
        }
      })
      
      const { data: client, error } = await supabase
        .from('clients')
        .insert({
          company_id: companyId,
          ...cleanData,
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase client creation error:', error)
        
        // Handle specific error codes
        if (error.code === '23505') { // Unique constraint violation
          // Try to determine which field caused the conflict
          if (error.message.includes('tax_id')) {
            throw new Error('ამ საიდენტიფიკაციო კოდით კლიენტი უკვე არსებობს')
          } else if (error.message.includes('email')) {
            throw new Error('ამ ელ.ფოსტით კლიენტი უკვე არსებობს')
          } else if (error.message.includes('name')) {
            throw new Error('ამ სახელით კლიენტი უკვე არსებობს')
          } else {
            throw new Error('ამ მონაცემებით კლიენტი უკვე არსებობს')
          }
        } else if (error.code === '23502') { // Not null constraint violation
          throw new Error('ყველა სავალდებულო ველი უნდა იყოს შევსებული')
        } else if (error.code === '23514') { // Check constraint violation
          throw new Error('მონაცემები არ აკმაყოფილებს მოთხოვნებს')
        }
        
        throw new Error(`კლიენტის დამატება ვერ მოხერხდა: ${error.message}`)
      }
      
      return client
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('კლიენტის დამატება ვერ მოხერხდა')
    }
  },

  // Update client
  async updateClient(id: string, data: Partial<ClientFormData>) {
    const supabase = createClient()
    
    const { data: client, error } = await supabase
      .from('clients')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return client
  },

  // Delete client
  async deleteClient(id: string) {
    const supabase = createClient()
    
    try {
      // First check for invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('client_id', id)
      
      if (invoices && invoices.length > 0) {
        // Delete invoice items first
        const invoiceIds = invoices.map(inv => inv.id)
        
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .delete()
          .in('invoice_id', invoiceIds)
        
        if (itemsError) throw itemsError
        
        // Delete invoices
        const { error: invoicesError } = await supabase
          .from('invoices')
          .delete()
          .eq('client_id', id)
        
        if (invoicesError) throw invoicesError
      }
      
      // Finally delete the client
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      return { success: true, message: 'კლიენტი წარმატებით წაიშალა' }
    } catch (error) {
      console.error('Error deleting client:', error)
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'კლიენტის წაშლა ვერ მოხერხდა' 
      }
    }
  },

  // Toggle client active status
  async toggleClientStatus(id: string, is_active: boolean) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('clients')
      .update({ is_active })
      .eq('id', id)

    if (error) throw error
  },

  // Get client statistics
  async getClientStats() {
    try {
      const response = await fetch('/api/clients/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch client stats')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching client stats:', error)
      throw error
    }
  }
}