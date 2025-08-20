'use client'

import { useMemo, useState } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts'
import { format, subMonths, startOfMonth } from 'date-fns'
import { ka } from 'date-fns/locale'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown } from 'lucide-react'

import type { InvoiceStats } from '@/lib/services/invoice'
import { useRevenueTrends } from '@/lib/hooks/use-invoices'

// =====================================
// TYPES AND INTERFACES
// =====================================

interface ChartsProps {
  stats?: InvoiceStats | null
  loading?: boolean
}

// =====================================
// MAIN COMPONENT
// =====================================

export function Charts({ stats, loading }: ChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<1 | 3 | 6 | 12>(12)

  if (loading) {
    return <ChartsSkeleton />
  }

  if (!stats) {
    return <ChartsError />
  }

  const periodOptions = [
    { value: 1 as const, label: '1 თვე' },
    { value: 3 as const, label: '3 თვე' },
    { value: 6 as const, label: '6 თვე' },
    { value: 12 as const, label: '12 თვე' }
  ]

  return (
    <div className="space-y-6">
      
      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>შემოსავლების ტენდენცია</CardTitle>
              <CardDescription>
                თვიური შემოსავალი და ზრდის ტენდენცია
              </CardDescription>
            </div>
            <div className="flex gap-1 mt-3 sm:mt-0">
              {periodOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedPeriod === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(option.value)}
                  className="text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RevenueChart period={selectedPeriod} />
        </CardContent>
      </Card>

      {/* Bottom Row - Two Charts Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Invoice Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>ინვოისების სტატუსი</CardTitle>
            <CardDescription>
              ინვოისების განაწილება სტატუსების მიხედვით
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDistributionChart stats={stats} />
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle>TOP კლიენტები</CardTitle>
            <CardDescription>
              შემოსავლის მიხედვით
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopClientsChart stats={stats} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// =====================================
// REVENUE TREND CHART
// =====================================

function RevenueChart({ period }: { period: 1 | 3 | 6 | 12 }) {
  const { data: trendsData, isLoading, error } = useRevenueTrends(period)

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string; dataKey: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      const monthData = trendsData?.monthlyData.find((d: any) => d.month === label)
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{monthData?.fullMonth || label}</p>
          <div className="space-y-1">
            <p className="text-sm flex items-center justify-between">
              <span>სულ შემოსავალი:</span>
              <span className="font-semibold text-blue-600">₾{monthData?.totalRevenue?.toLocaleString('ka-GE') || '0'}</span>
            </p>
            <p className="text-sm flex items-center justify-between">
              <span>გადახდილი:</span>
              <span className="font-semibold text-green-600">₾{monthData?.paidRevenue?.toLocaleString('ka-GE') || '0'}</span>
            </p>
            <p className="text-sm flex items-center justify-between">
              <span>მოლოდინში:</span>
              <span className="font-semibold text-orange-600">₾{monthData?.pendingRevenue?.toLocaleString('ka-GE') || '0'}</span>
            </p>
            <p className="text-sm flex items-center justify-between">
              <span>ინვოისები:</span>
              <span className="font-semibold text-gray-600">{monthData?.invoiceCount || 0}</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">ტენდენციის ჩატვირთვა...</p>
        </div>
      </div>
    )
  }

  if (error || !trendsData) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-sm">შემოსავლების ტენდენცია ვერ ჩაიტვირთა</p>
          <p className="text-xs mt-1">სცადეთ ხელახლა</p>
        </div>
      </div>
    )
  }

  if (!trendsData.monthlyData || trendsData.monthlyData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-sm">მონაცემები არ მოიძებნა</p>
          <p className="text-xs mt-1">შექმენით პირველი ინვოისი</p>
        </div>
      </div>
    )
  }

  // Show growth indicator
  const growthPercentage = trendsData.summary.growthPercentage
  const isPositiveGrowth = growthPercentage > 0

  return (
    <div className="space-y-3">
      {/* Growth indicator */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {isPositiveGrowth ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span className={isPositiveGrowth ? 'text-green-600' : 'text-red-600'}>
            {growthPercentage > 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
          </span>
          <span className="text-gray-500">ზრდა ამ პერიოდში</span>
        </div>
        <div className="text-gray-600">
          საშუალო: ₾{trendsData.summary.averageMonthlyRevenue.toLocaleString('ka-GE')}/თვე
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendsData.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `₾${(value / 1000000).toFixed(1)}M`
                } else if (value >= 1000) {
                  return `₾${(value / 1000).toFixed(0)}K`
                } else {
                  return `₾${value}`
                }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id="totalRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="paidRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="totalRevenue" 
              stackId="1"
              stroke="#0ea5e9" 
              strokeWidth={2}
              fill="url(#totalRevenueGradient)"
              name="სულ შემოსავალი"
            />
            <Area 
              type="monotone" 
              dataKey="paidRevenue" 
              stackId="2"
              stroke="#10b981" 
              strokeWidth={1}
              fill="url(#paidRevenueGradient)"
              name="გადახდილი"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// =====================================
// STATUS DISTRIBUTION CHART
// =====================================

function StatusDistributionChart({ stats }: { stats: InvoiceStats }) {
  const statusData = useMemo(() => {
    const data = [
      { 
        name: 'გადახდილი', 
        value: stats.paidCount, 
        color: '#10b981',
        amount: stats.paidAmount 
      },
      { 
        name: 'გაგზავნილი', 
        value: stats.sentCount, 
        color: '#3b82f6',
        amount: stats.pendingAmount 
      },
      { 
        name: 'ვადაგადაცილებული', 
        value: stats.overdueCount, 
        color: '#ef4444',
        amount: stats.overdueAmount 
      },
      { 
        name: 'გადასახდელი', 
        value: stats.draftCount, 
        color: '#6b7280',
        amount: 0 
      }
    ].filter(item => item.value > 0) // Only show non-zero values

    return data
  }, [stats])

  const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; color: string; amount?: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">რაოდენობა: {data.value}</p>
          {data.amount && data.amount > 0 && (
            <p className="text-sm">ღირებულება: ₾{data.amount.toLocaleString('ka-GE')}</p>
          )}
        </div>
      )
    }
    return null
  }

  if (statusData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-sm">მონაცემები არ მოიძებნა</p>
          <p className="text-xs">შექმენით პირველი ინვოისი</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={statusData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {statusData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// =====================================
// TOP CLIENTS CHART
// =====================================

function TopClientsChart({ stats }: { stats: InvoiceStats }) {
  const clientsData = useMemo(() => {
    return stats.topClients.map(client => ({
      name: client.client_name.length > 20 
        ? `${client.client_name.substring(0, 20)}...` 
        : client.client_name,
      fullName: client.client_name,
      amount: client.total_amount,
      invoices: client.invoice_count
    }))
  }, [stats.topClients])

  const CustomBarTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: { fullName: string; amount: number; invoices: number } }>; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.fullName}</p>
          <p className="text-sm">შემოსავალი: ₾{data.amount.toLocaleString('ka-GE')}</p>
          <p className="text-sm">ინვოისები: {data.invoices}</p>
        </div>
      )
    }
    return null
  }

  if (clientsData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-sm">კლიენტები არ მოიძებნა</p>
          <p className="text-xs">დაამატეთ პირველი კლიენტი</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={clientsData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number" 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `₾${(value / 1000).toFixed(0)}K`}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
            width={60}
          />
          <Tooltip content={<CustomBarTooltip />} />
          <Bar dataKey="amount" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// =====================================
// LOADING SKELETON
// =====================================

function ChartsSkeleton() {
  return (
    <div className="space-y-6">
      
      {/* Revenue Chart Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>

      {/* Bottom Charts Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// =====================================
// ERROR STATE
// =====================================

function ChartsError() {
  return (
    <div className="space-y-6">
      <Card className="border-red-200">
        <CardContent className="p-12 text-center">
          <div className="text-red-500 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-red-600 mb-2">
            გრაფიკების ჩატვირთვა ვერ მოხერხდა
          </h3>
          <p className="text-sm text-red-500">
            სცადეთ გვერდის განახლება ან დაუკავშირდით ადმინისტრაციას
          </p>
        </CardContent>
      </Card>
    </div>
  )
}