import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  X,
  CreditCard,
  Ban,
  PauseCircle,
  ReceiptText,
  FolderOpen,
  User,
  Users
} from 'lucide-react'
import { usePosStore } from '@/store/usePosStore'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import PaymentModal from './PaymentModal'
import ReceiptModal from './ReceiptModal'
import { createId } from '@/lib/ids'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/useAuthStore'
import { transactionsRepo } from '@/repositories/transactionsRepo'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { Customer } from '@/types'

export default function CartPanel() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [isHoldListOpen, setIsHoldListOpen] = useState(false)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const { 
    cart, 
    setCart,
    updateQuantity, 
    removeFromCart, 
    clearCart,
    getSubtotal,
    getTax,
    getTotal,
    selectedCustomer,
    setSelectedCustomer
  } = usePosStore()
  const { user, currentStore } = useAuthStore()

  const subtotal = getSubtotal()
  const tax = getTax()
  const total = getTotal()

  const holds = useLiveQuery(async () => {
    const rows = await db.transactions.where('status').equals('hold').toArray()
    return rows
      .filter((t: any) => !t.deletedAt)
      .sort((a: any, b: any) => {
        const ta = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime()
        const tb = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime()
        return tb - ta
      })
  }, [], [])

  const customers = useLiveQuery(async () => {
    const rows = await db.customers.toArray()
    return rows.filter((c: any) => !c.deletedAt)
  }, [], [])

  const openPreviewReceipt = () => {
    const now = new Date()
    setReceiptData({
      id: `PREVIEW-${createId()}`,
      items: cart.map((c) => ({ ...c })),
      total,
      subtotal,
      tax,
      amountPaid: 0,
      change: 0,
      method: 'preview',
      timestamp: now,
    })
    setIsReceiptOpen(true)
  }

  const restoreHoldToCart = (transactionId: string) => {
    void (async () => {
      const items = await db.transaction_items.where('transactionId').equals(transactionId).toArray()
      if (items.length === 0) {
        toast.error('Data keranjang tersimpan tidak ditemukan.')
        return
      }

      const productIds = [...new Set(items.map((it: any) => String(it.productId || '')))].filter(Boolean)
      const products = await db.products.bulkGet(productIds)
      const byId = new Map(products.filter(Boolean).map((p: any) => [String(p.id), p]))

      const nextCart = items.map((it: any) => {
        const p = byId.get(String(it.productId || '')) as any
        const base = p || {
          id: String(it.productId || ''),
          name: String(it.name || ''),
          price: Number(it.price || 0),
          costPrice: 0,
          stock: 0,
          category: String(it.category || ''),
          image: '',
          barcode: String(it.barcode || ''),
          sku: String(it.sku || ''),
          status: 'Aktif',
        }

        return {
          ...base,
          price: Number(it.price || base.price || 0),
          quantity: Number(it.quantity || 1),
          discount: Number(it.discount || 0),
          note: it.note ? String(it.note) : undefined,
        }
      })

      setCart(nextCart as any)

      await db.transaction('rw', db.transactions, db.transaction_items, async () => {
        await db.transactions.delete(transactionId)
        await db.transaction_items.where('transactionId').equals(transactionId).delete()
      })

      setIsHoldListOpen(false)
      toast.success('Keranjang tersimpan berhasil diambil.')
    })()
  }

  const saveHold = () => {
    void (async () => {
      if (cart.length === 0) return
      try {
        const now = new Date()
        const storeId = currentStore?.id || 'DEFAULT'
        const cashierId = user?.id || 'SYSTEM'

        const localTx = await transactionsRepo.createHoldFromCart({
          storeId,
          cashierId,
          customerId: selectedCustomer?.id,
          cartItems: cart,
          subtotal,
          tax,
          discountTotal: cart.reduce((s, it) => s + Number(it.discount || 0) * Number(it.quantity || 0), 0),
          total,
          timestamp: now,
        })

        clearCart()
        toast.success(`Keranjang disimpan (#${localTx.id}).`)
      } catch (e: any) {
        toast.error(e?.message ? String(e.message) : 'Gagal menyimpan keranjang.')
      }
    })()
  }

  return (
    <div className="flex flex-col h-full bg-card border-l border-border/60 shadow-2xl relative z-20 transition-all overflow-hidden rounded-tl-[3rem] rounded-bl-[3rem] tablet:rounded-none">
      {/* Header Area */}
      <div className="p-4 lg:p-5 border-b border-border/40 bg-accent/10 backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <ShoppingBag size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-black text-lg lg:text-xl tracking-tight">Keranjang</h2>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                {cart.length} Item terpilih
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHoldListOpen(true)}
              className="p-2.5 rounded-2xl hover:bg-accent text-muted-foreground hover:text-primary transition-all active:scale-90"
              title="Ambil keranjang tersimpan"
            >
              <FolderOpen size={20} />
            </button>
            <button 
              onClick={clearCart}
              disabled={cart.length === 0}
              className="p-2.5 rounded-2xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all disabled:opacity-30 active:scale-90"
            >
              <Ban size={20} />
            </button>
          </div>
        </div>

        {/* Customer Selection */}
        <button
          onClick={() => setIsCustomerModalOpen(true)}
          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-background border border-border/40 hover:border-primary/40 hover:bg-accent/50 transition-all group"
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
            selectedCustomer ? "bg-emerald-100 text-emerald-600" : "bg-accent/50 text-muted-foreground"
          )}>
            {selectedCustomer ? <User size={18} /> : <Users size={18} />}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className={cn(
              "text-sm font-bold",
              selectedCustomer ? "text-foreground" : "text-muted-foreground"
            )}>
              {selectedCustomer ? selectedCustomer.name : "Pilih Member"}
            </p>
            {selectedCustomer?.phone && (
              <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
            )}
          </div>
          {selectedCustomer && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedCustomer(null)
              }}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
            >
              <X size={16} />
            </button>
          )}
        </button>
      </div>

      {/* Cart Items Area */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-5 py-3 space-y-2 no-scrollbar">
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
                className="group relative bg-accent/30 hover:bg-accent/50 p-3 rounded-2xl border border-transparent hover:border-primary/20 transition-all"
              >
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex-shrink-0 shadow-sm border border-border/20">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm leading-tight truncate pr-2">
                        {item.name}
                      </h4>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-primary font-bold text-sm">
                        Rp {item.price.toLocaleString('id-ID')}
                      </p>
                      
                      <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border/30 shadow-sm">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground transition-all active:scale-90"
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className="w-7 text-center font-black text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground transition-all active:scale-90"
                        >
                          <Plus size={12} strokeWidth={3} />
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
      <div className="p-4 lg:p-5 bg-accent/20 border-t border-border/40 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs font-semibold text-muted-foreground space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span>Subtotal</span>
              <span className="text-foreground">Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span>Pajak</span>
                <span className="px-1.5 py-0.5 rounded-md bg-accent text-[10px] font-bold">11%</span>
              </div>
              <span className="text-foreground">Rp {tax.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total</div>
            <div className="font-black text-xl lg:text-2xl text-primary tracking-tighter">
              Rp {total.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={saveHold}
            disabled={cart.length === 0}
            className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-background border border-border/40 hover:bg-accent hover:border-primary/30 transition-all font-black text-[11px] uppercase tracking-widest active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <PauseCircle size={18} className="text-amber-500" />
            Simpan
          </button>
          <button
            onClick={openPreviewReceipt}
            disabled={cart.length === 0}
            className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-background border border-border/40 hover:bg-accent hover:border-primary/30 transition-all font-black text-[11px] uppercase tracking-widest active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ReceiptText size={18} className="text-primary" />
            Cetak
          </button>
        </div>

        <button 
          disabled={cart.length === 0}
          onClick={() => setIsPaymentOpen(true)}
          className={cn(
            "w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base lg:text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100",
            "relative overflow-hidden group"
          )}
        >
          <CreditCard size={20} strokeWidth={2.5} />
          BAYAR
          
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

      <AnimatePresence>
        {isReceiptOpen && receiptData && (
          <ReceiptModal
            isOpen={isReceiptOpen}
            onClose={() => setIsReceiptOpen(false)}
            transactionData={receiptData}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHoldListOpen && (
          <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHoldListOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-card rounded-[2.5rem] shadow-2xl overflow-hidden border border-border/40"
            >
              <div className="p-6 border-b border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Keranjang Tersimpan</p>
                  <p className="text-lg font-black tracking-tight">Pilih untuk dilanjutkan</p>
                </div>
                <button
                  onClick={() => setIsHoldListOpen(false)}
                  className="p-2 rounded-xl hover:bg-accent transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar">
                {(holds as any[])?.length ? (
                  (holds as any[]).map((h: any) => (
                    <button
                      key={h.id}
                      onClick={() => restoreHoldToCart(String(h.id))}
                      className="w-full text-left p-4 rounded-2xl bg-accent/20 hover:bg-accent/40 transition-all border border-border/30"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">#{h.id}</div>
                          <div className="text-sm font-black truncate">{h.status === 'hold' ? 'Tersimpan' : h.status}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total</div>
                          <div className="font-black text-primary">
                            Rp {Number(h.total || 0).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-6 rounded-2xl bg-accent/20 text-center text-sm font-bold text-muted-foreground">
                    Belum ada keranjang tersimpan.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCustomerModalOpen && (
          <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCustomerModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-card rounded-[2.5rem] shadow-2xl overflow-hidden border border-border/40"
            >
              <div className="p-6 border-b border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Pilih Member</p>
                  <p className="text-lg font-black tracking-tight">Pilih customer untuk transaksi</p>
                </div>
                <button
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-accent transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar">
                {/* Option for no customer */}
                <button
                  onClick={() => {
                    setSelectedCustomer(null)
                    setIsCustomerModalOpen(false)
                  }}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border-2 transition-all",
                    !selectedCustomer 
                      ? "border-primary bg-primary/5" 
                      : "border-border/30 bg-accent/20 hover:bg-accent/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/50 text-muted-foreground flex items-center justify-center">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="font-bold">Umum</p>
                      <p className="text-xs text-muted-foreground">Tidak memilih member</p>
                    </div>
                  </div>
                </button>

                {(customers as Customer[])?.length ? (
                  (customers as Customer[]).map((c: Customer) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomer(c)
                        setIsCustomerModalOpen(false)
                      }}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border-2 transition-all",
                        selectedCustomer?.id === c.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border/30 bg-accent/20 hover:bg-accent/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <User size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{c.name}</p>
                          {c.phone && (
                            <p className="text-xs text-muted-foreground">{c.phone}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-6 rounded-2xl bg-accent/20 text-center text-sm font-bold text-muted-foreground">
                    Belum ada member. Tambahkan member di halaman Customers.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
