import { db } from '@/lib/db'
import { createId } from '@/lib/ids'
import { Category, SyncAction, SyncEntityType } from '@/types'

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

export const categoriesRepo = {
  async seedIfEmpty(defaultCategories: Category[]) {
    const count = await db.categories.count()
    if (count > 0) return

    const t = now()
    await db.categories.bulkPut(
      defaultCategories.map((c) => ({
        ...c,
        createdAt: t,
        updatedAt: t,
        deletedAt: null,
        syncStatus: 'pending',
        syncVersion: 1,
      }))
    )

    for (const c of defaultCategories) {
      await enqueue('category', c.id, 'upsert')
    }
  },

  async listActive() {
    const rows = await db.categories.filter((c) => !c.deletedAt).toArray()
    return rows.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  },

  async upsert(input: Category) {
    const t = now()
    const id = input.id || createId()
    const current = await db.categories.get(id)

    const next: Category = {
      ...(current || ({} as Category)),
      ...input,
      id,
      createdAt: current?.createdAt || input.createdAt || t,
      updatedAt: t,
      deletedAt: null,
      syncStatus: 'pending',
      syncVersion: (current?.syncVersion || 0) + 1,
    }

    await db.categories.put(next)
    await enqueue('category', id, 'upsert')
    return next
  },

  async rename(id: string, name: string) {
    const t = now()
    const current = await db.categories.get(id)
    if (!current) return null

    const next: Category = {
      ...current,
      name,
      updatedAt: t,
      syncStatus: 'pending',
      syncVersion: (current.syncVersion || 0) + 1,
    }

    await db.categories.put(next)
    await enqueue('category', id, 'upsert')
    return next
  },

  async softDelete(id: string) {
    const t = now()
    const current = await db.categories.get(id)
    if (!current) return false

    await db.categories.put({
      ...current,
      deletedAt: t,
      updatedAt: t,
      syncStatus: 'pending',
      syncVersion: (current.syncVersion || 0) + 1,
    })

    await enqueue('category', id, 'delete')
    return true
  },
}
