import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, Supplier, PurchaseOrder } from '@/types'

interface InventoryState {
  products: Product[]
  suppliers: Supplier[]
  purchases: PurchaseOrder[]
  
  // Product Actions
  setProducts: (products: Product[]) => void
  addProduct: (product: Product) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteProduct: (id: string) => void
  updateStock: (productId: string, quantityChange: number) => void

  // Supplier Actions
  setSuppliers: (suppliers: Supplier[]) => void
  addSupplier: (supplier: Supplier) => void
  updateSupplier: (id: string, updates: Partial<Supplier>) => void
  deleteSupplier: (id: string) => void

  // Purchase Actions
  addPurchase: (purchase: PurchaseOrder) => void
}

const DEFAULT_PRODUCTS: Product[] = [
  { id: '1', name: 'Cappuccino XL Premium', price: 35000, costPrice: 15000, stock: 45, category: 'Minuman', sku: 'DRK-001', barcode: '123', image: '' },
  { id: '2', name: 'Rendang Sapi Spesial', price: 45000, costPrice: 20000, stock: 12, category: 'Makanan', sku: 'FOD-001', barcode: '124', image: '' },
  { id: '3', name: 'Matcha Latte Green Tea', price: 28000, costPrice: 12000, stock: 30, category: 'Minuman', sku: 'DRK-002', barcode: '125', image: '' },
  { id: '4', name: 'Nasi Goreng Seafood', price: 38000, costPrice: 18000, stock: 8, category: 'Makanan', sku: 'FOD-002', barcode: '126', image: '' },
  { id: '5', name: 'iPhone 15 Pro Case', price: 150000, costPrice: 80000, stock: 25, category: 'Elektronik', sku: 'ELC-001', barcode: '127', image: '' },
  { id: '6', name: 'Cotton T-Shirt Basic', price: 85000, costPrice: 40000, stock: 50, category: 'Fashion', sku: 'FSH-001', barcode: '128', image: '' },
]

const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: 'S1', name: 'PT. Sumber Makmur', phone: '08123456789', email: 'contact@sumbermakmur.com', address: 'Kawasan Industri Jababeka, Cikarang', category: 'Bahan Baku', totalPurchased: 15000000 },
  { id: 'S2', name: 'CV. Tirta Segar', phone: '08987654321', email: 'sales@tirtasegar.com', address: 'Jl. Raya Bogor KM 24, Jakarta Timur', category: 'Minuman Kemasan', totalPurchased: 8500000 },
]

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      products: DEFAULT_PRODUCTS,
      suppliers: DEFAULT_SUPPLIERS,
      purchases: [],

      setProducts: (products) => set({ products }),
      addProduct: (product) => set((state) => ({ products: [product, ...state.products] })),
      updateProduct: (id, updates) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),
      updateStock: (productId, quantityChange) => set((state) => ({
        products: state.products.map(p => p.id === productId ? { ...p, stock: p.stock + quantityChange } : p)
      })),

      setSuppliers: (suppliers) => set({ suppliers }),
      addSupplier: (supplier) => set((state) => ({ suppliers: [supplier, ...state.suppliers] })),
      updateSupplier: (id, updates) => set((state) => ({
        suppliers: state.suppliers.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      deleteSupplier: (id) => set((state) => ({
        suppliers: state.suppliers.filter(s => s.id !== id)
      })),

      addPurchase: (purchase) => set((state) => {
        // Also update stock for each item in the purchase
        const updatedProducts = state.products.map(p => {
          const purchaseItem = purchase.items.find(item => item.productId === p.id)
          if (purchaseItem) {
            return { ...p, stock: p.stock + purchaseItem.quantity, costPrice: purchaseItem.costPrice }
          }
          return p
        })

        return {
          purchases: [purchase, ...state.purchases],
          products: updatedProducts
        }
      }),
    }),
    {
      name: 'pos-inventory-storage',
    }
  )
)
