"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { clientSchema, type ClientFormData } from "@/lib/validations/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Building2, User, AlertCircle } from "lucide-react"
import { CLIENT_TYPES } from "@/types/database"

interface ClientFormProps {
  initialData?: Partial<ClientFormData>
  onSubmit: (data: ClientFormData) => Promise<void>
  isLoading?: boolean
}

export function ClientForm({ initialData, onSubmit, isLoading = false }: ClientFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      type: "individual",
      is_active: true,
      ...initialData,
    },
  })

  const clientType = watch("type")

  const handleFormSubmit = async (data: ClientFormData) => {
    setError(null)
    try {
      await onSubmit(data)
    } catch (error: any) {
      setError(error.message || "დაფიქსირდა შეცდომა")
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>კლიენტის ტიპი</CardTitle>
          <CardDescription>
            აირჩიეთ კლიენტის ტიპი
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={clientType}
            onValueChange={(value) => setValue("type", value as "individual" | "company")}
            disabled={isLoading}
          >
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  {CLIENT_TYPES.individual}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="company" id="company" />
                <Label htmlFor="company" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="h-4 w-4" />
                  {CLIENT_TYPES.company}
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ძირითადი ინფორმაცია</CardTitle>
          <CardDescription>
            შეავსეთ კლიენტის საკონტაქტო ინფორმაცია
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                {clientType === "company" ? "კომპანიის დასახელება" : "სახელი და გვარი"} *
              </Label>
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
              <Label htmlFor="tax_id">
                {clientType === "company" ? "საიდენტიფიკაციო კოდი" : "პირადი ნომერი"}
                {clientType === "company" && " *"}
              </Label>
              <Input
                id="tax_id"
                {...register("tax_id")}
                disabled={isLoading}
              />
              {errors.tax_id && (
                <p className="text-sm text-error">{errors.tax_id.message}</p>
              )}
            </div>

            {clientType === "company" && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="contact_person">საკონტაქტო პირი</Label>
                <Input
                  id="contact_person"
                  {...register("contact_person")}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">ელ.ფოსტა</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-error">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">ტელეფონი</Label>
              <Input
                id="phone"
                {...register("phone")}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>მისამართი</CardTitle>
          <CardDescription>
            კლიენტის ფაქტიური მისამართი
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>დამატებითი ინფორმაცია</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">შენიშვნები</Label>
            <Textarea
              id="notes"
              rows={4}
              {...register("notes")}
              disabled={isLoading}
              placeholder="დაამატეთ ნებისმიერი დამატებითი ინფორმაცია კლიენტის შესახებ..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">სტატუსი</Label>
              <p className="text-sm text-muted-foreground">
                განსაზღვრეთ არის თუ არა კლიენტი აქტიური
              </p>
            </div>
            <Switch
              id="is_active"
              checked={watch("is_active")}
              onCheckedChange={(checked) => setValue("is_active", checked)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          გაუქმება
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              შენახვა...
            </>
          ) : (
            "შენახვა"
          )}
        </Button>
      </div>
    </form>
  )
}