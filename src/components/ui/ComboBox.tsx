import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ComboBoxOption = {
  value: string
  label: string
}

type ComboBoxProps = {
  value: string
  onChange: (value: string) => void
  options: ComboBoxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

export default function ComboBox({
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  emptyText = 'Tidak ada data.',
  disabled,
  className,
}: ComboBoxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = useMemo(() => options.find((o) => o.value === value) || null, [options, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onMouseDown = (e: MouseEvent) => {
      const root = rootRef.current
      if (!root) return
      if (!root.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousedown', onMouseDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousedown', onMouseDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          'w-full h-14 pl-12 pr-11 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold flex items-center justify-between',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <span className={cn('truncate text-left', !selected && 'text-muted-foreground/70')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={18} className={cn('shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/40 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-border/40">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-bold"
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto no-scrollbar p-2">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm font-bold text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filtered.map((o) => {
                const isSelected = o.value === value
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value)
                      setOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-left hover:bg-accent transition-all',
                      isSelected && 'bg-primary/5 border border-primary/20'
                    )}
                  >
                    <span className={cn('text-sm font-bold truncate', isSelected && 'text-primary')}>
                      {o.label}
                    </span>
                    {isSelected && <Check size={18} className="text-primary shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

