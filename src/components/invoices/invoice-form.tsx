'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Save, Send, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { createInvoiceSchema, updateInvoiceSchema, calculateInvoiceTotals, createEmptyInvoiceItem } from '@/lib/validations/invoice'
import { useCreateInvoice, useUpdateInvoice } from '@/lib/hooks/use-invoices'
import { ClientSelector } from './client-selector'
import { InvoiceItems } from './invoice-items'

import type { Invoice, CreateInvoice, UpdateInvoice } from '@/lib/validations/invoice'

// =====================================
// TYPES AND INTERFACES
// =====================================

interface InvoiceFormProps {
  mode: 'create' | 'edit'
  initialData?: Invoice
  companyId: string
  onSuccess?: (invoice: Invoice) => void
  onCancel?: () => void
}

interface FormTotals {
  subtotal: number
  vatAmount: number
  total: number
}

// =====================================
// MAIN COMPONENT
// =====================================

export function InvoiceForm({
  mode,
  initialData,
  companyId,
  onSuccess,
  onCancel
}: InvoiceFormProps) {
  const [totals, setTotals] = useState<FormTotals>({ subtotal: 0, vatAmount: 0, total: 0 })
  const [isDraftSaved, setIsDraftSaved] = useState(false)

  // Mutations
  const createMutation = useCreateInvoice()
  const updateMutation = useUpdateInvoice()

  // Form setup
  const isEditing = mode === 'edit'
  const schema = isEditing ? updateInvoiceSchema : createInvoiceSchema

  const form = useForm<CreateInvoice | UpdateInvoice>({
    resolver: zodResolver(schema),
    defaultValues: isEditing && initialData ? {
      id: initialData.id,
      company_id: initialData.company_id,
      client_id: initialData.client_id,
      issue_date: new Date(initialData.issue_date),
      due_date: new Date(initialData.due_date),
      currency: initialData.currency,
      vat_rate: initialData.vat_rate,
      notes: initialData.notes || '',
      payment_instructions: initialData.payment_instructions || '',
      items: initialData.items || [createEmptyInvoiceItem()]
    } : {
      company_id: companyId,
      client_id: '',
      issue_date: new Date(),
      due_days: 14,
      currency: 'GEL' as const,
      vat_rate: 18,
      notes: '',
      payment_instructions: '',
      items: [createEmptyInvoiceItem()]
    },
    mode: 'onChange'
  })

  // Field arrays for dynamic items
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'items'
  })

  // Watch form values for calculations and auto-save
  const watchedItems = form.watch('items')
  const watchedVatRate = form.watch('vat_rate')

  // Calculate totals when items or VAT rate changes
  useEffect(() => {
    if (watchedItems && Array.isArray(watchedItems)) {
      const calculatedTotals = calculateInvoiceTotals(watchedItems, watchedVatRate || 0)
      setTotals(calculatedTotals)
    }
  }, [watchedItems, watchedVatRate])

  // Auto-save draft (only for create mode)
  useEffect(() => {
    if (mode === 'create') {
      const subscription = form.watch((value) => {
        if (value.client_id || (value.items && value.items.length > 0 && value.items[0]?.description)) {
          localStorage.setItem('invoice-draft', JSON.stringify(value))
          setIsDraftSaved(true)
          setTimeout(() => setIsDraftSaved(false), 2000)
        }
      })
      return () => subscription.unsubscribe()
    }
  }, [form.watch, mode])

  // Load draft on mount (create mode only)
  useEffect(() => {
    if (mode === 'create') {
      const savedDraft = localStorage.getItem('invoice-draft')
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft)
          form.reset(draftData)
        } catch (error) {
          console.error('Failed to load draft:', error)
          localStorage.removeItem('invoice-draft')
        }
      }
    }
  }, [mode, form])

  // Form submission handlers
  const onSubmit = async (data: CreateInvoice | UpdateInvoice, shouldSend = false) => {
    try {
      if (mode === 'create') {
        const createData = data as CreateInvoice
        
        // Calculate due_date from due_days if needed
        if (createData.due_days && !createData.due_date) {
          const dueDate = new Date(createData.issue_date)
          dueDate.setDate(dueDate.getDate() + createData.due_days)
          createData.due_date = dueDate
        }

        const result = await createMutation.mutateAsync(createData)
        
        if (result.data) {
          // Clear draft
          localStorage.removeItem('invoice-draft')
          
          // If should send, update status
          if (shouldSend) {
            // This would trigger email sending in real implementation
            console.log('Invoice created and will be sent')
          }
          
          onSuccess?.(result.data)
        }
      } else {
        const updateData = data as UpdateInvoice
        const result = await updateMutation.mutateAsync(updateData)
        
        if (result.data) {
          onSuccess?.(result.data)
        }
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleSaveAsDraft = () => {
    onSubmit(form.getValues(), false)
  }

  const handleSaveAndSend = () => {
    onSubmit(form.getValues(), true)
  }

  const handleAddItem = () => {
    append(createEmptyInvoiceItem())
  }

  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const handleDuplicateItem = (index: number) => {
    const item = form.getValues(`items.${index}`)
    append({ ...item, id: undefined })
  }

  const clearDraft = () => {
    localStorage.removeItem('invoice-draft')
    setIsDraftSaved(false)
  }

  const isLoading = createMutation.isLoading || updateMutation.isLoading
  const hasErrors = Object.keys(form.formState.errors).length > 0

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSaveAsDraft)} className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'ინვოისის რედაქტირება' : 'ახალი ინვოისი'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEditing ? 'შეცვალეთ ინვოისის დეტალები' : 'შექმენით ახალი ინვოისი თქვენი კლიენტისთვის'}
            </p>
          </div>
          
          {mode === 'create' && isDraftSaved && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                მონახაზი შენახულია
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearDraft}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Form Errors Summary */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertDescription>
              გთხოვთ შეასწოროთ ფორმის შეცდომები გაგრძელებამდე
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Client Selection */}
            <Card>
              <CardHeader>
                <CardTitle>კლიენტი</CardTitle>
                <CardDescription>
                  აირჩიეთ კლიენტი ან დაამატეთ ახალი
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>კლიენტი *</FormLabel>
                      <FormControl>
                        <ClientSelector
                          value={field.value}
                          onValueChange={field.onChange}
                          error={form.formState.errors.client_id?.message}
                          companyId={companyId}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle>ინვოისის დეტალები</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Invoice Number (Edit mode only) */}
                {isEditing && (
                  <FormField
                    control={form.control}
                    name="invoice_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ინვოისის ნომერი</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Issue Date */}
                  <FormField
                    control={form.control}
                    name="issue_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>გამოწერის თარიღი *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>აირჩიეთ თარიღი</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Due Date or Due Days */}
                  {isEditing ? (
                    <FormField
                      control={form.control}
                      name="due_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>გადახდის ვადა *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={`pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "dd/MM/yyyy")
                                  ) : (
                                    <span>აირჩიეთ თარიღი</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="due_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>გადახდის ვადა (დღე)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="აირჩიეთ ვადა" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="7">7 დღე</SelectItem>
                              <SelectItem value="14">14 დღე</SelectItem>
                              <SelectItem value="30">30 დღე</SelectItem>
                              <SelectItem value="60">60 დღე</SelectItem>
                              <SelectItem value="90">90 დღე</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Currency */}
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ვალუტა</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="GEL">₾ ლარი</SelectItem>
                            <SelectItem value="USD">$ დოლარი</SelectItem>
                            <SelectItem value="EUR">€ ევრო</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* VAT Rate */}
                  <FormField
                    control={form.control}
                    name="vat_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>დღგ (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <CardTitle>პროდუქტები/სერვისები</CardTitle>
                <CardDescription>
                  დაამატეთ ინვოისის პოზიციები
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceItems
                  control={form.control}
                  errors={form.formState.errors}
                  fields={fields}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                  onDuplicateItem={handleDuplicateItem}
                  onMoveItem={move}
                  vatRate={watchedVatRate || 0}
                  currency={form.watch('currency') || 'GEL'}
                />
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>დამატებითი ინფორმაცია</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>შენიშვნები</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="ინვოისზე გამოჩნდება..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        ეს ტექსტი გამოჩნდება ინვოისზე
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Instructions */}
                <FormField
                  control={form.control}
                  name="payment_instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>გადახდის ინსტრუქციები</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="საბანკო რეკვიზიტები და გადახდის პირობები..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        გადახდის დეტალები და ინსტრუქციები
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Totals and Actions */}
          <div className="space-y-6">
            
            {/* Totals Card */}
            <Card>
              <CardHeader>
                <CardTitle>ჯამური</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ქვეჯამი:</span>
                  <span className="font-medium">
                    {totals.subtotal.toFixed(2)} {form.watch('currency')}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">დღგ ({watchedVatRate}%):</span>
                  <span className="font-medium">
                    {totals.vatAmount.toFixed(2)} {form.watch('currency')}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>სულ ჯამი:</span>
                  <span className="text-primary">
                    {totals.total.toFixed(2)} {form.watch('currency')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>მოქმედებები</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                
                {mode === 'create' ? (
                  <>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || hasErrors}
                    >
                      {isLoading ? (
                        <>შენახვა...</>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          მონახაზის შენახვა
                        </>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="default"
                      className="w-full"
                      onClick={handleSaveAndSend}
                      disabled={isLoading || hasErrors}
                    >
                      {isLoading ? (
                        <>გაგზავნა...</>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          შენახვა და გაგზავნა
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || hasErrors}
                  >
                    {isLoading ? (
                      <>განახლება...</>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        ცვლილებების შენახვა
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  <X className="mr-2 h-4 w-4" />
                  გაუქმება
                </Button>
              </CardContent>
            </Card>

            {/* Draft Recovery (Create mode only) */}
            {mode === 'create' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">მონახაზის აღდგენა</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600 mb-2">
                    ფორმა ავტომატურად ინახება ტექსტის შეყვანისას
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearDraft}
                    className="text-xs h-8"
                  >
                    მონახაზის გასუფთავება
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </Form>
  )
}