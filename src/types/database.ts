// Database types matching actual Supabase schema
export interface Database {
  public: {
    Tables: {
      // Profiles table
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Companies table
      companies: {
        Row: {
          id: string
          user_id: string
          name: string
          tax_id: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          postal_code: string | null
          phone: string | null
          email: string | null
          website: string | null
          logo_url: string | null
          bank_name: string | null
          bank_account: string | null
          bank_swift: string | null
          invoice_prefix: string | null
          invoice_counter: number | null
          invoice_notes: string | null
          payment_terms: string | null
          vat_rate: number | null
          currency: string | null
          created_at: string
          updated_at: string
          default_payment_terms: number | null
          default_currency: string | null
          default_vat_rate: number | null
          default_due_days: number | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          tax_id?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          postal_code?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          bank_name?: string | null
          bank_account?: string | null
          bank_swift?: string | null
          invoice_prefix?: string | null
          invoice_counter?: number | null
          invoice_notes?: string | null
          payment_terms?: string | null
          vat_rate?: number | null
          currency?: string | null
          created_at?: string
          updated_at?: string
          default_payment_terms?: number | null
          default_currency?: string | null
          default_vat_rate?: number | null
          default_due_days?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          tax_id?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          postal_code?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          bank_name?: string | null
          bank_account?: string | null
          bank_swift?: string | null
          invoice_prefix?: string | null
          invoice_counter?: number | null
          invoice_notes?: string | null
          payment_terms?: string | null
          vat_rate?: number | null
          currency?: string | null
          created_at?: string
          updated_at?: string
          default_payment_terms?: number | null
          default_currency?: string | null
          default_vat_rate?: number | null
          default_due_days?: number | null
        }
      }
      // User Credits table
      user_credits: {
        Row: {
          id: string
          user_id: string
          total_credits: number
          used_credits: number
          plan_type: 'free' | 'basic' | 'pro' | null
          plan_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_credits?: number
          used_credits?: number
          plan_type?: 'free' | 'basic' | 'pro' | null
          plan_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_credits?: number
          used_credits?: number
          plan_type?: 'free' | 'basic' | 'pro' | null
          plan_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Clients table
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
          is_active: boolean | null
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
          is_active?: boolean | null
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
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      // Invoices table
      invoices: {
        Row: {
          id: string
          company_id: string
          client_id: string
          invoice_number: string
          issue_date: string
          due_date: string
          status: 'draft' | 'sent' | 'paid' | 'overdue'
          subtotal: number
          vat_rate: number
          vat_amount: number
          total: number
          created_at: string | null
          updated_at: string | null
          currency: 'GEL' | 'USD' | 'EUR' | null
          sent_at: string | null
          paid_at: string | null
          public_token: string | null
          public_enabled: boolean
          public_expires_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          client_id: string
          invoice_number: string
          issue_date?: string
          due_date: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          subtotal?: number
          vat_rate?: number
          vat_amount?: number
          total?: number
          created_at?: string | null
          updated_at?: string | null
          currency?: 'GEL' | 'USD' | 'EUR' | null
          sent_at?: string | null
          paid_at?: string | null
          public_token?: string | null
          public_enabled?: boolean
          public_expires_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          client_id?: string
          invoice_number?: string
          issue_date?: string
          due_date?: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          subtotal?: number
          vat_rate?: number
          vat_amount?: number
          total?: number
          created_at?: string | null
          updated_at?: string | null
          currency?: 'GEL' | 'USD' | 'EUR' | null
          sent_at?: string | null
          paid_at?: string | null
          public_token?: string | null
          public_enabled?: boolean
          public_expires_at?: string | null
        }
      }
      // Invoice Items table
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          line_total: number
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity?: number
          unit_price: number
          line_total: number
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          line_total?: number
          sort_order?: number | null
          created_at?: string | null
        }
      }
    }
  }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type NewProfile = Database['public']['Tables']['profiles']['Insert']
export type UpdateProfile = Database['public']['Tables']['profiles']['Update']

export type Company = Database['public']['Tables']['companies']['Row']
export type NewCompany = Database['public']['Tables']['companies']['Insert']
export type UpdateCompany = Database['public']['Tables']['companies']['Update']

export type UserCredits = Database['public']['Tables']['user_credits']['Row']
export type NewUserCredits = Database['public']['Tables']['user_credits']['Insert']
export type UpdateUserCredits = Database['public']['Tables']['user_credits']['Update']

export type Client = Database['public']['Tables']['clients']['Row']
export type NewClient = Database['public']['Tables']['clients']['Insert']
export type UpdateClient = Database['public']['Tables']['clients']['Update']

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type NewInvoice = Database['public']['Tables']['invoices']['Insert']
export type UpdateInvoice = Database['public']['Tables']['invoices']['Update']

export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row']
export type NewInvoiceItem = Database['public']['Tables']['invoice_items']['Insert']
export type UpdateInvoiceItem = Database['public']['Tables']['invoice_items']['Update']

// Constants
export const CLIENT_TYPES = {
  individual: 'ფიზიკური პირი',
  company: 'იურიდიული პირი'
} as const

export const INVOICE_STATUS = {
  draft: 'გადასახდელი',
  sent: 'გაგზავნილი',
  paid: 'გადახდილი',
  overdue: 'ვადაგადაცილებული'
} as const

export const PLAN_TYPES = {
  free: 'უფასო',
  basic: 'საბაზისო',
  pro: 'პროფესიონალი'
} as const