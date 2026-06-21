
import { cn } from '@/lib/utils'
import { useState } from 'react'

export type TabsProps = {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}
export default function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
}: TabsProps) {
  const [active, setActive] = useState(defaultValue || '')
  const currentValue = value ?? active
  const setCurrentValue = onValueChange ?? setActive
  return (
    <div>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === TabsList || child.type === TabsContent) {
            return React.cloneElement(child as React.ReactElement<any>, {
              currentValue,
              setCurrentValue,
            })
          }
        }
        return child
      })}
    </div>
  )
}

export type TabsListProps = {
  className?: string
  children: React.ReactNode
  currentValue?: string
  setCurrentValue?: (v: string) => void
}
export function TabsList({
  className,
  children,
  currentValue,
  setCurrentValue,
}: TabsListProps) {
  return (
    <div className={cn('flex gap-2 bg-accent/30 p-2 rounded-2xl border border-border/40', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === TabsTrigger) {
          return React.cloneElement(child as React.ReactElement<any>, {
            currentValue,
            setCurrentValue,
          })
        }
        return child
      })}
    </div>
  )
}

export type TabsTriggerProps = {
  value: string
  className?: string
  children: React.ReactNode
  currentValue?: string
  setCurrentValue?: (v: string) => void
}
export function TabsTrigger({
  value,
  className,
  children,
  currentValue,
  setCurrentValue,
}: TabsTriggerProps) {
  const isActive = currentValue === value
  return (
    <button
      type="button"
      onClick={() => setCurrentValue?.(value)}
      className={cn(
        'flex-1 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all',
        isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {children}
    </button>
  )
}

export type TabsContentProps = {
  value: string
  className?: string
  children: React.ReactNode
  currentValue?: string
  setCurrentValue?: (v: string) => void
}
export function TabsContent({
  value,
  className,
  children,
  currentValue,
  setCurrentValue,
}: TabsContentProps) {
  if (currentValue !== value) return null
  return <div className={cn('pt-4', className)}>{children}</div>
}
