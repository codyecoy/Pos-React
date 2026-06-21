
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { createContext, useContext, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type ModalContextType = {
  isOpen: boolean
  onClose: () => void
}

const ModalContext = createContext<ModalContextType | null>(null)

export type ModalProps = {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({
  isOpen,
  onClose,
  children,
}: ModalProps) {
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
    <ModalContext.Provider value={{ isOpen, onClose }}>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {children}
      </div>
    </ModalContext.Provider>,
    document.body
  )
}

export function ModalContent({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('relative w-full max-w-2xl bg-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-border/40', className)}>
      {children}
    </div>
  )
}

export function ModalHeader({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('p-6 lg:p-8 border-b border-border/40 flex items-center justify-between', className)}>
      {children}
    </div>
  )
}

export function ModalTitle({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <h3 className={cn('font-black text-xl tracking-tight uppercase', className)}>
      {children}
    </h3>
  )
}

export function ModalClose() {
  const context = useContext(ModalContext)
  if (!context) throw new Error('ModalClose must be used within a Modal')
  return (
    <button onClick={context.onClose} className="p-2 rounded-xl hover:bg-accent transition-all">
      <X size={22} />
    </button>
  )
}

export function ModalBody({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('p-6 lg:p-8', className)}>
      {children}
    </div>
  )
}

export function ModalFooter({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex gap-3 p-6 lg:p-8 pt-0', className)}>
      {children}
    </div>
  )
}
