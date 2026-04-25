'use client'

import { format } from 'date-fns'
import type { CSSProperties } from 'react'

type Item = {
  id?: string
  description: string
  quantity: number
  unit_price: number
  line_total: number
  sort_order?: number | null
}

type BankAccount = {
  id?: string
  bank_name: string
  account_number: string
  account_name?: string | null
  is_default?: boolean
  is_primary?: boolean
}

type Company = {
  name?: string | null
  tax_id?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  postal_code?: string | null
  phone?: string | null
  email?: string | null
}

type Client = {
  name?: string | null
  type?: 'individual' | 'company' | null
  tax_id?: string | null
  email?: string | null
  phone?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  postal_code?: string | null
  contact_person?: string | null
}

type InvoiceData = {
  invoice_number?: string | null
  issue_date?: string | Date | null
  due_date?: string | Date | null
  status?: string | null
  currency?: string | null
  vat_rate?: number | null
  subtotal?: number | null
  vat_amount?: number | null
  total?: number | null
  items?: Item[]
  client?: Client | null
  company?: Company | null
  bank_accounts?: BankAccount[]
  bank_account?: BankAccount | null
}

interface Props {
  invoice: InvoiceData
  itemsSlice?: Item[]
  itemStartIndex?: number
  showTotals?: boolean
  pageNum?: number
  totalPages?: number
}

const fmtDate = (value?: string | Date | null) => {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  if (isNaN(d.getTime())) return '—'
  return format(d, 'dd.MM.yyyy')
}

const fmtMoney = (value: number | null | undefined, currency?: string | null) => {
  const n = Number(value || 0)
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₾'
  return `${symbol}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const statusLabel = (status?: string | null) => {
  switch (status) {
    case 'paid': return 'გადახდილი'
    case 'sent': return 'გაგზავნილი'
    case 'overdue': return 'ვადაგადაცილებული'
    case 'cancelled': return 'გაუქმებული'
    case 'draft':
    default: return 'გადასახდელი'
  }
}

const statusColor = (status?: string | null): string => {
  switch (status) {
    case 'paid': return '#10b981'
    case 'sent': return '#3b82f6'
    case 'overdue': return '#ef4444'
    case 'cancelled': return '#6b7280'
    case 'draft':
    default: return '#9ca3af'
  }
}

const pageStyle: CSSProperties = {
  width: '794px',
  height: '1123px',
  padding: '40px',
  background: '#ffffff',
  color: '#111827',
  fontFamily:
    "'BPG Nino Mtavruli', 'Noto Sans Georgian', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: '13px',
  lineHeight: 1.5,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
}

const headerRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '32px',
  paddingBottom: '20px',
  borderBottom: '1px solid #e5e7eb',
}

const companyNameStyle: CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: '#0f172a',
  marginBottom: '8px',
}

const labelStyle: CSSProperties = {
  fontWeight: 600,
  color: '#111827',
}

const mutedStyle: CSSProperties = {
  color: '#6b7280',
  fontSize: '12px',
}

const invoiceTitleStyle: CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#2563eb',
  marginBottom: '6px',
  textAlign: 'right',
}

const invoiceNumberStyle: CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#0f172a',
  marginBottom: '12px',
  textAlign: 'right',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '24px',
  marginBottom: '24px',
}

const thStyle: CSSProperties = {
  background: '#1d4ed8',
  color: '#ffffff',
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
}

const tdStyle: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #e5e7eb',
  fontSize: '13px',
  verticalAlign: 'top',
}

const totalsBoxStyle: CSSProperties = {
  marginLeft: 'auto',
  width: '320px',
  marginTop: '12px',
}

const totalRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 12px',
  fontSize: '13px',
}

const grandTotalRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '12px',
  fontSize: '15px',
  fontWeight: 700,
  borderTop: '2px solid #0f172a',
  marginTop: '6px',
  background: '#f9fafb',
}

export default function InvoicePdfTemplate({
  invoice,
  itemsSlice,
  itemStartIndex = 0,
  showTotals = true,
  pageNum,
  totalPages,
}: Props) {
  const allItems = (invoice.items ?? []).slice().sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )
  const items = itemsSlice ?? allItems
  const company = invoice.company
  const banks = (invoice.bank_accounts && invoice.bank_accounts.length > 0)
    ? invoice.bank_accounts
    : (invoice.bank_account ? [invoice.bank_account] : [])

  const subtotal = invoice.subtotal ?? allItems.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0)
  const vatRate = invoice.vat_rate ?? 18
  const vatAmount = invoice.vat_amount ?? subtotal * (vatRate / 100)
  const total = invoice.total ?? subtotal + vatAmount
  const currency = invoice.currency || 'GEL'

  const companyAddress = [company?.address_line1, company?.address_line2, company?.city, company?.postal_code]
    .filter(Boolean)
    .join(', ')

  const isMultiPage = !!totalPages && totalPages > 1
  // Banks: show only on first page (when multi-page) or always (single page)
  const showBanks = banks.length > 0 && (!isMultiPage || pageNum === 1)

  return (
    <div style={pageStyle}>
      <div style={headerRow}>
        <div style={{ flex: 1, marginRight: '20px' }}>
          <div style={companyNameStyle}>{company?.name || 'კომპანია'}</div>
          {company?.tax_id && <div style={mutedStyle}>საიდ. კოდი: {company.tax_id}</div>}
          {companyAddress && <div style={mutedStyle}>{companyAddress}</div>}
          {company?.phone && <div style={mutedStyle}>ტელ: {company.phone}</div>}
          {company?.email && <div style={mutedStyle}>მეილი: {company.email}</div>}
        </div>
        <div style={{ minWidth: '220px' }}>
          <div style={invoiceTitleStyle}>ინვოისი</div>
          <div style={invoiceNumberStyle}># {invoice.invoice_number || '—'}</div>
          <div style={{ textAlign: 'right', fontSize: '12px' }}>
            <div><span style={labelStyle}>გამოცემა:</span> {fmtDate(invoice.issue_date)}</div>
            <div><span style={labelStyle}>ვადა:</span> {fmtDate(invoice.due_date)}</div>
            <div style={{ marginTop: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  background: statusColor(invoice.status),
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {statusLabel(invoice.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showBanks && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ ...labelStyle, fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
            საბანკო რეკვიზიტები
          </div>
          {banks.map((b, idx) => (
            <div key={b.id || idx} style={{ marginBottom: idx < banks.length - 1 ? '10px' : 0 }}>
              <div style={{ fontWeight: 600 }}>
                {b.bank_name}
                {(b.is_default || b.is_primary) && (
                  <span style={{ marginLeft: '6px', fontSize: '11px', color: '#2563eb' }}>(მთავარი)</span>
                )}
              </div>
              <div style={mutedStyle}>ანგარიში: {b.account_number}</div>
              {b.account_name && <div style={mutedStyle}>მფლობელი: {b.account_name}</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '40px' }}>#</th>
              <th style={thStyle}>აღწერილობა</th>
              <th style={{ ...thStyle, width: '90px', textAlign: 'right' }}>რაოდ.</th>
              <th style={{ ...thStyle, width: '120px', textAlign: 'right' }}>ფასი</th>
              <th style={{ ...thStyle, width: '120px', textAlign: 'right' }}>ჯამი</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#9ca3af' }}>
                  ელემენტები არ არის
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td style={tdStyle}>{itemStartIndex + idx + 1}</td>
                  <td style={tdStyle}>{item.description}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {Number(item.quantity).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtMoney(item.unit_price, currency)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                    {fmtMoney(item.line_total ?? Number(item.quantity) * Number(item.unit_price), currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showTotals && (
      <div style={totalsBoxStyle}>
        <div style={totalRow}>
          <span>ქვეჯამი:</span>
          <span>{fmtMoney(subtotal, currency)}</span>
        </div>
        <div style={totalRow}>
          <span>დღგ ({vatRate}%):</span>
          <span>{fmtMoney(vatAmount, currency)}</span>
        </div>
        <div style={grandTotalRow}>
          <span>საბოლოო ჯამი:</span>
          <span>{fmtMoney(total, currency)}</span>
        </div>
      </div>
      )}

      <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: '11px' }}>
        <span>{showTotals ? `გმადლობთ ამ ინვოისის არჩევისთვის · ${format(new Date(), 'dd.MM.yyyy')}` : `${format(new Date(), 'dd.MM.yyyy')}`}</span>
        {isMultiPage && pageNum && totalPages && (
          <span>გვერდი {pageNum} / {totalPages}</span>
        )}
      </div>
    </div>
  )
}
