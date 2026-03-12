import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CalendarDays
} from 'lucide-react'
import { cn } from '@/lib/utils'

const data = [
  { name: 'Sen', sales: 4000, transactions: 240 },
  { name: 'Sel', sales: 3000, transactions: 198 },
  { name: 'Rab', sales: 2000, transactions: 150 },
  { name: 'Kam', sales: 2780, transactions: 210 },
  { name: 'Jum', sales: 1890, transactions: 120 },
  { name: 'Sab', sales: 2390, transactions: 180 },
  { name: 'Min', sales: 3490, transactions: 250 },
]

const stats = [
  { label: 'Total Penjualan', value: 'Rp 12.450.000', change: '+12.5%', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: 'up' },
  { label: 'Total Transaksi', value: '1.240', change: '+5.2%', icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: 'up' },
  { label: 'Pelanggan Baru', value: '45', change: '-2.4%', icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: 'down' },
  { label: 'Produk Terjual', value: '890', change: '+8.1%', icon: Package, color: 'text-purple-500', bg: 'bg-purple-500/10', trend: 'up' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight">Ringkasan Bisnis</h1>
          <p className="text-muted-foreground font-medium mt-1">Pantau performa toko Anda secara real-time.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border/40 font-bold text-sm shadow-sm hover:bg-accent transition-all">
            <CalendarDays size={18} />
            7 Hari Terakhir
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <Filter size={18} />
            Filter Lanjutan
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
              <AreaChart data={data}>
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
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-14 h-14 rounded-2xl bg-accent overflow-hidden group-hover:scale-110 transition-transform">
                  <img src={`https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=100&auto=format&fit=crop`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">Menu Favorit {item}</h4>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">245 Terjual</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary">Rp 45k</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 w-full py-4 rounded-2xl bg-accent hover:bg-primary hover:text-primary-foreground transition-all font-bold text-sm uppercase tracking-widest">
            Lihat Semua Produk
          </button>
        </div>
      </div>
    </div>
  )
}
