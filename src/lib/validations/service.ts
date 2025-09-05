import * as z from "zod"

export const serviceSchema = z.object({
  name: z.string().min(2, "სერვისის სახელი სავალდებულოა"),
  description: z.string().optional(),
  default_price: z.number().min(0, "ფასი არ შეიძლება იყოს უარყოფითი").optional(),
  unit: z.string().max(50, "საზომი ერთეული ძალიან გრძელია").default("ცალი"),
  is_active: z.boolean().default(true),
})

export type ServiceFormData = z.infer<typeof serviceSchema>

export const serviceFilterSchema = z.object({
  search: z.string().optional(),
  is_active: z.boolean().optional(),
})

export type ServiceFilter = z.infer<typeof serviceFilterSchema>