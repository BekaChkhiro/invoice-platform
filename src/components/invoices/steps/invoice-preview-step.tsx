'use client'

import { UseFormReturn } from 'react-hook-form'
import { FileText, Send, User, Building, Mail, Calendar, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'

import { InvoiceFormData } from '@/lib/hooks/use-invoice-form'
import { useClientDetails } from '@/lib/hooks/use-client-search'
import { useCredits } from '@/lib/hooks/use-credits'

interface InvoicePreviewStepProps {
  form: UseFormReturn<InvoiceFormData>
  totals: {
    subtotal: number
    vatAmount: number
    total: number
  }
}

export function InvoicePreviewStep({ form, totals }: InvoicePreviewStepProps) {
  const { watch, setValue } = form
  const formData = watch()
  
  const { data: client } = useClientDetails(formData.client_id)
  const { credits, getCreditWarning } = useCredits()

  // Calculate due date
  const dueDate = new Date(formData.issue_date)
  dueDate.setDate(dueDate.getDate() + formData.due_days)

  const currencySymbol = {
    GEL: '₾',
    USD: '$',
    EUR: '€'
  }[formData.currency]

  const statusColor = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800'
  }

  const creditWarning = getCreditWarning()

  return (
    <div className="space-y-6">
      {/* Credit Warning */}
      {creditWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-yellow-600" />
            <div>
              <h4 className="font-medium text-yellow-900">კრედიტების შეტყობინება</h4>
              <p className="text-sm text-yellow-800">{creditWarning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Send Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            გაგზავნის პარამეტრები
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="send_immediately"
              checked={formData.send_immediately}
              onCheckedChange={(checked) => setValue('send_immediately', checked as boolean)}
            />
            <Label htmlFor="send_immediately" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              ინვოისის დაუყოვნებლივ გაგზავნა კლიენტისთვის ელ.ფოსტით
            </Label>
          </div>
          {formData.send_immediately && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ინვოისი გაიგზავნება PDF ფაილის სახით მითითებულ ელ.ფოსტაზე: {client?.email || 'ელ.ფოსტა მითითებული არ არის'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            ინვოისის გადახედვა
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Header */}
          <div className="space-y-6">
            {/* Invoice Info */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">ინვოისი</h2>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>ნომერი: INV-{new Date().getFullYear()}-XXXX</div>
                  <div>გამოწერის თარიღი: {format(formData.issue_date, 'dd/MM/yyyy', { locale: ka })}</div>
                  <div>გადახდის ვადა: {format(dueDate, 'dd/MM/yyyy', { locale: ka })}</div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-2">
                  {formData.send_immediately ? 'გაიგზავნება' : 'გადასახდელი'}
                </Badge>
                <div className="text-2xl font-bold">
                  {totals.total.toFixed(2)} {currencySymbol}
                </div>
              </div>
            </div>

            <Separator />

            {/* Client Info */}
            {client && (
              <div>
                <h3 className="font-medium mb-3">მიმღები</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      client.type === 'company' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {client.type === 'company' ? <Building className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{client.name}</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {client.type === 'company' && client.tax_id && (
                          <div>საიდენტიფიკაციო კოდი: {client.tax_id}</div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {client.email}
                          </div>
                        )}
                        {client.contact_person && (
                          <div>საკონტაქტო პირი: {client.contact_person}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Items */}
            <div>
              <h3 className="font-medium mb-3">პროდუქტები/სერვისები</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">აღწერა</th>
                      <th className="text-right py-2 font-medium w-20">რაოდენობა</th>
                      <th className="text-right py-2 font-medium w-24">ერთეულის ფასი</th>
                      <th className="text-right py-2 font-medium w-24">ჯამი</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3">
                          <div className="font-medium">{item.description}</div>
                        </td>
                        <td className="py-3 text-right">{item.quantity}</td>
                        <td className="py-3 text-right">{item.unit_price.toFixed(2)} {currencySymbol}</td>
                        <td className="py-3 text-right font-medium">{(item.quantity * item.unit_price).toFixed(2)} {currencySymbol}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              {formData.vat_rate > 0 ? (
                <>
                  <div className="flex justify-between">
                    <span>ქვეჯამი:</span>
                    <span>{totals.subtotal.toFixed(2)} {currencySymbol}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>დღგ ({formData.vat_rate}%):</span>
                    <span>{totals.vatAmount.toFixed(2)} {currencySymbol}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>სულ გადასახდელი:</span>
                    <span>{totals.total.toFixed(2)} {currencySymbol}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-lg font-bold">
                  <span>სულ გადასახდელი:</span>
                  <span>{totals.total.toFixed(2)} {currencySymbol}</span>
                </div>
              )}
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Final Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">მზად არის შექმნისთვის</h4>
              <p className="text-sm text-blue-700">
                ინვოისი შეიქმნება {formData.send_immediately ? 'და გაიგზავნება ' : ''}
                {credits && `(დარჩენილი კრედიტები: ${credits.remaining_credits - 1})`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">
                {totals.total.toFixed(2)} {currencySymbol}
              </div>
              <div className="text-sm text-blue-700">
                {formData.items.length} ელემენტი
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}