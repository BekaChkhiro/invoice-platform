'use client'

import { useState, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Search, Plus, User, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useClientSearch, useClientDetails, useCreateClientInline } from '@/lib/hooks/use-client-search'
import { InvoiceFormData } from '@/lib/hooks/use-invoice-form'
import { Client } from '@/types/database'

interface ClientSelectionStepProps {
  form: UseFormReturn<InvoiceFormData>
}

export function ClientSelectionStep({ form }: ClientSelectionStepProps) {
  const { watch, setValue, formState: { errors } } = form
  const selectedClientId = watch('client_id')

  const {
    query,
    setQuery,
    suggestions,
    isLoading,
    hasQuery,
    clearSearch,
    allClients,
    isClient
  } = useClientSearch()

  const {
    data: selectedClient
  } = useClientDetails(selectedClientId)

  const {
    isOpen: isNewClientOpen,
    setIsOpen: setIsNewClientOpen,
    createClient
  } = useCreateClientInline()

  const [newClientData, setNewClientData] = useState({
    type: 'individual' as 'individual' | 'company',
    name: '',
    email: '',
    phone: '',
    tax_id: '',
    contact_person: ''
  })

  // Auto-select if only one suggestion
  useEffect(() => {
    if (suggestions.length === 1 && hasQuery) {
      const suggestion = suggestions[0]
      setValue('client_id', suggestion.id)
      clearSearch()
    }
  }, [suggestions, hasQuery, setValue, clearSearch])

  const handleClientSelect = (client: Client) => {
    setValue('client_id', client.id)
    clearSearch()
  }

  const handleCreateNewClient = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const result = await createClient(newClientData)
      setValue('client_id', result.id)
      
      // Reset form
      setNewClientData({
        type: 'individual',
        name: '',
        email: '',
        phone: '',
        tax_id: '',
        contact_person: ''
      })
      
      // Client created successfully
      
    } catch (error) {
      console.error('Failed to create client:', error)
    }
  }

  const ClientCard = ({ client, onClick, isSelected = false }: { client: Client; onClick: (client: Client) => void; isSelected?: boolean }) => (
    <div 
      className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-300 ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' : 'border-gray-200'
      }`}
      onClick={() => onClick(client)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            client.type === 'company' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {client.type === 'company' ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate">{client.display_name || client.name}</div>
            <div className="text-xs text-muted-foreground truncate">{client.subtitle}</div>
          </div>
        </div>
        <Badge variant="secondary" className="ml-2 text-xs">
          {client.type === 'company' ? 'კ' : 'ფ'}
        </Badge>
      </div>
    </div>
  )

  // Show loading skeleton during SSR and initial client load
  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="client-search" className="text-sm font-medium">კლიენტის ძებნა</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="client-search"
                  type="text"
                  placeholder="კლიენტის ძებნა..."
                  disabled
                  className="pl-10 h-9"
                />
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-9 px-3" disabled>
              <Plus className="w-4 h-4 mr-1" />
              ახალი
            </Button>
          </div>
        </div>
        <div className="text-center py-6 text-muted-foreground">
          <div className="animate-spin w-5 h-5 mx-auto mb-2 border-2 border-primary border-t-transparent rounded-full"></div>
          <p className="text-sm">კლიენტების ჩატვირთვა...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <div className="space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="client-search" className="text-sm font-medium">კლიენტის ძებნა</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="client-search"
                type="text"
                placeholder="კლიენტის ძებნა..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>
          <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3">
                <Plus className="w-4 h-4 mr-1" />
                ახალი
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>ახალი კლიენტის შექმნა</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateNewClient} className="space-y-4">
                <div>
                  <Label htmlFor="client-type">ტიპი</Label>
                  <Select
                    value={newClientData.type}
                    onValueChange={(value: 'individual' | 'company') => 
                      setNewClientData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">ფიზიკური პირი</SelectItem>
                      <SelectItem value="company">იურიდიული პირი</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="client-name">სახელი *</Label>
                  <Input
                    id="client-name"
                    type="text"
                    value={newClientData.name}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="client-email">ელ.ფოსტა</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={newClientData.email}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="client-phone">ტელეფონი</Label>
                  <Input
                    id="client-phone"
                    type="tel"
                    value={newClientData.phone}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                
                {newClientData.type === 'company' && (
                  <>
                    <div>
                      <Label htmlFor="client-tax-id">საიდენტიფიკაციო კოდი *</Label>
                      <Input
                        id="client-tax-id"
                        type="text"
                        value={newClientData.tax_id}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, tax_id: e.target.value }))}
                        required={newClientData.type === 'company'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="client-contact-person">საკონტაქტო პირი</Label>
                      <Input
                        id="client-contact-person"
                        type="text"
                        value={newClientData.contact_person}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, contact_person: e.target.value }))}
                      />
                    </div>
                  </>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsNewClientOpen(false)}>
                    გაუქმება
                  </Button>
                  <Button type="submit" disabled={!newClientData.name}>
                    შექმნა
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {errors.client_id && (
          <p className="text-sm text-red-600">{errors.client_id.message}</p>
        )}
      </div>

      {/* Search Results */}
      {hasQuery && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              ძებნის შედეგები {suggestions.length > 0 && `(${suggestions.length})`}
            </h3>
            {isLoading && <div className="text-xs text-muted-foreground">ძებნა...</div>}
          </div>
          {suggestions.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {suggestions.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onClick={handleClientSelect}
                  isSelected={selectedClientId === client.id}
                />
              ))}
            </div>
          ) : !isLoading && (
            <div className="text-center py-6 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">კლიენტი ვერ მოიძებნა</p>
            </div>
          )}
        </div>
      )}

      {/* All Clients - show when no search query */}
      {!hasQuery && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">კლიენტები</h3>
            {isLoading && <div className="text-xs text-muted-foreground">ჩატვირთვა...</div>}
          </div>
          
          {allClients.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onClick={handleClientSelect}
                  isSelected={selectedClientId === client.id}
                />
              ))}
            </div>
          ) : !isLoading && (
            <div className="text-center py-6 text-muted-foreground">
              <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">კლიენტები არ მოიძებნა</p>
            </div>
          )}
        </div>
      )}

      {/* Selected Client Details */}
      {selectedClientId && selectedClient && (
        <div className="space-y-2">
          <Separator />
          <h3 className="text-sm font-medium text-muted-foreground">არჩეული კლიენტი</h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  selectedClient.type === 'company' ? 'bg-green-100 text-green-600' : 'bg-green-100 text-green-600'
                }`}>
                  {selectedClient.type === 'company' ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-green-800">{selectedClient.name}</div>
                  <div className="text-xs text-green-600">
                    {selectedClient.email || (selectedClient.type === 'company' ? 'კომპანია' : 'ფიზიკური პირი')}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-green-700 hover:bg-green-100"
                onClick={() => {
                  setValue('client_id', '')
                  clearSearch()
                }}
              >
                შეცვლა
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}