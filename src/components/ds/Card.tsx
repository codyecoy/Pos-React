
import { cn } from '@/lib/utils'

export type CardProps = React.HTMLAttributes<HTMLDivElement>

export default function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-card rounded-[2.5rem] border border-border/40 shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  )
}
