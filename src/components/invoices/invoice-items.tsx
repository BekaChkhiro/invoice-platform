'use client'

import { useMemo } from 'react'
import { Control, FieldErrors, FieldArrayWithId } from 'react-hook-form'
import { Plus, Trash2, Copy, GripVertical, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { calculateLineTotal } from '@/lib/validations/invoice'
import type { CreateInvoice, UpdateInvoice, InvoiceItem } from '@/lib/validations/invoice'

// =====================================
// TYPES AND INTERFACES
// =====================================

interface InvoiceItemsProps {
  control: Control<CreateInvoice | UpdateInvoice>
  errors: FieldErrors<CreateInvoice | UpdateInvoice>
  fields: FieldArrayWithId<CreateInvoice | UpdateInvoice, 'items', 'id'>[]
  onAddItem: () => void
  onRemoveItem: (index: number) => void
  onDuplicateItem: (index: number) => void
  onMoveItem: (from: number, to: number) => void
  vatRate: number
  currency: string
}

// =====================================
// MAIN COMPONENT
// =====================================

export function InvoiceItems({
  control,
  errors,
  fields,
  onAddItem,
  onRemoveItem,
  onDuplicateItem,
  onMoveItem,
  vatRate,
  currency
}: InvoiceItemsProps) {

  // Currency symbol mapping
  const currencySymbol = useMemo(() => {
    const symbols = { GEL: '₾', USD: '$', EUR: '€' }
    return symbols[currency as keyof typeof symbols] || currency
  }, [currency])

  // Calculate totals for display
  const totals = useMemo(() => {
    const subtotal = fields.reduce((sum, _, index) => {
      const quantity = control._getWatch(`items.${index}.quantity`) || 0
      const unitPrice = control._getWatch(`items.${index}.unit_price`) || 0
      return sum + calculateLineTotal(quantity, unitPrice)
    }, 0)
    
    const vatAmount = subtotal * (vatRate / 100)
    const total = subtotal + vatAmount
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      total: Math.round(total * 100) / 100
    }
  }, [fields, control, vatRate])

  const hasItemErrors = errors.items && Array.isArray(errors.items)

  return (
    <div className="space-y-4">
      
      {/* Items Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-8"></TableHead>
              <TableHead className="min-w-[300px]">აღწერა</TableHead>
              <TableHead className="w-24">რაოდ.</TableHead>
              <TableHead className="w-32">ერთ. ფასი</TableHead>
              <TableHead className="w-32 text-right">ჯამი</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <InvoiceItemRow
                key={field.id}
                index={index}
                control={control}
                errors={hasItemErrors ? errors.items[index] : undefined}
                currencySymbol={currencySymbol}
                onRemove={() => onRemoveItem(index)}
                onDuplicate={() => onDuplicateItem(index)}
                canRemove={fields.length > 1}
              />
            ))}
            
            {/* Add Item Row */}
            <TableRow>
              <TableCell colSpan={6}>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full h-12 text-gray-500 border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  onClick={onAddItem}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  ახალი პოზიცია
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Items Error */}
      {errors.items && typeof errors.items === 'object' && !Array.isArray(errors.items) && (
        <Alert variant="destructive">
          <AlertDescription>
            {errors.items.message || 'მინიმუმ ერთი პოზიცია აუცილებელია'}
          </AlertDescription>
        </Alert>
      )}

      {/* Items Actions */}
      <div className="flex flex-wrap gap-2 justify-between items-center p-4 bg-gray-50 rounded-lg">
        <div className="flex gap-2">
          <Badge variant="secondary">
            {fields.length} პოზიცია
          </Badge>
          
          {fields.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4 mr-1" />
                  ბაჩ მოქმედებები
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => {
                  // Clear all items except first
                  for (let i = fields.length - 1; i > 0; i--) {
                    onRemoveItem(i)
                  }
                }}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  ყველას გასუფთავება
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // Duplicate all items
                  fields.forEach((_, index) => {
                    onDuplicateItem(index)
                  })
                }}>
                  <Copy className="mr-2 h-4 w-4" />
                  ყველას კოპირება
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Quick Add Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddItem}
        >
          <Plus className="mr-1 h-4 w-4" />
          პოზიცია
        </Button>
      </div>

      {/* Totals Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">ქვეჯამი:</span>
          <span className="font-medium">
            {totals.subtotal.toFixed(2)} {currencySymbol}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">დღგ ({vatRate}%):</span>
          <span className="font-medium">
            {totals.vatAmount.toFixed(2)} {currencySymbol}
          </span>
        </div>
        
        <div className="border-t pt-2">
          <div className="flex justify-between text-base font-bold">
            <span>სულ ჯამი:</span>
            <span className="text-primary">
              {totals.total.toFixed(2)} {currencySymbol}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// =====================================
// INVOICE ITEM ROW COMPONENT
// =====================================

interface InvoiceItemRowProps {
  index: number
  control: Control<CreateInvoice | UpdateInvoice>
  errors?: any
  currencySymbol: string
  onRemove: () => void
  onDuplicate: () => void
  canRemove: boolean
}

function InvoiceItemRow({
  index,
  control,
  errors,
  currencySymbol,
  onRemove,
  onDuplicate,
  canRemove
}: InvoiceItemRowProps) {

  // Calculate line total for this row
  const quantity = control._getWatch(`items.${index}.quantity`) || 0
  const unitPrice = control._getWatch(`items.${index}.unit_price`) || 0
  const lineTotal = calculateLineTotal(quantity, unitPrice)

  return (
    <TableRow className="group hover:bg-gray-50">
      
      {/* Drag Handle */}
      <TableCell className="p-2">
        <div className="flex items-center justify-center">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab group-hover:text-gray-600" />
        </div>
      </TableCell>

      {/* Description */}
      <TableCell className="p-2">
        <FormField
          control={control}
          name={`items.${index}.description`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="პროდუქტის/სერვისის აღწერა..."
                  className="min-h-[60px] resize-none border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary"
                  {...field}
                />
              </FormControl>
              {errors?.description && (
                <FormMessage>{errors.description.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
      </TableCell>

      {/* Quantity */}
      <TableCell className="p-2">
        <FormField
          control={control}
          name={`items.${index}.quantity`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  className="border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary text-right"
                  value={field.value?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    field.onChange(value === '' ? 0 : parseFloat(value))
                  }}
                />
              </FormControl>
              {errors?.quantity && (
                <FormMessage>{errors.quantity.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
      </TableCell>

      {/* Unit Price */}
      <TableCell className="p-2">
        <FormField
          control={control}
          name={`items.${index}.unit_price`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary text-right pr-8"
                    value={field.value?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      field.onChange(value === '' ? 0 : parseFloat(value))
                    }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    {currencySymbol}
                  </span>
                </div>
              </FormControl>
              {errors?.unit_price && (
                <FormMessage>{errors.unit_price.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
      </TableCell>

      {/* Line Total */}
      <TableCell className="p-2 text-right">
        <div className="text-sm font-medium text-gray-900">
          {lineTotal.toFixed(2)} {currencySymbol}
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              კოპირება
            </DropdownMenuItem>
            {canRemove && (
              <DropdownMenuItem onClick={onRemove} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                წაშლა
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}