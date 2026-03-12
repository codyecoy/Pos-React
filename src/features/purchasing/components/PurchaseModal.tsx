import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Package, 
  Truck,
  ShoppingCart,
  Search,
  ArrowRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { Supplier, PurchaseOrder, PurchaseItem, Product } from '@/types'
import { cn } from '@/lib/utils'

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (purchase: Partial<PurchaseOrder>) => void
  suppliers: Supplier[]
  products: Product[]
}

export default function PurchaseModal({ isOpen, onClose, onSave, suppliers, products }: PurchaseModalProps) {
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return []
    const q = searchQuery.toLowerCase()
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.includes(q))
    ).slice(0, 5)
  }, [searchQuery, products])

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0)
  }, [items])

  const handleAddItem = (product: Product) => {
    const existing = items.find(i => i.productId === product.id)
    if (existing) {
      setItems(items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setItems([...items, { 
        productId: product.id, 
        name: product.name, 
        quantity: 1, 
        costPrice: product.costPrice || 0 
      }])
    }
    setSearchQuery('')
  }

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId))
  }

  const handleUpdateItem = (productId: string, updates: Partial<PurchaseItem>) => {
    setItems(items.map(i => i.productId === productId ? { ...i, ...updates } : i))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplierId || items.length === 0) return
    
    const supplier = suppliers.find(s => s.id === selectedSupplierId)
    onSave({
      supplierId: selectedSupplierId,
      supplierName: supplier?.name || '',
      items,
      total: subtotal,
      status: 'Received',
      timestamp: new Date()
    })
  }

  if (!isOpen) return null

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
        className="relative w-full max-w-5xl bg-card rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh]"
      >
        {/* Left: Items List */}
        <div className="flex-1 flex flex-col p-8 lg:p-12 overflow-hidden bg-accent/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-2xl tracking-tight uppercase flex items-center gap-3">
              <ShoppingCart className="text-primary" />
              Item Pembelian
            </h3>
          </div>

          <div className="relative mb-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary" />
              <input 
                type="text" 
                placeholder="Cari produk untuk ditambah ke daftar..." 
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl p-2 z-10">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddItem(p)}
                    className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-xl transition-all"
                  >
                    <div className="text-left">
                      <p className="font-bold text-sm">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{p.sku}</p>
                    </div>
                    <Plus size={16} className="text-primary" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale">
                <Package size={64} strokeWidth={1} />
                <p className="mt-4 font-black text-sm uppercase tracking-widest">Daftar Item Kosong</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/20 shadow-sm group">
                  <div className="flex-1">
                    <p className="font-bold text-sm">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-muted-foreground uppercase">Harga Beli:</span>
                      <input 
                        type="number"
                        className="w-24 h-7 px-2 rounded-lg bg-accent/50 border-none text-[10px] font-black focus:ring-1 focus:ring-primary/40"
                        value={item.costPrice}
                        onChange={(e) => handleUpdateItem(item.productId, { costPrice: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-accent/30 p-1.5 rounded-xl">
                    <button 
                      onClick={() => handleUpdateItem(item.productId, { quantity: Math.max(1, item.quantity - 1) })}
                      className="w-8 h-8 rounded-lg bg-card flex items-center justify-center hover:text-primary transition-all active:scale-90"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => handleUpdateItem(item.productId, { quantity: item.quantity + 1 })}
                      className="w-8 h-8 rounded-lg bg-card flex items-center justify-center hover:text-primary transition-all active:scale-90"
                    >
                      +
                    </button>
                  </div>

                  <button 
                    onClick={() => handleRemoveItem(item.productId)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Summary & Supplier */}
        <div className="w-full md:w-[380px] bg-card p-8 lg:p-12 border-l border-border/40 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-xl tracking-tight uppercase">Ringkasan</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-all">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Pilih Supplier</label>
              <div className="relative group">
                <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <select 
                  required
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold appearance-none cursor-pointer"
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                >
                  <option value="">-- Pilih Supplier --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-border/40 mt-auto">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-muted-foreground">Total Item</span>
                <span className="font-black">{items.length} Macam</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-muted-foreground">Total Qty</span>
                <span className="font-black">{items.reduce((acc, i) => acc + i.quantity, 0)} Pcs</span>
              </div>
              <div className="pt-4 border-t border-dashed border-border/40">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Total Biaya Pembelian</p>
                <h4 className="text-3xl font-black text-primary tracking-tighter">
                  Rp {subtotal.toLocaleString('id-ID')}
                </h4>
              </div>
            </div>

            <button 
              type="submit"
              disabled={!selectedSupplierId || items.length === 0}
              className={cn(
                "w-full py-6 rounded-[2.5rem] font-black text-lg flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl",
                selectedSupplierId && items.length > 0 
                  ? "bg-primary text-primary-foreground shadow-primary/30" 
                  : "bg-muted text-muted-foreground grayscale cursor-not-allowed"
              )}
            >
              SIMPAN PEMBELIAN
              <ArrowRight size={22} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
