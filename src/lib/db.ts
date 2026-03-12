import Dexie, { Table } from 'dexie'
import { Product, Transaction, Category } from '@/types'

export class PosDatabase extends Dexie {
  products!: Table<Product>
  transactions!: Table<Transaction>
  categories!: Table<Category>

  constructor() {
    super('PosDatabase')
    this.version(1).stores({
      products: 'id, name, category, barcode, sku',
      transactions: 'id, timestamp, status, cashierId',
      categories: 'id, name'
    })
  }
}

export const db = new PosDatabase()
