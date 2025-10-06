'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Calendar, DollarSign, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { SubscriptionStatsResponse } from '@/types'

interface SubscriptionAnalyticsProps {
  stats?: SubscriptionStatsResponse
  loading?: boolean
}

export function SubscriptionAnalytics({ stats, loading }: SubscriptionAnalyticsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>საბსქრიბშენების ანალიტიკა</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          საბსქრიბშენების ანალიტიკა
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Monthly Recurring Revenue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">MRR</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.monthly_revenue)}
              </p>
              <div className="flex items-center gap-1 text-xs">
                {stats.mrr_growth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span className={stats.mrr_growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatPercentage(stats.mrr_growth)}
                </span>
                <span className="text-muted-foreground">ბოლო თვე</span>
              </div>
            </div>
          </div>

          {/* Annual Recurring Revenue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">ARR</p>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.annual_revenue)}
              </p>
              <p className="text-xs text-muted-foreground">
                პროგნოზირებული წლიური შემოსავალი
              </p>
            </div>
          </div>

          {/* Average Revenue Per User */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">ARPU</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.arpu)}
              </p>
              <p className="text-xs text-muted-foreground">
                საშუალო შემოსავალი კლიენტზე
              </p>
            </div>
          </div>

          {/* Churn Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Churn Rate</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-orange-600">
                {stats.churn_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                გაუქმების პროცენტი
              </p>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total_subscriptions}</p>
            <p className="text-sm text-muted-foreground">სულ საბსქრიბშენები</p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.unique_clients}</p>
            <p className="text-sm text-muted-foreground">აქტიური კლიენტები</p>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.monthly_revenue / (stats.unique_clients || 1))}
            </p>
            <p className="text-sm text-muted-foreground">შემოსავალი კლიენტზე</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium mb-4">სტატუსის განაწილება</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-lg font-semibold text-green-600">{stats.active_count}</p>
              <p className="text-xs text-green-600">აქტიური</p>
            </div>
            
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-lg font-semibold text-yellow-600">{stats.paused_count}</p>
              <p className="text-xs text-yellow-600">პაუზაზე</p>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold text-gray-600">{stats.cancelled_count}</p>
              <p className="text-xs text-gray-600">გაუქმებული</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}