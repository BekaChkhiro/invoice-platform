"use client"

import { useState } from "react"

// Force dynamic rendering to avoid SSG issues with Supabase client
export const dynamic = 'force-dynamic'
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { authService } from "@/lib/supabase/auth"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      terms: false,
    },
  })

  const password = watch("password", "")

  // Password strength calculator
  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(password)

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await authService.register({
        email: data.email,
        password: data.password
      })

      if (result.success) {
        setSuccess(true)
        toast.success("რეგისტრაცია წარმატებულია!", {
          description: result.message || "გთხოვთ შეამოწმოთ ელ.ფოსტა დასადასტურებლად."
        })
      } else {
        setError(result.message || "რეგისტრაცია ვერ მოხერხდა")
      }

    } catch (error) {
      console.error('Registration exception:', error)
      setError("რეგისტრაცია ვერ მოხერხდა")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">რეგისტრაცია</h1>
        <p className="text-gray-600 mt-2">
          შექმენით ანგარიში და მიიღეთ 5 უფასო ინვოისი
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            რეგისტრაცია წარმატებულია! შეამოწმეთ ელ.ფოსტა.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">ელ.ფოსტა</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            {...register("email")}
            disabled={isLoading || success}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">პაროლი</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
            disabled={isLoading || success}
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
          
          {/* Password strength indicator */}
          {password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < passwordStrength
                        ? passwordStrength <= 2
                          ? "bg-red-500"
                          : passwordStrength <= 3
                          ? "bg-yellow-500"
                          : "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-600">
                {passwordStrength <= 2
                  ? "სუსტი პაროლი"
                  : passwordStrength <= 3
                  ? "საშუალო პაროლი"
                  : "ძლიერი პაროლი"}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">გაიმეორეთ პაროლი</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register("confirmPassword")}
            disabled={isLoading || success}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="terms" 
            checked={watch("terms")}
            onCheckedChange={(checked) => setValue("terms", !!checked)}
            disabled={isLoading || success}
          />
          <Label
            htmlFor="terms"
            className="text-sm font-normal cursor-pointer"
          >
            ვეთანხმები{" "}
            <Link href="/terms" className="text-primary hover:underline">
              მომსახურების პირობებს
            </Link>
          </Label>
        </div>
        {errors.terms && (
          <p className="text-sm text-red-600">{errors.terms.message}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || success}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              რეგისტრაცია...
            </>
          ) : (
            "რეგისტრაცია"
          )}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-gray-600">უკვე გაქვთ ანგარიში?</span>{" "}
        <Link href="/login" className="text-primary hover:underline">
          შესვლა
        </Link>
      </div>
    </div>
  )
}