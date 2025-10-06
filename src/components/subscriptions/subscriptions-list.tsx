'use client'

import { useState } from 'react'
import { MoreHorizontal, Eye, Edit, Play, Pause, XCircle, Calendar, User, Building, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

import { ClientSubscription } from '@/types'
import { useClientSubscriptions } from '@/hooks/use-client-subscriptions'

interface SubscriptionsListProps {
  subscriptions: ClientSubscription[]
  isLoading: boolean
}

export function SubscriptionsList({ subscriptions, isLoading }: SubscriptionsListProps) {
  const { updateSubscription, cancelSubscription } = useClientSubscriptions()
  const [actionSubscription, setActionSubscription] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'pause' | 'resume' | 'cancel' | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status: ClientSubscription['status']) => {
    const configs = {
      active: { label: 'აქტიური', className: 'bg-green-100 text-green-800' },
      paused: { label: 'პაუზა', className: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'გაუქმებული', className: 'bg-gray-100 text-gray-600' }
    }

    const config = configs[status]
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getBillingCycleBadge = (cycle: ClientSubscription['billing_cycle']) => {
    const labels = {
      weekly: 'კვირეული',
      monthly: 'ყოველთვიური',
      quarterly: 'კვარტალური',
      yearly: 'წლიური'
    }

    return (
      <Badge variant="outline" className="text-xs">
        {labels[cycle]}
      </Badge>
    )
  }

  const calculateMonthlyRevenue = (subscription: ClientSubscription) => {
    if (subscription.status !== 'active') return 0
    
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

  const handleAction = async (subscriptionId: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      if (action === 'cancel') {
        await cancelSubscription.mutateAsync(subscriptionId)
      } else {
        const newStatus = action === 'pause' ? 'paused' : 'active'
        await updateSubscription.mutateAsync({
          id: subscriptionId,
          data: { status: newStatus }
        })
      }
    } catch (error) {
      console.error(`Failed to ${action} subscription:`, error)
    } finally {
      setActionSubscription(null)
      setActionType(null)
    }
  }

  const confirmAction = (subscriptionId: string, action: 'pause' | 'resume' | 'cancel') => {
    setActionSubscription(subscriptionId)
    setActionType(action)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">საბსქრიბშენები ვერ მოიძებნა</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            ჯერ არ გაქვთ შექმნილი საბსქრიბშენები. დაიწყეთ პირველი საბსქრიბშენის შექმნით.
          </p>
          <Button asChild>
            <Link href="/dashboard/subscriptions/new">
              <Calendar className="w-4 h-4 mr-2" />
              ახალი საბსქრიბშენი
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>კლიენტი</TableHead>
                <TableHead>სერვისი</TableHead>
                <TableHead>თანხა</TableHead>
                <TableHead>პერიოდი</TableHead>
                <TableHead>სტატუსი</TableHead>
                <TableHead>შემდეგი ბილინგი</TableHead>
                <TableHead>ყოველთვიური შემოსავალი</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow 
                  key={subscription.id}
                  className={subscription.status !== 'active' ? 'opacity-60' : ''}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {subscription.client_type === 'company' ? (
                          <Building className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        <span className="font-medium">{subscription.client_name}</span>
                      </div>
                      {subscription.client_email && (
                        <div className="text-xs text-muted-foreground">
                          {subscription.client_email}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{subscription.service_name}</div>
                      {subscription.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {subscription.description}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(subscription.amount)}
                    </div>
                  </TableCell>

                  <TableCell>
                    {getBillingCycleBadge(subscription.billing_cycle)}
                  </TableCell>

                  <TableCell>
                    {getStatusBadge(subscription.status)}
                  </TableCell>

                  <TableCell>
                    {subscription.next_billing_date ? (
                      <div className="text-sm">
                        {format(new Date(subscription.next_billing_date), 'dd MMM yyyy', { locale: ka })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {subscription.status === 'active' ? (
                      <div className="font-medium text-green-600">
                        {formatCurrency(calculateMonthlyRevenue(subscription))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link 
                            href={`/dashboard/subscriptions/${subscription.id}`}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            დეტალები
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem asChild>
                          <Link 
                            href={`/dashboard/subscriptions/${subscription.id}/edit`}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            რედაქტირება
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {subscription.status === 'active' && (
                          <DropdownMenuItem
                            onClick={() => confirmAction(subscription.id, 'pause')}
                            disabled={updateSubscription.isPending}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            პაუზა
                          </DropdownMenuItem>
                        )}

                        {subscription.status === 'paused' && (
                          <DropdownMenuItem
                            onClick={() => confirmAction(subscription.id, 'resume')}
                            disabled={updateSubscription.isPending}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            განახლება
                          </DropdownMenuItem>
                        )}

                        {subscription.status !== 'cancelled' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => confirmAction(subscription.id, 'cancel')}
                              className="text-red-600 focus:text-red-600"
                              disabled={cancelSubscription.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              გაუქმება
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionSubscription !== null} onOpenChange={() => {
        setActionSubscription(null)
        setActionType(null)
      }}>
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
              onClick={() => actionSubscription && actionType && handleAction(actionSubscription, actionType)}
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