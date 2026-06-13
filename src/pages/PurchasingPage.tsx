import { useMemo, useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  ShoppingCart,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Truck,
  Package,
  ArrowUpRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import PurchaseModal from '@/features/purchasing/components/PurchaseModal'
import { PurchaseOrder } from '@/types'
import { createId } from '@/lib/ids'
import { toast } from 'sonner'
import { AnimatePresence } from 'framer-motion'
import { endOfMonth, format, startOfDay, startOfMonth, subDays } from 'date-fns'
import { id } from 'date-fns/locale'
import { useInventoryStore } from '@/store/useInventoryStore'

export default function PurchasingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  
  const { products, suppliers, purchases, addPurchase } = useInventoryStore()

  const stats = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const weekStart = startOfDay(subDays(now, 6))

    const monthPurchases = purchases.filter((p) => {
      const ts = p.timestamp instanceof Date ? p.timestamp : new Date(p.timestamp as any)
      return ts.getTime() >= monthStart.getTime() && ts.getTime() <= monthEnd.getTime()
    })

    const totalMonth = monthPurchases.reduce((sum, p) => sum + Number(p.total || 0), 0)

    const weekReceived = purchases.filter((p) => {
      const ts = p.timestamp instanceof Date ? p.timestamp : new Date(p.timestamp as any)
      if (ts.getTime() < weekStart.getTime()) return false
      return p.status === 'Received' || p.status === 'Paid'
    })

    const itemsWeek = weekReceived.reduce((sum, p) => {
      const items = Array.isArray(p.items) ? p.items : []
      return sum + items.reduce((s, it) => s + Number(it.quantity || 0), 0)
    }, 0)

    const activeSuppliers = suppliers.length

    return {
      totalMonth,
      poCountMonth: monthPurchases.length,
      itemsWeek,
      activeSuppliers,
    }
  }, [purchases, suppliers])

  const formatRp = (n: number) => `Rp ${Math.round(Number(n || 0)).toLocaleString('id-ID')}`

  const handleAddPurchase = () => {
    setIsModalOpen(true)
  }

  const handleSavePurchase = (formData: Partial<PurchaseOrder>) => {
    const newPurchase = {
      ...formData,
      id: `PO-${createId().slice(0, 8).toUpperCase()}`,
    } as PurchaseOrder
    addPurchase(newPurchase)
    toast.success('Pembelian berhasil disimpan dan stok telah diperbarui!')
    setIsModalOpen(false)
  }

  const filteredPurchases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return purchases
    return purchases.filter((p) =>
      p.id.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q)
    )
  }, [purchases, searchQuery])

  const total = filteredPurchases.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, total)
  const paged = useMemo(() => filteredPurchases.slice(startIndex, endIndex), [filteredPurchases, startIndex, endIndex])

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase flex items-center gap-4">
            <ShoppingCart className="text-primary w-10 h-10 lg:w-12 lg:h-12" />
            Pembelian (Restock)
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Kelola stok masuk dan pesanan ke supplier.</p>
        </div>
        
        <button 
          onClick={handleAddPurchase}
          className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={22} strokeWidth={3} />
          BUAT PEMBELIAN
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-[2rem] border border-border/40 shadow-sm">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Pembelian (Bulan Ini)</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black tracking-tight">{formatRp(stats.totalMonth)}</h3>
            <div className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
              <ArrowUpRight size={12} />
              {stats.poCountMonth} PO
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-[2rem] border border-border/40 shadow-sm">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Item Diterima</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black tracking-tight">{stats.itemsWeek.toLocaleString('id-ID')} Pcs</h3>
            <span className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">Minggu Ini</span>
          </div>
        </div>
        <div className="bg-card p-6 rounded-[2rem] border border-border/40 shadow-sm">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Supplier Aktif</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black tracking-tight">{stats.activeSuppliers.toLocaleString('id-ID')} Mitra</h3>
            <span className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">Terdaftar</span>
          </div>
        </div>
      </div>

      <div className="bg-card p-4 lg:p-6 rounded-[2.5rem] border border-border/40 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Cari ID PO atau nama supplier..." 
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
            />
          </div>
          
          <button className="flex items-center gap-2 px-5 py-4 rounded-2xl bg-accent/30 border border-border/40 font-bold text-sm hover:bg-accent transition-all w-full md:w-auto justify-center">
            <Filter size={18} />
            Semua Status
          </button>
        </div>

        <div className="overflow-x-auto -mx-4 lg:-mx-6 px-4 lg:px-6 no-scrollbar">
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-black text-muted-foreground uppercase tracking-widest">
                <th className="pb-4 pl-6">ID Pembelian</th>
                <th className="pb-4">Tanggal</th>
                <th className="pb-4">Supplier</th>
                <th className="pb-4">Total Biaya</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 pr-6 text-right">Detail</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((po) => (
                <tr key={po.id} className="group bg-background hover:bg-accent/20 transition-all rounded-2xl shadow-sm border border-border/20">
                  <td className="py-4 pl-6 rounded-l-[1.5rem] border-y border-l border-border/20">
                    <span className="font-black text-sm">{po.id}</span>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className="text-xs font-bold text-muted-foreground">{format(po.timestamp, 'dd MMM yyyy', { locale: id })}</span>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                        <Truck size={14} className="text-primary" />
                      </div>
                      <span className="font-bold text-sm">{po.supplierName}</span>
                    </div>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className="font-black text-sm">Rp {po.total.toLocaleString('id-ID')}</span>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      po.status === 'Received' ? "bg-emerald-500/10 text-emerald-500" : 
                      po.status === 'Paid' ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {po.status}
                    </span>
                  </td>
                  <td className="py-4 pr-6 rounded-r-[1.5rem] border-y border-r border-border/20 text-right">
                    <button className="p-2.5 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Menampilkan <span className="text-foreground">{total === 0 ? 0 : startIndex + 1}-{endIndex}</span> dari <span className="text-foreground">{total}</span> PO
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2.5 rounded-xl bg-accent text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30"
              disabled={safePage <= 1}
            >
              <ChevronLeft size={20} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, safePage - 2), Math.max(0, safePage - 2) + 3)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-10 h-10 rounded-xl font-bold text-sm transition-all",
                    p === safePage ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2.5 rounded-xl bg-accent text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30"
              disabled={safePage >= totalPages}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <PurchaseModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSavePurchase}
            suppliers={suppliers}
            products={products}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
