export interface Product {
  id: string
  name: string
  price: number
  costPrice: number
  stock: number
  category: string
  image: string
  barcode: string
  sku: string
}

export interface Category {
  id: string
  name: string
  icon: string
}

export interface CartItem extends Product {
  quantity: number
  discount: number // Discount amount per item
  note?: string
}

export interface Transaction {
  id: string
  items: CartItem[]
  subtotal: number
  tax: number
  discountTotal: number
  total: number
  paymentMethod: 'cash' | 'debit' | 'transfer' | 'qris' | 'e-wallet'
  amountPaid: number
  change: number
  timestamp: Date
  cashierId: string
  customerId?: string
  status: 'completed' | 'hold' | 'cancelled'
}

export interface User {
  id: string
  name: string
  role: 'admin' | 'manager' | 'cashier'
  avatar?: string
}

export interface Store {
  id: string
  name: string
  address: string
  phone: string
}

export interface Supplier {
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
