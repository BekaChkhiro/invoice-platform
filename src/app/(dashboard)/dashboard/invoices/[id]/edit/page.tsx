'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Form } from '@/components/ui/form'

import { ClientSelectionStep } from '@/components/invoices/steps/client-selection-step'
import { InvoiceDetailsStep } from '@/components/invoices/steps/invoice-details-step'
import { InvoicePreviewStep } from '@/components/invoices/steps/invoice-preview-step'

import { useInvoiceForm } from '@/lib/hooks/use-invoice-form'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export default function EditInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const {
    form,
    currentStep,
    stepConfig,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    isSubmitting,
    goToPreviousStep,
    goToNextStep,
    submitInvoice,
    totals,
  } = useInvoiceForm(invoiceId)

  const allStepConfigs = {
    client: {
      title: 'კლიენტის არჩევა',
      description: 'აირჩიეთ კლიენტი'
    },
    details: {
      title: 'ინვოისის დეტალები',
      description: 'შეცვალეთ ინვოისის ინფორმაცია'
    },
    preview: {
      title: 'გადახედვა და დადასტურება',
      description: 'შეამოწმეთ ცვლილებები და შეინახეთ'
    }
  }

  useEffect(() => {
    let cancelled = false

    async function fetchInvoice() {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`)
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'ინვოისი ვერ მოიძებნა' }))
          throw new Error(error.error || 'ინვოისი ვერ მოიძებნა')
        }
        const invoice = await response.json()
        if (cancelled) return

        if (!['draft', 'sent'].includes(invoice.status)) {
          setLoadError('ამ სტატუსში ინვოისის რედაქტირება შეუძლებელია')
          setIsLoading(false)
          return
        }

        const issueDate = invoice.issue_date ? new Date(invoice.issue_date) : new Date()
        const dueDate = invoice.due_date ? new Date(invoice.due_date) : null
        const dueDays = dueDate
          ? Math.max(1, Math.round((dueDate.getTime() - issueDate.getTime()) / MS_PER_DAY))
          : 14

        const items = Array.isArray(invoice.items) && invoice.items.length > 0
          ? [...invoice.items]
              .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((item: any, index: number) => ({
                description: item.description ?? '',
                quantity: Number(item.quantity) || 1,
                unit_price: Number(item.unit_price) || 0,
                line_total: Number(item.line_total) || 0,
                sort_order: item.sort_order ?? index
              }))
          : [{ description: '', quantity: 1, unit_price: 0, line_total: 0, sort_order: 0 }]

        form.reset({
          client_id: invoice.client_id || '',
          issue_date: issueDate,
          due_days: dueDays,
          currency: invoice.currency || 'GEL',
          vat_rate: Number(invoice.vat_rate ?? 18),
          items,
          bank_account_ids: [],
          send_immediately: false
        })

        setIsLoading(false)
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'ინვოისის ჩატვირთვა ვერ მოხერხდა'
        setLoadError(message)
        setIsLoading(false)
      }
    }

    fetchInvoice()
    return () => { cancelled = true }
  }, [invoiceId, form])

  const handleNext = async () => {
    await goToNextStep()
  }

  const handleSave = async () => {
    const isValid = await form.trigger()
    if (!isValid) {
      toast.error('გთხოვთ შეასწოროთ ფორმის შეცდომები')
      return
    }
    const formData = form.getValues()
    await submitInvoice({ ...formData, send_immediately: false })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">ინვოისის ჩატვირთვა...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center py-8">
              <p className="text-red-600 font-medium">{loadError}</p>
            </div>
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => router.push(`/dashboard/invoices/${invoiceId}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                ინვოისზე დაბრუნება
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <Form {...form}>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-8">
                  {(['client', 'details', 'preview'] as const).map((step, index) => (
                    <div key={step} className="flex items-center">
                      <div className="flex items-center">
                        <div
                          className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            font-semibold transition-colors
                            ${currentStepIndex > index
                              ? 'bg-green-600 text-white'
                              : currentStepIndex === index
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }
                          `}
                        >
                          {currentStepIndex > index ? '✓' : index + 1}
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm font-medium ${
                            currentStepIndex === index ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {allStepConfigs[step].title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {allStepConfigs[step].description}
                          </p>
                        </div>
                      </div>
                      {index < 2 && (
                        <div className={`
                          w-16 h-0.5 ml-4
                          ${currentStepIndex > index ? 'bg-green-600' : 'bg-gray-200'}
                        `} />
                      )}
                    </div>
                  ))}
                </div>
                <Badge variant="outline" className="text-sm">
                  რედაქტირება · ნაბიჯი {currentStepIndex + 1} / 3
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{stepConfig.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {currentStep === 'client' && <ClientSelectionStep form={form} />}
              {currentStep === 'details' && <InvoiceDetailsStep form={form} totals={totals} />}
              {currentStep === 'preview' && <InvoicePreviewStep form={form} totals={totals} />}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={isFirstStep ? () => router.push(`/dashboard/invoices/${invoiceId}`) : goToPreviousStep}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {isFirstStep ? 'გაუქმება' : 'უკან'}
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={handleSave}
                  >
                    {isSubmitting
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <Save className="mr-2 h-4 w-4" />}
                    ცვლილებების შენახვა
                  </Button>

                  {!isLastStep && (
                    <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                      შემდეგი
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Form>
    </div>
  )
}
