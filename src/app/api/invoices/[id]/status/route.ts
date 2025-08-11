import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'კომპანია ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateStatusSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'არასწორი მონაცემები', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { status: newStatus } = validationResult.data

    // Check if invoice exists and get current status
    const { data: invoice, error: checkError } = await supabase
      .from('invoices')
      .select('id, status, client_id')
      .eq('id', id)
      .eq('company_id', company.id)
      .single()

    if (checkError || !invoice) {
      return NextResponse.json(
        { error: 'ინვოისი ვერ მოიძებნა' },
        { status: 404 }
      )
    }

    // Allow all status transitions (removed restrictions)
    // Users can now change from any status to any other status

    // Prepare update data
    const updateData: { status: string; updated_at: string; paid_at?: string; sent_at?: string } = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Add timestamps for specific status changes
    if (newStatus === 'sent' && invoice.status !== 'sent') {
      updateData.sent_at = new Date().toISOString()
    }

    if (newStatus === 'paid' && invoice.status !== 'paid') {
      updateData.paid_at = new Date().toISOString()
    }

    // Update invoice status
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating invoice status:', updateError)
      return NextResponse.json(
        { error: 'ინვოისის სტატუსის განახლება ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    // Get client info for notification
    const { data: client } = await supabase
      .from('clients')
      .select('name, email')
      .eq('id', invoice.client_id)
      .single()

    // Return success response with Georgian status message
    const statusMessages = {
      draft: 'ინვოისი გადავიდა მონახაზის სტატუსში',
      sent: 'ინვოისი მონიშნულია როგორც გაგზავნილი',
      paid: 'ინვოისი მონიშნულია როგორც გადახდილი',
      overdue: 'ინვოისი მონიშნულია როგორც ვადაგადაცილებული',
      cancelled: 'ინვოისი გაუქმებულია'
    }

    return NextResponse.json({
      invoice: updatedInvoice,
      message: statusMessages[newStatus],
      notification: {
        type: 'invoice_status_changed',
        invoice_id: id,
        old_status: invoice.status,
        new_status: newStatus,
        client_name: client?.name,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Unexpected error in PATCH /api/invoices/[id]/status:', error)
    return NextResponse.json(
      { error: 'მოხდა შეცდომა' },
      { status: 500 }
    )
  }
}