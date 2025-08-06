'use client'

import { useState } from 'react'
import { Search, Filter, X, RotateCcw, Users, Building, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { ClientFilters } from '@/lib/hooks/use-clients'

interface ClientFiltersProps {
  filters: ClientFilters
  onFiltersChange: (filters: Partial<ClientFilters>) => void
  onReset: () => void
  quickFilters: {
    all: () => void
    individuals: () => void
    companies: () => void
    active: () => void
    inactive: () => void
    excellentPayers: () => void
    poorPayers: () => void
    thisMonth: () => void
  }
}

export function ClientFilters({ 
  filters, 
  onFiltersChange, 
  onReset,
  quickFilters 
}: ClientFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const hasActiveFilters = 
    filters.type !== 'all' ||
    filters.status !== 'all' ||
    filters.payment_behavior !== 'all' ||
    filters.search ||
    filters.created_after

  const typeOptions = [
    { value: 'all', label: 'ყველა ტიპი', icon: Users },
    { value: 'individual', label: 'ფიზიკური პირი', icon: Users },
    { value: 'company', label: 'იურიდიული პირი', icon: Building }
  ]

  const statusOptions = [
    { value: 'all', label: 'ყველა სტატუსი', color: 'gray' },
    { value: 'active', label: 'აქტიური', color: 'green' },
    { value: 'inactive', label: 'არააქტიური', color: 'red' }
  ]

  const paymentBehaviorOptions = [
    { value: 'all', label: 'ყველა კატეგორია', color: 'gray' },
    { value: 'excellent', label: 'შესანიშნავი', color: 'green' },
    { value: 'good', label: 'კარგი', color: 'blue' },
    { value: 'average', label: 'საშუალო', color: 'yellow' },
    { value: 'poor', label: 'ცუდი', color: 'red' }
  ]

  const quickFilterButtons = [
    { 
      label: 'ყველა', 
      action: quickFilters.all, 
      active: !hasActiveFilters,
      icon: Users
    },
    { 
      label: 'ფიზ. პირები', 
      action: quickFilters.individuals, 
      active: filters.type === 'individual',
      icon: Users
    },
    { 
      label: 'კომპანიები', 
      action: quickFilters.companies, 
      active: filters.type === 'company',
      icon: Building
    },
    { 
      label: 'აქტიური', 
      action: quickFilters.active, 
      active: filters.status === 'active',
      icon: UserCheck
    },
    { 
      label: 'არააქტიური', 
      action: quickFilters.inactive, 
      active: filters.status === 'inactive',
      icon: UserX
    },
    { 
      label: 'ამ თვეში', 
      action: quickFilters.thisMonth, 
      active: !!filters.created_after
    }
  ]

  return (
    <div className="space-y-4">
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {quickFilterButtons.map((filter) => (
          <Button
            key={filter.label}
            variant={filter.active ? 'default' : 'outline'}
            size="sm"
            onClick={filter.action}
            className="text-xs flex items-center gap-2"
          >
            {filter.icon && <filter.icon className="w-3 h-3" />}
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="მოძებნეთ კლიენტი სახელის, ელ.ფოსტის ან საიდენტიფიკაციო ნომრით..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-10"
            />
            {filters.search && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => onFiltersChange({ search: '' })}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          ფილტრები
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {[
                filters.type !== 'all' ? 1 : 0,
                filters.status !== 'all' ? 1 : 0,
                filters.payment_behavior !== 'all' ? 1 : 0,
                filters.created_after ? 1 : 0
              ].reduce((a, b) => a + b, 0)}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            გასუფთავება
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div className="space-y-2">
                <Label>კლიენტის ტიპი</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => onFiltersChange({ type: value as ClientFilters['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>სტატუსი</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => onFiltersChange({ status: value as ClientFilters['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            option.color === 'green' ? 'bg-green-500' :
                            option.color === 'red' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Behavior Filter */}
              <div className="space-y-2">
                <Label>გადახდის ქცევა</Label>
                <Select
                  value={filters.payment_behavior}
                  onValueChange={(value) => onFiltersChange({ payment_behavior: value as ClientFilters['payment_behavior'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentBehaviorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            option.color === 'green' ? 'bg-green-500' :
                            option.color === 'blue' ? 'bg-blue-500' :
                            option.color === 'yellow' ? 'bg-yellow-500' :
                            option.color === 'red' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">აქტიური ფილტრები:</Label>
                  <div className="flex flex-wrap gap-2">
                    {filters.type !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        ტიპი: {typeOptions.find(t => t.value === filters.type)?.label}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-3 w-3 p-0"
                          onClick={() => onFiltersChange({ type: 'all' })}
                        >
                          <X className="w-2 h-2" />
                        </Button>
                      </Badge>
                    )}
                    
                    {filters.status !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        სტატუსი: {statusOptions.find(s => s.value === filters.status)?.label}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-3 w-3 p-0"
                          onClick={() => onFiltersChange({ status: 'all' })}
                        >
                          <X className="w-2 h-2" />
                        </Button>
                      </Badge>
                    )}
                    
                    {filters.payment_behavior !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        ქცევა: {paymentBehaviorOptions.find(p => p.value === filters.payment_behavior)?.label}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-3 w-3 p-0"
                          onClick={() => onFiltersChange({ payment_behavior: 'all' })}
                        >
                          <X className="w-2 h-2" />
                        </Button>
                      </Badge>
                    )}

                    {filters.created_after && (
                      <Badge variant="secondary" className="text-xs">
                        ამ თვეში
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-3 w-3 p-0"
                          onClick={() => onFiltersChange({ created_after: undefined })}
                        >
                          <X className="w-2 h-2" />
                        </Button>
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}