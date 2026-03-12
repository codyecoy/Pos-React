import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  User, 
  Settings, 
  Wifi, 
  WifiOff, 
  Clock,
  Store as StoreIcon,
  ChevronDown,
  LogOut,
  Menu
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface HeaderProps {
  isDarkMode: boolean
  toggleDarkMode: () => void
  onLogout: () => void
  onMenuClick?: () => void
}

export default function Header({ isDarkMode, toggleDarkMode, onLogout, onMenuClick }: HeaderProps) {
  const [time, setTime] = useState(new Date())
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const { currentStore, stores, switchStore, user } = useAuthStore()
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      onLogout()
      toast.success('Berhasil keluar.')
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(timer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <header className="h-16 lg:h-20 bg-card border-b border-border px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-2 lg:gap-6 flex-1">
        {/* Mobile Menu Trigger */}
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-xl hover:bg-accent tablet:hidden transition-all"
        >
          <Menu size={24} />
        </button>

        {/* Store Switcher */}
        <div className="relative">
          <button 
            onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
            className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-accent transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <StoreIcon size={20} />
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Toko Sekarang</p>
              <p className="text-sm font-bold truncate max-w-[150px]">{currentStore?.name || 'Pilih Toko'}</p>
            </div>
            <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", isStoreMenuOpen && "rotate-180")} />
          </button>

          {isStoreMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-2xl p-2 z-50">
              <p className="px-4 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ganti Cabang</p>
              {stores.map(store => (
                <button
                  key={store.id}
                  onClick={() => {
                    switchStore(store.id)
                    setIsStoreMenuOpen(false)
                  }}
                  className={cn(
                    "w-full flex flex-col gap-0.5 px-4 py-3 rounded-xl text-left hover:bg-accent transition-all",
                    currentStore?.id === store.id && "bg-primary/5 border border-primary/20"
                  )}
                >
                  <p className={cn("text-sm font-bold", currentStore?.id === store.id && "text-primary")}>{store.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{store.address}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-border hidden lg:block" />

        <div className="relative group hidden md:block w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Cari transaksi atau produk..." 
            className="w-full h-11 pl-11 pr-4 rounded-xl bg-accent/50 border-none ring-0 focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/50 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          {format(time, 'HH:mm:ss', { locale: id })}
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-5 ml-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
          isOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
        }`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        <button 
          onClick={toggleDarkMode}
          className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="p-2.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-card" />
        </button>

        <div className="h-8 w-px bg-border mx-1" />

        <div className="relative">
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-accent transition-all"
          >
            <div className="hidden lg:block text-right">
              <p className="text-sm font-semibold leading-none">{user?.name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5 tracking-tight">{user?.role || 'Staff'}</p>
            </div>
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white shadow-md">
              <User size={20} />
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl p-2 z-50">
              <div className="px-4 py-3 border-b border-border mb-1">
                <p className="text-sm font-bold">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">{user?.role}</p>
              </div>
              
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left hover:bg-accent transition-all text-sm font-medium">
                <Settings size={16} />
                Profil & Keamanan
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left hover:bg-destructive/10 text-destructive transition-all text-sm font-bold mt-1"
              >
                <LogOut size={16} />
                Keluar Aplikasi
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
