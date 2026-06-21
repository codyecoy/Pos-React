
import { cn } from '@/lib/utils'

export type RadioProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export default function Radio({
  className,
  label,
  checked,
  disabled,
  ...props
}: RadioProps) {
  return (
    <label className={cn('flex items-center gap-3 cursor-pointer select-none', disabled && 'opacity-60 cursor-not-allowed', className)}>
      <div className="relative">
        <input
          type="radio"
          checked={checked}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            'w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center',
            checked ? 'border-primary' : 'border-border/40 bg-accent/30 hover:border-primary/40',
            disabled && 'cursor-not-allowed'
          )}
        >
          {checked && <div className="w-3 h-3 rounded-full bg-primary" />}
        </div>
      </div>
      {label && <span className="text-sm font-bold">{label}</span>}
    </label>
  )
}
