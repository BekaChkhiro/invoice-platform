"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Building2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const companySchema = z.object({
  name: z.string().min(2, "კომპანიის დასახელება სავალდებულოა"),
  tax_id: z.string().optional(),
  address_line1: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
})

type CompanyFormData = z.infer<typeof companySchema>

export default function TestOnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  })

  const onSubmit = async (data: CompanyFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // For testing, just log the data
      console.log('Company data:', data)

      toast({
        title: "კომპანია წარმატებით დაემატა!",
        description: "ახლა შეგიძლიათ დაიწყოთ ინვოისების შექმნა.",
      })

      // Simulate success
      setTimeout(() => {
        setIsLoading(false)
        router.push("/dashboard")
      }, 1000)

    } catch (error: any) {
      setError(error.message || "კომპანიის შექმნა ვერ მოხერხდა")
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    const form = document.getElementById('company-form') as HTMLFormElement
    form.requestSubmit()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">მოგესალმებით Invoice Platform-ზე!</CardTitle>
          <CardDescription>
            დავიწყოთ თქვენი კომპანიის ინფორმაციის შევსებით
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form id="company-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">კომპანიის დასახელება *</Label>
                <Input
                  id="name"
                  placeholder="შპს Example"
                  {...register("name")}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_id">საიდენტიფიკაციო კოდი</Label>
                <Input
                  id="tax_id"
                  placeholder="123456789"
                  {...register("tax_id")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_line1">მისამართი</Label>
                <Input
                  id="address_line1"
                  placeholder="რუსთაველის 1"
                  {...register("address_line1")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">ქალაქი</Label>
                <Input
                  id="city"
                  placeholder="თბილისი"
                  {...register("city")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">საფოსტო კოდი</Label>
                <Input
                  id="postal_code"
                  placeholder="0101"
                  {...register("postal_code")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">ტელეფონი</Label>
                <Input
                  id="phone"
                  placeholder="+995 555 123 456"
                  {...register("phone")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">ელ.ფოსტა</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@example.ge"
                  {...register("email")}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website">ვებსაიტი</Label>
                <Input
                  id="website"
                  placeholder="https://example.ge"
                  {...register("website")}
                  disabled={isLoading}
                />
                {errors.website && (
                  <p className="text-sm text-red-600">{errors.website.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
              >
                გამოტოვება
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    შენახვა...
                  </>
                ) : (
                  "შენახვა და გაგრძელება"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}