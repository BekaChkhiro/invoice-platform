'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Send, Eye, X, Plus, Minus, FileText, Loader2 } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

import { useSendEmail } from '@/lib/hooks/use-email'
import { getEmailTemplates, validateEmailRecipients } from '@/lib/services/email'
import type { InvoiceWithDetails } from '@/lib/services/invoice'
import type { EmailTemplate, EmailResponse } from '@/lib/services/email'

// =====================================
// VALIDATION SCHEMA
// =====================================

const emailFormSchema = z.object({
  to: z.string().min(1, 'მიმღები აუცილებელია'),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, 'თემა აუცილებელია'),
  customMessage: z.string().optional(),
  template: z.string().min(1, 'შაბლონის არჩევა აუცილებელია'),
  attachPDF: z.boolean().default(true)
})

type EmailFormData = z.infer<typeof emailFormSchema>

// =====================================
// TYPES AND INTERFACES
// =====================================

interface EmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: InvoiceWithDetails
  initialTemplate?: string
  onEmailSent?: (result: EmailResponse) => void
}

// =====================================
// MAIN COMPONENT
// =====================================

export function EmailDialog({
  open,
  onOpenChange,
  invoice,
  initialTemplate = 'invoice-default',
  onEmailSent
}: EmailDialogProps) {
  const [currentTab, setCurrentTab] = useState('compose')
  const [previewContent, setPreviewContent] = useState('')
  const [emailTemplates] = useState<EmailTemplate[]>(getEmailTemplates())
  const [recipientValidation, setRecipientValidation] = useState<{ valid: string[]; invalid: string[] }>({ valid: [], invalid: [] })

  // Email sending mutation
  const { mutate: sendEmail, isLoading: isSending, error: sendError } = useSendEmail()

  // Form setup
  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      to: invoice.client.email || '',
      cc: '',
      bcc: '',
      subject: '',
      customMessage: '',
      template: initialTemplate,
      attachPDF: true
    }
  })

  // Watch form values for real-time updates
  const watchedTemplate = form.watch('template')
  const watchedTo = form.watch('to')
  const watchedCc = form.watch('cc')

  // Update subject when template changes
  useEffect(() => {
    const selectedTemplate = emailTemplates.find(t => t.id === watchedTemplate)
    if (selectedTemplate) {
      const subject = selectedTemplate.subject
        .replace('{invoice_number}', invoice.invoice_number || '')
        .replace('{company_name}', 'თქვენი კომპანია') // This should come from company data
      
      form.setValue('subject', subject)
    }
  }, [watchedTemplate, emailTemplates, invoice, form])

  // Validate recipients in real-time
  useEffect(() => {
    const allEmails = [watchedTo, watchedCc]
      .filter(Boolean)
      .join(',')
      .split(',')
      .map(email => email.trim())
      .filter(Boolean)

    if (allEmails.length > 0) {
      const validation = validateEmailRecipients(allEmails)
      setRecipientValidation(validation)
    } else {
      setRecipientValidation({ valid: [], invalid: [] })
    }
  }, [watchedTo, watchedCc])

  // Generate preview content
  const generatePreview = () => {
    const formData = form.getValues()
    const selectedTemplate = emailTemplates.find(t => t.id === formData.template)
    
    if (!selectedTemplate) return ''

    // Replace template variables
    let content = selectedTemplate.htmlContent
    const variables = {
      client_name: invoice.client.name,
      invoice_number: invoice.invoice_number || '',
      total_amount: invoice.total.toFixed(2),
      currency: invoice.currency,
      issue_date: new Date(invoice.issue_date).toLocaleDateString('ka-GE'),
      due_date: new Date(invoice.due_date).toLocaleDateString('ka-GE'),
      company_name: 'თქვენი კომპანია',
      payment_instructions: invoice.payment_instructions || 'გადახდის ინსტრუქციები მითითებული არ არის',
      custom_message: formData.customMessage || ''
    }

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g')
      content = content.replace(regex, value)
    })

    return content
  }

  // Handle form submission
  const onSubmit = async (data: EmailFormData) => {
    try {
      // Validate recipients
      const toEmails = data.to.split(',').map(email => email.trim()).filter(Boolean)
      const ccEmails = data.cc ? data.cc.split(',').map(email => email.trim()).filter(Boolean) : []
      const bccEmails = data.bcc ? data.bcc.split(',').map(email => email.trim()).filter(Boolean) : []

      const allEmails = [...toEmails, ...ccEmails, ...bccEmails]
      const validation = validateEmailRecipients(allEmails)

      if (validation.invalid.length > 0) {
        form.setError('to', {
          message: `არასწორი ელ.ფოსტები: ${validation.invalid.join(', ')}`
        })
        return
      }

      // Send email
      sendEmail({
        invoice,
        options: {
          to: toEmails,
          cc: ccEmails.length > 0 ? ccEmails : undefined,
          bcc: bccEmails.length > 0 ? bccEmails : undefined,
          subject: data.subject,
          customMessage: data.customMessage,
          attachPDF: data.attachPDF,
          template: emailTemplates.find(t => t.id === data.template)!
        }
      }, {
        onSuccess: (result) => {
          onEmailSent?.(result)
          onOpenChange(false)
          form.reset()
        }
      })

    } catch (error) {
      console.error('Email sending failed:', error)
    }
  }

  // Handle preview generation
  const handlePreview = () => {
    const content = generatePreview()
    setPreviewContent(content)
    setCurrentTab('preview')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            ინვოისის გაგზავნა - #{invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="compose">შედგენა</TabsTrigger>
              <TabsTrigger value="preview">წინასწარი ნახვა</TabsTrigger>
            </TabsList>

            {/* Compose Tab */}
            <TabsContent value="compose" className="mt-4 overflow-y-auto max-h-[70vh]">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* Invoice Summary */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">ინვოისის ინფორმაცია</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-gray-500">კლიენტი</Label>
                          <p className="font-medium">{invoice.client.name}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">თანხა</Label>
                          <p className="font-medium">{invoice.total.toFixed(2)} {invoice.currency}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">ვადა</Label>
                          <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString('ka-GE')}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">სტატუსი</Label>
                          <Badge variant="secondary">{invoice.status}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email Template Selection */}
                  <FormField
                    control={form.control}
                    name="template"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ემაილის შაბლონი</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {emailTemplates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Recipients */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>მიმღები *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="client@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CC</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="cc@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bcc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>BCC</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="bcc@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Email Validation */}
                  {recipientValidation.invalid.length > 0 && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        არასწორი ელ.ფოსტები: {recipientValidation.invalid.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Subject */}
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>თემა *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Custom Message */}
                  <FormField
                    control={form.control}
                    name="customMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>დამატებითი შეტყობინება</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="პერსონალური შეტყობინება კლიენტისთვის..."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* PDF Attachment */}
                  <FormField
                    control={form.control}
                    name="attachPDF"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">PDF დანართი</FormLabel>
                          <div className="text-sm text-gray-500">
                            ინვოისის PDF ფაილის დართვა
                          </div>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Send Error */}
                  {sendError && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {sendError.message || 'ემაილის გაგზავნა ვერ მოხერხდა'}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreview}
                      className="flex-1"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      წინასწარი ნახვა
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={isSending || recipientValidation.invalid.length > 0}
                      className="flex-1"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          გაგზავნა...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          ემაილის გაგზავნა
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="mt-4 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                
                {/* Email Headers Preview */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">ემაილის დეტალები</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2 text-sm">
                    <div><strong>მიმღები:</strong> {form.watch('to')}</div>
                    {form.watch('cc') && <div><strong>CC:</strong> {form.watch('cc')}</div>}
                    {form.watch('bcc') && <div><strong>BCC:</strong> {form.watch('bcc')}</div>}
                    <div><strong>თემა:</strong> {form.watch('subject')}</div>
                    {form.watch('attachPDF') && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>PDF დანართი: invoice-{invoice.invoice_number}.pdf</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Email Content Preview */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">ემაილის შინაარსი</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div
                      className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: previewContent }}
                    />
                  </CardContent>
                </Card>

                {/* Preview Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentTab('compose')}
                    className="flex-1"
                  >
                    რედაქტირება
                  </Button>
                  
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSending}
                    className="flex-1"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        გაგზავნა...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        გაგზავნა
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}