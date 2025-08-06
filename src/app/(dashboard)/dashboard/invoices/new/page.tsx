'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Save, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { Form } from '@/components/ui/form'

// Import step components
import { ClientSelectionStep } from '@/components/invoices/steps/client-selection-step'
import { InvoiceDetailsStep } from '@/components/invoices/steps/invoice-details-step'
import { InvoicePreviewStep } from '@/components/invoices/steps/invoice-preview-step'

// Import hooks
import { useInvoiceForm } from '@/lib/hooks/use-invoice-form'
import { useCredits } from '@/lib/hooks/use-credits'

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
    clearStorage
  } = useInvoiceForm()

  const {
    credits,
    isLoading: creditsLoading,
    getCreditWarning,
    isDepleted,
    isLow
  } = useCredits()

  // Set client flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load draft from storage on mount
  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

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

  const handleSubmit = form.handleSubmit(async (data) => {
    if (isDepleted) {
      return // Prevent submission if no credits
    }
    
    await submitInvoice(data)
    clearStorage() // Clear draft after successful submission
  })

  const creditWarning = getCreditWarning()

  // Step progress indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {['client', 'details', 'preview'].map((step, index) => {
        const isActive = index === currentStepIndex
        const isCompleted = index < currentStepIndex
        
        return (
          <div key={step} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${isActive 
                ? 'bg-blue-600 text-white' 
                : isCompleted 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }
            `}>
              {index + 1}
            </div>
            {index < 2 && (
              <div className={`
                w-20 h-0.5 mx-2
                ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
              `} />
            )}
          </div>
        )
      })}
    </div>
  )

  // Credit warning alert
  const CreditAlert = () => {
    if (!creditWarning) return null

    return (
      <Alert className={`mb-6 ${isDepleted ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
        <AlertTriangle className={`h-4 w-4 ${isDepleted ? 'text-red-600' : 'text-yellow-600'}`} />
        <AlertDescription className={`${isDepleted ? 'text-red-800' : 'text-yellow-800'}`}>
          {creditWarning}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span>ინვოისები</span>
          <span>/</span>
          <span>ახალი ინვოისი</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">ახალი ინვოისის შექმნა</h1>
            <p className="text-muted-foreground">{stepConfig.description}</p>
          </div>
          <div className="flex items-center gap-3">
            {!creditsLoading && credits && (
              <Badge variant={isLow ? 'destructive' : isDepleted ? 'destructive' : 'secondary'}>
                კრედიტები: {credits.remaining_credits}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <StepIndicator />
      <CreditAlert />

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {stepConfig.title}
                {currentStep === 'preview' && (
                  <div className="text-sm font-normal text-muted-foreground">
                    ჯამური თანხა: {totals.total.toFixed(2)} ₾
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Render current step */}
              {currentStep === 'client' && (
                <ClientSelectionStep form={form} />
              )}
              
              {currentStep === 'details' && (
                <InvoiceDetailsStep form={form} totals={totals} />
              )}
              
              {currentStep === 'preview' && (
                <InvoicePreviewStep form={form} totals={totals} />
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={isFirstStep}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              წინა
            </Button>

            <div className="flex items-center gap-3">
              {isLastStep ? (
                <>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isDepleted}
                    className="flex items-center gap-2"
                    onClick={() => form.setValue('send_immediately', false)}
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'შექმნა...' : 'შენახვა მონახაზად'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isDepleted}
                    className="flex items-center gap-2"
                    onClick={() => form.setValue('send_immediately', true)}
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? 'გაგზავნა...' : 'შექმნა და გაგზავნა'}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  შემდეგი
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>

      {/* Debug info in development - client-only to prevent hydration issues */}
      {process.env.NODE_ENV === 'development' && isClient && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-3 rounded">
              {JSON.stringify({
                currentStep,
                currentStepIndex,
                totals,
                formErrors: form.formState.errors,
                formValues: form.getValues()
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}