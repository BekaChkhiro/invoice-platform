'use client'

import { useState } from 'react'
import { MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, Plus, Mail, ToggleLeft, ToggleRight, Trash2, FileText, Building, User } from 'lucide-react'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { ClientFilters, Client } from '@/lib/hooks/use-clients'
import { useClientOperations } from '@/lib/hooks/use-clients'

interface ClientTableProps {
  clients: Client[]
  isLoading: boolean
  selectedClients: string[]
  onToggleClient: (id: string) => void
  onToggleAll: () => void
  isAllSelected: boolean
  filters: ClientFilters
  onSort: (column: ClientFilters['sort_by']) => void
}

export function ClientTable({
  clients,
  isLoading,
  selectedClients,
  onToggleClient,
  onToggleAll,
  isAllSelected,
  filters,
  onSort
}: ClientTableProps) {
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null)
  const { toggleStatus, deleteClient } = useClientOperations()

  const getSortIcon = (column: ClientFilters['sort_by']) => {
    if (filters.sort_by !== column) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return filters.sort_order === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        აქტიური
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-500">
        არააქტიური
      </Badge>
    )
  }

  const getTypeBadge = (type: 'individual' | 'company') => {
    return type === 'company' ? (
      <Badge variant="outline" className="flex items-center gap-1">
        <Building className="w-3 h-3" />
        კომპანია
      </Badge>
    ) : (
      <Badge variant="outline" className="flex items-center gap-1">
        <User className="w-3 h-3" />
        ფიზ. პირი
      </Badge>
    )
  }

  const getPaymentBehaviorBadge = (behavior?: 'excellent' | 'good' | 'average' | 'poor') => {
    if (!behavior) return null
    
    const config = {
      excellent: { label: 'შესანიშნავი', className: 'bg-green-100 text-green-800' },
      good: { label: 'კარგი', className: 'bg-blue-100 text-blue-800' },
      average: { label: 'საშუალო', className: 'bg-yellow-100 text-yellow-800' },
      poor: { label: 'ცუდი', className: 'bg-red-100 text-red-800' }
    }

    const { label, className } = config[behavior]
    return (
      <Badge variant="secondary" className={`text-xs ${className}`}>
        {label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleToggleStatus = (client: Client) => {
    toggleStatus.mutate({ 
      id: client.id, 
      is_active: !client.is_active 
    })
  }

  const handleDelete = (client: Client) => {
    if (deleteClientId === client.id) {
      deleteClient.mutate(client.id, {
        onSuccess: () => setDeleteClientId(null)
      })
    } else {
      setDeleteClientId(client.id)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="space-y-3 p-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">კლიენტები ვერ მოიძებნა</h3>
          <p className="text-muted-foreground text-center max-w-md">
            {filters.search || filters.type !== 'all' || filters.status !== 'all' || filters.payment_behavior !== 'all'
              ? 'არცერთი კლიენტი არ შეესაბამება თქვენს ძიების კრიტერიუმებს. სცადეთ ფილტრების შეცვლა.'
              : 'ჯერ არ გაქვთ დარეგისტრირებული კლიენტები. დაიწყეთ კლიენტის დამატებით.'}
          </p>
          {(!filters.search && filters.type === 'all' && filters.status === 'all') && (
            <Button asChild className="mt-4">
              <Link href="/dashboard/clients/new">
                <Plus className="w-4 h-4 mr-2" />
                ახალი კლიენტი
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={onToggleAll}
                    aria-label="აირჩიე ყველა კლიენტი"
                  />
                </TableHead>
                <TableHead className="w-12">
                  ტიპი
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSort('name')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    სახელი
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>კონტაქტები</TableHead>
                <TableHead>
                  სტატუსი
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSort('total_revenue')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    შემოსავალი
                    {getSortIcon('total_revenue')}
                  </Button>
                </TableHead>
                <TableHead>ქცევა</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSort('created_at')}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    თარიღი
                    {getSortIcon('created_at')}
                  </Button>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow 
                  key={client.id}
                  className={`
                    ${selectedClients.includes(client.id) ? 'bg-blue-50' : ''} 
                    ${!client.is_active ? 'opacity-60' : ''}
                    hover:bg-gray-50
                  `}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => onToggleClient(client.id)}
                      aria-label={`აირჩიე კლიენტი ${client.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(client.type)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        {client.name}
                        {!client.is_active && (
                          <Badge variant="secondary" className="text-xs bg-gray-100">
                            შეჩერებული
                          </Badge>
                        )}
                      </div>
                      {client.tax_id && (
                        <div className="text-xs text-muted-foreground">
                          საიდ: {client.tax_id}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {client.email && (
                        <div className="text-sm">{client.email}</div>
                      )}
                      {client.phone && (
                        <div className="text-xs text-muted-foreground">{client.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(client.is_active)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {client.stats ? formatCurrency(client.stats.total_revenue) : '0 ₾'}
                      </div>
                      {client.stats && client.stats.total_invoices > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {client.stats.total_invoices} ინვოისი
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPaymentBehaviorBadge(client.stats?.payment_behavior)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(client.created_at), 'dd MMM yyyy', { locale: ka })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link 
                            href={`/dashboard/clients/${client.id}`}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            გადახედვა
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem asChild>
                          <Link 
                            href={`/dashboard/clients/${client.id}/edit`}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            რედაქტირება
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild>
                          <Link 
                            href={`/dashboard/invoices/new?client=${client.id}`}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            ინვოისის შექმნა
                          </Link>
                        </DropdownMenuItem>

                        {client.email && (
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            ელფოსტა
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(client)}
                          disabled={toggleStatus.isPending}
                        >
                          {client.is_active ? (
                            <>
                              <ToggleLeft className="h-4 w-4 mr-2" />
                              გააქროვე
                            </>
                          ) : (
                            <>
                              <ToggleRight className="h-4 w-4 mr-2" />
                              გააქტიურე
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => handleDelete(client)}
                          className="text-red-600 focus:text-red-600"
                          disabled={deleteClient.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          წაშლა
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteClientId !== null} onOpenChange={() => setDeleteClientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>დარწმუნებული ხართ?</AlertDialogTitle>
            <AlertDialogDescription>
              კლიენტის წაშლა შეუქცევადია. თუ კლიენტს აქვს ინვოისები, ის მხოლოდ უაქტიურდება. 
              წინააღმდეგ შემთხვევაში კლიენტი სრულად წაიშლება.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteClientId && handleDelete({ id: deleteClientId } as Client)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteClient.isPending}
            >
              {deleteClient.isPending ? 'მოლოდინა...' : 'წაშლა'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}