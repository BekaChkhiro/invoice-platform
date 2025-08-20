'use client'

import { useState } from 'react'
import { PDFViewer, PDFDownloadLink, pdf } from '@react-pdf/renderer'
import { Download, Printer, Mail, Share2, Eye, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { InvoicePDF } from './invoice-pdf'
import { generateInvoicePDF, downloadPDF, printPDF } from '@/lib/pdf/invoice-pdf-utils'
import type { InvoiceWithDetails } from '@/lib/services/invoice'

// =====================================
// TYPES AND INTERFACES
// =====================================

interface PDFPreviewProps {
  invoice: InvoiceWithDetails
  onDownload?: () => void
  onPrint?: () => void
  onEmail?: () => void
  className?: string
  showActions?: boolean
  height?: number
}

// =====================================
// MAIN COMPONENT
// =====================================

export function PDFPreview({
  invoice,
  onDownload,
  onPrint,
  onEmail,
  className = '',
  showActions = true,
  height = 600
}: PDFPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPrintingSupported, setIsPrintingSupported] = useState(
    typeof window !== 'undefined' && 'print' in window
  )

  // Generate filename for download
  const generateFilename = (): string => {
    const invoiceNumber = invoice.invoice_number || `draft-${invoice.id.slice(0, 8)}`
    const clientName = invoice.client.name.replace(/[^a-zA-Z0-9]/g, '-')
    return `invoice-${invoiceNumber}-${clientName}.pdf`
  }

  // Handle PDF download
  const handleDownload = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      
      const pdfBlob = await generateInvoicePDF(invoice)
      downloadPDF(pdfBlob, generateFilename())
      
      onDownload?.()
    } catch (err) {
      console.error('PDF download failed:', err)
      setError('PDF ფაილის ჩამოტვირთვა ვერ მოხერხდა')
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle PDF print
  const handlePrint = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      
      const pdfBlob = await generateInvoicePDF(invoice)
      printPDF(pdfBlob)
      
      onPrint?.()
    } catch (err) {
      console.error('PDF print failed:', err)
      setError('PDF ფაილის დაბეჭდვა ვერ მოხერხდა')
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle email sharing
  const handleEmail = () => {
    onEmail?.()
    // This would integrate with email service
    console.log('Email sharing would be implemented here')
  }

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        const pdfBlob = await generateInvoicePDF(invoice)
        const file = new File([pdfBlob], generateFilename(), { type: 'application/pdf' })
        
        await navigator.share({
          title: `ინვოისი ${invoice.invoice_number}`,
          text: `ინვოისი ${invoice.client.name}-ისთვის`,
          files: [file]
        })
      } catch (err) {
        console.error('Share failed:', err)
      }
    } else {
      // Fallback: copy link or download
      handleDownload()
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Header with Invoice Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">PDF მისავალი</CardTitle>
              <p className="text-sm text-muted-foreground">
                ინვოისი #{invoice.invoice_number} • {invoice.client.name}
              </p>
            </div>
            
            <Badge 
              variant={invoice.status === 'paid' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {invoice.status === 'draft' && 'გადასახდელი'}
              {invoice.status === 'sent' && 'გაგზავნილი'}
              {invoice.status === 'paid' && 'გადახდილი'}
              {invoice.status === 'overdue' && 'ვადაგადაცილებული'}
              {invoice.status === 'cancelled' && 'გაუქმებული'}
            </Badge>
          </div>
        </CardHeader>

        {showActions && (
          <>
            <Separator />
            <CardContent className="pt-3">
              <div className="flex flex-wrap gap-2">
                
                {/* Download Button */}
                <Button 
                  onClick={handleDownload}
                  disabled={isGenerating}
                  size="sm"
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  ჩამოტვირთვა
                </Button>

                {/* Print Button */}
                {isPrintingSupported && (
                  <Button 
                    variant="outline"
                    onClick={handlePrint}
                    disabled={isGenerating}
                    size="sm"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Printer className="mr-2 h-4 w-4" />
                    )}
                    ბეჭდვა
                  </Button>
                )}

                {/* Email Button */}
                <Button 
                  variant="outline"
                  onClick={handleEmail}
                  disabled={isGenerating}
                  size="sm"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  ემაილი
                </Button>

                {/* Share Button (if supported) */}
                {navigator.share && (
                  <Button 
                    variant="outline"
                    onClick={handleShare}
                    disabled={isGenerating}
                    size="sm"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    გაზიარება
                  </Button>
                )}

                {/* Alternative Download Link */}
                <PDFDownloadLink
                  document={<InvoicePDF invoice={invoice} />}
                  fileName={generateFilename()}
                  className="hidden" // Hidden fallback
                >
                  {({ loading }) => 
                    loading ? (
                      <Button variant="ghost" size="sm" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        მზადდება...
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        ჩამოტვირთვა
                      </Button>
                    )
                  }
                </PDFDownloadLink>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* PDF Preview */}
      <Card>
        <CardContent className="p-0">
          <div 
            className="border rounded-lg overflow-hidden bg-gray-100"
            style={{ height: `${height}px` }}
          >
            <PDFViewer 
              width="100%" 
              height="100%"
              className="border-0"
              showToolbar={true}
            >
              <InvoicePDF invoice={invoice} />
            </PDFViewer>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">ქვეჯამი</p>
              <p className="font-medium">
                {invoice.subtotal.toFixed(2)} {invoice.currency}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">დღგ ({invoice.vat_rate}%)</p>
              <p className="font-medium">
                {invoice.vat_amount.toFixed(2)} {invoice.currency}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">სულ ჯამი</p>
              <p className="font-bold text-lg">
                {invoice.total.toFixed(2)} {invoice.currency}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">პოზიციები</p>
              <p className="font-medium">{invoice.items.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Actions (Sticky) */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Button 
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex-1"
                size="sm"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                ჩამოტვირთვა
              </Button>
              
              {navigator.share && (
                <Button 
                  variant="outline"
                  onClick={handleShare}
                  disabled={isGenerating}
                  size="sm"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// =====================================
// SIMPLE PDF PREVIEW (WITHOUT ACTIONS)
// =====================================

interface SimplePDFPreviewProps {
  invoice: InvoiceWithDetails
  height?: number
  className?: string
}

export function SimplePDFPreview({ 
  invoice, 
  height = 400, 
  className = '' 
}: SimplePDFPreviewProps) {
  return (
    <div className={`border rounded-lg overflow-hidden bg-gray-100 ${className}`}>
      <div style={{ height: `${height}px` }}>
        <PDFViewer 
          width="100%" 
          height="100%"
          className="border-0"
          showToolbar={false}
        >
          <InvoicePDF invoice={invoice} />
        </PDFViewer>
      </div>
    </div>
  )
}

// =====================================
// PDF DOWNLOAD BUTTON COMPONENT
// =====================================

interface PDFDownloadButtonProps {
  invoice: InvoiceWithDetails
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  onDownload?: () => void
}

export function PDFDownloadButton({
  invoice,
  variant = 'default',
  size = 'default',
  className = '',
  onDownload
}: PDFDownloadButtonProps) {
  const filename = `invoice-${invoice.invoice_number || invoice.id.slice(0, 8)}.pdf`

  return (
    <PDFDownloadLink
      document={<InvoicePDF invoice={invoice} />}
      fileName={filename}
      className={className}
    >
      {({ loading }) => (
        <Button 
          variant={variant}
          size={size}
          disabled={loading}
          onClick={onDownload}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              მზადდება...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              PDF ჩამოტვირთვა
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  )
}