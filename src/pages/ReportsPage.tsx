import { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronLeft,
  Search,
  FileText,
  FileSpreadsheet
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'

const MOCK_SALES_DATA = [
  { date: '01 Mar', total: 1200000, transactions: 45 },
  { date: '02 Mar', total: 1500000, transactions: 52 },
  { date: '03 Mar', total: 1100000, transactions: 38 },
  { date: '04 Mar', total: 1800000, transactions: 60 },
  { date: '05 Mar', total: 2200000, transactions: 75 },
  { date: '06 Mar', total: 2500000, transactions: 82 },
  { date: '07 Mar', total: 1900000, transactions: 65 },
]

const MOCK_TRANSACTIONS = [
  { id: 'TRX-98231', time: new Date(), customer: 'Andi Pratama', items: 4, total: 155000, method: 'Tunai', cashier: 'Budi' },
  { id: 'TRX-98232', time: new Date(), customer: 'Siti Aminah', items: 2, total: 85000, method: 'QRIS', cashier: 'Budi' },
  { id: 'TRX-98233', time: new Date(), customer: 'Umum', items: 1, total: 35000, method: 'Tunai', cashier: 'Budi' },
  { id: 'TRX-98234', time: new Date(), customer: 'Budi Hartono', items: 7, total: 450000, method: 'Debit', cashier: 'Budi' },
  { id: 'TRX-98235', time: new Date(), customer: 'Umum', items: 3, total: 125000, method: 'E-Wallet', cashier: 'Budi' },
]

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('7 Hari Terakhir')
  
  const handleExport = (type: string) => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
      loading: `Menyiapkan export ${type}...`,
      success: `Laporan berhasil di-export ke ${type}!`,
      error: 'Gagal meng-export laporan.',
    })
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
              onClick={() => handleExport('PDF')}
              className="p-2.5 rounded-xl text-muted-foreground hover:bg-white hover:text-destructive hover:shadow-sm transition-all"
              title="Export PDF"
            >
              <FileText size={20} />
            </button>
            <button 
              onClick={() => handleExport('Excel')}
              className="p-2.5 rounded-xl text-muted-foreground hover:bg-white hover:text-emerald-600 hover:shadow-sm transition-all"
              title="Export Excel"
            >
              <FileSpreadsheet size={20} />
            </button>
          </div>
          
          <button className="flex items-center gap-2 px-5 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <Calendar size={18} />
            {dateRange}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-[2rem] border border-border/40 shadow-sm">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Omzet</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black tracking-tight">Rp 12.800.000</h3>
            <div className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
              <ArrowUpRight size={12} />
              +12.5%
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-[2rem] border border-border/40 shadow-sm">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Transaksi</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black tracking-tight">426</h3>
            <div className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
              <ArrowUpRight size={12} />
              +5.2%
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-[2rem] border border-border/40 shadow-sm">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Rata-rata Keranjang</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black tracking-tight">Rp 30.046</h3>
            <div className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-destructive/10 text-destructive">
              <ArrowDownRight size={12} />
              -2.1%
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
              <BarChart data={MOCK_SALES_DATA}>
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
                  tickFormatter={(val) => `${val / 1000000}jt`}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--accent))', opacity: 0.5 }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderRadius: '1rem', 
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }} 
                  formatter={(val: number) => [`Rp ${val.toLocaleString('id-ID')}`, 'Penjualan']}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                  {MOCK_SALES_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === MOCK_SALES_DATA.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.4)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-8 rounded-[2.5rem] border border-border/40 shadow-sm">
          <h3 className="font-black text-xl tracking-tight uppercase mb-8">Metode Pembayaran</h3>
          <div className="space-y-6">
            {[
              { label: 'Tunai', value: 45, color: 'bg-emerald-500' },
              { label: 'QRIS', value: 30, color: 'bg-purple-500' },
              { label: 'Debit', value: 15, color: 'bg-blue-500' },
              { label: 'E-Wallet', value: 10, color: 'bg-amber-500' },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>{item.label}</span>
                  <span className="text-muted-foreground">{item.value}%</span>
                </div>
                <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card p-8 rounded-[2.5rem] border border-border/40 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-xl tracking-tight uppercase">Riwayat Transaksi</h3>
          <div className="relative group w-full max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Cari ID transaksi..." 
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-medium"
            />
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
              {MOCK_TRANSACTIONS.map((trx) => (
                <tr key={trx.id} className="bg-background hover:bg-accent/20 transition-all rounded-2xl shadow-sm border border-border/20 group">
                  <td className="py-4 pl-4 rounded-l-2xl border-y border-l border-border/20">
                    <span className="font-black text-sm">{trx.id}</span>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className="text-xs font-bold text-muted-foreground">{format(trx.time, 'HH:mm', { locale: id })}</span>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className="text-sm font-bold">{trx.customer}</span>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className="px-3 py-1.5 rounded-full bg-accent text-[10px] font-black uppercase tracking-wider">{trx.method}</span>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className="font-black text-sm text-primary">Rp {trx.total.toLocaleString('id-ID')}</span>
                  </td>
                  <td className="py-4 pr-4 rounded-r-2xl border-y border-r border-border/20 text-right">
                    <button className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
