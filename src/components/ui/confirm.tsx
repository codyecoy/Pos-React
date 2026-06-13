import * as Dialog from '@radix-ui/react-dialog'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ConfirmOptions = {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}

type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const resolverRef = useRef<((value: boolean) => void) | null>(null)
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<Required<ConfirmOptions>>({
    title: 'Konfirmasi',
    description: 'Lanjutkan aksi ini?',
    confirmText: 'Ya',
    cancelText: 'Tidak',
    destructive: false,
  })

  const confirm = useCallback<ConfirmFn>((opts) => {
    const next: Required<ConfirmOptions> = {
      title: opts?.title ?? 'Konfirmasi',
      description: opts?.description ?? 'Lanjutkan aksi ini?',
      confirmText: opts?.confirmText ?? 'Ya',
      cancelText: opts?.cancelText ?? 'Tidak',
      destructive: opts?.destructive ?? false,
    }

    setOptions(next)
    setOpen(true)

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const closeWith = useCallback((value: boolean) => {
    const r = resolverRef.current
    resolverRef.current = null
    setOpen(false)
    r?.(value)
  }, [])

  const value = useMemo(() => confirm, [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          if (!next && open) closeWith(false)
          setOpen(next)
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <Dialog.Content
            className={cn(
              'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[calc(100%-2rem)] max-w-lg rounded-[2rem] bg-card border border-border/40 shadow-2xl p-6 lg:p-8',
            )}
          >
            <Dialog.Title className="text-lg lg:text-xl font-black tracking-tight uppercase">
              {options.title}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm font-medium text-muted-foreground">
              {options.description}
            </Dialog.Description>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                onClick={() => closeWith(false)}
                className="h-12 px-5 rounded-2xl bg-accent/40 border border-border/40 font-black text-xs uppercase tracking-widest hover:bg-accent transition-all active:scale-95"
              >
                {options.cancelText}
              </button>
              <button
                onClick={() => closeWith(true)}
                className={cn(
                  'h-12 px-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95',
                  options.destructive
                    ? 'bg-destructive text-destructive-foreground shadow-destructive/20'
                    : 'bg-primary text-primary-foreground shadow-primary/20'
                )}
              >
                {options.confirmText}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm harus dipakai di dalam ConfirmProvider')
  }
  return ctx
}

