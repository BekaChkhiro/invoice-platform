# Invoice Platform — Project Plan

## Phase 1: Invoice signature upload

Goal: let the user upload a signature image (per company) and have it
rendered in the **bottom-left** of every generated invoice PDF.

The signature follows the same per-company pattern as `companies.logo_url`:
one signature per company, reused across all invoices issued by that
company. PDF rendering happens in `src/components/invoices/pdf/invoice-pdf.tsx`.

### T1.1 - Add `signature_url` column to companies table

Add a new nullable text column `signature_url` on the `companies` table
via a Supabase migration (mirrors `logo_url`). Update generated TS types
in `src/types/database.ts` so the new column is visible to the app.

Files:
- `supabase/migrations/<new>_add_company_signature.sql`
- `src/types/database.ts`

Acceptance:
- Migration applies cleanly to the remote project
- `Company` row type includes `signature_url: string | null`

### T1.2 - Storage bucket + upload helper for signatures

Reuse the existing avatar/logo storage approach. Either:
- Add a dedicated `signatures` bucket with RLS that scopes objects to
  the owning company, OR
- Reuse the existing logo bucket under a `signatures/` prefix.

Pick whichever matches the pattern already used for logo uploads
(`20250105_setup_avatars_storage.sql` is the reference). Add a small
upload helper if logo's helper can't be parameterised.

Acceptance:
- Authenticated user can upload an image (PNG/JPG, ≤2MB) to the bucket
- Only the owning company's members can read/overwrite the file
- Public URL (or signed URL) is returned and stored in
  `companies.signature_url`

### T1.3 - Signature upload UI in company settings

In `src/app/(dashboard)/dashboard/settings/company/page.tsx`, add a
"Signature" section next to the existing logo uploader:
- Drag-and-drop / file input (PNG/JPG, transparent background recommended)
- Preview of the current signature
- "Remove signature" button that clears `signature_url`
- Wire up to the storage helper from T1.2 and persist via the same
  company-update mutation as `logo_url`.

Acceptance:
- Uploading a signature persists `signature_url` on the company
- Removing it sets the column back to `NULL`
- Existing logo upload behavior is untouched

### T1.4 - Render signature in bottom-left of invoice PDF

In `src/components/invoices/pdf/invoice-pdf.tsx` (and
`invoice-pdf-template.tsx` if it diverges), render the company signature
in the **bottom-left** of the page:
- Use react-pdf `<Image>` pointing to `company.signature_url`
- Position absolutely at bottom-left of the document body, above the
  footer / page number area, with a small label ("ხელმოწერა" /
  "Signature") underneath
- Fixed max width (e.g. 160pt) and auto height to keep aspect ratio
- If `signature_url` is null/empty, render nothing (no empty box, no label)
- Make sure it works on multi-page PDFs — appears only on the **last
  page** (or only on page 1 — confirm the convention with the user; default
  to last page so the signature lives next to totals)

Files:
- `src/components/invoices/pdf/invoice-pdf.tsx`
- `src/components/invoices/pdf/invoice-pdf-template.tsx`
- `src/components/invoices/pdf/pdf-preview.tsx` (verify preview parity)

Acceptance:
- Generated PDF shows the signature image in bottom-left when set
- Layout doesn't shift when signature is absent
- Multi-page PDFs still paginate correctly

### T1.5 - Pass signature through public/share + email PDF flows

The signature must reach every code path that produces a PDF:
- Public share route `src/lib/services/invoice-public.ts`
- Email send route `src/app/api/invoices/[id]/send/route.ts`
- PDF token / direct download in `src/lib/utils/pdf-token.ts`

Make sure `company.signature_url` is selected in those queries and
threaded into the PDF component. Add a regression test (or manual
checklist) covering: dashboard preview, public link, emailed PDF,
direct download.

Acceptance:
- All four PDF entry points include the signature when set
- No new "missing field" errors in logs (`mcp__supabase__get_logs`)
