'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Calendar, ArrowLeft } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import Link from 'next/link'

interface ServiceStats {
  id: string
  name: string
  description: string | null
  default_price: number | null
  unit: string | null
  is_active: boolean
  created_at: string
  statistics: {
    total_usage: number
    total_revenue: number
    average_price: number
    unique_clients: number
    recent_usage: Array<{
      date: string
      amount: number
      quantity: number
      client_name: string
      invoice_status: string
    }>
  }
}

interface ServiceStatsSummary {
  total_services: number
  total_usage: number
  total_revenue: number
  average_price: number
  most_used_service: {
    id: string
    name: string
    usage_count: number
  } | null
  highest_revenue_service: {
    id: string
    name: string
    revenue: number
  } | null
}

interface ServiceStatsResponse {
  services: ServiceStats[]
  summary: ServiceStatsSummary
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function ServicesAnalyticsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ServiceStatsResponse | null>(null)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange, selectedPeriod])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        limit: '50'
      })

      if (dateRange.from) {
        params.set('date_from', dateRange.from.toISOString())
      }
      if (dateRange.to) {
        params.set('date_to', dateRange.to.toISOString())
      }

      const response = await fetch(`/api/services/stats?${params}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')

      const result: ServiceStatsResponse = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: "შეცდომა",
        description: "ანალიტიკის ჩატვირთვა ვერ მოხერხდა",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    const now = new Date()
    
    switch (period) {
      case '7days':
        setDateRange({
          from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          to: now
        })
        break
      case '30days':
        setDateRange({
          from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          to: now
        })
        break
      case '90days':
        setDateRange({
          from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          to: now
        })
        break
      case 'all':
      default:
        setDateRange({})
        break
    }
  }

  // Prepare chart data
  const revenueChartData = data?.services.slice(0, 10).map(service => ({
    name: service.name,
    revenue: service.statistics.total_revenue,
    usage: service.statistics.total_usage
  })) || []

  const usageChartData = data?.services.slice(0, 8).map((service, index) => ({
    name: service.name,
    value: service.statistics.total_usage,
    fill: COLORS[index % COLORS.length]
  })) || []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">მონაცემები ვერ ჩაიტვირთა</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          კვლავ სცადეთ
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/working-dashboard/services">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              უკან
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">სერვისების ანალიტიკა</h1>
            <p className="text-gray-600">სერვისების გამოყენების სტატისტიკა</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="პერიოდი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">მთელი დრო</SelectItem>
            <SelectItem value="7days">ბოლო 7 დღე</SelectItem>
            <SelectItem value="30days">ბოლო 30 დღე</SelectItem>
            <SelectItem value="90days">ბოლო 90 დღე</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <DatePickerWithRange
            from={dateRange.from}
            to={dateRange.to}
            onSelect={(range) => setDateRange(range || {})}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">სულ სერვისები</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_services}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">სულ გამოყენება</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_usage}</div>
            <p className="text-xs text-muted-foreground">ინვოისებში</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">სულ შემოსავალი</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_revenue} ₾</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">საშუალო ფასი</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.average_price} ₾</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Services */}
      {data.summary.most_used_service && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ყველაზე გამოყენებული</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">{data.summary.most_used_service.name}</div>
              <p className="text-sm text-muted-foreground">
                {data.summary.most_used_service.usage_count} ჯერ გამოყენებული
              </p>
            </CardContent>
          </Card>

          {data.summary.highest_revenue_service && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ყველაზე შემოსავლიანი</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">{data.summary.highest_revenue_service.name}</div>
                <p className="text-sm text-muted-foreground">
                  {data.summary.highest_revenue_service.revenue} ₾ შემოსავალი
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>შემოსავალი სერვისების მიხედვით</CardTitle>
            <CardDescription>ტოპ 10 სერვისი შემოსავლის მიხედვით</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'revenue' ? `${value} ₾` : value,
                      name === 'revenue' ? 'შემოსავალი' : 'გამოყენება'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Usage Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>გამოყენების განაწილება</CardTitle>
            <CardDescription>ტოპ 8 სერვისი გამოყენების მიხედვით</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usageChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {usageChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [value, 'გამოყენება']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>სერვისების დეტალური სტატისტიკა</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>სახელი</TableHead>
                <TableHead>ერთეული</TableHead>
                <TableHead className="text-right">გამოყენება</TableHead>
                <TableHead className="text-right">უნიკალური კლიენტები</TableHead>
                <TableHead className="text-right">საშუალო ფასი</TableHead>
                <TableHead className="text-right">სულ შემოსავალი</TableHead>
                <TableHead>სტატუსი</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{service.name}</div>
                      {service.description && (
                        <div className="text-sm text-muted-foreground">{service.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{service.unit}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {service.statistics.total_usage}
                  </TableCell>
                  <TableCell className="text-right">
                    {service.statistics.unique_clients}
                  </TableCell>
                  <TableCell className="text-right">
                    {service.statistics.average_price.toFixed(2)} ₾
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {service.statistics.total_revenue.toFixed(2)} ₾
                  </TableCell>
                  <TableCell>
                    <Badge variant={service.is_active ? "default" : "secondary"}>
                      {service.is_active ? "აქტიური" : "გაუქმებული"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data.services.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              სტატისტიკა არ მოიძებნა მოცემული პერიოდისთვის
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}