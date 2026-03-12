import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Save,
  CreditCard
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  points: number
  totalSpent: number
}

interface CustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (customer: Partial<Customer>) => void
  customer?: Customer | null
}

export default function CustomerModal({ isOpen, onClose, onSave, customer }: CustomerModalProps) {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    points: 0
  })

  useEffect(() => {
    if (customer) {
      setFormData(customer)
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        points: 0
      })
    }
  }, [customer, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-card rounded-[3rem] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-8 lg:p-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-2xl tracking-tight uppercase">
              {customer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
            </h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-all">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Nama Lengkap</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  required
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold"
                  placeholder="Masukkan nama pelanggan..."
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">No. Telepon</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary" />
                  <input 
                    type="tel" 
                    required
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold"
                    placeholder="0812..."
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Email (Opsional)</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary" />
                  <input 
                    type="email" 
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold"
                    placeholder="email@pelanggan.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Alamat</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-4 text-muted-foreground w-5 h-5 group-focus-within:text-primary" />
                <textarea 
                  className="w-full h-24 pl-12 pr-4 py-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold resize-none"
                  placeholder="Masukkan alamat lengkap..."
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-5 rounded-[2rem] bg-accent/50 border border-border/40 font-black text-sm uppercase tracking-widest hover:bg-accent transition-all active:scale-95"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="flex-[2] py-5 rounded-[2rem] bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95"
              >
                <Save size={20} strokeWidth={2.5} />
                Simpan Pelanggan
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
