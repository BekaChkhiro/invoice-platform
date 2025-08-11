# Invoice Platform - სრული პროექტის ანალიზი

## 📋 ზოგადი მიმოხილვა

**პროექტის სახელი:** Invoice Platform  
**ვერსია:** 0.1.0  
**ტექნოლოგია:** Next.js 15.4.5 + TypeScript + Supabase  
**მიზანი:** SaaS ინვოისინგის პლატფორმა ქართული ბიზნესებისთვის

## 🏗️ არქიტექტურა

### Tech Stack
- **Frontend Framework:** Next.js 15.4.5 (App Router)
- **Language:** TypeScript 5
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand + React Query (TanStack Query)
- **Forms:** React Hook Form + Zod validation
- **Authentication:** Supabase Auth
- **Email:** React Email components
- **PDF Generation:** Custom PDF utilities
- **Animations:** Framer Motion

### პროექტის სტრუქტურა
```
invoice-platform/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Authentication pages
│   │   ├── (dashboard)/        # Protected dashboard pages
│   │   ├── api/                # API routes
│   │   └── auth/               # Auth callback routes
│   ├── components/             # React components
│   │   ├── clients/            # Client management components
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── email/              # Email templates
│   │   ├── forms/              # Form components
│   │   ├── invoices/           # Invoice components
│   │   ├── layout/             # Layout components
│   │   ├── settings/           # Settings components
│   │   ├── subscription/       # Subscription components
│   │   └── ui/                 # Base UI components
│   ├── contexts/               # React contexts
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and services
│   │   ├── hooks/              # Business logic hooks
│   │   ├── pdf/                # PDF generation
│   │   ├── services/           # API services
│   │   ├── supabase/           # Supabase client setup
│   │   ├── testing/            # Testing utilities
│   │   ├── utils/              # Helper utilities
│   │   └── validations/        # Zod schemas
│   ├── middleware/             # Next.js middleware
│   ├── styles/                 # Global styles
│   └── types/                  # TypeScript types
├── public/                     # Static assets
├── scripts/                    # Build scripts
└── configuration files         # Config files
```

## 💾 მონაცემთა ბაზის სტრუქტურა

### ძირითადი ცხრილები

#### 1. **profiles** - მომხმარებლის პროფილები
- `id` (UUID) - Primary key
- `email` (string) - უნიკალური ელ.ფოსტა
- `full_name` (string | null) - სრული სახელი
- `avatar_url` (string | null) - ავატარის URL
- `phone` (string | null) - ტელეფონი
- `created_at`, `updated_at` - Timestamps

#### 2. **companies** - კომპანიები
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to profiles
- `name` (string) - კომპანიის სახელი
- `tax_id` (string | null) - საიდენტიფიკაციო კოდი
- `address_line1`, `address_line2` (string | null) - მისამართი
- `city`, `postal_code` (string | null) - ქალაქი, საფოსტო კოდი
- `phone`, `email`, `website` (string | null) - კონტაქტები
- `logo_url` (string | null) - ლოგოს URL
- `bank_name`, `bank_account`, `bank_swift` (string | null) - საბანკო დეტალები
- `invoice_prefix` (string | null) - ინვოისის პრეფიქსი
- `invoice_counter` (number | null) - ინვოისის მთვლელი
- `invoice_notes`, `payment_terms` (string | null) - შენიშვნები
- `vat_rate`, `currency` - დღგ და ვალუტა
- `default_payment_terms`, `default_due_days` - ნაგულისხმევი პირობები

#### 3. **clients** - კლიენტები
- `id` (UUID) - Primary key
- `company_id` (UUID) - Foreign key to companies
- `type` ('individual' | 'company') - კლიენტის ტიპი
- `name` (string) - კლიენტის სახელი
- `tax_id` (string | null) - საიდენტიფიკაციო კოდი
- `email`, `phone` (string | null) - კონტაქტები
- `address_line1`, `address_line2`, `city`, `postal_code` - მისამართი
- `contact_person` (string | null) - საკონტაქტო პირი
- `notes` (string | null) - შენიშვნები
- `is_active` (boolean) - აქტიური სტატუსი

#### 4. **invoices** - ინვოისები
- `id` (UUID) - Primary key
- `company_id` (UUID) - Foreign key to companies
- `client_id` (UUID) - Foreign key to clients
- `invoice_number` (string) - ინვოისის ნომერი
- `issue_date` (date) - გამოწერის თარიღი
- `due_date` (date) - გადახდის ვადა
- `status` ('draft' | 'sent' | 'paid' | 'overdue') - სტატუსი
- `subtotal`, `vat_rate`, `vat_amount`, `total` - თანხები
- `notes`, `payment_instructions` - შენიშვნები
- `currency` ('GEL' | 'USD' | 'EUR') - ვალუტა
- `sent_at`, `paid_at` - გაგზავნის და გადახდის დროები

#### 5. **invoice_items** - ინვოისის პოზიციები
- `id` (UUID) - Primary key
- `invoice_id` (UUID) - Foreign key to invoices
- `description` (string) - აღწერა
- `quantity` (number) - რაოდენობა
- `unit_price` (number) - ერთეულის ფასი
- `line_total` (number) - ჯამი
- `sort_order` (number | null) - დალაგება

#### 6. **user_credits** - მომხმარებლის კრედიტები
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to profiles
- `total_credits` (number) - სულ კრედიტები
- `used_credits` (number) - გამოყენებული კრედიტები
- `plan_type` ('free' | 'basic' | 'pro') - გეგმის ტიპი
- `plan_expires_at` (timestamp) - გეგმის ვადა

### Subscription ცხრილები

#### 7. **subscription_plans** - საბაზო გეგმები
- `id` (UUID) - Primary key
- `name` (string) - გეგმის სახელი
- `description` (string | null) - აღწერა
- `price_monthly`, `price_yearly` (number) - ფასები
- `currency` (string) - ვალუტა
- `features` (JSONB) - ფუნქციები
- `is_active` (boolean) - აქტიური სტატუსი
- `sort_order` (number) - დალაგება

#### 8. **user_subscriptions** - მომხმარებლის გამოწერები
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to profiles
- `plan_id` (UUID) - Foreign key to subscription_plans
- `status` ('active' | 'cancelled' | 'expired' | 'past_due') - სტატუსი
- `current_period_start`, `current_period_end` - პერიოდი
- `cancel_at_period_end` (boolean) - გაუქმება პერიოდის ბოლოს
- `cancelled_at` (timestamp | null) - გაუქმების დრო
- `payment_method` (string | null) - გადახდის მეთოდი
- `trial_ends_at` (timestamp | null) - საცდელი პერიოდის დასრულება

## 🔐 Authentication & Authorization

### Authentication სისტემა
- **Provider:** Supabase Auth
- **Methods:** Email/Password რეგისტრაცია და შესვლა
- **Email Confirmation:** მომხმარებლები უნდა დაადასტურონ ელ.ფოსტა
- **Password Reset:** პაროლის აღდგენა ელ.ფოსტით
- **Session Management:** Supabase-ის სესიების მართვა

### Authorization Middleware
```typescript
// middleware.ts
- Session validation და განახლება
- Protected routes დაცვა
- Plan enforcement API routes-ისთვის
```

### Protected Routes
- `/dashboard/*` - მთავარი დაშბორდი
- `/api/*` - API endpoints
- `/settings/*` - პარამეტრები

## 🎯 ძირითადი ფუნქციონალი

### 1. კლიენტების მართვა
- **CRUD ოპერაციები:** შექმნა, წაკითხვა, განახლება, წაშლა
- **ტიპები:** ინდივიდუალური და კომპანია
- **ძებნა და ფილტრაცია:** სახელით, ელ.ფოსტით, საიდენტიფიკაციო კოდით
- **დუბლიკატების შემოწმება:** ავტომატური შემოწმება შექმნისას
- **სტატუსის მართვა:** აქტიური/არააქტიური

### 2. ინვოისების მართვა
- **Multi-step ფორმა:** კლიენტის არჩევა → დეტალები → გადახედვა
- **ავტომატური გამოთვლები:** ქვეჯამი, დღგ, ჯამი
- **სტატუსები:** draft, sent, paid, overdue
- **PDF გენერაცია:** ინვოისის PDF ექსპორტი
- **Email გაგზავნა:** პირდაპირი გაგზავნა კლიენტზე
- **დუბლირება:** არსებული ინვოისის კოპირება
- **ავტომატური ნუმერაცია:** კომპანიის პრეფიქსი + მთვლელი

### 3. Analytics Dashboard
- **სტატისტიკა:**
  - მთლიანი ინვოისები
  - გადახდილი/გადასახდელი თანხები
  - ვადაგადაცილებული ინვოისები
  - თვიური შემოსავალი
- **გრაფიკები:** Recharts ბიბლიოთეკით
- **ბოლო აქტივობები:** რეალურ დროში განახლებები
- **სწრაფი მოქმედებები:** ღილაკები ხშირი ოპერაციებისთვის

### 4. Subscription Management
- **გეგმები:** Free, Basic, Pro
- **ფუნქციების შეზღუდვები:**
  - ინვოისების ლიმიტი თვეში
  - კლიენტების მაქსიმუმი
  - PDF ექსპორტი
  - Email გაგზავნა
  - API წვდომა
  - გუნდის წევრები
  - Advanced analytics
- **Usage Tracking:** ყველა მოქმედების აღრიცხვა
- **Upgrade/Downgrade:** გეგმის ცვლილება
- **Payment Integration:** (მომავალი ფუნქცია)

### 5. Settings & Configuration
- **Company Profile:** კომპანიის ინფორმაცია
- **Billing Settings:** საბანკო დეტალები
- **Team Management:** გუნდის წევრების მართვა (Pro)
- **Invoice Templates:** შაბლონების კონფიგურაცია
- **Email Templates:** ელ.ფოსტის შაბლონები

## 🔧 API Routes

### Client APIs
- `GET /api/clients` - კლიენტების სია
- `POST /api/clients` - ახალი კლიენტი
- `GET /api/clients/[id]` - კონკრეტული კლიენტი
- `PUT /api/clients/[id]` - კლიენტის განახლება
- `DELETE /api/clients/[id]` - კლიენტის წაშლა
- `GET /api/clients/[id]/invoices` - კლიენტის ინვოისები
- `GET /api/clients/[id]/stats` - კლიენტის სტატისტიკა
- `POST /api/clients/[id]/toggle-status` - სტატუსის შეცვლა
- `GET /api/clients/search` - კლიენტების ძებნა

### Invoice APIs
- `GET /api/invoices` - ინვოისების სია
- `POST /api/invoices` - ახალი ინვოისი
- `GET /api/invoices/[id]` - კონკრეტული ინვოისი
- `PUT /api/invoices/[id]` - ინვოისის განახლება
- `DELETE /api/invoices/[id]` - ინვოისის წაშლა
- `POST /api/invoices/[id]/send` - ინვოისის გაგზავნა
- `POST /api/invoices/[id]/duplicate` - ინვოისის დუბლირება
- `GET /api/invoices/[id]/pdf` - PDF გენერაცია
- `PUT /api/invoices/[id]/status` - სტატუსის ცვლილება
- `GET /api/invoices/stats` - ინვოისების სტატისტიკა

### User APIs
- `GET /api/user/credits` - მომხმარებლის კრედიტები

## 🎨 UI/UX Components

### Base Components (shadcn/ui)
- Accordion, Alert, Avatar, Badge
- Button, Calendar, Card, Checkbox
- Dialog, Dropdown, Form controls
- Input, Label, Popover, Progress
- Radio, Select, Separator, Sheet
- Skeleton, Switch, Table, Tabs
- Textarea, Toast, Tooltip

### Custom Components
- **DashboardWrapper:** Layout wrapper დაშბორდისთვის
- **Sidebar:** ნავიგაციის გვერდითი პანელი
- **Topbar:** ზედა ნავიგაცია
- **MobileNav:** მობილური ნავიგაცია
- **ClientTable:** კლიენტების ცხრილი
- **InvoiceTable:** ინვოისების ცხრილი
- **ClientSelector:** კლიენტის არჩევის კომპონენტი
- **InvoiceItems:** ინვოისის პოზიციების მართვა
- **PdfPreview:** PDF-ის გადახედვა
- **EmailDialog:** ელ.ფოსტის გაგზავნის დიალოგი
- **PlanCards:** გეგმების ბარათები
- **UpgradeModal:** გეგმის შეცვლის მოდალი

## 🪝 Custom Hooks

### Authentication Hooks
- `useAuth()` - მომხმარებლის ავთენტიფიკაცია
- `useAuthMock()` - Mock ავთენტიფიკაცია ტესტირებისთვის

### Data Hooks
- `useClients()` - კლიენტების მართვა
- `useInvoices()` - ინვოისების მართვა
- `useInvoiceForm()` - ინვოისის ფორმის ლოგიკა
- `useInvoiceStats()` - ინვოისების სტატისტიკა
- `useClientSearch()` - კლიენტების ძებნა
- `useCredits()` - კრედიტების მართვა

### Subscription Hooks
- `useSubscription()` - გამოწერის მართვა
- `useCurrentPlan()` - მიმდინარე გეგმა
- `useInvoiceLimit()` - ინვოისების ლიმიტი
- `useUsageStats()` - გამოყენების სტატისტიკა
- `useFeatureFlags()` - ფუნქციების ფლაგები

### Utility Hooks
- `useDebounce()` - Debounced values
- `useEmail()` - ელ.ფოსტის გაგზავნა
- `useKeyboardShortcuts()` - კლავიატურის shortcuts

## 🛠️ Services Layer

### Client Service
```typescript
clientService: {
  getClients(companyId, filters)
  getClient(id)
  createClient(companyId, data)
  updateClient(id, data)
  deleteClient(id)
  toggleStatus(id)
  searchClients(query)
}
```

### Invoice Service
```typescript
invoiceService: {
  getInvoices(filter)
  getInvoice(id)
  createInvoice(data)
  updateInvoice(id, data)
  deleteInvoice(id)
  duplicateInvoice(id)
  sendInvoice(id, emailData)
  updateStatus(id, status)
  generatePDF(id)
  getStats(companyId)
}
```

### Subscription Service
```typescript
subscriptionService: {
  getAvailablePlans()
  getCurrentUserPlan(userId)
  assignFreePlan(userId)
  checkInvoiceLimit(userId)
  upgradePlan(userId, planId)
  downgradePlan(userId, planId)
  cancelSubscription(userId)
  trackUsage(userId, action, resource)
  getUsageStats(userId, period)
}
```

### Email Service
```typescript
emailService: {
  sendInvoice(invoice, recipient)
  sendWelcomeEmail(user)
  sendPasswordReset(email, token)
  sendPlanUpgrade(user, plan)
  sendUsageWarning(user, usage)
}
```

## 🔒 Security Features

### Data Protection
- Row Level Security (RLS) Supabase-ში
- User isolation - თითოეული მომხმარებელი ხედავს მხოლოდ თავის მონაცემებს
- Company-based access control

### Input Validation
- Zod schemas ყველა ფორმისთვის
- Server-side validation API routes-ში
- SQL injection prevention
- XSS protection

### Authentication Security
- Email verification required
- Secure password reset flow
- Session management
- CSRF protection

## 📱 Mobile Optimization

### Responsive Design
- Mobile-first approach
- Tailwind breakpoints
- Touch-optimized UI elements
- Pull-to-refresh functionality

### PWA Features (Planned)
- Service Worker
- Offline capability
- Push notifications
- App-like experience

## 🧪 Testing Infrastructure

### Test Types
- Unit tests - ბიზნეს ლოგიკა
- Integration tests - API endpoints
- E2E tests - კრიტიკული flows
- Performance tests - Load testing
- Production readiness checks

### Test Commands
```json
"test:all": "Full test suite"
"test:critical": "Critical tests only"
"test:performance": "Performance regression tests"
"test:post-deployment": "Post-deployment verification"
"test:monitor": "Monitoring tests"
"test:pre-deploy": "Pre-deployment checks"
```

## 🚀 Deployment & DevOps

### Build Configuration
- Next.js production build
- TypeScript compilation
- Tailwind CSS purging
- Bundle optimization

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `EMAIL_SERVER_*` (SMTP config)

### Deployment Targets
- Vercel (recommended)
- Netlify
- Self-hosted (Docker)

## 📊 Performance Optimizations

### Code Splitting
- Dynamic imports
- Route-based splitting
- Component lazy loading

### Caching Strategy
- React Query caching
- Supabase query caching
- Static asset caching
- API response caching

### Image Optimization
- Next.js Image component
- WebP format support
- Lazy loading
- Responsive images

## 🔄 State Management

### Global State (Zustand)
- User preferences
- UI state
- Temporary data

### Server State (React Query)
- API data caching
- Optimistic updates
- Background refetching
- Error handling

### Form State (React Hook Form)
- Form validation
- Field state management
- Error messages
- Submit handling

## 🌐 Internationalization

### Current Support
- Georgian (ka) - Primary
- English (en) - Planned

### Implementation
- Static translations
- Date/time formatting
- Number formatting
- Currency display

## 📈 Analytics & Monitoring

### User Analytics
- Usage tracking
- Feature adoption
- Error tracking
- Performance metrics

### Business Analytics
- Invoice statistics
- Revenue tracking
- Client analytics
- Growth metrics

## 🎯 მომავალი განვითარება

### Planned Features
1. **Payment Gateway Integration**
   - Bank of Georgia
   - TBC Pay
   - PayPal/Stripe

2. **Advanced Features**
   - Recurring invoices
   - Multi-currency support
   - Custom branding
   - White-label option

3. **Integrations**
   - Accounting software
   - CRM systems
   - Calendar sync
   - Webhook support

4. **Mobile Apps**
   - iOS native app
   - Android native app
   - React Native implementation

5. **AI Features**
   - Smart invoice creation
   - Payment prediction
   - Client insights
   - Automated reminders

## 🐛 Known Issues

1. **Performance**
   - Large dataset pagination needs optimization
   - PDF generation can be slow for complex invoices

2. **UX**
   - Mobile navigation could be improved
   - Form validation messages need better visibility

3. **Features**
   - Email templates need more customization
   - Bulk operations not fully implemented

## 📝 Development Guidelines

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Conventional commits

### Git Workflow
- Feature branches
- Pull request reviews
- Automated testing
- Semantic versioning

### Documentation
- Code comments
- API documentation
- User guides
- Developer docs

## 🤝 Contributing

### Setup Instructions
1. Clone repository
2. Install dependencies: `npm install`
3. Setup Supabase project
4. Configure environment variables
5. Run migrations
6. Start development: `npm run dev`

### Development Process
1. Create feature branch
2. Implement changes
3. Write tests
4. Submit pull request
5. Code review
6. Merge to main

## 📞 Support & Contact

- **Documentation:** /help page
- **Issues:** GitHub Issues
- **Email:** support@invoiceplatform.ge
- **Discord:** [Community Server]

## 📄 License & Legal

- **License:** Private/Commercial
- **Privacy Policy:** GDPR compliant
- **Terms of Service:** Standard SaaS terms
- **Data Retention:** 90 days for free, unlimited for paid

---

*დოკუმენტი განახლებულია: 2025-08-11*
*ვერსია: 1.0.0*
*ავტორი: Invoice Platform Development Team*