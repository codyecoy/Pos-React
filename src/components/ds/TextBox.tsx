
import { cn } from '@/lib/utils'

export type TextBoxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean
  success?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export default function TextBox({
  className,
  error,
  success,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: TextBoxProps) {
  const base = 'h-14 px-4 rounded-2xl bg-accent/30 text-base font-bold transition-all border-none ring-1 focus:ring-2'
  const states = {
    default: 'ring-border/40 focus:ring-primary/40',
    error: 'ring-destructive/40 focus:ring-destructive',
    success: 'ring-green-500/40 focus:ring-green-500',
  }
  const state = error ? 'error' : success ? 'success' : 'default'

  return (
    <div className="relative group">
      {leftIcon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
          {leftIcon}
        </div>
      )}
      <input
        disabled={disabled}
        className={cn(
          base,
          states[state],
          leftIcon && 'pl-12',
          rightIcon && 'pr-12',
          disabled && 'opacity-60 cursor-not-allowed',
          className
        )}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
          {rightIcon}
        </div>
      )}
    </div>
  )
}
