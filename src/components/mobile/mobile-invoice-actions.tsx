'use client'

import { useState } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { 
  Send, 
  CheckCircle, 
  Copy, 
  Trash2, 
  Eye, 
  Mail, 
  Download,
  MoreHorizontal,
  ArrowLeft,
  ArrowRight,
  Edit,
  FileText
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

import { cn } from '@/lib/utils'

interface SwipeAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  action: () => void
  destructive?: boolean
}

interface InvoiceData {
  id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  total: number
  currency: string
  due_date: string
  client: {
    id: string
    name: string
  }
}

interface MobileInvoiceActionsProps {
  invoice: InvoiceData
  onView?: () => void
  onEdit?: () => void
  onSend?: () => void
  onMarkPaid?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  className?: string
  disabled?: boolean
}

export function SwipeableInvoiceCard({ 
  invoice, 
  onView, 
  onEdit,
  onSend,
  onMarkPaid,
  onDuplicate,
  onDelete,
  className,
  disabled = false
}: MobileInvoiceActionsProps) {
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  
  const x = useMotionValue(0)
  const scale = useTransform(x, [-150, 0, 150], [0.95, 1, 0.95])
  const opacity = useTransform(x, [-150, 0, 150], [0.8, 1, 0.8])

  const getSwipeActions = (): { left: SwipeAction[]; right: SwipeAction[] } => {
    const leftActions: SwipeAction[] = []
    const rightActions: SwipeAction[] = []

    if (invoice.status === 'draft') {
      if (onSend) {
        leftActions.push({
          id: 'send',
          label: 'გაგზავნა',
          icon: Send,
          color: 'text-white',
          bgColor: 'bg-blue-500',
          action: onSend
        })
      }
      
      if (onDuplicate) {
        leftActions.push({
          id: 'duplicate',
          label: 'კოპირება',
          icon: Copy,
          color: 'text-white',
          bgColor: 'bg-green-500',
          action: onDuplicate
        })
      }
    } else if (invoice.status === 'sent' || invoice.status === 'overdue') {
      if (onMarkPaid) {
        leftActions.push({
          id: 'paid',
          label: 'გადახდილი',
          icon: CheckCircle,
          color: 'text-white',
          bgColor: 'bg-green-500',
          action: onMarkPaid
        })
      }

      leftActions.push({
        id: 'email',
        label: 'ემაილი',
        icon: Mail,
        color: 'text-white',
        bgColor: 'bg-purple-500',
        action: () => console.log('Send reminder')
      })
    }

    if (invoice.status === 'draft' && onDelete) {
      rightActions.push({
        id: 'delete',
        label: 'წაშლა',
        icon: Trash2,
        color: 'text-white',
        bgColor: 'bg-red-500',
        action: () => setShowDeleteDialog(true),
        destructive: true
      })
    }

    return { left: leftActions, right: rightActions }
  }

  const { left: leftActions, right: rightActions } = getSwipeActions()

  const handleDeleteConfirm = () => {
    onDelete?.()
    setShowDeleteDialog(false)
  }

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 80
    const swipeDistance = Math.abs(info.offset.x)
    
    if (swipeDistance > swipeThreshold && !disabled) {
      const direction = info.offset.x > 0 ? 'right' : 'left'
      const actions = direction === 'left' ? leftActions : rightActions
      
      if (actions.length > 0) {
        actions[0].action()
      }
    }

    x.set(0)
    setActiveAction(null)
  }

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return

    const swipeThreshold = 60
    const currentX = info.offset.x
    
    if (Math.abs(currentX) > swipeThreshold) {
      const direction = currentX > 0 ? 'right' : 'left'
      const actions = direction === 'left' ? leftActions : rightActions
      
      if (actions.length > 0) {
        setActiveAction(actions[0].id)
      }
    } else {
      setActiveAction(null)
    }
  }

  const renderSwipeIndicators = () => {
    const showLeft = x.get() < -60 && leftActions.length > 0
    const showRight = x.get() > 60 && rightActions.length > 0

    return (
      <>
        {showLeft && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {leftActions.map((action) => (
              <div
                key={action.id}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  action.bgColor,
                  activeAction === action.id && 'scale-110'
                )}
              >
                <action.icon className={cn('w-5 h-5', action.color)} />
              </div>
            ))}
            <ArrowLeft className="w-4 h-4 text-gray-400 ml-2" />
          </div>
        )}

        {showRight && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-gray-400 mr-2" />
            {rightActions.map((action) => (
              <div
                key={action.id}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  action.bgColor,
                  activeAction === action.id && 'scale-110'
                )}
              >
                <action.icon className={cn('w-5 h-5', action.color)} />
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-500'
    }
    return colors[status as keyof typeof colors] || colors.draft
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'გადასახდელი',
      sent: 'გაგზავნილი',
      paid: 'გადახდილი',
      overdue: 'ვადაგადაცილებული',
      cancelled: 'გაუქმებული'
    }
    return labels[status as keyof typeof labels] || status
  }

  return (
    <>
      <motion.div
        className={cn('relative overflow-hidden', className)}
        style={{ x, scale, opacity }}
        drag={disabled ? false : "x"}
        dragConstraints={{ left: -200, right: 200 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onDrag={handleDrag}
        whileTap={{ scale: 0.98 }}
      >
        {renderSwipeIndicators()}

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 
                    className="font-semibold text-gray-900 cursor-pointer hover:text-primary"
                    onClick={onView}
                  >
                    #{invoice.invoice_number}
                  </h3>
                  <Badge className={cn('text-xs', getStatusColor(invoice.status))}>
                    {getStatusLabel(invoice.status)}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-1">
                  {invoice.client.name}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    ვადა: {new Date(invoice.due_date).toLocaleDateString('ka-GE')}
                  </span>
                  {invoice.status === 'overdue' && (
                    <span className="text-red-600 font-medium">
                      ვადაგადაცილებული
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {invoice.total.toFixed(2)} {invoice.currency}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 mt-1"
                  onClick={() => setIsActionsOpen(true)}
                  disabled={disabled}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {!disabled && (leftActions.length > 0 || rightActions.length > 0) && (
              <div className="flex items-center justify-center py-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <ArrowLeft className="w-3 h-3" />
                  <span>გაასრიალეთ მოქმედებებისთვის</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Sheet open={isActionsOpen} onOpenChange={setIsActionsOpen}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>ინვოისის მოქმედებები</SheetTitle>
            <SheetDescription>
              #{invoice.invoice_number} - {invoice.client.name}
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => {
                onView?.()
                setIsActionsOpen(false)
              }}
            >
              <Eye className="h-5 w-5" />
              <span className="text-sm">ნახვა</span>
            </Button>

            {invoice.status === 'draft' && onEdit && (
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => {
                  onEdit()
                  setIsActionsOpen(false)
                }}
              >
                <Edit className="h-5 w-5" />
                <span className="text-sm">რედაქტირება</span>
              </Button>
            )}

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => {
                console.log('Download PDF')
                setIsActionsOpen(false)
              }}
            >
              <Download className="h-5 w-5" />
              <span className="text-sm">PDF</span>
            </Button>

            {leftActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => {
                  action.action()
                  setIsActionsOpen(false)
                }}
                disabled={disabled}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-sm">{action.label}</span>
              </Button>
            ))}

            {rightActions.map((action) => (
              <Button
                key={action.id}
                variant={action.destructive ? "destructive" : "outline"}
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => {
                  if (action.destructive) {
                    setIsActionsOpen(false)
                    setShowDeleteDialog(true)
                  } else {
                    action.action()
                    setIsActionsOpen(false)
                  }
                }}
                disabled={disabled}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-sm">{action.label}</span>
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ინვოისის წაშლა</AlertDialogTitle>
            <AlertDialogDescription>
              დარწმუნებული ხართ, რომ გსურთ ინვოისი #{invoice.invoice_number}-ის წაშლა? 
              ეს მოქმედება ვერ გაუქმდება.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              წაშლა
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface MobileInvoiceListProps {
  invoices: InvoiceData[]
  onViewInvoice: (invoice: InvoiceData) => void
  onEditInvoice: (invoice: InvoiceData) => void
  onSendInvoice?: (invoice: InvoiceData) => void
  onMarkPaid?: (invoice: InvoiceData) => void
  onDuplicateInvoice?: (invoice: InvoiceData) => void
  onDeleteInvoice?: (invoice: InvoiceData) => void
  className?: string
  disabled?: boolean
}

export function MobileInvoiceList({
  invoices,
  onViewInvoice,
  onEditInvoice,
  onSendInvoice,
  onMarkPaid,
  onDuplicateInvoice,
  onDeleteInvoice,
  className,
  disabled = false
}: MobileInvoiceListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {invoices.map((invoice) => (
        <SwipeableInvoiceCard
          key={invoice.id}
          invoice={invoice}
          onView={() => onViewInvoice(invoice)}
          onEdit={() => onEditInvoice(invoice)}
          onSend={onSendInvoice ? () => onSendInvoice(invoice) : undefined}
          onMarkPaid={onMarkPaid ? () => onMarkPaid(invoice) : undefined}
          onDuplicate={onDuplicateInvoice ? () => onDuplicateInvoice(invoice) : undefined}
          onDelete={onDeleteInvoice ? () => onDeleteInvoice(invoice) : undefined}
          disabled={disabled}
        />
      ))}
      
      {invoices.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">ინვოისები არ მოიძებნა</h3>
          <p className="mt-1 text-sm text-gray-500">შექმენით თქვენი პირველი ინვოისი დასაწყებად</p>
        </div>
      )}
    </div>
  )
}

interface MobileFABProps {
  onCreateInvoice: () => void
  className?: string
  disabled?: boolean
}

export function MobileFAB({ onCreateInvoice, className, disabled = false }: MobileFABProps) {
  return (
    <motion.div
      className={cn(
        'fixed bottom-20 right-4 z-40',
        className
      )}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 disabled:opacity-50"
        onClick={onCreateInvoice}
        disabled={disabled}
      >
        <motion.div
          whileHover={{ rotate: disabled ? 0 : 90 }}
          transition={{ duration: 0.2 }}
        >
          <Send className="h-6 w-6 text-white" />
        </motion.div>
      </Button>
    </motion.div>
  )
}

interface MobileQuickFiltersProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
  stats?: {
    total: number
    draft: number
    sent: number
    paid: number
    overdue: number
  }
  className?: string
  disabled?: boolean
}

export function MobileQuickFilters({
  activeFilter,
  onFilterChange,
  stats,
  className,
  disabled = false
}: MobileQuickFiltersProps) {
  const filters = [
    { id: 'all', label: 'ყველა', count: stats?.total || 0 },
    { id: 'draft', label: 'მონახაზები', count: stats?.draft || 0 },
    { id: 'sent', label: 'გაგზავნილი', count: stats?.sent || 0 },
    { id: 'paid', label: 'გადახდილი', count: stats?.paid || 0 },
    { id: 'overdue', label: 'ვადაგადაცილებული', count: stats?.overdue || 0 }
  ]

  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-2', className)}>
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? 'default' : 'outline'}
          size="sm"
          className="whitespace-nowrap flex-shrink-0"
          onClick={() => !disabled && onFilterChange(filter.id)}
          disabled={disabled}
        >
          {filter.label}
          {filter.count > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-5 px-2 text-xs"
            >
              {filter.count}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  )
}

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  className,
  disabled = false 
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || window.scrollY !== 0) return
    setStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || window.scrollY !== 0 || startY === 0) return
    
    const currentY = e.touches[0].clientY
    const distance = Math.max(0, (currentY - startY) * 0.5)
    setPullDistance(Math.min(distance, 100))
  }

  const handleTouchEnd = async () => {
    if (disabled) return

    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setPullDistance(0)
    setStartY(0)
  }

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(pullDistance > 0 || isRefreshing) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 bg-primary/10"
        >
          <div className="flex items-center gap-2 text-primary">
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0 }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.div>
            <span className="text-sm font-medium">
              {isRefreshing ? 'განახლება...' : pullDistance > 60 ? 'გაუშვით განახლებისთვის' : 'ჩამოიწიეთ განახლებისთვის'}
            </span>
          </div>
        </motion.div>
      )}

      <motion.div
        animate={{ y: isRefreshing ? 60 : pullDistance }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  )
}