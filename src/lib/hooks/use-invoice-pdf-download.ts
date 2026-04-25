'use client'

import { useCallback, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import InvoicePdfTemplate from '@/components/invoices/pdf/invoice-pdf-template'

type DownloadInput = Parameters<typeof InvoicePdfTemplate>[0]['invoice']

// Tuned to fit each A4 page comfortably without cutting rows.
// Last page also has totals + footer, so it fits fewer rows.
const ITEMS_PER_PAGE_REGULAR = 22
const ITEMS_PER_LAST_PAGE = 16
const SINGLE_PAGE_MAX = 18 // if items <= this, render everything on one page

function chunkItems<T>(items: T[]): T[][] {
  const N = items.length
  if (N === 0) return [[]]
  if (N <= SINGLE_PAGE_MAX) return [items]

  // Multi-page: reserve last ITEMS_PER_LAST_PAGE for the last page (it carries totals)
  const itemsBeforeLast = N - ITEMS_PER_LAST_PAGE
  const regularPages = Math.max(1, Math.ceil(itemsBeforeLast / ITEMS_PER_PAGE_REGULAR))
  const perRegular = Math.ceil(itemsBeforeLast / regularPages)

  const pages: T[][] = []
  let idx = 0
  for (let p = 0; p < regularPages; p++) {
    const end = Math.min(idx + perRegular, itemsBeforeLast)
    pages.push(items.slice(idx, end))
    idx = end
  }
  pages.push(items.slice(idx))
  return pages
}

export function useInvoicePdfDownload() {
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadPdf = useCallback(async (invoice: DownloadInput, filename?: string) => {
    setIsDownloading(true)

    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-10000px'
    container.style.top = '0'
    container.style.zIndex = '-1'
    container.style.background = '#ffffff'
    document.body.appendChild(container)

    const root = createRoot(container)

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      const allItems = (invoice.items ?? []).slice().sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      )
      const pages = chunkItems(allItems)
      const totalPages = pages.length

      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      let cursor = 0
      for (let p = 0; p < totalPages; p++) {
        const itemsSlice = pages[p]
        const isLast = p === totalPages - 1
        const pageNum = p + 1

        root.render(
          createElement(InvoicePdfTemplate, {
            invoice,
            itemsSlice,
            itemStartIndex: cursor,
            showTotals: isLast,
            pageNum,
            totalPages,
          })
        )

        // Wait for fonts/layout to settle before capture
        await new Promise((resolve) => setTimeout(resolve, 250))

        const target = container.firstElementChild as HTMLElement | null
        if (!target) throw new Error('PDF template ვერ დარენდერდა')

        const canvas = await html2canvas(target, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        })

        const imgWidth = pageWidth
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        // Each page is fixed-height (matches A4). If it slightly overflows due to
        // floating point rounding, scale down to fit exactly one page.
        const finalHeight = Math.min(imgHeight, pageHeight)
        const finalWidth = (canvas.width * finalHeight) / canvas.height
        const xOffset = (pageWidth - finalWidth) / 2

        if (p > 0) pdf.addPage()
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          xOffset,
          0,
          finalWidth,
          finalHeight
        )

        cursor += itemsSlice.length
      }

      const safeName = filename
        || (invoice.invoice_number ? `invoice-${invoice.invoice_number}.pdf` : 'invoice.pdf')
      pdf.save(safeName)
    } finally {
      try {
        root.unmount()
      } catch {}
      if (container.parentNode) container.parentNode.removeChild(container)
      setIsDownloading(false)
    }
  }, [])

  return { downloadPdf, isDownloading }
}
