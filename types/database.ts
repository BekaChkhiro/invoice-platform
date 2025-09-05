export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          bank_account: string | null
          bank_name: string | null
          bank_swift: string | null
          city: string | null
          created_at: string
          currency: string | null
          default_currency: string | null
          default_due_days: number | null
          default_payment_terms: number | null
          default_vat_rate: number | null
          email: string | null
          id: string
          invoice_counter: number | null
          invoice_notes: string | null
          invoice_prefix: string | null
          logo_url: string | null
          name: string
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
          vat_rate: number | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          bank_account?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          city?: string | null
          created_at?: string
          currency?: string | null
          default_currency?: string | null
          default_due_days?: number | null
          default_payment_terms?: number | null
          default_vat_rate?: number | null
          email?: string | null
          id?: string
          invoice_counter?: number | null
          invoice_notes?: string | null
          invoice_prefix?: string | null
          logo_url?: string | null
          name: string
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
          vat_rate?: number | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          bank_account?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          city?: string | null
          created_at?: string
          currency?: string | null
          default_currency?: string | null
          default_due_days?: number | null
          default_payment_terms?: number | null
          default_vat_rate?: number | null
          email?: string | null
          id?: string
          invoice_counter?: number | null
          invoice_notes?: string | null
          invoice_prefix?: string | null
          logo_url?: string | null
          name?: string
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
          vat_rate?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          created_at: string
          id: string
          plan_expires_at: string | null
          plan_type: string | null
          total_credits: number
          updated_at: string
          used_credits: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_expires_at?: string | null
          plan_type?: string | null
          total_credits?: number
          updated_at?: string
          used_credits?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_expires_at?: string | null
          plan_type?: string | null
          total_credits?: number
          updated_at?: string
          used_credits?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_id: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          tax_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_id: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          tax_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_id?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          tax_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_bank_accounts: {
        Row: {
          account_name: string | null
          account_number: string
          bank_name: string
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          updated_at: string | null
        }
        Insert: {
          account_name?: string | null
          account_number: string
          bank_name: string
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string
          bank_name?: string
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          bank_account_id: string | null
          client_id: string
          company_id: string
          created_at: string | null
          currency: string | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_at: string | null
          payment_instructions: string | null
          public_enabled: boolean
          public_expires_at: string | null
          public_token: string | null
          sent_at: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string | null
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          bank_account_id?: string | null
          client_id: string
          company_id: string
          created_at?: string | null
          currency?: string | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          payment_instructions?: string | null
          public_enabled?: boolean
          public_expires_at?: string | null
          public_token?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          bank_account_id?: string | null
          client_id?: string
          company_id?: string
          created_at?: string | null
          currency?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          payment_instructions?: string | null
          public_enabled?: boolean
          public_expires_at?: string | null
          public_token?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "company_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          line_total: number
          quantity: number
          sort_order: number | null
          unit_price: number
          service_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          line_total: number
          quantity?: number
          sort_order?: number | null
          unit_price: number
          service_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number
          quantity?: number
          sort_order?: number | null
          unit_price?: number
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          default_price: number | null
          unit: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          default_price?: number | null
          unit?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          default_price?: number | null
          unit?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_cycle: string | null
          created_at: string | null
          currency: string | null
          display_name: string
          features: Json
          id: string
          invoice_limit: number | null
          is_active: boolean | null
          name: string
          price: number
          sort_order: number | null
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string | null
          currency?: string | null
          display_name: string
          features?: Json
          id?: string
          invoice_limit?: number | null
          is_active?: boolean | null
          name: string
          price?: number
          sort_order?: number | null
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string | null
          currency?: string | null
          display_name?: string
          features?: Json
          id?: string
          invoice_limit?: number | null
          is_active?: boolean | null
          name?: string
          price?: number
          sort_order?: number | null
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          invoices_used: number | null
          plan_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          invoices_used?: number | null
          plan_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          invoices_used?: number | null
          plan_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          payment_date: string | null
          payment_method: string | null
          status: string | null
          subscription_id: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          subscription_id?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          subscription_id?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_invoice_totals: {
        Args: { p_invoice_id: string }
        Returns: {
          subtotal: number
          total: number
          vat_amount: number
        }[]
      }
      check_invoice_limit: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      generate_invoice_number: {
        Args: { company_uuid: string }
        Returns: string
      }
      get_user_current_plan: {
        Args: { user_uuid: string }
        Returns: {
          expires_at: string
          features: Json
          invoice_limit: number
          invoices_used: number
          plan_name: string
        }[]
      }
      update_user_credits: {
        Args: { p_credit_change: number; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
  ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

// Helper types for clients
export type Client = Database['public']['Tables']['clients']['Row']
export type NewClient = Database['public']['Tables']['clients']['Insert']
export type UpdateClient = Database['public']['Tables']['clients']['Update']

// Helper types for services
export type Service = Database['public']['Tables']['services']['Row']
export type NewService = Database['public']['Tables']['services']['Insert']
export type UpdateService = Database['public']['Tables']['services']['Update']

// Helper types for invoices
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type NewInvoice = Database['public']['Tables']['invoices']['Insert']
export type UpdateInvoice = Database['public']['Tables']['invoices']['Update']

// Helper types for invoice items
export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row']
export type NewInvoiceItem = Database['public']['Tables']['invoice_items']['Insert']
export type UpdateInvoiceItem = Database['public']['Tables']['invoice_items']['Update']

export const CLIENT_TYPES = {
  individual: 'ფიზიკური პირი',
  company: 'იურიდიული პირი'
} as const

export const INVOICE_STATUSES = {
  draft: 'დრაფტი',
  sent: 'გაგზავნილი',
  paid: 'გადახდილი',
  overdue: 'ვადაგადაცილებული'
} as const