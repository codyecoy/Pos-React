
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export default function Button({
  className,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  const base = 'inline-flex items-center justify-center gap-2 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/40'

  const variants = {
    default: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110',
    outline: 'border border-border/40 bg-accent/30 hover:bg-accent',
    destructive: 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 hover:brightness-110',
    secondary: 'bg-secondary text-secondary-foreground hover:brightness-95',
    ghost: 'hover:bg-accent',
    link: 'text-primary underline-offset-4 hover:underline',
  }

  const sizes = {
    sm: 'h-10 px-4 text-xs',
    md: 'h-12 px-6 text-sm',
    lg: 'h-14 px-8 text-base',
    xl: 'h-16 px-10 text-base',
  }

  return (
    <button
      disabled={isDisabled}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        isDisabled && 'opacity-60 cursor-not-allowed active:scale-100',
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={size === 'sm' ? 16 : 20} />}
      {props.children}
    </button>
  )
}
