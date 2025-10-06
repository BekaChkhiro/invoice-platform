import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  type: 'payment_confirmation' | 'payment_reminder' | 'subscription_created' | 'subscription_cancelled' | 'verification_code'
  subscription_id?: string
  client_email?: string
  client_name?: string
  company_name?: string
  verification_code?: string
  custom_data?: any
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const emailData: EmailRequest = await req.json()

    console.log(`Sending email: ${emailData.type}`)

    let template: EmailTemplate
    let recipientEmail: string
    let recipientName: string

    // Get subscription details if subscription_id provided
    let subscription: any = null
    if (emailData.subscription_id) {
      const { data, error } = await supabase
        .from('client_subscriptions')
        .select(`
          *,
          clients!inner(name, email, type),
          companies!inner(name, email, phone, address)
        `)
        .eq('id', emailData.subscription_id)
        .single()

      if (error) {
        throw new Error(`Error fetching subscription: ${error.message}`)
      }
      subscription = data
    }

    // Determine recipient
    if (subscription) {
      recipientEmail = subscription.clients.email
      recipientName = subscription.clients.name
    } else if (emailData.client_email && emailData.client_name) {
      recipientEmail = emailData.client_email
      recipientName = emailData.client_name
    } else {
      throw new Error('No recipient information provided')
    }

    // Generate email template based on type
    switch (emailData.type) {
      case 'verification_code':
        template = generateVerificationEmail(emailData.verification_code!, recipientName, emailData.company_name || '')
        break
      case 'subscription_created':
        template = generateSubscriptionCreatedEmail(subscription, recipientName)
        break
      case 'subscription_cancelled':
        template = generateSubscriptionCancelledEmail(subscription, recipientName)
        break
      case 'payment_confirmation':
        template = generatePaymentConfirmationEmail(subscription, recipientName, emailData.custom_data)
        break
      case 'payment_reminder':
        template = generatePaymentReminderEmail(subscription, recipientName)
        break
      default:
        throw new Error(`Unknown email type: ${emailData.type}`)
    }

    // Send email (using a mock service for now)
    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    })

    console.log(`Email sent successfully to ${recipientEmail}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        recipient: recipientEmail,
        type: emailData.type,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// Email templates
function generateVerificationEmail(code: string, clientName: string, companyName: string): EmailTemplate {
  return {
    subject: `ვერიფიკაციის კოდი - ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>საბსქრიბშენის წვდომა</h2>
        <p>გამარჯობა ${clientName},</p>
        <p>თქვენი ვერიფიკაციის კოდია:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${code}
        </div>
        <p>ამ კოდის ვალიდურობაა 15 წუთი.</p>
        <p>პატივისცემით,<br>${companyName}</p>
      </div>
    `,
    text: `გამარჯობა ${clientName}, თქვენი ვერიფიკაციის კოდია: ${code}. კოდის ვალიდურობაა 15 წუთი. პატივისცემით, ${companyName}`
  }
}

function generateSubscriptionCreatedEmail(subscription: any, clientName: string): EmailTemplate {
  const companyName = subscription.companies.name
  const serviceName = subscription.service_name
  const amount = formatCurrency(subscription.amount)
  const billingCycle = formatBillingCycle(subscription.billing_cycle)
  const publicUrl = `${Deno.env.get('NEXT_PUBLIC_BASE_URL')}/subscription/${subscription.public_token}`

  return {
    subject: `ახალი საბსქრიბშენი - ${serviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>საბსქრიბშენი წარმატებით შეიქმნა</h2>
        <p>გამარჯობა ${clientName},</p>
        <p>თქვენი საბსქრიბშენი წარმატებით შეიქმნა:</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${serviceName}</h3>
          <p><strong>თანხა:</strong> ${amount}</p>
          <p><strong>პერიოდი:</strong> ${billingCycle}</p>
          <p><strong>მომწოდებელი:</strong> ${companyName}</p>
        </div>
        <p>საბსქრიბშენის მართვისთვის ეწვიეთ:</p>
        <p><a href="${publicUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">საბსქრიბშენის მართვა</a></p>
        <p>პატივისცემით,<br>${companyName}</p>
      </div>
    `,
    text: `გამარჯობა ${clientName}, თქვენი საბსქრიბშენი "${serviceName}" წარმატებით შეიქმნა. თანხა: ${amount}, პერიოდი: ${billingCycle}. მართვისთვის: ${publicUrl}`
  }
}

function generateSubscriptionCancelledEmail(subscription: any, clientName: string): EmailTemplate {
  const companyName = subscription.companies.name
  const serviceName = subscription.service_name

  return {
    subject: `საბსქრიბშენი გაუქმდა - ${serviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>საბსქრიბშენი გაუქმებულია</h2>
        <p>გამარჯობა ${clientName},</p>
        <p>თქვენი საბსქრიბშენი "${serviceName}" წარმატებით გაუქმდა.</p>
        <p>ავტომატური გადახდები შეწყდა და მომავალი ბილინგი აღარ მოხდება.</p>
        <p>გმადლობთ ჩვენი სერვისის გამოყენებისთვის!</p>
        <p>პატივისცემით,<br>${companyName}</p>
      </div>
    `,
    text: `გამარჯობა ${clientName}, თქვენი საბსქრიბშენი "${serviceName}" წარმატებით გაუქმდა. ავტომატური გადახდები შეწყდა.`
  }
}

function generatePaymentConfirmationEmail(subscription: any, clientName: string, paymentData: any): EmailTemplate {
  const companyName = subscription.companies.name
  const serviceName = subscription.service_name
  const amount = formatCurrency(paymentData?.amount || subscription.amount)
  const paymentDate = paymentData?.payment_date ? new Date(paymentData.payment_date).toLocaleDateString('ka-GE') : new Date().toLocaleDateString('ka-GE')

  return {
    subject: `გადახდა დასტურდება - ${serviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">გადახდა წარმატებულია</h2>
        <p>გამარჯობა ${clientName},</p>
        <p>თქვენი გადახდა წარმატებით განხორციელდა:</p>
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${serviceName}</h3>
          <p><strong>თანხა:</strong> ${amount}</p>
          <p><strong>გადახდის თარიღი:</strong> ${paymentDate}</p>
          <p><strong>სტატუსი:</strong> <span style="color: #28a745;">დასტურდება</span></p>
        </div>
        <p>გმადლობთ ჩვენი სერვისის გამოყენებისთვის!</p>
        <p>პატივისცემით,<br>${companyName}</p>
      </div>
    `,
    text: `გამარჯობა ${clientName}, თქვენი გადახდა ${amount} წარმატებით განხორციელდა ${paymentDate} თარიღზე სერვისისთვის: ${serviceName}.`
  }
}

function generatePaymentReminderEmail(subscription: any, clientName: string): EmailTemplate {
  const companyName = subscription.companies.name
  const serviceName = subscription.service_name
  const amount = formatCurrency(subscription.amount)
  const nextBillingDate = new Date(subscription.next_billing_date).toLocaleDateString('ka-GE')
  const publicUrl = `${Deno.env.get('NEXT_PUBLIC_BASE_URL')}/subscription/${subscription.public_token}`

  return {
    subject: `შემდეგი გადახდა მოახლოვდა - ${serviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>შემდეგი გადახდა მოახლოვდა</h2>
        <p>გამარჯობა ${clientName},</p>
        <p>გვინდა შეგახსენოთ, რომ თქვენი შემდეგი გადახდა მოახლოვდა:</p>
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${serviceName}</h3>
          <p><strong>თანხა:</strong> ${amount}</p>
          <p><strong>გადახდის თარიღი:</strong> ${nextBillingDate}</p>
        </div>
        <p>თქვენი საბსქრიბშენი ავტომატურად განახლდება. საბსქრიბშენის მართვისთვის:</p>
        <p><a href="${publicUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">საბსქრიბშენის მართვა</a></p>
        <p>პატივისცემით,<br>${companyName}</p>
      </div>
    `,
    text: `გამარჯობა ${clientName}, თქვენი შემდეგი გადახდა ${amount} მოახლოვდა ${nextBillingDate} თარიღზე სერვისისთვის: ${serviceName}. მართვა: ${publicUrl}`
  }
}

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ka-GE', {
    style: 'currency',
    currency: 'GEL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatBillingCycle(cycle: string): string {
  const cycles = {
    weekly: 'კვირეული',
    monthly: 'ყოველთვიური',
    quarterly: 'კვარტალური',
    yearly: 'წლიური'
  }
  return cycles[cycle as keyof typeof cycles] || cycle
}

// Mock email service (replace with actual email provider)
async function sendEmail(emailData: { to: string; subject: string; html: string; text: string }) {
  // In production, integrate with email service like SendGrid, Mailgun, etc.
  console.log(`📧 Email sent to: ${emailData.to}`)
  console.log(`📧 Subject: ${emailData.subject}`)
  console.log(`📧 Content: ${emailData.text}`)
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return { success: true, messageId: `mock-${Date.now()}` }
}