import { useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Package, 
  LayoutGrid, 
  List,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ProductModal from '@/features/products/components/ProductModal'
import { Product } from '@/types'
import { toast } from 'sonner'
import { AnimatePresence } from 'framer-motion'
import { useInventoryStore } from '@/store/useInventoryStore'

export default function ProductsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const { products, addProduct, updateProduct, deleteProduct } = useInventoryStore()

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setIsModalOpen(true)
  }

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleSaveProduct = (formData: Partial<Product>) => {
    if (selectedProduct) {
      updateProduct(selectedProduct.id, formData)
      toast.success('Produk berhasil diperbarui!')
    } else {
      const newProduct = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
      } as Product
      addProduct(newProduct)
      toast.success('Produk baru berhasil ditambahkan!')
    }
    setIsModalOpen(false)
  }

  const handleDeleteProduct = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      deleteProduct(id)
      toast.error('Produk telah dihapus.')
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase flex items-center gap-4">
            <Package className="text-primary w-10 h-10 lg:w-12 lg:h-12" />
            Manajemen Produk
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Kelola inventaris dan katalog produk Anda.</p>
        </div>
        
        <button 
          onClick={handleAddProduct}
          className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={22} strokeWidth={3} />
          TAMBAH PRODUK
        </button>
      </div>

      <div className="bg-card p-4 lg:p-6 rounded-[2.5rem] border border-border/40 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Cari nama produk, SKU, atau kategori..." 
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex items-center gap-2 px-5 py-4 rounded-2xl bg-accent/30 border border-border/40 font-bold text-sm hover:bg-accent transition-all flex-1 md:flex-none justify-center">
              <Filter size={18} />
              Filter
            </button>
            <div className="flex bg-accent/30 p-1.5 rounded-2xl border border-border/40">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 lg:-mx-6 px-4 lg:px-6 no-scrollbar">
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-black text-muted-foreground uppercase tracking-widest">
                <th className="pb-4 pl-6">Produk</th>
                <th className="pb-4">SKU</th>
                <th className="pb-4">Kategori</th>
                <th className="pb-4">Harga</th>
                <th className="pb-4">Stok</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="group bg-background hover:bg-accent/20 transition-all rounded-2xl shadow-sm border border-border/20">
                  <td className="py-4 pl-6 rounded-l-[1.5rem] border-y border-l border-border/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                        <img src={product.image || `https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=100&auto=format&fit=crop`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold text-sm group-hover:text-primary transition-colors">{product.name}</span>
                    </div>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{product.sku}</span>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className="px-3 py-1.5 rounded-full bg-accent text-[10px] font-bold uppercase tracking-wider">{product.category}</span>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className="font-black text-sm">Rp {product.price.toLocaleString('id-ID')}</span>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", product.stock < 15 ? "bg-destructive animate-pulse" : "bg-emerald-500")} />
                      <span className="font-bold text-sm">{product.stock}</span>
                    </div>
                  </td>
                  <td className="py-4 border-y border-border/20">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      product.status === 'Aktif' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {product.status}
                    </span>
                  </td>
                  <td className="py-4 pr-6 rounded-r-[1.5rem] border-y border-r border-border/20 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditProduct(product)}
                        className="p-2.5 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
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
            Menampilkan <span className="text-foreground">1-8</span> dari <span className="text-foreground">24</span> produk
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl bg-accent text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30" disabled>
              <ChevronLeft size={20} />
            </button>
            {[1, 2, 3].map((page) => (
              <button key={page} className={cn("w-10 h-10 rounded-xl font-bold text-sm transition-all", page === 1 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-accent text-muted-foreground")}>
                {page}
              </button>
            ))}
            <button className="p-2.5 rounded-xl bg-accent text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <ProductModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveProduct}
            product={selectedProduct}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
