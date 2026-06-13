import { useMemo, useRef, useState } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Tag,
  X,
  Edit, 
  Trash2, 
  MessageCircle,
  Package, 
  LayoutGrid, 
  List,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  Upload,
  Database
} from 'lucide-react'
import { cn, shareToWhatsApp } from '@/lib/utils'
import ProductModal from '@/features/products/components/ProductModal'
import { Category, Product } from '@/types'
import { createId } from '@/lib/ids'
import { toast } from 'sonner'
import { AnimatePresence } from 'framer-motion'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useConfirm } from '@/components/ui/confirm'
import * as XLSX from 'xlsx'
import { db } from '@/lib/db'
import { categoriesRepo } from '@/repositories/categoriesRepo'
import { productsRepo } from '@/repositories/productsRepo'
import { masterApi } from '@/services/api'

export default function ProductsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryEdits, setCategoryEdits] = useState<Record<string, string>>({})
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importMode, setImportMode] = useState<'xls' | 'master'>('xls')
  const [masterSegment, setMasterSegment] = useState<'kelontong' | 'cafe' | 'coffee'>('kelontong')
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  const { categories, products, addProduct, updateProduct, deleteProduct, addCategory, renameCategory, deleteCategory } = useInventoryStore()
  const confirm = useConfirm()
  const pageSize = 10
  const fallbackImage = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#cbd5e1"/></linearGradient></defs><rect width="120" height="120" rx="16" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#334155" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="700">PRODUK</text></svg>`
  )}`

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => {
      const name = (p.name || '').toLowerCase()
      const sku = (p.sku || '').toLowerCase()
      const category = (p.category || '').toLowerCase()
      const barcode = (p.barcode || '').toLowerCase()
      return name.includes(q) || sku.includes(q) || category.includes(q) || barcode.includes(q)
    })
  }, [products, searchQuery])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, total)
  const paged = useMemo(() => filtered.slice(startIndex, endIndex), [filtered, startIndex, endIndex])

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
        id: createId(),
        status: (formData as any).status || 'Aktif',
      } as Product
      addProduct(newProduct)
      toast.success('Produk baru berhasil ditambahkan!')
    }
    setIsModalOpen(false)
  }

  const handleDeleteProduct = (id: string) => {
    void (async () => {
      const ok = await confirm({
        title: 'Hapus Produk',
        description: 'Apakah Anda yakin ingin menghapus produk ini?',
        confirmText: 'Hapus',
        cancelText: 'Batal',
        destructive: true,
      })
      if (!ok) return
      deleteProduct(id)
      toast.error('Produk telah dihapus.')
    })()
  }

  const handleShareProduct = (product: Product) => {
    const text =
      `Info Produk\n` +
      `Nama: ${product.name}\n` +
      `Harga: Rp ${product.price.toLocaleString('id-ID')}\n` +
      `Stok: ${product.stock}\n` +
      `Kategori: ${product.category}\n` +
      `SKU: ${product.sku}\n` +
      `Barcode: ${product.barcode}`

    shareToWhatsApp(text)
  }

  const handleOpenCategoryModal = () => {
    const initial: Record<string, string> = {}
    for (const c of categories) initial[c.id] = c.name
    setCategoryEdits(initial)
    setNewCategoryName('')
    setIsCategoryModalOpen(true)
  }

  const handleAddCategory = () => {
    const name = newCategoryName.trim()
    if (!name) return
    addCategory(name)
    setNewCategoryName('')
    toast.success('Kategori ditambahkan.')
  }

  const handleRenameCategory = (id: string) => {
    const nextName = (categoryEdits[id] || '').trim()
    if (!nextName) return
    renameCategory(id, nextName)
    toast.success('Kategori diperbarui.')
  }

  const handleDeleteCategory = (c: Category) => {
    void (async () => {
      const ok = await confirm({
        title: 'Hapus Kategori',
        description: `Hapus kategori "${c.name}"?`,
        confirmText: 'Hapus',
        cancelText: 'Batal',
        destructive: true,
      })
      if (!ok) return
      deleteCategory(c.id)
      toast.error('Kategori dihapus.')
    })()
  }

  const parseNumber = (v: any) => {
    if (v === null || v === undefined) return 0
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0
    const s = String(v).trim()
    if (!s) return 0
    const cleaned = s.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : 0
  }

  const normalizeKey = (k: string) => k.trim().toLowerCase().replace(/\s+/g, '')

  const downloadTemplateXls = () => {
    const wb = XLSX.utils.book_new()

    const kategori = [
      { id: 'Makanan', name: 'Makanan', icon: 'Utensils' },
      { id: 'Minuman', name: 'Minuman', icon: 'Coffee' },
    ]
    const wsKategori = XLSX.utils.json_to_sheet(kategori)
    XLSX.utils.book_append_sheet(wb, wsKategori, 'kategori')

    const masterProduk = [
      {
        name: 'Contoh Produk',
        category: 'Makanan',
        sku: 'SKU-001',
        barcode: '1234567890',
        price: 10000,
        costPrice: 7000,
        stock: 0,
        image: '',
        status: 'Aktif',
      },
    ]
    const wsProduk = XLSX.utils.json_to_sheet(masterProduk)
    XLSX.utils.book_append_sheet(wb, wsProduk, 'master_produk')

    const array = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([array], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_import_produk.xlsx'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const importProducts = async (rows: Array<Partial<Product>>, sourceLabel: string) => {
    const cleaned = rows
      .map((r) => ({
        name: String(r.name || '').trim(),
        category: String(r.category || '').trim(),
        sku: String(r.sku || '').trim(),
        barcode: String(r.barcode || '').trim(),
        image: String(r.image || '').trim(),
        price: parseNumber((r as any).price),
        costPrice: parseNumber((r as any).costPrice),
        stock: Math.max(0, Math.floor(parseNumber((r as any).stock))),
        status: (r as any).status || 'Aktif',
      }))
      .filter((r) => !!r.name)

    if (cleaned.length === 0) {
      toast.error('Data produk kosong / format tidak cocok.')
      return
    }

    const ok = await confirm({
      title: 'Import Produk',
      description: `Import ${cleaned.length} produk dari ${sourceLabel}? Produk dengan SKU/Barcode sama akan di-update.`,
      confirmText: 'Import',
      cancelText: 'Batal',
    })
    if (!ok) return

    setIsImporting(true)
    try {
      const existing = await db.products.filter((p) => !p.deletedAt).toArray()
      const bySku = new Map<string, string>()
      const byBarcode = new Map<string, string>()
      for (const p of existing) {
        const sku = String(p.sku || '').trim().toLowerCase()
        const bc = String(p.barcode || '').trim().toLowerCase()
        if (sku) bySku.set(sku, p.id)
        if (bc) byBarcode.set(bc, p.id)
      }

      const categorySet = new Set(categories.map((c) => String(c.name || c.id).trim().toLowerCase()))
      const missingCategories = new Set<string>()
      for (const r of cleaned) {
        const c = String(r.category || '').trim()
        if (!c) continue
        const key = c.toLowerCase()
        if (!categorySet.has(key)) missingCategories.add(c)
      }

      for (const c of missingCategories) {
        await categoriesRepo.upsert({ id: c, name: c } as any)
      }

      let createdCount = 0
      let updatedCount = 0
      for (const r of cleaned) {
        const skuKey = String(r.sku || '').trim().toLowerCase()
        const bcKey = String(r.barcode || '').trim().toLowerCase()
        const existingId = (skuKey && bySku.get(skuKey)) || (bcKey && byBarcode.get(bcKey)) || ''

        if (existingId) {
          await productsRepo.update(existingId, {
            name: r.name!,
            category: r.category || '',
            sku: r.sku || '',
            barcode: r.barcode || '',
            image: r.image || '',
            price: Number(r.price || 0),
            costPrice: Number(r.costPrice || 0),
            stock: Number.isFinite(Number(r.stock)) ? Number(r.stock) : 0,
            status: (r as any).status || 'Aktif',
          } as any)
          updatedCount += 1
        } else {
          const id = createId()
          await productsRepo.upsert({
            id,
            name: r.name!,
            category: r.category || '',
            sku: r.sku || '',
            barcode: r.barcode || '',
            image: r.image || '',
            price: Number(r.price || 0),
            costPrice: Number(r.costPrice || 0),
            stock: Number.isFinite(Number(r.stock)) ? Number(r.stock) : 0,
            status: (r as any).status || 'Aktif',
          } as any)
          createdCount += 1
        }
      }

      await useInventoryStore.getState().hydrate()
      toast.success(`Import selesai: ${createdCount} baru, ${updatedCount} update.`)
      setIsImportOpen(false)
    } catch (e: any) {
      const msg = e?.message || 'Gagal import produk.'
      toast.error(String(msg))
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportXls = async (file: File) => {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })

    const sheetNames = workbook.SheetNames || []
    const normalized = sheetNames.map((s) => ({ raw: s, key: normalizeKey(s) }))

    const kategoriSheetName =
      normalized.find((s) => ['kategori', 'category', 'categories'].includes(s.key))?.raw || ''
    const produkSheetName =
      normalized.find((s) => ['masterproduk', 'master_produk', 'produk', 'product', 'products', 'masterproducts'].includes(s.key))?.raw ||
      normalized.find((s) => s.key.includes('produk') || s.key.includes('product'))?.raw ||
      sheetNames[0]

    if (kategoriSheetName) {
      const sheet = workbook.Sheets[kategoriSheetName]
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })
      const rows = json
        .map((r) => ({
          id: String((r as any).id ?? (r as any).ID ?? (r as any).Id ?? '').trim(),
          name: String((r as any).name ?? (r as any).Nama ?? (r as any).nama ?? '').trim(),
          icon: String((r as any).icon ?? (r as any).Icon ?? '').trim(),
        }))
        .filter((r) => !!r.id && !!r.name)

      for (const c of rows) {
        await categoriesRepo.upsert({ id: c.id, name: c.name, icon: c.icon } as any)
      }
    }

    const headerMap: Record<string, keyof Product> = {
      nama: 'name',
      name: 'name',
      produk: 'name',

      kategori: 'category',
      category: 'category',

      harga: 'price',
      price: 'price',
      hargajual: 'price',

      modal: 'costPrice',
      hargabeli: 'costPrice',
      costprice: 'costPrice',

      stok: 'stock',
      stock: 'stock',

      sku: 'sku',
      barcode: 'barcode',

      gambar: 'image',
      image: 'image',
    }

    const sheet = workbook.Sheets[produkSheetName]
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })
    const rows: Array<Partial<Product>> = []
    for (const r of json) {
      const out: any = {}
      for (const [k, v] of Object.entries(r)) {
        const key = normalizeKey(k)
        const mapped = headerMap[key]
        if (!mapped) continue
        out[mapped] = v
      }
      rows.push(out)
    }

    await importProducts(rows, `file ${file.name}`)
  }

  const handleImportMaster = async () => {
    setIsImporting(true)
    try {
      const res = await masterApi.productsBySegment(masterSegment)
      const list = Array.isArray(res.data) ? res.data : []
      const rows: Array<Partial<Product>> = list.map((p: any) => ({
        name: p.name,
        category: p.category,
        sku: p.sku,
        barcode: p.barcode,
        image: p.image,
        price: Number(p.price || 0),
        costPrice: Number(p.costPrice || 0),
        stock: 0,
        status: 'Aktif',
      }))
      await importProducts(rows, `Master Global (${masterSegment})`)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Gagal ambil master global.'
      toast.error(String(msg))
    } finally {
      setIsImporting(false)
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
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenCategoryModal}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-accent/40 border border-border/40 font-black text-base hover:bg-accent transition-all active:scale-95"
          >
            <Tag size={22} strokeWidth={3} />
            KATEGORI
          </button>
          <button
            onClick={() => {
              setIsImportOpen(true)
              setImportMode('xls')
            }}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-accent/40 border border-border/40 font-black text-base hover:bg-accent transition-all active:scale-95"
          >
            <Upload size={22} strokeWidth={3} />
            IMPORT
          </button>
          <button 
            onClick={handleAddProduct}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={22} strokeWidth={3} />
            TAMBAH PRODUK
          </button>
        </div>
      </div>

      <div className="bg-card p-4 lg:p-6 rounded-[2.5rem] border border-border/40 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Cari nama produk, SKU, atau kategori..." 
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
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
              {paged.map((product) => {
                const status = product.status || 'Aktif'
                return (
                <tr key={product.id} className="group bg-background hover:bg-accent/20 transition-all rounded-2xl shadow-sm border border-border/20">
                  <td className="py-4 pl-6 rounded-l-[1.5rem] border-y border-l border-border/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                        <img
                          src={product.image || fallbackImage}
                          alt=""
                          onError={(e) => {
                            const img = e.currentTarget
                            if (img.src !== fallbackImage) img.src = fallbackImage
                          }}
                          className="w-full h-full object-cover"
                        />
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
                      status === 'Aktif' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {status}
                    </span>
                  </td>
                  <td className="py-4 pr-6 rounded-r-[1.5rem] border-y border-r border-border/20 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleShareProduct(product)}
                        className="p-2.5 rounded-xl hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 transition-all"
                        title="Kirim via WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </button>
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
              )})}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Menampilkan <span className="text-foreground">{total === 0 ? 0 : startIndex + 1}-{endIndex}</span> dari <span className="text-foreground">{total}</span> produk
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2.5 rounded-xl bg-accent text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30"
              disabled={safePage <= 1}
            >
              <ChevronLeft size={20} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, safePage - 2), Math.max(0, safePage - 2) + 3)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-10 h-10 rounded-xl font-bold text-sm transition-all",
                    p === safePage ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2.5 rounded-xl bg-accent text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30"
              disabled={safePage >= totalPages}
            >
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

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          void (async () => {
            try {
              await handleImportXls(file)
            } catch (err: any) {
              toast.error(String(err?.message || 'Gagal membaca file.'))
            }
          })()
        }}
      />

      <AnimatePresence>
        {isImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isImporting && setIsImportOpen(false)} />
            <div className="relative w-full max-w-2xl bg-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-border/40">
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Import Produk</p>
                    <p className="text-xl font-black tracking-tight">Ambil dari XLS atau Master Global</p>
                  </div>
                  <button
                    onClick={() => setIsImportOpen(false)}
                    className="p-2 rounded-xl hover:bg-accent transition-all"
                    disabled={isImporting}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex gap-2 bg-accent/30 p-2 rounded-2xl border border-border/40">
                  <button
                    onClick={() => setImportMode('xls')}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all",
                      importMode === 'xls' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                    disabled={isImporting}
                  >
                    XLS/XLSX
                  </button>
                  <button
                    onClick={() => setImportMode('master')}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all",
                      importMode === 'master' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                    disabled={isImporting}
                  >
                    Master Global
                  </button>
                </div>

                {importMode === 'xls' ? (
                  <div className="space-y-4">
                    <div className="bg-accent/20 border border-border/30 rounded-2xl p-5">
                      <p className="text-sm font-bold">Template XLS (2 sheet)</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sheet 1: kategori | Sheet 2: master_produk
                      </p>
                    </div>
                    <button
                      onClick={downloadTemplateXls}
                      className="w-full py-4 rounded-2xl bg-accent/30 border border-border/40 font-black text-sm uppercase tracking-widest hover:bg-accent transition-all active:scale-95"
                      disabled={isImporting}
                    >
                      Download Template
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95",
                        isImporting ? "bg-muted text-muted-foreground cursor-wait" : "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                      )}
                      disabled={isImporting}
                    >
                      <Upload size={18} />
                      {isImporting ? 'Mengimport...' : 'Pilih File XLS/XLSX'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        onClick={() => setMasterSegment('kelontong')}
                        className={cn(
                          "py-4 rounded-2xl border border-border/40 font-black text-sm uppercase tracking-widest transition-all",
                          masterSegment === 'kelontong' ? "bg-primary text-primary-foreground" : "bg-accent/30 hover:bg-accent"
                        )}
                        disabled={isImporting}
                      >
                        Kelontong
                      </button>
                      <button
                        onClick={() => setMasterSegment('cafe')}
                        className={cn(
                          "py-4 rounded-2xl border border-border/40 font-black text-sm uppercase tracking-widest transition-all",
                          masterSegment === 'cafe' ? "bg-primary text-primary-foreground" : "bg-accent/30 hover:bg-accent"
                        )}
                        disabled={isImporting}
                      >
                        Cafe
                      </button>
                      <button
                        onClick={() => setMasterSegment('coffee')}
                        className={cn(
                          "py-4 rounded-2xl border border-border/40 font-black text-sm uppercase tracking-widest transition-all",
                          masterSegment === 'coffee' ? "bg-primary text-primary-foreground" : "bg-accent/30 hover:bg-accent"
                        )}
                        disabled={isImporting}
                      >
                        Coffee
                      </button>
                    </div>

                    <button
                      onClick={() => void handleImportMaster()}
                      className={cn(
                        "w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95",
                        isImporting ? "bg-muted text-muted-foreground cursor-wait" : "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                      )}
                      disabled={isImporting}
                    >
                      <Database size={18} />
                      {isImporting ? 'Mengambil...' : `Import Master (${masterSegment})`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
          <div
            onClick={() => setIsCategoryModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-3xl bg-card rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-6 lg:p-8 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="font-black text-xl tracking-tight uppercase">Master Kategori</h3>
                <p className="text-sm font-medium text-muted-foreground mt-1">Kategori disimpan di local DB dan dipakai oleh Produk & Kasir.</p>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 rounded-xl hover:bg-accent transition-all"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 lg:p-8 space-y-6">
              <div className="flex gap-3">
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nama kategori baru..."
                  className="flex-1 h-12 px-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-bold"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-5 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
                >
                  Tambah
                </button>
              </div>

              <div className="space-y-3 max-h-[55vh] overflow-y-auto no-scrollbar pr-1">
                {categories.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-accent/20 text-center text-sm font-bold text-muted-foreground">
                    Belum ada kategori.
                  </div>
                ) : (
                  categories.map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl bg-background border border-border/30 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <Tag size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ID</div>
                        <div className="text-sm font-black">{c.id}</div>
                      </div>
                      <div className="flex-[2]">
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nama</div>
                        <input
                          value={categoryEdits[c.id] ?? c.name}
                          onChange={(e) => setCategoryEdits((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          className="w-full h-10 px-3 rounded-xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-bold"
                        />
                      </div>
                      <button
                        onClick={() => handleRenameCategory(c.id)}
                        className="px-4 h-10 rounded-xl bg-primary/10 text-primary font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(c)}
                        className="p-2.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
