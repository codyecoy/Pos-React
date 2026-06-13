import { db } from '@/lib/db'
import { createId } from '@/lib/ids'
import { PurchaseItem, PurchaseOrder, PurchaseOrderLocal, PurchaseItemLocal } from '@/types'

function now() {
  return new Date()
}

export const purchasesRepo = {
  async list(): Promise<PurchaseOrder[]> {
    const headers = await db.purchase_orders.orderBy('timestamp').reverse().toArray()
    const ids = headers.map((h) => h.id)
    const items = ids.length > 0 ? await db.purchase_items.where('purchaseId').anyOf(ids).toArray() : []
    const byPurchase = new Map<string, PurchaseItemLocal[]>()
    for (const it of items) {
      const arr = byPurchase.get(it.purchaseId) || []
      arr.push(it)
      byPurchase.set(it.purchaseId, arr)
    }

    return headers.map((h) => ({
      id: h.id,
      supplierId: h.supplierId,
      supplierName: h.supplierName,
      items: (byPurchase.get(h.id) || []).map((it) => ({
        productId: it.productId,
        name: it.name,
        quantity: it.quantity,
        costPrice: it.costPrice,
      })),
      total: h.total,
      status: h.status,
      timestamp: h.timestamp,
    }))
  },

  async create(purchase: PurchaseOrder) {
    const t = now()

    const header: PurchaseOrderLocal = {
      id: purchase.id,
      supplierId: purchase.supplierId,
      supplierName: purchase.supplierName,
      total: purchase.total,
      status: purchase.status,
      timestamp: purchase.timestamp,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
      syncStatus: 'pending',
      syncVersion: 1,
    }

    const items: PurchaseItemLocal[] = purchase.items.map((it) => ({
      id: createId(),
      purchaseId: purchase.id,
      productId: it.productId,
      name: it.name,
      quantity: it.quantity,
      costPrice: it.costPrice,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
      syncStatus: 'pending',
      syncVersion: 1,
    }))

    await db.transaction('rw', db.purchase_orders, db.purchase_items, async () => {
      await db.purchase_orders.put(header)
      await db.purchase_items.bulkPut(items)
    })
  },

  async applyToInventory(purchase: PurchaseOrder) {
    const t = now()

    await db.transaction('rw', db.products, db.stock_movements, db.sync_queue, async () => {
      for (const it of purchase.items) {
        const current = await db.products.get(it.productId)
        if (!current) continue

        await db.products.put({
          ...current,
          stock: current.stock + it.quantity,
          costPrice: it.costPrice,
          updatedAt: t,
          syncStatus: 'pending',
          syncVersion: (current.syncVersion || 0) + 1,
        })

        await db.stock_movements.add({
          id: createId(),
          storeId: 'DEFAULT',
          productId: it.productId,
          transactionId: purchase.id,
          type: 'purchase',
          quantityChange: it.quantity,
          reason: `PO:${purchase.id};costPrice:${it.costPrice}`,
          createdAt: t,
          updatedAt: t,
          deletedAt: null,
          syncStatus: 'pending',
          syncVersion: 1,
        })

        await db.sync_queue.add({
          id: createId(),
          entityType: 'product',
          entityId: it.productId,
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
    })
  },
}
