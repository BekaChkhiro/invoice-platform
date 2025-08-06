'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, TrendingUp, AlertTriangle, DollarSign, Clock, CheckCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface InvoiceStatsCardsProps {
  stats?: {
    total_invoices: number
    total_amount: number
    paid_amount: number
    overdue_amount: number
    overdue_count: number
    average_invoice_value: number
    monthly_stats: {
      current_month_total: number
      current_month_count: number
      previous_month_total: number
      growth_percentage: number
    }
  }
  isLoading: boolean
}

export function InvoiceStatsCards({ stats, isLoading }: InvoiceStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return new Intl.NumberFormat('ka-GE', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(percent / 100)
  }

  const cards = [
    {
      title: 'სულ ინვოისები',
      value: stats.total_invoices.toString(),
      subtitle: `საშუალო: ${formatCurrency(stats.average_invoice_value)}`,
      icon: FileText,
      trend: stats.monthly_stats.current_month_count > 0 
        ? `+${stats.monthly_stats.current_month_count} ამ თვეში`
        : 'ამ თვეში ინვოისები არ არის',
      color: 'blue'
    },
    {
      title: 'ამ თვის შემოსავალი',
      value: formatCurrency(stats.monthly_stats.current_month_total),
      subtitle: stats.monthly_stats.growth_percentage !== 0 
        ? `${stats.monthly_stats.growth_percentage > 0 ? '+' : ''}${formatPercent(stats.monthly_stats.growth_percentage)} წინა თვესთან`
        : 'წინა თვე: ' + formatCurrency(stats.monthly_stats.previous_month_total),
      icon: TrendingUp,
      trend: stats.monthly_stats.growth_percentage > 0 
        ? 'ზრდა' 
        : stats.monthly_stats.growth_percentage < 0 
        ? 'კლება' 
        : 'უცვლელი',
      color: stats.monthly_stats.growth_percentage >= 0 ? 'green' : 'red'
    },
    {
      title: 'გადახდილი თანხა',
      value: formatCurrency(stats.paid_amount),
      subtitle: `${formatPercent((stats.paid_amount / stats.total_amount) * 100)} მთლიანიდან`,
      icon: CheckCircle,
      trend: `${formatCurrency(stats.total_amount - stats.paid_amount)} დარჩენილია`,
      color: 'green'
    },
    {
      title: 'ვადაგადაცილებული',
      value: stats.overdue_count > 0 ? formatCurrency(stats.overdue_amount) : '0 ₾',
      subtitle: stats.overdue_count > 0 
        ? `${stats.overdue_count} ინვოისი ვადაგადაცილებული`
        : 'ვადაგადაცილებული ინვოისები არ არის',
      icon: AlertTriangle,
      trend: stats.overdue_count > 0 ? 'საჭიროა ყურადღება' : 'ყველაფერი რიგზეა',
      color: stats.overdue_count > 0 ? 'red' : 'gray'
    }
  ]

  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600'
      case 'green': return 'text-green-600'
      case 'red': return 'text-red-600'
      case 'yellow': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600'
      case 'red': return 'text-red-600'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${getIconColor(card.color)}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {card.subtitle}
              </p>
              <p className={`text-xs ${getTrendColor(card.color)}`}>
                {card.trend}
              </p>
            </div>
          </CardContent>
          
          {/* Accent border */}
          <div className={`absolute top-0 left-0 w-full h-1 ${
            card.color === 'blue' ? 'bg-blue-500' :
            card.color === 'green' ? 'bg-green-500' :
            card.color === 'red' ? 'bg-red-500' :
            card.color === 'yellow' ? 'bg-yellow-500' :
            'bg-gray-500'
          }`} />
        </Card>
      ))}
    </div>
  )
}

// Individual stat card component for reuse
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend
}: {
  title: string
  value: string
  subtitle?: string
  icon: any
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray'
  trend?: string
}) {
  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600'
      case 'green': return 'text-green-600'
      case 'red': return 'text-red-600'
      case 'yellow': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${getIconColor(color)}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend}
          </p>
        )}
      </CardContent>
      
      {/* Accent border */}
      <div className={`absolute top-0 left-0 w-full h-1 ${
        color === 'blue' ? 'bg-blue-500' :
        color === 'green' ? 'bg-green-500' :
        color === 'red' ? 'bg-red-500' :
        color === 'yellow' ? 'bg-yellow-500' :
        'bg-gray-500'
      }`} />
    </Card>
  )
}