'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Building, UserCheck, UserX, TrendingUp, DollarSign, Target, Star } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ClientStats } from '@/lib/hooks/use-clients'

interface ClientStatsCardsProps {
  stats?: ClientStats
  isLoading: boolean
}

export function ClientStatsCards({ stats, isLoading }: ClientStatsCardsProps) {
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ka-GE').format(num)
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
      title: 'სულ კლიენტები',
      value: formatNumber(stats.total_clients),
      subtitle: `${formatNumber(stats.active_clients)} აქტიური • ${formatNumber(stats.inactive_clients)} არააქტიური`,
      icon: Users,
      trend: stats.growth_percentage > 0 
        ? `+${formatPercent(stats.growth_percentage)} ზრდა`
        : stats.growth_percentage < 0 
        ? `${formatPercent(stats.growth_percentage)} კლება`
        : 'უცვლელი',
      color: 'blue'
    },
    {
      title: 'ახალი კლიენტები',
      value: formatNumber(stats.new_this_month),
      subtitle: 'ამ თვეში დარეგისტრირებული',
      icon: TrendingUp,
      trend: stats.growth_percentage > 0 ? 'მზარდი ტენდენცია' : 'სტაბილური',
      color: stats.new_this_month > 0 ? 'green' : 'gray'
    },
    {
      title: 'კლიენტების ტიპები',
      value: `${Math.round((stats.companies / stats.total_clients) * 100)}%`,
      subtitle: `${formatNumber(stats.companies)} კომპანია • ${formatNumber(stats.individuals)} ფიზ. პირი`,
      icon: Building,
      trend: stats.companies > stats.individuals ? 'კომპანიები ლიდერობენ' : 'ფიზ. პირები ლიდერობენ',
      color: 'purple'
    },
    {
      title: 'საშუალო შემოსავალი',
      value: formatCurrency(stats.revenue_stats.average_per_client),
      subtitle: `სულ: ${formatCurrency(stats.revenue_stats.total_revenue)}`,
      icon: DollarSign,
      trend: `ტოპ კლიენტები: ${formatCurrency(stats.revenue_stats.top_clients_revenue)}`,
      color: 'green'
    }
  ]

  const paymentBehaviorCards = [
    {
      title: 'შესანიშნავი გადამხდელები',
      value: formatNumber(stats.payment_behavior_distribution.excellent),
      percentage: Math.round((stats.payment_behavior_distribution.excellent / stats.total_clients) * 100),
      icon: Star,
      color: 'green'
    },
    {
      title: 'კარგი გადამხდელები',
      value: formatNumber(stats.payment_behavior_distribution.good),
      percentage: Math.round((stats.payment_behavior_distribution.good / stats.total_clients) * 100),
      icon: UserCheck,
      color: 'blue'
    },
    {
      title: 'საშუალო გადამხდელები',
      value: formatNumber(stats.payment_behavior_distribution.average),
      percentage: Math.round((stats.payment_behavior_distribution.average / stats.total_clients) * 100),
      icon: Target,
      color: 'yellow'
    },
    {
      title: 'ცუდი გადამხდელები',
      value: formatNumber(stats.payment_behavior_distribution.poor),
      percentage: Math.round((stats.payment_behavior_distribution.poor / stats.total_clients) * 100),
      icon: UserX,
      color: 'red'
    }
  ]

  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600'
      case 'green': return 'text-green-600'
      case 'red': return 'text-red-600'
      case 'yellow': return 'text-yellow-600'
      case 'purple': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600'
      case 'red': return 'text-red-600'
      case 'yellow': return 'text-yellow-600'
      case 'purple': return 'text-purple-600'
      default: return 'text-muted-foreground'
    }
  }

  const getBorderColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500'
      case 'green': return 'bg-green-500'
      case 'red': return 'bg-red-500'
      case 'yellow': return 'bg-yellow-500'
      case 'purple': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
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
            <div className={`absolute top-0 left-0 w-full h-1 ${getBorderColor(card.color)}`} />
          </Card>
        ))}
      </div>

      {/* Payment Behavior Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            გადახდის ქცევის ანალიზი
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {paymentBehaviorCards.map((card, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <card.icon className={`h-4 w-4 ${getIconColor(card.color)}`} />
                    <span className="text-sm font-medium">{card.title}</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`
                      ${card.color === 'green' ? 'bg-green-100 text-green-800' : ''}
                      ${card.color === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
                      ${card.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${card.color === 'red' ? 'bg-red-100 text-red-800' : ''}
                    `}
                  >
                    {card.percentage}%
                  </Badge>
                </div>
                
                <div className="text-2xl font-bold">{card.value}</div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getBorderColor(card.color)}`}
                    style={{ width: `${card.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Individual stat card component for reuse
export function ClientStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  badge
}: {
  title: string
  value: string
  subtitle?: string
  icon: any
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  trend?: string
  badge?: string
}) {
  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600'
      case 'green': return 'text-green-600'
      case 'red': return 'text-red-600'
      case 'yellow': return 'text-yellow-600'
      case 'purple': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const getBorderColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500'
      case 'green': return 'bg-green-500'
      case 'red': return 'bg-red-500'
      case 'yellow': return 'bg-yellow-500'
      case 'purple': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
          <Icon className={`h-4 w-4 ${getIconColor(color)}`} />
        </div>
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
      <div className={`absolute top-0 left-0 w-full h-1 ${getBorderColor(color)}`} />
    </Card>
  )
}