"use client"

import * as React from "react"
import { AlertTriangle, TrendingUp, X, Zap, Clock, Ban } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { QuickUpgradeModal } from "@/components/subscription/upgrade-modal"
import { useCurrentPlan } from "@/hooks/use-subscription"

// Warning level configurations
const WARNING_LEVELS = {
  80: {
    level: 'warning',
    title: 'ფრთხილად! ახლოვდებით ლიმიტს',
    message: 'თქვენ გამოიყენეთ 80%-ზე მეტი',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-900',
    icon: Clock,
    urgent: false,
  },
  90: {
    level: 'critical',
    title: 'ლიმიტი კრიტიკულ დონეზეა',
    message: 'მხოლოდ რამდენიმე ინვოისი დარჩა',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-900',
    icon: AlertTriangle,
    urgent: true,
  },
  100: {
    level: 'blocked',
    title: 'ლიმიტი ამოწურულია',
    message: 'ახალი ინვოისების შექმნა შეუძლებელია',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-900',
    icon: Ban,
    urgent: true,
  },
} as const

// Resource type configurations
const RESOURCE_CONFIGS = {
  invoices: {
    name: 'ინვოისები',
    nameGenitive: 'ინვოისების',
    unit: 'ინვოისი',
    icon: '📄',
  },
  emails: {
    name: 'ელ.ფოსტები',
    nameGenitive: 'ელ.ფოსტების',
    unit: 'ელ.ფოსტა',
    icon: '📧',
  },
  clients: {
    name: 'კლიენტები',
    nameGenitive: 'კლიენტების',
    unit: 'კლიენტი',
    icon: '👥',
  },
  storage: {
    name: 'მეხსიერება',
    nameGenitive: 'მეხსიერების',
    unit: 'MB',
    icon: '💾',
  },
} as const

interface LimitWarningProps {
  usage: {
    used: number
    limit: number
    percentage: number
    remaining?: number
  }
  resourceType: keyof typeof RESOURCE_CONFIGS
  variant?: 'banner' | 'card' | 'toast' | 'modal' | 'inline'
  onUpgrade?: () => void
  onDismiss?: () => void
  showProgress?: boolean
  dismissible?: boolean
  className?: string
}

export function LimitWarning({
  usage,
  resourceType,
  variant = 'banner',
  onUpgrade,
  onDismiss,
  showProgress = true,
  dismissible = false,
  className,
}: LimitWarningProps) {
  const [isDismissed, setIsDismissed] = React.useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false)
  const { plan } = useCurrentPlan()

  // Determine warning level based on percentage
  const warningLevel = React.useMemo(() => {
    if (usage.percentage >= 100) return WARNING_LEVELS[100]
    if (usage.percentage >= 90) return WARNING_LEVELS[90]
    if (usage.percentage >= 80) return WARNING_LEVELS[80]
    return null
  }, [usage.percentage])

  const resourceConfig = RESOURCE_CONFIGS[resourceType]

  // Don't show warning if no warning level or dismissed
  if (!warningLevel || isDismissed) return null

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      setShowUpgradeModal(true)
    }
  }

  const WarningIcon = warningLevel.icon
  const remaining = usage.remaining || Math.max(0, usage.limit - usage.used)

  // Toast variant
  if (variant === 'toast') {
    React.useEffect(() => {
      toast.error(warningLevel.title, {
        description: `${resourceConfig.nameGenitive} დარჩენილია: ${remaining} ${resourceConfig.unit}`,
        duration: 5000,
        action: {
          label: 'განახლება',
          onClick: handleUpgrade,
        },
      })
    }, [warningLevel.title, resourceConfig, remaining, handleUpgrade])
    
    return null
  }

  // Modal variant
  if (variant === 'modal') {
    return (
      <Dialog open={true} onOpenChange={handleDismiss}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className={cn(
              "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4",
              warningLevel.bgColor
            )}>
              <WarningIcon className={cn("h-8 w-8", warningLevel.color)} />
            </div>
            <DialogTitle className={warningLevel.color}>
              {warningLevel.title}
            </DialogTitle>
            <DialogDescription>
              თქვენ გამოიყენეთ {usage.used} {resourceConfig.unit} {usage.limit}-დან.
              {remaining > 0 && ` დარჩენილია ${remaining} ${resourceConfig.unit}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {showProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{resourceConfig.name}</span>
                  <span>{usage.percentage.toFixed(0)}%</span>
                </div>
                <Progress 
                  value={usage.percentage} 
                  className={cn(
                    "h-2",
                    usage.percentage >= 90 && "[&>div]:bg-red-500"
                  )}
                />
              </div>
            )}

            <div className="flex gap-3">
              {dismissible && (
                <Button variant="outline" onClick={handleDismiss} className="flex-1">
                  დახურვა
                </Button>
              )}
              <Button onClick={handleUpgrade} className="flex-1">
                <TrendingUp className="h-4 w-4 mr-2" />
                განახლება
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <Alert className={cn(
        warningLevel.borderColor,
        warningLevel.bgColor,
        className
      )}>
        <WarningIcon className={cn("h-4 w-4", warningLevel.color)} />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <p className={cn("font-medium", warningLevel.color)}>
              {warningLevel.title}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {usage.used} / {usage.limit} {resourceConfig.unit} გამოყენებული
              {remaining > 0 && ` (დარჩენილია ${remaining})`}
            </p>
            {showProgress && (
              <Progress 
                value={usage.percentage} 
                className="mt-2 h-2"
              />
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Button
              size="sm"
              onClick={handleUpgrade}
              className={warningLevel.urgent ? "animate-pulse" : ""}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              განახლება
            </Button>
            
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </AlertDescription>
        
        {showUpgradeModal && (
          <QuickUpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            targetPlan="basic"
            userId={plan?.id || ''}
          />
        )}
      </Alert>
    )
  }

  // Card variant
  if (variant === 'card') {
    return (
      <Card className={cn(
        warningLevel.borderColor,
        warningLevel.bgColor,
        "relative",
        className
      )}>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="absolute top-2 right-2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              warningLevel.bgColor,
              warningLevel.borderColor,
              "border-2"
            )}>
              <WarningIcon className={cn("h-5 w-5", warningLevel.color)} />
            </div>
            <div className="flex-1">
              <CardTitle className={cn("text-base", warningLevel.color)}>
                {warningLevel.title}
              </CardTitle>
              <CardDescription>
                {resourceConfig.nameGenitive} ლიმიტი: {usage.used} / {usage.limit}
              </CardDescription>
            </div>
            {warningLevel.urgent && (
              <Badge variant="destructive" className="animate-pulse">
                გადაუდებელი
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {showProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>გამოყენება</span>
                <span className="font-medium">
                  {usage.percentage.toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={usage.percentage} 
                className={cn(
                  "h-3",
                  usage.percentage >= 90 && "[&>div]:bg-red-500"
                )}
              />
              {remaining > 0 && (
                <p className="text-xs text-muted-foreground">
                  დარჩენილია {remaining} {resourceConfig.unit}
                </p>
              )}
            </div>
          )}
          
          <div className="text-sm space-y-2">
            <p className="font-medium">რა შეიძლება გააკეთოთ:</p>
            <ul className="space-y-1 ml-4">
              <li className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-blue-500" />
                <span>განაახლეთ გეგმა მეტი {resourceConfig.nameGenitive} მისაღებად</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-orange-500" />
                <span>ელოდეთ მომავალ თვეს ლიმიტის განახლებას</span>
              </li>
            </ul>
          </div>
          
          <Button
            onClick={handleUpgrade}
            className={cn(
              "w-full",
              warningLevel.urgent && "animate-pulse"
            )}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            გეგმის განახლება
          </Button>
        </CardContent>
        
        {showUpgradeModal && (
          <QuickUpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            targetPlan="basic"
            userId={plan?.id || ''}
          />
        )}
      </Card>
    )
  }

  // Inline variant (minimal)
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border",
      warningLevel.borderColor,
      warningLevel.bgColor,
      className
    )}>
      <WarningIcon className={cn("h-4 w-4", warningLevel.color)} />
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm", warningLevel.color)}>
          {warningLevel.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {usage.used} / {usage.limit} {resourceConfig.unit}
        </p>
      </div>
      
      <Button
        size="sm"
        variant="outline"
        onClick={handleUpgrade}
        className="shrink-0"
      >
        განახლება
      </Button>
      
      {dismissible && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="shrink-0 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      {showUpgradeModal && (
        <QuickUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          targetPlan="basic"
          userId={plan?.id || ''}
        />
      )}
    </div>
  )
}

// Multi-resource limit warning
interface MultiLimitWarningProps {
  limits: Array<{
    resourceType: keyof typeof RESOURCE_CONFIGS
    usage: {
      used: number
      limit: number
      percentage: number
      remaining?: number
    }
  }>
  variant?: 'banner' | 'card'
  className?: string
}

export function MultiLimitWarning({ 
  limits, 
  variant = 'card', 
  className 
}: MultiLimitWarningProps) {
  const warningLimits = limits.filter(limit => limit.usage.percentage >= 80)
  
  if (warningLimits.length === 0) return null
  
  const hasUrgent = warningLimits.some(limit => limit.usage.percentage >= 90)
  
  if (variant === 'banner') {
    return (
      <Alert className={cn(
        hasUrgent 
          ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950"
          : "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950",
        className
      )}>
        <AlertTriangle className={cn(
          "h-4 w-4",
          hasUrgent ? "text-orange-600" : "text-yellow-600"
        )} />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <p className={cn(
                "font-medium",
                hasUrgent ? "text-orange-600" : "text-yellow-600"
              )}>
                {warningLimits.length} ლიმიტი ახლოვდება ამოწურვას
              </p>
              <div className="flex gap-4 mt-1">
                {warningLimits.map(({ resourceType, usage }) => (
                  <span key={resourceType} className="text-sm text-muted-foreground">
                    {RESOURCE_CONFIGS[resourceType].name}: {usage.percentage.toFixed(0)}%
                  </span>
                ))}
              </div>
            </div>
            <Button size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              განახლება
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className={cn(
            "h-5 w-5",
            hasUrgent ? "text-orange-600" : "text-yellow-600"
          )} />
          გამოყენების ლიმიტები
        </CardTitle>
        <CardDescription>
          {warningLimits.length} ლიმიტი ახლოვდება ამოწურვას
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {warningLimits.map(({ resourceType, usage }) => (
          <div key={resourceType} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">
                {RESOURCE_CONFIGS[resourceType].icon}
              </span>
              <div>
                <p className="font-medium text-sm">
                  {RESOURCE_CONFIGS[resourceType].name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {usage.used} / {usage.limit}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={usage.percentage >= 90 ? "destructive" : "secondary"}>
                {usage.percentage.toFixed(0)}%
              </Badge>
            </div>
          </div>
        ))}
        <Button className="w-full mt-4">
          <TrendingUp className="h-4 w-4 mr-2" />
          გეგმის განახლება
        </Button>
      </CardContent>
    </Card>
  )
}

// Hook for automatic limit warnings
export function useLimitWarnings(
  limits: Array<{
    resourceType: keyof typeof RESOURCE_CONFIGS
    usage: { used: number; limit: number; percentage: number }
  }>
) {
  const [dismissedWarnings, setDismissedWarnings] = React.useState<Set<string>>(new Set())

  // Show toast warnings for critical limits
  React.useEffect(() => {
    limits.forEach(({ resourceType, usage }) => {
      const key = `${resourceType}-${usage.percentage >= 90 ? 'critical' : 'warning'}`
      
      if (usage.percentage >= 80 && !dismissedWarnings.has(key)) {
        const warningLevel = usage.percentage >= 90 
          ? WARNING_LEVELS[90] 
          : WARNING_LEVELS[80]
          
        toast.warning(warningLevel.title, {
          description: `${RESOURCE_CONFIGS[resourceType].name}: ${usage.used}/${usage.limit}`,
          duration: usage.percentage >= 90 ? 10000 : 5000,
        })
        
        setDismissedWarnings(prev => new Set(prev).add(key))
      }
    })
  }, [limits, dismissedWarnings])

  const clearDismissed = () => setDismissedWarnings(new Set())
  
  return { clearDismissed }
}