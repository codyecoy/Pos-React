
import { cn } from '@/lib/utils'
import Label from './Label'

export type FormFieldProps = {
  label?: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}

export default function FormField({
  label,
  required,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {error && (
        <p className="text-xs font-bold text-destructive">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs font-bold text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
