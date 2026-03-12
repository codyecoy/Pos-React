import { 
  History, 
  Search, 
  Filter, 
  User, 
  ShoppingBag, 
  LogIn, 
  LogOut, 
  Trash2, 
  Edit, 
  Plus,
  ShieldAlert,
  Clock
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

const MOCK_LOGS = [
  { id: 1, action: 'LOGIN', user: 'Budi Santoso', detail: 'Masuk ke sistem kasir', time: new Date(), type: 'info', icon: LogIn },
  { id: 2, action: 'PAYMENT', user: 'Budi Santoso', detail: 'Menyelesaikan transaksi TRX-98231 (Rp 155.000)', time: new Date(Date.now() - 1000 * 60 * 15), type: 'success', icon: ShoppingBag },
  { id: 3, action: 'PRODUCT_ADD', user: 'Admin Pro', detail: 'Menambahkan produk baru: Kopi Gayo 1kg', time: new Date(Date.now() - 1000 * 60 * 60), type: 'info', icon: Plus },
  { id: 4, action: 'PRODUCT_DELETE', user: 'Admin Pro', detail: 'Menghapus produk: Teh Botol Sosro', time: new Date(Date.now() - 1000 * 60 * 60 * 2), type: 'warning', icon: Trash2 },
  { id: 5, action: 'LOGOUT', user: 'Siti Aminah', detail: 'Keluar dari sistem', time: new Date(Date.now() - 1000 * 60 * 60 * 3), type: 'info', icon: LogOut },
  { id: 6, action: 'VOID_TRANSACTION', user: 'Manager Rian', detail: 'Membatalkan transaksi TRX-98220', time: new Date(Date.now() - 1000 * 60 * 60 * 5), type: 'danger', icon: ShieldAlert },
]

export default function AuditLogPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase flex items-center gap-4">
            <History className="text-primary w-10 h-10 lg:w-12 lg:h-12" />
            Audit Log
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Lacak semua aktivitas dan perubahan dalam sistem.</p>
        </div>
      </div>

      <div className="bg-card p-6 rounded-[2.5rem] border border-border/40 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Cari user, aktivitas, atau detail..." 
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-4 rounded-2xl bg-accent/30 border border-border/40 font-bold text-sm hover:bg-accent transition-all w-full md:w-auto justify-center">
            <Filter size={18} />
            Semua Tipe
          </button>
        </div>

        <div className="space-y-4">
          {MOCK_LOGS.map((log) => (
            <div key={log.id} className="flex items-start gap-4 p-5 bg-background rounded-3xl border border-border/20 hover:border-primary/20 transition-all group">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                log.type === 'info' && "bg-blue-500/10 text-blue-500",
                log.type === 'success' && "bg-emerald-500/10 text-emerald-500",
                log.type === 'warning' && "bg-amber-500/10 text-amber-500",
                log.type === 'danger' && "bg-destructive/10 text-destructive",
              )}>
                <log.icon size={24} strokeWidth={2.5} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm uppercase tracking-widest">{log.action}</span>
                    <div className="w-1 h-1 rounded-full bg-border hidden sm:block" />
                    <span className="text-sm font-bold text-foreground flex items-center gap-2">
                      <User size={14} className="text-muted-foreground" />
                      {log.user}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-2 shrink-0">
                    <Clock size={12} />
                    {format(log.time, 'dd MMM, HH:mm', { locale: id })}
                  </span>
                </div>
                <p className="text-sm font-medium text-muted-foreground">{log.detail}</p>
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full py-4 rounded-2xl bg-accent/50 hover:bg-primary/10 hover:text-primary transition-all font-black text-xs uppercase tracking-widest">
          Muat Aktivitas Lebih Lama
        </button>
      </div>
    </div>
  )
}
