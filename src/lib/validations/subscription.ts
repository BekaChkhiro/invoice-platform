import * as z from "zod"

export const subscriptionSchema = z.object({
  plan_id: z.string().uuid("Invalid plan ID"),
  payment_method: z.enum(['card', 'bank_transfer', 'paypal']).optional(),
  prorate: z.boolean().default(true),
  billing_cycle: z.enum(['monthly', 'yearly']).default('monthly'),
})

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>

export const paymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3, "Currency must be 3 characters (e.g., USD, EUR)"),
  payment_method: z.enum(['card', 'bank_transfer', 'paypal']),
  card_details: z.object({
    number: z.string().regex(/^\d{13,19}$/, "Invalid card number"),
    exp_month: z.number().min(1).max(12),
    exp_year: z.number().min(new Date().getFullYear()),
    cvc: z.string().regex(/^\d{3,4}$/, "Invalid CVC"),
    holder_name: z.string().min(2, "Cardholder name is required"),
  }).optional(),
  bank_details: z.object({
    account_number: z.string().min(8, "Invalid account number"),
    routing_number: z.string().min(8, "Invalid routing number"),
    account_holder_name: z.string().min(2, "Account holder name is required"),
    bank_name: z.string().min(2, "Bank name is required"),
  }).optional(),
  paypal_email: z.string().email("Invalid PayPal email").optional(),
}).refine((data) => {
  if (data.payment_method === 'card' && !data.card_details) {
    return false
  }
  if (data.payment_method === 'bank_transfer' && !data.bank_details) {
    return false
  }
  if (data.payment_method === 'paypal' && !data.paypal_email) {
    return false
  }
  return true
}, {
  message: "Payment details are required for the selected payment method",
  path: ["payment_method"],
})

export type PaymentFormData = z.infer<typeof paymentSchema>

export const cancellationSchema = z.object({
  reason: z.enum([
    'too_expensive',
    'not_using',
    'missing_features',
    'found_alternative',
    'technical_issues',
    'other'
  ]).optional(),
  feedback: z.string().max(500, "Feedback must be less than 500 characters").optional(),
  cancel_immediately: z.boolean().default(false),
})

export type CancellationFormData = z.infer<typeof cancellationSchema>

export const usageFilterSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year', 'custom']).default('month'),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  resource_type: z.enum(['invoice', 'client', 'product', 'report', 'all']).optional(),
  action: z.enum(['create', 'update', 'delete', 'view', 'export', 'send', 'all']).optional(),
})

export type UsageFilter = z.infer<typeof usageFilterSchema>