"use client"

import * as React from "react"
import { Crown, Lock, TrendingUp, Zap, Star, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { UpgradeModal } from "@/components/subscription/upgrade-modal"
import { QuickUpgradeModal } from "@/components/subscription/upgrade-modal"
import { useFeatureAccess, useCurrentPlan } from "@/hooks/use-subscription"
import type { PlanFeatures } from "@/types/subscription"

// Plan configurations
const PLAN_CONFIG = {
  FREE: {
    name: 'უფასო',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    icon: null,
  },
  BASIC: {
    name: 'ძირითადი',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    icon: Zap,
  },
  PRO: {
    name: 'პროფესიონალური',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    icon: Crown,
  }
} as const

// Feature descriptions in Georgian
const FEATURE_DESCRIPTIONS = {
  can_send_email: {
    title: 'ელ.ფოსტით გაგზავნა',
    description: 'გააგზავნეთ ინვოისები პირდაპირ კლიენტების ელ.ფოსტაზე',
    icon: '📧',
    benefits: ['ავტომატური გაგზავნა', 'კლიენტების შეტყობინება', 'სწრაფი მიწოდება']
  },
  can_use_custom_branding: {
    title: 'ბრენდირება',
    description: 'დაამატეთ თქვენი ლოგო და ფერები ინვოისებს',
    icon: '🎨',
    benefits: ['პროფესიონალური იერსახე', 'ბრენდის ამოცნობადობა', 'კასტომიზაცია']
  },
  advanced_analytics: {
    title: 'გაფართოებული ანალიტიკა',
    description: 'დეტალური რეპორტები და სტატისტიკა',
    icon: '📊',
    benefits: ['ვიზუალური რეპორტები', 'ტენდენციების ანალიზი', 'ბიზნეს ინსაიტები']
  },
  can_export_pdf: {
    title: 'PDF ექსპორტი',
    description: 'ინვოისების ჩამოტვირთვა PDF ფორმატში',
    icon: '📄',
    benefits: ['პროფესიონალური დოკუმენტები', 'მუდმივი ფორმატი', 'ადვილი შენახვა']
  },
  can_use_api: {
    title: 'API წვდომა',
    description: 'ინტეგრაცია მესამე მხარის აპლიკაციებთან',
    icon: '🔗',
    benefits: ['ავტომატიზაცია', 'სისტემების ინტეგრაცია', 'დეველოპერული ხელსაწყოები']
  },
  can_use_team_members: {
    title: 'გუნდის წევრები',
    description: 'დაამატეთ თანამშრომლები და მართეთ უფლებები',
    icon: '👥',
    benefits: ['კოლაბორაცია', 'როლების მართვა', 'გუნდური მუშაობა']
  },
} as const

interface PlanGateProps {
  children: React.ReactNode
  requiredPlan?: 'FREE' | 'BASIC' | 'PRO'
  feature?: keyof PlanFeatures
  upgradeModal?: boolean
  fallback?: React.ReactNode
  disabled?: boolean
  tooltip?: boolean
  variant?: 'default' | 'minimal' | 'card'
  className?: string
}

export function PlanGate({
  children,
  requiredPlan,
  feature,
  upgradeModal = false,
  fallback,
  disabled = false,
  tooltip = true,
  variant = 'default',
  className,
}: PlanGateProps) {
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false)
  const { plan: currentPlan, isLoading: planLoading } = useCurrentPlan()
  const { hasAccess, requiredPlan: featureRequiredPlan, isLoading: featureLoading } = useFeatureAccess(
    feature || 'can_send_email'
  )

  const isLoading = planLoading || featureLoading

  // Determine access based on feature or required plan
  const hasRequiredAccess = React.useMemo(() => {
    if (feature) {
      return hasAccess
    }
    
    if (requiredPlan && currentPlan) {
      const planLevels = { FREE: 0, BASIC: 1, PRO: 2 }
      const currentLevel = planLevels[currentPlan.name.toUpperCase() as keyof typeof planLevels] || 0
      const requiredLevel = planLevels[requiredPlan]
      return currentLevel >= requiredLevel
    }
    
    return true
  }, [feature, hasAccess, requiredPlan, currentPlan])

  const targetPlan = requiredPlan || featureRequiredPlan || 'BASIC'
  const planConfig = PLAN_CONFIG[targetPlan.toUpperCase() as keyof typeof PLAN_CONFIG]
  const featureConfig = feature ? FEATURE_DESCRIPTIONS[feature] : null

  const handleUpgradeClick = () => {
    if (upgradeModal) {
      setShowUpgradeModal(true)
    } else {
      window.location.href = '/dashboard/settings/billing'
    }
  }

  // Loading state
  if (isLoading) {
    return <PlanGateSkeleton>{children}</PlanGateSkeleton>
  }

  // Access granted - render children normally
  if (hasRequiredAccess && !disabled) {
    return <>{children}</>
  }

  // Access denied - show appropriate UI based on variant
  if (variant === 'minimal') {
    const content = (
      <div className={cn("relative", className)}>
        <div className="absolute inset-0 bg-black/10 rounded-lg z-10" />
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute top-2 right-2 z-20">
          <Badge className={cn("text-xs", planConfig?.bgColor, planConfig?.color)}>
            <Lock className="h-3 w-3 mr-1" />
            {planConfig?.name}
          </Badge>
        </div>
      </div>
    )

    if (!tooltip) return content

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-pointer" onClick={handleUpgradeClick}>
              {content}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              ეს ფუნქცია მისაწვდომია {planConfig?.name} გეგმიდან
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (variant === 'card') {
    return (
      <Card className={cn("border-dashed border-2", planConfig?.borderColor, className)}>
        <CardHeader className="text-center pb-4">
          <div className={cn(
            "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3",
            planConfig?.bgColor
          )}>
            {featureConfig?.icon ? (
              <span className="text-2xl">{featureConfig.icon}</span>
            ) : planConfig?.icon ? (
              <planConfig.icon className={cn("h-8 w-8", planConfig.color)} />
            ) : (
              <Lock className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <CardTitle className="text-lg">
            {featureConfig?.title || 'პრემიუმ ფუნქცია'}
          </CardTitle>
          <CardDescription>
            {featureConfig?.description || `ეს ფუნქცია მისაწვდომია ${planConfig?.name} გეგმიდან`}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {featureConfig?.benefits && (
            <div className="space-y-2">
              {featureConfig.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="space-y-3">
            <Badge className={cn("text-xs", planConfig?.bgColor, planConfig?.color)}>
              საჭიროა {planConfig?.name} გეგმა
            </Badge>
            
            <Button onClick={handleUpgradeClick} className="w-full">
              <TrendingUp className="h-4 w-4 mr-2" />
              გეგმის განახლება
            </Button>
          </div>
        </CardContent>

        {showUpgradeModal && (
          <QuickUpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            targetPlan={targetPlan.toLowerCase() as 'basic' | 'pro'}
            userId={currentPlan?.id || ''}
          />
        )}
      </Card>
    )
  }

  // Default variant - overlay on children
  const defaultContent = (
    <div className={cn("relative group", className)}>
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent rounded-lg z-10" />
      <div className="opacity-60 pointer-events-none">
        {children}
      </div>
      
      {/* Upgrade prompt overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <Card className="m-4 max-w-sm border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-2">
              {planConfig?.icon && (
                <planConfig.icon className={cn("h-5 w-5", planConfig.color)} />
              )}
              <Badge variant="outline" className={planConfig?.color}>
                {planConfig?.name}
              </Badge>
            </div>
            <CardTitle className="text-lg">
              {featureConfig?.title || 'პრემიუმ ფუნქცია'}
            </CardTitle>
            <CardDescription className="text-sm">
              {featureConfig?.description || `ეს ფუნქცია მისაწვდომია ${planConfig?.name} გეგმიდან`}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0">
            <Button 
              size="sm" 
              onClick={handleUpgradeClick}
              className="w-full"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              განახლება
            </Button>
          </CardContent>
        </Card>
      </div>

      {showUpgradeModal && (
        <QuickUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          targetPlan={targetPlan.toLowerCase() as 'basic' | 'pro'}
          userId={currentPlan?.id || ''}
        />
      )}
    </div>
  )

  // Custom fallback
  if (fallback) {
    return <>{fallback}</>
  }

  return defaultContent
}

// Skeleton loader for plan gate
function PlanGateSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="opacity-50">
        {children}
      </div>
      <div className="absolute top-2 right-2">
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  )
}

// Utility component for quick feature checks
export function FeatureGuard({ 
  feature, 
  children, 
  fallback 
}: { 
  feature: keyof PlanFeatures
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  const { hasAccess, isLoading } = useFeatureAccess(feature)

  if (isLoading) {
    return <PlanGateSkeleton>{children}</PlanGateSkeleton>
  }

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

// Higher-order component for plan-based access
export function withPlanGate<P extends object>(
  Component: React.ComponentType<P>,
  gateProps: Omit<PlanGateProps, 'children'>
) {
  return function PlanGatedComponent(props: P) {
    return (
      <PlanGate {...gateProps}>
        <Component {...props} />
      </PlanGate>
    )
  }
}

// Hook for conditional rendering based on plan access
export function usePlanGating() {
  const { plan } = useCurrentPlan()
  
  const renderIfPlan = React.useCallback((
    requiredPlan: keyof typeof PLAN_CONFIG, 
    content: React.ReactNode
  ) => {
    if (!plan) return null
    
    const planLevels = { FREE: 0, BASIC: 1, PRO: 2 }
    const currentLevel = planLevels[plan.name.toUpperCase() as keyof typeof planLevels] || 0
    const requiredLevel = planLevels[requiredPlan]
    
    return currentLevel >= requiredLevel ? content : null
  }, [plan])

  const renderIfFeature = React.useCallback((
    feature: keyof PlanFeatures,
    content: React.ReactNode
  ) => {
    if (!plan) return null
    
    return plan.features[feature] ? content : null
  }, [plan])

  return { renderIfPlan, renderIfFeature }
}