"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  FileText,
  MoreVertical,
  Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { clientService } from "@/lib/services/client"
import { CLIENT_TYPES, type Client } from "@/types/database"
import { format } from "date-fns"
import { ka } from "date-fns/locale"

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadClient()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadClient = async () => {
    try {
      const data = await clientService.getClient(id)
      setClient(data)
    } catch {
      router.push("/dashboard/clients")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <ClientDetailSkeleton />
  }

  if (!client) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 rounded-lg">
                {client.type === "company" ? (
                  <Building2 className="h-6 w-6 text-gray-600" />
                ) : (
                  <User className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{client.name}</h1>
                <div className="flex items-center gap-4 mt-1">
                  <Badge variant="outline">
                    {CLIENT_TYPES[client.type]}
                  </Badge>
                  <Badge
                    variant={client.is_active ? "default" : "secondary"}
                    className={client.is_active ? "bg-success hover:bg-success/90" : ""}
                  >
                    {client.is_active ? "აქტიური" : "არააქტიური"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/invoices/new?client=${client.id}`}>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              ახალი ინვოისი
            </Button>
          </Link>
          <Link href={`/dashboard/clients/${client.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              რედაქტირება
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>მოქმედებები</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                {client.is_active ? "დეაქტივაცია" : "გააქტიურება"}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                წაშლა
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">მიმოხილვა</TabsTrigger>
          <TabsTrigger value="invoices">ინვოისები</TabsTrigger>
          <TabsTrigger value="activity">აქტივობა</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Contact Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>საკონტაქტო ინფორმაცია</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client Name/Company Name */}
                <div className="flex items-start gap-3">
                  {client.type === "company" ? (
                    <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
                  ) : (
                    <User className="h-5 w-5 text-gray-500 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">
                      {client.type === "company" ? "კომპანიის დასახელება" : "სახელი და გვარი"}
                    </p>
                    <p className="text-sm text-gray-600">{client.name}</p>
                  </div>
                </div>

                {client.type === "company" && client.contact_person && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">საკონტაქტო პირი</p>
                      <p className="text-sm text-gray-600">{client.contact_person}</p>
                    </div>
                  </div>
                )}

                {client.tax_id && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {client.type === "company" ? "საიდენტიფიკაციო კოდი" : "პირადი ნომერი"}
                      </p>
                      <p className="text-sm text-gray-600">{client.tax_id}</p>
                    </div>
                  </div>
                )}

                {client.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">ელ.ფოსტა</p>
                      <a 
                        href={`mailto:${client.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {client.email}
                      </a>
                    </div>
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">ტელეფონი</p>
                      <a 
                        href={`tel:${client.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {client.phone}
                      </a>
                    </div>
                  </div>
                )}

                {(client.address_line1 || client.city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">მისამართი</p>
                      <p className="text-sm text-gray-600">
                        {client.address_line1}
                        {client.address_line1 && client.city && ", "}
                        {client.city}
                        {client.postal_code && ` ${client.postal_code}`}
                      </p>
                    </div>
                  </div>
                )}

                {client.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium mb-2">შენიშვნები</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {client.notes}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>სტატისტიკა</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">სულ ინვოისები</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">ჯამური შემოსავალი</p>
                    <p className="text-2xl font-bold">₾0</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">დავალიანება</p>
                    <p className="text-2xl font-bold text-error">₾0</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ინფორმაცია</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">დამატების თარიღი</p>
                    <p className="text-sm font-medium">
                      {format(new Date(client.created_at), "dd MMMM, yyyy", { locale: ka })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ბოლო განახლება</p>
                    <p className="text-sm font-medium">
                      {format(new Date(client.updated_at), "dd MMMM, yyyy HH:mm", { locale: ka })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>ინვოისების ისტორია</CardTitle>
              <CardDescription>
                ამ კლიენტისთვის გამოწერილი ინვოისები
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">ინვოისები ჯერ არ არის</p>
                <Link href={`/dashboard/invoices/new?client=${client.id}`}>
                  <Button variant="outline" className="mt-4">
                    პირველი ინვოისის შექმნა
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>აქტივობის ისტორია</CardTitle>
              <CardDescription>
                კლიენტთან დაკავშირებული ყველა აქტივობა
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">აქტივობის ისტორია ხელმისაწვდომი იქნება მალე</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ClientDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-32 mt-2" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-96 md:col-span-2" />
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  )
}