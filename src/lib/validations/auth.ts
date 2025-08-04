import * as z from "zod"

const passwordSchema = z
  .string()
  .min(8, "პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო")
  .regex(/[A-Z]/, "პაროლი უნდა შეიცავდეს მინიმუმ 1 დიდ ასოს")
  .regex(/[0-9]/, "პაროლი უნდა შეიცავდეს მინიმუმ 1 ციფრს")

export const loginSchema = z.object({
  email: z
    .string()
    .email("არასწორი ელ.ფოსტის ფორმატი")
    .toLowerCase(),
  password: z.string().min(1, "პაროლი სავალდებულოა"),
})

export const registerSchema = z.object({
  email: z
    .string()
    .email("არასწორი ელ.ფოსტის ფორმატი")
    .toLowerCase(),
  password: passwordSchema,
  confirmPassword: z.string(),
  terms: z
    .boolean()
    .refine((val) => val === true, "უნდა დაეთანხმოთ პირობებს"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "პაროლები არ ემთხვევა",
  path: ["confirmPassword"],
})

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email("არასწორი ელ.ფოსტის ფორმატი")
    .toLowerCase(),
})

export const newPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "პაროლები არ ემთხვევა",
  path: ["confirmPassword"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type NewPasswordInput = z.infer<typeof newPasswordSchema>