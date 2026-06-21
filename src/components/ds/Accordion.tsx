
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

export type AccordionProps = {
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  children: React.ReactNode
}

export default function Accordion({
  type = 'single',
  defaultValue,
  value,
  onValueChange,
  children,
}: AccordionProps) {
  const [internalValue, setInternalValue] = useState<string | string[]>(() => {
    if (type === 'single') {
      return defaultValue || ''
    }
    return defaultValue || []
  })
  const currentValue = value ?? internalValue
  const setCurrentValue = onValueChange ?? setInternalValue
  return (
    <div>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
          type,
          currentValue,
          setCurrentValue,
        })
      }
        return child
      })}
    </div>
  )
}

import React from 'react'

export type AccordionItemProps = {
  value: string
  className?: string
  children: React.ReactNode
  type?: 'single' | 'multiple'
  currentValue?: string | string[]
  setCurrentValue?: (v: string | string[]) => void
}

export function AccordionItem({
  value,
  className,
  children,
  type,
  currentValue,
  setCurrentValue,
}: AccordionItemProps) {
  const isOpen = type === 'single' ? currentValue === value : (currentValue as string[]).includes(value)

  const toggle = () => {
    if (type === 'single') {
      setCurrentValue?.(isOpen ? '' : value)
    } else {
      const arr = currentValue as string[]
      if (isOpen) {
        setCurrentValue?.(arr.filter((v) => v !== value))
      } else {
        setCurrentValue?.([...arr, value])
      }
    }
  }
  return (
    <div className={cn('border border-border/40 rounded-2xl overflow-hidden mb-3', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            toggle,
          })
        }
        return child
      })}
    </div>
  )
}

export type AccordionTriggerProps = {
  className?: string
  children: React.ReactNode
  isOpen?: boolean
  toggle?: () => void
}

export function AccordionTrigger({
  className,
  children,
  isOpen,
  toggle,
}: AccordionTriggerProps) {
  return (
    <button
      type="button"
      onClick={toggle}
      className={cn('w-full flex items-center justify-between p-6 text-left', className)}
    >
      <span className="font-black">{children}</span>
      <ChevronDown
        className={cn('transition-transform', isOpen && 'rotate-180')}
        size={20}
      />
    </button>
  )
}

export type AccordionContentProps = {
  className?: string
  children: React.ReactNode
  isOpen?: boolean
}

export function AccordionContent({
  className,
  children,
  isOpen,
}: AccordionContentProps) {
  if (!isOpen) return null
  return (
    <div className={cn('px-6 pb-6', className)}>
      {children}
    </div>
  )
}
