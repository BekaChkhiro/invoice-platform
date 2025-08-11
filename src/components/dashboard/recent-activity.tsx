'use client'

import { useMemo } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { ka } from 'date-fns/locale'
import { 
  FileText, 
  Send, 
  CreditCard, 
  UserPlus, 
  Clock, 
  Eye,
  ExternalLink,
  Calendar
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'

import { useInvoices } from '@/lib/hooks/use-invoices'
import { useClients } from '@/lib/hooks/use-clients'

// =====================================
// TYPES AND INTERFACES
// =====================================

interface RecentActivityProps {
  companyId: string
}

interface ActivityItem {
  id: string
  type: 'invoice_created' | 'invoice_sent' | 'payment_received' | 'client_added' | 'invoice_overdue'
  title: string
  description: string
  timestamp: Date
  relatedId?: string
  amount?: number
  currency?: string
  clientName?: string
  status?: string
}

// =====================================
// MAIN COMPONENT
// =====================================

export function RecentActivity({ companyId }: RecentActivityProps) {
  // Fetch recent invoices
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({
    limit: 10,
    offset: 0,
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  // Fetch recent clients
  const { data: clientsData, isLoading: clientsLoading } = useClients({
    limit: 5,
    offset: 0,
    sort_by: 'created_at', 
    sort_order: 'desc'
  })

  // Generate activity items from data
  const activityItems = useMemo(() => {
    const activities: ActivityItem[] = []

    // Add invoice activities
    if (invoicesData?.invoices) {
      invoicesData.invoices.forEach(invoice => {
        // Invoice created activity
        activities.push({
          id: `invoice-created-${invoice.id}`,
          type: 'invoice_created',
          title: `ინვოისი ${invoice.invoice_number} შეიქმნა`,
          description: `${invoice.client.name}-ისთვის`,
          timestamp: new Date(invoice.created_at),
          relatedId: invoice.id,
          amount: invoice.total,
          currency: invoice.currency,
          clientName: invoice.client.name,
          status: invoice.status
        })

        // Invoice sent activity
        if (invoice.sent_at) {
          activities.push({
            id: `invoice-sent-${invoice.id}`,
            type: 'invoice_sent',
            title: `ინვოისი ${invoice.invoice_number} გაგზავნილია`,
            description: `${invoice.client.name}-ისთვის`,
            timestamp: new Date(invoice.sent_at),
            relatedId: invoice.id,
            amount: invoice.total,
            currency: invoice.currency,
            clientName: invoice.client.name
          })
        }

        // Payment received activity
        if (invoice.paid_at) {
          activities.push({
            id: `payment-received-${invoice.id}`,
            type: 'payment_received',
            title: `გადახდა მიღებულია`,
            description: `ინვოისი ${invoice.invoice_number} - ${invoice.client.name}`,
            timestamp: new Date(invoice.paid_at),
            relatedId: invoice.id,
            amount: invoice.total,
            currency: invoice.currency,
            clientName: invoice.client.name
          })
        }

        // Overdue activity
        if (invoice.status === 'overdue') {
          activities.push({
            id: `invoice-overdue-${invoice.id}`,
            type: 'invoice_overdue',
            title: `ინვოისი ${invoice.invoice_number} ვადაგადაცილებულია`,
            description: `${invoice.client.name} - ${format(new Date(invoice.due_date), 'dd/MM/yyyy')}`,
            timestamp: new Date(invoice.due_date),
            relatedId: invoice.id,
            amount: invoice.total,
            currency: invoice.currency,
            clientName: invoice.client.name
          })
        }
      })
    }

    // Add client activities
    if (clientsData?.clients) {
      clientsData.clients.forEach(client => {
        activities.push({
          id: `client-added-${client.id}`,
          type: 'client_added',
          title: `ახალი კლიენტი დაემატა`,
          description: client.name,
          timestamp: new Date(client.created_at),
          relatedId: client.id,
          clientName: client.name
        })
      })
    }

    // Sort by timestamp (newest first)
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15)
  }, [invoicesData, clientsData])

  // Group activities by time periods
  const groupedActivities = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const groups = {
      today: [] as ActivityItem[],
      yesterday: [] as ActivityItem[],
      thisWeek: [] as ActivityItem[],
      older: [] as ActivityItem[]
    }

    activityItems.forEach(item => {
      if (item.timestamp >= today) {
        groups.today.push(item)
      } else if (item.timestamp >= yesterday) {
        groups.yesterday.push(item)
      } else if (item.timestamp >= thisWeek) {
        groups.thisWeek.push(item)
      } else {
        groups.older.push(item)
      }
    })

    return groups
  }, [activityItems])

  const isLoading = invoicesLoading || clientsLoading

  if (isLoading) {
    return <RecentActivitySkeleton />
  }

  if (activityItems.length === 0) {
    return <EmptyActivityState />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">ბოლო აქტივობა</CardTitle>
            <CardDescription>
              ბოლო ცვლილებები და მოვლენები
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            ყველა
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[660px]">
          <div className="p-6 pt-0 space-y-6">
            
            {/* Today */}
            {groupedActivities.today.length > 0 && (
              <ActivityGroup 
                title="დღეს" 
                activities={groupedActivities.today} 
              />
            )}

            {/* Yesterday */}
            {groupedActivities.yesterday.length > 0 && (
              <ActivityGroup 
                title="გუშინ" 
                activities={groupedActivities.yesterday} 
              />
            )}

            {/* This Week */}
            {groupedActivities.thisWeek.length > 0 && (
              <ActivityGroup 
                title="ამ კვირას" 
                activities={groupedActivities.thisWeek} 
              />
            )}

            {/* Older */}
            {groupedActivities.older.length > 0 && (
              <ActivityGroup 
                title="ძველი" 
                activities={groupedActivities.older} 
              />
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// =====================================
// ACTIVITY GROUP COMPONENT
// =====================================

interface ActivityGroupProps {
  title: string
  activities: ActivityItem[]
}

function ActivityGroup({ title, activities }: ActivityGroupProps) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        {title}
      </h4>
      <div className="space-y-3">
        {activities.map(activity => (
          <ActivityItemComponent key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  )
}

// =====================================
// ACTIVITY ITEM COMPONENT
// =====================================

interface ActivityItemProps {
  activity: ActivityItem
}

function ActivityItemComponent({ activity }: ActivityItemProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    const iconClass = "h-4 w-4"
    
    switch (type) {
      case 'invoice_created':
        return <FileText className={`${iconClass} text-blue-500`} />
      case 'invoice_sent':
        return <Send className={`${iconClass} text-green-500`} />
      case 'payment_received':
        return <CreditCard className={`${iconClass} text-green-600`} />
      case 'client_added':
        return <UserPlus className={`${iconClass} text-purple-500`} />
      case 'invoice_overdue':
        return <Clock className={`${iconClass} text-red-500`} />
      default:
        return <FileText className={`${iconClass} text-gray-500`} />
    }
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'invoice_created':
        return 'bg-blue-50 border-blue-200'
      case 'invoice_sent':
        return 'bg-green-50 border-green-200'
      case 'payment_received':
        return 'bg-green-50 border-green-200'
      case 'client_added':
        return 'bg-purple-50 border-purple-200'
      case 'invoice_overdue':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const handleViewItem = () => {
    if (activity.relatedId) {
      if (activity.type === 'client_added') {
        console.log('Navigate to client:', activity.relatedId)
      } else {
        console.log('Navigate to invoice:', activity.relatedId)
      }
    }
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${getActivityColor(activity.type)} hover:shadow-sm transition-all`}>
      
      {/* Icon */}
      <div className="mt-0.5 flex-shrink-0">
        {getActivityIcon(activity.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {activity.title}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {activity.description}
            </p>
            
            {/* Amount if available */}
            {activity.amount && activity.currency && (
              <div className="mt-1">
                <Badge variant="secondary" className="text-xs">
                  {activity.amount.toFixed(2)} {activity.currency}
                </Badge>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: ka })}
            </span>
            
            {activity.relatedId && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={handleViewItem}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// =====================================
// LOADING SKELETON
// =====================================

function RecentActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-[660px] p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================
// EMPTY STATE
// =====================================

function EmptyActivityState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ბოლო აქტივობა</CardTitle>
        <CardDescription>
          ბოლო ცვლილებები და მოვლენები
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          აქტივობა არ მოიძებნა
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          შექმენით ინვოისი ან დაამატეთ კლიენტი აქტივობის სანახავად
        </p>
        <div className="space-x-2">
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            ახალი ინვოისი
          </Button>
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            ახალი კლიენტი
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}