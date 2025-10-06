'use client'

import { useState } from 'react'
import { Plus, Filter, Search, Calendar, TrendingUp, Users, CreditCard, AlertCircle } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { useClientSubscriptions } from '@/hooks/use-client-subscriptions'
import { useAuth } from '@/lib/hooks/use-auth'
import { useFlittConfig } from '@/hooks/use-flitt-config'
import { SubscriptionAnalytics } from '@/components/dashboard/subscription-analytics'
import { SubscriptionsList } from '@/components/subscriptions/subscriptions-list'

export default function SubscriptionsPage() {
  const { company } = useAuth()
  const { subscriptions, stats, isLoading, statsLoading } = useClientSubscriptions(company?.id, true)
  const { config: flittConfig } = useFlittConfig()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [billingFilter, setBillingFilter] = useState<string>('all')

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = !searchTerm || 
      subscription.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter
    const matchesBilling = billingFilter === 'all' || subscription.billing_cycle === billingFilter

    return matchesSearch && matchesStatus && matchesBilling
  })

  // Check if Flitt is configured
  const isFlittConfigured = flittConfig?.has_secret_key && flittConfig?.enabled

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">საბსქრიბშენები</h1>
          <p className="text-muted-foreground">
            მართეთ კლიენტების განმეორებადი გადახდები და ყოველთვიური სერვისები
          </p>
        </div>
        
        <Button asChild>
          <Link href="/dashboard/subscriptions/new">
            <Plus className="w-4 h-4 mr-2" />
            ახალი საბსქრიბშენი
          </Link>
        </Button>
      </div>

      {/* Flitt Configuration Alert */}
      {!isFlittConfigured && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Flitt Payment არ არის კონფიგურირებული!</strong><br />
                ავტომატური გადახდებისთვის საჭიროა Flitt-ის კონფიგურაცია.
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/settings/company">
                  კონფიგურაცია
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">სულ საბსქრიბშენები</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_subscriptions}</div>
              <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                <span className="text-green-600">{stats.active_count} აქტიური</span>
                <span className="text-yellow-600">{stats.paused_count} პაუზა</span>
                <span className="text-gray-500">{stats.cancelled_count} გაუქმებული</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ყოველთვიური შემოსავალი</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.monthly_revenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                მხოლოდ აქტიური საბსქრიბშენებიდან
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">უნიკალური კლიენტები</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unique_clients}</div>
              <p className="text-xs text-muted-foreground">
                საბსქრიბშენის მქონე კლიენტები
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">მომავალი შემოსავალი</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.annual_revenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                ყოველთვიურის 12-ჯერ
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Section */}
      <SubscriptionAnalytics stats={stats} loading={statsLoading} />

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ძებნა სერვისის ან კლიენტის მიხედვით..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="სტატუსი" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ყველა სტატუსი</SelectItem>
                <SelectItem value="active">აქტიური</SelectItem>
                <SelectItem value="paused">პაუზა</SelectItem>
                <SelectItem value="cancelled">გაუქმებული</SelectItem>
              </SelectContent>
            </Select>

            <Select value={billingFilter} onValueChange={setBillingFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="ბილინგი" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ყველა პერიოდი</SelectItem>
                <SelectItem value="weekly">კვირეული</SelectItem>
                <SelectItem value="monthly">ყოველთვიური</SelectItem>
                <SelectItem value="quarterly">კვარტალური</SelectItem>
                <SelectItem value="yearly">წლიური</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">ყველა ({filteredSubscriptions.length})</TabsTrigger>
          <TabsTrigger value="active">
            აქტიური ({filteredSubscriptions.filter(s => s.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger value="paused">
            პაუზა ({filteredSubscriptions.filter(s => s.status === 'paused').length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            გაუქმებული ({filteredSubscriptions.filter(s => s.status === 'cancelled').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <SubscriptionsList 
            subscriptions={filteredSubscriptions}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <SubscriptionsList 
            subscriptions={filteredSubscriptions.filter(s => s.status === 'active')}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="paused" className="mt-6">
          <SubscriptionsList 
            subscriptions={filteredSubscriptions.filter(s => s.status === 'paused')}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          <SubscriptionsList 
            subscriptions={filteredSubscriptions.filter(s => s.status === 'cancelled')}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}