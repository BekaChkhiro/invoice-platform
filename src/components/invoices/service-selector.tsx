'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check, ChevronsUpDown, Search, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Service } from '@/types/database'

interface ServiceSelectorProps {
  value?: string | null
  onSelect: (service: Service | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

interface ServiceSearchResponse {
  services: Service[]
  total: number
}

export function ServiceSelector({
  value,
  onSelect,
  placeholder = "აირჩიეთ სერვისი...",
  disabled = false,
  className
}: ServiceSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // New service dialog state
  const [showNewServiceDialog, setShowNewServiceDialog] = useState(false)
  const [newServiceData, setNewServiceData] = useState({
    name: '',
    description: '',
    default_price: '',
    unit: 'ცალი'
  })
  const [isCreatingService, setIsCreatingService] = useState(false)

  // Selected service for display
  const selectedService = useMemo(() => 
    services.find(service => service.id === value) || null,
    [services, value]
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchServices(searchTerm.trim())
      } else if (searchTerm.trim().length === 0) {
        // Load initial services
        searchServices('')
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const searchServices = async (query: string) => {
    if (loading) return
    
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        limit: '20',
        active_only: 'true'
      })

      if (query) {
        params.set('q', query)
      }

      const response = await fetch(`/api/services/search?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to search services')
      }

      const data: ServiceSearchResponse = await response.json()
      
      setServices(data.services || [])
    } catch (err) {
      console.error('Error searching services:', err)
      setError('სერვისების ძიება ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  // Load initial services on mount
  useEffect(() => {
    searchServices('')
  }, [])

  const handleSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    onSelect(service || null)
    setOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    onSelect(null)
    setOpen(false)
  }

  const handleCreateNewService = async () => {
    if (!newServiceData.name.trim()) {
      return
    }

    try {
      setIsCreatingService(true)
      setError(null)

      const serviceData = {
        name: newServiceData.name.trim(),
        description: newServiceData.description.trim() || undefined,
        default_price: newServiceData.default_price ? parseFloat(newServiceData.default_price) : undefined,
        unit: newServiceData.unit,
        is_active: true
      }

      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      })

      if (!response.ok) {
        throw new Error('Failed to create service')
      }

      const createdService: Service = await response.json()
      
      // Add to services list and select it
      setServices(prev => [createdService, ...prev])
      onSelect(createdService)
      
      // Reset form and close dialogs
      setNewServiceData({
        name: '',
        description: '',
        default_price: '',
        unit: 'ცალი'
      })
      setShowNewServiceDialog(false)
      setOpen(false)
      
    } catch (err) {
      console.error('Error creating service:', err)
      setError('სერვისის შექმნა ვერ მოხერხდა')
    } finally {
      setIsCreatingService(false)
    }
  }

  const openNewServiceDialog = () => {
    setShowNewServiceDialog(true)
    setOpen(false)
    setError(null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {selectedService ? (
              <>
                <span className="truncate">{selectedService.name}</span>
                {selectedService.default_price && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedService.default_price} ₾
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="ძიება სერვისებში..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {loading ? (
              <div className="p-4 text-sm text-center text-muted-foreground">
                ტვირთვა...
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-center text-destructive">
                {error}
              </div>
            ) : services.length === 0 ? (
              <CommandEmpty>
                {searchTerm ? 'სერვისი ვერ მოიძებნა' : 'სერვისები ვერ ჩაიტვირთა'}
              </CommandEmpty>
            ) : (
              <>
                <CommandGroup>
                  {/* Add new service option */}
                  <CommandItem
                    onSelect={openNewServiceDialog}
                    className="text-primary border-b border-border mb-2 pb-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    ახალი სერვისის დამატება
                  </CommandItem>
                  
                  {/* Clear selection option */}
                  {selectedService && (
                    <CommandItem
                      onSelect={handleClear}
                      className="text-muted-foreground"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      გასუფთავება
                    </CommandItem>
                  )}
                  
                  {services.map((service) => (
                    <CommandItem
                      key={service.id}
                      value={service.id}
                      onSelect={handleSelect}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === service.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {service.name}
                          </span>
                          {service.default_price && (
                            <Badge variant="secondary" className="text-xs">
                              {service.default_price} ₾
                            </Badge>
                          )}
                          {service.unit && service.unit !== 'ცალი' && (
                            <Badge variant="outline" className="text-xs">
                              {service.unit}
                            </Badge>
                          )}
                        </div>
                        {service.description && (
                          <div className="text-sm text-muted-foreground truncate mt-1">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>

      {/* New Service Dialog */}
      <Dialog open={showNewServiceDialog} onOpenChange={setShowNewServiceDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ახალი სერვისის შექმნა</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="service-name">სერვისის სახელი *</Label>
              <Input
                id="service-name"
                value={newServiceData.name}
                onChange={(e) => setNewServiceData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="სერვისის სახელი..."
                disabled={isCreatingService}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="service-description">აღწერა</Label>
              <Textarea
                id="service-description"
                value={newServiceData.description}
                onChange={(e) => setNewServiceData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="სერვისის აღწერა..."
                disabled={isCreatingService}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="service-price">ფასი (₾)</Label>
                <Input
                  id="service-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newServiceData.default_price}
                  onChange={(e) => setNewServiceData(prev => ({ ...prev, default_price: e.target.value }))}
                  placeholder="0.00"
                  disabled={isCreatingService}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="service-unit">საზომი ერთეული</Label>
                <Input
                  id="service-unit"
                  value={newServiceData.unit}
                  onChange={(e) => setNewServiceData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="ცალი"
                  disabled={isCreatingService}
                />
              </div>
            </div>
            {error && (
              <div className="text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowNewServiceDialog(false)}
              disabled={isCreatingService}
            >
              გაუქმება
            </Button>
            <Button
              onClick={handleCreateNewService}
              disabled={!newServiceData.name.trim() || isCreatingService}
            >
              {isCreatingService ? 'იქმნება...' : 'შექმნა'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Popover>
  )
}