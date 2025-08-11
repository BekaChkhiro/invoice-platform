'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Validation schemas
const invoiceItemSchema = z.object({
  description: z.string().min(1, 'აღწერა აუცილებელია'),
  quantity: z.number().min(0.001, 'რაოდენობა უნდა იყოს დადებითი'),
  unit_price: z.number().min(0, 'ფასი არ შეიძლება იყოს უარყოფითი'),
  line_total: z.number().optional(),
  sort_order: z.number().optional()
})

const invoiceFormSchema = z.object({
  client_id: z.string().min(1, 'კლიენტის არჩევა აუცილებელია'),
  issue_date: z.date().default(() => new Date()),
  due_days: z.number().min(1).max(365).default(14),
  currency: z.enum(['GEL', 'USD', 'EUR']).default('GEL'),
  vat_rate: z.number().min(0).max(100).default(18),
  notes: z.string().max(1000).optional(),
  payment_instructions: z.string().max(1000).optional(),
  items: z.array(invoiceItemSchema).min(1, 'მინიმუმ ერთი პროდუქტი/სერვისი აუცილებელია'),
  send_immediately: z.boolean().default(false)
})

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>
export type InvoiceItem = z.infer<typeof invoiceItemSchema>

type FormStep = 'client' | 'details' | 'preview'

interface FormStepConfig {
  title: string
  description: string
  isValid: (data: Partial<InvoiceFormData>) => boolean
}

const formSteps: Record<FormStep, FormStepConfig> = {
  client: {
    title: 'კლიენტის არჩევა',
    description: 'აირჩიეთ კლიენტი ან შექმენით ახალი',
    isValid: (data) => !!data.client_id
  },
  details: {
    title: 'ინვოისის დეტალები',
    description: 'შეავსეთ ინვოისის ინფორმაცია',
    isValid: (data) => !!(data.items && data.items.length > 0 && data.items.every(item => 
      item.description && item.quantity > 0 && item.unit_price >= 0
    ))
  },
  preview: {
    title: 'გადახედვა და დადასტურება',
    description: 'შეამოწმეთ ინვოისი და გააგზავნეთ',
    isValid: () => true
  }
}

/**
 * Hook for managing multi-step invoice form
 */
export function useInvoiceForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<FormStep>('client')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form setup with Zod validation
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      client_id: '',
      issue_date: new Date(),
      due_days: 14,
      currency: 'GEL',
      vat_rate: 18,
      notes: '',
      payment_instructions: '',
      items: [{
        description: '',
        quantity: 1,
        unit_price: 0,
        line_total: 0,
        sort_order: 0
      }],
      send_immediately: false
    },
    mode: 'onChange'
  })

  const { watch, setValue, getValues, trigger } = form
  const formData = watch()

  // Step navigation
  const steps: FormStep[] = ['client', 'details', 'preview']
  const currentStepIndex = steps.indexOf(currentStep)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1

  const goToStep = useCallback((step: FormStep) => {
    setCurrentStep(step)
  }, [])

  const goToPreviousStep = useCallback(() => {
    if (!isFirstStep) {
      const previousStep = steps[currentStepIndex - 1]
      setCurrentStep(previousStep)
    }
  }, [currentStepIndex, isFirstStep, steps])

  const goToNextStep = useCallback(async () => {
    // Validate current step before proceeding
    const stepConfig = formSteps[currentStep]
    
    if (!stepConfig.isValid(formData)) {
      // Trigger validation for relevant fields
      if (currentStep === 'client') {
        await trigger('client_id')
      } else if (currentStep === 'details') {
        await trigger(['items', 'issue_date', 'due_days'])
      }
      return false
    }

    if (!isLastStep) {
      const nextStep = steps[currentStepIndex + 1]
      setCurrentStep(nextStep)
      return true
    }

    return false
  }, [currentStep, currentStepIndex, formData, isLastStep, steps, trigger])

  // Item management
  const addItem = useCallback(() => {
    const currentItems = getValues('items')
    const newItem: InvoiceItem = {
      description: '',
      quantity: 1,
      unit_price: 0,
      line_total: 0,
      sort_order: currentItems.length
    }
    setValue('items', [...currentItems, newItem])
  }, [getValues, setValue])

  const removeItem = useCallback((index: number) => {
    const currentItems = getValues('items')
    if (currentItems.length > 1) {
      const updatedItems = currentItems
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, sort_order: i }))
      setValue('items', updatedItems)
    }
  }, [getValues, setValue])

  const duplicateItem = useCallback((index: number) => {
    const currentItems = getValues('items')
    const itemToDuplicate = currentItems[index]
    const newItem = {
      ...itemToDuplicate,
      sort_order: currentItems.length
    }
    setValue('items', [...currentItems, newItem])
  }, [getValues, setValue])

  // Calculations
  const calculateTotals = useCallback(() => {
    const items = getValues('items')
    const vatRate = getValues('vat_rate') || 0

    const subtotal = items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unit_price
      return sum + lineTotal
    }, 0)

    const vatAmount = subtotal * (vatRate / 100)
    const total = subtotal + vatAmount

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      total: Math.round(total * 100) / 100
    }
  }, [getValues])

  const totals = calculateTotals()

  // Update line totals when quantity or unit_price changes
  const updateLineTotal = useCallback((index: number, quantity: number, unitPrice: number) => {
    const lineTotal = Math.round(quantity * unitPrice * 100) / 100
    setValue(`items.${index}.line_total`, lineTotal)
  }, [setValue])

  // Form submission
  const submitInvoice = useCallback(async (data: InvoiceFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          due_date: new Date(data.issue_date.getTime() + data.due_days * 24 * 60 * 60 * 1000)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'ინვოისის შექმნა ვერ მოხერხდა')
      }

      const result = await response.json()

      // If send immediately is enabled, send the invoice
      if (data.send_immediately && result.id) {
        try {
          const sendResponse = await fetch(`/api/invoices/${result.id}/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              attachPDF: true
            })
          })

          if (sendResponse.ok) {
            toast.success('ინვოისი შეიქმნა და გაიგზავნა')
          } else {
            toast.success('ინვოისი შეიქმნა, მაგრამ გაგზავნა ვერ მოხერხდა')
          }
        } catch (sendError) {
          console.error('Failed to send invoice:', sendError)
          toast.success('ინვოისი შეიქმნა, მაგრამ გაგზავნა ვერ მოხერხდა')
        }
      } else {
        toast.success(`ინვოისი ${result.invoice_number} წარმატებით შეიქმნა`)
      }

      // Navigate to the created invoice
      router.push(`/dashboard/invoices/${result.id}`)
      
    } catch (error) {
      console.error('Failed to create invoice:', error)
      const errorMessage = error instanceof Error ? error.message : 'ინვოისის შექმნა ვერ მოხერხდა'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [router])

  // Form persistence (localStorage)
  const saveToStorage = useCallback(() => {
    const data = getValues()
    localStorage.setItem('invoice-draft', JSON.stringify({
      ...data,
      issue_date: data.issue_date.toISOString()
    }))
  }, [getValues])

  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('invoice-draft')
      if (stored) {
        const data = JSON.parse(stored)
        // Convert issue_date back to Date object
        if (data.issue_date) {
          data.issue_date = new Date(data.issue_date)
        }
        
        // Ensure all fields have default values to prevent uncontrolled/controlled warnings
        const cleanData = {
          client_id: data.client_id || '',
          issue_date: data.issue_date || new Date(),
          due_days: data.due_days ?? 14,
          currency: data.currency || 'GEL',
          vat_rate: data.vat_rate ?? 18,
          notes: data.notes || '',
          payment_instructions: data.payment_instructions || '',
          send_immediately: data.send_immediately ?? false,
          items: data.items ? data.items.map((item: any, index: number) => ({
            description: item.description || '',
            quantity: item.quantity ?? 1,
            unit_price: item.unit_price ?? 0,
            line_total: item.line_total ?? 0,
            sort_order: item.sort_order ?? index
          })) : [{
            description: '',
            quantity: 1,
            unit_price: 0,
            line_total: 0,
            sort_order: 0
          }]
        }
        
        form.reset(cleanData)
        return true
      }
    } catch (error) {
      console.warn('Failed to load draft from storage:', error)
    }
    return false
  }, [form])

  const clearStorage = useCallback(() => {
    localStorage.removeItem('invoice-draft')
  }, [])

  return {
    // Form
    form,
    formData,
    isSubmitting,
    
    // Steps
    currentStep,
    steps,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    stepConfig: formSteps[currentStep],
    goToStep,
    goToPreviousStep,
    goToNextStep,
    
    // Items
    addItem,
    removeItem,
    duplicateItem,
    updateLineTotal,
    
    // Calculations
    totals,
    calculateTotals,
    
    // Submission
    submitInvoice,
    
    // Persistence
    saveToStorage,
    loadFromStorage,
    clearStorage
  }
}