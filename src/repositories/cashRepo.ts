import { db } from '@/lib/db'
import { createId } from '@/lib/ids'
import { COA, CashTransaction, SyncAction, SyncEntityType } from '@/types'

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

// Default COA untuk inisialisasi
const defaultCOAs: Omit<COA, 'createdAt' | 'updatedAt' | 'deletedAt' | 'syncStatus' | 'syncVersion'>[] = [
  {
    id: createId(),
    code: '1101',
    name: 'Kas Utama',
    type: 'asset',
    description: 'Kas utama untuk transaksi penjualan',
    isActive: true,
  },
  {
    id: createId(),
    code: '4101',
    name: 'Penjualan Produk',
    type: 'revenue',
    description: 'Pemasukan dari penjualan produk',
    isActive: true,
  },
  {
    id: createId(),
    code: '5101',
    name: 'Gaji Karyawan',
    type: 'expense',
    description: 'Pengeluaran untuk gaji karyawan',
    isActive: true,
  },
  {
    id: createId(),
    code: '5102',
    name: 'Biaya Listrik',
    type: 'expense',
    description: 'Pengeluaran untuk biaya listrik',
    isActive: true,
  },
  {
    id: createId(),
    code: '5103',
    name: 'Biaya Sewa',
    type: 'expense',
    description: 'Pengeluaran untuk biaya sewa tempat',
    isActive: true,
  },
  {
    id: createId(),
    code: '5104',
    name: 'Pembelian Persediaan',
    type: 'expense',
    description: 'Pengeluaran untuk pembelian persediaan barang',
    isActive: true,
  },
  {
    id: createId(),
    code: '5105',
    name: 'Biaya Lainnya',
    type: 'expense',
    description: 'Pengeluaran untuk kebutuhan lainnya',
    isActive: true,
  },
]

export const cashRepo = {
  // --- COA Operations ---
  async seedCoaIfEmpty() {
    const count = await db.coas.count()
    if (count > 0) return

    const t = now()
    const coasWithTimestamps = defaultCOAs.map(coa => ({
      ...coa,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
      syncStatus: 'pending',
      syncVersion: 1,
    }))

    await db.coas.bulkPut(coasWithTimestamps)
    for (const coa of coasWithTimestamps) {
      await enqueue('coa', coa.id, 'upsert')
    }
  },

  async listCoa() {
    const rows = await db.coas.filter((c) => !c.deletedAt).toArray()
    return rows.sort((a, b) => (a.code > b.code ? 1 : -1))
  },

  async listActiveCoa() {
    const rows = await db.coas.filter((c) => !c.deletedAt && c.isActive).toArray()
    return rows.sort((a, b) => (a.code > b.code ? 1 : -1))
  },

  async upsertCoa(input: COA) {
    const t = now()
    const id = input.id || createId()
    const current = await db.coas.get(id)

    const next: COA = {
      ...(current || ({} as COA)),
      ...input,
      id,
      createdAt: current?.createdAt || input.createdAt || t,
      updatedAt: t,
      deletedAt: null,
      syncStatus: 'pending',
      syncVersion: (current?.syncVersion || 0) + 1,
    }

    await db.coas.put(next)
    await enqueue('coa', id, 'upsert')
    return next
  },

  async softDeleteCoa(id: string) {
    const t = now()
    const current = await db.coas.get(id)
    if (!current) return false

    await db.coas.put({
      ...current,
      deletedAt: t,
      updatedAt: t,
      syncStatus: 'pending',
      syncVersion: (current.syncVersion || 0) + 1,
    })

    await enqueue('coa', id, 'delete')
    return true
  },

  // --- Cash Transaction Operations ---
  async listCashTransactions() {
    const rows = await db.cash_transactions.filter((t) => !t.deletedAt).toArray()
    return rows.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
  },

  async listCashTransactionsByDateRange(startDate: Date, endDate: Date) {
    const rows = await db.cash_transactions
      .filter((t) => !t.deletedAt && t.date >= startDate && t.date <= endDate)
      .toArray()
    return rows.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
  },

  async createCashTransaction(input: CashTransaction) {
    const t = now()
    const id = input.id || createId()

    const next: CashTransaction = {
      ...input,
      id,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
      syncStatus: 'pending',
      syncVersion: 1,
    }

    await db.cash_transactions.put(next)
    await enqueue('cash_transaction', id, 'upsert')
    return next
  },

  async updateCashTransaction(id: string, updates: Partial<CashTransaction>) {
    const t = now()
    const current = await db.cash_transactions.get(id)
    if (!current) return null

    const next: CashTransaction = {
      ...current,
      ...updates,
      id,
      updatedAt: t,
      syncStatus: 'pending',
      syncVersion: (current.syncVersion || 0) + 1,
    }

    await db.cash_transactions.put(next)
    await enqueue('cash_transaction', id, 'upsert')
    return next
  },

  async softDeleteCashTransaction(id: string) {
    const t = now()
    const current = await db.cash_transactions.get(id)
    if (!current) return false

    await db.cash_transactions.put({
      ...current,
      deletedAt: t,
      updatedAt: t,
      syncStatus: 'pending',
      syncVersion: (current.syncVersion || 0) + 1,
    })

    await enqueue('cash_transaction', id, 'delete')
    return true
  },

  async getCashBalance() {
    const transactions = await this.listCashTransactions()
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    return income - expense
  },
}
