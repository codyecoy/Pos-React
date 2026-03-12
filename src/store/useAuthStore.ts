import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Store } from '@/types'

interface AuthState {
  user: User | null
  currentStore: Store | null
  stores: Store[]
  isLoggedIn: boolean
  login: (user: User, stores: Store[]) => void
  logout: () => void
  switchStore: (storeId: string) => void
}

const MOCK_STORES: Store[] = [
  { id: 'S1', name: 'Cabang Jakarta Selatan', address: 'Jl. Sudirman No. 10', phone: '021-1234567' },
  { id: 'S2', name: 'Cabang Bandung', address: 'Jl. Asia Afrika No. 45', phone: '022-7654321' },
]

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      currentStore: null,
      stores: [],
      isLoggedIn: false,
      login: (user, stores) => set({ 
        user, 
        stores, 
        currentStore: stores[0] || null, 
        isLoggedIn: true 
      }),
      logout: () => {
        localStorage.removeItem('isLoggedIn')
        set({ user: null, currentStore: null, stores: [], isLoggedIn: false })
      },
      switchStore: (storeId) => {
        const store = get().stores.find(s => s.id === storeId)
        if (store) set({ currentStore: store })
      },
    }),
    {
      name: 'pos-auth-storage',
    }
  )
)
