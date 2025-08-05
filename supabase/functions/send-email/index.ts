import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@0.16.0'

// =====================================
// TYPES AND INTERFACES
// =====================================

interface EmailRequest {
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

interface EmailAttachment {
  filename: string
  content: string | Uint8Array
  contentType: string
  size: number
}

interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
  details?: any
}

interface EmailLog {
  invoice_id?: string
  type: string
  recipient: string
  subject: string
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
  message_id?: string
  error_message?: string
  sent_at: string
  user_id: string
  company_id?: string
}

// =====================================
// HELPER FUNCTIONS
// =====================================

/**
 * Validate email address format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Sanitize email addresses
 */
function sanitizeEmailList(emails: string[]): string[] {
  return emails
    .map(email => email.trim().toLowerCase())
    .filter(email => email && isValidEmail(email))
}

/**
 * Convert attachment content to proper format for Resend
 */
function processAttachment(attachment: EmailAttachment) {
  let content: string
  
  if (attachment.content instanceof Uint8Array) {
    // Convert Uint8Array to base64 string
    const bytes = Array.from(attachment.content)
    content = btoa(String.fromCharCode(...bytes))
  } else if (typeof attachment.content === 'string') {
    // If it's already a string, assume it's base64 encoded
    content = attachment.content
  } else {
    throw new Error('Invalid attachment content type')
  }
  
  return {
    filename: attachment.filename,
    content: content,
    type: attachment.contentType
  }
}

/**
 * Log email activity to database
 */
async function logEmailActivity(
  supabase: any,
  logData: EmailLog
): Promise<void> {
  try {
    const { error } = await supabase
      .from('email_history')
      .insert([logData])
    
    if (error) {
      console.error('Failed to log email activity:', error)
      // Don't throw error - logging failure shouldn't stop email sending
    }
  } catch (error) {
    console.error('Email logging error:', error)
  }
}

/**
 * Get user information from JWT token
 */
async function getUserFromToken(supabase: any): Promise<{ userId: string; companyId?: string } | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.error('Auth error:', error)
      return null
    }
    
    // Get user's company information
    const { data: userCompany, error: companyError } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .single()
    
    return {
      userId: user.id,
      companyId: userCompany?.company_id
    }
  } catch (error) {
    console.error('Failed to get user info:', error)
    return null
  }
}

/**
 * Rate limiting check
 */
async function checkRateLimit(
  supabase: any,
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase
      .from('email_history')
      .select('id')
      .eq('user_id', userId)
      .gte('sent_at', oneHourAgo)
    
    if (error) {
      console.error('Rate limit check error:', error)
      return { allowed: true, remaining: 100 } // Allow on error
    }
    
    const emailsSentLastHour = data?.length || 0
    const hourlyLimit = 100 // Configurable limit
    
    return {
      allowed: emailsSentLastHour < hourlyLimit,
      remaining: Math.max(0, hourlyLimit - emailsSentLastHour)
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    return { allowed: true, remaining: 100 }
  }
}

// =====================================
// MAIN HANDLER
// =====================================

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      }),
      { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Set auth header from request
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      supabase.auth.setAuth(authHeader.replace('Bearer ', ''))
    }

    // Get user information
    const userInfo = await getUserFromToken(supabase)
    if (!userInfo) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authentication required'
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(supabase, userInfo.userId)
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          details: { remaining: rateLimitCheck.remaining }
        }),
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const emailRequest: EmailRequest = await req.json()

    // Validate request data
    if (!emailRequest.to || emailRequest.to.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Recipients are required'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (!emailRequest.subject || !emailRequest.htmlContent) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Subject and content are required'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Sanitize email addresses
    const toEmails = sanitizeEmailList(emailRequest.to)
    const ccEmails = emailRequest.cc ? sanitizeEmailList(emailRequest.cc) : []
    const bccEmails = emailRequest.bcc ? sanitizeEmailList(emailRequest.bcc) : []

    if (toEmails.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No valid recipients found'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey)

    // Prepare email data
    const emailData: any = {
      from: 'invoices@yourdomain.com', // Configure your sending domain
      to: toEmails,
      subject: emailRequest.subject,
      html: emailRequest.htmlContent,
      text: emailRequest.textContent || emailRequest.htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    }

    // Add CC/BCC if provided
    if (ccEmails.length > 0) {
      emailData.cc = ccEmails
    }
    if (bccEmails.length > 0) {
      emailData.bcc = bccEmails
    }

    // Process attachments if provided
    if (emailRequest.attachments && emailRequest.attachments.length > 0) {
      try {
        emailData.attachments = emailRequest.attachments.map(processAttachment)
      } catch (attachmentError) {
        console.error('Attachment processing error:', attachmentError)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to process attachments'
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Send email via Resend
    const { data: sendResult, error: sendError } = await resend.emails.send(emailData)

    if (sendError) {
      console.error('Resend error:', sendError)
      
      // Log failed email
      await logEmailActivity(supabase, {
        invoice_id: emailRequest.invoiceId,
        type: emailRequest.type,
        recipient: toEmails[0], // Log primary recipient
        subject: emailRequest.subject,
        status: 'failed',
        error_message: sendError.message || 'Email sending failed',
        sent_at: new Date().toISOString(),
        user_id: userInfo.userId,
        company_id: userInfo.companyId
      })

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to send email',
          details: sendError
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Log successful email for each recipient
    const logPromises = toEmails.map(recipient =>
      logEmailActivity(supabase, {
        invoice_id: emailRequest.invoiceId,
        type: emailRequest.type,
        recipient,
        subject: emailRequest.subject,
        status: 'sent',
        message_id: sendResult?.id,
        sent_at: new Date().toISOString(),
        user_id: userInfo.userId,
        company_id: userInfo.companyId
      })
    )

    // Log CC and BCC recipients as well
    if (ccEmails.length > 0) {
      ccEmails.forEach(recipient => {
        logPromises.push(
          logEmailActivity(supabase, {
            invoice_id: emailRequest.invoiceId,
            type: emailRequest.type,
            recipient: `CC: ${recipient}`,
            subject: emailRequest.subject,
            status: 'sent',
            message_id: sendResult?.id,
            sent_at: new Date().toISOString(),
            user_id: userInfo.userId,
            company_id: userInfo.companyId
          })
        )
      })
    }

    if (bccEmails.length > 0) {
      bccEmails.forEach(recipient => {
        logPromises.push(
          logEmailActivity(supabase, {
            invoice_id: emailRequest.invoiceId,
            type: emailRequest.type,
            recipient: `BCC: ${recipient}`,
            subject: emailRequest.subject,
            status: 'sent',
            message_id: sendResult?.id,
            sent_at: new Date().toISOString(),
            user_id: userInfo.userId,
            company_id: userInfo.companyId
          })
        )
      })
    }

    // Wait for all logging to complete (but don't fail the request if logging fails)
    await Promise.allSettled(logPromises)

    // Return success response
    const response: EmailResponse = {
      success: true,
      messageId: sendResult?.id,
      details: {
        recipients: {
          to: toEmails.length,
          cc: ccEmails.length,
          bcc: bccEmails.length
        },
        hasAttachments: (emailRequest.attachments?.length || 0) > 0
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})