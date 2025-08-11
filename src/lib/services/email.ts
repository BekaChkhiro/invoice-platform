import { createClient } from '@/lib/supabase/client'
import { generateInvoicePDF } from '@/lib/pdf/invoice-pdf-utils'
import type { InvoiceWithDetails } from './invoice'

// =====================================
// TYPES AND INTERFACES
// =====================================

export interface EmailOptions {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject?: string
  customMessage?: string
  attachPDF?: boolean
  template: EmailTemplate
  scheduledAt?: Date
  priority?: 'low' | 'normal' | 'high'
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
  language: 'ka' | 'en'
  category: 'invoice' | 'reminder' | 'notification' | 'confirmation'
}

export interface EmailAttachment {
  filename: string
  content: string | Uint8Array
  contentType: string
  size: number
}

export interface EmailRequest {
  type: 'invoice' | 'reminder' | 'confirmation' | 'notification'
  invoiceId?: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  htmlContent: string
  textContent: string
  attachments?: EmailAttachment[]
  customMessage?: string
}

export interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
  details?: any
}

export interface EmailHistory {
  id: string
  invoice_id: string
  type: string
  recipient: string
  subject: string
  sent_at: Date
  delivered_at?: Date
  opened_at?: Date
  clicked_at?: Date
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  error_message?: string
}

export interface ReminderType {
  type: 'gentle' | 'firm' | 'final'
  daysOverdue: number
  subject: string
  tone: string
}

export type ServiceResult<T> = {
  data: T | null
  error: string | null
}

// =====================================
// EMAIL TEMPLATES
// =====================================

const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  'invoice-default': {
    id: 'invoice-default',
    name: 'ინვოისის გაგზავნა',
    subject: 'ინვოისი #{invoice_number} - {company_name}',
    htmlContent: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background-color: #0ea5e9; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">{company_name}</h1>
        </div>
        
        <div style="padding: 30px 20px; background-color: #ffffff;">
          <h2 style="color: #374151; margin-bottom: 20px;">გამარჯობა, {client_name}!</h2>
          
          <p style="line-height: 1.6; color: #4b5563;">
            გთხოვთ იხილოთ ინვოისი #{invoice_number} თანხით <strong>{total_amount} {currency}</strong>.
          </p>
          
          {custom_message}
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">ინვოისის დეტალები:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #6b7280;">ინვოისის ნომერი:</td>
                <td style="padding: 5px 0; font-weight: bold;">#{invoice_number}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #6b7280;">გამოწერის თარიღი:</td>
                <td style="padding: 5px 0;">{issue_date}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #6b7280;">გადახდის ვადა:</td>
                <td style="padding: 5px 0; color: #ef4444;">{due_date}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #6b7280;">ჯამური თანხა:</td>
                <td style="padding: 5px 0; font-weight: bold; font-size: 18px;">{total_amount} {currency}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #ecfdf5; border: 1px solid #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #065f46;">გადახდის ინსტრუქციები:</h4>
            <p style="margin: 0; color: #047857;">{payment_instructions}</p>
          </div>
          
          <p style="line-height: 1.6; color: #4b5563;">
            თუ გაქვთ რაიმე კითხვა, გთხოვთ დაგვიკავშირდეთ.
          </p>
          
          <p style="line-height: 1.6; color: #4b5563;">
            მადლობთ,<br>
            <strong>{company_name}</strong>
          </p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            {company_name} • {company_address} • {company_phone}
          </p>
        </div>
      </div>
    `,
    textContent: `
გამარჯობა, {client_name}!

გთხოვთ იხილოთ ინვოისი #{invoice_number} თანხით {total_amount} {currency}.

{custom_message}

ინვოისის დეტალები:
- ინვოისის ნომერი: #{invoice_number}
- გამოწერის თარიღი: {issue_date}
- გადახდის ვადა: {due_date}
- ჯამური თანხა: {total_amount} {currency}

გადახდის ინსტრუქციები:
{payment_instructions}

თუ გაქვთ რაიმე კითხვა, გთხოვთ დაგვიკავშირდეთ.

მადლობთ,
{company_name}
    `,
    variables: ['client_name', 'invoice_number', 'total_amount', 'currency', 'issue_date', 'due_date', 'company_name', 'payment_instructions', 'custom_message'],
    language: 'ka',
    category: 'invoice'
  },
  
  'reminder-gentle': {
    id: 'reminder-gentle',
    name: 'ნაზი შეხსენება',
    subject: 'შეხსენება: ინვოისი #{invoice_number} - {company_name}',
    htmlContent: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">გადახდის შეხსენება</h1>
        </div>
        
        <div style="padding: 30px 20px; background-color: #ffffff;">
          <h2 style="color: #374151; margin-bottom: 20px;">გამარჯობა, {client_name}!</h2>
          
          <p style="line-height: 1.6; color: #4b5563;">
            ეს არის ნაზი შეხსენება ინვოისი #{invoice_number}-ზე, რომლის გადახდის ვადაც იყო {due_date}.
          </p>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #92400e;">გადასახდელი თანხა:</h3>
            <div style="font-size: 24px; font-weight: bold; color: #92400e;">{total_amount} {currency}</div>
            <div style="color: #92400e; margin-top: 5px;">ვადაგადაცილება: {days_overdue} დღე</div>
          </div>
          
          <p style="line-height: 1.6; color: #4b5563;">
            თუ ინვოისი უკვე გადახდილია, გთხოვთ უგულებელყო ეს შეტყობინება.
          </p>
          
          <p style="line-height: 1.6; color: #4b5563;">
            მადლობთ,<br>
            <strong>{company_name}</strong>
          </p>
        </div>
      </div>
    `,
    textContent: `
გამარჯობა, {client_name}!

ეს არის ნაზი შეხსენება ინვოისი #{invoice_number}-ზე, რომლის გადახდის ვადაც იყო {due_date}.

გადასახდელი თანხა: {total_amount} {currency}
ვადაგადაცილება: {days_overdue} დღე

თუ ინვოისი უკვე გადახდილია, გთხოვთ უგულებელყო ეს შეტყობინება.

მადლობთ,
{company_name}
    `,
    variables: ['client_name', 'invoice_number', 'due_date', 'total_amount', 'currency', 'days_overdue', 'company_name'],
    language: 'ka',
    category: 'reminder'
  },
  
  'confirmation-payment': {
    id: 'confirmation-payment',
    name: 'გადახდის დადასტურება',
    subject: 'გადახდა მიღებულია - ინვოისი #{invoice_number}',
    htmlContent: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">✅ გადახდა მიღებულია</h1>
        </div>
        
        <div style="padding: 30px 20px; background-color: #ffffff;">
          <h2 style="color: #374151; margin-bottom: 20px;">მადლობთ, {client_name}!</h2>
          
          <p style="line-height: 1.6; color: #4b5563;">
            წარმატებით მივიღეთ თქვენი გადახდა ინვოისი #{invoice_number}-ზე.
          </p>
          
          <div style="background-color: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #065f46;">გადახდის დეტალები:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #047857;">თანხა:</td>
                <td style="padding: 5px 0; font-weight: bold; color: #065f46;">{total_amount} {currency}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #047857;">გადახდის თარიღი:</td>
                <td style="padding: 5px 0; color: #065f46;">{payment_date}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #047857;">სტატუსი:</td>
                <td style="padding: 5px 0; font-weight: bold; color: #065f46;">✅ გადახდილი</td>
              </tr>
            </table>
          </div>
          
          <p style="line-height: 1.6; color: #4b5563;">
            ველოდებით მომავალი თანამშრომლობის.
          </p>
          
          <p style="line-height: 1.6; color: #4b5563;">
            მადლობთ,<br>
            <strong>{company_name}</strong>
          </p>
        </div>
      </div>
    `,
    textContent: `
მადლობთ, {client_name}!

წარმატებით მივიღეთ თქვენი გადახდა ინვოისი #{invoice_number}-ზე.

გადახდის დეტალები:
- თანხა: {total_amount} {currency}
- გადახდის თარიღი: {payment_date}
- სტატუსი: ✅ გადახდილი

ველოდებით მომავალი თანამშრომლობის.

მადლობთ,
{company_name}
    `,
    variables: ['client_name', 'invoice_number', 'total_amount', 'currency', 'payment_date', 'company_name'],
    language: 'ka',
    category: 'confirmation'
  }
}

// =====================================
// HELPER FUNCTIONS
// =====================================

/**
 * Get Supabase client instance
 */
const getSupabase = () => createClient()

/**
 * Transform error to user-friendly message
 */
const handleError = (error: any, context: string): string => {
  console.error(`Email Service Error (${context}):`, error)
  
  if (error?.code === 'INVALID_EMAIL') {
    return 'არასწორი ელ.ფოსტის მისამართი'
  }
  
  if (error?.code === 'RATE_LIMIT_EXCEEDED') {
    return 'ძალიან ბევრი ემაილი გაიგზავნა. სცადეთ მოგვიანებით'
  }
  
  if (error?.code === 'ATTACHMENT_TOO_LARGE') {
    return 'ფაილის ზომა ძალიან დიდია'
  }
  
  return error?.message || 'ემაილის გაგზავნა ვერ მოხერხდა'
}

/**
 * Validate email address
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Replace template variables
 */
const replaceTemplateVariables = (
  template: string, 
  variables: Record<string, string>
): string => {
  let result = template
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g')
    result = result.replace(regex, value || '')
  })
  
  return result
}

/**
 * Generate template variables from invoice
 */
const generateInvoiceVariables = (invoice: InvoiceWithDetails, customMessage?: string): Record<string, string> => {
  return {
    client_name: invoice.client.name,
    invoice_number: invoice.invoice_number || '',
    total_amount: invoice.total.toFixed(2),
    currency: invoice.currency,
    issue_date: new Date(invoice.issue_date).toLocaleDateString('ka-GE'),
    due_date: new Date(invoice.due_date).toLocaleDateString('ka-GE'),
    company_name: 'თქვენი კომპანია', // This should come from company data
    company_address: 'კომპანიის მისამართი',
    company_phone: 'კომპანიის ტელეფონი',
    payment_instructions: invoice.payment_instructions || 'გადახდის ინსტრუქციები მითითებული არ არის',
    custom_message: customMessage ? `<p style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0;">${customMessage}</p>` : '',
    days_overdue: Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)).toString(),
    payment_date: new Date().toLocaleDateString('ka-GE')
  }
}

// =====================================
// MAIN SERVICE FUNCTIONS
// =====================================

/**
 * Send invoice email with PDF attachment
 */
export const sendInvoiceEmail = async (
  invoice: InvoiceWithDetails,
  options: Partial<EmailOptions> = {}
): Promise<ServiceResult<EmailResponse>> => {
  try {
    // Validate inputs
    if (!invoice.client.email) {
      return {
        data: null,
        error: 'კლიენტის ელ.ფოსტა მითითებული არ არის'
      }
    }

    if (!validateEmail(invoice.client.email)) {
      return {
        data: null,
        error: 'კლიენტის ელ.ფოსტის მისამართი არასწორია'
      }
    }

    // Get template
    const template = EMAIL_TEMPLATES['invoice-default']
    const variables = generateInvoiceVariables(invoice, options.customMessage)

    // Generate email content
    const subject = replaceTemplateVariables(template.subject, variables)
    const htmlContent = replaceTemplateVariables(template.htmlContent, variables)
    const textContent = replaceTemplateVariables(template.textContent, variables)

    // Generate PDF attachment if requested
    const attachments: EmailAttachment[] = []
    if (options.attachPDF !== false) {
      try {
        const pdfBlob = await generateInvoicePDF(invoice)
        const pdfBuffer = await pdfBlob.arrayBuffer()
        
        attachments.push({
          filename: `invoice-${invoice.invoice_number || invoice.id.slice(0, 8)}.pdf`,
          content: new Uint8Array(pdfBuffer),
          contentType: 'application/pdf',
          size: pdfBuffer.byteLength
        })
      } catch (pdfError) {
        console.warn('PDF generation failed:', pdfError)
        // Continue without PDF attachment
      }
    }

    // Prepare email request
    const emailRequest: EmailRequest = {
      type: 'invoice',
      invoiceId: invoice.id,
      to: [invoice.client.email],
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject || subject,
      htmlContent,
      textContent,
      attachments,
      customMessage: options.customMessage
    }

    // Send email via Edge Function
    const supabase = getSupabase()
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: emailRequest
    })

    if (error) {
      return {
        data: null,
        error: handleError(error, 'sendInvoiceEmail')
      }
    }

    // Update invoice status if sent successfully
    if (data?.success) {
      await supabase
        .from('invoices')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', invoice.id)
    }

    return {
      data: data as EmailResponse,
      error: null
    }

  } catch (error) {
    return {
      data: null,
      error: handleError(error, 'sendInvoiceEmail')
    }
  }
}

/**
 * Send payment reminder email
 */
export const sendPaymentReminder = async (
  invoice: InvoiceWithDetails,
  reminderType: ReminderType['type'] = 'gentle'
): Promise<ServiceResult<EmailResponse>> => {
  try {
    if (!invoice.client.email || !validateEmail(invoice.client.email)) {
      return {
        data: null,
        error: 'კლიენტის ელ.ფოსტა არასწორია'
      }
    }

    // Calculate days overdue
    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysOverdue <= 0) {
      return {
        data: null,
        error: 'ინვოისის ვადა ჯერ არ არის ამოწურული'
      }
    }

    // Get appropriate template
    const templateId = `reminder-${reminderType}`
    const template = EMAIL_TEMPLATES[templateId] || EMAIL_TEMPLATES['reminder-gentle']
    
    const variables = {
      ...generateInvoiceVariables(invoice),
      days_overdue: daysOverdue.toString()
    }

    const subject = replaceTemplateVariables(template.subject, variables)
    const htmlContent = replaceTemplateVariables(template.htmlContent, variables)
    const textContent = replaceTemplateVariables(template.textContent, variables)

    const emailRequest: EmailRequest = {
      type: 'reminder',
      invoiceId: invoice.id,
      to: [invoice.client.email],
      subject,
      htmlContent,
      textContent
    }

    const supabase = getSupabase()
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: emailRequest
    })

    if (error) {
      return {
        data: null,
        error: handleError(error, 'sendPaymentReminder')
      }
    }

    return {
      data: data as EmailResponse,
      error: null
    }

  } catch (error) {
    return {
      data: null,
      error: handleError(error, 'sendPaymentReminder')
    }
  }
}

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmation = async (
  invoice: InvoiceWithDetails
): Promise<ServiceResult<EmailResponse>> => {
  try {
    if (!invoice.client.email || !validateEmail(invoice.client.email)) {
      return {
        data: null,
        error: 'კლიენტის ელ.ფოსტა არასწორია'
      }
    }

    const template = EMAIL_TEMPLATES['confirmation-payment']
    const variables = generateInvoiceVariables(invoice)

    const subject = replaceTemplateVariables(template.subject, variables)
    const htmlContent = replaceTemplateVariables(template.htmlContent, variables)
    const textContent = replaceTemplateVariables(template.textContent, variables)

    const emailRequest: EmailRequest = {
      type: 'confirmation',
      invoiceId: invoice.id,
      to: [invoice.client.email],
      subject,
      htmlContent,
      textContent
    }

    const supabase = getSupabase()
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: emailRequest
    })

    if (error) {
      return {
        data: null,
        error: handleError(error, 'sendPaymentConfirmation')
      }
    }

    return {
      data: data as EmailResponse,
      error: null
    }

  } catch (error) {
    return {
      data: null,
      error: handleError(error, 'sendPaymentConfirmation')
    }
  }
}

/**
 * Get email history for an invoice
 */
export const getEmailHistory = async (invoiceId: string): Promise<ServiceResult<EmailHistory[]>> => {
  try {
    const supabase = getSupabase()
    
    const { data, error } = await supabase
      .from('email_history')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('sent_at', { ascending: false })

    if (error) {
      return {
        data: null,
        error: handleError(error, 'getEmailHistory')
      }
    }

    return {
      data: data as EmailHistory[],
      error: null
    }

  } catch (error) {
    return {
      data: null,
      error: handleError(error, 'getEmailHistory')
    }
  }
}

/**
 * Get available email templates
 */
export const getEmailTemplates = (): EmailTemplate[] => {
  return Object.values(EMAIL_TEMPLATES)
}

/**
 * Validate email recipients
 */
export const validateEmailRecipients = (emails: string[]): { valid: string[]; invalid: string[] } => {
  const valid: string[] = []
  const invalid: string[] = []

  emails.forEach(email => {
    if (validateEmail(email.trim())) {
      valid.push(email.trim())
    } else {
      invalid.push(email.trim())
    }
  })

  return { valid, invalid }
}