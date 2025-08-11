'use client'

import * as React from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DatePickerWithRangeProps {
  className?: string
  from?: Date
  to?: Date
  onSelect?: (range: DateRange | undefined) => void
}

export function DatePickerWithRange({
  className,
  from,
  to,
  onSelect,
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: from,
    to: to,
  })

  const handleSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate)
    onSelect?.(selectedDate)
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y', { locale: ka })} -{' '}
                  {format(date.to, 'LLL dd, y', { locale: ka })}
                </>
              ) : (
                format(date.from, 'LLL dd, y', { locale: ka })
              )
            ) : (
              <span>პერიოდის არჩევა</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={ka}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}