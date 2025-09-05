import { getInvoiceByPublicToken } from '@/lib/services/invoice-public'
import { getInvoiceStatusLabel } from '@/lib/validations/invoice'
import PublicInvoiceActions from './PublicInvoiceActions'
import LandingHeader from '@/components/layout/landing-header'
import Link from 'next/link'
import { FileText } from 'lucide-react'

// Local helpers for consistent display
const formatCurrency = (amount: number, currency: string = 'GEL') => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '-'
  const symbols: Record<string, string> = { GEL: '₾', USD: '$', EUR: '€' }
  const symbol = symbols[currency] || currency
  const formatted = Number(amount).toLocaleString('ka-GE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return formatted + ' ' + symbol
}

const formatSafe = (value?: string | Date | null, pattern: Intl.DateTimeFormatOptions = {}) => {
  if (!value) return '-'
  const d = typeof value === 'string' ? new Date(value) : value
  if (!(d instanceof Date) || isNaN(d.getTime())) return '-'
  try {
    return d.toLocaleDateString('ka-GE', pattern)
  } catch {
    return '-'
  }
}

export const revalidate = 0 // Always fetch fresh data

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { data: invoice, error } = await getInvoiceByPublicToken(token)

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LandingHeader />
        
        <div className="mx-auto max-w-3xl p-6">
          <h1 className="text-xl font-semibold">ლინკი არასწორია ან ვადა გაუვიდა</h1>
          <p className="text-sm text-muted-foreground mt-2">
            გთხოვთ დაუკავშირდეთ გამგზავნ კომპანიას ახალი ლინკისთვის.
          </p>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 mt-12">
          <div className="container py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-lg text-white">Invoice Platform</span>
                </div>
                <p className="text-gray-400 max-w-md leading-relaxed">
                  ქართული ბიზნესებისთვის შექმნილი ინვოისების მართვის სისტემა. 
                  მარტივი, სწრაფი და უსაფრთხო.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-4">პლატფორმა</h3>
                <ul className="space-y-2">
                  <li><Link href="/" className="hover:text-white transition-colors">მთავარი</Link></li>
                  <li><Link href="/help" className="hover:text-white transition-colors">დახმარება</Link></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">შესვლა</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-4">მხარდაჭერა</h3>
                <ul className="space-y-2">
                  <li><a href="mailto:support@invoiceplatform.ge" className="hover:text-white transition-colors">support@invoiceplatform.ge</a></li>
                  <li><a href="tel:+995555123456" className="hover:text-white transition-colors">+995 555 12 34 56</a></li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  const shareUrl = (process.env.NEXT_PUBLIC_APP_URL || '') + '/i/' + token

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      sent: 'bg-blue-100 text-blue-700',
      overdue: 'bg-red-100 text-red-700',
      draft: 'bg-gray-100 text-gray-600',
      cancelled: 'bg-gray-100 text-gray-500',
    }
    return map[status] || map.draft
  }

  // Format for human-readable English month like "August 11, 2025"
  const formatHumanEN = (value?: string | Date | null) =>
    formatSafe(value, { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader />
      
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="rounded-xl border bg-card shadow-sm p-6">

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="text-sm text-primary">ინვოისი</div>
          <h1 className="text-2xl font-semibold tracking-tight"># {invoice.invoice_number}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>გამოცემა: {formatHumanEN(invoice.issue_date)}</span>
            <span>•</span>
            <span>ვადა: {formatHumanEN(invoice.due_date)}</span>
            <span className={'inline-flex items-center rounded px-2 py-0.5 ' + statusBadge(invoice.status)}>{getInvoiceStatusLabel(invoice.status)}</span>
          </div>
        </div>
        <PublicInvoiceActions shareUrl={shareUrl} invoiceId={invoice.id} token={token} />
      </div>


      <div className="mt-6">
        <div className="rounded-lg border bg-background p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{invoice.company?.name || 'კომპანია'}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 text-sm text-muted-foreground">
            {invoice.company?.tax_id && (
              <div>საიდენტიფიკაციო კოდი: {invoice.company.tax_id}</div>
            )}
            {(invoice.company?.address_line1 || invoice.company?.city || invoice.company?.postal_code) && (
              <div>
                მისამართი: {[invoice.company?.address_line1, invoice.company?.city].filter(Boolean).join(', ')}{invoice.company?.postal_code ? ', ' + invoice.company.postal_code : ''}
              </div>
            )}
              {invoice.company?.phone && <div>ტელ: {invoice.company.phone}</div>}
              {invoice.company?.email && <div>ე-მეილი: {invoice.company.email}</div>}
            </div>
            
            {/* საბანკო რეკვიზიტები მეორე კოლუმნში */}
            <div className="space-y-2 text-sm">
              {((invoice.bank_accounts && invoice.bank_accounts.length > 0) || invoice.bank_account) && (
                <div className="space-y-2">
                  <div className="font-medium text-foreground">
                    საბანკო რეკვიზიტები:
                  </div>
                  {invoice.bank_accounts && invoice.bank_accounts.length > 0 ? (
                    <div className="space-y-4">
                      {invoice.bank_accounts.map((account, index) => (
                        <div key={account.id} className={`p-3 bg-gray-50 rounded-md space-y-1`}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">ბანკი: {account.bank_name}</span>
                            {account.is_default && (
                              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-primary/10 text-primary">
                                მთავარი
                              </span>
                            )}
                          </div>
                          <div>ანგარიში: {account.account_number}</div>
                          {account.account_name && (
                            <div>მფლობელი: {account.account_name}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : invoice.bank_account ? (
                    <div className="p-3 bg-gray-50 rounded-md space-y-1">
                      <div className="font-medium">ბანკი: {invoice.bank_account.bank_name}</div>
                      <div>ანგარიში: {invoice.bank_account.account_number}</div>
                      {invoice.bank_account.account_name && (
                        <div>მფლობელი: {invoice.bank_account.account_name}</div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      <div className="mt-6 overflow-hidden rounded-lg border bg-background shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-primary-50 text-primary-700">
            <tr>
              <th className="p-3 w-10 text-left">#</th>
              <th className="p-3 text-left">აღწერილობა</th>
              <th className="p-3 text-right">რაოდ.</th>
              <th className="p-3 text-right">ერთ. ფასი</th>
              <th className="p-3 text-right">ჯამი</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it, idx) => (
              <tr key={it.id} className={'border-t ' + (idx % 2 === 1 ? 'bg-gray-50' : 'bg-white')}>
                <td className="p-3 align-top">{idx + 1}</td>
                <td className="p-3 align-top"><div className="font-medium text-foreground">{it.description}</div></td>
                <td className="p-3 text-right align-top">{it.quantity}</td>
                <td className="p-3 text-right align-top">{formatCurrency(it.unit_price, invoice.currency)}</td>
                <td className="p-3 text-right align-top font-medium">{formatCurrency(it.line_total, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-background p-4 shadow-sm">
          <h3 className="font-medium mb-2">დამატებითი ინფორმაცია</h3>
          <dl className="text-sm grid grid-cols-2 gap-y-2 gap-x-4">
            <dt className="text-muted-foreground">ვალუტა</dt>
            <dd>{invoice.currency}</dd>
            {invoice.vat_rate > 0 && (
              <>
                <dt className="text-muted-foreground">დღგ</dt>
                <dd>{invoice.vat_rate}%</dd>
              </>
            )}
            {invoice.sent_at && (
              <>
                <dt className="text-muted-foreground">გაგზავნის დრო</dt>
                <dd>{formatSafe(invoice.sent_at, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</dd>
              </>
            )}
            {invoice.paid_at && (
              <>
                <dt className="text-muted-foreground">გადახდის დრო</dt>
                <dd>{formatSafe(invoice.paid_at, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</dd>
              </>
            )}
          </dl>
        </div>
        <div className="rounded-lg border bg-background p-4 ml-auto w-full max-w-lg shadow-sm">
          {invoice.vat_rate > 0 ? (
            <>
              <div className="flex justify-between py-2 text-sm">
                <span>ქვეჯამი:</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span>დღგ ({invoice.vat_rate}%):</span>
                <span>{formatCurrency(invoice.vat_amount, invoice.currency)}</span>
              </div>
              <div className="flex justify-between items-center py-3 text-base font-semibold border-t mt-2 bg-primary-600 text-primary-foreground rounded-md px-3">
                <span>საბოლოო ჯამი</span>
                <span>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center py-3 text-base font-semibold bg-primary-600 text-primary-foreground rounded-md px-3">
              <span>საბოლოო ჯამი</span>
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        გმადლობთ ამ ინვოისის არჩევისთვის.
      </div>
      </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-12">
        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">Invoice Platform</span>
              </div>
              <p className="text-gray-400 max-w-md leading-relaxed">
                ქართული ბიზნესებისთვის შექმნილი ინვოისების მართვის სისტემა. 
                მარტივი, სწრაფი და უსაფრთხო.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">პლატფორმა</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="hover:text-white transition-colors">მთავარი</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">დახმარება</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">შესვლა</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">მხარდაჭერა</h3>
              <ul className="space-y-2">
                <li><a href="mailto:support@invoiceplatform.ge" className="hover:text-white transition-colors">support@invoiceplatform.ge</a></li>
                <li><a href="tel:+995555123456" className="hover:text-white transition-colors">+995 555 12 34 56</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
