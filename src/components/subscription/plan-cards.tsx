"use client"

import * as React from "react"
import { Check, X } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { subscriptionService } from "@/lib/services/subscription"
import type { SubscriptionPlan, UserSubscription } from "@/types/subscription"

const PLANS = [
  {
    id: 'free',
    name: 'უფასო',
    description: 'დაწყებისთვის იდეალური',
    price: 'უფასო',
    priceMonthly: 0,
    features: {
      invoices: '5/თვე',
      clients: '3',
      basicDashboard: true,
      emailSending: false,
      logo: false,
      analytics: false,
      excelExport: false,
      branding: false,
      api: false,
      support: false,
    }
  },
  {
    id: 'basic',
    name: 'ძირითადი',
    description: 'მცირე ბიზნესისთვის',
    price: '₾29',
    priceMonthly: 29,
    period: '/თვე',
    popular: true,
    features: {
      invoices: '50/თვე',
      clients: 'ულიმიტო',
      basicDashboard: true,
      emailSending: true,
      logo: true,
      analytics: true,
      excelExport: false,
      branding: false,
      api: false,
      support: false,
    }
  },
  {
    id: 'pro',
    name: 'პროფესიონალური',
    description: 'დიდი კომპანიებისთვის',
    price: '₾79',
    priceMonthly: 79,
    period: '/თვე',
    features: {
      invoices: 'ულიმიტო',
      clients: 'ულიმიტო',
      basicDashboard: true,
      emailSending: true,
      logo: true,
      analytics: true,
      excelExport: true,
      branding: true,
      api: true,
      support: true,
    }
  }
]

const FEATURE_LABELS = {
  invoices: 'ინვოისები',
  clients: 'კლიენტები',
  basicDashboard: 'ძირითადი დაშბორდი',
  emailSending: 'ელ.ფოსტით გაგზავნა',
  logo: 'ლოგოს ატვირთვა',
  analytics: 'გაფართოებული ანალიტიკა',
  excelExport: 'Excel ექსპორტი',
  branding: 'ბრენდირება',
  api: 'API წვდომა',
  support: '24/7 მხარდაჭერა',
}

interface PlanCardsProps {
  userId: string
  onUpgrade?: (plan: SubscriptionPlan) => void
  className?: string
}

export function PlanCards({ userId, onUpgrade, className }: PlanCardsProps) {
  const queryClient = useQueryClient()

  const { data: currentSubscription, isLoading, error } = useQuery({
    queryKey: ['user-subscription', userId],
    queryFn: () => subscriptionService.getCurrentUserPlan(userId),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })

  const upgradeMutation = useMutation({
    mutationFn: ({ planId }: { planId: string }) => 
      subscriptionService.upgradePlan(userId, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription', userId] })
      toast.success('გეგმა წარმატებით განახლდა')
    },
    onError: (error) => {
      toast.error('გეგმის განახლება ვერ მოხერხდა')
      console.error('Upgrade error:', error)
    },
  })

  const handlePlanAction = (plan: typeof PLANS[0]) => {
    if (onUpgrade) {
      onUpgrade(plan as any)
    } else {
      upgradeMutation.mutate({ planId: plan.id })
    }
  }

  const getPlanStatus = (planId: string) => {
    if (!currentSubscription) return 'upgrade'
    const currentPlanName = currentSubscription.plan?.name?.toLowerCase()
    
    if (currentPlanName === planId) return 'current'
    
    const currentIndex = PLANS.findIndex(p => p.id === currentPlanName)
    const targetIndex = PLANS.findIndex(p => p.id === planId)
    
    return targetIndex > currentIndex ? 'upgrade' : 'downgrade'
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">გეგმების ჩატვირთვა ვერ მოხერხდა</p>
      </div>
    )
  }

  return (
    <div className={cn("grid gap-6 md:grid-cols-3", className)}>
      {isLoading ? (
        <>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="relative">
              <CardHeader>
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </>
      ) : (
        PLANS.map((plan) => {
          const status = getPlanStatus(plan.id)
          const isCurrent = status === 'current'
          
          return (
            <Card 
              key={plan.id} 
              className={cn(
                "relative transition-all hover:shadow-lg",
                isCurrent && "border-primary ring-2 ring-primary/20",
                plan.popular && !isCurrent && "border-primary/50"
              )}
            >
              {isCurrent && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  მიმდინარე გეგმა
                </Badge>
              )}
              {plan.popular && !isCurrent && (
                <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2">
                  პოპულარული
                </Badge>
              )}
              
              <CardHeader className="text-center pb-8 pt-6">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{FEATURE_LABELS.invoices}</span>
                    <span className="font-medium">{plan.features.invoices}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{FEATURE_LABELS.clients}</span>
                    <span className="font-medium">{plan.features.clients}</span>
                  </div>
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  {Object.entries(FEATURE_LABELS).slice(2).map(([key, label]) => {
                    const hasFeature = plan.features[key as keyof typeof plan.features]
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {hasFeature ? (
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                        )}
                        <span className={cn(
                          hasFeature ? "text-foreground" : "text-muted-foreground/70"
                        )}>
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : status === 'upgrade' ? "default" : "secondary"}
                  disabled={isCurrent || upgradeMutation.isPending}
                  onClick={() => handlePlanAction(plan)}
                >
                  {isCurrent ? 'მიმდინარე გეგმა' : status === 'upgrade' ? 'განახლება' : 'ჩამოწევა'}
                </Button>
              </CardFooter>
            </Card>
          )
        })
      )}
    </div>
  )
}