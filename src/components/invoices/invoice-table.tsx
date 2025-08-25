'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Copy, Trash2, FileText, Link as LinkIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

import { InvoiceFilters } from '@/lib/hooks/use-invoice-list'
import { useInvoiceOperations } from '@/lib/hooks/use-invoices'
import { useToast } from '@/components/ui/use-toast'

interface Invoice {
  id: string
  invoice_number: string
  issue_date: string
  due_date: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  currency: string
  subtotal: number
  vat_amount: number
  total: number
  client: {
    id: string
    name: string
    email?: string
    type: 'individual' | 'company'
  }
  created_at: string
  updated_at: string
}

interface InvoiceTableProps {
  invoices: Invoice[]
  isLoading: boolean
  selectedInvoices: string[]
  onToggleInvoice: (id: string) => void
  onToggleAll: () => void
  isAllSelected: boolean
  filters: InvoiceFilters
  onSort: (column: InvoiceFilters['sort_by']) => void
}

export function InvoiceTable({
  invoices,
  isLoading,
  selectedInvoices,
  onToggleInvoice,
  onToggleAll,
  isAllSelected,
  filters,
  onSort
}: InvoiceTableProps) {
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null)
  const { updateStatus, duplicate, delete: deleteInvoice } = useInvoiceOperations()
  const { toast } = useToast()

  const getSortIcon = (column: InvoiceFilters['sort_by']) => {
    if (filters.sort_by !== column) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return filters.sort_order === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />
  }

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      draft: { label: 'გადასახდელი', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
      sent: { label: 'გაგზავნილი', variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' },
      paid: { label: 'გადახდილი', variant: 'secondary' as const, className: 'bg-green-100 text-green-800' },
      overdue: { label: 'ვადაგადაცილებული', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'გაუქმებული', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-500' }
    }

    const config = statusConfig[status]
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'GEL' ? '₾' : currency
    return `${amount.toFixed(2)} ${symbol}`
  }

  const canEdit = (invoice: Invoice) => ['draft', 'sent'].includes(invoice.status)
  const canDelete = (invoice: Invoice) => invoice.status === 'draft'

  const handleDuplicate = (invoice: Invoice) => {
    duplicate(invoice.id)
  }

  const handleDelete = (invoice: Invoice) => {
    if (deleteInvoiceId === invoice.id) {
      deleteInvoice(invoice.id)
      setDeleteInvoiceId(null)
    } else {
      setDeleteInvoiceId(invoice.id)
    }
  }

  const handleCopyPublicLink = async (invoice: Invoice) => {
    try {
      // Check if invoice already has a public token and is enabled
      const checkResponse = await fetch(`/api/invoices/${invoice.id}`)
      if (checkResponse.ok) {
        const invoiceData = await checkResponse.json()
        
        if (invoiceData.public_enabled && invoiceData.public_token) {
          // Use existing token
          const url = `${window.location.origin}/i/${invoiceData.public_token}`
          await navigator.clipboard.writeText(url)
          toast({ 
            title: 'ლინკი დაკოპირდა', 
            description: 'არსებული საჯარო ლინკი დაკოპირდა ბუფერში' 
          })
          return
        }
      }
      
      // Create new public link
      const res = await fetch(`/api/invoices/${invoice.id}/public-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rotate: false })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Public ლინკის შექმნა ვერ მოხერხდა')
      
      const url = data.url as string
      await navigator.clipboard.writeText(url)
      toast({ 
        title: 'ლინკი შექმნილია', 
        description: 'ახალი ლინკი შექმნილია და დაკოპირდა ბუფერში' 
      })
    } catch (error) {
      toast({
        title: 'შეცდომა',
        description: error instanceof Error ? error.message : 'Public ლინკის კოპირება ვერ მოხერხდა',
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="space-y-3 p-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">ინვოისები ვერ მოიძებნა</h3>
          <p className="text-muted-foreground text-center max-w-md">
            {filters.search || filters.status !== 'all' || filters.client_id || filters.date_from || filters.date_to
              ? 'არცერთი ინვოისი არ შეესაბამება თქვენს ძიების კრიტერიუმებს. სცადეთ ფილტრების შეცვლა.'
              : 'ჯერ არ გაქვთ შექმნილი ინვოისები. დაწყებული ინვოისის შექმნით.'
            }
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={onToggleAll}
                    aria-label="აირჩიე ყველა ინვოისი"
                  />
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSort('issue_date')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    ნომერი/თარიღი
                    {getSortIcon('issue_date')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSort('client')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    კლიენტი
                    {getSortIcon('client')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSort('status')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    სტატუსი
                    {getSortIcon('status')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSort('due_date')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    ვადა
                    {getSortIcon('due_date')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSort('total')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    თანხა
                    {getSortIcon('total')}
                  </Button>
                </TableHead>
                <TableHead className="w-20">მოქმედებები</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow 
                  key={invoice.id}
                  className={`
                    ${selectedInvoices.includes(invoice.id) ? 'bg-blue-50' : ''} 
                    ${invoice.status === 'overdue' ? 'border-l-4 border-l-red-500' : ''}
                    hover:bg-gray-50
                  `}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedInvoices.includes(invoice.id)}
                      onCheckedChange={() => onToggleInvoice(invoice.id)}
                      aria-label={`აირჩიე ინვოისი ${invoice.invoice_number}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{invoice.invoice_number}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(invoice.issue_date), 'dd MMM yyyy', { locale: ka })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{invoice.client.name}</div>
                      {invoice.client.email && (
                        <div className="text-xs text-muted-foreground">{invoice.client.email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(invoice.status)}
                  </TableCell>
                  <TableCell>
                    <div className={`text-sm ${
                      new Date(invoice.due_date) < new Date() && invoice.status === 'sent'
                        ? 'text-red-600 font-medium'
                        : 'text-muted-foreground'
                    }`}>
                      {format(new Date(invoice.due_date), 'dd MMM yyyy', { locale: ka })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyPublicLink(invoice)}
                        className="h-8 w-8 p-0"
                        title="საჯარო ლინკის კოპირება"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link 
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            გადახედვა
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleCopyPublicLink(invoice)}>
                          <LinkIcon className="h-4 w-4 mr-2" />
                          საჯარო ლინკის კოპირება
                        </DropdownMenuItem>

                        {canEdit(invoice) && (
                          <DropdownMenuItem asChild>
                            <Link 
                              href={`/dashboard/invoices/${invoice.id}/edit`}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              რედაქტირება
                            </Link>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem onClick={() => handleDuplicate(invoice)}>
                          <Copy className="h-4 w-4 mr-2" />
                          დუბლირება
                        </DropdownMenuItem>

                        {canDelete(invoice) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(invoice)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              წაშლა
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteInvoiceId !== null} onOpenChange={() => setDeleteInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>დარწმუნებული ხართ?</AlertDialogTitle>
            <AlertDialogDescription>
              ეს მოქმედება შეუქცევადია. ინვოისი სამუდამოდ წაიშლება.
              კრედიტი დაბრუნდება თქვენს ანგარიშზე.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteInvoiceId && handleDelete({ id: deleteInvoiceId } as Invoice)}
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