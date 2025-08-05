"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
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
    if (!user) {
      setError("მომხმარებელი ვერ მოიძებნა")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("Creating company for user:", user.id)
      console.log("Company data:", data)
      
      const { data: insertData, error: insertError } = await supabase
        .from("companies")
        .insert({
          user_id: user.id,
          invoice_prefix: "INV",
          invoice_counter: 1,
          vat_rate: 18,
          currency: "GEL",
          ...data,
          name: data.name || "ჩემი კომპანია",
        })
        .select()

      console.log("Insert result:", insertData)
      console.log("Insert error:", insertError)

      if (insertError) throw insertError

      toast({
        title: "კომპანია წარმატებით დაემატა!",
        description: "ახლა შეგიძლიათ დაიწყოთ ინვოისების შექმნა.",
      })

      router.push("/dashboard")
      router.refresh()

    } catch (error) {
      console.error("Company creation error:", error)
      setError(error instanceof Error ? error.message : "კომპანიის შექმნა ვერ მოხერხდა")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    // Create minimal company record
    await onSubmit({ name: "ჩემი კომპანია" })
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
                  <p className="text-sm text-error">{errors.name.message}</p>
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
                  <p className="text-sm text-error">{errors.email.message}</p>
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
                  <p className="text-sm text-error">{errors.website.message}</p>
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