import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'

import type { InvoiceWithDetails } from '@/lib/services/invoice'

// =====================================
// TYPES AND INTERFACES
// =====================================

interface InvoicePDFProps {
  invoice: InvoiceWithDetails
}

// =====================================
// STYLES
// =====================================

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
    backgroundColor: '#FFFFFF',
    color: '#111827'
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    marginBottom: 30,
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  
  companySection: {
    flex: 1,
    marginRight: 20
  },
  
  companyLogo: {
    width: 80,
    height: 40,
    marginBottom: 10,
    objectFit: 'contain'
  },
  
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 8
  },
  
  companyDetails: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.4
  },
  
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 10
  },
  
  invoiceInfo: {
    textAlign: 'right',
    fontSize: 10,
    color: '#374151'
  },
  
  // Client Section
  clientSection: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 5
  },
  
  clientTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8
  },
  
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5
  },
  
  clientDetails: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.4
  },
  
  // Table Styles
  table: {
    marginBottom: 20
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0ea5e9',
    padding: 8,
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 9
  },
  
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 35
  },
  
  tableRowAlternate: {
    backgroundColor: '#f9fafb'
  },
  
  // Table Columns
  colDescription: {
    flex: 3,
    paddingRight: 10
  },
  
  colQuantity: {
    flex: 1,
    textAlign: 'center'
  },
  
  colPrice: {
    flex: 1.5,
    textAlign: 'right'
  },
  
  colTotal: {
    flex: 1.5,
    textAlign: 'right',
    fontWeight: 'bold'
  },
  
  // Description in table
  itemDescription: {
    fontSize: 9,
    lineHeight: 1.3,
    color: '#374151'
  },
  
  // Totals Section
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end'
  },
  
  totalsTable: {
    width: 250
  },
  
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#0ea5e9',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12
  },
  
  // Footer Section
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  
  footerSection: {
    marginBottom: 15
  },
  
  footerTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5
  },
  
  footerText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.4
  },
  
  bankInfo: {
    marginTop: 5,
    paddingLeft: 10
  },
  
  // Status Badge
  statusBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#10b981',
    color: '#ffffff',
    padding: '5 10',
    fontSize: 8,
    fontWeight: 'bold'
  },
  
  // Watermark for drafts
  watermark: {
    position: 'absolute',
    top: 200,
    left: 100,
    transform: 'rotate(-45deg)',
    fontSize: 60,
    color: '#e5e7eb',
    opacity: 0.3,
    fontWeight: 'bold',
    zIndex: -1
  }
})

// =====================================
// MAIN COMPONENT
// =====================================

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice }) => {
  
  // Helper functions
  const formatCurrency = (amount: number, currency: string = 'GEL'): string => {
    const symbols = {
      GEL: '₾',
      USD: '$',
      EUR: '€'
    }
    
    return `${amount.toFixed(2)} ${symbols[currency as keyof typeof symbols] || currency}`
  }
  
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, 'dd/MM/yyyy')
  }
  
  const getStatusColor = (status: string): string => {
    const colors = {
      draft: '#6b7280',
      sent: '#3b82f6',
      paid: '#10b981',
      overdue: '#ef4444',
      cancelled: '#6b7280'
    }
    return colors[status as keyof typeof colors] || colors.draft
  }
  
  const getStatusLabel = (status: string): string => {
    const labels = {
      draft: 'გადასახდელი',
      sent: 'გაგზავნილი',
      paid: 'გადახდილი',
      overdue: 'ვადაგადაცილებული',
      cancelled: 'გაუქმებული'
    }
    return labels[status as keyof typeof labels] || status
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Status Badge */}
        {invoice.status !== 'draft' && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
            <Text>{getStatusLabel(invoice.status)}</Text>
          </View>
        )}
        
        {/* Draft Watermark */}
        {invoice.status === 'draft' && (
          <Text style={styles.watermark}>გადასახდელი</Text>
        )}

        {/* Header */}
        <View style={styles.header}>
          
          {/* Company Information */}
          <View style={styles.companySection}>
            {/* Company Logo - if available */}
            {/* Note: In real implementation, check if company has logo URL */}
            {/* <Image src={company.logoUrl} style={styles.companyLogo} /> */}
            
            <Text style={styles.companyName}>
              {/* This would come from company data */}
              თქვენი კომპანია
            </Text>
            
            <Text style={styles.companyDetails}>
              მისამართი: თბილისი, საქართველო{'\n'}
              ტელეფონი: +995 XXX XX XX XX{'\n'}
              ელ.ფოსტა: info@company.ge{'\n'}
              საიდ. კოდი: 123456789
            </Text>
          </View>

          {/* Invoice Information */}
          <View>
            <Text style={styles.invoiceTitle}>ინვოისი</Text>
            <View style={styles.invoiceInfo}>
              <Text>№ {invoice.invoice_number}</Text>
              <Text>გამოწერის თარიღი: {formatDate(invoice.issue_date)}</Text>
              <Text>გადახდის ვადა: {formatDate(invoice.due_date)}</Text>
            </View>
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.clientSection}>
          <Text style={styles.clientTitle}>გადამხდელი:</Text>
          <Text style={styles.clientName}>{invoice.client.name}</Text>
          <View style={styles.clientDetails}>
            {invoice.client.email && (
              <Text>ელ.ფოსტა: {invoice.client.email}</Text>
            )}
            {invoice.client.tax_id && (
              <Text>
                {invoice.client.type === 'individual' ? 'პირადი ნომერი:' : 'საიდ. კოდი:'} {invoice.client.tax_id}
              </Text>
            )}
            {invoice.client.address && (
              <Text>მისამართი: {invoice.client.address}</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>აღწერა</Text>
            <Text style={styles.colQuantity}>რაოდ.</Text>
            <Text style={styles.colPrice}>ერთ. ფასი</Text>
            <Text style={styles.colTotal}>ჯამი</Text>
          </View>

          {/* Table Rows */}
          {invoice.items.map((item, index) => (
            <View 
              key={item.id} 
              style={[
                styles.tableRow, 
                index % 2 === 1 && styles.tableRowAlternate
              ]}
            >
              <View style={styles.colDescription}>
                <Text style={styles.itemDescription}>
                  {item.description}
                </Text>
              </View>
              <Text style={styles.colQuantity}>
                {item.quantity.toString()}
              </Text>
              <Text style={styles.colPrice}>
                {formatCurrency(item.unit_price, invoice.currency)}
              </Text>
              <Text style={styles.colTotal}>
                {formatCurrency(item.line_total, invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            
            {/* Subtotal */}
            <View style={styles.totalRow}>
              <Text>ქვეჯამი:</Text>
              <Text>{formatCurrency(invoice.subtotal, invoice.currency)}</Text>
            </View>

            {/* VAT */}
            <View style={styles.totalRow}>
              <Text>დღგ ({invoice.vat_rate}%):</Text>
              <Text>{formatCurrency(invoice.vat_amount, invoice.currency)}</Text>
            </View>

            {/* Final Total */}
            <View style={styles.finalTotalRow}>
              <Text>სულ ჯამი:</Text>
              <Text>{formatCurrency(invoice.total, invoice.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          
          {/* Bank Account Information */}
          {invoice.bank_account && (
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>საბანკო რეკვიზიტები:</Text>
              <View style={styles.bankInfo}>
                <Text style={styles.footerText}>
                  ბანკი: {invoice.bank_account.bank_name}
                </Text>
                <Text style={styles.footerText}>
                  ანგარიში: {invoice.bank_account.account_number}
                </Text>
                {invoice.bank_account.account_name && (
                  <Text style={styles.footerText}>
                    მფლობელი: {invoice.bank_account.account_name}
                  </Text>
                )}
              </View>
            </View>
          )}
          

          {/* Additional Footer Info */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              ინვოისი გენერირებულია ავტომატურად • {formatDate(new Date())}
            </Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}