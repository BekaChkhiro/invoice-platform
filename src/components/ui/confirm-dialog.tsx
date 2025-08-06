'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2, Check, X, AlertCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ConfirmDialogOptions {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive' | 'warning'
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: ConfirmDialogOptions
  loading?: boolean
}

export function ConfirmDialog({ open, onOpenChange, options, loading }: ConfirmDialogProps) {
  const {
    title,
    description,
    confirmLabel = 'დადასტურება',
    cancelLabel = 'გაუქმება',
    variant = 'default',
    onConfirm,
    onCancel
  } = options

  const handleConfirm = async () => {
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      // Error handling is done by the calling component
      console.error('Confirm action failed:', error)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <Trash2 className="w-6 h-6 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />
      default:
        return <AlertCircle className="w-6 h-6 text-blue-600" />
    }
  }

  const getActionButtonProps = () => {
    switch (variant) {
      case 'destructive':
        return {
          className: 'bg-red-600 hover:bg-red-700 text-white'
        }
      case 'warning':
        return {
          className: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        }
      default:
        return {}
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            {...getActionButtonProps()}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                მოლოდინა...
              </div>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook for managing confirmation dialogs
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null)
  const [loading, setLoading] = useState(false)

  const confirm = (dialogOptions: ConfirmDialogOptions) => {
    setOptions({
      ...dialogOptions,
      onConfirm: async () => {
        setLoading(true)
        try {
          await dialogOptions.onConfirm()
        } finally {
          setLoading(false)
        }
      }
    })
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setLoading(false)
    setOptions(null)
  }

  const ConfirmDialogComponent = options ? (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      options={options}
      loading={loading}
    />
  ) : null

  return {
    confirm,
    close,
    ConfirmDialog: ConfirmDialogComponent
  }
}

// Pre-configured confirmation dialogs for common actions
export const confirmDialogs = {
  deleteInvoice: (invoiceNumber: string, onConfirm: () => void | Promise<void>): ConfirmDialogOptions => ({
    title: 'ინვოისის წაშლა',
    description: `ნამდვილად გსურთ ინვოისი "${invoiceNumber}"-ის წაშლა? ეს მოქმედება შეუქცევადია და კრედიტი დაბრუნდება თქვენს ანგარიშზე.`,
    confirmLabel: 'წაშლა',
    cancelLabel: 'გაუქმება',
    variant: 'destructive',
    onConfirm
  }),

  deleteClient: (clientName: string, hasInvoices: boolean, onConfirm: () => void | Promise<void>): ConfirmDialogOptions => ({
    title: 'კლიენტის წაშლა',
    description: hasInvoices 
      ? `კლიენტი "${clientName}" არააქტიურ რეჟიმში გადავა, რადგან მას აქვს ინვოისები. ნამდვილად გსურთ გაგრძელება?`
      : `ნამდვილად გსურთ კლიენტი "${clientName}"-ის სრული წაშლა? ეს მოქმედება შეუქცევადია.`,
    confirmLabel: hasInvoices ? 'დეაქტივაცია' : 'წაშლა',
    cancelLabel: 'გაუქმება',
    variant: 'destructive',
    onConfirm
  }),

  bulkDelete: (count: number, type: 'invoices' | 'clients', onConfirm: () => void | Promise<void>): ConfirmDialogOptions => ({
    title: `${type === 'invoices' ? 'ინვოისების' : 'კლიენტების'} წაშლა`,
    description: `ნამდვილად გსურთ შერჩეული ${count} ${type === 'invoices' ? 'ინვოისის' : 'კლიენტის'} წაშლა? ეს მოქმედება შეუქცევადია.`,
    confirmLabel: 'ყველას წაშლა',
    cancelLabel: 'გაუქმება',
    variant: 'destructive',
    onConfirm
  }),

  unsavedChanges: (onConfirm: () => void | Promise<void>): ConfirmDialogOptions => ({
    title: 'შეუნახავი ცვლილებები',
    description: 'გაქვთ შეუნახავი ცვლილებები. ნამდვილად გსურთ გვერდის დატოვება? ყველა ცვლილება დაიკარგება.',
    confirmLabel: 'გვერდის დატოვება',
    cancelLabel: 'დარჩენა',
    variant: 'warning',
    onConfirm
  }),

  statusChange: (itemName: string, newStatus: string, onConfirm: () => void | Promise<void>): ConfirmDialogOptions => ({
    title: 'სტატუსის შეცვლა',
    description: `გსურთ "${itemName}"-ის სტატუსის შეცვლა "${newStatus}"-ზე?`,
    confirmLabel: 'შეცვლა',
    cancelLabel: 'გაუქმება',
    variant: 'default',
    onConfirm
  }),

  sendInvoice: (invoiceNumber: string, email: string, onConfirm: () => void | Promise<void>): ConfirmDialogOptions => ({
    title: 'ინვოისის გაგზავნა',
    description: `ნამდვილად გსურთ ინვოისი "${invoiceNumber}"-ის გაგზავნა მისამართზე "${email}"? ინვოისის სტატუსი შეიცვლება "გაგზავნილი"-ზე.`,
    confirmLabel: 'გაგზავნა',
    cancelLabel: 'გაუქმება',
    variant: 'default',
    onConfirm
  }),

  markAsPaid: (invoiceNumber: string, onConfirm: () => void | Promise<void>): ConfirmDialogOptions => ({
    title: 'გადახდილად მონიშვნა',
    description: `ნამდვილად გსურთ ინვოისი "${invoiceNumber}"-ის გადახდილად მონიშვნა?`,
    confirmLabel: 'მონიშვნა გადახდილად',
    cancelLabel: 'გაუქმება',
    variant: 'default',
    onConfirm
  })
}

// Unsaved changes warning hook
export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const warnIfUnsaved = (onConfirm: () => void) => {
    if (hasUnsavedChanges) {
      confirm(confirmDialogs.unsavedChanges(onConfirm))
    } else {
      onConfirm()
    }
  }

  // Browser beforeunload warning
  useState(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'გაქვთ შეუნახავი ცვლილებები. ნამდვილად გსურთ გვერდის დატოვება?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  return {
    warnIfUnsaved,
    ConfirmDialog
  }
}