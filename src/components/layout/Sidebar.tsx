import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Settings, 
  BarChart3,
  ChevronRight,
  LogOut,
  History,
  Truck,
  CreditCard as DebtIcon,
  ShoppingCart
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { group: 'Penjualan', items: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ShoppingBag, label: 'Kasir', path: '/cashier' },
    { icon: Users, label: 'Pelanggan', path: '/customers' },
  ]},
  { group: 'Persediaan & Pembelian', items: [
    { icon: Package, label: 'Produk', path: '/products' },
    { icon: Truck, label: 'Supplier', path: '/suppliers' },
    { icon: ShoppingCart, label: 'Pembelian', path: '/purchasing' },
    { icon: DebtIcon, label: 'Hutang', path: '/debts' },
  ]},
  { group: 'Sistem', items: [
    { icon: BarChart3, label: 'Laporan', path: '/reports' },
    { icon: History, label: 'Audit Log', path: '/audit-log' },
    { icon: Settings, label: 'Pengaturan', path: '/settings' },
  ]},
]

import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm'

interface SidebarProps {
  onLogout: () => void
  onClose?: () => void
  isMobile?: boolean
}

export default function Sidebar({ onLogout, onClose, isMobile }: SidebarProps) {
  const confirm = useConfirm()

  const handleLogout = () => {
    void (async () => {
      const ok = await confirm({
        title: 'Keluar',
        description: 'Apakah Anda yakin ingin keluar?',
        confirmText: 'Keluar',
        cancelText: 'Batal',
        destructive: true,
      })
      if (!ok) return
      onLogout()
      toast.success('Berhasil keluar.')
    })()
  }

  const sidebarContent = (
    <div className={cn(
      "flex flex-col h-full bg-card transition-all duration-300",
      !isMobile && "w-20 lg:w-64 border-r border-border"
    )}>
      <div className="p-4 lg:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <ShoppingBag size={24} strokeWidth={2.5} />
          </div>
          <span className={cn("font-bold text-xl tracking-tight", !isMobile && "hidden lg:block")}>POS PRO</span>
        </div>
        {isMobile && (
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent">
            <ChevronRight size={24} className="rotate-180" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto no-scrollbar">
        {navItems.map((group) => (
          <div key={group.group} className="space-y-1">
            <p className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 hidden lg:block">
              {group.group}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group/item",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon size={20} />
                <span className={cn("font-medium text-sm", !isMobile && "hidden lg:block")}>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-border">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-destructive hover:bg-destructive/10 transition-colors group"
        >
          <LogOut size={22} />
          <span className={cn("font-medium", !isMobile && "hidden lg:block")}>Keluar</span>
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex overflow-hidden">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-64 h-full shadow-2xl">
          {sidebarContent}
        </div>
      </div>
    )
  }

  return (
    <aside className="hidden tablet:flex flex-col w-20 lg:w-64 bg-card border-r border-border h-screen transition-all duration-300">
      {sidebarContent}
    </aside>
  )
}
