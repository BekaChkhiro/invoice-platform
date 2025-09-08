'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Save, Send, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Form } from '@/components/ui/form'

// Import step components
import { ClientSelectionStep } from '@/components/invoices/steps/client-selection-step'
import { InvoiceDetailsStep } from '@/components/invoices/steps/invoice-details-step'
import { InvoicePreviewStep } from '@/components/invoices/steps/invoice-preview-step'

// Import hooks
import { useInvoiceForm } from '@/lib/hooks/use-invoice-form'

export default function NewInvoicePage() {
  const [isClient, setIsClient] = useState(false)
  
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
    saveToStorage,
    loadFromStorage,
    clearStorage // eslint-disable-line @typescript-eslint/no-unused-vars
  } = useInvoiceForm()

  // Define step configurations
  const allStepConfigs = {
    client: {
      title: 'კლიენტის არჩევა',
      description: 'აირჩიეთ კლიენტი ან შექმენით ახალი'
    },
    details: {
      title: 'ინვოისის დეტალები',
      description: 'შეავსეთ ინვოისის ინფორმაცია'
    },
    preview: {
      title: 'გადახედვა და დადასტურება',
      description: 'შეამოწმეთ ინვოისი და გააგზავნეთ'
    }
  }

  // Set client flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load draft from storage on mount
  useEffect(() => {
    // Check URL params to see if user wants fresh start
    const urlParams = new URLSearchParams(window.location.search)
    const freshStart = urlParams.get('fresh') === 'true'
    
    if (freshStart) {
      clearStorage()
      // Remove fresh param from URL without page reload
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('fresh')
      window.history.replaceState({}, '', newUrl.toString())
    } else {
      loadFromStorage()
    }
  }, [loadFromStorage, clearStorage])

  // Auto-save to storage when form changes
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToStorage()
    }, 1000)

    return () => clearTimeout(timer)
  }, [form.watch(), saveToStorage])

  const handleNext = async () => {
    const success = await goToNextStep()
    if (!success) {
      // Show validation errors
      console.log('Validation failed for current step')
    }
  }

  const handleSaveOnly = async () => {
    // For saving as draft, we need basic validation but can be more lenient
    const formData = form.getValues()
    
    // Basic validation - must have client and at least one item with description
    if (!formData.client_id) {
      toast.error('კლიენტის არჩევა აუცილებელია')
      return
    }
    
    if (!formData.items || formData.items.length === 0 || !formData.items[0]?.description) {
      toast.error('მინიმუმ ერთი პროდუქტის აღწერა აუცილებელია')
      return
    }
    
    await submitInvoice({ ...formData, send_immediately: false })
  }

  const handleSaveAndSend = async () => {
    // For sending, we need full validation
    const isValid = await form.trigger()
    if (!isValid) {
      const errors = form.formState.errors
      console.log('Validation errors:', errors)
      toast.error('გთხოვთ შეასწოროთ ფორმის შეცდომები გაგზავნამდე')
      return
    }
    
    const formData = form.getValues()
    await submitInvoice({ ...formData, send_immediately: true })
  }
  
  const handleClearDraft = () => {
    clearStorage()
    form.reset({
      client_id: '',
      issue_date: new Date(),
      due_days: 14,
      currency: 'GEL',
      vat_rate: 18,
      items: [{
        description: '',
        quantity: 1,
        unit_price: 0,
        line_total: 0,
        sort_order: 0
      }],
      bank_account_ids: [],
      send_immediately: false
    })
  }

  if (!isClient) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-96 bg-gray-100 rounded animate-pulse" />
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
          {/* Progress Bar */}
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
                            currentStepIndex === index 
                              ? 'text-gray-900' 
                              : 'text-gray-500'
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
                          ${currentStepIndex > index 
                            ? 'bg-green-600' 
                            : 'bg-gray-200'
                          }
                        `} />
                      )}
                    </div>
                  ))}
                </div>
                <Badge variant="outline" className="text-sm">
                  ნაბიჯი {currentStepIndex + 1} / 3
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
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

          {/* Navigation Buttons */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    disabled={isFirstStep || isSubmitting}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    უკან
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearDraft}
                    disabled={isSubmitting}
                    title="გადასახდელის გასუფთავება"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Save buttons - always available */}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={handleSaveOnly}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    შენახვა მარტო
                  </Button>
                  
                  {isLastStep ? (
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSaveAndSend}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      შენახვა და გაგზავნა
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmitting}
                    >
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