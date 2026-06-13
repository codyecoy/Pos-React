import { db } from '@/lib/db'
import { createId } from '@/lib/ids'
import { CartItem, PaymentMethod, TransactionHeader, TransactionItem } from '@/types'

function now() {
  return new Date()
}

const LICENSE_SETTING_KEY = 'license_v1'
const TRIAL_TX_LIMIT = 250
const TRIAL_DAYS = 14
const MS_DAY = 24 * 60 * 60 * 1000

type LicenseStateV1 = {
  v: 1
  trialStartedAt: string
  paid: boolean
  activatedAt?: string
  activationHint?: string
}

export type LicenseStatus = {
  isPaid: boolean
  trialStartedAt: Date
  trialEndsAt: Date
  saleCount: number
  trialTransactionsLeft: number
  trialDaysLeft: number
  trialExpired: boolean
  expiredReason: 'count' | 'time' | null
  activationHint?: string
}

function safeDate(input: unknown) {
  const d = input instanceof Date ? input : new Date(String(input || ''))
  return Number.isNaN(d.getTime()) ? null : d
}

async function readLicenseStateV1(): Promise<LicenseStateV1> {
  const row = await db.settings.get(LICENSE_SETTING_KEY)
  const t = now()
  if (!row?.value) {
    const init: LicenseStateV1 = { v: 1, trialStartedAt: t.toISOString(), paid: false }
    await db.settings.put({ key: LICENSE_SETTING_KEY, value: JSON.stringify(init), updatedAt: t })
    return init
  }

  try {
    const parsed = JSON.parse(String(row.value || '')) as Partial<LicenseStateV1>
    const startedAt = safeDate(parsed.trialStartedAt)?.toISOString() || t.toISOString()
    const paid = Boolean(parsed.paid)
    const state: LicenseStateV1 = {
      v: 1,
      trialStartedAt: startedAt,
      paid,
      activatedAt: parsed.activatedAt ? String(parsed.activatedAt) : undefined,
      activationHint: parsed.activationHint ? String(parsed.activationHint) : undefined,
    }

    if (startedAt !== parsed.trialStartedAt || paid !== Boolean(parsed.paid)) {
      await db.settings.put({ key: LICENSE_SETTING_KEY, value: JSON.stringify(state), updatedAt: t })
    }

    return state
  } catch {
    const reset: LicenseStateV1 = { v: 1, trialStartedAt: t.toISOString(), paid: false }
    await db.settings.put({ key: LICENSE_SETTING_KEY, value: JSON.stringify(reset), updatedAt: t })
    return reset
  }
}

async function writeLicenseStateV1(next: LicenseStateV1) {
  const t = now()
  await db.settings.put({ key: LICENSE_SETTING_KEY, value: JSON.stringify(next), updatedAt: t })
}

export async function getLicenseStatus(at: Date = now()): Promise<LicenseStatus> {
  const state = await readLicenseStateV1()
  const startedAt = safeDate(state.trialStartedAt) || at
  const trialEndsAt = new Date(startedAt.getTime() + TRIAL_DAYS * MS_DAY)
  const saleCount = await db.transactions.where('status').equals('completed').count()

  const expiredByCount = saleCount >= TRIAL_TX_LIMIT
  const expiredByTime = at.getTime() >= trialEndsAt.getTime()
  const trialExpired = expiredByCount || expiredByTime
  const expiredReason = expiredByCount ? 'count' : expiredByTime ? 'time' : null

  const trialTransactionsLeft = Math.max(0, TRIAL_TX_LIMIT - saleCount)
  const trialDaysLeft = Math.max(0, Math.ceil((trialEndsAt.getTime() - at.getTime()) / MS_DAY))

  return {
    isPaid: Boolean(state.paid),
    trialStartedAt: startedAt,
    trialEndsAt,
    saleCount,
    trialTransactionsLeft,
    trialDaysLeft,
    trialExpired,
    expiredReason,
    activationHint: state.activationHint,
  }
}

export async function activateLicense(activationCode: string) {
  const code = String(activationCode || '').trim()
  if (!code) throw new Error('Kode aktivasi kosong.')

  const state = await readLicenseStateV1()
  const t = now()
  const hint = code.length <= 4 ? code : `****${code.slice(-4)}`
  await writeLicenseStateV1({
    ...state,
    paid: true,
    activatedAt: t.toISOString(),
    activationHint: hint,
  })
}

export async function hardResetAllData() {
  try {
    db.close()
  } catch {
  }

  try {
    await db.delete()
  } catch {
  }

  const keys = [
    'pos-auth-storage',
    'pos-cart-storage',
    'pos-inventory-storage',
    'pos_tenant_id',
    'pos_store_id',
    'isLoggedIn',
  ]
  for (const k of keys) {
    try {
      localStorage.removeItem(k)
    } catch {
    }
  }

  window.location.reload()
}

export async function ensureLicenseValidOrReset(at: Date = now()) {
  const status = await getLicenseStatus(at)
  if (status.isPaid) return
  if (!status.trialExpired) return
  await hardResetAllData()
}

export const transactionsRepo = {
  async createHoldFromCart(input: {
    storeId: string
    cashierId: string
    customerId?: string
    cartItems: CartItem[]
    subtotal: number
    tax: number
    discountTotal: number
    total: number
    timestamp: Date
  }) {
    await ensureLicenseValidOrReset()
    const t = now()
    const txId = createId()

    const header: TransactionHeader = {
      id: txId,
      storeId: input.storeId,
      cashierId: input.cashierId,
      customerId: input.customerId,
      timestamp: input.timestamp,

      subtotal: input.subtotal,
      tax: input.tax,
      discountTotal: input.discountTotal,
      total: input.total,

      paymentMethod: 'cash',
      amountPaid: 0,
      change: 0,

      status: 'hold',

      createdAt: t,
      updatedAt: t,
      deletedAt: null,
      syncStatus: 'synced',
      syncVersion: 1,
    }

    const items: TransactionItem[] = input.cartItems.map((ci) => ({
      id: createId(),
      transactionId: txId,

      productId: ci.id,
      name: ci.name,
      sku: ci.sku,
      barcode: ci.barcode,
      category: ci.category,

      price: ci.price,
      quantity: ci.quantity,
      discount: ci.discount,
      note: ci.note,

      createdAt: t,
      updatedAt: t,
      deletedAt: null,
      syncStatus: 'synced',
      syncVersion: 1,
    }))

    await db.transaction('rw', db.transactions, db.transaction_items, async () => {
      await db.transactions.put(header)
      await db.transaction_items.bulkPut(items)
    })

    return {
      id: txId,
      items: input.cartItems,
      total: input.total,
      subtotal: input.subtotal,
      tax: input.tax,
      amountPaid: 0,
      change: 0,
      method: 'hold',
      timestamp: input.timestamp,
    }
  },

  async createSaleFromCart(input: {
    storeId: string
    cashierId: string
    customerId?: string
    cartItems: CartItem[]
    paymentMethod: PaymentMethod
    subtotal: number
    tax: number
    discountTotal: number
    total: number
    amountPaid: number
    change: number
    timestamp: Date
  }) {
    await ensureLicenseValidOrReset()
    const t = now()
    const txId = createId()

    const header: TransactionHeader = {
      id: txId,
      storeId: input.storeId,
      cashierId: input.cashierId,
      customerId: input.customerId,
      timestamp: input.timestamp,

      subtotal: input.subtotal,
      tax: input.tax,
      discountTotal: input.discountTotal,
      total: input.total,

      paymentMethod: input.paymentMethod,
      amountPaid: input.amountPaid,
      change: input.change,

      status: 'completed',

      createdAt: t,
      updatedAt: t,
      deletedAt: null,
      syncStatus: 'pending',
      syncVersion: 1,
    }

    const items: TransactionItem[] = input.cartItems.map((ci) => ({
      id: createId(),
      transactionId: txId,

      productId: ci.id,
      name: ci.name,
      sku: ci.sku,
      barcode: ci.barcode,
      category: ci.category,

      price: ci.price,
      quantity: ci.quantity,
      discount: ci.discount,
      note: ci.note,

      createdAt: t,
      updatedAt: t,
      deletedAt: null,
      syncStatus: 'pending',
      syncVersion: 1,
    }))

    await db.transaction(
      'rw',
      db.transactions,
      db.transaction_items,
      db.products,
      db.stock_movements,
      db.sync_queue,
      async () => {
        await db.transactions.put(header)
        await db.transaction_items.bulkPut(items)

        const productIds = [...new Set(items.map((it) => it.productId))]
        const products = await db.products.bulkGet(productIds)
        const byId = new Map(products.filter(Boolean).map((p: any) => [p.id, p]))

        const updatedProducts = []

        for (const it of items) {
          const p = byId.get(it.productId)
          if (!p) continue

          updatedProducts.push({
            ...p,
            stock: (p.stock || 0) - it.quantity,
            updatedAt: t,
            syncStatus: 'pending',
            syncVersion: (p.syncVersion || 0) + 1,
          })

          await db.stock_movements.add({
            id: createId(),
            storeId: input.storeId,
            productId: it.productId,
            transactionId: txId,
            type: 'sale',
            quantityChange: -it.quantity,

            createdAt: t,
            updatedAt: t,
            deletedAt: null,
            syncStatus: 'pending',
            syncVersion: 1,
          })
        }

        if (updatedProducts.length > 0) {
          await db.products.bulkPut(updatedProducts as any)
        }

        await db.sync_queue.add({
          id: createId(),
          entityType: 'transaction',
          entityId: txId,
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
      }
    )

    return {
      id: txId,
      items: input.cartItems,
      total: input.total,
      subtotal: input.subtotal,
      tax: input.tax,
      amountPaid: input.amountPaid,
      change: input.change,
      method: input.paymentMethod,
      timestamp: input.timestamp,
    }
  },

  async buildTransactionForSync(transactionId: string) {
    const header = await db.transactions.get(transactionId)
    if (!header) return null

    const items = await db.transaction_items.where('transactionId').equals(transactionId).toArray()

    return {
      id: header.id,
      items: items.map((it) => ({
        id: it.id,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        discount: it.discount,
        note: it.note,
        productId: it.productId,
        sku: it.sku,
        barcode: it.barcode,
        category: it.category,
      })),
      subtotal: header.subtotal,
      tax: header.tax,
      discountTotal: header.discountTotal,
      total: header.total,
      paymentMethod: header.paymentMethod,
      amountPaid: header.amountPaid,
      change: header.change,
      timestamp: header.timestamp,
      cashierId: header.cashierId,
      customerId: header.customerId,
      status: header.status,
    }
  },
}
