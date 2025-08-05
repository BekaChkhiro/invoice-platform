"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClientForm } from "@/components/forms/client-form"
import { clientService } from "@/lib/services/client"
import { useToast } from "@/components/ui/use-toast"
import type { ClientFormData } from "@/lib/validations/client"
import type { Client } from "@/types/database"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [client, setClient] = useState<Client | null>(null)
  const [isLoadingClient, setIsLoadingClient] = useState(true)

  useEffect(() => {
    loadClient()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadClient = async () => {
    try {
      const data = await clientService.getClient(id)
      setClient(data)
    } catch {
      toast({
        title: "შეცდომა",
        description: "კლიენტის ჩატვირთვა ვერ მოხერხდა",
        variant: "destructive",
      })
      router.push("/dashboard/clients")
    } finally {
      setIsLoadingClient(false)
    }
  }

  const handleSubmit = async (data: ClientFormData) => {
    if (!client) return

    setIsLoading(true)

    try {
      await clientService.updateClient(client.id, data)

      toast({
        title: "ცვლილებები შენახულია",
        description: "კლიენტის ინფორმაცია წარმატებით განახლდა",
      })

      router.push(`/dashboard/clients/${id}`)
    } catch (error) {
      if (error instanceof Error && error.message?.includes("duplicate key")) {
        throw new Error("კლიენტი ამ საიდენტიფიკაციო კოდით უკვე არსებობს")
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingClient) {
    return <EditClientSkeleton />
  }

  if (!client) {
    return null
  }

  const initialData: Partial<ClientFormData> = {
    type: client.type,
    name: client.name,
    tax_id: client.tax_id || undefined,
    email: client.email || undefined,
    phone: client.phone || undefined,
    address_line1: client.address_line1 || undefined,
    address_line2: client.address_line2 || undefined,
    city: client.city || undefined,
    postal_code: client.postal_code || undefined,
    contact_person: client.contact_person || undefined,
    notes: client.notes || undefined,
    is_active: client.is_active,
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
          <h1 className="text-3xl font-bold">კლიენტის რედაქტირება</h1>
          <p className="text-gray-500">განაახლეთ კლიენტის ინფორმაცია</p>
        </div>
      </div>

      <ClientForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}

function EditClientSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-96" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}