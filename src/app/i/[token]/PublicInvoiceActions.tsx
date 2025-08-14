"use client"

import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Printer, Link as LinkIcon, Check, Download } from 'lucide-react'

type Props = {
  shareUrl: string
  invoiceId?: string
  token?: string
}

export default function PublicInvoiceActions({ shareUrl, invoiceId, token }: Props) {
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const handlePDF = useCallback(async () => {
    if (!invoiceId || !token) {
      window.print()
      return
    }
    try {
      setBusy(true)
      const res = await fetch(`/api/invoices/${invoiceId}/pdf/public?token=${encodeURIComponent(token)}`)
      if (!res.ok) {
        // fallback to print current page
        window.print()
        return
      }
      const html = await res.text()
      const w = window.open('', '_blank', 'width=800,height=600')
      if (w) {
        w.document.write(html)
        w.document.close()
        w.addEventListener('load', () => {
          setTimeout(() => {
            w.print()
          }, 300)
        })
      }
    } finally {
      setBusy(false)
    }
  }, [invoiceId, token])

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
