"use client"

import { useState, useEffect, Suspense } from "react"

// Force dynamic rendering to avoid SSG issues with Supabase client
export const dynamic = 'force-dynamic'
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { authService } from "@/lib/supabase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { z } from "zod"
import Link from "next/link"

const updatePasswordSchema = z.object({
  password: z.string().min(6, "პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "პაროლები არ ემთხვევა",
  path: ["confirmPassword"],
})

type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>

function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validatingCode, setValidatingCode] = useState(true)
  const [codeValid, setCodeValid] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get("code")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    const validateCode = async () => {
      if (!code) {
        setError("აღდგენის კოდი არ მოიძებნა")
        setValidatingCode(false)
        return
      }

      try {
        // Verify the reset code with Supabase
        const result = await authService.verifyResetCode(code)
        if (result.success) {
          setCodeValid(true)
        } else {
          setError("არასწორი ან ვადაგასული აღდგენის კოდი")
        }
      } catch (_error) {
        setError("კოდის შემოწმება ვერ მოხერხდა")
      } finally {
        setValidatingCode(false)
      }
    }

    validateCode()
  }, [code])

  const onSubmit = async (data: UpdatePasswordInput) => {
    if (!code) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await authService.updatePassword(code, data.password)

      if (result.success) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        setError(result.message || "პაროლის განახლება ვერ მოხერხდა")
      }
    } catch (error) {
      console.error('Update password exception:', error)
      setError("პაროლის განახლება ვერ მოხერხდა")
    } finally {
      setIsLoading(false)
    }
  }

  if (validatingCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h2 className="mt-6 text-2xl font-bold">კოდის შემოწმება...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (!codeValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
            <h2 className="mt-6 text-2xl font-bold">არასწორი ლინკი</h2>
            <p className="mt-2 text-gray-600">
              {error || "აღდგენის ლინკი არასწორია ან ვადაგასულია"}
            </p>
            <div className="mt-6">
              <Link href="/reset-password">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  ახალი ლინკის მოთხოვნა
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">პაროლი წარმატებით განახლდა</h2>
            <p className="text-gray-600 mt-2">
              თქვენ გადამისამართებთ შესვლის გვერდზე...
            </p>
            <div className="mt-6">
              <Link href="/login">
                <Button>
                  შესვლა
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">ახალი პაროლის დაყენება</h2>
          <p className="mt-2 text-gray-600">
            შეიყვანეთ თქვენი ახალი პაროლი
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">ახალი პაროლი</Label>
            <Input
              id="password"
              type="password"
              placeholder="შეიყვანეთ ახალი პაროლი"
              {...register("password")}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">პაროლის დადასტურება</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="გაიმეორეთ ახალი პაროლი"
              {...register("confirmPassword")}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                განახლება...
              </>
            ) : (
              "პაროლის განახლება"
            )}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            <ArrowLeft className="inline h-4 w-4 mr-1" />
            დაბრუნება შესვლაზე
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}