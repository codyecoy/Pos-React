import { useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Truck,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ShoppingBag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import SupplierModal from '@/features/suppliers/components/SupplierModal'
import { Supplier } from '@/types'
import { toast } from 'sonner'
import { AnimatePresence } from 'framer-motion'
import { useInventoryStore } from '@/store/useInventoryStore'

export default function SuppliersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useInventoryStore()

  const handleAddSupplier = () => {
    setSelectedSupplier(null)
    setIsModalOpen(true)
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsModalOpen(true)
  }

  const handleSaveSupplier = (formData: Partial<Supplier>) => {
    if (selectedSupplier) {
      updateSupplier(selectedSupplier.id, formData)
      toast.success('Data supplier berhasil diperbarui!')
    } else {
      const newSupplier = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        totalPurchased: 0
      } as Supplier
      addSupplier(newSupplier)
      toast.success('Supplier baru berhasil ditambahkan!')
    }
    setIsModalOpen(false)
  }

  const handleDeleteSupplier = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data supplier ini?')) {
      deleteSupplier(id)
      toast.error('Data supplier telah dihapus.')
    }
  }

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase flex items-center gap-4">
            <Truck className="text-primary w-10 h-10 lg:w-12 lg:h-12" />
            Manajemen Supplier
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Kelola daftar pemasok barang dan bahan baku.</p>
        </div>
        
        <button 
          onClick={handleAddSupplier}
          className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={22} strokeWidth={3} />
          TAMBAH SUPPLIER
        </button>
      </div>

      <div className="bg-card p-4 lg:p-6 rounded-[2.5rem] border border-border/40 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Cari nama supplier atau kategori..." 
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
                <th className="pb-4 pl-6">Supplier</th>
                <th className="pb-4">Kontak</th>
                <th className="pb-4">Kategori</th>
                <th className="pb-4">Total Pembelian</th>
                <th className="pb-4 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="group bg-background hover:bg-accent/20 transition-all rounded-2xl shadow-sm border border-border/20">
                  <td className="py-4 pl-6 rounded-l-[1.5rem] border-y border-l border-border/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                        <Truck size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm group-hover:text-primary transition-colors">{supplier.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          <MapPin size={10} />
                          {supplier.address}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <Phone size={12} className="text-muted-foreground" />
                        {supplier.phone}
                      </div>
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                          <Mail size={10} />
                          {supplier.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className="px-3 py-1.5 rounded-full bg-accent text-[10px] font-black uppercase tracking-wider">{supplier.category}</span>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className="font-black text-sm text-primary">Rp {supplier.totalPurchased.toLocaleString('id-ID')}</span>
                  </td>
                  <td className="py-4 pr-6 rounded-r-[1.5rem] border-y border-r border-border/20 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditSupplier(supplier)}
                        className="p-2.5 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteSupplier(supplier.id)}
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
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <SupplierModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveSupplier}
            supplier={selectedSupplier}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
