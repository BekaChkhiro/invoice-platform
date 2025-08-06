'use client'

import { useState } from 'react'
import { Mail, Check, Trash2, Download, X, FileText, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

import { useBulkInvoiceOperations } from '@/lib/hooks/use-invoices'

interface BulkActionsProps {
  selectedInvoices: string[]
  onClearSelection: () => void
  onRefresh?: () => void
}

interface BulkOperation {
  id: string
  type: 'send' | 'mark-paid' | 'delete' | 'export'
  label: string
  icon: any
  total: number
  completed: number
  failed: number
  isRunning: boolean
  errors: string[]
}

export function BulkActions({ selectedInvoices, onClearSelection, onRefresh }: BulkActionsProps) {
  const [confirmAction, setConfirmAction] = useState<{ type: string; title: string; description: string } | null>(null)
  const [runningOperations, setRunningOperations] = useState<BulkOperation[]>([])
  
  const { bulkUpdateStatus } = useBulkInvoiceOperations()

  const selectedCount = selectedInvoices.length

  if (selectedCount === 0) {
    return null
  }

  const updateOperation = (id: string, updates: Partial<BulkOperation>) => {
    setRunningOperations(prev => 
      prev.map(op => op.id === id ? { ...op, ...updates } : op)
    )
  }

  const removeOperation = (id: string) => {
    setRunningOperations(prev => prev.filter(op => op.id !== id))
  }

  const startOperation = (type: string, label: string, icon: any) => {
    const operationId = `${type}-${Date.now()}`
    const operation: BulkOperation = {
      id: operationId,
      type: type as any,
      label,
      icon,
      total: selectedCount,
      completed: 0,
      failed: 0,
      isRunning: true,
      errors: []
    }
    
    setRunningOperations(prev => [...prev, operation])
    return operationId
  }

  const handleBulkSend = async () => {
    const operationId = startOperation('send', 'ინვოისების გაგზავნა', Mail)
    
    try {
      const results = await Promise.allSettled(
        selectedInvoices.map(async (invoiceId) => {
          const response = await fetch(`/api/invoices/${invoiceId}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attachPDF: true })
          })
          
          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'გაგზავნა ვერ მოხერხდა')
          }
          
          return invoiceId
        })
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected')
      
      updateOperation(operationId, {
        completed: successful,
        failed: failed.length,
        isRunning: false,
        errors: failed.map(r => r.status === 'rejected' ? r.reason.message : '')
      })

      if (successful > 0) {
        toast.success(`${successful} ინვოისი წარმატებით გაიგზავნა`)
        onRefresh?.()
      }
      
      if (failed.length > 0) {
        toast.error(`${failed.length} ინვოისის გაგზავნა ვერ მოხერხდა`)
      }

    } catch (error) {
      updateOperation(operationId, {
        failed: selectedCount,
        isRunning: false,
        errors: [(error as Error).message]
      })
      toast.error('გაგზავნა ვერ მოხერხდა')
    }

    onClearSelection()
  }

  const handleBulkMarkPaid = async () => {
    const operationId = startOperation('mark-paid', 'გადახდილად მონიშვნა', Check)
    
    try {
      await bulkUpdateStatus(selectedInvoices, 'paid')
      
      updateOperation(operationId, {
        completed: selectedCount,
        failed: 0,
        isRunning: false
      })
      
      toast.success(`${selectedCount} ინვოისი მონიშნულია როგორც გადახდილი`)
      onRefresh?.()
      
    } catch (error) {
      updateOperation(operationId, {
        failed: selectedCount,
        isRunning: false,
        errors: [(error as Error).message]
      })
      toast.error('სტატუსის განახლება ვერ მოხერხდა')
    }

    onClearSelection()
  }

  const handleBulkDelete = async () => {
    const operationId = startOperation('delete', 'ინვოისების წაშლა', Trash2)
    
    try {
      const results = await Promise.allSettled(
        selectedInvoices.map(async (invoiceId) => {
          const response = await fetch(`/api/invoices/${invoiceId}`, {
            method: 'DELETE'
          })
          
          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'წაშლა ვერ მოხერხდა')
          }
          
          return invoiceId
        })
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected')
      
      updateOperation(operationId, {
        completed: successful,
        failed: failed.length,
        isRunning: false,
        errors: failed.map(r => r.status === 'rejected' ? r.reason.message : '')
      })

      if (successful > 0) {
        toast.success(`${successful} ინვოისი წარმატებით წაიშალა`)
        onRefresh?.()
      }
      
      if (failed.length > 0) {
        toast.error(`${failed.length} ინვოისის წაშლა ვერ მოხერხდა`)
      }

    } catch (error) {
      updateOperation(operationId, {
        failed: selectedCount,
        isRunning: false,
        errors: [(error as Error).message]
      })
      toast.error('წაშლა ვერ მოხერხდა')
    }

    onClearSelection()
  }

  const handleBulkExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const operationId = startOperation('export', `${format.toUpperCase()} ექსპორტი`, Download)
    
    try {
      const params = new URLSearchParams()
      selectedInvoices.forEach(id => params.append('ids', id))
      
      const response = await fetch(`/api/invoices/export?format=${format}&${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('ექსპორტი ვერ მოხერხდა')
      }
      
      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `selected-invoices.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      updateOperation(operationId, {
        completed: selectedCount,
        failed: 0,
        isRunning: false
      })
      
      toast.success(`${selectedCount} ინვოისი წარმატებით ექსპორტირდა`)
      
    } catch (error) {
      updateOperation(operationId, {
        failed: selectedCount,
        isRunning: false,
        errors: [(error as Error).message]
      })
      toast.error('ექსპორტი ვერ მოხერხდა')
    }
  }

  const confirmAndExecute = (action: () => void, type: string, title: string, description: string) => {
    if (type === 'delete') {
      setConfirmAction({ type, title, description })
    } else {
      action()
    }
  }

  const executeConfirmedAction = () => {
    if (confirmAction?.type === 'delete') {
      handleBulkDelete()
    }
    setConfirmAction(null)
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      <Card className="mb-4">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1">
              {selectedCount} არჩეული
            </Badge>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleBulkSend}
                className="flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                გაგზავნა
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMarkPaid}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                გადახდილად მონიშვნა
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkExport('csv')}>
                    <FileText className="w-4 h-4 mr-2" />
                    CSV ექსპორტი
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExport('excel')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Excel ექსპორტი
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkExport('pdf')}>
                    <FileText className="w-4 h-4 mr-2" />
                    PDF ექსპორტი
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => confirmAndExecute(
                      handleBulkDelete, 
                      'delete', 
                      'ინვოისების წაშლა',
                      `დარწმუნებული ხართ, რომ გსურთ ${selectedCount} ინვოისის წაშლა? ეს მოქმედება შეუქცევადია.`
                    )}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    წაშლა
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            გაუქმება
          </Button>
        </CardContent>
      </Card>

      {/* Running Operations */}
      {runningOperations.map((operation) => (
        <Card key={operation.id} className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <operation.icon className="w-4 h-4" />
                <span className="font-medium">{operation.label}</span>
                {operation.isRunning && (
                  <Badge variant="secondary">მიმდინარეობს...</Badge>
                )}
              </div>
              
              {!operation.isRunning && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeOperation(operation.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <Progress 
                value={(operation.completed + operation.failed) / operation.total * 100}
                className="h-2"
              />
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {operation.completed + operation.failed} / {operation.total}
                </span>
                <span>
                  {operation.completed > 0 && `წარმატებული: ${operation.completed}`}
                  {operation.failed > 0 && ` • ვერ მოხერხდა: ${operation.failed}`}
                </span>
              </div>
              
              {operation.errors.length > 0 && (
                <div className="text-sm text-red-600 mt-2">
                  <details>
                    <summary className="cursor-pointer">შეცდომები ({operation.errors.length})</summary>
                    <ul className="mt-1 ml-4 list-disc">
                      {operation.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {operation.errors.length > 5 && (
                        <li>და კიდევ {operation.errors.length - 5} შეცდომა...</li>
                      )}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeConfirmedAction}
              className="bg-red-600 hover:bg-red-700"
            >
              დადასტურება
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}