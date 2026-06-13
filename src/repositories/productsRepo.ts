import { db } from '@/lib/db'
import { createId } from '@/lib/ids'
import { Product, SyncAction, SyncEntityType } from '@/types'

function now() {
  return new Date()
}

async function enqueue(entityType: SyncEntityType, entityId: string, action: SyncAction) {
  const t = now()
  await db.sync_queue.add({
    id: createId(),
    entityType,
    entityId,
    action,

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
}

export const productsRepo = {
  async seedIfEmpty(defaultProducts: Product[]) {
    const count = await db.products.count()
    if (count > 0) return

    const t = now()

    await db.products.bulkPut(
      defaultProducts.map((p) => ({
        ...p,
        createdAt: t,
        updatedAt: t,
        deletedAt: null,
        syncStatus: 'pending',
        syncVersion: 1,
      }))
    )

    for (const p of defaultProducts) {
      await enqueue('product', p.id, 'upsert')
    }
  },

  async listActive() {
    const rows = await db.products.filter((p) => !p.deletedAt).toArray()
    return rows.sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
  },

  async upsert(input: Product) {
    const t = now()
    const id = input.id || createId()
    const current = await db.products.get(id)

    const next: Product = {
      ...(current || ({} as Product)),
      ...input,
      id,
      createdAt: current?.createdAt || input.createdAt || t,
      updatedAt: t,
      deletedAt: null,
      syncStatus: 'pending',
      syncVersion: (current?.syncVersion || 0) + 1,
    }

    await db.products.put(next)
    await enqueue('product', id, 'upsert')
    return next
  },

  async update(id: string, updates: Partial<Product>) {
    const t = now()
    const current = await db.products.get(id)
    if (!current) return null

    const next: Product = {
      ...current,
      ...updates,
      id,
      updatedAt: t,
      syncStatus: 'pending',
      syncVersion: (current.syncVersion || 0) + 1,
    }

    await db.products.put(next)
    await enqueue('product', id, 'upsert')
    return next
  },

  async softDelete(id: string) {
    const t = now()
    const current = await db.products.get(id)
    if (!current) return false

    await db.products.put({
      ...current,
      deletedAt: t,
      updatedAt: t,
      syncStatus: 'pending',
      syncVersion: (current.syncVersion || 0) + 1,
    })

    await enqueue('product', id, 'delete')
    return true
  },

  async adjustStock(productId: string, quantityChange: number) {
    const t = now()
    const current = await db.products.get(productId)
    if (!current) return null

    const next: Product = {
      ...current,
      stock: current.stock + quantityChange,
      updatedAt: t,
      syncStatus: 'pending',
      syncVersion: (current.syncVersion || 0) + 1,
    }

    await db.products.put(next)
    return next
  },
}
