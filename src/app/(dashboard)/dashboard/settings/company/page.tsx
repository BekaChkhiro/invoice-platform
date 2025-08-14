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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Building2, Upload, AlertCircle, Plus, Trash2, Check } from "lucide-react"
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
  const [company, setCompany] = useState<{ id: string; user_id: string; name: string; logo_url?: string | null; tax_id?: string | null; address_line1?: string | null; address_line2?: string | null; city?: string | null; postal_code?: string | null; phone?: string | null; email?: string | null; website?: string | null; bank_name?: string | null; bank_account?: string | null; bank_swift?: string | null; invoice_prefix: string; invoice_notes?: string | null; payment_terms?: string | null; vat_rate: number } | null>(null)
  const [bankAccounts, setBankAccounts] = useState<Array<{ id: string; company_id: string; bank_name: string; account_number: string; account_name?: string | null; is_default: boolean; is_active: boolean }>>([])  
  const [showAddBank, setShowAddBank] = useState(false)
  const [newBankAccount, setNewBankAccount] = useState({ bank_name: '', account_number: '', account_name: '' })
  const [isAddingBank, setIsAddingBank] = useState(false)
  const supabase = createClient()


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanyFormData>({
    // @ts-expect-error - zod coerce type inference issue
    resolver: zodResolver(companySchema),
  })

  useEffect(() => {
    if (!authLoading && user) {
      loadCompany()
    } else if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router]) // eslint-disable-line react-hooks/exhaustive-deps


  const loadCompany = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) {
      console.error('Failed to load company:', error)
      return
    }

    if (data) {
      setCompany(data)
      reset(data)
      await loadBankAccounts(data.id)
    } else {
      // No company found, create default company
      await createDefaultCompany()
    }
  }

  const createDefaultCompany = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("companies")
        .insert({
          user_id: user.id,
          name: "ჩემი კომპანია",
          invoice_prefix: "INV",
          invoice_counter: 1,
          vat_rate: 18,
          currency: "₾",
          default_currency: "GEL",
          default_vat_rate: 18,
          default_payment_terms: 14,
          default_due_days: 14,
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setCompany(data)
        reset(data)
        await loadBankAccounts(data.id)
        toast({
          title: "კომპანია შეიქმნა",
          description: "ავტომატურად შეიქმნა default კომპანიის ინფორმაცია",
        })
      }
    } catch (error) {
      console.error('Failed to create default company:', error)
      toast({
        title: "შეცდომა",
        description: "კომპანიის შექმნა ვერ მოხერხდა",
        variant: "destructive",
      })
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

    } catch (error) {
      console.error('Company update failed:', error)
      toast({
        title: "შეცდომა",
        description: error instanceof Error ? error.message : "ცვლილებების შენახვა ვერ მოხერხდა",
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

    } catch (error) {
      toast({
        title: "შეცდომა",
        description: error instanceof Error ? error.message : "ლოგოს ატვირთვა ვერ მოხერხდა",
        variant: "destructive",
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  const loadBankAccounts = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('company_bank_accounts')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) throw error

      setBankAccounts(data || [])
    } catch (error) {
      console.error('Failed to load bank accounts:', error)
      toast({
        title: "შეცდომა",
        description: "საბანკო ანგარიშების ჩატვირთვა ვერ მოხერხდა",
        variant: "destructive",
      })
    }
  }

  const addBankAccount = async () => {
    if (!company) return
    
    if (!newBankAccount.bank_name.trim() || !newBankAccount.account_number.trim()) {
      toast({
        title: "შეცდომა",
        description: "ბანკის დასახელება და ანგარიშის ნომერი სავალდებულოა",
        variant: "destructive",
      })
      return
    }

    setIsAddingBank(true)

    try {
      const { error } = await supabase
        .from('company_bank_accounts')
        .insert({
          company_id: company.id,
          bank_name: newBankAccount.bank_name.trim(),
          account_number: newBankAccount.account_number.trim(),
          account_name: newBankAccount.account_name.trim() || null,
          is_default: bankAccounts.length === 0, // First account becomes default
          is_active: true,
        })

      if (error) throw error

      toast({
        title: "საბანკო ანგარიში დაემატა",
        description: "ახალი საბანკო ანგარიში წარმატებით შეინახა",
      })

      setNewBankAccount({ bank_name: '', account_number: '', account_name: '' })
      setShowAddBank(false)
      await loadBankAccounts(company.id)
    } catch (error) {
      console.error('Failed to add bank account:', error)
      toast({
        title: "შეცდომა",
        description: "საბანკო ანგარიშის დამატება ვერ მოხერხდა",
        variant: "destructive",
      })
    } finally {
      setIsAddingBank(false)
    }
  }

  const setDefaultBankAccount = async (bankAccountId: string) => {
    if (!company) return

    try {
      const { error } = await supabase
        .from('company_bank_accounts')
        .update({ is_default: true })
        .eq('id', bankAccountId)
        .eq('company_id', company.id)

      if (error) throw error

      toast({
        title: "ნაგულისხმევი ანგარიში შეიცვალა",
        description: "ანგარიში ნაგულისხმევად დაყენდა",
      })

      await loadBankAccounts(company.id)
    } catch (error) {
      console.error('Failed to set default bank account:', error)
      toast({
        title: "შეცდომა",
        description: "ნაგულისხმევი ანგარიშის დაყენება ვერ მოხერხდა",
        variant: "destructive",
      })
    }
  }

  const deleteBankAccount = async (bankAccountId: string, isDefault: boolean) => {
    if (!company) return

    if (isDefault && bankAccounts.length > 1) {
      toast({
        title: "შეცდომა",
        description: "ნაგულისხმევი ანგარიშის წაშლა შეუძლებელია. ჯერ სხვა ანგარიში გახადეთ ნაგულისხმევი.",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from('company_bank_accounts')
        .update({ is_active: false })
        .eq('id', bankAccountId)
        .eq('company_id', company.id)

      if (error) throw error

      toast({
        title: "საბანკო ანგარიში წაიშალა",
        description: "ანგარიში წარმატებით წაიშალა",
      })

      await loadBankAccounts(company.id)
    } catch (error) {
      console.error('Failed to delete bank account:', error)
      toast({
        title: "შეცდომა",
        description: "საბანკო ანგარიშის წაშლა ვერ მოხერხდა",
        variant: "destructive",
      })
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

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <form onSubmit={handleSubmit(onSubmit as any)}>
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
                    <AvatarImage src={company.logo_url || undefined} />
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
                      მაგ: INV-2025-0001
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>საბანკო ანგარიშები</CardTitle>
                    <CardDescription>
                      მართეთ თქვენი კომპანიის საბანკო ანგარიშები. ანგარიშები გამოჩნდება ინვოისებზე.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowAddBank(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    ახალი ანგარიში
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Bank Account Form */}
                {showAddBank && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-4">ახალი საბანკო ანგარიშის დამატება</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="new_bank_name">ბანკის დასახელება *</Label>
                        <Input
                          id="new_bank_name"
                          value={newBankAccount.bank_name}
                          onChange={(e) => setNewBankAccount(prev => ({ ...prev, bank_name: e.target.value }))}
                          placeholder="მაგ: საქართველოს ბანკი"
                          disabled={isAddingBank}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new_account_name">ანგარიშის მფლობელი</Label>
                        <Input
                          id="new_account_name"
                          value={newBankAccount.account_name}
                          onChange={(e) => setNewBankAccount(prev => ({ ...prev, account_name: e.target.value }))}
                          placeholder="კომპანიის დასახელება"
                          disabled={isAddingBank}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new_account_number">ანგარიშის ნომერი (IBAN) *</Label>
                        <Input
                          id="new_account_number"
                          value={newBankAccount.account_number}
                          onChange={(e) => setNewBankAccount(prev => ({ ...prev, account_number: e.target.value }))}
                          placeholder="GE00XX000000000000000"
                          disabled={isAddingBank}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        type="button"
                        onClick={addBankAccount}
                        disabled={isAddingBank}
                      >
                        {isAddingBank ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            შენახვა...
                          </>
                        ) : (
                          "დამატება"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddBank(false)
                          setNewBankAccount({ bank_name: '', account_number: '', account_name: '' })
                        }}
                        disabled={isAddingBank}
                      >
                        გაუქმება
                      </Button>
                    </div>
                  </div>
                )}

                {/* Bank Accounts List */}
                <div className="space-y-3">
                  {bankAccounts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>საბანკო ანგარიშები არ არის დამატებული</p>
                      <p className="text-sm">დაამატეთ ანგარიში ინვოისებზე გამოსაჩენად</p>
                    </div>
                  ) : (
                    bankAccounts.map((account) => (
                      <div
                        key={account.id}
                        className={`border rounded-lg p-4 ${account.is_default ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{account.bank_name}</h4>
                              {account.is_default && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                  <Check className="h-3 w-3" />
                                  ნაგულისხმევი
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">IBAN:</span> {account.account_number}
                              </div>
                              {account.account_name && (
                                <div>
                                  <span className="font-medium">მფლობელი:</span> {account.account_name}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {!account.is_default && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDefaultBankAccount(account.id)}
                              >
                                ნაგულისხმევი გახადე
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => deleteBankAccount(account.id, account.is_default)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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