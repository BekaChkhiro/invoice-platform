# 📧 Email System Setup Guide

This guide will help you set up the comprehensive email system for invoice management.

## 🎯 Overview

The email system includes:
- ✅ Email service layer (`src/lib/services/email.ts`)
- ✅ Email dialog component (`src/components/email/email-dialog.tsx`)
- ✅ Email hooks (`src/lib/hooks/use-email.ts`)
- ✅ Supabase Edge Function (`supabase/functions/send-email/index.ts`)
- ✅ Database migrations (`supabase/migrations/20250805_email_system.sql`)

## 🚀 Setup Steps

### 1. Install Dependencies

The following packages have been installed:
```bash
npm install @react-email/components react-email @tanstack/react-query sonner react-hook-form @hookform/resolvers zod
```

### 2. Environment Variables

Add these environment variables to your `.env.local` and Supabase project:

```bash
# In your .env.local
RESEND_API_KEY=re_your_api_key_here

# In Supabase Dashboard > Settings > Environment Variables
RESEND_API_KEY=re_your_api_key_here
```

### 3. Database Migration

Run the database migration:
```bash
npx supabase db push
```

Or manually apply the migration file: `supabase/migrations/20250805_email_system.sql`

### 4. Deploy Edge Function

Deploy the email sending function:
```bash
npx supabase functions deploy send-email
```

### 5. Configure Resend

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain
3. Create an API key
4. Add the API key to your environment variables

## 📧 Email Templates

The system includes pre-built Georgian email templates:

### Invoice Email (`invoice-default`)
- Professional header with company branding
- Invoice details summary
- PDF attachment notice
- Payment instructions
- Georgian and English versions

### Payment Reminder (`reminder-gentle`)
- Polite reminder tone
- Outstanding amount display
- Overdue days calculation
- Payment instructions

### Payment Confirmation (`confirmation-payment`)
- Thank you message
- Payment details confirmation
- Success styling
- Future business invitation

## 🎛️ Component Usage

### Email Dialog Component

```tsx
import { EmailDialog } from '@/components/email/email-dialog'

function InvoicePage() {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setEmailDialogOpen(true)}>
        Send Invoice
      </Button>
      
      <EmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        invoice={invoice}
        initialTemplate="invoice-default"
        onEmailSent={(result) => {
          console.log('Email sent:', result)
        }}
      />
    </>
  )
}
```

### Email Hooks

```tsx
import { useSendEmail, useEmailHistory, useEmailOperations } from '@/lib/hooks/use-email'

function InvoiceActions({ invoice }: { invoice: InvoiceWithDetails }) {
  const { sendInvoice, isSendingInvoice, canSendEmail } = useEmailOperations(invoice)
  const { data: emailHistory } = useEmailHistory(invoice.id)
  
  const handleSendInvoice = () => {
    sendInvoice({
      invoice,
      options: {
        to: [invoice.client.email],
        subject: `Invoice #${invoice.invoice_number}`,
        attachPDF: true,
        template: 'invoice-default'
      }
    })
  }
  
  return (
    <div>
      <Button 
        onClick={handleSendInvoice}
        disabled={!canSendEmail || isSendingInvoice}
      >
        {isSendingInvoice ? 'Sending...' : 'Send Invoice'}
      </Button>
      
      <div>
        <h3>Email History</h3>
        {emailHistory?.map(email => (
          <div key={email.id}>
            {email.type} - {email.status} - {email.sent_at}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 🔧 Configuration

### Email Templates

Templates are configured in `src/lib/services/email.ts`:

```typescript
const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  'invoice-default': {
    id: 'invoice-default',
    name: 'ინვოისის გაგზავნა',
    subject: 'ინვოისი #{invoice_number} - {company_name}',
    // ... template content
  }
}
```

### Variable Substitution

Templates support these variables:
- `{client_name}` - Client's name
- `{invoice_number}` - Invoice number
- `{total_amount}` - Invoice total
- `{currency}` - Currency code
- `{issue_date}` - Issue date
- `{due_date}` - Due date
- `{company_name}` - Company name
- `{payment_instructions}` - Payment instructions
- `{custom_message}` - User's custom message

### Rate Limiting

The system includes built-in rate limiting:
- 100 emails per hour per user
- Configurable in the Edge Function
- Automatic retry handling

## 🎨 Email Styling

Templates use inline CSS for email client compatibility:
- Responsive design (mobile-friendly)
- Georgian font support
- Professional color scheme
- Cross-client compatibility

## 📊 Analytics & Tracking

The system tracks:
- Email delivery status
- Open rates (when supported)
- Click tracking
- Error logging
- Performance metrics

Access analytics through the database view:
```sql
SELECT * FROM email_analytics WHERE user_id = 'your-user-id';
```

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- User authentication validation
- Email address validation
- Rate limiting protection
- Secure attachment handling
- CORS protection

## 🚨 Error Handling

The system includes comprehensive error handling:
- Invalid email addresses
- PDF generation failures
- Rate limit exceeded
- Network timeouts
- Authentication errors

## 📱 Mobile Responsiveness

Email templates are optimized for:
- Mobile email clients
- Desktop email clients
- Web-based email clients
- Dark mode compatibility

## 🔍 Debugging

Enable debugging by checking:
1. Browser console for client-side errors
2. Supabase Edge Function logs
3. Email history table for delivery status
4. Network tab for API requests

## 🎯 Testing

Test the email system:
1. Send a test invoice email
2. Check email delivery in your inbox
3. Verify PDF attachment
4. Test different email templates
5. Check email history logging

## 📝 Customization

### Adding New Templates

1. Add template to `EMAIL_TEMPLATES` object
2. Define variables and content
3. Update TypeScript types if needed
4. Test template rendering

### Custom Variables

Add new variables by:
1. Updating `generateInvoiceVariables` function
2. Adding to template variable arrays
3. Using in template content

### Styling Changes

Modify template styling:
1. Update inline CSS in templates
2. Test across email clients
3. Ensure mobile compatibility

## 🚀 Deployment Checklist

- [ ] Environment variables set
- [ ] Database migration applied
- [ ] Edge function deployed
- [ ] Resend domain verified
- [ ] DNS records configured
- [ ] Email templates tested
- [ ] Rate limiting configured
- [ ] Error monitoring enabled

## 📞 Support

For issues or questions:
1. Check the email history table for error messages
2. Review Supabase Edge Function logs
3. Verify Resend API key and domain setup
4. Test with different email providers

## 🔄 Updates & Maintenance

Regular maintenance tasks:
- Monitor email delivery rates
- Update templates for seasonal content
- Review and adjust rate limits
- Clean up old email history
- Update dependencies

---

The email system is now fully configured and ready for production use! 🎉