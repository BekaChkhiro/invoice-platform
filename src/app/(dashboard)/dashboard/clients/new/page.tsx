"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClientForm } from "@/components/forms/client-form"
import { clientService } from "@/lib/services/client"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import type { ClientFormData } from "@/lib/validations/client"

export default function NewClientPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (data: ClientFormData) => {
    if (!user) return

    setIsLoading(true)

    try {
      // Get company
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!company) throw new Error("კომპანია არ მოიძებნა")

      await clientService.createClient(company.id, data)

      toast({
        title: "კლიენტი დაემატა",
        description: "ახალი კლიენტი წარმატებით შეიქმნა",
      })

      router.push("/dashboard/clients")
    } catch (error) {
      if (error instanceof Error && error.message?.includes("duplicate key")) {
        throw new Error("კლიენტი ამ საიდენტიფიკაციო კოდით უკვე არსებობს")
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">ახალი კლიენტი</h1>
          <p className="text-gray-500">დაამატეთ ახალი კლიენტი თქვენს ბაზაში</p>
        </div>
      </div>

      <ClientForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}