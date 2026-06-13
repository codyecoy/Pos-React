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
  addStore: (store: Store) => void
  setStores: (stores: Store[]) => void
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
      login: (user, stores) => {
        const firstStore = stores[0] || null
        const tenantId = (user as any)?.tenantId || user?.id
        if (tenantId) localStorage.setItem('pos_tenant_id', String(tenantId))
        if (firstStore?.id) localStorage.setItem('pos_store_id', String(firstStore.id))
        set({
          user,
          stores,
          currentStore: firstStore,
          isLoggedIn: true,
        })
        window.location.reload()
      },
      logout: () => {
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('pos_tenant_id')
        localStorage.removeItem('pos_store_id')
        set({ user: null, currentStore: null, stores: [], isLoggedIn: false })
      },
      switchStore: (storeId) => {
        const store = get().stores.find(s => s.id === storeId)
        if (!store) return
        localStorage.setItem('pos_store_id', String(store.id))
        set({ currentStore: store })
        window.location.reload()
      },
      addStore: (store) => {
        const nextStores = [...get().stores, store]
        localStorage.setItem('pos_store_id', String(store.id))
        set({ stores: nextStores, currentStore: store })
        window.location.reload()
      },
      setStores: (stores) => {
        const current = get().currentStore
        const nextCurrent = current ? (stores.find((s) => s.id === current.id) || stores[0] || null) : (stores[0] || null)
        if (nextCurrent?.id) localStorage.setItem('pos_store_id', String(nextCurrent.id))
        set({ stores, currentStore: nextCurrent })
      },
    }),
    {
      name: 'pos-auth-storage',
    }
  )
)
