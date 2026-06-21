import { useState, useEffect, useMemo } from 'react'
import { 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  CheckCircle2, 
  XCircle,
  X,
  Save
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { userRepo } from '@/repositories/userRepo'
import { User, Store } from '@/types'
import { useAuthStore } from '@/store/useAuthStore'
import { useConfirm } from '@/components/ui/confirm'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'

export default function UsersPage() {
  // noop to trigger HMR when debugging
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [form, setForm] = useState<{
    username: string
    name: string
    role: User['role']
    phone?: string
    email?: string
    password?: string
    storeIds: string[]
    isActive: boolean
  }>({
    username: '',
    name: '',
    role: 'cashier',
    phone: '',
    email: '',
    storeIds: [],
    isActive: true,
  })

  const confirm = useConfirm()
  const { stores } = useAuthStore()
  const users = useLiveQuery(() => userRepo.listUsers(), [], [])

  useEffect(() => {
    void (async () => {
      const currentUser = (await import('@/store/useAuthStore')).useAuthStore.getState().user
      if (currentUser) {
        const user = await userRepo.getUserById(currentUser.id)
        if (!user) {
          await userRepo.seedInitialUser(stores)
        }
      }
    })()
  }, [stores])

  const filteredUsers = useMemo(() => {
    if (!users) return []
    return users.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [users, searchQuery])

  const handleOpenAdd = () => {
    setSelectedUser(null)
    setForm({
      username: '',
      name: '',
      role: 'cashier',
      phone: '',
      email: '',
      storeIds: stores.length > 0 ? [stores[0].id] : [],
      isActive: true
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user)
    setForm({
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone || '',
      email: user.email || '',
      storeIds: user.storeIds,
      isActive: user.isActive
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.username.trim()) {
      toast.error('Nama dan username wajib diisi!')
      return
    }

    if (!selectedUser && !form.password) {
      toast.error('Password wajib diisi untuk user baru!')
      return
    }

    if (form.storeIds.length === 0) {
      toast.error('Pilih minimal 1 cabang!')
      return
    }

    if (selectedUser) {
      await userRepo.updateUser(selectedUser.id, form)
      toast.success('User berhasil diperbarui!')
    } else {
      await userRepo.createUser(form as any)
      toast.success('User berhasil ditambahkan!')
    }

    setIsModalOpen(false)
  }

  const handleDelete = async (user: User) => {
    const ok = await confirm({
      title: 'Hapus User',
      description: `Apakah Anda yakin ingin menghapus user "${user.name}"?`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      destructive: true
    })
    if (!ok) return
    
    await userRepo.softDeleteUser(user.id)
    toast.error('User berhasil dihapus!')
  }

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return { bg: 'bg-emerald-500/10', text: 'text-emerald-600' }
      case 'manager': return { bg: 'bg-blue-500/10', text: 'text-blue-600' }
      case 'cashier': return { bg: 'bg-amber-500/10', text: 'text-amber-600' }
    }
  }

  const getStoreNames = (user: User) => {
    return user.storeIds.map(id => stores.find(s => s.id === id)?.name).filter(Boolean)
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase flex items-center gap-4">
            <Shield className="text-primary w-10 h-10 lg:w-12 lg:h-12" />
            Kelola Kasir
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Kelola user dan kasir untuk setiap cabang.</p>
        </div>

        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <UserPlus size={20} strokeWidth={2.5} />
          Tambah Kasir
        </button>
      </div>

      <div className="bg-card p-4 lg:p-6 rounded-[2.5rem] border border-border/40 shadow-sm">
        <div className="relative flex-1 w-full group mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input
            type="text" placeholder="Cari nama atau username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
          />
        </div>

        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="py-16 text-center">
              <Shield size={32} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">
                {searchQuery ? 'Tidak ada user yang sesuai.' : 'Belum ada user.'}
              </p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div key={user.id} className="p-4 rounded-2xl bg-background border border-border/30 flex items-center gap-4 group hover:border-primary/30 transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-black">{user.name}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide text-muted-foreground bg-accent/50">{user.username}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getRoleColor(user.role).bg} ${getRoleColor(user.role).text}`}>
                      {user.role === 'cashier' ? 'Kasir' : user.role === 'manager' ? 'Manajer' : 'Admin'}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {user.isActive ? (
                        <><CheckCircle2 size={12} className="text-emerald-500" /> Aktif</>
                      ) : (
                        <><XCircle size={12} className="text-destructive" /> Nonaktif</>
                      )}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground font-medium">
                    Akses: {getStoreNames(user).map(n => <span key={n} className="inline-block px-2 py-0.5 bg-accent/50 rounded-full mr-1 mt-1">{n}</span>)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(user)}
                    className="p-2.5 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="p-2.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div 
              initial={{opacity:0, scale:0.95, y:10}}
              animate={{opacity:1, scale:1, y:0}}
              exit={{opacity:0, scale:0.95, y:10}}
              className="relative w-full max-w-2xl bg-card rounded-[2.5rem] shadow-2xl border border-border/40 overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                      {selectedUser ? 'Edit Kasir' : 'Tambah Kasir'}
                    </p>
                    <p className="text-xl font-black tracking-tight">
                      {selectedUser ? 'Edit Data' : 'Data Baru'}
                    </p>
                  </div>
                  <button onClick={()=>setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-accent transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2">Nama Lengkap</label>
                    <input value={form.name} onChange={(e)=>setForm(f=>({...f, name:e.target.value}))} placeholder="Masukkan nama..." className="w-full h-14 px-6 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2">Username</label>
                    <input value={form.username} onChange={(e)=>setForm(f=>({...f, username:e.target.value}))} placeholder="Username login..." className="w-full h-14 px-6 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold" disabled={!!selectedUser} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2">No. Telepon</label>
                    <input value={form.phone} onChange={(e)=>setForm(f=>({...f, phone:e.target.value}))} placeholder="08xxx..." className="w-full h-14 px-6 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2">Email (opsional)</label>
                    <input type="email" value={form.email} onChange={(e)=>setForm(f=>({...f, email:e.target.value}))} placeholder="email@email.com" className="w-full h-14 px-6 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2">Password {selectedUser ? 'Password Baru (Opsional)' : 'Password'}</label>
                    <input type="password" value={form.password} onChange={(e)=>setForm(f=>({...f, password:e.target.value}))} placeholder="********" className="w-full h-14 px-6 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2">Peran</label>
                    <select value={form.role} onChange={(e)=>setForm(f=>({...f, role:e.target.value as User['role']}))} className="w-full h-14 px-6 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold">
                      <option value="cashier">Kasir</option>
                      <option value="manager">Manajer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2 mb-2 block">Akses Cabang</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {stores.map(store => (
                    <div key={store.id} className="p-3 bg-accent/30 border border-border/30 rounded-2xl flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`store-${store.id}`}
                        checked={form.storeIds.includes(store.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm(f => ({ ...f, storeIds: [...f.storeIds, store.id] }));
                          } else {
                            setForm(f => ({ ...f, storeIds: f.storeIds.filter(id => id !== store.id) }));
                          }
                        }}
                        className="w-4 h-4 rounded-md text-primary focus:ring-primary"
                      />
                      <label htmlFor={`store-${store.id}`} className="text-sm font-medium cursor-pointer">{store.name}</label>
                    </div>
                  ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-4 border-t border-border/40 pt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-accent/50 border border-border/40 font-black text-sm uppercase tracking-widest hover:bg-accent transition-all active:scale-95">
                    Batal
                  </button>
                  <button type="button" onClick={handleSave} className="flex-[2] py-4 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
                    <Save size={20} strokeWidth={2.5} /> Simpan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}