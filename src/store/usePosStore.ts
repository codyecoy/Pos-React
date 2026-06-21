import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, CartItem, Transaction, Customer } from '@/types'
import { useSettingsStore } from './useSettingsStore'

interface PosState {
  cart: CartItem[]
  activeTransaction: Transaction | null
  selectedCustomer: Customer | null
  
  // Cart Actions
  addToCart: (product: Product) => void
  setCart: (items: CartItem[]) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateDiscount: (productId: string, discount: number) => void
  clearCart: () => void
  
  // Customer Actions
  setSelectedCustomer: (customer: Customer | null) => void
  
  // Transaction Actions
  setHold: () => void
  completePayment: (payment: Partial<Transaction>) => void
  
  // Calculated Values
  getSubtotal: () => number
  getTax: () => number
  getDiscountTotal: () => number
  getTotal: () => number
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      cart: [],
      activeTransaction: null,
      selectedCustomer: null,

      addToCart: (product) => {
        const { cart } = get()
        const existingItem = cart.find((item) => item.id === product.id)

        if (existingItem) {
          set({
            cart: cart.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          })
        } else {
          set({ cart: [...cart, { ...product, quantity: 1, discount: 0 }] })
        }
      },

      setCart: (items) => set({ cart: items }),

      removeFromCart: (productId) => {
        set({ cart: get().cart.filter((item) => item.id !== productId) })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeFromCart(productId)
          return
        }
        set({
          cart: get().cart.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          ),
        })
      },

      updateDiscount: (productId, discount) => {
        set({
          cart: get().cart.map((item) =>
            item.id === productId ? { ...item, discount } : item
          ),
        })
      },

      clearCart: () => set({ cart: [], selectedCustomer: null }),

      setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),

      setHold: () => {
        // Implement hold logic if needed
      },

      completePayment: (payment) => {
        // Implement completion logic
        set({ cart: [], selectedCustomer: null })
      },

      getSubtotal: () => {
        return get().cart.reduce(
          (total, item) => total + (item.price - item.discount) * item.quantity,
          0
        )
      },

      getTax: () => {
        const { useVAT, vatRate } = useSettingsStore.getState().storeSettings
        if (!useVAT) return 0
        return get().getSubtotal() * (vatRate / 100)
      },

      getDiscountTotal: () => {
        return get().cart.reduce(
          (total, item) => total + item.discount * item.quantity,
          0
        )
      },

      getTotal: () => {
        return get().getSubtotal() + get().getTax()
      },
    }),
    {
      name: 'pos-cart-storage',
    }
  )
)
