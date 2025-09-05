import { z } from 'zod'

// =====================================
// INVOICE ITEM SCHEMA
// =====================================

/**
 * Validation schema for individual invoice items
 * Matches the invoice_items database table structure
 */
export const invoiceItemSchema = z.object({
  id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional().nullable(),
  description: z.string()
    .min(1, 'აღწერა აუცილებელია')
    .max(500, 'აღწერა ძალიან გრძელია'),
  quantity: z.number()
    .min(0.001, 'რაოდენობა უნდა იყოს დადებითი')
    .max(999999, 'რაოდენობა ძალიან დიდია'),
  unit_price: z.number()
    .min(0, 'ფასი არ შეიძლება იყოს უარყოფითი')
    .max(999999999, 'ფასი ძალიან დიდია'),
  line_total: z.number().optional(),
  sort_order: z.number().optional()
})

// =====================================
// MAIN INVOICE SCHEMA
// =====================================

/**
 * Main invoice validation schema
 * Matches the invoices database table structure
 */
export const invoiceSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  client_id: z.string().uuid('კლიენტის არჩევა აუცილებელია'),
  bank_account_ids: z.array(z.string().uuid())
    .min(1, 'მინიმუმ ერთი ანგარიში უნდა იყოს არჩეული')
    .optional(),
  invoice_number: z.string().optional(),
  issue_date: z.date().default(() => new Date()),
  due_date: z.date(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .default('draft'),
  currency: z.enum(['GEL', 'USD', 'EUR']).default('GEL'),
  vat_rate: z.number()
    .min(0, 'დღგ განაკვეთი არ შეიძლება იყოს უარყოფითი')
    .max(100, 'დღგ განაკვეთი არ შეიძლება აღემატებოდეს 100%-ს')
    .default(18),
  public_token: z.string().optional(),
  public_enabled: z.boolean().default(true),
  public_expires_at: z.date().optional(),
  items: z.array(invoiceItemSchema)
    .min(1, 'მინიმუმ ერთი პროდუქტი/სერვისი აუცილებელია')
    .max(50, 'მაქსიმუმ 50 პროდუქტი/სერვისი შეიძლება')
})

// =====================================
// SPECIALIZED SCHEMAS
// =====================================

/**
 * Schema for creating new invoices
 * Omits auto-generated fields and adds due_days helper
 */
export const createInvoiceSchema = invoiceSchema.omit({
  id: true,
  invoice_number: true,
  status: true
}).extend({
  due_days: z.number()
    .min(1, 'გადახდის ვადა მინიმუმ 1 დღე უნდა იყოს')
    .max(365, 'გადახდის ვადა მაქსიმუმ 365 დღე შეიძლება იყოს')
    .default(14)
    .optional()
})

/**
 * Schema for updating existing invoices
 * All fields are optional except id
 */
export const updateInvoiceSchema = invoiceSchema.partial().extend({
  id: z.string().uuid('ინვოისის ID აუცილებელია')
})

/**
 * Schema for updating invoice status
 * Used when marking invoices as sent, paid, etc.
 */
export const updateInvoiceStatusSchema = z.object({
  id: z.string().uuid('ინვოისის ID აუცილებელია'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  sent_at: z.date().optional(),
  paid_at: z.date().optional()
})

/**
 * Schema for filtering and searching invoices
 * Used in invoice list pages with pagination
 */
export const invoiceFilterSchema = z.object({
  status: z.enum(['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .default('all'),
  client_id: z.string().uuid().optional(),
  date_from: z.date().optional(),
  date_to: z.date().optional(),
  search: z.string()
    .max(100, 'ძებნის ტექსტი ძალიან გრძელია')
    .optional(),
  limit: z.number()
    .min(1, 'ლიმიტი მინიმუმ 1 უნდა იყოს')
    .max(100, 'ლიმიტი მაქსიმუმ 100 შეიძლება იყოს')
    .default(10),
  offset: z.number()
    .min(0, 'ოფსეტი არ შეიძლება იყოს უარყოფითი')
    .default(0),
  sort_by: z.enum(['issue_date', 'due_date', 'total', 'status', 'client'])
    .default('issue_date'),
  sort_order: z.enum(['asc', 'desc'])
    .default('desc')
})

// =====================================
// TYPESCRIPT TYPES
// =====================================

export type InvoiceItem = z.infer<typeof invoiceItemSchema>
export type Invoice = z.infer<typeof invoiceSchema>
export type CreateInvoice = z.infer<typeof createInvoiceSchema>
export type UpdateInvoice = z.infer<typeof updateInvoiceSchema>
export type UpdateInvoiceStatus = z.infer<typeof updateInvoiceStatusSchema>
export type InvoiceFilter = z.infer<typeof invoiceFilterSchema>

// =====================================
// CALCULATION HELPER FUNCTIONS
// =====================================

/**
 * Calculate line total for an invoice item
 * Handles floating point precision by rounding to 2 decimal places
 * 
 * @param quantity - Number of items
 * @param unitPrice - Price per unit
 * @returns Calculated line total rounded to 2 decimal places
 */
export const calculateLineTotal = (quantity: number, unitPrice: number): number => {
  const result = quantity * unitPrice
  return Math.round(result * 100) / 100
}

/**
 * Calculate invoice totals including subtotal, VAT, and final total  
 * Handles floating point precision for financial calculations
 * 
 * @param items - Array of invoice items
 * @param vatRate - VAT rate as percentage (0-100)
 * @returns Object with subtotal, vatAmount, and total
 */
export const calculateInvoiceTotals = (items: InvoiceItem[], vatRate: number = 0) => {
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = item.line_total || calculateLineTotal(item.quantity, item.unit_price)
    return sum + lineTotal
  }, 0)
  
  const vatAmount = subtotal * (vatRate / 100)
  const total = subtotal + vatAmount
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100
  }
}

// =====================================
// VALIDATION HELPER FUNCTIONS
// =====================================

/**
 * Validate invoice item data
 * Uses safeParse to return success/error result
 */
export const validateInvoiceItem = (data: unknown) => {
  return invoiceItemSchema.safeParse(data)
}

/**
 * Validate complete invoice data
 * Uses safeParse to return success/error result
 */
export const validateInvoice = (data: unknown) => {
  return invoiceSchema.safeParse(data)
}

/**
 * Validate data for creating new invoice
 * Uses safeParse to return success/error result
 */
export const validateCreateInvoice = (data: unknown) => {
  return createInvoiceSchema.safeParse(data)
}

/**
 * Validate data for updating existing invoice
 * Uses safeParse to return success/error result
 */
export const validateUpdateInvoice = (data: unknown) => {
  return updateInvoiceSchema.safeParse(data)
}

/**
 * Validate invoice status update data
 * Uses safeParse to return success/error result
 */
export const validateUpdateInvoiceStatus = (data: unknown) => {
  return updateInvoiceStatusSchema.safeParse(data)
}

/**
 * Validate invoice filter/search parameters
 * Uses safeParse to return success/error result
 */
export const validateInvoiceFilter = (data: unknown) => {
  return invoiceFilterSchema.safeParse(data)
}

// =====================================
// UTILITY FUNCTIONS
// =====================================

/**
 * Generate empty invoice item for forms
 * Returns a new invoice item with default values
 */
export const createEmptyInvoiceItem = (): Partial<InvoiceItem> => ({
  service_id: null,
  description: '',
  quantity: 1,
  unit_price: 0,
  line_total: 0,
  sort_order: 0
})

/**
 * Generate empty invoice for forms  
 * Returns a new invoice with default values
 */
export const createEmptyInvoice = (companyId: string): Partial<CreateInvoice> => ({
  company_id: companyId,
  client_id: '',
  issue_date: new Date(),
  due_days: 14,
  currency: 'GEL',
  vat_rate: 18,
  items: [createEmptyInvoiceItem()] as InvoiceItem[]
})

/**
 * Check if invoice can be edited
 * Returns true if invoice status allows editing
 */
export const canEditInvoice = (status: Invoice['status']): boolean => {
  return status === 'draft'
}

/**
 * Check if invoice can be deleted
 * Returns true if invoice status allows deletion
 */
export const canDeleteInvoice = (status: Invoice['status']): boolean => {
  return status === 'draft'
}

/**
 * Get invoice status color for UI
 * Returns Tailwind CSS color class for status
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
 * Get invoice status label in Georgian
 * Returns Georgian text for status
 */
export const getInvoiceStatusLabel = (status: Invoice['status']): string => {
  const labels = {
    draft: 'გადასახდელი',
    sent: 'გაგზავნილი',
    paid: 'გადახდილი', 
    overdue: 'ვადაგადაცილებული',
    cancelled: 'გაუქმებული'
  }
  return labels[status] || labels.draft
}