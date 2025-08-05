"use client"

import { useState, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Building2, Upload, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const companySchema = z.object({
  name: z.string().min(2, "კომპანიის დასახელება სავალდებულოა"),
  tax_id: z.string().nullable().optional(),
  address_line1: z.string().nullable().optional(),
  address_line2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.union([
    z.string().email("არასწორი ელ.ფოსტის ფორმატი"),
    z.literal(""),
    z.literal(null),
    z.undefined()
  ]).optional(),
  website: z.union([
    z.string().url("არასწორი ვებსაიტის ფორმატი"),
    z.literal(""),
    z.literal(null),
    z.undefined()
  ]).optional(),
  // Banking
  bank_name: z.string().nullable().optional(),
  bank_account: z.string().nullable().optional(),
  bank_swift: z.string().nullable().optional(),
  // Invoice settings
  invoice_prefix: z.string().min(1, "პრეფიქსი სავალდებულოა"),
  invoice_notes: z.string().nullable().optional(),
  payment_terms: z.string().nullable().optional(),
  vat_rate: z.coerce.number().min(0).max(100),
})

type CompanyFormData = z.infer<typeof companySchema>

export default function CompanySettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [company, setCompany] = useState<any>(null)
  const supabase = createClient()


  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = form

  useEffect(() => {
    if (!authLoading && user) {
      loadCompany()
    } else if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])


  const loadCompany = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error('Failed to load company:', error)
      return
    }

    if (data) {
      setCompany(data)
      reset(data)
    }
  }

  const onSubmit = async (data: CompanyFormData) => {
    if (!user || !company) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("companies")
        .update(data)
        .eq("id", company.id)

      if (error) throw error

      toast({
        title: "კომპანიის ინფორმაცია შეინახა",
        description: "ცვლილებები წარმატებით შეინახა",
      })

      router.refresh()

    } catch (error: any) {
      console.error('Company update failed:', error)
      toast({
        title: "შეცდომა",
        description: error.message || "ცვლილებების შენახვა ვერ მოხერხდა",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user || !company) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "არასწორი ფაილის ტიპი",
        description: "გთხოვთ ატვირთოთ სურათი",
        variant: "destructive",
      })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "ფაილი ძალიან დიდია",
        description: "მაქსიმალური ზომა 2MB",
        variant: "destructive",
      })
      return
    }

    setUploadingLogo(true)

    try {
      // Delete old logo if exists
      if (company.logo_url) {
        const oldPath = company.logo_url.split('/').pop()
        await supabase.storage
          .from('company-logos')
          .remove([`${user.id}/${oldPath}`])
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath)

      // Update company record
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', company.id)

      if (updateError) throw updateError

      toast({
        title: "ლოგო ატვირთულია",
        description: "კომპანიის ლოგო წარმატებით განახლდა",
      })

      loadCompany()

    } catch (error: any) {
      toast({
        title: "შეცდომა",
        description: error.message || "ლოგოს ატვირთვა ვერ მოხერხდა",
        variant: "destructive",
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-500">ავტორიზაცია საჭიროა</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">კომპანიის პარამეტრები</h1>
        <p className="text-gray-500">მართეთ თქვენი კომპანიის ინფორმაცია და პარამეტრები</p>
        
        
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">ზოგადი</TabsTrigger>
            <TabsTrigger value="invoice">ინვოისის პარამეტრები</TabsTrigger>
            <TabsTrigger value="banking">საბანკო</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>კომპანიის ინფორმაცია</CardTitle>
                <CardDescription>
                  ეს ინფორმაცია გამოჩნდება თქვენს ინვოისებზე
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={company.logo_url} />
                    <AvatarFallback>
                      <Building2 className="h-12 w-12 text-gray-400" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="logo" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingLogo}
                          asChild
                        >
                          <span>
                            {uploadingLogo ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            ატვირთვა
                          </span>
                        </Button>
                      </div>
                    </Label>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG ან SVG. მაქს. 2MB
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">კომპანიის დასახელება *</Label>
                    <Input
                      id="name"
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
                      {...register("tax_id")}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address_line1">მისამართი</Label>
                    <Input
                      id="address_line1"
                      {...register("address_line1")}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">ქალაქი</Label>
                    <Input
                      id="city"
                      {...register("city")}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">საფოსტო კოდი</Label>
                    <Input
                      id="postal_code"
                      {...register("postal_code")}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">ტელეფონი</Label>
                    <Input
                      id="phone"
                      {...register("phone")}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">ელ.ფოსტა</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="website">ვებსაიტი</Label>
                    <Input
                      id="website"
                      {...register("website")}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ინვოისის პარამეტრები</CardTitle>
                <CardDescription>
                  დააკონფიგურირეთ ინვოისის ნაგულისხმევი პარამეტრები
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_prefix">ინვოისის პრეფიქსი</Label>
                    <Input
                      id="invoice_prefix"
                      {...register("invoice_prefix")}
                      disabled={isLoading}
                    />
                    {errors.invoice_prefix && (
                      <p className="text-sm text-error">{errors.invoice_prefix.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      მაგ: INV-2024-0001
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vat_rate">დღგ განაკვეთი (%)</Label>
                    <Input
                      id="vat_rate"
                      type="number"
                      step="0.01"
                      {...register("vat_rate", { valueAsNumber: true })}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_terms">გადახდის პირობები</Label>
                  <Textarea
                    id="payment_terms"
                    rows={3}
                    {...register("payment_terms")}
                    disabled={isLoading}
                    placeholder="მაგ: გადახდა 14 დღის განმავლობაში"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_notes">ინვოისის შენიშვნები</Label>
                  <Textarea
                    id="invoice_notes"
                    rows={3}
                    {...register("invoice_notes")}
                    disabled={isLoading}
                    placeholder="დამატებითი ინფორმაცია რომელიც გამოჩნდება ინვოისზე"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>საბანკო რეკვიზიტები</CardTitle>
                <CardDescription>
                  თქვენი საბანკო ინფორმაცია ინვოისებისთვის
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">ბანკის დასახელება</Label>
                    <Input
                      id="bank_name"
                      {...register("bank_name")}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_account">ანგარიშის ნომერი (IBAN)</Label>
                    <Input
                      id="bank_account"
                      {...register("bank_account")}
                      disabled={isLoading}
                      placeholder="GE00XX000000000000000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_swift">SWIFT კოდი</Label>
                    <Input
                      id="bank_swift"
                      {...register("bank_swift")}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isLoading || !isDirty}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  შენახვა...
                </>
              ) : (
                "ცვლილებების შენახვა"
              )}
            </Button>
          </div>
        </Tabs>
      </form>
    </div>
  )
}