'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  FileText, 
  Users, 
  BarChart3, 
  Send, 
  Download, 
  Settings, 
  HelpCircle,
  CreditCard,
  Printer,
  Mail,
  Calendar
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

import { useAuth } from '@/lib/hooks/use-auth'

// =====================================
// TYPES AND INTERFACES
// =====================================

interface QuickAction {
  id: string
  title: string
  description: string
  icon: any
  color: string
  href?: string
  onClick?: () => void
  badge?: string | number
  disabled?: boolean
  category: 'primary' | 'secondary' | 'utility'
}

interface QuickActionsProps {
  loading?: boolean
}

// =====================================
// MAIN COMPONENT
// =====================================

export function QuickActions({ loading }: QuickActionsProps) {
  const router = useRouter()
  const { user, company } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  if (loading) {
    return <QuickActionsSkeleton />
  }

  // Navigation handlers
  const handleNavigate = (href: string) => {
    setIsLoading(true)
    router.push(href)
    // Reset loading state after navigation
    setTimeout(() => setIsLoading(false), 500)
  }

  const handleCustomAction = async (actionId: string) => {
    setIsLoading(true)
    
    try {
      switch (actionId) {
        case 'bulk-send':
          console.log('Bulk send invoices')
          // Implement bulk send logic
          break
        case 'export-data':
          console.log('Export data')
          // Implement data export logic
          break
        case 'print-reports':
          console.log('Print reports')
          // Implement print reports logic
          break
        case 'email-reminder':
          console.log('Send email reminders')
          // Implement email reminder logic
          break
        default:
          console.log('Unknown action:', actionId)
      }
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Define quick actions
  const quickActions: QuickAction[] = [
    // Primary Actions
    {
      id: 'create-invoice',
      title: 'ახალი ინვოისი',
      description: 'შექმენით ახალი ინვოისი',
      icon: Plus,
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
      href: '/dashboard/invoices/new',
      category: 'primary'
    },
    {
      id: 'add-client',
      title: 'ახალი კლიენტი',
      description: 'დაამატეთ ახალი კლიენტი',
      icon: Users,
      color: 'text-green-600 bg-green-50 hover:bg-green-100',
      href: '/dashboard/clients/new',
      category: 'primary'
    },
    {
      id: 'view-invoices',
      title: 'ყველა ინვოისი',
      description: 'ნახეთ ყველა ინვოისი',
      icon: FileText,
      color: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
      href: '/dashboard/invoices',
      badge: '12', // This would come from actual data
      category: 'primary'
    },
    {
      id: 'analytics',
      title: 'ანალიტიკა',
      description: 'ნახეთ დეტალური რეპორტები',
      icon: BarChart3,
      color: 'text-orange-600 bg-orange-50 hover:bg-orange-100',
      href: '/dashboard/analytics',
      category: 'primary'
    },
    
    // Secondary Actions
    {
      id: 'bulk-send',
      title: 'ინვოისების გაგზავნა',
      description: 'გაგზავნეთ მრავალი ინვოისი',
      icon: Send,
      color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100',
      onClick: () => handleCustomAction('bulk-send'),
      category: 'secondary'
    },
    {
      id: 'export-data',
      title: 'მონაცემების ექსპორტი',
      description: 'ჩამოტვირთეთ CSV/Excel',
      icon: Download,
      color: 'text-teal-600 bg-teal-50 hover:bg-teal-100',
      onClick: () => handleCustomAction('export-data'),
      category: 'secondary'
    },
    {
      id: 'payment-tracking',
      title: 'გადახდების თვალყურება',
      description: 'ნახეთ გადახდების სტატუსი',
      icon: CreditCard,
      color: 'text-rose-600 bg-rose-50 hover:bg-rose-100',
      href: '/dashboard/payments',
      badge: '3',
      category: 'secondary'
    },
    {
      id: 'calendar',
      title: 'კალენდარი',
      description: 'ვადების მიხედვით',
      icon: Calendar,
      color: 'text-cyan-600 bg-cyan-50 hover:bg-cyan-100',
      href: '/dashboard/calendar',
      category: 'secondary'
    },

    // Utility Actions
    {
      id: 'print-reports',
      title: 'რეპორტების ბეჭდვა',
      description: 'დაბეჭდეთ თვიური რეპორტი',
      icon: Printer,
      color: 'text-gray-600 bg-gray-50 hover:bg-gray-100',
      onClick: () => handleCustomAction('print-reports'),
      category: 'utility'
    },
    {
      id: 'email-reminder',
      title: 'შეხსენების გაგზავნა',
      description: 'გაგზავნეთ ავტომატური შეხსენება',
      icon: Mail,
      color: 'text-amber-600 bg-amber-50 hover:bg-amber-100',
      onClick: () => handleCustomAction('email-reminder'),
      category: 'utility'
    },
    {
      id: 'settings',
      title: 'პარამეტრები',
      description: 'კონფიგურაცია და პარამეტრები',
      icon: Settings,
      color: 'text-slate-600 bg-slate-50 hover:bg-slate-100',
      href: '/dashboard/settings',
      category: 'utility'
    },
    {
      id: 'help',
      title: 'დახმარება',
      description: 'გაიგეთ როგორ გამოიყენოთ',
      icon: HelpCircle,
      color: 'text-violet-600 bg-violet-50 hover:bg-violet-100',
      href: '/dashboard/help',
      category: 'utility'
    }
  ]

  // Group actions by category
  const primaryActions = quickActions.filter(action => action.category === 'primary')
  const secondaryActions = quickActions.filter(action => action.category === 'secondary')
  const utilityActions = quickActions.filter(action => action.category === 'utility')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">სწრაფი ქმედებები</CardTitle>
            <CardDescription>
              ყველაზე გამოყენებადი ფუნქციები
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            {quickActions.length} ქმედება
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Primary Actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            ძირითადი ქმედებები
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {primaryActions.map(action => (
              <QuickActionItem 
                key={action.id} 
                action={action} 
                onClick={() => action.href ? handleNavigate(action.href) : action.onClick?.()} 
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Secondary Actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            დამატებითი ქმედებები
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {secondaryActions.map(action => (
              <QuickActionItem 
                key={action.id} 
                action={action} 
                onClick={() => action.href ? handleNavigate(action.href) : action.onClick?.()} 
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Utility Actions */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
            კომუნალური ქმედებები
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {utilityActions.map(action => (
              <QuickActionItem 
                key={action.id} 
                action={action} 
                onClick={() => action.href ? handleNavigate(action.href) : action.onClick?.()} 
                disabled={isLoading}
              />
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>კომპანია: {company?.name}</span>
              <span>მომხმარებელი: {user?.email}</span>
            </div>
            <span>განახლებულია: {new Date().toLocaleTimeString('ka-GE')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================
// QUICK ACTION ITEM COMPONENT
// =====================================

interface QuickActionItemProps {
  action: QuickAction
  onClick: () => void
  disabled?: boolean
}

function QuickActionItem({ action, onClick, disabled }: QuickActionItemProps) {
  const IconComponent = action.icon

  return (
    <Button
      variant="ghost"
      className={`h-auto p-4 flex flex-col items-center gap-2 hover:scale-[1.02] transition-all duration-200 ${action.color} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled || action.disabled}
    >
      {/* Icon with Badge */}
      <div className="relative">
        <div className="p-3 rounded-lg">
          <IconComponent className="h-6 w-6" />
        </div>
        {action.badge && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {action.badge}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
          {action.title}
        </p>
        <p className="text-xs text-gray-500 truncate max-w-[120px] mt-1">
          {action.description}
        </p>
      </div>
    </Button>
  )
}

// =====================================
// MOBILE QUICK ACTIONS
// =====================================

export function MobileQuickActions() {
  const router = useRouter()
  
  const mobileActions = [
    {
      id: 'create-invoice-mobile',
      title: 'ინვოისი',
      icon: Plus,
      color: 'bg-blue-500 text-white',
      href: '/dashboard/invoices/new'
    },
    {
      id: 'add-client-mobile',
      title: 'კლიენტი',
      icon: Users,
      color: 'bg-green-500 text-white',
      href: '/dashboard/clients/new'
    },
    {
      id: 'view-all-mobile',
      title: 'ყველა',
      icon: FileText,
      color: 'bg-purple-500 text-white',
      href: '/dashboard/invoices'
    },
    {
      id: 'analytics-mobile',
      title: 'რეპორტი',
      icon: BarChart3,
      color: 'bg-orange-500 text-white',  
      href: '/dashboard/analytics'
    }
  ]

  return (
    <div className="fixed bottom-4 left-4 right-4 md:hidden">
      <Card className="shadow-lg">
        <CardContent className="p-3">
          <div className="flex justify-around">
            {mobileActions.map(action => {
              const IconComponent = action.icon
              return (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center gap-1 h-auto p-2 ${action.color} hover:scale-105`}
                  onClick={() => router.push(action.href)}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="text-xs">{action.title}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =====================================
// LOADING SKELETON
// =====================================

function QuickActionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Primary Actions Skeleton */}
        <div>
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>

        <Skeleton className="h-px w-full" />

        {/* Secondary Actions Skeleton */}
        <div>
          <Skeleton className="h-4 w-36 mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>

        <Skeleton className="h-px w-full" />

        {/* Utility Actions Skeleton */}
        <div>
          <Skeleton className="h-4 w-40 mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-4 w-18" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================
// EXPORT TYPES
// =====================================

export type { QuickAction, QuickActionsProps }