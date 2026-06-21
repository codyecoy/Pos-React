
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export default function Checkbox({
  className,
  label,
  checked,
  disabled,
  ...props
}: CheckboxProps) {
  return (
    <label className={cn('flex items-center gap-3 cursor-pointer select-none', disabled && 'opacity-60 cursor-not-allowed', className)}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            'w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center',
            checked ? 'border-primary bg-primary' : 'border-border/40 bg-accent/30 hover:border-primary/40',
            disabled && 'cursor-not-allowed'
          )}
        >
          {checked && <Check size={16} className="text-primary-foreground" />}
        </div>
      </div>
      {label && <span className="text-sm font-bold">{label}</span>}
    </label>
  )
}
