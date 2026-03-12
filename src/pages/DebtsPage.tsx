import { useState } from 'react'
import { 
  CreditCard as DebtIcon, 
  Search, 
  Filter, 
  ChevronRight,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  History,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import DebtPaymentModal from '@/features/debts/components/DebtPaymentModal'
import { Debt } from '@/types'
import { toast } from 'sonner'
import { AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

// Mock Data
const MOCK_DEBTS: Debt[] = [
  { id: 'D1', supplierId: 'S1', supplierName: 'PT. Sumber Makmur', total: 5000000, remaining: 2500000, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), status: 'Sebagian', history: [] },
  { id: 'D2', supplierId: 'S2', supplierName: 'CV. Tirta Segar', total: 1200000, remaining: 1200000, dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), status: 'Belum Lunas', history: [] },
  { id: 'D3', supplierId: 'S3', supplierName: 'Indo Snack Distribution', total: 850000, remaining: 0, dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), status: 'Lunas', history: [] },
]

export default function DebtsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [debts, setDebts] = useState(MOCK_DEBTS)
  const [searchQuery, setSearchQuery] = useState('')

  const handlePayDebt = (debt: Debt) => {
    setSelectedDebt(debt)
    setIsModalOpen(true)
  }

  const handleSavePayment = (payment: { amount: number, method: string }) => {
    if (!selectedDebt) return
    
    setDebts(debts.map(d => {
      if (d.id === selectedDebt.id) {
        const newRemaining = d.remaining - payment.amount
        return {
          ...d,
          remaining: newRemaining,
          status: newRemaining === 0 ? 'Lunas' : 'Sebagian'
        }
      }
      return d
    }))
    
    toast.success(`Pembayaran Rp ${payment.amount.toLocaleString('id-ID')} berhasil dicatat!`)
    setIsModalOpen(false)
  }

  const filteredDebts = debts.filter(d => 
    d.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalDebt = debts.reduce((acc, d) => acc + d.remaining, 0)
  const overdueDebt = debts.filter(d => d.remaining > 0 && d.dueDate < new Date()).reduce((acc, d) => acc + d.remaining, 0)

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase flex items-center gap-4">
            <DebtIcon className="text-primary w-10 h-10 lg:w-12 lg:h-12" />
            Hutang ke Supplier
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Lacak kewajiban pembayaran dan jatuh tempo supplier.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-[2rem] border border-border/40 shadow-sm">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Sisa Hutang</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black tracking-tight text-primary">Rp {totalDebt.toLocaleString('id-ID')}</h3>
            <div className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-primary/10 text-primary">
              <History size={12} />
              Semua Cabang
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-[2rem] border border-border/40 shadow-sm border-l-4 border-l-destructive">
          <p className="text-xs font-black text-destructive uppercase tracking-widest">Melewati Jatuh Tempo</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black tracking-tight text-destructive">Rp {overdueDebt.toLocaleString('id-ID')}</h3>
            <div className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-destructive/10 text-destructive animate-pulse">
              <AlertCircle size={12} />
              Segera Bayar
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-[2rem] border border-border/40 shadow-sm">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Hutang Lunas (Bulan Ini)</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black tracking-tight text-emerald-500">8 Faktur</h3>
            <div className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={12} />
              +3 dari kemarin
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card p-4 lg:p-6 rounded-[2.5rem] border border-border/40 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Cari nama supplier..." 
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                <th className="pb-4 pl-6">Supplier</th>
                <th className="pb-4">Jatuh Tempo</th>
                <th className="pb-4">Total Hutang</th>
                <th className="pb-4">Sisa Tagihan</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredDebts.map((debt) => (
                <tr key={debt.id} className="group bg-background hover:bg-accent/20 transition-all rounded-2xl shadow-sm border border-border/20">
                  <td className="py-4 pl-6 rounded-l-[1.5rem] border-y border-l border-border/20">
                    <span className="font-bold text-sm group-hover:text-primary transition-colors">{debt.supplierName}</span>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <div className={cn(
                      "flex items-center gap-2 text-xs font-bold",
                      debt.remaining > 0 && debt.dueDate < new Date() ? "text-destructive" : "text-muted-foreground"
                    )}>
                      <Calendar size={12} />
                      {format(debt.dueDate, 'dd MMM yyyy', { locale: id })}
                    </div>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className="font-bold text-sm">Rp {debt.total.toLocaleString('id-ID')}</span>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className="font-black text-sm text-primary">Rp {debt.remaining.toLocaleString('id-ID')}</span>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      debt.status === 'Lunas' ? "bg-emerald-500/10 text-emerald-500" : 
                      debt.status === 'Sebagian' ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {debt.status}
                    </span>
                  </td>
                  <td className="py-4 pr-6 rounded-r-[1.5rem] border-y border-r border-border/20 text-right">
                    {debt.remaining > 0 ? (
                      <button 
                        onClick={() => handlePayDebt(debt)}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                      >
                        BAYAR
                      </button>
                    ) : (
                      <span className="text-xs font-black text-emerald-500 uppercase tracking-widest pr-4 flex items-center justify-end gap-2">
                        <CheckCircle2 size={14} />
                        Lunas
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <DebtPaymentModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSavePayment}
            debt={selectedDebt}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
