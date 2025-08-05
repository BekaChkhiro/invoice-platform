'use client'

import { useMemo } from 'react'
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

import type { InvoiceStats } from '@/lib/services/invoice'

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
  if (loading) {
    return <ChartsSkeleton />
  }

  if (!stats) {
    return <ChartsError />
  }

  return (
    <div className="space-y-6">
      
      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            შემოსავლების ტენდენცია
            <Badge variant="secondary" className="ml-auto">
              ბოლო 12 თვე
            </Badge>
          </CardTitle>
          <CardDescription>
            თვიური შემოსავალი და ზრდის ტენდენცია
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart stats={stats} />
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

function RevenueChart({ stats }: { stats: InvoiceStats }) {
  // Generate mock data for 12 months
  const revenueData = useMemo(() => {
    const data = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(startOfMonth(now), i)
      const monthName = format(date, 'MMM', { locale: ka })
      
      // For demo purposes, create some sample data
      // In real app, this would come from actual historical data
      let revenue = 0
      if (i === 0) {
        // Current month
        revenue = stats.thisMonthRevenue
      } else if (i === 1) {
        // Last month
        revenue = stats.lastMonthRevenue
      } else {
        // Mock data for other months
        revenue = Math.random() * stats.thisMonthRevenue * 1.5
      }
      
      data.push({
        month: monthName,
        revenue: Math.round(revenue),
        date: date.toISOString()
      })
    }
    
    return data
  }, [stats])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-green-600">
            შემოსავალი: ₾{payload[0].value.toLocaleString('ka-GE')}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={revenueData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `₾${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#0ea5e9" 
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
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
        name: 'მონახაზი', 
        value: stats.draftCount, 
        color: '#6b7280',
        amount: 0 
      }
    ].filter(item => item.value > 0) // Only show non-zero values

    return data
  }, [stats])

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">რაოდენობა: {data.value}</p>
          {data.amount > 0 && (
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
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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

  const CustomBarTooltip = ({ active, payload, label }: any) => {
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
          layout="horizontalBar"
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