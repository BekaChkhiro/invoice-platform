"use client"

import * as React from "react"
import { Download, FileText, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { ka } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { subscriptionService } from "@/lib/services/subscription"
import type { PaymentRecord } from "@/types/subscription"

interface BillingHistoryProps {
  userId: string
  limit?: number
  className?: string
}

const STATUS_CONFIG = {
  completed: {
    label: 'წარმატებული',
    variant: 'default' as const,
    className: 'bg-green-500 hover:bg-green-600',
  },
  pending: {
    label: 'მუშავდება',
    variant: 'secondary' as const,
    className: 'bg-yellow-500 hover:bg-yellow-600',
  },
  failed: {
    label: 'წარუმატებელი',
    variant: 'destructive' as const,
    className: 'bg-red-500 hover:bg-red-600',
  },
  refunded: {
    label: 'დაბრუნებული',
    variant: 'outline' as const,
    className: 'text-muted-foreground',
  },
}

const PLAN_NAMES = {
  free: 'უფასო',
  basic: 'ძირითადი',
  pro: 'პროფესიონალური',
}

export function BillingHistory({ userId, limit = 10, className }: BillingHistoryProps) {
  const [page, setPage] = React.useState(1)
  const itemsPerPage = limit

  const { data: payments, isLoading, error, refetch } = useQuery({
    queryKey: ['payment-history', userId, page],
    queryFn: () => subscriptionService.getPaymentHistory(userId, itemsPerPage * page),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })

  const displayedPayments = React.useMemo(() => {
    if (!payments) return []
    const start = (page - 1) * itemsPerPage
    return payments.slice(start, start + itemsPerPage)
  }, [payments, page, itemsPerPage])

  const totalPages = Math.ceil((payments?.length || 0) / itemsPerPage)
  const canGoBack = page > 1
  const canGoForward = page < totalPages

  const handleDownloadReceipt = async (payment: PaymentRecord) => {
    const receiptData = {
      id: payment.id,
      date: format(new Date(payment.created_at), 'dd.MM.yyyy', { locale: ka }),
      amount: `₾${payment.amount.toFixed(2)}`,
      status: STATUS_CONFIG[payment.status].label,
      plan: payment.metadata?.plan || 'N/A',
    }
    
    const blob = new Blob([JSON.stringify(receiptData, null, 2)], { 
      type: 'application/json' 
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${payment.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const formatPaymentDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy', { locale: ka })
    } catch {
      return 'N/A'
    }
  }

  const getPlanFromMetadata = (metadata: Record<string, any> | null) => {
    if (!metadata) return 'N/A'
    const planId = metadata.to_plan || metadata.plan || metadata.plan_id
    return PLAN_NAMES[planId as keyof typeof PLAN_NAMES] || planId || 'N/A'
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>ბილინგის ისტორია</CardTitle>
          <CardDescription>თქვენი გადახდების ისტორია</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <p className="text-muted-foreground">ისტორიის ჩატვირთვა ვერ მოხერხდა</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              თავიდან ცდა
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>ბილინგის ისტორია</CardTitle>
        <CardDescription>თქვენი გადახდების ისტორია</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>თარიღი</TableHead>
              <TableHead>გეგმა</TableHead>
              <TableHead className="text-right">თანხა</TableHead>
              <TableHead>სტატუსი</TableHead>
              <TableHead className="text-center">ქვითარი</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-8 w-8 mx-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : displayedPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-muted-foreground">გადახდების ისტორია არ მოიძებნა</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayedPayments.map((payment) => {
                const status = STATUS_CONFIG[payment.status]
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {formatPaymentDate(payment.paid_at || payment.created_at)}
                    </TableCell>
                    <TableCell>{getPlanFromMetadata(payment.metadata)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₾{payment.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={status.variant}
                        className={cn("font-medium", status.className)}
                      >
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadReceipt(payment)}
                        disabled={payment.status !== 'completed'}
                        title={payment.status !== 'completed' ? 
                          'ქვითარი ხელმისაწვდომია მხოლოდ წარმატებული გადახდებისთვის' : 
                          'ქვითრის ჩამოტვირთვა'
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        
        {!isLoading && displayedPayments.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              გვერდი {page} / {totalPages}
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p - 1)}
                disabled={!canGoBack}
              >
                <ChevronLeft className="h-4 w-4" />
                წინა
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!canGoForward}
              >
                შემდეგი
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function BillingHistorySummary({ userId, className }: Omit<BillingHistoryProps, 'limit'>) {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payment-history', userId],
    queryFn: () => subscriptionService.getPaymentHistory(userId, 100),
    staleTime: 5 * 60 * 1000,
  })

  const summary = React.useMemo(() => {
    if (!payments || payments.length === 0) {
      return {
        total: 0,
        successful: 0,
        pending: 0,
        failed: 0,
        totalAmount: 0,
      }
    }

    return {
      total: payments.length,
      successful: payments.filter(p => p.status === 'completed').length,
      pending: payments.filter(p => p.status === 'pending').length,
      failed: payments.filter(p => p.status === 'failed').length,
      totalAmount: payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
    }
  }, [payments])

  if (isLoading) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-4", className)}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-4", className)}>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>სულ გადახდები</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{summary.total}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>წარმატებული</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">{summary.successful}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>მუშავდება</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>სულ გადახდილი</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">₾{summary.totalAmount.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  )
}