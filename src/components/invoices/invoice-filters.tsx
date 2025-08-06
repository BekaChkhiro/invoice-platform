'use client'

import { useState } from 'react'
import { CalendarIcon, Search, Filter, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'

import { InvoiceFilters } from '@/lib/hooks/use-invoice-list'
import { useClientSearch } from '@/lib/hooks/use-client-search'

interface InvoiceFiltersProps {
  filters: InvoiceFilters
  onFiltersChange: (filters: Partial<InvoiceFilters>) => void
  onReset: () => void
  quickFilters: {
    all: () => void
    overdue: () => void
    unpaid: () => void
    drafts: () => void
    thisMonth: () => void
    thisWeek: () => void
  }
}

export function InvoiceFilters({ 
  filters, 
  onFiltersChange, 
  onReset,
  quickFilters 
}: InvoiceFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [dateRange, setDateRange] = useState<{
    from?: Date
    to?: Date
  }>({
    from: filters.date_from ? new Date(filters.date_from) : undefined,
    to: filters.date_to ? new Date(filters.date_to) : undefined
  })

  const { suggestions: clientSuggestions, query: clientQuery, setQuery: setClientQuery } = useClientSearch()

  const hasActiveFilters = 
    filters.status !== 'all' ||
    filters.client_id ||
    filters.date_from ||
    filters.date_to ||
    filters.search

  const statusOptions = [
    { value: 'all', label: 'ყველა სტატუსი', color: 'gray' },
    { value: 'draft', label: 'მონახაზი', color: 'gray' },
    { value: 'sent', label: 'გაგზავნილი', color: 'blue' },
    { value: 'paid', label: 'გადახდილი', color: 'green' },
    { value: 'overdue', label: 'ვადაგადაცილებული', color: 'red' },
    { value: 'cancelled', label: 'გაუქმებული', color: 'gray' }
  ]

  const quickFilterButtons = [
    { label: 'ყველა', action: quickFilters.all, active: !hasActiveFilters },
    { label: 'ვადაგადაცილებული', action: quickFilters.overdue, active: filters.status === 'overdue' },
    { label: 'გადაუხდელი', action: quickFilters.unpaid, active: filters.status === 'sent' },
    { label: 'მონახაზები', action: quickFilters.drafts, active: filters.status === 'draft' },
    { label: 'ამ თვეში', action: quickFilters.thisMonth, active: false },
    { label: 'ამ კვირაში', action: quickFilters.thisWeek, active: false }
  ]

  const handleDateRangeChange = (newRange: { from?: Date; to?: Date }) => {
    setDateRange(newRange)
    onFiltersChange({
      date_from: newRange.from ? newRange.from.toISOString().split('T')[0] : undefined,
      date_to: newRange.to ? newRange.to.toISOString().split('T')[0] : undefined
    })
  }

  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined })
    onFiltersChange({ date_from: undefined, date_to: undefined })
  }

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
            className="text-xs"
          >
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
              placeholder="მოძებნეთ ინვოისი ნომრის, კლიენტის სახელის მიხედვით..."
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
                filters.status !== 'all' ? 1 : 0,
                filters.client_id ? 1 : 0,
                (filters.date_from || filters.date_to) ? 1 : 0
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
              {/* Status Filter */}
              <div className="space-y-2">
                <Label>სტატუსი</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => onFiltersChange({ status: value as InvoiceFilters['status'] })}
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
                            option.color === 'blue' ? 'bg-blue-500' :
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

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label>თარიღების შუალედი</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy", { locale: ka })} -{" "}
                            {format(dateRange.to, "dd/MM/yyyy", { locale: ka })}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy", { locale: ka })
                        )
                      ) : (
                        "აირჩიეთ თარიღები"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="p-3">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) => handleDateRangeChange({ from: range?.from, to: range?.to })}
                        numberOfMonths={2}
                      />
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={clearDateRange}>
                          გაასუფთავე
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Amount Range Filter */}
              <div className="space-y-2">
                <Label>თანხის შუალედი</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="მინ. თანხა"
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="მაქს. თანხა"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">აქტიური ფილტრები:</Label>
                  <div className="flex flex-wrap gap-2">
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
                    
                    {(filters.date_from || filters.date_to) && (
                      <Badge variant="secondary" className="text-xs">
                        თარიღები: {filters.date_from && format(new Date(filters.date_from), "dd/MM", { locale: ka })}
                        {filters.date_to && ` - ${format(new Date(filters.date_to), "dd/MM", { locale: ka })}`}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-3 w-3 p-0"
                          onClick={clearDateRange}
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