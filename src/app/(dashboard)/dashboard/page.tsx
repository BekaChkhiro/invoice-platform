'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { RefreshCw, TrendingUp, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

import { AnalyticsCards } from '@/components/dashboard/analytics-cards'
import { Charts } from '@/components/dashboard/charts'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { QuickActions } from '@/components/dashboard/quick-actions'

import { useInvoiceStats } from '@/lib/hooks/use-invoices'
import { useAuth } from '@/lib/hooks/use-auth'

// =====================================
// MAIN DASHBOARD PAGE
// =====================================

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const { user, company } = useAuth()
  const searchParams = useSearchParams()
  
  // Fetch dashboard statistics
  const { 
    data: stats, 
    isLoading: statsLoading, 
    isError: statsError, 
    refetch: refetchStats 
  } = useInvoiceStats(company?.id || '')

  const handleRefreshAll = () => {
    refetchStats()
    // Trigger refresh for other queries if needed
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">კომპანიის ინფორმაცია</CardTitle>
            <CardDescription className="text-center">
              გთხოვთ შეავსოთ კომპანიის ინფორმაცია
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button>კომპანიის პროფილის შევსება</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            მთავარი გვერდი
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {company.name} • {new Date().toLocaleDateString('ka-GE', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={statsLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
            განახლება
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {statsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            სტატისტიკის ჩატვირთვა ვერ მოხერხდა. გთხოვთ სცადოთ ხელახლა.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <AnalyticsCards stats={stats} loading={statsLoading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Charts Section - Takes 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <Charts stats={stats} loading={statsLoading} />
        </div>

        {/* Sidebar Content - Takes 1/3 width on large screens */}
        <div className="space-y-6">
          <RecentActivity companyId={company.id} />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Dashboard Footer Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>ბოლო განახლება: {new Date().toLocaleTimeString('ka-GE')}</span>
              </div>
              {stats && (
                <div>
                  სულ ინვოისები: {stats.totalInvoices}
                </div>
              )}
            </div>
            
            <div className="mt-2 sm:mt-0">
              <span>© 2024 Invoice Platform</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =====================================
// LOADING SKELETON
// =====================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </div>
        <Skeleton className="h-9 w-24 mt-4 sm:mt-0" />
      </div>

      {/* Statistics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Charts Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32 mt-2 sm:mt-0" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}