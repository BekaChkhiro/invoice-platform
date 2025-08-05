'use client'

import { TrendingUp, TrendingDown, FileText, Users, Calculator, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

import type { InvoiceStats } from '@/lib/services/invoice'

// =====================================
// TYPES AND INTERFACES
// =====================================

interface AnalyticsCardsProps {
  stats?: InvoiceStats | null
  loading?: boolean
}

interface StatCard {
  title: string
  value: string
  change?: number
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: any
  description: string
  color: string
  href?: string
}

// =====================================
// MAIN COMPONENT
// =====================================

export function AnalyticsCards({ stats, loading }: AnalyticsCardsProps) {
  if (loading) {
    return <AnalyticsCardsSkeleton />
  }

  if (!stats) {
    return <AnalyticsCardsError />
  }

  // Calculate growth percentages
  const revenueGrowth = stats.lastMonthRevenue > 0 
    ? ((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100
    : stats.thisMonthRevenue > 0 ? 100 : 0

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ka-GE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (percentage: number): string => {
    return Math.abs(percentage).toFixed(1)
  }

  // Define stat cards
  const statCards: StatCard[] = [
    {
      title: 'მთლიანი შემოსავალი',
      value: `₾${formatCurrency(stats.thisMonthRevenue)}`,
      change: revenueGrowth,
      changeType: revenueGrowth > 0 ? 'increase' : revenueGrowth < 0 ? 'decrease' : 'neutral',
      icon: CreditCard,
      description: 'ამ თვეში',
      color: 'text-green-600',
      href: '/dashboard/analytics/revenue'
    },
    {
      title: 'ინვოისების რაოდენობა',
      value: stats.totalInvoices.toString(),
      change: undefined, // Could calculate month-over-month if we had previous month data
      changeType: 'neutral',
      icon: FileText,
      description: `${stats.paidCount} გადახდილი`,
      color: 'text-blue-600',
      href: '/dashboard/invoices'
    },
    {
      title: 'აქტიური კლიენტები',
      value: stats.topClients.length.toString(),
      change: undefined, // Could calculate growth if we had previous data
      changeType: 'neutral',
      icon: Users,
      description: 'TOP კლიენტები',
      color: 'text-purple-600',
      href: '/dashboard/clients'
    },
    {
      title: 'საშუალო ღირებულება',
      value: `₾${formatCurrency(stats.averageInvoiceValue)}`,
      change: undefined,
      changeType: 'neutral',
      icon: Calculator,
      description: 'ინვოისის საშუალო',
      color: 'text-orange-600',
      href: '/dashboard/analytics/averages'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  )
}

// =====================================
// INDIVIDUAL STAT CARD COMPONENT
// =====================================

interface StatCardProps extends StatCard {}

function StatCard({
  title,
  value,
  change,
  changeType,
  icon: IconComponent,
  description,
  color,
  href
}: StatCardProps) {
  const handleClick = () => {
    if (href) {
      // In a real app, you'd use Next.js router
      console.log('Navigate to:', href)
    }
  }

  const getChangeIcon = () => {
    if (changeType === 'increase') return TrendingUp
    if (changeType === 'decrease') return TrendingDown
    return null
  }

  const getChangeColor = () => {
    if (changeType === 'increase') return 'text-green-600'
    if (changeType === 'decrease') return 'text-red-600'
    return 'text-gray-500'
  }

  const ChangeIcon = getChangeIcon()

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${href ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className={`p-2 rounded-lg bg-gray-50 ${color}`}>
            <IconComponent className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          {/* Main Value */}
          <div className="text-2xl font-bold text-gray-900">
            {value}
          </div>
          
          {/* Description and Change */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {description}
            </p>
            
            {change !== undefined && ChangeIcon && (
              <div className={`flex items-center gap-1 ${getChangeColor()}`}>
                <ChangeIcon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {change.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          
          {/* Additional Info Badge */}
          {href && (
            <Badge variant="secondary" className="text-xs">
              დეტალურად
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================
// DETAILED STATS CARDS
// =====================================

interface DetailedStatsProps {
  stats: InvoiceStats
}

export function DetailedAnalyticsCards({ stats }: DetailedStatsProps) {
  const cards = [
    {
      title: 'გადახდილი',
      value: stats.paidCount,
      amount: stats.paidAmount,
      color: 'bg-green-50 text-green-700 border-green-200',
      icon: '✅'
    },
    {
      title: 'მოლოდინში',
      value: stats.sentCount,
      amount: stats.pendingAmount,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: '📤'
    },
    {
      title: 'ვადაგადაცილებული',
      value: stats.overdueCount,
      amount: stats.overdueAmount,
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: '⏰'
    },
    {
      title: 'მონახაზები',
      value: stats.draftCount,
      amount: 0,
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: '📝'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className={`border-2 ${card.color}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <div className="text-right">
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="text-xs opacity-75">{card.title}</div>
              </div>
            </div>
            {card.amount > 0 && (
              <div className="text-sm font-medium">
                ₾{card.amount.toLocaleString('ka-GE')}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// =====================================
// LOADING SKELETON
// =====================================

function AnalyticsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// =====================================
// ERROR STATE
// =====================================

function AnalyticsCardsError() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="border-red-200">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-sm text-red-600">
              მონაცემების ჩატვირთვა ვერ მოხერხდა
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// =====================================
// EXPORT TYPES
// =====================================

export type { StatCard, AnalyticsCardsProps }