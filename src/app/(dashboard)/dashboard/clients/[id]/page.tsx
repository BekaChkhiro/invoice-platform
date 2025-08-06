'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, Plus, Mail, Phone, MapPin, Calendar, Building, User, TrendingUp, FileText, Star, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'

import { useClient, useClientStats, useClientInvoices, useClientOperations } from '@/lib/hooks/use-clients'
import { ClientStatCard } from '@/components/clients/client-stats-cards'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [activeTab, setActiveTab] = useState('overview')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { data: client, isLoading, error } = useClient(clientId)
  const { data: clientStats, isLoading: statsLoading } = useClientStats(clientId)
  const { data: clientInvoices, isLoading: invoicesLoading } = useClientInvoices(clientId)
  const { toggleStatus, deleteClient } = useClientOperations()

  const handleDeleteClient = () => {
    deleteClient.mutate(clientId, {
      onSuccess: () => {
        router.push('/dashboard/clients')
      }
    })
    setDeleteDialogOpen(false)
  }

  const handleToggleStatus = () => {
    if (client) {
      toggleStatus.mutate({ 
        id: client.id, 
        is_active: !client.is_active 
      })
    }
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2 text-red-600">კლიენტი ვერ მოიძებნა</h3>
              <p className="text-muted-foreground mb-4">
                მითითებული კლიენტი არ არსებობს ან წაშლილია
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/clients">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  კლიენტების სიაზე დაბრუნება
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="w-48 h-8" />
              <Skeleton className="w-32 h-4" />
            </div>
          </div>
          <Skeleton className="w-24 h-10" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="w-24 h-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="w-16 h-8 mb-2" />
                <Skeleton className="w-32 h-3" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-4" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!client) return null

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getPaymentBehaviorColor = (behavior?: 'excellent' | 'good' | 'average' | 'poor') => {
    switch (behavior) {
      case 'excellent': return 'green'
      case 'good': return 'blue'  
      case 'average': return 'yellow'
      case 'poor': return 'red'
      default: return 'gray'
    }
  }

  const getPaymentBehaviorLabel = (behavior?: 'excellent' | 'good' | 'average' | 'poor') => {
    switch (behavior) {
      case 'excellent': return 'შესანიშნავი'
      case 'good': return 'კარგი'
      case 'average': return 'საშუალო'
      case 'poor': return 'ცუდი'
      default: return 'უცნობი'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/clients">
              <ArrowLeft className="w-4 h-4 mr-2" />
              უკან
            </Link>
          </Button>
          
          <Avatar className="w-16 h-16">
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{client.name}</h1>
              <Badge variant={client.is_active ? 'default' : 'secondary'}>
                {client.is_active ? 'აქტიური' : 'არააქტიური'}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                {client.type === 'company' ? <Building className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {client.type === 'company' ? 'კომპანია' : 'ფიზ. პირი'}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {client.email}
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {client.phone}
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {client.address}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/invoices/new?client=${client.id}`}>
              <Plus className="w-4 h-4 mr-2" />
              ინვოისი
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/clients/${client.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  რედაქტირება
                </Link>
              </DropdownMenuItem>
              
              {client.email && (
                <DropdownMenuItem>
                  <Mail className="w-4 h-4 mr-2" />
                  ელფოსტა
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleToggleStatus}
                disabled={toggleStatus.isPending}
              >
                {client.is_active ? 'გაუქმება' : 'გააქტიურება'}
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                წაშლა
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <ClientStatCard
          title="სულ შემოსავალი"
          value={formatCurrency(client.stats?.total_revenue || 0)}
          subtitle={`${client.stats?.total_invoices || 0} ინვოისი`}
          icon={TrendingUp}
          color="green"
        />
        
        <ClientStatCard
          title="გადახდილი"
          value={formatCurrency(client.stats?.paid_amount || 0)}
          subtitle="დღევანდელი მდგომარეობით"
          icon={Star}
          color="blue"
        />
        
        <ClientStatCard
          title="ვადაგადაცილებული"
          value={formatCurrency(client.stats?.overdue_amount || 0)}
          subtitle="გასავალია"
          icon={FileText}
          color="red"
        />
        
        <ClientStatCard
          title="გადახდის ქცევა"
          value={getPaymentBehaviorLabel(client.stats?.payment_behavior)}
          subtitle="საშუალო შეფასება"
          icon={User}
          color={getPaymentBehaviorColor(client.stats?.payment_behavior) as any}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">მიმოხილვა</TabsTrigger>
          <TabsTrigger value="invoices">ინვოისები</TabsTrigger>
          <TabsTrigger value="analytics">ანალიტიკა</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  საკონტაქტო ინფორმაცია
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">ელ.ფოსტა</div>
                      <div className="text-sm text-muted-foreground">{client.email}</div>
                    </div>
                  </div>
                )}
                
                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">ტელეფონი</div>
                      <div className="text-sm text-muted-foreground">{client.phone}</div>
                    </div>
                  </div>
                )}
                
                {client.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">მისამართი</div>
                      <div className="text-sm text-muted-foreground">{client.address}</div>
                    </div>
                  </div>
                )}
                
                {client.tax_id && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">საიდენტიფიკაციო კოდი</div>
                      <div className="text-sm text-muted-foreground">{client.tax_id}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  სისტემის ინფორმაცია
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">შექმნის თარიღი</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(client.created_at), 'dd MMM yyyy, HH:mm', { locale: ka })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Edit className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">ბოლო განახლება</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(client.updated_at), 'dd MMM yyyy, HH:mm', { locale: ka })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">კლიენტის ტიპი</div>
                    <div className="text-sm text-muted-foreground">
                      {client.type === 'company' ? 'იურიდიული პირი' : 'ფიზიკური პირი'}
                    </div>
                  </div>
                </div>
                
                {client.stats?.last_invoice_date && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">ბოლო ინვოისი</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(client.stats.last_invoice_date), 'dd MMM yyyy', { locale: ka })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Notes Section */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>შენიშვნები</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {client.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>კლიენტის ინვოისები</CardTitle>
              <Button asChild size="sm">
                <Link href={`/dashboard/invoices/new?client=${client.id}`}>
                  <Plus className="w-4 h-4 mr-2" />
                  ახალი ინვოისი
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded">
                      <div className="space-y-1">
                        <Skeleton className="w-24 h-4" />
                        <Skeleton className="w-16 h-3" />
                      </div>
                      <Skeleton className="w-20 h-6" />
                    </div>
                  ))}
                </div>
              ) : clientInvoices?.invoices?.length ? (
                <div className="space-y-3">
                  {clientInvoices.invoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                      <div className="space-y-1">
                        <div className="font-medium">{invoice.invoice_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(invoice.issue_date), 'dd MMM yyyy', { locale: ka })}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-medium">{formatCurrency(invoice.total)}</div>
                        <Badge variant="secondary" className="text-xs">
                          {invoice.status === 'draft' && 'მონახაზი'}
                          {invoice.status === 'sent' && 'გაგზავნილი'}
                          {invoice.status === 'paid' && 'გადახდილი'}
                          {invoice.status === 'overdue' && 'ვადაგადაცილებული'}
                          {invoice.status === 'cancelled' && 'გაუქმებული'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-center pt-3">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/invoices?client_id=${client.id}`}>
                        ყველა ინვოისის ნახვა
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">ამ კლიენტს ჯერ არ აქვს ინვოისები</p>
                  <Button asChild size="sm">
                    <Link href={`/dashboard/invoices/new?client=${client.id}`}>
                      <Plus className="w-4 h-4 mr-2" />
                      პირველი ინვოისის შექმნა
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>კლიენტის ანალიტიკა</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="w-32 h-4" />
                      <Skeleton className="w-full h-8" />
                    </div>
                  ))}
                </div>
              ) : clientStats ? (
                <div className="space-y-6">
                  <div className="text-center text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                    <p>დეტალური ანალიტიკა შემდეგ განახლებაში</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">არ არის საკმარისი მონაცემები ანალიტიკისთვის</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>დარწმუნებული ხართ?</AlertDialogTitle>
            <AlertDialogDescription>
              კლიენტი "{client.name}" წაიშლება. თუ კლიენტს აქვს ინვოისები, ის მხოლოდ გაუქმდება. 
              წინააღმდეგ შემთხვევაში კლიენტი სრულად წაიშლება.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteClient}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteClient.isPending}
            >
              {deleteClient.isPending ? 'მოლოდინა...' : 'წაშლა'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}