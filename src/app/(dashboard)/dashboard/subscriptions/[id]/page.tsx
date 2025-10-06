'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Play, Pause, XCircle, Calendar, User, Building, CreditCard, FileText, Mail, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

import { useSubscription, useClientSubscriptions } from '@/hooks/use-client-subscriptions'

export default function SubscriptionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const subscriptionId = params.id as string
  
  const { subscription, isLoading } = useSubscription(subscriptionId)
  const { updateSubscription, cancelSubscription } = useClientSubscriptions()
  
  const [actionType, setActionType] = useState<'pause' | 'resume' | 'cancel' | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      active: { label: 'აქტიური', className: 'bg-green-100 text-green-800', description: 'საბსქრიბშენი აქტიურია და ავტომატური გადახდები მუშაობს' },
      paused: { label: 'პაუზა', className: 'bg-yellow-100 text-yellow-800', description: 'საბსქრიბშენი დროებით შეჩერებულია' },
      cancelled: { label: 'გაუქმებული', className: 'bg-gray-100 text-gray-600', description: 'საბსქრიბშენი გაუქმებულია და აღარ არის აქტიური' }
    }
    return configs[status as keyof typeof configs] || configs.active
  }

  const getBillingCycleText = (cycle: string) => {
    const cycles = {
      weekly: 'კვირეული',
      monthly: 'ყოველთვიური',
      quarterly: 'კვარტალური',
      yearly: 'წლიური'
    }
    return cycles[cycle as keyof typeof cycles] || cycle
  }

  const calculateMonthlyRevenue = () => {
    if (!subscription || subscription.status !== 'active') return 0
    
    switch (subscription.billing_cycle) {
      case 'weekly':
        return subscription.amount * 4.33
      case 'monthly':
        return subscription.amount
      case 'quarterly':
        return subscription.amount / 3
      case 'yearly':
        return subscription.amount / 12
      default:
        return subscription.amount
    }
  }

  const handleAction = async (action: 'pause' | 'resume' | 'cancel') => {
    if (!subscription) return
    
    try {
      if (action === 'cancel') {
        await cancelSubscription.mutateAsync(subscription.id)
        router.push('/dashboard/subscriptions')
      } else {
        const newStatus = action === 'pause' ? 'paused' : 'active'
        await updateSubscription.mutateAsync({
          id: subscription.id,
          data: { status: newStatus }
        })
      }
    } catch (error) {
      console.error(`Failed to ${action} subscription:`, error)
    } finally {
      setActionType(null)
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
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

  const statusConfig = getStatusConfig(subscription.status)

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/subscriptions">
                <ArrowLeft className="w-4 h-4 mr-2" />
                უკან
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {subscription.service_name}
              </h1>
              <p className="text-muted-foreground">
                საბსქრიბშენის დეტალური ინფორმაცია
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/subscriptions/${subscription.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                რედაქტირება
              </Link>
            </Button>
            
            {subscription.status === 'active' && (
              <Button
                variant="outline"
                onClick={() => setActionType('pause')}
                disabled={updateSubscription.isPending}
              >
                <Pause className="w-4 h-4 mr-2" />
                პაუზა
              </Button>
            )}
            
            {subscription.status === 'paused' && (
              <Button
                variant="outline"
                onClick={() => setActionType('resume')}
                disabled={updateSubscription.isPending}
              >
                <Play className="w-4 h-4 mr-2" />
                განახლება
              </Button>
            )}
            
            {subscription.status !== 'cancelled' && (
              <Button
                variant="destructive"
                onClick={() => setActionType('cancel')}
                disabled={cancelSubscription.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" />
                გაუქმება
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  საბსქრიბშენის ინფორმაცია
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">სტატუსი</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={statusConfig.className}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {statusConfig.description}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">ბილინგის პერიოდი</p>
                    <p className="font-medium mt-1">
                      {getBillingCycleText(subscription.billing_cycle)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">თანხა</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(subscription.amount)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">ყოველთვიური შემოსავალი</p>
                    <p className="text-xl font-bold text-green-600 mt-1">
                      {formatCurrency(calculateMonthlyRevenue())}
                    </p>
                  </div>
                </div>

                {subscription.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">აღწერა</p>
                      <p className="mt-1">{subscription.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {subscription.client_type === 'company' ? (
                    <Building className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  კლიენტის ინფორმაცია
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {subscription.client_type === 'company' ? 'კომპანია' : 'ფიზიკური პირი'}
                    </Badge>
                    <span className="font-medium">{subscription.client_name}</span>
                  </div>
                </div>

                {subscription.client_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{subscription.client_email}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/clients/${subscription.client_id}`}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      კლიენტის პროფილი
                    </Link>
                  </Button>
                  
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/invoices/new?client=${subscription.client_id}`}>
                      <FileText className="w-4 h-4 mr-2" />
                      ინვოისის შექმნა
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  ბილინგის ისტორია
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  ბილინგის ისტორია იყენება Phase 4-ში
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Key Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">მნიშვნელოვანი თარიღები</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">შექმნის თარიღი</p>
                  <p className="text-sm font-medium">
                    {format(new Date(subscription.created_at), 'dd MMM yyyy', { locale: ka })}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground">დაწყების თარიღი</p>
                  <p className="text-sm font-medium">
                    {format(new Date(subscription.start_date), 'dd MMM yyyy', { locale: ka })}
                  </p>
                </div>

                {subscription.next_billing_date && (
                  <div>
                    <p className="text-xs text-muted-foreground">შემდეგი ბილინგი</p>
                    <p className="text-sm font-medium">
                      {format(new Date(subscription.next_billing_date), 'dd MMM yyyy', { locale: ka })}
                    </p>
                  </div>
                )}

                {subscription.cancelled_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">გაუქმების თარიღი</p>
                    <p className="text-sm font-medium">
                      {format(new Date(subscription.cancelled_at), 'dd MMM yyyy', { locale: ka })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">შემოსავლის მიმოხილვა</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculateMonthlyRevenue())}
                  </div>
                  <p className="text-xs text-muted-foreground">ყოველთვიური შემოსავალი</p>
                </div>
                
                <Separator />
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {formatCurrency(calculateMonthlyRevenue() * 12)}
                  </div>
                  <p className="text-xs text-muted-foreground">წლიური პროგნოზი</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">სწრაფი მოქმედებები</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href={`/subscription/${subscription.public_token}`} target="_blank">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Public Link
                  </Link>
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href={`/dashboard/clients/${subscription.client_id}`}>
                    <User className="w-4 h-4 mr-2" />
                    კლიენტის პროფილი
                  </Link>
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href={`/dashboard/invoices?client=${subscription.client_id}`}>
                    <FileText className="w-4 h-4 mr-2" />
                    კლიენტის ინვოისები
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionType !== null} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>დარწმუნებული ხართ?</AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'cancel' && 
                'საბსქრიბშენის გაუქმება შეუქცევადია. ყველა მომავალი ავტომატური გადახდა შეწყდება.'
              }
              {actionType === 'pause' && 
                'საბსქრიბშენი დროებით შეწყდება. შემდგომში შეგიძლიათ მისი განახლება.'
              }
              {actionType === 'resume' && 
                'საბსქრიბშენი ისევ გაქროვდება და გაგრძელდება ავტომატური გადახდები.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionType && handleAction(actionType)}
              className={actionType === 'cancel' ? 'bg-red-600 hover:bg-red-700' : ''}
              disabled={updateSubscription.isPending || cancelSubscription.isPending}
            >
              {updateSubscription.isPending || cancelSubscription.isPending ? 'მოლოდინა...' : 
               actionType === 'cancel' ? 'გაუქმება' :
               actionType === 'pause' ? 'პაუზა' : 'განახლება'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}