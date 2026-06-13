import { useMemo, useState } from 'react'
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
import { addDays, format, startOfMonth, endOfMonth } from 'date-fns'
import { id } from 'date-fns/locale'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { createId } from '@/lib/ids'

export default function DebtsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const purchases = useLiveQuery(async () => {
    const rows = await db.purchase_orders.toArray()
    return rows.filter((p: any) => !p?.deletedAt)
  }, [], [])

  const payments = useLiveQuery(async () => {
    const rows = await db.purchase_payments.toArray()
    return rows.filter((p: any) => !p?.deletedAt)
  }, [], [])

  const handlePayDebt = (debt: Debt) => {
    setSelectedDebt(debt)
    setIsModalOpen(true)
  }

  const handleSavePayment = (payment: { amount: number, method: string }) => {
    if (!selectedDebt) return
    void (async () => {
      const t = new Date()
      const supplierId = selectedDebt.supplierId
      let remainingPay = Number(payment.amount || 0)
      if (remainingPay <= 0) return

      const supplierPurchases = (purchases as any[])
        .filter((p) => String(p.supplierId || '') === String(supplierId) && String(p.status || '') !== 'Paid')
        .sort((a, b) => {
          const ta = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime()
          const tb = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime()
          return ta - tb
        })

      const paidByPurchase = new Map<string, number>()
      for (const pay of payments as any[]) {
        const pid = String(pay.purchaseId || '')
        if (!pid) continue
        paidByPurchase.set(pid, (paidByPurchase.get(pid) || 0) + Number(pay.amount || 0))
      }

      await db.transaction('rw', db.purchase_orders, db.purchase_payments, async () => {
        for (const po of supplierPurchases) {
          if (remainingPay <= 0) break
          const poId = String(po.id)
          const total = Number(po.total || 0)
          const alreadyPaid = paidByPurchase.get(poId) || 0
          const poRemaining = Math.max(0, total - alreadyPaid)
          if (poRemaining <= 0) continue

          const payAmount = Math.min(poRemaining, remainingPay)
          remainingPay -= payAmount
          paidByPurchase.set(poId, alreadyPaid + payAmount)

          await db.purchase_payments.add({
            id: createId(),
            purchaseId: poId,
            supplierId: String(po.supplierId || supplierId),
            amount: payAmount,
            method: String(payment.method || 'cash'),
            timestamp: t,
            createdAt: t,
            updatedAt: t,
            deletedAt: null,
            syncStatus: 'pending',
            syncVersion: 1,
          } as any)

          const nextPaid = alreadyPaid + payAmount
          if (nextPaid >= total && String(po.status || '') !== 'Paid') {
            await db.purchase_orders.put({
              ...(po as any),
              status: 'Paid',
              updatedAt: t,
            })
          }
        }
      })

      toast.success(`Pembayaran Rp ${payment.amount.toLocaleString('id-ID')} berhasil dicatat!`)
      setIsModalOpen(false)
    })()
  }

  const debts = useMemo(() => {
    const paidByPurchase = new Map<string, number>()
    for (const pay of payments as any[]) {
      const pid = String(pay.purchaseId || '')
      if (!pid) continue
      paidByPurchase.set(pid, (paidByPurchase.get(pid) || 0) + Number(pay.amount || 0))
    }

    const bySupplier = new Map<string, { supplierName: string; total: number; remaining: number; earliestUnpaid: Date | null }>()
    for (const po of purchases as any[]) {
      const status = String(po.status || '')
      if (status !== 'Received' && status !== 'Paid') continue

      const supplierId = String(po.supplierId || '')
      if (!supplierId) continue
      const supplierName = String(po.supplierName || 'Supplier')
      const total = Number(po.total || 0)
      const paid = paidByPurchase.get(String(po.id)) || 0
      const remain = Math.max(0, total - paid)
      const ts = po.timestamp instanceof Date ? po.timestamp : new Date(po.timestamp)

      const current = bySupplier.get(supplierId) || { supplierName, total: 0, remaining: 0, earliestUnpaid: null as Date | null }
      current.total += total
      current.remaining += remain
      if (remain > 0) {
        if (!current.earliestUnpaid || ts.getTime() < current.earliestUnpaid.getTime()) current.earliestUnpaid = ts
      }
      bySupplier.set(supplierId, current)
    }

    const list: Debt[] = []
    for (const [supplierId, v] of bySupplier.entries()) {
      const status: Debt['status'] = v.remaining <= 0 ? 'Lunas' : 'Belum Lunas'
      const dueBase = v.earliestUnpaid || new Date()
      list.push({
        id: supplierId,
        supplierId,
        supplierName: v.supplierName,
        total: Math.round(v.total),
        remaining: Math.round(v.remaining),
        dueDate: addDays(dueBase, 14),
        status,
        history: [],
      })
    }
    list.sort((a, b) => b.remaining - a.remaining)
    return list
  }, [purchases, payments])

  const filteredDebts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return debts
    return debts.filter((d) => d.supplierName.toLowerCase().includes(q))
  }, [debts, searchQuery])

  const total = filteredDebts.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, total)
  const paged = useMemo(() => filteredDebts.slice(startIndex, endIndex), [filteredDebts, startIndex, endIndex])

  const totalDebt = debts.reduce((acc, d) => acc + d.remaining, 0)
  const overdueDebt = debts.filter(d => d.remaining > 0 && d.dueDate < new Date()).reduce((acc, d) => acc + d.remaining, 0)

  const paidInvoicesThisMonth = useMemo(() => {
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)

    const paidByPurchase = new Map<string, number>()
    for (const pay of payments as any[]) {
      const pid = String(pay.purchaseId || '')
      if (!pid) continue
      paidByPurchase.set(pid, (paidByPurchase.get(pid) || 0) + Number(pay.amount || 0))
    }

    let count = 0
    for (const po of purchases as any[]) {
      const status = String(po.status || '')
      if (status !== 'Paid') continue
      const ts = po.updatedAt instanceof Date ? po.updatedAt : new Date(po.updatedAt || po.timestamp)
      if (ts.getTime() < start.getTime() || ts.getTime() > end.getTime()) continue

      const total = Number(po.total || 0)
      const paid = paidByPurchase.get(String(po.id)) || 0
      if (paid >= total) count += 1
    }
    return count
  }, [purchases, payments])

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
            <h3 className="text-2xl font-black tracking-tight text-emerald-500">{paidInvoicesThisMonth.toLocaleString('id-ID')} Faktur</h3>
            <div className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={12} />
              Bulan ini
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
                <th className="pb-4 pl-6">Supplier</th>
                <th className="pb-4">Jatuh Tempo</th>
                <th className="pb-4">Total Hutang</th>
                <th className="pb-4">Sisa Tagihan</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((debt) => (
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

        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Menampilkan <span className="text-foreground">{total === 0 ? 0 : startIndex + 1}-{endIndex}</span> dari <span className="text-foreground">{total}</span> supplier
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2.5 rounded-xl bg-accent text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30"
              disabled={safePage <= 1}
            >
              <ChevronRight size={20} className="rotate-180" />
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
