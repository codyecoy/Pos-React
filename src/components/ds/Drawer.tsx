
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { createContext, useContext, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type DrawerContextType = {
  isOpen: boolean
  onClose: () => void
  direction: 'left' | 'right' | 'top' | 'bottom'
}

const DrawerContext = createContext<DrawerContextType | null>(null)

export type DrawerProps = {
  isOpen: boolean
  onClose: () => void
  direction?: 'left' | 'right' | 'top' | 'bottom'
  children: React.ReactNode
}

export default function Drawer({
  isOpen,
  onClose,
  direction = 'right',
  children,
}: DrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', onKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <DrawerContext.Provider value={{ isOpen, onClose, direction }}>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      />
      {children}
    </DrawerContext.Provider>,
    document.body
  )
}

export function DrawerContent({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const context = useContext(DrawerContext)
  if (!context) throw new Error('DrawerContent must be used within a Drawer')

  const directionClasses = {
    left: 'left-0 top-0 bottom-0 w-80',
    right: 'right-0 top-0 bottom-0 w-80',
    top: 'top-0 left-0 right-0 h-auto max-h-[60vh',
    bottom: 'bottom-0 left-0 right-0 h-auto max-h-[60vh]',
  }

  return (
    <div
      className={cn(
        'fixed z-50 bg-card shadow-2xl border border-border/40 overflow-hidden',
        directionClasses[context.direction],
        className
      )}
    >
      {children}
    </div>
  )
}

export function DrawerHeader({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn('p-6 border-b border-border/40 flex items-center justify-between', className)}>
      {children}
    </div>
  )
}

export function DrawerTitle({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <h3 className={cn('font-black text-lg tracking-tight uppercase', className)}>
      {children}
    </h3>
  )
}

export function DrawerClose() {
  const context = useContext(DrawerContext)
  if (!context) throw new Error('DrawerClose must be used within a Drawer')
  return (
    <button onClick={context.onClose} className="p-2 rounded-xl hover:bg-accent transition-all">
      <X size={22} />
    </button>
  )
}

export function DrawerBody({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('p-6 overflow-y-auto', className)}>
      {children}
    </div>
  )
}
