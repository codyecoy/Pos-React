import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Category, Product, Supplier, PurchaseOrder } from '@/types'
import { productsRepo } from '@/repositories/productsRepo'
import { purchasesRepo } from '@/repositories/purchasesRepo'
import { categoriesRepo } from '@/repositories/categoriesRepo'
import { db } from '@/lib/db'
import { createId } from '@/lib/ids'

interface InventoryState {
  categories: Category[]
  products: Product[]
  suppliers: Supplier[]
  purchases: PurchaseOrder[]

  isHydrated: boolean
  hydrate: () => void

  addCategory: (name: string) => void
  renameCategory: (id: string, name: string) => void
  deleteCategory: (id: string) => void

  addProduct: (product: Product) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteProduct: (id: string) => void
  updateStock: (productId: string, quantityChange: number) => void

  addSupplier: (supplier: Supplier) => void
  updateSupplier: (id: string, updates: Partial<Supplier>) => void
  deleteSupplier: (id: string) => void

  addPurchase: (purchase: PurchaseOrder) => void
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      categories: [],
      products: [],
      suppliers: [],
      purchases: [],

      isHydrated: false,
      hydrate: () => {
        void (async () => {
          const categories = await categoriesRepo.listActive()
          const products = await productsRepo.listActive()
          const purchases = await purchasesRepo.list()
          const suppliers = (await db.suppliers.toArray())
            .filter((s: any) => !s?.deletedAt)
            .sort((a: any, b: any) => (b.updatedAt?.getTime?.() || 0) - (a.updatedAt?.getTime?.() || 0))
          set({ categories, products, suppliers, purchases, isHydrated: true })
        })()
      },

      addCategory: (name) => {
        void (async () => {
          const trimmed = name.trim()
          if (!trimmed) return
          await categoriesRepo.upsert({ id: trimmed, name: trimmed })
          set({ categories: await categoriesRepo.listActive() })
        })()
      },

      renameCategory: (id, name) => {
        void (async () => {
          const trimmed = name.trim()
          if (!trimmed) return
          await categoriesRepo.rename(id, trimmed)
          set({ categories: await categoriesRepo.listActive() })
        })()
      },

      deleteCategory: (id) => {
        void (async () => {
          await categoriesRepo.softDelete(id)
          set({ categories: await categoriesRepo.listActive() })
        })()
      },

      addProduct: (product) => {
        void (async () => {
          await productsRepo.upsert(product)
          set({ products: await productsRepo.listActive() })
        })()
      },

      updateProduct: (id, updates) => {
        void (async () => {
          await productsRepo.update(id, updates)
          set({ products: await productsRepo.listActive() })
        })()
      },

      deleteProduct: (id) => {
        void (async () => {
          await productsRepo.softDelete(id)
          set({ products: await productsRepo.listActive() })
        })()
      },

      updateStock: (productId, quantityChange) => {
        void (async () => {
          await productsRepo.adjustStock(productId, quantityChange)
          set({ products: await productsRepo.listActive() })
        })()
      },

      addSupplier: (supplier) => {
        void (async () => {
          const t = new Date()
          const id = supplier.id || createId()

          const next: Supplier = {
            ...(supplier as any),
            id,
            totalPurchased: Number((supplier as any).totalPurchased || 0),
            createdAt: (supplier as any).createdAt || t,
            updatedAt: t,
            deletedAt: null,
            syncStatus: 'pending',
            syncVersion: ((supplier as any).syncVersion || 0) + 1,
          }

          await db.transaction('rw', db.suppliers, db.sync_queue, async () => {
            await db.suppliers.put(next as any)
            await db.sync_queue.add({
              id: createId(),
              entityType: 'supplier',
              entityId: id,
              action: 'upsert',
              status: 'pending',
              attemptCount: 0,
              nextAttemptAt: t,
              createdAt: t,
              updatedAt: t,
              deletedAt: null,
              syncStatus: 'pending',
              syncVersion: 1,
              lockedAt: null,
            })
          })

          const suppliers = (await db.suppliers.toArray())
            .filter((s: any) => !s?.deletedAt)
            .sort((a: any, b: any) => (b.updatedAt?.getTime?.() || 0) - (a.updatedAt?.getTime?.() || 0))
          set({ suppliers })
        })()
      },

      updateSupplier: (id, updates) => {
        void (async () => {
          const t = new Date()
          const current = await db.suppliers.get(id)
          if (!current) return

          const next: Supplier = {
            ...(current as any),
            ...(updates as any),
            id,
            updatedAt: t,
            deletedAt: null,
            syncStatus: 'pending',
            syncVersion: ((current as any).syncVersion || 0) + 1,
          }

          await db.transaction('rw', db.suppliers, db.sync_queue, async () => {
            await db.suppliers.put(next as any)
            await db.sync_queue.add({
              id: createId(),
              entityType: 'supplier',
              entityId: id,
              action: 'upsert',
              status: 'pending',
              attemptCount: 0,
              nextAttemptAt: t,
              createdAt: t,
              updatedAt: t,
              deletedAt: null,
              syncStatus: 'pending',
              syncVersion: 1,
              lockedAt: null,
            })
          })

          const suppliers = (await db.suppliers.toArray())
            .filter((s: any) => !s?.deletedAt)
            .sort((a: any, b: any) => (b.updatedAt?.getTime?.() || 0) - (a.updatedAt?.getTime?.() || 0))
          set({ suppliers })
        })()
      },

      deleteSupplier: (id) => {
        void (async () => {
          const t = new Date()
          const current = await db.suppliers.get(id)
          if (!current) return

          await db.transaction('rw', db.suppliers, db.sync_queue, async () => {
            await db.suppliers.put({
              ...(current as any),
              deletedAt: t,
              updatedAt: t,
              syncStatus: 'pending',
              syncVersion: ((current as any).syncVersion || 0) + 1,
            })
            await db.sync_queue.add({
              id: createId(),
              entityType: 'supplier',
              entityId: id,
              action: 'delete',
              status: 'pending',
              attemptCount: 0,
              nextAttemptAt: t,
              createdAt: t,
              updatedAt: t,
              deletedAt: null,
              syncStatus: 'pending',
              syncVersion: 1,
              lockedAt: null,
            })
          })

          const suppliers = (await db.suppliers.toArray())
            .filter((s: any) => !s?.deletedAt)
            .sort((a: any, b: any) => (b.updatedAt?.getTime?.() || 0) - (a.updatedAt?.getTime?.() || 0))
          set({ suppliers })
        })()
      },

      addPurchase: (purchase) => {
        void (async () => {
          await purchasesRepo.create(purchase)
          await purchasesRepo.applyToInventory(purchase)
          const products = await productsRepo.listActive()
          const purchases = await purchasesRepo.list()
          set({ products, purchases })
        })()
      },
    }),
    {
      name: 'pos-inventory-storage',
      partialize: () => ({}),
    }
  )
)
