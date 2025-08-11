"use client"

import * as React from "react"
import { AlertCircle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UsageProgressProps {
  used: number
  limit: number | null
  resource?: 'invoices' | 'clients' | 'storage'
  period?: string
  showUpgradePrompt?: boolean
  className?: string
}

export function UsageProgress({
  used,
  limit,
  resource = 'invoices',
  period = 'ამ თვეში',
  showUpgradePrompt = true,
  className
}: UsageProgressProps) {
  const isUnlimited = limit === null
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100)
  const remaining = isUnlimited ? null : Math.max(limit - used, 0)
  
  const getProgressColor = () => {
    if (isUnlimited) return 'bg-primary'
    if (percentage >= 95) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }
  
  const getTextColor = () => {
    if (isUnlimited) return 'text-muted-foreground'
    if (percentage >= 95) return 'text-red-600'
    if (percentage >= 80) return 'text-yellow-600'
    return 'text-muted-foreground'
  }
  
  const getResourceLabel = () => {
    switch (resource) {
      case 'invoices':
        return 'ინვოისი'
      case 'clients':
        return 'კლიენტი'
      case 'storage':
        return 'MB'
      default:
        return ''
    }
  }

  const shouldShowWarning = !isUnlimited && percentage >= 80
  const shouldShowUpgrade = showUpgradePrompt && !isUnlimited && percentage >= 90

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className={cn("font-medium", getTextColor())}>
          {isUnlimited ? (
            <>ულიმიტო {getResourceLabel()} {period}</>
          ) : (
            <>
              {used} / {limit} {getResourceLabel()} გამოყენებული {period}
            </>
          )}
        </span>
        {!isUnlimited && (
          <span className={cn("text-xs", getTextColor())}>
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
      
      {!isUnlimited && (
        <div className="relative">
          <Progress 
            value={percentage} 
            className="h-2"
          />
          <div 
            className={cn(
              "absolute inset-0 h-2 rounded-full transition-all",
              getProgressColor()
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      
      {!isUnlimited && remaining !== null && (
        <p className="text-xs text-muted-foreground">
          დარჩენილია {remaining} {getResourceLabel()}
        </p>
      )}
      
      {shouldShowWarning && !shouldShowUpgrade && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            თქვენ უახლოვდებით {resource === 'invoices' ? 'ინვოისების' : resource === 'clients' ? 'კლიენტების' : 'საცავის'} ლიმიტს. 
            {remaining !== null && ` დარჩენილია მხოლოდ ${remaining} ${getResourceLabel()}.`}
          </AlertDescription>
        </Alert>
      )}
      
      {shouldShowUpgrade && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <TrendingUp className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200 space-y-2">
            <p>
              თქვენ მიაღწიეთ {percentage >= 100 ? '' : 'თითქმის '} 
              {resource === 'invoices' ? 'ინვოისების' : resource === 'clients' ? 'კლიენტების' : 'საცავის'} ლიმიტს!
            </p>
            <Button 
              size="sm" 
              variant="destructive"
              className="w-full sm:w-auto"
              asChild
            >
              <Link href="/dashboard/subscription">
                გეგმის განახლება
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

interface MultiResourceUsageProps {
  invoices?: { used: number; limit: number | null }
  clients?: { used: number; limit: number | null }
  storage?: { used: number; limit: number | null }
  period?: string
  className?: string
}

export function MultiResourceUsage({
  invoices,
  clients,
  storage,
  period = 'ამ თვეში',
  className
}: MultiResourceUsageProps) {
  const resources = [
    invoices && { ...invoices, resource: 'invoices' as const, label: 'ინვოისები' },
    clients && { ...clients, resource: 'clients' as const, label: 'კლიენტები' },
    storage && { ...storage, resource: 'storage' as const, label: 'საცავი' },
  ].filter(Boolean) as Array<{
    used: number
    limit: number | null
    resource: 'invoices' | 'clients' | 'storage'
    label: string
  }>

  if (resources.length === 0) return null

  const hasAnyWarning = resources.some(r => 
    r.limit !== null && (r.used / r.limit) * 100 >= 80
  )

  return (
    <div className={cn("space-y-4", className)}>
      {resources.map((resource) => (
        <div key={resource.resource} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{resource.label}</span>
            <span className="text-xs text-muted-foreground">
              {resource.limit === null ? (
                'ულიმიტო'
              ) : (
                `${resource.used} / ${resource.limit}`
              )}
            </span>
          </div>
          <UsageProgress
            used={resource.used}
            limit={resource.limit}
            resource={resource.resource}
            period={period}
            showUpgradePrompt={false}
            className="!mt-1"
          />
        </div>
      ))}
      
      {hasAnyWarning && (
        <Button 
          size="sm" 
          variant="outline"
          className="w-full"
          asChild
        >
          <Link href="/dashboard/subscription">
            <TrendingUp className="h-4 w-4 mr-2" />
            გეგმის განახლება
          </Link>
        </Button>
      )}
    </div>
  )
}