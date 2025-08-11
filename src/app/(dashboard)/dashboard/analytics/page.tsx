'use client'

import { useState, useMemo } from 'react'
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Users, 
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { ka } from 'date-fns/locale'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'

import { useInvoiceStats } from '@/lib/hooks/use-invoices'
import { useAuth } from '@/lib/hooks/use-auth'

// =====================================
// TYPES
// =====================================

type DateRange = {
  from: Date
  to: Date
}

type AnalyticsPeriod = 'last7days' | 'last30days' | 'last90days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'

// =====================================
// MAIN COMPONENT
// =====================================

export default function AnalyticsPage() {
  const { company } = useAuth()
  
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('last30days')
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  })

  // Fetch analytics data
  const { 
    data: stats, 
    isLoading, 
    isError, 
    refetch 
  } = useInvoiceStats(company?.id || '')

  // Get date range based on period
  const dateRange = useMemo(() => {
    const now = new Date()
    
    switch (selectedPeriod) {
      case 'last7days':
        return { from: subDays(now, 7), to: now }
      case 'last30days':
        return { from: subDays(now, 30), to: now }
      case 'last90days':
        return { from: subDays(now, 90), to: now }
      case 'thisMonth':
        return { from: startOfMonth(now), to: endOfMonth(now) }
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(now), 1)
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
      case 'thisYear':
        return { from: startOfYear(now), to: endOfYear(now) }
      case 'custom':
        return customDateRange
      default:
        return { from: subDays(now, 30), to: now }
    }
  }, [selectedPeriod, customDateRange])

  // Mock analytics data (in real app this would come from API)
  const analyticsData = useMemo(() => {
    if (!stats) return null

    // Mock revenue trend data
    const revenueTrend = Array.from({ length: 30 }, (_, i) => ({
      date: format(subDays(dateRange.to, 29 - i), 'MMM dd', { locale: ka }),
      revenue: Math.random() * stats.thisMonthRevenue * 0.1 + stats.thisMonthRevenue * 0.02,
      invoices: Math.floor(Math.random() * 5) + 1
    }))

    // Client analysis
    const clientGrowth = stats.topClients.map(client => ({
      name: client.client_name,
      thisMonth: client.total_amount,
      lastMonth: client.total_amount * (0.8 + Math.random() * 0.4),
      growth: ((client.total_amount - (client.total_amount * 0.9)) / (client.total_amount * 0.9)) * 100
    }))

    return {
      revenueTrend,
      clientGrowth,
      summary: {
        totalRevenue: stats.thisMonthRevenue + stats.lastMonthRevenue,
        revenueGrowth: stats.lastMonthRevenue > 0 
          ? ((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100 
          : 100,
        totalInvoices: stats.totalInvoices,
        averageInvoiceValue: stats.averageInvoiceValue,
        topPayingClient: stats.topClients[0]?.client_name || 'N/A',
        averagePaymentTime: Math.floor(Math.random() * 15) + 5 // Mock data
      }
    }
  }, [stats, dateRange])

  const handleExport = (format: 'csv' | 'excel') => {
    // TODO: Implement export functionality
    alert(`Export as ${format.toUpperCase()} - ჯერ არ არის იმპლემენტირებული`)
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">კომპანიის ინფორმაცია საჭიროა</h3>
            <p className="text-muted-foreground">ანალიტიკის სანახავად გთხოვთ შეავსოთ კომპანიის ინფორმაცია</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ანალიტიკა</h1>
          <p className="text-sm text-gray-500 mt-1">
            დეტალური რეპორტები და სტატისტიკა
          </p>
        </div>
        
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            განახლება
          </Button>
          
          <Select value={selectedPeriod} onValueChange={(value: AnalyticsPeriod) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="პერიოდის არჩევა" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">ბოლო 7 დღე</SelectItem>
              <SelectItem value="last30days">ბოლო 30 დღე</SelectItem>
              <SelectItem value="last90days">ბოლო 90 დღე</SelectItem>
              <SelectItem value="thisMonth">ამ თვეში</SelectItem>
              <SelectItem value="lastMonth">წინა თვეში</SelectItem>
              <SelectItem value="thisYear">ამ წელს</SelectItem>
              <SelectItem value="custom">პერიოდის მითითება</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Range Picker for Custom Period */}
      {selectedPeriod === 'custom' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">პერიოდი:</span>
              </div>
              <DatePickerWithRange
                from={customDateRange.from}
                to={customDateRange.to}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setCustomDateRange({ from: range.from, to: range.to })
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && <AnalyticsPageSkeleton />}

      {/* Error State */}
      {isError && (
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-red-600 mb-2">ანალიტიკის ჩატვირთვა ვერ მოხერხდა</h3>
            <p className="text-sm text-red-500 mb-4">სცადეთ გვერდის განახლება ან დაუკავშირდით ადმინისტრაციას</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              ხელახლა ცდა
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analytics Content */}
      {!isLoading && !isError && stats && analyticsData && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">მიმოხილვა</TabsTrigger>
            <TabsTrigger value="revenue">შემოსავალი</TabsTrigger>
            <TabsTrigger value="clients">კლიენტები</TabsTrigger>
            <TabsTrigger value="invoices">ინვოისები</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="მთლიანი შემოსავალი"
                value={`₾${analyticsData.summary.totalRevenue.toLocaleString('ka-GE')}`}
                change={analyticsData.summary.revenueGrowth}
                icon={DollarSign}
                changeType={analyticsData.summary.revenueGrowth > 0 ? 'increase' : 'decrease'}
              />
              
              <MetricCard
                title="ინვოისების რაოდენობა"
                value={analyticsData.summary.totalInvoices.toString()}
                icon={FileText}
                changeType="neutral"
              />
              
              <MetricCard
                title="საშუალო ღირებულება"
                value={`₾${analyticsData.summary.averageInvoiceValue.toLocaleString('ka-GE')}`}
                icon={BarChart3}
                changeType="neutral"
              />
              
              <MetricCard
                title="საშ. გადახდის ვადა"
                value={`${analyticsData.summary.averagePaymentTime} დღე`}
                icon={Users}
                changeType="neutral"
              />
            </div>

            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>შემოსავლის ტენდენცია</CardTitle>
                <CardDescription>
                  დღიური შემოსავლის დინამიკა ({format(dateRange.from, 'dd MMM', { locale: ka })} - {format(dateRange.to, 'dd MMM', { locale: ka })})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData.revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border rounded-lg shadow-lg">
                                <p className="font-medium">{label}</p>
                                <p className="text-blue-600">
                                  შემოსავალი: ₾{payload[0].value?.toLocaleString('ka-GE')}
                                </p>
                                <p className="text-gray-500 text-sm">
                                  ინვოისები: {payload[0].payload.invoices}
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Revenue by Status */}
              <Card>
                <CardHeader>
                  <CardTitle>შემოსავალი სტატუსის მიხედვით</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'გადახდილი', value: stats.paidAmount, color: '#10b981' },
                            { name: 'მოლოდინში', value: stats.pendingAmount, color: '#3b82f6' },
                            { name: 'ვადაგადაცილებული', value: stats.overdueAmount, color: '#ef4444' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'გადახდილი', value: stats.paidAmount, color: '#10b981' },
                            { name: 'მოლოდინში', value: stats.pendingAmount, color: '#3b82f6' },
                            { name: 'ვადაგადაცილებული', value: stats.overdueAmount, color: '#ef4444' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>თვიური შედარება</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <div className="text-sm text-green-600">ამ თვის შემოსავალი</div>
                        <div className="text-2xl font-bold text-green-700">₾{stats.thisMonthRevenue.toLocaleString('ka-GE')}</div>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <div className="text-sm text-blue-600">წინა თვის შემოსავალი</div>
                        <div className="text-2xl font-bold text-blue-700">₾{stats.lastMonthRevenue.toLocaleString('ka-GE')}</div>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm text-gray-600">ზრდის ტემპი</div>
                        <div className={`text-2xl font-bold ${analyticsData.summary.revenueGrowth > 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {analyticsData.summary.revenueGrowth > 0 ? '+' : ''}{analyticsData.summary.revenueGrowth.toFixed(1)}%
                        </div>
                      </div>
                      {analyticsData.summary.revenueGrowth > 0 ? (
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      ) : (
                        <TrendingDown className="h-8 w-8 text-red-600" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Top Clients */}
              <Card>
                <CardHeader>
                  <CardTitle>TOP კლიენტები</CardTitle>
                  <CardDescription>შემოსავლის მიხედვით</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topClients.slice(0, 5).map((client, index) => (
                      <div key={client.client_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{client.client_name}</div>
                            <div className="text-sm text-gray-500">{client.invoice_count} ინვოისი</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₾{client.total_amount.toLocaleString('ka-GE')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Client Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>კლიენტების სტატისტიკა</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-purple-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">{stats.topClients.length}</div>
                        <div className="text-sm text-purple-600">აქტიური კლიენტები</div>
                      </div>
                      
                      <div className="p-3 bg-orange-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          ₾{stats.topClients.length > 0 ? (stats.topClients.reduce((sum, client) => sum + client.total_amount, 0) / stats.topClients.length).toLocaleString('ka-GE') : '0'}
                        </div>
                        <div className="text-sm text-orange-600">საშუალო შემოსავალი</div>
                      </div>
                    </div>
                    
                    {stats.topClients[0] && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-600">TOP კლიენტი</div>
                        <div className="font-medium text-green-700">{stats.topClients[0].client_name}</div>
                        <div className="text-sm text-green-600">₾{stats.topClients[0].total_amount.toLocaleString('ka-GE')}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Invoice Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>ინვოისების განაწილება</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>გადახდილი</span>
                      </div>
                      <div className="font-medium">{stats.paidCount}</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>გაგზავნილი</span>
                      </div>
                      <div className="font-medium">{stats.sentCount}</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>ვადაგადაცილებული</span>
                      </div>
                      <div className="font-medium">{stats.overdueCount}</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        <span>მონახაზი</span>
                      </div>
                      <div className="font-medium">{stats.draftCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>გადახდის შესრულება</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600">გადახდის მაჩვენებელი</div>
                      <div className="text-2xl font-bold text-green-700">
                        {((stats.paidCount / (stats.totalInvoices || 1)) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-green-600">
                        {stats.paidCount} / {stats.totalInvoices} ინვოისი
                      </div>
                    </div>
                    
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-sm text-orange-600">საშუალო ღირებულება</div>
                      <div className="text-2xl font-bold text-orange-700">
                        ₾{stats.averageInvoiceValue.toLocaleString('ka-GE')}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600">ყველაზე დიდი ინვოისი</div>
                      <div className="text-2xl font-bold text-blue-700">
                        ₾{Math.max(...stats.topClients.map(c => c.total_amount)).toLocaleString('ka-GE')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Export Section */}
      {!isLoading && !isError && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              რეპორტის ექსპორტი
            </CardTitle>
            <CardDescription>
              ჩამოტვირთეთ ანალიტიკის რეპორტი სხვადასხვა ფორმატში
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => handleExport('csv')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                CSV ფაილი
              </Button>
              <Button onClick={() => handleExport('excel')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Excel ფაილი
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// =====================================
// METRIC CARD COMPONENT
// =====================================

interface MetricCardProps {
  title: string
  value: string
  change?: number
  icon: React.ComponentType<{ className?: string }>
  changeType: 'increase' | 'decrease' | 'neutral'
}

function MetricCard({ title, value, change, icon: IconComponent, changeType }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-1 ${
                changeType === 'increase' ? 'text-green-600' : 
                changeType === 'decrease' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {changeType === 'increase' && <TrendingUp className="h-4 w-4" />}
                {changeType === 'decrease' && <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <IconComponent className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================
// LOADING SKELETON
// =====================================

function AnalyticsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Chart Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      
      {/* Tabs Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
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