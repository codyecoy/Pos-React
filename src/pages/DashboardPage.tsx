import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CalendarDays,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { id as idLocale } from 'date-fns/locale'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<'today' | '7d' | '30d'>('7d')
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false)

  const { start, end, days } = useMemo(() => {
    const now = new Date()
    if (period === 'today') {
      return { start: startOfDay(now), end: endOfDay(now), days: 1 }
    }
    if (period === '30d') {
      const s = startOfDay(subDays(now, 29))
      return { start: s, end: endOfDay(now), days: 30 }
    }
    const s = startOfDay(subDays(now, 6))
    return { start: s, end: endOfDay(now), days: 7 }
  }, [period])

  const { prevStart, prevEnd } = useMemo(() => {
    const prevEnd = endOfDay(subDays(end, days))
    const prevStart = startOfDay(subDays(start, days))
    return { prevStart, prevEnd }
  }, [start, end, days])

  const txs = useLiveQuery(async () => {
    return db.transactions.where('timestamp').between(start, end, true, true).toArray()
  }, [start.getTime(), end.getTime()], [])

  const prevTxs = useLiveQuery(async () => {
    return db.transactions.where('timestamp').between(prevStart, prevEnd, true, true).toArray()
  }, [prevStart.getTime(), prevEnd.getTime()], [])

  const items = useLiveQuery(async () => {
    return db.transaction_items.where('createdAt').between(start, end, true, true).toArray()
  }, [start.getTime(), end.getTime()], [])

  const prevItems = useLiveQuery(async () => {
    return db.transaction_items.where('createdAt').between(prevStart, prevEnd, true, true).toArray()
  }, [prevStart.getTime(), prevEnd.getTime()], [])

  const customers = useLiveQuery(async () => {
    const rows = await db.customers.toArray()
    return rows.filter((c: any) => !c.deletedAt && c.createdAt && c.createdAt >= start && c.createdAt <= end)
  }, [start.getTime(), end.getTime()], [])

  const prevCustomers = useLiveQuery(async () => {
    const rows = await db.customers.toArray()
    return rows.filter((c: any) => !c.deletedAt && c.createdAt && c.createdAt >= prevStart && c.createdAt <= prevEnd)
  }, [prevStart.getTime(), prevEnd.getTime()], [])

  const formatRp = (n: number) => `Rp ${Math.round(Number(n || 0)).toLocaleString('id-ID')}`

  const pct = (current: number, prev: number) => {
    const c = Number(current || 0)
    const p = Number(prev || 0)
    if (p === 0) return c === 0 ? 0 : 100
    return ((c - p) / p) * 100
  }

  const currentSales = useMemo(() => (txs || []).reduce((sum, t: any) => sum + Number(t.total || 0), 0), [txs])
  const prevSales = useMemo(() => (prevTxs || []).reduce((sum, t: any) => sum + Number(t.total || 0), 0), [prevTxs])
  const salesChange = useMemo(() => pct(currentSales, prevSales), [currentSales, prevSales])

  const currentTxCount = (txs || []).length
  const prevTxCount = (prevTxs || []).length
  const txChange = useMemo(() => pct(currentTxCount, prevTxCount), [currentTxCount, prevTxCount])

  const currentNewCustomers = (customers || []).length
  const prevNewCustomers = (prevCustomers || []).length
  const customersChange = useMemo(() => pct(currentNewCustomers, prevNewCustomers), [currentNewCustomers, prevNewCustomers])

  const currentQtySold = useMemo(() => (items || []).reduce((sum, it: any) => sum + Number(it.quantity || 0), 0), [items])
  const prevQtySold = useMemo(() => (prevItems || []).reduce((sum, it: any) => sum + Number(it.quantity || 0), 0), [prevItems])
  const qtyChange = useMemo(() => pct(currentQtySold, prevQtySold), [currentQtySold, prevQtySold])

  const stats = useMemo(() => {
    const toChange = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
    return [
      { label: 'Total Penjualan', value: formatRp(currentSales), change: toChange(salesChange), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: salesChange >= 0 ? 'up' : 'down' },
      { label: 'Total Transaksi', value: currentTxCount.toLocaleString('id-ID'), change: toChange(txChange), icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: txChange >= 0 ? 'up' : 'down' },
      { label: 'Pelanggan Baru', value: currentNewCustomers.toLocaleString('id-ID'), change: toChange(customersChange), icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: customersChange >= 0 ? 'up' : 'down' },
      { label: 'Produk Terjual', value: currentQtySold.toLocaleString('id-ID'), change: toChange(qtyChange), icon: Package, color: 'text-purple-500', bg: 'bg-purple-500/10', trend: qtyChange >= 0 ? 'up' : 'down' },
    ] as const
  }, [currentSales, salesChange, currentTxCount, txChange, currentNewCustomers, customersChange, currentQtySold, qtyChange])

  const chartData = useMemo(() => {
    const buckets: { day: Date; key: string; sales: number; transactions: number }[] = []
    for (let i = 0; i < days; i++) {
      const d = startOfDay(subDays(end, days - 1 - i))
      buckets.push({ day: d, key: format(d, 'yyyy-MM-dd'), sales: 0, transactions: 0 })
    }

    const byKey = new Map(buckets.map((b) => [b.key, b]))
    for (const t of txs || []) {
      const ts = (t as any).timestamp instanceof Date ? (t as any).timestamp : new Date((t as any).timestamp)
      const key = format(ts, 'yyyy-MM-dd')
      const b = byKey.get(key)
      if (!b) continue
      b.sales += Number((t as any).total || 0)
      b.transactions += 1
    }

    return buckets.map((b) => ({
      name: format(b.day, 'EEE', { locale: idLocale }),
      sales: Math.round(b.sales),
      transactions: b.transactions,
    }))
  }, [txs, days, end])

  const topProducts = useLiveQuery(async () => {
    const periodItems = await db.transaction_items.where('createdAt').between(start, end, true, true).toArray()
    const byProduct = new Map<string, { qty: number; revenue: number }>()
    for (const it of periodItems as any[]) {
      const productId = String(it.productId || '')
      if (!productId) continue
      const current = byProduct.get(productId) || { qty: 0, revenue: 0 }
      current.qty += Number(it.quantity || 0)
      current.revenue += Number(it.price || 0) * Number(it.quantity || 0)
      byProduct.set(productId, current)
    }

    const ranked = [...byProduct.entries()]
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 5)

    const products = await db.products.bulkGet(ranked.map(([id]) => id))
    const byId = new Map(products.filter(Boolean).map((p: any) => [p.id, p]))

    return ranked.map(([productId, agg]) => ({
      productId,
      qty: agg.qty,
      revenue: agg.revenue,
      product: byId.get(productId) || null,
    }))
  }, [start.getTime(), end.getTime()], [])

  const fallbackImage = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#cbd5e1"/></linearGradient></defs><rect width="120" height="120" rx="16" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#334155" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="700">PRODUK</text></svg>`
  )}`

  const periodLabel = period === 'today' ? 'Hari Ini' : period === '30d' ? '30 Hari Terakhir' : '7 Hari Terakhir'

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight">Ringkasan Bisnis</h1>
          <p className="text-muted-foreground font-medium mt-1">Pantau performa toko Anda secara real-time.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setPeriodMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border/40 font-bold text-sm shadow-sm hover:bg-accent transition-all"
            >
            <CalendarDays size={18} />
              {periodLabel}
              <ChevronDown size={16} className={cn("transition-transform", periodMenuOpen ? "rotate-180" : "")} />
            </button>

            {periodMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border/40 shadow-xl overflow-hidden z-10">
                <button
                  onClick={() => { setPeriod('today'); setPeriodMenuOpen(false) }}
                  className={cn("w-full px-4 py-3 text-left text-sm font-bold hover:bg-accent transition-all", period === 'today' ? "bg-accent/60" : "")}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => { setPeriod('7d'); setPeriodMenuOpen(false) }}
                  className={cn("w-full px-4 py-3 text-left text-sm font-bold hover:bg-accent transition-all", period === '7d' ? "bg-accent/60" : "")}
                >
                  7 Hari Terakhir
                </button>
                <button
                  onClick={() => { setPeriod('30d'); setPeriodMenuOpen(false) }}
                  className={cn("w-full px-4 py-3 text-left text-sm font-bold hover:bg-accent transition-all", period === '30d' ? "bg-accent/60" : "")}
                >
                  30 Hari Terakhir
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Filter size={18} />
            Laporan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card p-6 rounded-[2rem] border border-border/40 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group">
            <div className="flex items-start justify-between">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon size={28} strokeWidth={2.5} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full",
                stat.trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
              )}>
                {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-none">{stat.label}</p>
              <h3 className="text-2xl lg:text-3xl font-black mt-2 tracking-tight group-hover:text-primary transition-colors">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card p-8 rounded-[2.5rem] border border-border/40 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-xl tracking-tight uppercase flex items-center gap-3">
              <TrendingUp className="text-primary" />
              Statistik Penjualan
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs font-bold text-muted-foreground">Omzet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-muted-foreground">Transaksi</span>
              </div>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderRadius: '1rem', 
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="transactions" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={0} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-8 rounded-[2.5rem] border border-border/40 shadow-sm flex flex-col">
          <h3 className="font-black text-xl tracking-tight uppercase mb-8">Produk Terlaris</h3>
          <div className="flex-1 space-y-6">
            {(topProducts || []).length === 0 ? (
              <div className="p-6 rounded-2xl bg-accent/20 text-center text-sm font-bold text-muted-foreground">
                Belum ada transaksi di periode ini.
              </div>
            ) : (
              (topProducts || []).map((row: any) => (
                <div key={row.productId} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-14 h-14 rounded-2xl bg-accent overflow-hidden group-hover:scale-110 transition-transform">
                    <img
                      src={row.product?.image || fallbackImage}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImage }}
                      alt={row.product?.name || 'Produk'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{row.product?.name || row.productId}</h4>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{row.qty.toLocaleString('id-ID')} Terjual</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary">{formatRp(row.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => navigate('/products')}
            className="mt-8 w-full py-4 rounded-2xl bg-accent hover:bg-primary hover:text-primary-foreground transition-all font-bold text-sm uppercase tracking-widest"
          >
            Lihat Semua Produk
          </button>
        </div>
      </div>
    </div>
  )
}
