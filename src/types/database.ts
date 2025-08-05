// Add to existing file
export interface Database {
  public: {
    Tables: {
      // ... existing tables
      clients: {
        Row: {
          id: string
          company_id: string
          type: 'individual' | 'company'
          name: string
          tax_id: string | null
          email: string | null
          phone: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          postal_code: string | null
          contact_person: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          type: 'individual' | 'company'
          name: string
          tax_id?: string | null
          email?: string | null
          phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          postal_code?: string | null
          contact_person?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          type?: 'individual' | 'company'
          name?: string
          tax_id?: string | null
          email?: string | null
          phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          postal_code?: string | null
          contact_person?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Helper types
export type Client = Database['public']['Tables']['clients']['Row']
export type NewClient = Database['public']['Tables']['clients']['Insert']
export type UpdateClient = Database['public']['Tables']['clients']['Update']

export const CLIENT_TYPES = {
  individual: 'ფიზიკური პირი',
  company: 'იურიდიული პირი'
} as const