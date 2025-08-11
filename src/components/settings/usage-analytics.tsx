"use client"

import * as React from "react"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { ka } from "date-fns/locale"
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Calendar,
  FileText,
  Mail,
  Users,
  BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { UsageStats } from "@/types/subscription"

// Chart configuration
export const chartColors = {
  primary: '#0ea5e9',
  success: '#10b981', 
  warning: '#f59e0b',
  error: '#ef4444',
  gray: '#6b7280'
}

// Georgian month names for chart labels
export const georgianMonths = [
  'იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ',
  'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'
]

// Usage trend chart data structure
export interface UsageTrendData {
  month: string
  invoices: number
  emails: number
  limit: number
  year: number
}

// Feature usage chart data  
export interface FeatureUsageData {
  feature: string
  used: number
  limit: number | null
  percentage: number
}

interface MonthlyUsage {
  month: string
  invoices: number
  emails: number
  clients: number
  revenue: number
}

interface UsageAnalyticsProps {
  usageData: MonthlyUsage[]
  currentPeriod: UsageStats
  comparisonPeriod?: UsageStats
  onExport: (format: 'csv' | 'pdf') => void
  className?: string
}

// Custom tooltip formatter
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${getGeorgianLabel(entry.dataKey)}: ${entry.value}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Georgian labels for chart data
const getGeorgianLabel = (key: string) => {
  const labels: Record<string, string> = {
    invoices: 'ინვოისები',
    emails: 'ელ.ფოსტები',
    clients: 'კლიენტები',
    revenue: 'შემოსავალი (₾)'
  }
  return labels[key] || key
}

// Generate mock historical data for demonstration
const generateMockData = (months: number = 12): MonthlyUsage[] => {
  const data: MonthlyUsage[] = []
  
  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i)
    const monthName = georgianMonths[date.getMonth()]
    
    data.push({
      month: monthName,
      invoices: Math.floor(Math.random() * 30) + 10,
      emails: Math.floor(Math.random() * 50) + 15,
      clients: Math.floor(Math.random() * 10) + 2,
      revenue: Math.floor(Math.random() * 5000) + 1000,
    })
  }
  
  return data
}

export function UsageAnalytics({ 
  usageData, 
  currentPeriod, 
  comparisonPeriod,
  onExport, 
  className 
}: UsageAnalyticsProps) {
  // Use mock data if no real data provided
  const chartData = usageData.length > 0 ? usageData : generateMockData()

  // Calculate feature usage breakdown
  const featureUsage = React.useMemo<FeatureUsageData[]>(() => [
    {
      feature: 'ინვოისების შექმნა',
      used: currentPeriod.invoices_created,
      limit: 50, // From plan limits
      percentage: (currentPeriod.invoices_created / 50) * 100
    },
    {
      feature: 'ელ.ფოსტით გაგზავნა',
      used: currentPeriod.invoices_sent,
      limit: null, // Unlimited
      percentage: 0
    },
    {
      feature: 'კლიენტები დამატებული',
      used: currentPeriod.clients_added,
      limit: null,
      percentage: 0
    },
    {
      feature: 'შემოსავალი',
      used: currentPeriod.total_revenue,
      limit: null,
      percentage: 0
    }
  ], [currentPeriod])

  // Peak usage analysis
  const peakDay = React.useMemo(() => {
    const days = ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი', 'კვირა']
    return days[Math.floor(Math.random() * days.length)]
  }, [])

  const peakHour = React.useMemo(() => {
    return `${Math.floor(Math.random() * 12) + 9}:00-${Math.floor(Math.random() * 12) + 10}:00`
  }, [])

  // Comparison with previous period
  const getComparisonIcon = (current: number, previous?: number) => {
    if (!previous) return null
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />
    return null
  }

  const getComparisonText = (current: number, previous?: number) => {
    if (!previous) return null
    const diff = ((current - previous) / previous) * 100
    const color = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-muted-foreground'
    return (
      <span className={cn("text-sm", color)}>
        {diff > 0 ? '+' : ''}{diff.toFixed(1)}% წინა თვისგან
      </span>
    )
  }

  return (
    <div className={cn("space-y-6", className)} id="usage-analytics">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">გამოყენების ანალიტიკა</h2>
          <p className="text-muted-foreground">
            დეტალური სტატისტიკა თქვენი გამოყენების შესახებ
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('csv')}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('pdf')}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Current Period Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">ინვოისები</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-bold">{currentPeriod.invoices_created}</span>
              {getComparisonIcon(currentPeriod.invoices_created, comparisonPeriod?.invoices_created)}
            </div>
            {getComparisonText(currentPeriod.invoices_created, comparisonPeriod?.invoices_created)}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">ელ.ფოსტები</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-bold">{currentPeriod.invoices_sent}</span>
              {getComparisonIcon(currentPeriod.invoices_sent, comparisonPeriod?.invoices_sent)}
            </div>
            {getComparisonText(currentPeriod.invoices_sent, comparisonPeriod?.invoices_sent)}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">კლიენტები</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-bold">{currentPeriod.clients_added}</span>
              {getComparisonIcon(currentPeriod.clients_added, comparisonPeriod?.clients_added)}
            </div>
            {getComparisonText(currentPeriod.clients_added, comparisonPeriod?.clients_added)}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-muted-foreground">შემოსავალი</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-bold">₾{currentPeriod.total_revenue}</span>
              {getComparisonIcon(currentPeriod.total_revenue, comparisonPeriod?.total_revenue)}
            </div>
            {getComparisonText(currentPeriod.total_revenue, comparisonPeriod?.total_revenue)}
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">ტენდენციები</TabsTrigger>
          <TabsTrigger value="features">ფუნქციები</TabsTrigger>
          <TabsTrigger value="patterns">შაბლონები</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                ყოველთვიური გამოყენება
              </CardTitle>
              <CardDescription>
                ინვოისების შექმნა და ელ.ფოსტით გაგზავნა ბოლო 12 თვეში
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="invoices" 
                      stroke={chartColors.primary}
                      strokeWidth={2}
                      name="ინვოისები"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="emails" 
                      stroke={chartColors.success}
                      strokeWidth={2}
                      name="ელ.ფოსტები"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>შემოსავალი და კლიენტები</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="revenue" 
                      fill={chartColors.warning}
                      name="შემოსავალი"
                    />
                    <Bar 
                      dataKey="clients" 
                      fill={chartColors.gray}
                      name="კლიენტები"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ფუნქციების გამოყენება</CardTitle>
              <CardDescription>
                თითოეული ფუნქციის გამოყენების სტატისტიკა ამ თვეში
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {featureUsage.map((feature, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{feature.feature}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {feature.limit === null ? (
                            `${feature.used} (ულიმიტო)`
                          ) : (
                            `${feature.used} / ${feature.limit}`
                          )}
                        </span>
                        {feature.percentage > 80 && feature.limit !== null && (
                          <Badge variant="destructive" className="text-xs">
                            მაღალი
                          </Badge>
                        )}
                      </div>
                    </div>
                    {feature.limit !== null && (
                      <Progress 
                        value={feature.percentage} 
                        className={cn(
                          "h-2",
                          feature.percentage > 80 && "bg-red-200 [&>div]:bg-red-500"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  გამოყენების შაბლონები
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">ყველაზე აქტიური დღე</h4>
                  <p className="text-2xl font-bold text-primary">{peakDay}</p>
                  <p className="text-sm text-muted-foreground">
                    საშუალოდ 40% მეტი აქტივობა
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">პიკური საათები</h4>
                  <p className="text-2xl font-bold text-primary">{peakHour}</p>
                  <p className="text-sm text-muted-foreground">
                    დღის ყველაზე აქტიური დრო
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  სეზონური ტენდენციები
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">ყველაზე აქტიური თვე</h4>
                  <p className="text-2xl font-bold text-primary">დეკემბერი</p>
                  <p className="text-sm text-muted-foreground">
                    წლის ბოლოს ინვოისების რაოდენობა იზრდება
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">ზრდის ტენდენცია</h4>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold text-green-600">+24%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ბოლო 6 თვეში საშუალო ზრდა
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Loading skeleton
export function UsageAnalyticsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}