import { 
  X, 
  Banknote, 
  CreditCard, 
  QrCode, 
  Smartphone, 
  CheckCircle2, 
  Receipt, 
  ArrowRight,
  Calculator
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo } from 'react'
import { usePosStore } from '@/store/usePosStore'
import { useAuthStore } from '@/store/useAuthStore'
import { transactionsRepo } from '@/repositories/transactionsRepo'
import { cn } from '@/lib/utils'
import ReceiptModal from './ReceiptModal'
import { toast } from 'sonner'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  total: number
}

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Tunai', icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'debit', name: 'Debit/Kredit', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'qris', name: 'QRIS', icon: QrCode, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'e-wallet', name: 'E-Wallet', icon: Smartphone, color: 'text-amber-500', bg: 'bg-amber-500/10' },
]

const QUICK_CASH = [50000, 100000, 200000, 500000]

export default function PaymentModal({ isOpen, onClose, total }: PaymentModalProps) {
  const [method, setMethod] = useState('cash')
  const [amountPaid, setAmountPaid] = useState<string>('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [transactionData, setTransactionData] = useState<any>(null)
  
  const { cart, clearCart, getSubtotal, getTax, getDiscountTotal, selectedCustomer } = usePosStore()
  const { user, currentStore } = useAuthStore()

  const change = useMemo(() => {
    const paid = parseFloat(amountPaid) || 0
    return Math.max(0, paid - total)
  }, [amountPaid, total])

  const isAmountValid = useMemo(() => {
    const paid = parseFloat(amountPaid) || 0
    return paid >= total || method !== 'cash'
  }, [amountPaid, total, method])

  const handleProcessPayment = () => {
    void (async () => {
      try {
        const now = new Date()
        const paid = method === 'cash' ? (parseFloat(amountPaid) || 0) : total

        const localTx = await transactionsRepo.createSaleFromCart({
          storeId: currentStore?.id || 'DEFAULT',
          cashierId: user?.id || 'SYSTEM',
          customerId: selectedCustomer?.id,
          cartItems: cart,
          paymentMethod: method as any,
          subtotal: getSubtotal(),
          tax: getTax(),
          discountTotal: getDiscountTotal(),
          total,
          amountPaid: paid,
          change: method === 'cash' ? Math.max(0, paid - total) : 0,
          timestamp: now,
        })

        setTransactionData({
          ...localTx,
          customer: selectedCustomer
        })
        setIsSuccess(true)

        setTimeout(() => {
          setShowReceipt(true)
        }, 500)
      } catch (e: any) {
        toast.error(e?.message ? String(e.message) : 'Pembayaran gagal diproses.')
      }
    })()
  }

  const handleCloseReceipt = () => {
    clearCart()
    setShowReceipt(false)
    setIsSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
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
        className="relative w-full max-w-4xl bg-card rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-auto"
      >
        {isSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center text-white"
            >
              <CheckCircle2 size={64} strokeWidth={3} />
            </motion.div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Pembayaran Berhasil!</h2>
              <p className="text-muted-foreground font-medium mt-2">Menyiapkan struk belanja...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Left: Summary */}
            <div className="w-full md:w-[350px] bg-accent/20 p-8 border-b md:border-b-0 md:border-r border-border/40 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-xl tracking-tight uppercase">Ringkasan</h3>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-all md:hidden">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 flex-1">
                <div className="p-6 bg-background rounded-3xl border border-border/30 shadow-sm">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Total Tagihan</p>
                  <h4 className="text-3xl font-black text-primary tracking-tighter">
                    Rp {total.toLocaleString('id-ID')}
                  </h4>
                </div>

                {method === 'cash' && (
                  <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20">
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Kembalian</p>
                    <h4 className="text-2xl font-black text-emerald-600 tracking-tighter">
                      Rp {change.toLocaleString('id-ID')}
                    </h4>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-border/40 space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Receipt size={18} />
                  <span className="text-sm font-bold">Pajak (PPN 11%) Termasuk</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calculator size={18} />
                  <span className="text-sm font-bold">Pembulatan Otomatis</span>
                </div>
              </div>
            </div>

            {/* Right: Payment Input */}
            <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-2xl tracking-tight uppercase">Metode Pembayaran</h3>
                <button onClick={onClose} className="hidden md:flex p-2 rounded-xl hover:bg-accent transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all text-left group",
                      method === m.id 
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                        : "border-border/40 hover:border-primary/40 hover:bg-accent/50"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", m.bg, m.color)}>
                      <m.icon size={24} strokeWidth={2.5} />
                    </div>
                    <span className={cn("font-bold text-sm lg:text-base", method === m.id ? "text-primary" : "text-foreground")}>
                      {m.name}
                    </span>
                  </button>
                ))}
              </div>

              {method === 'cash' && (
                <div className="space-y-6 mb-10">
                  <div>
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 mb-2 block">
                      Jumlah Uang Tunai
                    </label>
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-muted-foreground">Rp</div>
                      <input 
                        type="number"
                        autoFocus
                        placeholder="0"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="w-full h-20 pl-20 pr-8 rounded-[2rem] bg-accent/30 border-none ring-2 ring-transparent focus:ring-primary/40 transition-all text-3xl font-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {QUICK_CASH.map((val) => (
                      <button
                        key={val}
                        onClick={() => setAmountPaid(val.toString())}
                        className="py-4 rounded-2xl bg-card border border-border/40 hover:border-primary hover:bg-primary/5 font-black text-xs transition-all active:scale-95 shadow-sm"
                      >
                        {val / 1000}k
                      </button>
                    ))}
                    <button
                      onClick={() => setAmountPaid(total.toString())}
                      className="col-span-4 py-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white font-black text-sm uppercase tracking-widest transition-all"
                    >
                      Uang Pas
                    </button>
                  </div>
                </div>
              )}

              <button
                disabled={!isAmountValid}
                onClick={handleProcessPayment}
                className={cn(
                  "w-full py-6 rounded-[2.5rem] font-black text-xl lg:text-2xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl",
                  isAmountValid 
                    ? "bg-primary text-primary-foreground shadow-primary/30" 
                    : "bg-muted text-muted-foreground grayscale cursor-not-allowed"
                )}
              >
                PROSES PEMBAYARAN
                <ArrowRight size={28} strokeWidth={2.5} />
              </button>
            </div>
          </>
        )}
      </motion.div>
      </div>

      <AnimatePresence>
        {showReceipt && transactionData && (
          <ReceiptModal 
            isOpen={showReceipt}
            onClose={handleCloseReceipt}
            transactionData={transactionData}
          />
        )}
      </AnimatePresence>
    </>
  )
}
