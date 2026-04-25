"use client"

import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link as LinkIcon, Check, Download } from 'lucide-react'
import { useInvoicePdfDownload } from '@/lib/hooks/use-invoice-pdf-download'

type Props = {
  shareUrl: string
  invoiceId?: string
  token?: string
}

export default function PublicInvoiceActions({ shareUrl, invoiceId, token }: Props) {
  const [copied, setCopied] = useState(false)
  const { downloadPdf, isDownloading } = useInvoicePdfDownload()
  const busy = isDownloading

  const handlePDF = useCallback(async () => {
    if (!invoiceId || !token) {
      window.print()
      return
    }
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/public-data?token=${encodeURIComponent(token)}`)
      if (!res.ok) {
        // fallback: rely on browser print of current page
        window.print()
        return
      }
      const data = await res.json()
      await downloadPdf({
        invoice_number: data.invoice_number,
        issue_date: data.issue_date,
        due_date: data.due_date,
        status: data.status,
        currency: data.currency,
        vat_rate: data.vat_rate,
        subtotal: data.subtotal,
        vat_amount: data.vat_amount,
        total: data.total,
        items: data.items || [],
        client: data.client,
        company: data.company,
        bank_accounts: data.bank_accounts,
        bank_account: data.bank_account,
      })
    } catch {
      window.print()
    }
  }, [invoiceId, token, downloadPdf])

  const handleCopy = useCallback(async () => {
    try {
      const absUrl = shareUrl && shareUrl.startsWith('http')
        ? shareUrl
        : (typeof window !== 'undefined'
            ? `${window.location.origin}${shareUrl?.startsWith('/') ? shareUrl : `/${shareUrl || ''}`}`
            : shareUrl || '')
      await navigator.clipboard.writeText(absUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }, [shareUrl])

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button onClick={handlePDF} size="sm" disabled={busy}>
        <Download className="mr-2 h-4 w-4" /> PDF (ბეჭდვა)
      </Button>
      <Button variant="outline" onClick={handleCopy} size="sm">
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" /> დაკოპირებულია
          </>
        ) : (
          <>
            <LinkIcon className="mr-2 h-4 w-4" /> ლინკის კოპირება
          </>
        )}
      </Button>
    </div>
  )
}
