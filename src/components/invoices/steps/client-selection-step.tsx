'use client'

import { useState, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Search, Plus, User, Building, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'

// Import hooks
import { useClientSearch, useClientDetails, useCreateClientInline } from '@/lib/hooks/use-client-search'
import { InvoiceFormData } from '@/lib/hooks/use-invoice-form'

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
    addToRecentClients,
    clearSearch,
    recentClients,
    allClients,
    isClient
  } = useClientSearch()

  const {
    data: selectedClient,
    isLoading: clientDetailsLoading
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
      addToRecentClients(suggestion)
      clearSearch()
    }
  }, [suggestions, hasQuery, setValue, addToRecentClients, clearSearch])

  const handleClientSelect = (client: any) => {
    setValue('client_id', client.id)
    addToRecentClients(client)
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
      
      // Add to recent clients
      addToRecentClients({
        id: result.id,
        name: result.name,
        email: result.email || '',
        type: result.type,
        display_name: result.name,
        subtitle: result.email || result.type === 'company' ? 'იურიდიული პირი' : 'ფიზიკური პირი'
      })
      
    } catch (error) {
      console.error('Failed to create client:', error)
    }
  }

  const ClientCard = ({ client, onClick, isSelected = false }: any) => (
    <Card 
      className={`cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
      onClick={() => onClick(client)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              client.type === 'company' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {client.type === 'company' ? <Building className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-medium">{client.display_name || client.name}</h3>
              <p className="text-sm text-muted-foreground">{client.subtitle}</p>
              {client.email && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Mail className="w-3 h-3" />
                  {client.email}
                </div>
              )}
            </div>
          </div>
          <Badge variant="secondary">
            {client.type === 'company' ? 'კომპანია' : 'ფიზიკური პირი'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )

  // Show loading skeleton during SSR and initial client load
  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label htmlFor="client-search">კლიენტის ძებნა</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="client-search"
                  type="text"
                  placeholder="მოძებნეთ კლიენტი სახელის ან ელ.ფოსტის მიხედვით..."
                  disabled
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" className="flex items-center gap-2" disabled>
              <Plus className="w-4 h-4" />
              ახალი კლიენტი
            </Button>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <div className="animate-spin w-6 h-6 mx-auto mb-2 border-2 border-primary border-t-transparent rounded-full"></div>
          <p>კლიენტების ჩატვირთვა...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Label htmlFor="client-search">კლიენტის ძებნა</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="client-search"
                type="text"
                placeholder="მოძებნეთ კლიენტი სახელის ან ელ.ფოსტის მიხედვით..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                ახალი კლიენტი
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">ძებნის შედეგები</h3>
            {isLoading && <div className="text-sm text-muted-foreground">ძებნა...</div>}
          </div>
          {suggestions.length > 0 ? (
            <div className="grid gap-3">
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
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>კლიენტი ვერ მოიძებნა</p>
              <p className="text-sm">სცადეთ სხვა საძიებო სიტყვებით</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Clients */}
      {!hasQuery && recentClients.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">ბოლო კლიენტები</h3>
          <div className="grid gap-3">
            {recentClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={handleClientSelect}
                isSelected={selectedClientId === client.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Clients - show when no search query and no recent clients */}
      {!hasQuery && recentClients.length === 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">ყველა კლიენტი</h3>
            {isLoading && <div className="text-sm text-muted-foreground">ჩატვირთვა...</div>}
          </div>
          {allClients.length > 0 ? (
            <div className="grid gap-3">
              {allClients.slice(0, 20).map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onClick={handleClientSelect}
                  isSelected={selectedClientId === client.id}
                />
              ))}
              {allClients.length > 20 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    და კიდევ {allClients.length - 20} კლიენტი... გამოიყენეთ ძებნა უკეთესი შედეგებისთვის
                  </p>
                </div>
              )}
            </div>
          ) : !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>კლიენტები ვერ მოიძებნა</p>
              <p className="text-sm">თქვენ ჯერ არ გაქვთ რეგისტრირებული კლიენტები</p>
            </div>
          )}
        </div>
      )}

      {/* Selected Client Details */}
      {selectedClientId && selectedClient && (
        <div className="space-y-3">
          <Separator />
          <h3 className="font-medium">არჩეული კლიენტი</h3>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedClient.type === 'company' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {selectedClient.type === 'company' ? <Building className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-lg">{selectedClient.name}</h4>
                    <div className="space-y-1">
                      {selectedClient.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {selectedClient.email}
                        </div>
                      )}
                      {selectedClient.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          {selectedClient.phone}
                        </div>
                      )}
                      {selectedClient.tax_id && (
                        <div className="text-sm text-muted-foreground">
                          საიდენტიფიკაციო კოდი: {selectedClient.tax_id}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">
                  {selectedClient.type === 'company' ? 'კომპანია' : 'ფიზიკური პირი'}
                </Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setValue('client_id', '')
                  clearSearch()
                }}
              >
                სხვა კლიენტის არჩევა
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}