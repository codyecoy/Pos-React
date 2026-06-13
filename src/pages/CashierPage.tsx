import { useState, useMemo, useEffect, useRef } from 'react'
import ProductGrid from '@/features/cashier/components/ProductGrid'
import CartPanel from '@/features/cashier/components/CartPanel'
import CategoryFilter from '@/features/cashier/components/CategoryFilter'
import { Product } from '@/types'
import { Search, SlidersHorizontal, Barcode, Keyboard } from 'lucide-react'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { usePosStore } from '@/store/usePosStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm'

export default function CashierPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const { cart, addToCart, clearCart } = usePosStore()
  const { products } = useInventoryStore()
  const confirm = useConfirm()

  // Barcode scanning logic (simulated for keyboard-based scanners)
  const barcodeBuffer = useRef<string>('')
  const lastKeyTime = useRef<number>(0)

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Barcode scanners are fast, check for rapid key presses
      const now = Date.now()
      if (now - lastKeyTime.current > 50) {
        barcodeBuffer.current = '' // Reset if too slow (likely manual typing)
      }
      lastKeyTime.current = now

      // Collect alphanumeric keys
      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        barcodeBuffer.current += e.key
      }

      // Enter usually signals the end of a scan
      if (e.key === 'Enter' && barcodeBuffer.current.length >= 3) {
        const barcode = barcodeBuffer.current
        const product = products.find(p => p.barcode === barcode || p.sku === barcode)
        
        if (product) {
          addToCart(product)
          toast.success(`Berhasil menambahkan ${product.name}`, {
            icon: <Barcode size={16} />,
            duration: 1500
          })
          barcodeBuffer.current = ''
          e.preventDefault() // Stop further processing of Enter
        } else {
          barcodeBuffer.current = ''
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [addToCart, products])

  useKeyboardShortcuts({
    onSearch: () => searchInputRef.current?.focus(),
    onClear: () => {
      if (cart.length === 0) return
      void (async () => {
        const ok = await confirm({
          title: 'Kosongkan Keranjang',
          description: 'Kosongkan semua item di keranjang?',
          confirmText: 'Kosongkan',
          cancelText: 'Batal',
          destructive: true,
        })
        if (!ok) return
        clearCart()
      })()
    }
  })

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.barcode.includes(searchQuery)
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery, products])

  return (
    <div className="flex h-[calc(100vh-theme(spacing.20))] lg:h-[calc(100vh-theme(spacing.24))] overflow-hidden -m-4 tablet:-m-6">
      {/* Left Column: Product Selection */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/50">
        {/* Search and Filter Bar */}
        <div className="p-6 lg:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Cari produk (/) atau scan barcode..." 
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card border-none shadow-sm ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium placeholder:text-muted-foreground/60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-accent text-primary transition-all">
                <Barcode size={22} />
              </button>
            </div>
            
            <button className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center text-muted-foreground border border-border/40 hover:bg-accent transition-all shadow-sm">
              <SlidersHorizontal size={22} />
            </button>
          </div>

          <CategoryFilter 
            selectedCategory={selectedCategory} 
            onSelectCategory={setSelectedCategory} 
          />
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-8 pb-8 no-scrollbar">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-black text-2xl tracking-tight text-foreground/90 uppercase">
              {selectedCategory === 'all' ? 'Semua Produk' : selectedCategory}
              <span className="ml-3 text-sm font-bold text-muted-foreground lowercase">
                ({filteredProducts.length} item)
              </span>
            </h2>
            
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div className="w-2 h-2 rounded-full bg-border" />
              <div className="w-2 h-2 rounded-full bg-border" />
            </div>
          </div>
          
          <ProductGrid products={filteredProducts} isLoading={isLoading} />
        </div>
      </div>

      {/* Right Column: Cart Panel */}
      <div className="w-[380px] lg:w-[450px] xl:w-[500px] flex-shrink-0">
        <CartPanel />
      </div>
    </div>
  )
}
