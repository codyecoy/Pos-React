import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface ShortcutOptions {
  onPayment?: () => void
  onClear?: () => void
  onSearch?: () => void
  onDashboard?: () => void
  onCashier?: () => void
  onProducts?: () => void
}

export const useKeyboardShortcuts = (options: ShortcutOptions) => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid shortcuts if typing in input
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        // But allow Escape to blur input
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur()
        }
        return
      }

      // F1: Cashier
      if (e.key === 'F1') {
        e.preventDefault()
        navigate('/cashier')
        options.onCashier?.()
      }

      // F2: Dashboard
      if (e.key === 'F2') {
        e.preventDefault()
        navigate('/dashboard')
        options.onDashboard?.()
      }

      // F3: Products
      if (e.key === 'F3') {
        e.preventDefault()
        navigate('/products')
        options.onProducts?.()
      }

      // Space / Enter (if not in input): Payment
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault()
        options.onPayment?.()
      }

      // Delete / Escape: Clear Cart
      if (e.key === 'Delete') {
        e.preventDefault()
        options.onClear?.()
      }

      // / or f: Search
      if (e.key === '/' || e.key === 'f') {
        e.preventDefault()
        options.onSearch?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, options])
}
