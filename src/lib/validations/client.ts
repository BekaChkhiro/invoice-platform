import * as z from "zod"

export const clientSchema = z.object({
  type: z.enum(['individual', 'company'], {
    required_error: "აირჩიეთ კლიენტის ტიპი",
  }),
  name: z.string().min(2, "სახელი სავალდებულოა"),
  tax_id: z.string().optional(),
  email: z.string().email("არასწორი ელ.ფოსტის ფორმატი").optional().or(z.literal("")),
  phone: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  contact_person: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
}).refine((data) => {
  // Company type requires tax_id
  if (data.type === 'company' && !data.tax_id) {
    return false
  }
  return true
}, {
  message: "იურიდიული პირისთვის საიდენტიფიკაციო კოდი სავალდებულოა",
  path: ["tax_id"],
})

export type ClientFormData = z.infer<typeof clientSchema>

export const clientFilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['all', 'individual', 'company']).default('all'),
  is_active: z.boolean().optional(),
})

export type ClientFilter = z.infer<typeof clientFilterSchema>