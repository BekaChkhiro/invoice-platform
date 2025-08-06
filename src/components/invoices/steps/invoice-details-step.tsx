'use client'

import { UseFormReturn } from 'react-hook-form'
import { Plus, Trash2, Copy, Calendar } from 'lucide-react'
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
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'

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
  
  const { addItem, removeItem, duplicateItem, updateLineTotal } = useInvoiceForm()

  // Auto-calculate due date when due_days changes
  const handleDueDaysChange = (dueDays: number) => {
    const issueDate = getValues('issue_date')
    setValue('due_days', dueDays)
  }

  const ItemRow = ({ index }: { index: number }) => {
    const item = watch(`items.${index}`)
    
    const handleQuantityChange = (value: string) => {
      const quantity = parseFloat(value) || 0
      setValue(`items.${index}.quantity`, quantity)
      updateLineTotal(index, quantity, item.unit_price)
    }

    const handleUnitPriceChange = (value: string) => {
      const unitPrice = parseFloat(value) || 0
      setValue(`items.${index}.unit_price`, unitPrice)
      updateLineTotal(index, item.quantity, unitPrice)
    }

    const handleDescriptionChange = (value: string) => {
      setValue(`items.${index}.description`, value)
    }

    return (
      <Card className="p-4">
        <div className="grid grid-cols-12 gap-4 items-start">
          {/* Description */}
          <div className="col-span-5">
            <Label htmlFor={`item-${index}-description`}>აღწერა</Label>
            <Textarea
              id={`item-${index}-description`}
              placeholder="პროდუქტის ან სერვისის აღწერა..."
              value={item.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="min-h-[60px] resize-none"
            />
            {errors.items?.[index]?.description && (
              <p className="text-sm text-red-600 mt-1">
                {errors.items[index].description?.message}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="col-span-2">
            <Label htmlFor={`item-${index}-quantity`}>რაოდენობა</Label>
            <Input
              id={`item-${index}-quantity`}
              type="number"
              step="0.001"
              min="0"
              value={item.quantity?.toString() || ''}
              onChange={(e) => handleQuantityChange(e.target.value)}
            />
            {errors.items?.[index]?.quantity && (
              <p className="text-sm text-red-600 mt-1">
                {errors.items[index].quantity?.message}
              </p>
            )}
          </div>

          {/* Unit Price */}
          <div className="col-span-2">
            <Label htmlFor={`item-${index}-price`}>ერთეულის ფასი</Label>
            <Input
              id={`item-${index}-price`}
              type="number"
              step="0.01"
              min="0"
              value={item.unit_price?.toString() || ''}
              onChange={(e) => handleUnitPriceChange(e.target.value)}
            />
            {errors.items?.[index]?.unit_price && (
              <p className="text-sm text-red-600 mt-1">
                {errors.items[index].unit_price?.message}
              </p>
            )}
          </div>

          {/* Line Total */}
          <div className="col-span-2">
            <Label>ჯამი</Label>
            <div className="h-10 flex items-center font-medium">
              {(item.quantity * item.unit_price).toFixed(2)} ₾
            </div>
          </div>

          {/* Actions */}
          <div className="col-span-1 flex flex-col gap-1">
            <Label className="opacity-0">.</Label>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => duplicateItem(index)}
                className="p-1 h-8 w-8"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeItem(index)}
                disabled={formData.items.length === 1}
                className="p-1 h-8 w-8 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
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
              <Select value={field.value?.toString() || ''} onValueChange={(value) => field.onChange(parseInt(value))}>
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
              <Select value={field.value || ''} onValueChange={field.onChange}>
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
              <Select value={field.value?.toString() || ''} onValueChange={(value) => field.onChange(parseFloat(value))}>
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