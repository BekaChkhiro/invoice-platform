"use client"

import * as React from "react"
import { format } from "date-fns"
import { ka } from "date-fns/locale"
import Link from "next/link"
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { UsageProgress } from "@/components/subscription/usage-progress"
import type { UserSubscription, UsageStats } from "@/types/subscription"

interface BillingOverviewProps {
  subscription: UserSubscription & { plan: { name: string; price: number; interval: string; features?: string[] } }
  usage: UsageStats
  nextBilling?: {
    amount: number
    date: Date
    paymentMethod: string
  } | null
  className?: string
}

const STATUS_CONFIG = {
  active: {
    label: 'აქტიური',
    badge: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-600',
  },
  cancelled: {
    label: 'გაუქმებული',
    badge: 'secondary' as const,
    icon: XCircle,
    color: 'text-red-600',
  },
  expired: {
    label: 'ვადაგასული',
    badge: 'destructive' as const,
    icon: AlertTriangle,
    color: 'text-red-600',
  },
  past_due: {
    label: 'ვადაგადაცილებული',
    badge: 'destructive' as const,
    icon: AlertTriangle,
    color: 'text-orange-600',
  },
}

export function BillingOverview({ 
  subscription, 
  usage, 
  nextBilling, 
  className 
}: BillingOverviewProps) {
  const [autoRenewalEnabled, setAutoRenewalEnabled] = React.useState(
    !subscription.cancel_at_period_end
  )

  const status = STATUS_CONFIG[subscription.status] || STATUS_CONFIG.active
  const StatusIcon = status.icon

  const handleAutoRenewalChange = async (enabled: boolean) => {
    setAutoRenewalEnabled(enabled)
    // TODO: Implement auto-renewal toggle API call
    console.log('Auto renewal changed:', enabled)
  }

  const formatCurrency = (amount: number) => {
    return `₾${amount.toFixed(2)}`
  }

  const formatDate = (date: Date) => {
    return format(date, 'dd MMMM, yyyy', { locale: ka })
  }

  const calculateYearSpent = () => {
    const monthlyAmount = subscription.plan?.price_monthly || 0
    return monthlyAmount * 12 // Simplified calculation
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                მიმდინარე გეგმა
              </CardTitle>
              <CardDescription>
                თქვენი აქტიური გამოწერის დეტალები
              </CardDescription>
            </div>
            <Badge variant={status.badge}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold">
                {subscription.plan?.name || 'უცნობი გეგმა'}
              </h3>
              <p className="text-lg text-muted-foreground">
                {subscription.plan?.price_monthly === 0 
                  ? 'უფასო' 
                  : `${formatCurrency(subscription.plan?.price_monthly || 0)}/თვე`
                }
              </p>
            </div>
            {subscription.plan?.price_monthly > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">შემდეგი ბილინგი</p>
                <p className="font-medium">
                  {nextBilling ? formatDate(nextBilling.date) : 'N/A'}
                </p>
              </div>
            )}
          </div>

          {/* Auto-renewal toggle */}
          {subscription.status === 'active' && subscription.plan?.price_monthly > 0 && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <p className="font-medium">ავტომატური განახლება</p>
                <p className="text-sm text-muted-foreground">
                  თვეების ბოლოს ავტომატურად განახლდება
                </p>
              </div>
              <Switch
                checked={autoRenewalEnabled}
                onCheckedChange={handleAutoRenewalChange}
              />
            </div>
          )}

          {/* Usage Progress */}
          {subscription.plan?.features && (
            <div className="space-y-4">
              <h4 className="font-medium">ამ თვის გამოყენება</h4>
              <UsageProgress
                used={usage.invoices_created}
                limit={subscription.plan.features.max_invoices_per_month}
                resource="invoices"
                period="ამ თვეში"
                showUpgradePrompt={false}
              />
              
              {subscription.plan.features.can_send_email && (
                <div className="text-sm text-muted-foreground flex items-center justify-between">
                  <span>ელ.ფოსტა გაგზავნილი</span>
                  <span>{usage.invoices_sent}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* This Month Usage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ამ თვის გამოყენება</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>ინვოისები შექმნილი</span>
                <span className="font-medium">{usage.invoices_created}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>ელ.ფოსტა გაგზავნილი</span>
                <span className="font-medium">{usage.invoices_sent}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>კლიენტები დამატებული</span>
                <span className="font-medium">{usage.clients_added}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="#usage-analytics">
                <Eye className="h-4 w-4 mr-2" />
                დეტალური ანალიზი
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Next Billing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">მომავალი ბილინგი</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextBilling ? (
              <>
                <div className="space-y-2">
                  <p className="text-2xl font-semibold">
                    {formatCurrency(nextBilling.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(nextBilling.date)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    გადახდის მეთოდი: {nextBilling.paymentMethod}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  გადახდის მეთოდი
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  მომავალი ბილინგი არ არის
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Spent */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ჯამური დახარჯული</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-2xl font-semibold">
                {formatCurrency(calculateYearSpent())}
              </p>
              <p className="text-sm text-muted-foreground">ამ წელს</p>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-600">+15%</span>
                <span className="text-muted-foreground">წინა წელთან</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="#billing-history">
                <Download className="h-4 w-4 mr-2" />
                დეტალური ანგარიში
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button className="flex-1 sm:flex-none">
          <TrendingUp className="h-4 w-4 mr-2" />
          გეგმის განახლება
        </Button>
        
        <Button variant="outline" className="flex-1 sm:flex-none" asChild>
          <Link href="#billing-history">
            <Calendar className="h-4 w-4 mr-2" />
            ბილინგის ისტორია
          </Link>
        </Button>
        
        <Button variant="outline" className="flex-1 sm:flex-none">
          <Settings className="h-4 w-4 mr-2" />
          გადახდის მეთოდი
        </Button>
        
        {subscription.status === 'active' && subscription.plan?.price_monthly > 0 && (
          <Button 
            variant="destructive" 
            className="flex-1 sm:flex-none"
            asChild
          >
            <Link href="#cancel-subscription">
              <XCircle className="h-4 w-4 mr-2" />
              გამოწერის გაუქმება
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

// Loading skeleton for billing overview
export function BillingOverviewSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}