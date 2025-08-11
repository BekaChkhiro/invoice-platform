import { createHash } from 'crypto'

export function generatePdfToken(invoiceId: string, userId: string): string {
  const token = createHash('sha256')
    .update(`${invoiceId}-${userId}-${process.env.SUPABASE_JWT_SECRET}`)
    .digest('hex')
    .substring(0, 32)
  
  return token
}

export function getPublicPdfUrl(invoiceId: string, userId: string): string {
  const token = generatePdfToken(invoiceId, userId)
  return `/api/invoices/${invoiceId}/pdf/public?token=${token}`
}