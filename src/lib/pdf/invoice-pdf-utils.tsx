import { pdf } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'

import { InvoicePDF } from '@/components/invoices/pdf/invoice-pdf'
import type { InvoiceWithDetails } from '@/lib/services/invoice'

// =====================================
// TYPES AND INTERFACES
// =====================================

interface PDFGenerationOptions {
  includeDraft?: boolean
  customFilename?: string
  metadata?: {
    title?: string
    author?: string
    subject?: string
    creator?: string
  }
}

interface PDFError extends Error {
  code?: string
  details?: any
}

// =====================================
// FORMATTING UTILITIES
// =====================================

/**
 * Format currency values with proper symbols and localization
 */
export const formatCurrency = (amount: number, currency: string = 'GEL'): string => {
  const symbols = {
    GEL: '₾',
    USD: '$',
    EUR: '€'
  }

  const symbol = symbols[currency as keyof typeof symbols] || currency
  const formattedAmount = new Intl.NumberFormat('ka-GE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)

  return `${formattedAmount} ${symbol}`
}

/**
 * Format dates for PDF display
 */
export const formatDate = (
  date: Date | string, 
  formatString: string = 'dd/MM/yyyy'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatDate:', date)
    return 'Invalid Date'
  }

  try {
    return format(dateObj, formatString, { locale: ka })
  } catch (error) {
    console.error('Date formatting error:', error)
    return dateObj.toLocaleDateString('ka-GE')
  }
}

/**
 * Format Georgian text for PDF compatibility
 */
export const formatGeorgianText = (text: string): string => {
  // Handle Georgian text encoding issues if any
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
}

/**
 * Generate safe filename for PDF download
 */
export const generateSafeFilename = (
  invoiceNumber: string, 
  clientName: string, 
  extension: string = 'pdf'
): string => {
  const safeInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '-')
  const safeClientName = clientName
    .replace(/[^a-zA-Z0-9\u10A0-\u10FF]/g, '-') // Keep Georgian characters
    .substring(0, 30) // Limit length
  
  const timestamp = format(new Date(), 'yyyy-MM-dd')
  
  return `invoice-${safeInvoiceNumber}-${safeClientName}-${timestamp}.${extension}`
}

// =====================================
// PDF GENERATION FUNCTIONS
// =====================================

/**
 * Generate PDF blob from invoice data
 */
export const generateInvoicePDF = async (
  invoice: InvoiceWithDetails,
  options: PDFGenerationOptions = {}
): Promise<Blob> => {
  try {
    // Validate invoice data
    validateInvoiceData(invoice)

    // Create PDF document
    const pdfDocument = <InvoicePDF invoice={invoice} />
    
    // Generate PDF blob
    const pdfBlob = await pdf(pdfDocument).toBlob()
    
    // Add metadata if provided
    if (options.metadata) {
      // Note: @react-pdf/renderer doesn't support runtime metadata modification
      // This would need to be handled at the document level
      console.log('PDF metadata:', options.metadata)
    }

    return pdfBlob
    
  } catch (error) {
    const pdfError: PDFError = new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    pdfError.code = 'PDF_GENERATION_ERROR'
    pdfError.details = { invoice: invoice.id, error }
    throw pdfError
  }
}

/**
 * Generate PDF and return as base64 string
 */
export const generateInvoicePDFBase64 = async (
  invoice: InvoiceWithDetails,
  options: PDFGenerationOptions = {}
): Promise<string> => {
  try {
    const pdfBlob = await generateInvoicePDF(invoice, options)
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1] // Remove data:application/pdf;base64, prefix
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(pdfBlob)
    })
    
  } catch (error) {
    throw new Error(`Base64 conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate PDF buffer for server-side operations
 */
export const generateInvoicePDFBuffer = async (
  invoice: InvoiceWithDetails,
  options: PDFGenerationOptions = {}
): Promise<Buffer> => {
  try {
    const pdfDocument = <InvoicePDF invoice={invoice} />
    const pdfBuffer = await pdf(pdfDocument).toBuffer()
    
    return pdfBuffer
    
  } catch (error) {
    throw new Error(`PDF buffer generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// =====================================
// DOWNLOAD AND SHARING FUNCTIONS
// =====================================

/**
 * Download PDF file to user's device
 */
export const downloadPDF = (
  pdfBlob: Blob, 
  filename: string = 'invoice.pdf'
): void => {
  try {
    // Create download URL
    const url = URL.createObjectURL(pdfBlob)
    
    // Create temporary download link
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('PDF download failed:', error)
    throw new Error('PDF ჩამოტვირთვა ვერ მოხერხდა')
  }
}

/**
 * Print PDF file
 */
export const printPDF = (pdfBlob: Blob): void => {
  try {
    // Create object URL for PDF
    const url = URL.createObjectURL(pdfBlob)
    
    // Open in new window for printing
    const printWindow = window.open(url, '_blank')
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
        // Note: Don't close automatically as user might need time
      }
    } else {
      // Fallback: create iframe for printing
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      
      document.body.appendChild(iframe)
      
      iframe.onload = () => {
        iframe.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
          URL.revokeObjectURL(url)
        }, 1000)
      }
    }
    
  } catch (error) {
    console.error('PDF print failed:', error)
    throw new Error('PDF ბეჭდვა ვერ მოხერხდა')
  }
}

/**
 * Share PDF using Web Share API or fallback
 */
export const sharePDF = async (
  pdfBlob: Blob,
  filename: string,
  title: string = 'ინვოისი'
): Promise<void> => {
  try {
    if (navigator.share && navigator.canShare) {
      const file = new File([pdfBlob], filename, { type: 'application/pdf' })
      
      const shareData = {
        title,
        files: [file]
      }
      
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData)
        return
      }
    }
    
    // Fallback: download
    downloadPDF(pdfBlob, filename)
    
  } catch (error) {
    console.error('PDF sharing failed:', error)
    // Fallback to download on error
    downloadPDF(pdfBlob, filename)
  }
}

// =====================================
// VALIDATION FUNCTIONS
// =====================================

/**
 * Validate invoice data before PDF generation
 */
export const validateInvoiceData = (invoice: InvoiceWithDetails): void => {
  const errors: string[] = []

  // Required fields validation
  if (!invoice.id) errors.push('Invoice ID is required')
  if (!invoice.invoice_number) errors.push('Invoice number is required')
  if (!invoice.client?.name) errors.push('Client name is required')
  if (!invoice.items?.length) errors.push('Invoice items are required')
  
  // Date validation
  if (!invoice.issue_date) errors.push('Issue date is required')
  if (!invoice.due_date) errors.push('Due date is required')
  
  // Numeric validation
  if (typeof invoice.subtotal !== 'number' || invoice.subtotal < 0) {
    errors.push('Invalid subtotal amount')
  }
  if (typeof invoice.total !== 'number' || invoice.total < 0) {
    errors.push('Invalid total amount')
  }
  
  // Currency validation
  const validCurrencies = ['GEL', 'USD', 'EUR']
  if (!validCurrencies.includes(invoice.currency)) {
    errors.push('Invalid currency')
  }
  
  // Items validation
  invoice.items.forEach((item, index) => {
    if (!item.description?.trim()) {
      errors.push(`Item ${index + 1}: Description is required`)
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Invalid quantity`)
    }
    if (typeof item.unit_price !== 'number' || item.unit_price < 0) {
      errors.push(`Item ${index + 1}: Invalid unit price`)
    }
  })

  if (errors.length > 0) {
    throw new Error(`Invoice validation failed: ${errors.join(', ')}`)
  }
}

/**
 * Check browser PDF support
 */
export const checkPDFSupport = (): boolean => {
  try {
    // Check if PDF.js or native PDF support is available
    return (
      typeof window !== 'undefined' &&
      (
        'PDFObject' in window ||
        navigator.mimeTypes['application/pdf'] ||
        navigator.plugins['Chrome PDF Plugin'] ||
        navigator.plugins['Chrome PDF Viewer'] ||
        navigator.plugins['Adobe Acrobat']
      )
    )
  } catch {
    return false
  }
}

// =====================================
// UTILITY FUNCTIONS
// =====================================

/**
 * Get file size in human readable format
 */
export const getFileSizeString = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Byte'
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Create PDF preview URL
 */
export const createPDFPreviewURL = (pdfBlob: Blob): string => {
  return URL.createObjectURL(pdfBlob)
}

/**
 * Cleanup PDF preview URL
 */
export const cleanupPDFPreviewURL = (url: string): void => {
  URL.revokeObjectURL(url)
}

/**
 * Check if device supports PDF download
 */
export const canDownloadPDF = (): boolean => {
  return typeof window !== 'undefined' && 'download' in document.createElement('a')
}

/**
 * Check if device supports printing
 */
export const canPrintPDF = (): boolean => {
  return typeof window !== 'undefined' && 'print' in window
}

/**
 * Get PDF generation statistics
 */
export const getPDFStats = (invoice: InvoiceWithDetails) => {
  return {
    itemCount: invoice.items.length,
    pageEstimate: Math.ceil(invoice.items.length / 20) + 1, // Rough estimate
    complexity: invoice.items.length > 50 ? 'high' : invoice.items.length > 20 ? 'medium' : 'low'
  }
}