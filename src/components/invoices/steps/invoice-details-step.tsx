'use client'

import { useState, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Plus, Trash2, Copy, Calendar, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Controller } from 'react-hook-form'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

import { InvoiceFormData } from '@/lib/hooks/use-invoice-form'
import { useInvoiceForm } from '@/lib/hooks/use-invoice-form'

interface InvoiceDetailsStepProps {
  form: UseFormReturn<InvoiceFormData>
  totals: {
    subtotal: number
    vatAmount: number
    total: number
  }
}

export function InvoiceDetailsStep({ form, totals }: InvoiceDetailsStepProps) {
  const { watch, setValue, getValues, formState: { errors } } = form
  const formData = watch()
  const { user } = useAuth()
  const supabase = createClient()
  const [bankAccounts, setBankAccounts] = useState<Array<{ id: string; bank_name: string; account_number: string; account_name?: string | null; is_default: boolean }>>([])  
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(true)
  
  // Load bank accounts
  useEffect(() => {
    const loadBankAccounts = async () => {
      if (!user) return
      
      try {
        setLoadingBankAccounts(true)
        
        // First get the company ID
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .single()
          
        if (!company) return
        
        // Then get bank accounts
        const { data: accounts, error } = await supabase
          .from('company_bank_accounts')
          .select('id, bank_name, account_number, account_name, is_default')
          .eq('company_id', company.id)
          .eq('is_active', true)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: true })
          
        if (error) throw error
        
        setBankAccounts(accounts || [])
        
        console.log('Loaded bank accounts for invoice:', accounts)
        
        // Set default bank account if not already set
        const currentBankAccountId = getValues('bank_account_id')
        if (!currentBankAccountId && accounts && accounts.length > 0) {
          const defaultAccount = accounts.find(acc => acc.is_default) || accounts[0]
          console.log('Setting default bank account:', defaultAccount)
          setValue('bank_account_id', defaultAccount.id)
        }
        
      } catch (error) {
        console.error('Failed to load bank accounts:', error)
      } finally {
        setLoadingBankAccounts(false)
      }
    }
    
    loadBankAccounts()
  }, [user, supabase, getValues, setValue])
  
  // Item management functions
  const addItem = () => {
    const currentItems = getValues('items')
    const newItem = {
      description: '',
      quantity: 1,
      unit_price: 0,
      line_total: 0,
      sort_order: currentItems.length
    }
    setValue('items', [...currentItems, newItem])
  }

  const removeItem = (index: number) => {
    const currentItems = getValues('items')
    if (currentItems.length > 1) {
      const updatedItems = currentItems
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, sort_order: i }))
      setValue('items', updatedItems)
    }
  }

  const duplicateItem = (index: number) => {
    const currentItems = getValues('items')
    const itemToDuplicate = currentItems[index]
    const newItem = {
      ...itemToDuplicate,
      sort_order: currentItems.length
    }
    setValue('items', [...currentItems, newItem])
  }

  const updateLineTotal = (index: number, quantity: number, unitPrice: number) => {
    const lineTotal = Math.round(quantity * unitPrice * 100) / 100
    setValue(`items.${index}.line_total`, lineTotal)
  }

  // Auto-calculate due date when due_days changes
  const handleDueDaysChange = (dueDays: number) => {
    const issueDate = getValues('issue_date')
    setValue('due_days', dueDays)
  }

  const ItemRow = ({ index }: { index: number }) => {
    const watchedItem = watch(`items.${index}`)
    const [localDescription, setLocalDescription] = useState(watchedItem?.description ?? '')
    const [localQuantity, setLocalQuantity] = useState((watchedItem?.quantity ?? 1).toString())
    const [localUnitPrice, setLocalUnitPrice] = useState((watchedItem?.unit_price ?? 0).toString())
    
    const item = {
      description: watchedItem?.description ?? '',
      quantity: watchedItem?.quantity ?? 1,
      unit_price: watchedItem?.unit_price ?? 0,
      line_total: watchedItem?.line_total ?? 0,
      sort_order: watchedItem?.sort_order ?? 0
    }

    // Sync local state with form state when items change
    useEffect(() => {
      setLocalDescription(watchedItem?.description ?? '')
      setLocalQuantity((watchedItem?.quantity ?? 1).toString())
      setLocalUnitPrice((watchedItem?.unit_price ?? 0).toString())
    }, [watchedItem?.description, watchedItem?.quantity, watchedItem?.unit_price])
    
    const handleQuantityChange = (value: string) => {
      setLocalQuantity(value)
    }

    const handleQuantityBlur = () => {
      const quantity = parseFloat(localQuantity) || 0
      setValue(`items.${index}.quantity`, quantity)
      updateLineTotal(index, quantity, item.unit_price)
    }

    const handleUnitPriceChange = (value: string) => {
      setLocalUnitPrice(value)
    }

    const handleUnitPriceBlur = () => {
      const unitPrice = parseFloat(localUnitPrice) || 0
      setValue(`items.${index}.unit_price`, unitPrice)
      updateLineTotal(index, item.quantity, unitPrice)
    }

    const handleDescriptionChange = (value: string) => {
      setLocalDescription(value)
    }

    const handleDescriptionBlur = () => {
      setValue(`items.${index}.description`, localDescription)
    }

    return (
      <Card className="group relative overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-sm">
        <div className="flex items-center justify-between p-3 border-b border-border/30">
          <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
            ნაწილი #{index + 1}
          </div>
          
          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => duplicateItem(index)}
              className="h-6 w-6 p-0 hover:bg-primary/10"
              title="დუბლირება"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              disabled={formData.items.length === 1}
              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
              title="წაშლა"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            {/* Description */}
            <div className="lg:col-span-5">
              <div className="space-y-1">
                <Label htmlFor={`item-${index}-description`} className="text-xs font-medium text-muted-foreground">
                  აღწერა *
                </Label>
                <Textarea
                  id={`item-${index}-description`}
                  placeholder="პროდუქტის/სერვისის აღწერა..."
                  value={localDescription}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  onBlur={handleDescriptionBlur}
                  className="min-h-[60px] resize-none text-sm border-border/60 focus:border-primary transition-colors"
                  rows={2}
                />
                {errors.items?.[index]?.description && (
                  <p className="text-xs text-destructive">
                    {errors.items[index].description?.message}
                  </p>
                )}
              </div>
            </div>

            {/* Numbers */}
            <div className="lg:col-span-7 grid grid-cols-3 gap-3">
              {/* Quantity */}
              <div className="space-y-1">
                <Label htmlFor={`item-${index}-quantity`} className="text-xs font-medium text-muted-foreground">
                  რაოდენობა
                </Label>
                <Input
                  id={`item-${index}-quantity`}
                  type="number"
                  step="0.001"
                  min="0"
                  value={localQuantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  onBlur={handleQuantityBlur}
                  placeholder="1"
                  className="text-center text-sm h-9 border-border/60 focus:border-primary transition-colors"
                />
                {errors.items?.[index]?.quantity && (
                  <p className="text-xs text-destructive">
                    {errors.items[index].quantity?.message}
                  </p>
                )}
              </div>

              {/* Unit Price */}
              <div className="space-y-1">
                <Label htmlFor={`item-${index}-price`} className="text-xs font-medium text-muted-foreground">
                  ერთ. ფასი
                </Label>
                <div className="relative">
                  <Input
                    id={`item-${index}-price`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={localUnitPrice}
                    onChange={(e) => handleUnitPriceChange(e.target.value)}
                    onBlur={handleUnitPriceBlur}
                    placeholder="0.00"
                    className="text-center text-sm h-9 border-border/60 focus:border-primary transition-colors pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₾</span>
                </div>
                {errors.items?.[index]?.unit_price && (
                  <p className="text-xs text-destructive">
                    {errors.items[index].unit_price?.message}
                  </p>
                )}
              </div>

              {/* Line Total */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">ჯამი</Label>
                <div className="h-9 flex items-center justify-center bg-muted/30 border border-border/40 rounded-md">
                  <span className="text-sm font-semibold text-foreground">
                    {(item.quantity * item.unit_price).toFixed(2)} ₾
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-6">
        {/* Bank Account Selection */}
        <FormField
          control={form.control}
          name="bank_account_id"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>ანგარიშის არჩევა</FormLabel>
              <Select 
                value={field.value || ''} 
                onValueChange={field.onChange}
                disabled={loadingBankAccounts || bankAccounts.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="აირჩიეთ ანგარიში">
                      {field.value && bankAccounts.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {(() => {
                            const account = bankAccounts.find(acc => acc.id === field.value)
                            return account ? `${account.bank_name} - ${account.account_number}` : 'ანგარიში ვერ მოიძებნა'
                          })()}
                        </div>
                      ) : loadingBankAccounts ? (
                        "იტვირთება..."
                      ) : bankAccounts.length === 0 ? (
                        "ანგარიშები ვერ მოიძებნა"
                      ) : (
                        "აირჩიეთ ანგარიში"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2 w-full">
                        <Building2 className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">{account.bank_name}</div>
                          <div className="text-sm text-muted-foreground">{account.account_number}</div>
                        </div>
                        {account.is_default && (
                          <Badge variant="secondary" className="ml-2 text-xs">ნაგულისხმევი</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
              {bankAccounts.length === 0 && !loadingBankAccounts && (
                <p className="text-sm text-muted-foreground">
                  ანგარიშების დასამატებლად გადით <a href="/dashboard/settings/company" className="text-primary hover:underline">კომპანიის პარამეტრებში</a>
                </p>
              )}
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Issue Date */}
        <FormField
          control={form.control}
          name="issue_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>გამოწერის თარიღი</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, 'PPP', { locale: ka })
                      ) : (
                        <span>აირჩიეთ თარიღი</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date(new Date().setDate(new Date().getDate() - 30))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Due Days */}
        <FormField
          control={form.control}
          name="due_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>გადახდის ვადა (დღეები)</FormLabel>
              <Select value={field.value?.toString() || '14'} onValueChange={(value) => field.onChange(parseInt(value))}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
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

        {/* Currency */}
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ვალუტა</FormLabel>
              <Select value={field.value || 'GEL'} onValueChange={field.onChange}>
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
              <FormLabel>დღგ განაკვეთი (%)</FormLabel>
              <Select value={field.value?.toString() || '18'} onValueChange={(value) => field.onChange(parseFloat(value))}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="0">0% - დღგ გარეშე</SelectItem>
                  <SelectItem value="18">18% - სტანდარტული</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />

      {/* Invoice Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">პროდუქტები/სერვისები</h3>
          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            ახალი ხაზი
          </Button>
        </div>

        <div className="space-y-3">
          {formData.items.map((_, index) => (
            <ItemRow key={index} index={index} />
          ))}
        </div>

        {errors.items && (
          <p className="text-sm text-red-600">
            {typeof errors.items.message === 'string' ? errors.items.message : 'შეავსეთ ყველა სავალდებულო ველი'}
          </p>
        )}
      </div>

      <Separator />

      {/* Totals */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">ჯამები</h3>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>ქვეჯამი:</span>
                <span className="font-medium">{totals.subtotal.toFixed(2)} {formData.currency === 'GEL' ? '₾' : formData.currency}</span>
              </div>
              
              {formData.vat_rate > 0 && (
                <div className="flex items-center justify-between">
                  <span>დღგ ({formData.vat_rate}%):</span>
                  <span className="font-medium">{totals.vatAmount.toFixed(2)} {formData.currency === 'GEL' ? '₾' : formData.currency}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex items-center justify-between text-lg font-bold">
                <span>სულ გადასახდელი:</span>
                <span>{totals.total.toFixed(2)} {formData.currency === 'GEL' ? '₾' : formData.currency}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Notes and Payment Instructions */}
      <div className="grid grid-cols-1 gap-6">
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>შენიშვნები</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="დამატებითი ინფორმაცია ინვოისისთვის..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>გადახდის ინსტრუქციები</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="გადახდის ინსტრუქციები კლიენტისთვის..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Invoice Preview Number */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">ინვოისის ნომერი</h4>
            <p className="text-sm text-blue-700">ავტომატურად მიენიჭება შენახვისას</p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            INV-{new Date().getFullYear()}-XXXX
          </Badge>
        </div>
      </div>
    </div>
  )
}