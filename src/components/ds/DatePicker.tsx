
import { cn } from '@/lib/utils'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export type DatePickerProps = {
  value?: Date | null
  defaultValue?: Date | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: Date
  maxDate?: Date
}

export default function DatePicker({
  value,
  defaultValue,
  onChange,
  placeholder = 'Pilih tanggal',
  disabled,
  className,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || null)
  const currentValue = value ?? internalValue
  const setCurrentValue = onChange ?? setInternalValue

  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(currentValue || new Date())

  const isDisabled = (date: Date) => {
    if (disabled) return true
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysCount = new Date(year, month + 1, 0).getDate()

    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysCount; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }, [viewDate])

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full h-14 pl-4 pr-11 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold flex items-center justify-between text-left',
          disabled && 'opacity-60 cursor-not-allowed',
          !currentValue && 'text-muted-foreground/70'
        )}
      >
        {currentValue ? formatDate(currentValue) : placeholder}
        <Calendar size={18} className="shrink-0 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/40 rounded-2xl shadow-2xl z-50 overflow-hidden p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
              }}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-accent"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-black text-sm uppercase">
              {viewDate.toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <button
              type="button"
              onClick={() => {
                setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
              }}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-accent"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 mb-2">
            {['Ming', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-black text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} />
              }
              const isSelected =
                currentValue &&
                date.getDate() === currentValue.getDate() &&
                date.getMonth() === currentValue.getMonth() &&
                date.getFullYear() === currentValue.getFullYear()

              const isToday =
                new Date().getDate() === date.getDate() &&
                new Date().getMonth() === date.getMonth() &&
                new Date().getFullYear() === date.getFullYear()

              const disabled = isDisabled(date)

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => {
                    if (!disabled) {
                      setCurrentValue(date)
                      setIsOpen(false)
                    }
                  }}
                  disabled={disabled}
                  className={cn(
                    'h-10 w-full flex items-center justify-center rounded-xl text-sm font-bold transition-all',
                    disabled && 'opacity-30 cursor-not-allowed',
                    !disabled && !isSelected && 'hover:bg-accent',
                    isSelected && 'bg-primary text-primary-foreground',
                    isToday && !isSelected && 'text-primary'
                  )}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
