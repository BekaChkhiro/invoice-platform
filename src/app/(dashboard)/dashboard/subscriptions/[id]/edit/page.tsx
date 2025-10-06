'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'

import { useSubscription, useClientSubscriptions } from '@/hooks/use-client-subscriptions'
import { UpdateSubscriptionRequest } from '@/types'

export default function EditSubscriptionPage() {
  const params = useParams()
  const router = useRouter()
  const subscriptionId = params.id as string
  
  const { subscription, isLoading } = useSubscription(subscriptionId)
  const { updateSubscription } = useClientSubscriptions()
  
  const [formData, setFormData] = useState<UpdateSubscriptionRequest>({
    service_name: '',
    description: '',
    amount: 0,
    billing_cycle: 'monthly',
    auto_invoice: true,
    status: 'active'
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (subscription) {
      setFormData({
        service_name: subscription.service_name,
        description: subscription.description || '',
        amount: subscription.amount,
        billing_cycle: subscription.billing_cycle,
        auto_invoice: subscription.auto_invoice,
        status: subscription.status
      })
    }
  }, [subscription])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.service_name.trim()) {
      newErrors.service_name = 'სერვისის სახელი სავალდებულოა'
    }
    
    if (formData.amount <= 0) {
      newErrors.amount = 'თანხა უნდა იყოს დადებითი'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !subscription) return
    
    setIsSubmitting(true)
    try {
      await updateSubscription.mutateAsync({
        id: subscription.id,
        data: formData
      })
      router.push(`/dashboard/subscriptions/${subscription.id}`)
    } catch (error) {
      console.error('Failed to update subscription:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/subscriptions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              უკან
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">საბსქრიბშენი ვერ მოიძებნა</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/subscriptions/${subscription.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            უკან
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            საბსქრიბშენის რედაქტირება
          </h1>
          <p className="text-muted-foreground">
            {subscription.client_name} - {subscription.service_name}
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>საბსქრიბშენის დეტალები</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Name */}
              <div className="space-y-2">
                <Label htmlFor="service_name">სერვისის სახელი *</Label>
                <Input
                  id="service_name"
                  value={formData.service_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
                  className={errors.service_name ? 'border-red-500' : ''}
                />
                {errors.service_name && (
                  <p className="text-sm text-red-600">{errors.service_name}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">აღწერა</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Amount and Billing Cycle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">თანხა (₾) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className={errors.amount ? 'border-red-500' : ''}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-600">{errors.amount}</p>
                  )}
                </div>

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
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">სტატუსი</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">აქტიური</SelectItem>
                    <SelectItem value="paused">პაუზა</SelectItem>
                    <SelectItem value="cancelled">გაუქმებული</SelectItem>
                  </SelectContent>
                </Select>
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

              {/* Submit Buttons */}
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
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'შენახვა...' : 'ცვლილებების შენახვა'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}