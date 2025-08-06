import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const sendInvoiceSchema = z.object({
  to: z.array(z.string().email('არასწორი ელ.ფოსტის ფორმატი')).optional(),
  cc: z.array(z.string().email('არასწორი ელ.ფოსტის ფორმატი')).optional(),
  bcc: z.array(z.string().email('არასწორი ელ.ფოსტის ფორმატი')).optional(),
  subject: z.string().max(200, 'საგანი ძალიან გრძელია').optional(),
  message: z.string().max(1000, 'შეტყობინება ძალიან გრძელია').optional(),
  attachPDF: z.boolean().default(true)
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'არაავტორიზებული' },
        { status: 401 }
      )
    }

    // Get user's company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'კომპანია ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Get invoice with all details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients!inner(
          id,
          name,
          type,
          tax_id,
          email,
          phone,
          contact_person
        ),
        items:invoice_items(*)
      `)
      .eq('id', params.id)
      .eq('company_id', company.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'ინვოისი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = sendInvoiceSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'არასწორი მონაცემები', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const emailOptions = validationResult.data

    // Check if client has email
    const recipientEmails = emailOptions.to || []
    if (recipientEmails.length === 0 && invoice.client.email) {
      recipientEmails.push(invoice.client.email)
    }

    if (recipientEmails.length === 0) {
      return NextResponse.json(
        { error: 'მიმღების ელ.ფოსტა მითითებული არ არის' },
        { status: 400 }
      )
    }

    // Prepare invoice data for email service
    const invoiceWithCompany = {
      ...invoice,
      company
    }

    // Call the email service Edge Function
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-invoice-email', {
      body: {
        invoice: invoiceWithCompany,
        options: {
          to: recipientEmails,
          cc: emailOptions.cc,
          bcc: emailOptions.bcc,
          subject: emailOptions.subject,
          customMessage: emailOptions.message,
          attachPDF: emailOptions.attachPDF
        }
      }
    })

    if (emailError) {
      console.error('Email sending error:', emailError)
      return NextResponse.json(
        { error: 'ელ.ფოსტის გაგზავნა ვერ მოხერხდა', details: emailError },
        { status: 500 }
      )
    }

    // Update invoice status to 'sent' if it was 'draft'
    if (invoice.status === 'draft') {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (updateError) {
        console.error('Error updating invoice status:', updateError)
      }
    }

    // Log email sending event
    const { error: logError } = await supabase
      .from('email_history')
      .insert({
        invoice_id: params.id,
        type: 'invoice',
        recipient: recipientEmails.join(', '),
        subject: emailOptions.subject || `ინვოისი #${invoice.invoice_number}`,
        sent_at: new Date().toISOString(),
        status: emailResult?.success ? 'sent' : 'failed',
        error_message: emailResult?.error
      })

    if (logError) {
      console.error('Error logging email history:', logError)
    }

    return NextResponse.json({
      success: emailResult?.success || false,
      messageId: emailResult?.messageId,
      message: emailResult?.success 
        ? 'ინვოისი წარმატებით გაიგზავნა' 
        : 'ინვოისის გაგზავნა ვერ მოხერხდა',
      recipients: {
        to: recipientEmails,
        cc: emailOptions.cc || [],
        bcc: emailOptions.bcc || []
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Unexpected error in POST /api/invoices/[id]/send:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}