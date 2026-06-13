import { useMemo, useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronLeft,
  Search,
  FileText,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { jsPDF } from 'jspdf'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { db } from '@/lib/db'
import type { CartItem, PaymentMethod } from '@/types'
import ReceiptModal from '@/features/cashier/components/ReceiptModal'

function formatRp(n: number) {
  return `Rp ${Math.round(Number(n || 0)).toLocaleString('id-ID')}`
}

function pct(current: number, prev: number) {
  const c = Number(current || 0)
  const p = Number(prev || 0)
  if (p === 0) return c === 0 ? 0 : 100
  return ((c - p) / p) * 100
}

function toDateSafe(v: any) {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v
  if (typeof v === 'number') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof v === 'string') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function paymentLabel(method?: PaymentMethod) {
  if (method === 'cash') return 'Tunai'
  if (method === 'debit') return 'Debit'
  if (method === 'transfer') return 'Transfer'
  if (method === 'qris') return 'QRIS'
  if (method === 'e-wallet') return 'E-Wallet'
  return method ? String(method) : '-'
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d'>('7d')
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false)
  const [historyScope, setHistoryScope] = useState<'period' | 'all'>('period')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const pageSize = 10

  const { start, end, days } = useMemo(() => {
    const now = new Date()
    if (period === 'today') return { start: startOfDay(now), end: endOfDay(now), days: 1 }
    if (period === '30d') return { start: startOfDay(subDays(now, 29)), end: endOfDay(now), days: 30 }
    return { start: startOfDay(subDays(now, 6)), end: endOfDay(now), days: 7 }
  }, [period])

  const { prevStart, prevEnd } = useMemo(() => {
    const prevEnd = endOfDay(subDays(end, days))
    const prevStart = startOfDay(subDays(start, days))
    return { prevStart, prevEnd }
  }, [start, end, days])

  const current = useLiveQuery(async () => {
    const allTxs = await db.transactions.toArray()

    const periodTxs = allTxs.filter((t: any) => {
      const d = toDateSafe(t?.timestamp)
      if (!d) return false
      return d.getTime() >= start.getTime() && d.getTime() <= end.getTime()
    })

    const prevPeriodTxs = allTxs.filter((t: any) => {
      const d = toDateSafe(t?.timestamp)
      if (!d) return false
      return d.getTime() >= prevStart.getTime() && d.getTime() <= prevEnd.getTime()
    })

    const historyTxs = historyScope === 'all' ? allTxs : periodTxs
    const ids = historyTxs.map((t: any) => String(t.id)).filter(Boolean)
    const items = ids.length > 0 ? await db.transaction_items.where('transactionId').anyOf(ids).toArray() : []
    const customers = await db.customers.toArray()
    return { periodTxs, prevPeriodTxs, historyTxs, items, customers }
  }, [start.getTime(), end.getTime(), prevStart.getTime(), prevEnd.getTime(), historyScope], {
    periodTxs: [],
    prevPeriodTxs: [],
    historyTxs: [],
    items: [],
    customers: [],
  })

  const byCustomerId = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of current.customers as any[]) {
      if (!c?.id) continue
      map.set(String(c.id), String(c.name || ''))
    }
    return map
  }, [current.customers])

  const itemQtyByTx = useMemo(() => {
    const map = new Map<string, number>()
    for (const it of current.items as any[]) {
      const txId = String(it.transactionId || '')
      if (!txId) continue
      map.set(txId, (map.get(txId) || 0) + Number(it.quantity || 0))
    }
    return map
  }, [current.items])

  const periodTxRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const rows = (current.periodTxs as any[]).map((t) => {
      const customerName = t.customerId ? (byCustomerId.get(String(t.customerId)) || 'Umum') : 'Umum'
      const method = t.paymentMethod as PaymentMethod | undefined
      const status = String(t.status || '')
      const total = Number(t.total || 0)
      const timestamp = toDateSafe(t.timestamp) || new Date(0)
      const qty = itemQtyByTx.get(String(t.id)) || 0
      return { ...t, customerName, method, methodLabel: paymentLabel(method), status, total, timestamp, qty }
    })

    const filtered = !q
      ? rows
      : rows.filter((r) => {
          const idText = String(r.id || '').toLowerCase()
          const customerText = String(r.customerName || '').toLowerCase()
          const methodText = String(r.methodLabel || '').toLowerCase()
          return idText.includes(q) || customerText.includes(q) || methodText.includes(q)
        })

    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return filtered
  }, [current.periodTxs, byCustomerId, itemQtyByTx, searchQuery])

  const historyTxRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const rows = (current.historyTxs as any[]).map((t) => {
      const customerName = t.customerId ? (byCustomerId.get(String(t.customerId)) || 'Umum') : 'Umum'
      const method = t.paymentMethod as PaymentMethod | undefined
      const status = String(t.status || '')
      const total = Number(t.total || 0)
      const timestamp = toDateSafe(t.timestamp) || new Date(0)
      const qty = itemQtyByTx.get(String(t.id)) || 0
      return { ...t, customerName, method, methodLabel: paymentLabel(method), status, total, timestamp, qty }
    })

    const filtered = !q
      ? rows
      : rows.filter((r) => {
          const idText = String(r.id || '').toLowerCase()
          const customerText = String(r.customerName || '').toLowerCase()
          const methodText = String(r.methodLabel || '').toLowerCase()
          return idText.includes(q) || customerText.includes(q) || methodText.includes(q)
        })

    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return filtered
  }, [current.historyTxs, byCustomerId, itemQtyByTx, searchQuery])

  const prevSales = useMemo(
    () => (current.prevPeriodTxs as any[]).reduce((sum, t) => sum + Number((t as any).total || 0), 0),
    [current.prevPeriodTxs]
  )
  const currentSales = useMemo(
    () => periodTxRows.reduce((sum, t: any) => sum + Number(t.total || 0), 0),
    [periodTxRows]
  )
  const salesChange = useMemo(() => pct(currentSales, prevSales), [currentSales, prevSales])

  const currentTxCount = periodTxRows.length
  const prevTxCount = (current.prevPeriodTxs as any[]).length
  const txChange = useMemo(() => pct(currentTxCount, prevTxCount), [currentTxCount, prevTxCount])

  const avgBasket = useMemo(() => (currentTxCount === 0 ? 0 : currentSales / currentTxCount), [currentSales, currentTxCount])
  const prevAvgBasket = useMemo(() => (prevTxCount === 0 ? 0 : prevSales / prevTxCount), [prevSales, prevTxCount])
  const avgChange = useMemo(() => pct(avgBasket, prevAvgBasket), [avgBasket, prevAvgBasket])

  const chartData = useMemo(() => {
    const buckets: { key: string; date: string; total: number }[] = []
    for (let i = 0; i < days; i++) {
      const d = startOfDay(subDays(end, days - 1 - i))
      const key = format(d, 'yyyy-MM-dd')
      buckets.push({ key, date: format(d, 'dd MMM', { locale: idLocale }), total: 0 })
    }
    const byKey = new Map(buckets.map((b) => [b.key, b]))
    for (const t of periodTxRows as any[]) {
      const key = format(t.timestamp, 'yyyy-MM-dd')
      const b = byKey.get(key)
      if (!b) continue
      b.total += Number(t.total || 0)
    }
    return buckets.map((b) => ({ date: b.date, total: Math.round(b.total) }))
  }, [periodTxRows, days, end])

  const paymentBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of periodTxRows as any[]) {
      const m = paymentLabel(t.method)
      counts.set(m, (counts.get(m) || 0) + 1)
    }
    const denom = periodTxRows.length || 1
    return [...counts.entries()]
      .map(([label, count]) => ({
        label,
        count,
        pct: Math.round((count / denom) * 100),
      }))
      .sort((a, b) => b.count - a.count)
  }, [periodTxRows])

  const periodLabel = period === 'today' ? 'Hari Ini' : period === '30d' ? '30 Hari Terakhir' : '7 Hari Terakhir'

  const exportCsv = () => {
    const headers = ['id', 'timestamp', 'customer', 'method', 'status', 'items_qty', 'subtotal', 'tax', 'total', 'amountPaid', 'change']
    const lines = [headers.join(',')]
    for (const t of historyTxRows as any[]) {
      const row = [
        String(t.id || ''),
        t.timestamp ? new Date(t.timestamp).toISOString() : '',
        `"${String(t.customerName || '').replace(/"/g, '""')}"`,
        String(t.methodLabel || ''),
        String(t.status || ''),
        String(t.qty || 0),
        String(Number(t.subtotal || 0)),
        String(Number(t.tax || 0)),
        String(Number(t.total || 0)),
        String(Number(t.amountPaid || 0)),
        String(Number(t.change || 0)),
      ]
      lines.push(row.join(','))
    }
    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Laporan-Transaksi-${format(start, 'yyyyMMdd')}-${format(end, 'yyyyMMdd')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('Export CSV berhasil.')
  }

  const exportPdf = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const marginX = 12
    let y = 14

    const write = (text: string, opts?: { bold?: boolean; size?: number }) => {
      doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
      doc.setFontSize(opts?.size ?? 11)
      const lines = doc.splitTextToSize(text, 210 - marginX * 2)
      doc.text(lines, marginX, y)
      y += lines.length * 6
    }

    write('Laporan Penjualan', { bold: true, size: 16 })
    write(
      `${periodLabel} (${format(start, 'dd MMM yyyy', { locale: idLocale })} - ${format(end, 'dd MMM yyyy', { locale: idLocale })})`,
      { size: 10 }
    )
    y += 2
    doc.setDrawColor(200)
    doc.line(marginX, y, 210 - marginX, y)
    y += 8

    write(`Total Omzet: ${formatRp(currentSales)}`, { bold: true })
    write(`Total Transaksi: ${currentTxCount.toLocaleString('id-ID')}`)
    write(`Rata-rata Keranjang: ${formatRp(avgBasket)}`)
    y += 4

    write('Riwayat Transaksi:', { bold: true })
    for (const t of historyTxRows.slice(0, 200) as any[]) {
      const line = `${String(t.id)} | ${format(t.timestamp, 'dd MMM HH:mm', { locale: idLocale })} | ${t.customerName} | ${t.methodLabel} | ${formatRp(t.total)}`
      write(line, { size: 9 })
      if (y > 280) {
        doc.addPage()
        y = 14
      }
    }

    doc.save(`Laporan-Transaksi-${format(start, 'yyyyMMdd')}-${format(end, 'yyyyMMdd')}.pdf`)
    toast.success('Export PDF berhasil.')
  }

  const total = historyTxRows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, total)
  const pagedTransactions = useMemo(() => historyTxRows.slice(startIndex, endIndex), [historyTxRows, startIndex, endIndex])

  const openReceipt = async (transactionId: string) => {
    const header = await db.transactions.get(transactionId)
    if (!header) return
    const items = await db.transaction_items.where('transactionId').equals(transactionId).toArray()

    const cartItems: CartItem[] = (items as any[]).map((it) => ({
      id: String(it.productId || it.id),
      name: String(it.name || ''),
      price: Number(it.price || 0),
      costPrice: 0,
      stock: 0,
      category: String(it.category || ''),
      image: '',
      barcode: String(it.barcode || ''),
      sku: String(it.sku || ''),
      status: 'Aktif',
      quantity: Number(it.quantity || 0),
      discount: Number(it.discount || 0),
      note: it.note,
    }))

    setReceiptData({
      id: header.id,
      items: cartItems,
      subtotal: Number((header as any).subtotal || 0),
      tax: Number((header as any).tax || 0),
      discountTotal: Number((header as any).discountTotal || 0),
      total: Number((header as any).total || 0),
      amountPaid: Number((header as any).amountPaid || 0),
      change: Number((header as any).change || 0),
      method: (header as any).paymentMethod as PaymentMethod,
      timestamp: (header as any).timestamp instanceof Date ? (header as any).timestamp : new Date((header as any).timestamp),
    })
    setReceiptOpen(true)
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase flex items-center gap-4">
            <BarChart3 className="text-primary w-10 h-10 lg:w-12 lg:h-12" />
            Laporan Penjualan
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Analisis performa bisnis dan transaksi Anda.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-accent/30 p-1.5 rounded-2xl border border-border/40">
            <button
              onClick={exportPdf}
              className="p-2.5 rounded-xl text-muted-foreground hover:bg-white hover:text-destructive hover:shadow-sm transition-all"
              title="Export PDF"
            >
              <FileText size={20} />
            </button>
            <button
              onClick={exportCsv}
              className="p-2.5 rounded-xl text-muted-foreground hover:bg-white hover:text-emerald-600 hover:shadow-sm transition-all"
              title="Export Excel (CSV)"
            >
              <FileSpreadsheet size={20} />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setPeriodMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-5 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Calendar size={18} />
              {periodLabel}
              <ChevronDown size={16} className={cn("transition-transform", periodMenuOpen && "rotate-180")} />
            </button>

            {periodMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border/40 shadow-xl overflow-hidden z-10">
                <button
                  onClick={() => { setPeriod('today'); setPeriodMenuOpen(false); setPage(1) }}
                  className={cn("w-full px-4 py-3 text-left text-sm font-bold hover:bg-accent transition-all", period === 'today' ? "bg-accent/60" : "")}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => { setPeriod('7d'); setPeriodMenuOpen(false); setPage(1) }}
                  className={cn("w-full px-4 py-3 text-left text-sm font-bold hover:bg-accent transition-all", period === '7d' ? "bg-accent/60" : "")}
                >
                  7 Hari Terakhir
                </button>
                <button
                  onClick={() => { setPeriod('30d'); setPeriodMenuOpen(false); setPage(1) }}
                  className={cn("w-full px-4 py-3 text-left text-sm font-bold hover:bg-accent transition-all", period === '30d' ? "bg-accent/60" : "")}
                >
                  30 Hari Terakhir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-[2rem] border border-border/40 shadow-sm">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Omzet</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black tracking-tight">{formatRp(currentSales)}</h3>
            <div
              className={cn(
                "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
                salesChange >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
              )}
            >
              {salesChange >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {`${salesChange >= 0 ? '+' : ''}${salesChange.toFixed(1)}%`}
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-[2rem] border border-border/40 shadow-sm">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Transaksi</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black tracking-tight">{currentTxCount.toLocaleString('id-ID')}</h3>
            <div
              className={cn(
                "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
                txChange >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
              )}
            >
              {txChange >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {`${txChange >= 0 ? '+' : ''}${txChange.toFixed(1)}%`}
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-[2rem] border border-border/40 shadow-sm">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Rata-rata Keranjang</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black tracking-tight">{formatRp(avgBasket)}</h3>
            <div
              className={cn(
                "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
                avgChange >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
              )}
            >
              {avgChange >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {`${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(1)}%`}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card p-8 rounded-[2.5rem] border border-border/40 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-xl tracking-tight uppercase flex items-center gap-3">
              <TrendingUp className="text-primary" />
              Grafik Penjualan Harian
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => `${Math.round(Number(val) / 1000000)}jt`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent))', opacity: 0.5 }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderRadius: '1rem',
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(val: number) => [`Rp ${Number(val || 0).toLocaleString('id-ID')}`, 'Penjualan']}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.4)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-8 rounded-[2.5rem] border border-border/40 shadow-sm">
          <h3 className="font-black text-xl tracking-tight uppercase mb-8">Metode Pembayaran</h3>
          <div className="space-y-6">
            {(paymentBreakdown.length === 0 ? [{ label: 'Belum ada transaksi', pct: 0, count: 0 }] : paymentBreakdown).map((item, idx) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>{item.label}</span>
                  <span className="text-muted-foreground">{item.pct}%</span>
                </div>
                <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      idx % 4 === 0 ? "bg-emerald-500" : idx % 4 === 1 ? "bg-purple-500" : idx % 4 === 2 ? "bg-blue-500" : "bg-amber-500"
                    )}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card p-8 rounded-[2.5rem] border border-border/40 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-black text-xl tracking-tight uppercase">Riwayat Transaksi</h3>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex bg-accent/30 p-1 rounded-2xl border border-border/40">
              <button
                onClick={() => {
                  setHistoryScope('period')
                  setPage(1)
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  historyScope === 'period' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-accent"
                )}
              >
                Periode
              </button>
              <button
                onClick={() => {
                  setHistoryScope('all')
                  setPage(1)
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  historyScope === 'all' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-accent"
                )}
              >
                Semua
              </button>
            </div>

            <div className="relative group w-full max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Cari ID/pelanggan/metode..."
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-medium"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-black text-muted-foreground uppercase tracking-widest">
                <th className="pb-2 pl-4">ID Transaksi</th>
                <th className="pb-2">Waktu</th>
                <th className="pb-2">Pelanggan</th>
                <th className="pb-2">Metode</th>
                <th className="pb-2">Total</th>
                <th className="pb-2 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm font-bold text-muted-foreground">
                    Belum ada transaksi pada periode ini.
                  </td>
                </tr>
              ) : (
                pagedTransactions.map((trx: any) => (
                  <tr key={trx.id} className="bg-background hover:bg-accent/20 transition-all rounded-2xl shadow-sm border border-border/20 group">
                    <td className="py-4 pl-4 rounded-l-2xl border-y border-l border-border/20">
                      <span className="font-black text-sm">{trx.id}</span>
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                        {trx.qty.toLocaleString('id-ID')} item
                      </div>
                    </td>
                    <td className="py-4 border-y border-border/20">
                      <span className="text-xs font-bold text-muted-foreground">{format(trx.timestamp, 'dd MMM HH:mm', { locale: idLocale })}</span>
                    </td>
                    <td className="py-4 border-y border-border/20">
                      <span className="text-sm font-bold">{trx.customerName}</span>
                    </td>
                    <td className="py-4 border-y border-border/20">
                      <span className="px-3 py-1.5 rounded-full bg-accent text-[10px] font-black uppercase tracking-wider">{trx.methodLabel}</span>
                    </td>
                    <td className="py-4 border-y border-border/20">
                      <span className="font-black text-sm text-primary">{formatRp(trx.total)}</span>
                    </td>
                    <td className="py-4 pr-4 rounded-r-2xl border-y border-r border-border/20 text-right">
                      <button
                        onClick={() => void openReceipt(String(trx.id))}
                        className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                        title="Lihat struk"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Menampilkan <span className="text-foreground">{total === 0 ? 0 : startIndex + 1}-{endIndex}</span> dari <span className="text-foreground">{total}</span> transaksi
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
        {receiptOpen && receiptData && (
          <ReceiptModal isOpen={receiptOpen} onClose={() => setReceiptOpen(false)} transactionData={receiptData} />
        )}
      </AnimatePresence>
    </div>
  )
}
