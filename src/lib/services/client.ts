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
    
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        company_id: companyId,
        ...data,
      })
      .select()
      .single()

    if (error) throw error
    return client
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
    
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) throw error
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
  async getClientStats(companyId: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('clients')
      .select('type, is_active')
      .eq('company_id', companyId)

    if (error) throw error

    const stats = {
      total: data.length,
      active: data.filter(c => c.is_active).length,
      inactive: data.filter(c => !c.is_active).length,
      individuals: data.filter(c => c.type === 'individual').length,
      companies: data.filter(c => c.type === 'company').length,
    }

    return stats
  }
}