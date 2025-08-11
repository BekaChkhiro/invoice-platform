'use client'

import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, Search, UserPlus, Building, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

import { useClients } from '@/lib/hooks/use-clients'
import { ClientForm } from '@/components/clients/client-form'
import { cn } from '@/lib/utils'

// =====================================
// TYPES AND INTERFACES
// =====================================

interface ClientSelectorProps {
  value?: string
  onValueChange: (clientId: string) => void
  error?: string
  placeholder?: string
  companyId: string
  disabled?: boolean
}

interface ClientDisplayProps {
  client: { id: string; full_name: string; name?: string; email: string; company_name?: string; type?: string; tax_id?: string; phone?: string }
  isSelected?: boolean
  onClick?: () => void
}

// =====================================
// MAIN COMPONENT
// =====================================

export function ClientSelector({
  value,
  onValueChange,
  error,
  placeholder = "აირჩიეთ კლიენტი...",
  companyId,
  disabled = false
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Fetch clients
  const { data: clientsResponse, isLoading } = useClients({
    search: search.length > 2 ? search : undefined,
    limit: 50,
    offset: 0,
    sort_by: 'name',
    sort_order: 'asc'
  })

  const clients = clientsResponse?.clients || []
  const selectedClient = clients.find(client => client.id === value)

  // Recent clients (last 5 used)
  const recentClients = useMemo(() => {
    // In a real app, this would come from localStorage or API
    return clients.slice(0, 5)
  }, [clients])

  // Filtered clients based on search
  const filteredClients = useMemo(() => {
    if (!search) return clients
    
    const searchLower = search.toLowerCase()
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.tax_id?.includes(search)
    )
  }, [clients, search])

  const handleSelect = (clientId: string) => {
    onValueChange(clientId)
    setOpen(false)
    setSearch('')
    
    // Save to recent clients in localStorage
    const recent = JSON.parse(localStorage.getItem('recent-clients') || '[]')
    const updated = [clientId, ...recent.filter((id: string) => id !== clientId)].slice(0, 5)
    localStorage.setItem('recent-clients', JSON.stringify(updated))
  }

  const handleAddClient = (newClient: { id: string; full_name: string; email: string }) => {
    setShowAddDialog(false)
    onValueChange(newClient.id)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between text-left font-normal",
              !selectedClient && "text-muted-foreground",
              error && "border-red-500 focus:border-red-500"
            )}
            disabled={disabled}
          >
            {selectedClient ? (
              <ClientDisplay client={selectedClient} />
            ) : (
              <span>{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="ძებნა სახელით, ემაილით ან საიდ. ნომრით..."
                value={search}
                onValueChange={setSearch}
                className="flex h-11"
              />
            </div>
            
            <CommandEmpty>
              <div className="py-6 text-center text-sm">
                <div className="mb-2">კლიენტი ვერ მოიძებნა</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddDialog(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  ახალი კლიენტის დამატება
                </Button>
              </div>
            </CommandEmpty>

            {/* Recent Clients */}
            {!search && recentClients.length > 0 && (
              <CommandGroup heading="ბოლოს გამოყენებული">
                {recentClients.map((client) => (
                  <CommandItem
                    key={`recent-${client.id}`}
                    value={client.id}
                    onSelect={() => handleSelect(client.id)}
                    className="flex items-center gap-2 p-2"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <ClientDisplay client={client} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* All Clients */}
            <CommandGroup heading={search ? "შედეგები" : "ყველა კლიენტი"}>
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  იტვირთება...
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  კლიენტები ვერ მოიძებნა
                </div>
              ) : (
                filteredClients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => handleSelect(client.id)}
                    className="flex items-center gap-2 p-2"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <ClientDisplay client={client} />
                  </CommandItem>
                ))
              )}
            </CommandGroup>

            {/* Add New Client */}
            <Separator />
            <CommandGroup>
              <CommandItem
                onSelect={() => setShowAddDialog(true)}
                className="flex items-center gap-2 p-2 text-primary"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                ახალი კლიენტის დამატება
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Add Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ახალი კლიენტის დამატება</DialogTitle>
          </DialogHeader>
          <ClientForm
            mode="create"
            companyId={companyId}
            onSuccess={handleAddClient}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </>
  )
}

// =====================================
// CLIENT DISPLAY COMPONENT
// =====================================

function ClientDisplay({ client, isSelected = false, onClick }: ClientDisplayProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTaxId = (taxId: string) => {
    if (!taxId) return ''
    if (taxId.length === 11) {
      return `${taxId.slice(0, 2)} ${taxId.slice(2, 4)} ${taxId.slice(4, 6)} ${taxId.slice(6)}`
    }
    if (taxId.length === 9) {
      return `${taxId.slice(0, 2)} ${taxId.slice(2, 4)} ${taxId.slice(4, 6)} ${taxId.slice(6)}`
    }
    return taxId
  }

  return (
    <div className="flex items-center gap-3 flex-1 min-w-0" onClick={onClick}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="text-xs">
          {getInitials(client.name)}
        </AvatarFallback>
      </Avatar>

      {/* Client Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {client.name}
          </span>
          
          {/* Client Type Badge */}
          <Badge variant="secondary" className="text-xs">
            {client.type === 'individual' ? (
              <>
                <User className="mr-1 h-3 w-3" />
                ფიზ. პირი
              </>
            ) : (
              <>
                <Building className="mr-1 h-3 w-3" />
                იურ. პირი
              </>
            )}
          </Badge>
        </div>

        {/* Contact Info */}
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {client.email && (
              <span className="truncate">{client.email}</span>
            )}
            {client.tax_id && (
              <>
                {client.email && <span>•</span>}
                <span>{formatTaxId(client.tax_id)}</span>
              </>
            )}
          </div>
          {client.phone && (
            <div className="truncate">{client.phone}</div>
          )}
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <Check className="h-4 w-4 text-primary flex-shrink-0" />
      )}
    </div>
  )
}