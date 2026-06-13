import { db } from '@/lib/db'
import { categoriesApi, customersApi, productsApi, suppliersApi, transactionsApi } from '@/services/api'
import { transactionsRepo } from '@/repositories/transactionsRepo'

type StopFn = () => void

function backoffMs(attempt: number) {
  const base = 1500
  const max = 5 * 60 * 1000
  const exp = Math.min(max, base * Math.pow(2, Math.max(0, attempt)))
  const jitter = Math.floor(Math.random() * 500)
  return exp + jitter
}

let running = false
let processing = false
let categoriesSyncDisabled = false

function toDateSafe(v: any) {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v
  if (typeof v === 'number') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof v === 'string') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function isSupported(q: any) {
  if (!q) return false
  if (q.entityType === 'category' && (q.action === 'upsert' || q.action === 'delete')) return true
  if (q.entityType === 'customer' && (q.action === 'upsert' || q.action === 'delete')) return true
  if (q.entityType === 'supplier' && (q.action === 'upsert' || q.action === 'delete')) return true
  if (q.entityType === 'product' && (q.action === 'upsert' || q.action === 'delete')) return true
  if (q.entityType === 'transaction' && q.action === 'upsert') return true
  return false
}

async function loadFlags() {
  const row = await db.settings.get('disableCategoriesSync')
  categoriesSyncDisabled = row?.value === '1'

  if (categoriesSyncDisabled) {
    try {
      await categoriesApi.getAll()
      await db.settings.delete('disableCategoriesSync')
      categoriesSyncDisabled = false
    } catch {
      categoriesSyncDisabled = true
    }
  }
}

async function disableCategoriesSync() {
  categoriesSyncDisabled = true
  const t = new Date()
  await db.settings.put({ key: 'disableCategoriesSync', value: '1', updatedAt: t })
}

async function setLastSyncAt(d: Date) {
  await db.settings.put({
    key: 'lastSyncAt',
    value: d.toISOString(),
    updatedAt: d,
  })
}

async function setLastPullAt(d: Date) {
  await db.settings.put({
    key: 'lastPullAt',
    value: d.toISOString(),
    updatedAt: d,
  })
}

export async function syncDownFromServer(opts?: { force?: boolean }) {
  if (!navigator.onLine) return

  const existing = await db.settings.get('lastPullAt')
  if (existing?.value && !opts?.force) return

  const t = new Date()

  const [catsRes, prodsRes, custRes, suppRes] = await Promise.all([
    categoriesApi.getAll(),
    productsApi.getAll(),
    customersApi.getAll(),
    suppliersApi.getAll(),
  ])

  const categories = Array.isArray(catsRes.data) ? catsRes.data : []
  const products = Array.isArray(prodsRes.data) ? prodsRes.data : []
  const customers = Array.isArray(custRes.data) ? custRes.data : []
  const suppliers = Array.isArray(suppRes.data) ? suppRes.data : []

  await db.transaction('rw', db.categories, db.products, db.customers, db.suppliers, db.settings, async () => {
    if (categories.length > 0) {
      await db.categories.bulkPut(
        categories.map((c: any) => ({
          ...c,
          createdAt: toDateSafe(c.createdAt) || t,
          updatedAt: toDateSafe(c.updatedAt) || t,
          deletedAt: c.deletedAt ? (toDateSafe(c.deletedAt) || null) : null,
          syncStatus: 'synced',
        })) as any
      )
    }

    if (products.length > 0) {
      await db.products.bulkPut(
        products.map((p: any) => ({
          ...p,
          createdAt: toDateSafe(p.createdAt) || t,
          updatedAt: toDateSafe(p.updatedAt) || t,
          deletedAt: p.deletedAt ? (toDateSafe(p.deletedAt) || null) : null,
          syncStatus: 'synced',
        })) as any
      )
    }

    if (customers.length > 0) {
      await db.customers.bulkPut(
        customers.map((c: any) => ({
          ...c,
          createdAt: toDateSafe(c.createdAt) || t,
          updatedAt: toDateSafe(c.updatedAt) || t,
          deletedAt: c.deletedAt ? (toDateSafe(c.deletedAt) || null) : null,
          syncStatus: 'synced',
        })) as any
      )
    }

    if (suppliers.length > 0) {
      await db.suppliers.bulkPut(
        suppliers.map((s: any) => ({
          ...s,
          createdAt: toDateSafe(s.createdAt) || t,
          updatedAt: toDateSafe(s.updatedAt) || t,
          deletedAt: s.deletedAt ? (toDateSafe(s.deletedAt) || null) : null,
          syncStatus: 'synced',
        })) as any
      )
    }

    await setLastPullAt(t)
  })
}

async function markQueue(ids: string[], next: Partial<any>) {
  const t = new Date()
  const rows = await db.sync_queue.bulkGet(ids)
  await db.sync_queue.bulkPut(
    rows
      .filter(Boolean)
      .map((r: any) => ({
        ...r,
        ...next,
        updatedAt: t,
      }))
  )
}

async function lockQueue(ids: string[]) {
  const t = new Date()
  await markQueue(ids, { status: 'syncing', lockedAt: t, syncStatus: 'syncing' })
}

async function unlockFailed(ids: string[], errorMsg: string) {
  const t = new Date()
  const rows = await db.sync_queue.bulkGet(ids)

  await db.sync_queue.bulkPut(
    rows
      .filter(Boolean)
      .map((r: any) => {
        const attemptCount = (r.attemptCount || 0) + 1
        return {
          ...r,
          status: 'failed',
          lockedAt: null,
          attemptCount,
          nextAttemptAt: new Date(Date.now() + backoffMs(attemptCount)),
          lastError: errorMsg.slice(0, 800),
          updatedAt: t,
          syncStatus: 'failed',
        }
      })
  )
}

async function markSynced(ids: string[]) {
  await markQueue(ids, { status: 'synced', lockedAt: null, syncStatus: 'synced' })
}

async function unlockPending(ids: string[]) {
  const t = new Date()
  await markQueue(ids, { status: 'pending', lockedAt: null, syncStatus: 'pending', nextAttemptAt: t })
}

async function resetUnknownFailures() {
  const t = new Date()
  const rows = await db.sync_queue.where('status').equals('failed').toArray()
  const target = rows.filter((r: any) => String(r.lastError || '').includes('Sync handler belum tersedia'))
  if (target.length === 0) return
  await db.sync_queue.bulkPut(
    target.map((r: any) => ({
      ...r,
      status: 'pending',
      lockedAt: null,
      nextAttemptAt: t,
      updatedAt: t,
      syncStatus: 'pending',
      lastError: undefined,
    }))
  )
}

async function fetchBatch(limit = 20) {
  const now = new Date()

  const candidates = await db.sync_queue.where('status').anyOf('pending', 'failed').sortBy('createdAt')
  return candidates
    .filter((q: any) => !q.lockedAt && (!q.nextAttemptAt || q.nextAttemptAt <= now))
    .slice(0, limit)
}

async function pushCategories(queueItems: any[]) {
  const items = queueItems.filter((q) => q.entityType === 'category' && (q.action === 'upsert' || q.action === 'delete'))
  if (items.length === 0) return { pushedQueueIds: [] as string[] }

  const payload = []
  const pushedQueueIds = []

  for (const q of items) {
    const c = await db.categories.get(q.entityId)
    if (!c) continue
    payload.push({
      id: c.id,
      name: c.name,
      icon: c.icon,
      deletedAt: c.deletedAt || null,
      syncVersion: c.syncVersion || 1,
    })
    pushedQueueIds.push(q.id)
  }

  if (payload.length === 0) return { pushedQueueIds: [] as string[] }

  await categoriesApi.syncOffline(payload as any)
  await setLastSyncAt(new Date())

  return { pushedQueueIds }
}

async function pushCustomers(queueItems: any[]) {
  const items = queueItems.filter((q) => q.entityType === 'customer' && (q.action === 'upsert' || q.action === 'delete'))
  if (items.length === 0) return { pushedQueueIds: [] as string[] }

  const payload = []
  const pushedQueueIds = []

  for (const q of items) {
    const c = await db.customers.get(q.entityId)
    if (!c) continue
    payload.push({
      id: c.id,
      name: c.name,
      phone: c.phone || null,
      email: (c as any).email || null,
      address: (c as any).address || null,
      deletedAt: c.deletedAt || null,
      syncVersion: c.syncVersion || 1,
    })
    pushedQueueIds.push(q.id)
  }

  if (payload.length === 0) return { pushedQueueIds: [] as string[] }

  await customersApi.syncOffline(payload as any)
  await setLastSyncAt(new Date())

  return { pushedQueueIds }
}

async function pushSuppliers(queueItems: any[]) {
  const items = queueItems.filter((q) => q.entityType === 'supplier' && (q.action === 'upsert' || q.action === 'delete'))
  if (items.length === 0) return { pushedQueueIds: [] as string[] }

  const payload = []
  const pushedQueueIds = []

  for (const q of items) {
    const s = await db.suppliers.get(q.entityId)
    if (!s) continue
    payload.push({
      id: s.id,
      name: s.name,
      phone: s.phone || null,
      email: (s as any).email || null,
      address: (s as any).address || null,
      category: (s as any).category || '',
      deletedAt: s.deletedAt || null,
      syncVersion: s.syncVersion || 1,
    })
    pushedQueueIds.push(q.id)
  }

  if (payload.length === 0) return { pushedQueueIds: [] as string[] }

  await suppliersApi.syncOffline(payload as any)
  await setLastSyncAt(new Date())

  return { pushedQueueIds }
}

async function pushProducts(queueItems: any[]) {
  const items = queueItems.filter((q) => q.entityType === 'product' && (q.action === 'upsert' || q.action === 'delete'))
  if (items.length === 0) return { pushedQueueIds: [] as string[] }

  const payload = []
  const pushedQueueIds = []

  for (const q of items) {
    const p = await db.products.get(q.entityId)
    if (!p) continue
    payload.push({
      id: p.id,
      name: p.name,
      price: p.price,
      costPrice: p.costPrice,
      stock: p.stock,
      category: p.category,
      image: p.image,
      barcode: p.barcode,
      sku: p.sku,
      status: p.status,
      deletedAt: p.deletedAt || null,
      syncVersion: p.syncVersion || 1,
    })
    pushedQueueIds.push(q.id)
  }

  if (payload.length === 0) return { pushedQueueIds: [] as string[] }

  await productsApi.syncOffline(payload as any)
  await setLastSyncAt(new Date())

  return { pushedQueueIds }
}

async function pushTransactions(queueItems: any[]) {
  const txItems = queueItems.filter((q) => q.entityType === 'transaction' && q.action === 'upsert')
  if (txItems.length === 0) return { pushedQueueIds: [] as string[] }

  const payload = []
  const pushedQueueIds = []

  for (const q of txItems) {
    const tx = await transactionsRepo.buildTransactionForSync(q.entityId)
    if (!tx) continue
    payload.push(tx)
    pushedQueueIds.push(q.id)
  }

  if (payload.length === 0) return { pushedQueueIds: [] as string[] }

  await transactionsApi.syncOffline(payload as any)
  await setLastSyncAt(new Date())

  return { pushedQueueIds }
}

async function processOnce() {
  if (!navigator.onLine) return
  if (processing) return

  processing = true
  try {
    const batch = await fetchBatch(25)
    if (batch.length === 0) return

    const supported = batch.filter(isSupported)
    if (supported.length === 0) return

    const byType = {
      category: supported.filter((q: any) => q.entityType === 'category'),
      customer: supported.filter((q: any) => q.entityType === 'customer'),
      supplier: supported.filter((q: any) => q.entityType === 'supplier'),
      product: supported.filter((q: any) => q.entityType === 'product'),
      transaction: supported.filter((q: any) => q.entityType === 'transaction'),
    }

    if (byType.category.length > 0) {
      const ids = byType.category.map((b: any) => b.id)
      await lockQueue(ids)
      try {
        if (categoriesSyncDisabled) {
          await unlockPending(ids)
        } else {
          const { pushedQueueIds } = await pushCategories(byType.category)
          if (pushedQueueIds.length > 0) await markSynced(pushedQueueIds)

          const untouched = ids.filter((id: string) => !pushedQueueIds.includes(id))
          if (untouched.length > 0) await unlockPending(untouched)
        }
      } catch (e: any) {
        const status = e?.response?.status
        if (status === 404) {
          await disableCategoriesSync()
          await unlockPending(ids)
        } else {
          const msg = e?.response?.data?.message || e?.message || 'Gagal sync kategori'
          console.error('sync_failed', { ids, msg })
          await unlockFailed(ids, msg)
        }
      }
    }

    if (byType.product.length > 0) {
      const ids = byType.product.map((b: any) => b.id)
      await lockQueue(ids)
      try {
        const { pushedQueueIds } = await pushProducts(byType.product)
        if (pushedQueueIds.length > 0) await markSynced(pushedQueueIds)

        const untouched = ids.filter((id: string) => !pushedQueueIds.includes(id))
        if (untouched.length > 0) await unlockPending(untouched)
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Gagal sync produk'
        console.error('sync_failed', { ids, msg })
        await unlockFailed(ids, msg)
      }
    }

    if (byType.supplier.length > 0) {
      const ids = byType.supplier.map((b: any) => b.id)
      await lockQueue(ids)
      try {
        const { pushedQueueIds } = await pushSuppliers(byType.supplier)
        if (pushedQueueIds.length > 0) await markSynced(pushedQueueIds)

        const untouched = ids.filter((id: string) => !pushedQueueIds.includes(id))
        if (untouched.length > 0) await unlockPending(untouched)
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Gagal sync supplier'
        console.error('sync_failed', { ids, msg })
        await unlockFailed(ids, msg)
      }
    }

    if (byType.customer.length > 0) {
      const ids = byType.customer.map((b: any) => b.id)
      await lockQueue(ids)
      try {
        const { pushedQueueIds } = await pushCustomers(byType.customer)
        if (pushedQueueIds.length > 0) await markSynced(pushedQueueIds)

        const untouched = ids.filter((id: string) => !pushedQueueIds.includes(id))
        if (untouched.length > 0) await unlockPending(untouched)
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Gagal sync pelanggan'
        console.error('sync_failed', { ids, msg })
        await unlockFailed(ids, msg)
      }
    }

    if (byType.transaction.length > 0) {
      const ids = byType.transaction.map((b: any) => b.id)
      await lockQueue(ids)
      try {
        const { pushedQueueIds } = await pushTransactions(byType.transaction)
        if (pushedQueueIds.length > 0) await markSynced(pushedQueueIds)

        const untouched = ids.filter((id: string) => !pushedQueueIds.includes(id))
        if (untouched.length > 0) await unlockPending(untouched)
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Gagal sync transaksi'
        console.error('sync_failed', { ids, msg })
        await unlockFailed(ids, msg)
      }
    }
  } finally {
    processing = false
  }
}

export function startSyncEngine(): StopFn {
  if (running) return () => {}
  running = true

  ;(window as any).__posSyncDebug = {
    async failed() {
      return db.sync_queue.where('status').equals('failed').toArray()
    },
    async pending() {
      return db.sync_queue.where('status').equals('pending').toArray()
    },
    async clearLocalTransactions() {
      await db.transaction(
        'rw',
        db.transaction_items,
        db.transactions,
        db.stock_movements,
        db.sync_queue,
        async () => {
          await db.transaction_items.clear()
          await db.transactions.clear()

          const queue = await db.sync_queue.where('entityType').equals('transaction').toArray()
          if (queue.length > 0) {
            await db.sync_queue.bulkDelete(queue.map((q: any) => q.id))
          }

          const movements = await db.stock_movements.toArray()
          const movementIds = movements.filter((m: any) => !!m.transactionId).map((m: any) => m.id)
          if (movementIds.length > 0) {
            await db.stock_movements.bulkDelete(movementIds)
          }
        }
      )
      return true
    },
    async retryFailed() {
      const t = new Date()
      const rows = await db.sync_queue.where('status').equals('failed').toArray()
      await db.sync_queue.bulkPut(
        rows.map((r: any) => ({
          ...r,
          status: 'pending',
          lockedAt: null,
          nextAttemptAt: t,
          updatedAt: t,
          syncStatus: 'pending',
        }))
      )
      return rows.length
    },
  }

  const onOnline = () => {
    void processOnce()
  }

  window.addEventListener('online', onOnline)

  const timer = window.setInterval(() => {
    void processOnce()
  }, 8000)

  void loadFlags()
  void resetUnknownFailures()
  void processOnce()

  return () => {
    running = false
    window.removeEventListener('online', onOnline)
    window.clearInterval(timer)
  }
}
