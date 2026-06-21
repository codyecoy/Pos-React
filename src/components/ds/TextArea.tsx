
import { cn } from '@/lib/utils'

export type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean
  success?: boolean
}

export default function TextArea({
  className,
  error,
  success,
  disabled,
  ...props
}: TextAreaProps) {
  const base = 'px-4 py-3 rounded-2xl bg-accent/30 text-base font-bold transition-all border-none ring-1 focus:ring-2'
  const states = {
    default: 'ring-border/40 focus:ring-primary/40',
    error: 'ring-destructive/40 focus:ring-destructive',
    success: 'ring-green-500/40 focus:ring-green-500',
  }
  const state = error ? 'error' : success ? 'success' : 'default'

  return (
    <textarea
      disabled={disabled}
      className={cn(
        base,
        states[state],
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
}
