'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Mail, 
  Download, 
  Copy, 
  MoreHorizontal,
  FileText,
  Calendar,
  DollarSign,
  User,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  Send
} from 'lucide-react'
import { Link as LinkIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'

import { useToast } from '@/components/ui/use-toast'
import { 
  getInvoice, 
  deleteInvoice, 
  duplicateInvoice, 
  updateInvoiceStatus
} from '@/lib/services/invoice'
import { clientService } from '@/lib/services/client'
import { useInvoiceRealtimeDetail } from '@/lib/hooks/use-invoice-realtime'
import type { Invoice, Client } from '@/types/database'

interface InvoiceWithItems extends Invoice {
  items: {
    id: string
    description: string
    quantity: number
    unit_price: number
    line_total: number
    sort_order: number
  }[]
  client?: Client
}

// Safe date formatter to avoid RangeError on invalid dates
const formatSafe = (
  value: string | Date | null | undefined,
  pattern: string
) => {
  if (!value) return '-'
  const d = typeof value === 'string' ? new Date(value) : value
  if (!(d instanceof Date) || isNaN(d.getTime())) return '-'
  try {
    return format(d, pattern, { locale: ka })
  } catch {
    return '-'
  }
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [publicLink, setPublicLink] = useState<string>('')

  // Enable real-time updates for this specific invoice
  useInvoiceRealtimeDetail(invoiceId)

  // Load invoice data
  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Get invoice with items
        const result = await getInvoice(invoiceId)
        
        if (result.error || !result.data) {
          setError(result.error || 'ინვოისი ვერ მოიძებნა')
          return
        }
        
        const invoiceData = result.data
        
        // Get client data if invoice has client_id
        if (invoiceData.client_id) {
          try {
            const clientData = await clientService.getClient(invoiceData.client_id)
            invoiceData.client = clientData
          } catch (clientError) {
            console.warn('Could not load client data:', clientError)
          }
        }
        
        setInvoice(invoiceData as unknown as InvoiceWithItems)
      } catch (err) {
        console.error('Error loading invoice:', err)
        setError(err instanceof Error ? err.message : 'ინვოისი ვერ მოიძებნა')
      } finally {
        setIsLoading(false)
      }
    }

    if (invoiceId) {
      loadInvoice()
    }
  }, [invoiceId])

  // Delete invoice
  const handleDeleteInvoice = async () => {
    if (!invoice) return
    
    try {
      setActionLoading(true)
      await deleteInvoice(invoice.id)
      toast({
        title: 'ინვოისი წაიშალა',
        description: 'ინვოისი წარმატებით წაიშალა',
      })
      router.push('/dashboard/invoices')
    } catch (error) {
      toast({
        title: 'შეცდომა',
        description: error instanceof Error ? error.message : 'ინვოისის წაშლა ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
      setDeleteDialogOpen(false)
    }
  }

  // Duplicate invoice
  const handleDuplicateInvoice = async () => {
    if (!invoice) return
    
    try {
      setActionLoading(true)
      const duplicatedInvoice = await duplicateInvoice(invoice.id)
      toast({
        title: 'ინვოისი დუბლირდა',
        description: 'ინვოისი წარმატებით დუბლირდა',
      })
      router.push(`/dashboard/invoices/${(duplicatedInvoice as any).id}`)
    } catch (error) {
      toast({
        title: 'შეცდომა',
        description: error instanceof Error ? error.message : 'ინვოისის დუბლირება ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Mark as paid
  const handleMarkAsPaid = async () => {
    if (!invoice) return
    
    try {
      setActionLoading(true)
      await updateInvoiceStatus({ id: invoice.id, status: 'paid', paid_at: new Date() })
      setInvoice({ ...invoice, status: 'paid', paid_at: new Date().toISOString() })
      toast({
        title: 'სტატუსი განახლდა',
        description: 'ინვოისი მონიშნულია როგორც გადახდილი',
      })
    } catch (error) {
      toast({
        title: 'შეცდომა',
        description: error instanceof Error ? error.message : 'სტატუსის განახლება ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Send invoice email
  const handleSendEmail = async () => {
    if (!invoice) return
    
    try {
      setActionLoading(true)
      // await sendInvoiceEmail(invoice.id) // TODO: Implement email sending
      throw new Error('ელფოსტით გაგზავნა ჯერ არ არის იმპლემენტირებული')
      setInvoice({ ...invoice, status: 'sent', sent_at: new Date().toISOString(), items: invoice.items || [] })
      toast({
        title: 'ინვოისი გაიგზავნა',
        description: 'ინვოისი წარმატებით გაიგზავნა ელფოსტით',
      })
    } catch (error) {
      toast({
        title: 'შეცდომა',
        description: error instanceof Error ? error.message : 'ინვოისის გაგზავნა ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!invoice) return
    
    try {
      setActionLoading(true)
      
      // Generate PDF
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'PDF-ის გენერაცია ვერ მოხერხდა')
      }
      
      // Get the HTML content
      const htmlContent = await response.text()
      
      // Open in new window for PDF conversion
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        
        // Wait for content to load, then trigger print dialog
        printWindow.addEventListener('load', () => {
          setTimeout(() => {
            printWindow.print()
            
            // Close window after print dialog
            printWindow.addEventListener('afterprint', () => {
              printWindow.close()
            })
          }, 500)
        })
        
        toast({
          title: 'PDF მზადაა',
          description: 'დაბეჭდვის ფანჯარა გაიხსნა - აირჩიეთ "Save as PDF"',
        })
      } else {
        // Fallback - download HTML if popup blocked
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url = window.URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `invoice-${invoice.invoice_number || invoice.id.slice(0, 8)}.html`
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        toast({
          title: 'PDF ფაილი ჩამოტვირთული',
          description: 'HTML ფაილი ჩამოიტვირთა - გახსენით და "Save as PDF" გააკეთეთ',
        })
      }
    } catch (error) {
      console.error('PDF download error:', error)
      toast({
        title: 'შეცდომა',
        description: error instanceof Error ? error.message : 'PDF-ის ჩამოტვირთვა ვერ მოხერხდა',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Enable or rotate and copy public link
  const handleCopyPublicLink = async () => {
    if (!invoice) return
    try {
      setActionLoading(true)
      const res = await fetch(`/api/invoices/${invoice.id}/public-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rotate: true })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Public ლინკის შექმნა ვერ მოხერხდა')
      const url = data.url as string
      setPublicLink(url)
      await navigator.clipboard.writeText(url)
      toast({ title: 'ლინკი შექმნილია', description: 'ლინკი დაკოპირდა ბუფერში' })
    } catch (error) {
      toast({
        title: 'შეცდომა',
        description: error instanceof Error ? error.message : 'Public ლინკის შექმნა ვერ მოხერხდა',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Disable public link
  const handleDisablePublicLink = async () => {
    if (!invoice) return
    try {
      setActionLoading(true)
      const res = await fetch(`/api/invoices/${invoice.id}/public-link`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Public ლინკის გამორთვა ვერ მოხერხდა')
      setPublicLink('')
      toast({ title: 'ლინკი გამორთულია' })
    } catch (error) {
      toast({
        title: 'შეცდომა',
        description: error instanceof Error ? error.message : 'Public ლინკის გამორთვა ვერ მოხერხდა',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Status badge color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft':
        return { 
          label: 'მონახაზი', 
          variant: 'secondary' as const, 
          icon: FileText,
          color: 'text-gray-500'
        }
      case 'sent':
        return { 
          label: 'გაგზავნილი', 
          variant: 'default' as const, 
          icon: Send,
          color: 'text-blue-500'
        }
      case 'paid':
        return { 
          label: 'გადახდილი', 
          variant: 'default' as const, 
          icon: CheckCircle,
          color: 'text-green-500'
        }
      case 'overdue':
        return { 
          label: 'ვადაგადაცილებული', 
          variant: 'destructive' as const, 
          icon: AlertCircle,
          color: 'text-red-500'
        }
      default:
        return { 
          label: status, 
          variant: 'outline' as const, 
          icon: FileText,
          color: 'text-gray-500'
        }
    }
  }

  // Format currency
  const formatCurrency = (amount: number | undefined | null, currency: string | null = 'GEL'): string => {
    const safeCurrency = currency || 'GEL'
    const symbols = { GEL: '₾', USD: '$', EUR: '€' }
    const symbol = symbols[safeCurrency as keyof typeof symbols] || safeCurrency
    const validAmount = amount || 0
    
    return `${symbol}${validAmount.toLocaleString('ka-GE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  // Loading state
  if (isLoading) {
    return <InvoiceDetailSkeleton />
  }

  // Error state
  if (error || !invoice) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2 text-red-600">ინვოისი ვერ მოიძებნა</h3>
              <p className="text-muted-foreground mb-4">
                მითითებული ინვოისი არ არსებობს ან წაშლილია
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/invoices">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  ინვოისების სიაზე დაბრუნება
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = getStatusInfo(invoice.status)
  const StatusIcon = statusInfo.icon
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/invoices">
              <ArrowLeft className="w-4 h-4 mr-2" />
              უკან
            </Link>
          </Button>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
              <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                <StatusIcon className="w-3 h-3" />
                {statusInfo.label}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                გამოცემის თარიღი: {formatSafe(invoice.issue_date as any, 'dd MMM yyyy')}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                ვადა: {formatSafe(invoice.due_date as any, 'dd MMM yyyy')}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={actionLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          
          {invoice.status === 'draft' && invoice.client?.email && (
            <Button
              size="sm"
              onClick={handleSendEmail}
              disabled={actionLoading}
            >
              <Mail className="w-4 h-4 mr-2" />
              გაგზავნა
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyPublicLink} disabled={actionLoading}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Public ლინკის კოპირება
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDisablePublicLink} disabled={actionLoading}>
                <Trash2 className="w-4 h-4 mr-2" />
                Public ლინკის გამორთვა
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/invoices/new?edit=${invoice.id}`}>
                  <Edit className="w-4 h-4 mr-2" />
                  რედაქტირება
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleDuplicateInvoice} disabled={actionLoading}>
                <Copy className="w-4 h-4 mr-2" />
                დუბლირება
              </DropdownMenuItem>
              
              {invoice.status === 'sent' && (
                <DropdownMenuItem onClick={handleMarkAsPaid} disabled={actionLoading}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  გადახდილად მონიშვნა
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 focus:text-red-600"
                disabled={actionLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                წაშლა
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Invoice Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {invoice.client?.type === 'company' ? (
                  <Building className="w-5 h-5" />
                ) : (
                  <User className="w-5 h-5" />
                )}
                მიმღები
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {invoice.client ? (
                <>
                  <div>
                    <div className="font-medium text-lg">{invoice.client.name}</div>
                    {invoice.client.contact_person && (
                      <div className="text-sm text-muted-foreground">
                        საკონტაქტო პირი: {invoice.client.contact_person}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    {invoice.client.email && (
                      <div className="text-sm">
                        <div className="font-medium">ელ.ფოსტა</div>
                        <div className="text-muted-foreground">{invoice.client.email}</div>
                      </div>
                    )}
                    
                    {invoice.client.phone && (
                      <div className="text-sm">
                        <div className="font-medium">ტელეფონი</div>
                        <div className="text-muted-foreground">{invoice.client.phone}</div>
                      </div>
                    )}
                    
                    {invoice.client.tax_id && (
                      <div className="text-sm">
                        <div className="font-medium">საიდენტიფიკაციო კოდი</div>
                        <div className="text-muted-foreground">{invoice.client.tax_id}</div>
                      </div>
                    )}
                    
                    {(invoice.client.address_line1 || invoice.client.address_line2) && (
                      <div className="text-sm">
                        <div className="font-medium">მისამართი</div>
                        <div className="text-muted-foreground">
                          {[invoice.client.address_line1, invoice.client.address_line2, invoice.client.city]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">კლიენტის ინფორმაცია მიუწვდომელია</div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>ინვოისის პოზიციები</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.items && invoice.items.length > 0 ? (
                <div className="space-y-4">
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">პროდუქტი/სერვისი</th>
                          <th className="text-center py-2">რაოდენობა</th>
                          <th className="text-right py-2">ფასი</th>
                          <th className="text-right py-2">ჯამი</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item) => (
                          <tr key={item.id} className="border-b last:border-b-0">
                            <td className="py-3">
                              <div className="font-medium">{item.description}</div>
                            </td>
                            <td className="py-3 text-center">{item.quantity}</td>
                            <td className="py-3 text-right">
                              {formatCurrency(item.unit_price, invoice.currency)}
                            </td>
                            <td className="py-3 text-right font-medium">
                              {formatCurrency(item.line_total, invoice.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {invoice.items.map((item) => (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="font-medium mb-2">{item.description}</div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">რაოდენობა</div>
                            <div>{item.quantity}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">ფასი</div>
                            <div>{formatCurrency(item.unit_price, invoice.currency)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">ჯამი</div>
                            <div className="font-medium">
                              {formatCurrency(item.line_total, invoice.currency)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  ინვოისს არ აქვს პოზიციები
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank Account Information */}
          {invoice.bank_account && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  საბანკო რეკვიზიტები
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ბანკი:</span>
                  <span className="font-medium">{invoice.bank_account.bank_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ანგარიში:</span>
                  <span className="font-medium font-mono">{invoice.bank_account.account_number}</span>
                </div>
                {invoice.bank_account.account_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">მფლობელი:</span>
                    <span className="font-medium">{invoice.bank_account.account_name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>შენიშვნები</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Payment Instructions */}
          {invoice.payment_instructions && (
            <Card>
              <CardHeader>
                <CardTitle>გადახდის ინსტრუქციები</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{invoice.payment_instructions}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                ფინანსური ინფორმაცია
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ქვეჯამი:</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                
                {invoice.vat_rate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ხელისუფლების საშუალებით ({invoice.vat_rate}%):</span>
                    <span>{formatCurrency(invoice.vat_amount, invoice.currency)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>სულ:</span>
                  <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
              </div>
              
              <div className="pt-2 space-y-2">
                <div className="text-sm text-muted-foreground">
                  <div>ვალუტა: {invoice.currency}</div>
                  {invoice.vat_rate > 0 && (
                    <div>დღგ განაკვეთი: {invoice.vat_rate}%</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>აქტივობა</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="text-sm">
                    <div className="font-medium">ინვოისი შეიქმნა</div>
                    <div className="text-muted-foreground">
                      {formatSafe(invoice.created_at as any, 'dd MMM yyyy, HH:mm')}
                    </div>
                  </div>
                </div>
                
                {invoice.sent_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="text-sm">
                      <div className="font-medium">ინვოისი გაიგზავნა</div>
                      <div className="text-muted-foreground">
                        {formatSafe(invoice.sent_at as any, 'dd MMM yyyy, HH:mm')}
                      </div>
                    </div>
                  </div>
                )}
                
                {invoice.paid_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <div className="text-sm">
                      <div className="font-medium">ინვოისი გადაიხადა</div>
                      <div className="text-muted-foreground">
                        {formatSafe(invoice.paid_at as any, 'dd MMM yyyy, HH:mm')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>დარწმუნებული ხართ?</AlertDialogTitle>
            <AlertDialogDescription>
              ინვოისი &quot;{invoice.invoice_number}&quot; წაიშლება. ეს მოქმედება ვერ გაუქმდება.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvoice}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading}
            >
              წაშლა
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Loading skeleton component
function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-9" />
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="w-32 h-8" />
              <Skeleton className="w-20 h-6" />
            </div>
            <div className="space-y-1">
              <Skeleton className="w-48 h-4" />
              <Skeleton className="w-40 h-4" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-16 h-9" />
          <Skeleton className="w-20 h-9" />
          <Skeleton className="w-10 h-9" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="w-32 h-6" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="w-full h-4" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="w-24 h-6" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="w-full h-4" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
