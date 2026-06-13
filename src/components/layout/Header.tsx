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
  Menu,
  Eye,
  EyeOff,
  X
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '@/store/useAuthStore'
import { useSyncStatus } from '@/hooks/useSyncStatus'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm'
import { storesApi } from '@/services/api'
import { authRepo } from '@/repositories/authRepo'
import { capitalizeWords, formatPhoneNumber } from '@/lib/formatters'

interface HeaderProps {
  isDarkMode: boolean
  toggleDarkMode: () => void
  onLogout: () => void
  onMenuClick?: () => void
}

export default function Header({ isDarkMode, toggleDarkMode, onLogout, onMenuClick }: HeaderProps) {
  const [time, setTime] = useState(new Date())
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const { currentStore, stores, switchStore, addStore, user } = useAuthStore()
  const { pendingCount, failedCount, lastSyncAt } = useSyncStatus()
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const storeMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [newStoreName, setNewStoreName] = useState('')
  const [newStoreAddress, setNewStoreAddress] = useState('')
  const [newStorePhone, setNewStorePhone] = useState('')
  const [isSavingStore, setIsSavingStore] = useState(false)

  const handleNewStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewStoreName(capitalizeWords(e.target.value))
  }

  const handleNewStoreAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewStoreAddress(capitalizeWords(e.target.value))
  }

  const handleNewStorePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewStorePhone(formatPhoneNumber(e.target.value))
  }
  // Ganti Password State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const confirm = useConfirm()

  const handleChangePassword = () => {
    void (async () => {
      if (newPassword !== confirmPassword) {
        toast.error('Password baru dan konfirmasi tidak cocok!')
        return
      }

      if (newPassword.length < 4) {
        toast.error('Password baru minimal 4 karakter!')
        return
      }

      setIsChangingPassword(true)
      try {
        await authRepo.changePassword(currentPassword, newPassword)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        toast.success('Password berhasil diubah!')
      } catch (e: any) {
        toast.error(e?.message ? String(e.message) : 'Gagal mengubah password.')
      } finally {
        setIsChangingPassword(false)
      }
    })()
  }

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (storeMenuRef.current && !storeMenuRef.current.contains(event.target as Node)) {
        setIsStoreMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
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
        <div className="relative" ref={storeMenuRef}>
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

              <button
                onClick={() => {
                  setIsStoreMenuOpen(false)
                  setIsAddStoreOpen(true)
                  setNewStoreName('')
                  setNewStoreAddress('')
                  setNewStorePhone('')
                }}
                className="w-full mt-1 px-4 py-3 rounded-xl text-left hover:bg-accent transition-all text-sm font-black uppercase tracking-widest"
              >
                + Tambah Cabang
              </button>
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

        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wider',
          failedCount > 0
            ? 'bg-destructive/10 text-destructive'
            : pendingCount > 0
              ? 'bg-amber-500/10 text-amber-600'
              : 'bg-emerald-500/10 text-emerald-500'
        )}>
          <span className="hidden sm:inline">
            {failedCount > 0
              ? `Sync gagal: ${failedCount}`
              : pendingCount > 0
                ? `Pending: ${pendingCount}`
                : 'Synced'}
          </span>
          {lastSyncAt && (
            <span className="hidden lg:inline text-[10px] font-black text-muted-foreground normal-case tracking-normal">
              {format(lastSyncAt, 'HH:mm', { locale: id })}
            </span>
          )}
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

        <div className="relative" ref={userMenuRef}>
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
              
              <button 
                onClick={() => {
                  setIsUserMenuOpen(false)
                  setIsProfileModalOpen(true)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left hover:bg-accent transition-all text-sm font-medium">
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

      <AnimatePresence>
        {isAddStoreOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddStoreOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-border/40"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Tambah Cabang</p>
                    <p className="text-xl font-black tracking-tight">Cabang Baru</p>
                  </div>
                  <button
                    onClick={() => setIsAddStoreOpen(false)}
                    className="p-2 rounded-xl hover:bg-accent transition-all"
                  >
                    <ChevronDown className="rotate-180" size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2 block">Nama Cabang</label>
                    <input
                      value={newStoreName}
                      onChange={handleNewStoreNameChange}
                      className="w-full h-12 px-5 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-bold"
                      placeholder="Contoh: Cabang Depok"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2 block">Alamat</label>
                    <input
                      value={newStoreAddress}
                      onChange={handleNewStoreAddressChange}
                      className="w-full h-12 px-5 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-bold"
                      placeholder="Alamat cabang"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2 block">Telepon</label>
                    <input
                      value={newStorePhone}
                      onChange={handleNewStorePhoneChange}
                      className="w-full h-12 px-5 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-bold"
                      placeholder="08xx / 021-xxx"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsAddStoreOpen(false)}
                    className="flex-1 py-4 rounded-2xl bg-accent/50 border border-border/40 font-black text-sm uppercase tracking-widest hover:bg-accent transition-all active:scale-95"
                    disabled={isSavingStore}
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      void (async () => {
                        const name = newStoreName.trim()
                        if (!name) {
                          toast.error('Nama cabang wajib diisi.')
                          return
                        }
                        setIsSavingStore(true)
                        try {
                          const res = await storesApi.create({
                            name,
                            address: newStoreAddress.trim(),
                            phone: newStorePhone.trim(),
                          })
                          addStore(res.data as any)
                          toast.success('Cabang berhasil ditambahkan.')
                        } catch (e: any) {
                          const msg = e?.response?.data?.message || e?.message || 'Gagal menambah cabang.'
                          toast.error(String(msg))
                          setIsSavingStore(false)
                        }
                      })()
                    }}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95",
                      isSavingStore ? "bg-muted text-muted-foreground cursor-wait" : "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                    )}
                    disabled={isSavingStore}
                  >
                    {isSavingStore ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Profil & Keamanan Modal */}
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-border/40"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Profil & Keamanan</p>
                    <p className="text-xl font-black tracking-tight">Pengaturan Akun</p>
                  </div>
                  <button
                    onClick={() => setIsProfileModalOpen(false)}
                    className="p-2 rounded-xl hover:bg-accent transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Profil Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-accent/30 rounded-2xl border border-border/40">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white shadow-md">
                      <User size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">{user?.role || 'Staff'}</p>
                    </div>
                  </div>
                </div>

                {/* Ganti Password Section */}
                <div className="space-y-4 pt-4 border-t border-border/40">
                  <p className="text-sm font-bold">Ganti Password</p>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2 block">Password Saat Ini</label>
                      <div className="relative">
                        <input 
                          type={showCurrentPassword ? 'text' : 'password'} 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full h-12 px-5 pr-12 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-bold"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2 block">Password Baru</label>
                      <div className="relative">
                        <input 
                          type={showNewPassword ? 'text' : 'password'} 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full h-12 px-5 pr-12 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-bold"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2 block">Konfirmasi Password Baru</label>
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? 'text' : 'password'} 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full h-12 px-5 pr-12 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-bold"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isChangingPassword ? 'Memproses...' : 'Ubah Password'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  )
}
