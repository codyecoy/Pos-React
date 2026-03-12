import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  Tag, 
  X,
  CreditCard,
  Ban,
  PauseCircle,
  ReceiptText
} from 'lucide-react'
import { usePosStore } from '@/store/usePosStore'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import PaymentModal from './PaymentModal'

export default function CartPanel() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    getSubtotal,
    getTax,
    getTotal
  } = usePosStore()

  const subtotal = getSubtotal()
  const tax = getTax()
  const total = getTotal()

  return (
    <div className="flex flex-col h-full bg-card border-l border-border/60 shadow-2xl relative z-20 transition-all overflow-hidden rounded-tl-[3rem] rounded-bl-[3rem] tablet:rounded-none">
      {/* Header Area */}
      <div className="p-6 lg:p-8 border-b border-border/40 flex items-center justify-between bg-accent/10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
            <ShoppingBag size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-black text-xl lg:text-2xl tracking-tight">Keranjang</h2>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
              {cart.length} Item terpilih
            </p>
          </div>
        </div>
        
        <button 
          onClick={clearCart}
          disabled={cart.length === 0}
          className="p-3 rounded-2xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all disabled:opacity-30 active:scale-90"
        >
          <Ban size={22} />
        </button>
      </div>

      {/* Cart Items Area */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-4 space-y-4 no-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-40 select-none">
            <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center mb-6">
              <ShoppingBag size={48} className="text-muted-foreground" />
            </div>
            <p className="font-bold text-lg">Keranjang Kosong</p>
            <p className="text-sm font-medium mt-1">Pilih produk di sebelah kiri untuk memulai</p>
          </div>
        ) : (
          <AnimatePresence mode='popLayout'>
            {cart.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                key={item.id}
                className="group relative bg-accent/30 hover:bg-accent/50 p-4 rounded-3xl border border-transparent hover:border-primary/20 transition-all"
              >
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white overflow-hidden flex-shrink-0 shadow-sm border border-border/20">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm lg:text-base leading-tight truncate pr-2">
                        {item.name}
                      </h4>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-primary font-bold text-sm lg:text-base">
                        Rp {item.price.toLocaleString('id-ID')}
                      </p>
                      
                      <div className="flex items-center gap-1.5 bg-background p-1 rounded-2xl border border-border/30 shadow-sm">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-accent text-muted-foreground transition-all active:scale-90"
                        >
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-accent text-muted-foreground transition-all active:scale-90"
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer / Summary Area */}
      <div className="p-6 lg:p-8 bg-accent/20 border-t border-border/40 space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm font-semibold text-muted-foreground">
            <span>Subtotal</span>
            <span className="text-foreground">Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>Pajak</span>
              <span className="px-1.5 py-0.5 rounded-md bg-accent text-[10px] font-bold">11%</span>
            </div>
            <span className="text-foreground">Rp {tax.toLocaleString('id-ID')}</span>
          </div>
          <div className="pt-3 border-t border-border/30 flex justify-between items-center">
            <span className="font-black text-lg lg:text-xl tracking-tight">TOTAL</span>
            <span className="font-black text-2xl lg:text-3xl text-primary tracking-tighter">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          <button className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-3xl bg-background border border-border/40 hover:bg-accent hover:border-primary/30 transition-all font-bold text-xs uppercase tracking-widest active:scale-95">
            <PauseCircle size={22} className="text-amber-500" />
            SIMPAN
          </button>
          <button className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-3xl bg-background border border-border/40 hover:bg-accent hover:border-primary/30 transition-all font-bold text-xs uppercase tracking-widest active:scale-95">
            <ReceiptText size={22} className="text-primary" />
            CETAK
          </button>
        </div>

        <button 
          disabled={cart.length === 0}
          onClick={() => setIsPaymentOpen(true)}
          className={cn(
            "w-full py-6 rounded-[2.5rem] bg-primary text-primary-foreground font-black text-xl lg:text-2xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100",
            "relative overflow-hidden group"
          )}
        >
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4">
              <CreditCard size={28} strokeWidth={2.5} />
              BAYAR SEKARANG
            </div>
            <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-1">Tekan ENTER / SPACE</span>
          </div>
          
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        </button>
      </div>

      <AnimatePresence>
        {isPaymentOpen && (
          <PaymentModal 
            isOpen={isPaymentOpen} 
            onClose={() => setIsPaymentOpen(false)} 
            total={total} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}
