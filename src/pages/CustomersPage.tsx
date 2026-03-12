import { useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Users,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import CustomerModal from '@/features/customers/components/CustomerModal'
import { toast } from 'sonner'
import { AnimatePresence } from 'framer-motion'

const MOCK_CUSTOMERS = [
  { id: '1', name: 'Andi Pratama', phone: '08123456789', email: 'andi@gmail.com', address: 'Jakarta Selatan', points: 1250, totalSpent: 2500000 },
  { id: '2', name: 'Siti Aminah', phone: '08987654321', email: 'siti@gmail.com', address: 'Bandung, Jawa Barat', points: 850, totalSpent: 1200000 },
  { id: '3', name: 'Budi Hartono', phone: '08112233445', email: 'budi@gmail.com', address: 'Surabaya, Jawa Timur', points: 3400, totalSpent: 5600000 },
]

export default function CustomersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS)
  const [searchQuery, setSearchQuery] = useState('')

  const handleAddCustomer = () => {
    setSelectedCustomer(null)
    setIsModalOpen(true)
  }

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer)
    setIsModalOpen(true)
  }

  const handleSaveCustomer = (formData: any) => {
    if (selectedCustomer) {
      setCustomers(customers.map(c => c.id === selectedCustomer.id ? { ...c, ...formData } : c))
      toast.success('Data pelanggan berhasil diperbarui!')
    } else {
      const newCustomer = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        points: 0,
        totalSpent: 0
      }
      setCustomers([newCustomer, ...customers])
      toast.success('Pelanggan baru berhasil ditambahkan!')
    }
    setIsModalOpen(false)
  }

  const handleDeleteCustomer = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data pelanggan ini?')) {
      setCustomers(customers.filter(c => c.id !== id))
      toast.error('Data pelanggan telah dihapus.')
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  )

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase flex items-center gap-4">
            <Users className="text-primary w-10 h-10 lg:w-12 lg:h-12" />
            Manajemen Pelanggan
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Kelola data member dan poin loyalitas.</p>
        </div>
        
        <button 
          onClick={handleAddCustomer}
          className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={22} strokeWidth={3} />
          TAMBAH PELANGGAN
        </button>
      </div>

      <div className="bg-card p-4 lg:p-6 rounded-[2.5rem] border border-border/40 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Cari nama atau nomor telepon..." 
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button className="flex items-center gap-2 px-5 py-4 rounded-2xl bg-accent/30 border border-border/40 font-bold text-sm hover:bg-accent transition-all w-full md:w-auto justify-center">
            <Filter size={18} />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto -mx-4 lg:-mx-6 px-4 lg:px-6 no-scrollbar">
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-black text-muted-foreground uppercase tracking-widest">
                <th className="pb-4 pl-6">Pelanggan</th>
                <th className="pb-4">Kontak</th>
                <th className="pb-4">Alamat</th>
                <th className="pb-4">Poin</th>
                <th className="pb-4">Total Belanja</th>
                <th className="pb-4 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="group bg-background hover:bg-accent/20 transition-all rounded-2xl shadow-sm border border-border/20">
                  <td className="py-4 pl-6 rounded-l-[1.5rem] border-y border-l border-border/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                        {customer.name.charAt(0)}
                      </div>
                      <span className="font-bold text-sm group-hover:text-primary transition-colors">{customer.name}</span>
                    </div>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <Phone size={12} className="text-muted-foreground" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                          <Mail size={10} />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground max-w-[150px] truncate">
                      <MapPin size={12} />
                      {customer.address}
                    </div>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <div className="flex items-center gap-2">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span className="font-black text-sm">{customer.points.toLocaleString('id-ID')}</span>
                    </div>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className="font-black text-sm text-primary">Rp {customer.totalSpent.toLocaleString('id-ID')}</span>
                  </td>
                  <td className="py-4 pr-6 rounded-r-[1.5rem] border-y border-r border-border/20 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditCustomer(customer)}
                        className="p-2.5 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="p-2.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Menampilkan <span className="text-foreground">1-{filteredCustomers.length}</span> dari <span className="text-foreground">{customers.length}</span> pelanggan
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl bg-accent text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30" disabled>
              <ChevronLeft size={20} />
            </button>
            <button className="w-10 h-10 rounded-xl font-bold text-sm bg-primary text-primary-foreground shadow-lg shadow-primary/20">1</button>
            <button className="p-2.5 rounded-xl bg-accent text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30" disabled>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CustomerModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveCustomer}
            customer={selectedCustomer}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
