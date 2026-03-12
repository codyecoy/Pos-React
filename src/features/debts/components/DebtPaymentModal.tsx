import { 
  X, 
  Banknote, 
  ArrowRight,
  ShieldCheck,
  CreditCard as DebtIcon
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Debt } from '@/types'
import { cn } from '@/lib/utils'

interface DebtPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (payment: { amount: number, method: string }) => void
  debt: Debt | null
}

const METHODS = [
  { id: 'cash', name: 'Tunai', icon: Banknote },
  { id: 'transfer', name: 'Transfer Bank', icon: DebtIcon },
]

export default function DebtPaymentModal({ isOpen, onClose, onSave, debt }: DebtPaymentModalProps) {
  const [amount, setAmount] = useState<string>('')
  const [method, setMethod] = useState('cash')

  if (!isOpen || !debt) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payAmount = parseFloat(amount) || 0
    if (payAmount <= 0 || payAmount > debt.remaining) return
    onSave({ amount: payAmount, method })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-card rounded-[3rem] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-8 lg:p-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-2xl tracking-tight uppercase">Bayar Hutang</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="mb-8 p-6 bg-primary/5 rounded-3xl border border-primary/20">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Hutang Ke</p>
            <p className="font-bold text-lg">{debt.supplierName}</p>
            <div className="mt-4 pt-4 border-t border-dashed border-primary/20 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Sisa Tagihan</p>
                <p className="text-2xl font-black text-primary">Rp {debt.remaining.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Jumlah Pembayaran</label>
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-xl text-muted-foreground">Rp</span>
                <input 
                  type="number" 
                  autoFocus
                  required
                  max={debt.remaining}
                  className="w-full h-16 pl-16 pr-6 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-2xl font-black"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <button 
                type="button"
                onClick={() => setAmount(debt.remaining.toString())}
                className="text-[10px] font-black text-primary uppercase tracking-widest ml-4 hover:underline"
              >
                Bayar Semua (Lunas)
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-3">
                {METHODS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                      method === m.id ? "border-primary bg-primary/5 text-primary" : "border-border/40 hover:border-primary/40"
                    )}
                  >
                    <m.icon size={18} />
                    <span className="font-bold text-xs">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0}
              className={cn(
                "w-full py-6 mt-4 rounded-[2.5rem] font-black text-lg flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl",
                amount && parseFloat(amount) > 0
                  ? "bg-emerald-500 text-white shadow-emerald-500/30" 
                  : "bg-muted text-muted-foreground grayscale cursor-not-allowed"
              )}
            >
              KONFIRMASI BAYAR
              <ShieldCheck size={22} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
