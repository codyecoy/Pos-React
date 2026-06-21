import Dexie, { Table } from 'dexie'
import {
  Category,
  Customer,
  Product,
  PurchaseOrderLocal,
  PurchaseItemLocal,
  PurchasePaymentLocal,
  Supplier,
  SyncQueueItem,
  TransactionHeader,
  TransactionItem,
  StockMovement,
  AppSetting,
  COA,
  CashTransaction,
  User,
} from '@/types'

export class PosDatabase extends Dexie {
  products!: Table<Product>
  categories!: Table<Category>
  customers!: Table<Customer>
  suppliers!: Table<Supplier>
  users!: Table<User>

  transactions!: Table<TransactionHeader>
  transaction_items!: Table<TransactionItem>

  purchase_orders!: Table<PurchaseOrderLocal>
  purchase_items!: Table<PurchaseItemLocal>
  purchase_payments!: Table<PurchasePaymentLocal>

  coas!: Table<COA>
  cash_transactions!: Table<CashTransaction>

  sync_queue!: Table<SyncQueueItem>
  stock_movements!: Table<StockMovement>
  settings!: Table<AppSetting>

  constructor() {
    const tenantId = localStorage.getItem('pos_tenant_id') || 'DEFAULT'
    const storeId = localStorage.getItem('pos_store_id') || 'DEFAULT'
    const safeTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_')
    const safeStore = storeId.replace(/[^a-zA-Z0-9_-]/g, '_')
    super(`PosDatabase_${safeTenant}_${safeStore}`)

    this.version(1).stores({
      products: 'id, name, category, barcode, sku',
      transactions: 'id, timestamp, status, cashierId',
      categories: 'id, name',
    })

    this.version(2).stores({
      products: 'id, name, category, barcode, sku, syncStatus, syncVersion, updatedAt, deletedAt',
      categories: 'id, name, syncStatus, syncVersion, updatedAt, deletedAt',
      customers: 'id, name, phone, syncStatus, syncVersion, updatedAt, deletedAt',

      transactions: 'id, storeId, timestamp, status, cashierId, syncStatus, syncVersion, updatedAt, deletedAt',
      transaction_items: 'id, transactionId, productId, createdAt',

      sync_queue: 'id, status, entityType, entityId, action, nextAttemptAt, createdAt',
      stock_movements: 'id, productId, transactionId, type, createdAt',
      settings: 'key, updatedAt',
    })

    this.version(3).stores({
      products: 'id, name, category, barcode, sku, syncStatus, syncVersion, updatedAt, deletedAt',
      categories: 'id, name, syncStatus, syncVersion, updatedAt, deletedAt',
      customers: 'id, name, phone, syncStatus, syncVersion, updatedAt, deletedAt',

      transactions: 'id, storeId, timestamp, status, cashierId, syncStatus, syncVersion, updatedAt, deletedAt',
      transaction_items: 'id, transactionId, productId, createdAt',

      purchase_orders: 'id, supplierId, timestamp, status, createdAt',
      purchase_items: 'id, purchaseId, productId, createdAt',

      sync_queue: 'id, status, entityType, entityId, action, nextAttemptAt, createdAt',
      stock_movements: 'id, productId, transactionId, type, createdAt',
      settings: 'key, updatedAt',
    })

    this.version(4).stores({
      products: 'id, name, category, barcode, sku, syncStatus, syncVersion, updatedAt, deletedAt',
      categories: 'id, name, syncStatus, syncVersion, updatedAt, deletedAt',
      customers: 'id, name, phone, syncStatus, syncVersion, updatedAt, deletedAt',
      suppliers: 'id, name, phone, email, category, updatedAt, deletedAt',

      transactions: 'id, storeId, timestamp, status, cashierId, syncStatus, syncVersion, updatedAt, deletedAt',
      transaction_items: 'id, transactionId, productId, createdAt',

      purchase_orders: 'id, supplierId, timestamp, status, createdAt',
      purchase_items: 'id, purchaseId, productId, createdAt',

      sync_queue: 'id, status, entityType, entityId, action, nextAttemptAt, createdAt',
      stock_movements: 'id, productId, transactionId, type, createdAt',
      settings: 'key, updatedAt',
    })

    this.version(5).stores({
      products: 'id, name, category, barcode, sku, syncStatus, syncVersion, updatedAt, deletedAt',
      categories: 'id, name, syncStatus, syncVersion, updatedAt, deletedAt',
      customers: 'id, name, phone, syncStatus, syncVersion, updatedAt, deletedAt',
      suppliers: 'id, name, phone, email, category, updatedAt, deletedAt',

      transactions: 'id, storeId, timestamp, status, cashierId, syncStatus, syncVersion, updatedAt, deletedAt',
      transaction_items: 'id, transactionId, productId, createdAt',

      purchase_orders: 'id, supplierId, timestamp, status, createdAt',
      purchase_items: 'id, purchaseId, productId, createdAt',
      purchase_payments: 'id, purchaseId, supplierId, timestamp, createdAt',

      sync_queue: 'id, status, entityType, entityId, action, nextAttemptAt, createdAt',
      stock_movements: 'id, productId, transactionId, type, createdAt',
      settings: 'key, updatedAt',
    })

    this.version(6).stores({
      products: 'id, name, category, barcode, sku, syncStatus, syncVersion, updatedAt, deletedAt',
      categories: 'id, name, syncStatus, syncVersion, updatedAt, deletedAt',
      customers: 'id, name, phone, syncStatus, syncVersion, updatedAt, deletedAt',
      suppliers: 'id, name, phone, email, category, updatedAt, deletedAt',

      transactions: 'id, storeId, timestamp, status, cashierId, syncStatus, syncVersion, updatedAt, deletedAt',
      transaction_items: 'id, transactionId, productId, createdAt',

      purchase_orders: 'id, supplierId, timestamp, status, createdAt',
      purchase_items: 'id, purchaseId, productId, createdAt',
      purchase_payments: 'id, purchaseId, supplierId, timestamp, createdAt',

      coas: 'id, code, name, type, isActive, syncStatus, syncVersion, updatedAt, deletedAt',
      cash_transactions: 'id, storeId, type, date, coaId, cashierId, syncStatus, syncVersion, updatedAt, deletedAt',

      sync_queue: 'id, status, entityType, entityId, action, nextAttemptAt, createdAt',
      stock_movements: 'id, productId, transactionId, type, createdAt',
      settings: 'key, updatedAt',
    })

    this.version(7).stores({
      products: 'id, name, category, barcode, sku, syncStatus, syncVersion, updatedAt, deletedAt',
      categories: 'id, name, syncStatus, syncVersion, updatedAt, deletedAt',
      customers: 'id, name, phone, syncStatus, syncVersion, updatedAt, deletedAt',
      suppliers: 'id, name, phone, email, category, updatedAt, deletedAt',
      users: 'id, username, name, role, isActive, syncStatus, syncVersion, updatedAt, deletedAt',

      transactions: 'id, storeId, timestamp, status, cashierId, syncStatus, syncVersion, updatedAt, deletedAt',
      transaction_items: 'id, transactionId, productId, createdAt',

      purchase_orders: 'id, supplierId, timestamp, status, createdAt',
      purchase_items: 'id, purchaseId, productId, createdAt',
      purchase_payments: 'id, purchaseId, supplierId, timestamp, createdAt',

      coas: 'id, code, name, type, isActive, syncStatus, syncVersion, updatedAt, deletedAt',
      cash_transactions: 'id, storeId, type, date, coaId, cashierId, syncStatus, syncVersion, updatedAt, deletedAt',

      sync_queue: 'id, status, entityType, entityId, action, nextAttemptAt, createdAt',
      stock_movements: 'id, productId, transactionId, type, createdAt',
      settings: 'key, updatedAt',
    })
  }
}

export const db = new PosDatabase()
