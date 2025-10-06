'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Calendar, CreditCard, User } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { useAllClients } from '@/lib/hooks/use-clients'
import { useClientSubscriptions } from '@/hooks/use-client-subscriptions'
import { useFlittConfig } from '@/hooks/use-flitt-config'
import { CreateSubscriptionRequest } from '@/types'

export default function NewSubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client')
  
  const { data: clients = [], isLoading: clientsLoading } = useAllClients()
  const { createSubscription } = useClientSubscriptions(undefined, false)
  const { config: flittConfig } = useFlittConfig()
  
  const [formData, setFormData] = useState<CreateSubscriptionRequest>({
    client_id: clientId || '',
    service_name: '',
    description: '',
    amount: 0,
    billing_cycle: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    auto_invoice: true,
    use_flitt: false
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedClient = clients.find(c => c.id === formData.client_id)

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.client_id) {
      newErrors.client_id = 'კლიენტის არჩევა სავალდებულოა'
    }
    
    if (!formData.service_name.trim()) {
      newErrors.service_name = 'სერვისის სახელი სავალდებულოა'
    }
    
    if (formData.amount <= 0) {
      newErrors.amount = 'თანხა უნდა იყოს დადებითი'
    }
    
    if (!formData.start_date) {
      newErrors.start_date = 'დაწყების თარიღი სავალდებულოა'
    } else {
      const startDate = new Date(formData.start_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (startDate < today) {
        newErrors.start_date = 'დაწყების თარიღი არ შეიძლება იყოს წარსულში'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      await createSubscription.mutateAsync(formData)
      router.push('/dashboard/subscriptions')
    } catch (error) {
      console.error('Failed to create subscription:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const calculateNextBilling = () => {
    if (!formData.start_date) return null
    
    const startDate = new Date(formData.start_date)
    const nextBilling = new Date(startDate)
    
    switch (formData.billing_cycle) {
      case 'weekly':
        nextBilling.setDate(nextBilling.getDate() + 7)
        break
      case 'monthly':
        nextBilling.setMonth(nextBilling.getMonth() + 1)
        break
      case 'quarterly':
        nextBilling.setMonth(nextBilling.getMonth() + 3)
        break
      case 'yearly':
        nextBilling.setFullYear(nextBilling.getFullYear() + 1)
        break
    }
    
    // Use consistent YYYY-MM-DD format to avoid hydration issues
    return nextBilling.toISOString().split('T')[0]
  }

  // Check if Flitt is configured
  const isFlittConfigured = flittConfig?.has_secret_key && flittConfig?.enabled

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/subscriptions">
            <ArrowLeft className="w-4 h-4 mr-2" />
            უკან
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ახალი საბსქრიბშენი</h1>
          <p className="text-muted-foreground">
            შექმენით ყოველთვიური საბსქრიბშენი კლიენტისთვის
          </p>
        </div>
      </div>

      {/* Flitt Configuration Warning */}
      {!isFlittConfigured && (
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            <strong>Flitt Payment არ არის კონფიგურირებული!</strong> 
            ავტომატური გადახდებისთვის საჭიროა <Link href="/dashboard/settings/company" className="underline">Flitt-ის კონფიგურაცია</Link>.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                საბსქრიბშენის დეტალები
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client Selection */}
                <div className="space-y-2">
                  <Label htmlFor="client_id">კლიენტი *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                  >
                    <SelectTrigger className={errors.client_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="აირჩიეთ კლიენტი" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center gap-2">
                            {client.type === 'company' ? (
                              <Badge variant="outline" className="text-xs">კომპანია</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">ფიზ.პირი</Badge>
                            )}
                            {client.name}
                            {client.email && (
                              <span className="text-xs text-muted-foreground">({client.email})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.client_id && (
                    <p className="text-sm text-red-600">{errors.client_id}</p>
                  )}
                </div>

                {/* Service Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="service_name">სერვისის სახელი *</Label>
                    <Input
                      id="service_name"
                      value={formData.service_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
                      placeholder="მაგ. ვებსაიტის მხარდაჭერა"
                      className={errors.service_name ? 'border-red-500' : ''}
                    />
                    {errors.service_name && (
                      <p className="text-sm text-red-600">{errors.service_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">თანხა (₾) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className={errors.amount ? 'border-red-500' : ''}
                    />
                    {errors.amount && (
                      <p className="text-sm text-red-600">{errors.amount}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">აღწერა</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="სერვისის დეტალური აღწერა..."
                    rows={3}
                  />
                </div>

                {/* Billing Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing_cycle">ბილინგის პერიოდი</Label>
                    <Select
                      value={formData.billing_cycle}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, billing_cycle: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">კვირეული</SelectItem>
                        <SelectItem value="monthly">ყოველთვიური</SelectItem>
                        <SelectItem value="quarterly">კვარტალური</SelectItem>
                        <SelectItem value="yearly">წლიური</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_date">დაწყების თარიღი *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className={errors.start_date ? 'border-red-500' : ''}
                    />
                    {errors.start_date && (
                      <p className="text-sm text-red-600">{errors.start_date}</p>
                    )}
                  </div>
                </div>

                {/* Auto Invoice Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto_invoice">ავტომატური ინვოისები</Label>
                    <p className="text-sm text-muted-foreground">
                      ინვოისები იქმნება ავტომატურად ყოველ ბილინგ პერიოდში
                    </p>
                  </div>
                  <Switch
                    id="auto_invoice"
                    checked={formData.auto_invoice}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_invoice: checked }))}
                  />
                </div>

                {/* Flitt Payment Toggle */}
                {isFlittConfigured && (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/50">
                    <div className="space-y-0.5">
                      <Label htmlFor="use_flitt">Flitt გადახდის ინტეგრაცია</Label>
                      <p className="text-sm text-muted-foreground">
                        ავტომატური რეკურენტული გადახდები Flitt-ის საშუალებით
                      </p>
                    </div>
                    <Switch
                      id="use_flitt"
                      checked={formData.use_flitt}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_flitt: checked }))}
                    />
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    გაუქმება
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'შენახვა...' : 'საბსქრიბშენის შექმნა'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-4">
          {/* Client Preview */}
          {selectedClient && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  არჩეული კლიენტი
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedClient.type === 'company' ? 'კომპანია' : 'ფიზ.პირი'}
                    </Badge>
                    <span className="font-medium">{selectedClient.name}</span>
                  </div>
                  {selectedClient.email && (
                    <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                  )}
                  {selectedClient.phone && (
                    <p className="text-sm text-muted-foreground">{selectedClient.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">საბსქრიბშენის პრევიუ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">სერვისი:</span>
                  <span className="text-sm font-medium">
                    {formData.service_name || 'არ არის მითითებული'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">თანხა:</span>
                  <span className="text-sm font-medium">
                    {formData.amount > 0 ? formatCurrency(formData.amount) : '0 ₾'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">პერიოდი:</span>
                  <span className="text-sm font-medium">
                    {formData.billing_cycle === 'weekly' ? 'კვირეული' :
                     formData.billing_cycle === 'monthly' ? 'ყოველთვიური' :
                     formData.billing_cycle === 'quarterly' ? 'კვარტალური' : 'წლიური'}
                  </span>
                </div>

                {formData.start_date && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">დაწყება:</span>
                      <span className="text-sm font-medium">
                        {formData.start_date}
                      </span>
                    </div>
                    
                    {calculateNextBilling() && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">შემდეგი ბილინგი:</span>
                        <span className="text-sm font-medium">
                          {calculateNextBilling()}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue Estimate */}
          {formData.amount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">ყოველთვიური შემოსავალი</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      formData.billing_cycle === 'weekly' ? formData.amount * 4.33 :
                      formData.billing_cycle === 'monthly' ? formData.amount :
                      formData.billing_cycle === 'quarterly' ? formData.amount / 3 :
                      formData.amount / 12
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    დაახლოებითი ყოველთვიური შემოსავალი
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}