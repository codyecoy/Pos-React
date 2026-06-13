export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed'

export interface SyncFields {
  syncStatus?: SyncStatus
  syncVersion?: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface Product extends SyncFields {
  id: string
  name: string
  price: number
  costPrice: number
  stock: number
  category: string
  image: string
  barcode: string
  sku: string
  status?: 'Aktif' | 'Nonaktif'
}

export interface MasterProduct {
  id: string
  segment: string
  name: string
  category: string
  sku: string
  barcode: string
  price: number
  costPrice: number
  image: string
  status?: string
}

export interface Category extends SyncFields {
  id: string
  name: string
  icon?: string
}

export interface Customer extends SyncFields {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
}

export interface CartItem extends Product {
  quantity: number
  discount: number
  note?: string
}

export type PaymentMethod = 'cash' | 'debit' | 'transfer' | 'qris' | 'e-wallet'
export type TransactionStatus = 'completed' | 'hold' | 'cancelled' | 'void'

export interface Transaction {
  id: string
  items: CartItem[]
  subtotal: number
  tax: number
  discountTotal: number
  total: number
  paymentMethod: PaymentMethod
  amountPaid: number
  change: number
  timestamp: Date
  cashierId: string
  customerId?: string
  status: Exclude<TransactionStatus, 'void'>
}

export interface TransactionHeader extends SyncFields {
  id: string
  storeId: string
  cashierId: string
  customerId?: string
  timestamp: Date

  subtotal: number
  tax: number
  discountTotal: number
  total: number

  paymentMethod: PaymentMethod
  amountPaid: number
  change: number

  status: TransactionStatus
  voidReason?: string
  voidedAt?: Date
}

export interface TransactionItem extends SyncFields {
  id: string
  transactionId: string

  productId: string
  name: string
  sku: string
  barcode: string
  category: string

  price: number
  quantity: number
  discount: number
  note?: string
}

export type SyncEntityType =
  | 'product'
  | 'category'
  | 'supplier'
  | 'customer'
  | 'transaction'
  | 'stock_movement'

export type SyncAction = 'upsert' | 'delete' | 'void'

export interface SyncQueueItem extends SyncFields {
  id: string

  entityType: SyncEntityType
  entityId: string
  action: SyncAction

  status: SyncStatus
  attemptCount: number
  nextAttemptAt: Date
  lastError?: string

  lockedAt?: Date | null
}

export type StockMovementType = 'sale' | 'purchase' | 'adjustment' | 'void'

export interface StockMovement extends SyncFields {
  id: string
  storeId: string
  productId: string
  transactionId?: string
  type: StockMovementType
  quantityChange: number
  reason?: string
}

export interface AppSetting {
  key: string
  value: string
  updatedAt: Date
}

export interface StoreSettings {
  name: string
  phone: string
  address: string
  logo?: string
  socialMedia?: {
    instagram?: string
    website?: string
  }
  currency: string
  timezone: string
}

export interface ReceiptSettings {
  showLogo: boolean
  headerMessage: string
  footerMessage: string
  showQrCode: boolean
}

export interface AppPreferences {
  scanSound: boolean
  lowStockNotification: boolean
  autoDarkMode: boolean
  animations: boolean
}

export interface User {
  id: string
  tenantId?: string
  name: string
  role: 'admin' | 'manager' | 'cashier'
  avatar?: string
  password?: string
  email?: string
}

export interface Store {
  id: string
  name: string
  address: string
  phone: string
}

export interface Supplier extends SyncFields {
  id: string
  name: string
  phone: string
  email: string
  address: string
  category: string
  totalPurchased: number
}

export interface PurchaseOrder {
  id: string
  supplierId: string
  supplierName: string
  items: PurchaseItem[]
  total: number
  status: 'Draft' | 'Sent' | 'Received' | 'Paid'
  timestamp: Date
}

export interface PurchaseItem {
  productId: string
  name: string
  quantity: number
  costPrice: number
}

export interface PurchaseOrderLocal extends SyncFields {
  id: string
  supplierId: string
  supplierName: string
  total: number
  status: 'Draft' | 'Sent' | 'Received' | 'Paid'
  timestamp: Date
}

export interface PurchaseItemLocal extends SyncFields {
  id: string
  purchaseId: string
  productId: string
  name: string
  quantity: number
  costPrice: number
}

export interface PurchasePaymentLocal extends SyncFields {
  id: string
  purchaseId: string
  supplierId: string
  amount: number
  method: string
  timestamp: Date
}

export interface Debt {
  id: string
  supplierId: string
  supplierName: string
  total: number
  remaining: number
  dueDate: Date
  status: 'Belum Lunas' | 'Sebagian' | 'Lunas'
  history: DebtPayment[]
}

export interface DebtPayment {
  id: string
  amount: number
  method: string
  timestamp: Date
}
