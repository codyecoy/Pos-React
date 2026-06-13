import { 
  X, 
  Save, 
  Package, 
  Tag, 
  Hash, 
  BarChart3,
  Image as ImageIcon
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Product } from '@/types'
import { cn } from '@/lib/utils'
import { useInventoryStore } from '@/store/useInventoryStore'
import ComboBox from '@/components/ui/ComboBox'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (product: Partial<Product>) => void
  product?: Product | null
}

export default function ProductModal({ isOpen, onClose, onSave, product }: ProductModalProps) {
  const categories = useInventoryStore((s) => s.categories)
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    category: '',
    sku: '',
    barcode: '',
    image: ''
  })

  useEffect(() => {
    if (product) {
      setFormData(product)
    } else {
      setFormData({
        name: '',
        price: 0,
        costPrice: 0,
        stock: 0,
        category: categories[0]?.id || '',
        sku: '',
        barcode: '',
        image: ''
      })
    }
  }, [product, isOpen, categories])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setFormData((prev) => ({ ...prev, image: result }))
    }
    reader.readAsDataURL(file)
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
        className="relative w-full max-w-4xl bg-card rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Left: Image Upload & Preview */}
        <div className="w-full md:w-[320px] bg-accent/20 p-8 border-b md:border-b-0 md:border-r border-border/40 flex flex-col">
          <h3 className="font-black text-xl tracking-tight uppercase mb-8">Foto Produk</h3>
          
          <div className="flex-1 flex flex-col gap-6">
            <div className="aspect-square w-full rounded-[2rem] bg-background border-2 border-dashed border-border/60 flex flex-col items-center justify-center text-muted-foreground group hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden">
              {formData.image ? (
                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <ImageIcon size={48} strokeWidth={1.5} className="mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold uppercase tracking-widest">Upload Gambar</p>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            
            <p className="text-xs font-medium text-muted-foreground leading-relaxed text-center px-4">
              Gunakan gambar berkualitas tinggi dengan format .jpg atau .png (Max 2MB)
            </p>
          </div>
        </div>

        {/* Right: Form Details */}
        <div className="flex-1 p-8 lg:p-12 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-2xl tracking-tight uppercase">
              {product ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-all">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Nama Produk</label>
                <div className="relative group">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    required
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold"
                    placeholder="Masukkan nama produk..."
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Kategori</label>
                <div className="relative group">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <ComboBox
                    value={formData.category || ''}
                    onChange={(v) => setFormData({ ...formData, category: v })}
                    options={categories.map((c) => ({ value: c.id, label: c.name }))}
                    placeholder={categories.length === 0 ? 'Belum ada kategori' : 'Pilih kategori'}
                    searchPlaceholder="Cari kategori..."
                    emptyText="Kategori tidak ditemukan."
                    disabled={categories.length === 0}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">SKU / Kode</label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary" />
                  <input 
                    type="text" 
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold"
                    placeholder="Contoh: FOD-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Harga Beli</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground">Rp</span>
                  <input 
                    type="number" 
                    required
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold"
                    placeholder="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({...formData, costPrice: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Harga Jual</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary">Rp</span>
                  <input 
                    type="number" 
                    required
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold text-primary"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Stok Awal</label>
                <div className="relative group">
                  <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary" />
                  <input 
                    type="number" 
                    required
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Barcode</label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary" />
                  <input 
                    type="text" 
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold"
                    placeholder="Scan atau input manual..."
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                  />
                </div>
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
                Simpan Produk
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
