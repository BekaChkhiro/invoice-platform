"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Plus, Building2, User, Check, X, Users } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { clientService } from "@/lib/services/client"
import { CLIENT_TYPES, type Client } from "@/types/database"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ClientsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<{ total: number; active: number; individuals: number; companies: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [, setCompany] = useState<{ id: string; user_id: string; name: string; invoice_prefix: string; invoice_counter: number; vat_rate: number; currency: string } | null>(null)
  const [deleteClient, setDeleteClient] = useState<Client | null>(null)
  const supabase = createClient()

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadData()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    if (!user) return

    try {
      // Get or create company
      let { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .single()

      // If no company exists, create one
      if (!companyData) {
        const { data: newCompany, error: createError } = await supabase
          .from("companies")
          .insert({
            user_id: user.id,
            name: "ჩემი კომპანია",
            invoice_prefix: "INV",
            invoice_counter: 1,
            vat_rate: 18,
            currency: "GEL"
          })
          .select()
          .single()

        if (createError) throw createError
        companyData = newCompany
      }

      setCompany(companyData)

      // Load clients
      const clientsData = await clientService.getClients(companyData.id)
      setClients(clientsData || [])

      // Load stats
      const statsData = await clientService.getClientStats(companyData.id)
      setStats(statsData)

    } catch {
      toast({
        title: "შეცდომა",
        description: "კლიენტების ჩატვირთვა ვერ მოხერხდა",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!deleteClient) return

    try {
      await clientService.deleteClient(deleteClient.id)
      toast({
        title: "კლიენტი წაიშალა",
        description: "კლიენტი წარმატებით წაიშალა",
      })
      loadData()
    } catch {
      toast({
        title: "შეცდომა",
        description: "კლიენტის წაშლა ვერ მოხერხდა",
        variant: "destructive",
      })
    } finally {
      setDeleteClient(null)
    }
  }

  const handleToggleStatus = async (client: Client) => {
    console.log("Toggling status for client:", client.name, "from", client.is_active, "to", !client.is_active)
    
    try {
      await clientService.toggleClientStatus(client.id, !client.is_active)
      toast({
        title: "სტატუსი განახლდა",
        description: `კლიენტი ${!client.is_active ? "გააქტიურდა" : "დეაქტივირდა"}`,
      })
      loadData()
    } catch (error) {
      console.error("Toggle status error:", error)
      toast({
        title: "შეცდომა",
        description: "სტატუსის განახლება ვერ მოხერხდა",
        variant: "destructive",
      })
    }
  }

  // Filter clients
  const filteredClients = clients.filter(client => {
    if (typeFilter !== "all" && client.type !== typeFilter) return false
    if (statusFilter === "active" && !client.is_active) return false
    if (statusFilter === "inactive" && client.is_active) return false
    return true
  })

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: "დასახელება",
      cell: ({ row }) => {
        const client = row.original
        return (
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded">
              {client.type === "company" ? (
                <Building2 className="h-4 w-4 text-gray-600" />
              ) : (
                <User className="h-4 w-4 text-gray-600" />
              )}
            </div>
            <div>
              <p className="font-medium">{client.name}</p>
              {client.contact_person && (
                <p className="text-sm text-gray-500">{client.contact_person}</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "ტიპი",
      cell: ({ row }) => (
        <Badge variant="outline">
          {CLIENT_TYPES[row.getValue("type") as keyof typeof CLIENT_TYPES]}
        </Badge>
      ),
    },
    {
      accessorKey: "tax_id",
      header: "საიდ. კოდი",
      cell: ({ row }) => row.getValue("tax_id") || "-",
    },
    {
      accessorKey: "email",
      header: "ელ.ფოსტა",
      cell: ({ row }) => row.getValue("email") || "-",
    },
    {
      accessorKey: "phone",
      header: "ტელეფონი",
      cell: ({ row }) => row.getValue("phone") || "-",
    },
    {
      accessorKey: "is_active",
      header: "სტატუსი",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean
        return (
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={isActive ? "bg-success hover:bg-success/90" : ""}
          >
            {isActive ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                აქტიური
              </>
            ) : (
              <>
                <X className="mr-1 h-3 w-3" />
                არააქტიური
              </>
            )}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const client = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">მენიუ</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>მოქმედებები</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
              >
                ნახვა
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
              >
                რედაქტირება
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  handleToggleStatus(client)
                }}
              >
                {client.is_active ? "დეაქტივაცია" : "გააქტიურება"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setDeleteClient(client)}
                className="text-red-600"
              >
                წაშლა
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">კლიენტები</h1>
          <p className="text-gray-500">მართეთ თქვენი კლიენტების ბაზა</p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            ახალი კლიენტი
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                სულ კლიენტები
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                აქტიური
              </CardTitle>
              <Check className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                ფიზ. პირები
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.individuals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                იურ. პირები
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.companies}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="ტიპი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა ტიპი</SelectItem>
            <SelectItem value="individual">ფიზიკური პირი</SelectItem>
            <SelectItem value="company">იურიდიული პირი</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="სტატუსი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა სტატუსი</SelectItem>
            <SelectItem value="active">აქტიური</SelectItem>
            <SelectItem value="inactive">არააქტიური</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clients Table */}
      <DataTable
        columns={columns}
        data={filteredClients}
        searchKey="name"
        searchPlaceholder="ძებნა სახელით, კოდით, ელ.ფოსტით..."
        isLoading={isLoading}
        onRowClick={(client) => router.push(`/dashboard/clients/${client.id}`)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>დარწმუნებული ხართ?</AlertDialogTitle>
            <AlertDialogDescription>
              კლიენტი &quot;{deleteClient?.name}&quot; სამუდამოდ წაიშლება. ეს მოქმედება ვერ დაბრუნდება.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              წაშლა
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}