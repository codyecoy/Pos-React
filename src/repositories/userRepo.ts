
import { db } from '@/lib/db'
import { User, Store } from '@/types'
import { createId } from '@/lib/ids'
import { simpleHash } from './authRepo'

export const userRepo = {
  async listUsers(): Promise<User[]> {
    // Dexie does not accept `null` as an indexed key for `.equals(null)`.
    // Fall back to loading and filtering in memory to find non-deleted users.
    const users = await db.users.toArray()
    return users.filter(u => u.deletedAt === null)
  },

  async getUserById(id: string): Promise<User | undefined> {
    return await db.users.get(id)
  },

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.users.where({ username, deletedAt: null }).toArray()
    return users[0]
  },

  async createUser(userData: Omit<User, keyof import('@/types').SyncFields>): Promise<User> {
    const now = new Date()
    const user: User = {
      id: createId(),
      ...userData,
      password: simpleHash(userData.password),
      isActive: true,
      syncStatus: 'pending',
      syncVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    }
    await db.users.add(user)
    return user
  },

  async updateUser(id: string, userData: Partial<Omit<User, 'id' | 'password' | keyof import('@/types').SyncFields> & { password?: string }>): Promise<User | undefined> {
    const existing = await userRepo.getUserById(id)
    if (!existing) return undefined
    
    const updated: User = {
      ...existing,
      ...userData,
      password: userData.password ? simpleHash(userData.password) : existing.password,
      updatedAt: new Date(),
      syncStatus: 'pending'
    }
    await db.users.put(updated)
    return updated
  },

  async softDeleteUser(id: string): Promise<void> {
    const user = await userRepo.getUserById(id)
    if (!user) return
    
    await db.users.update(id, {
      deletedAt: new Date(),
      isActive: false,
      syncStatus: 'pending',
      updatedAt: new Date()
    })
  },

  async seedInitialUser(stores: Store[]): Promise<User> {
    const existingUsers = await userRepo.listUsers()
    if (existingUsers.length > 0) return existingUsers[0]
    
    const tenantId = localStorage.getItem('pos_tenant_id') || 'DEFAULT'
    
    const defaultUser: User = {
      id: createId(),
      tenantId,
      username: 'admin',
      name: 'Admin Utama',
      role: 'admin',
      password: simpleHash('admin123'),
      isActive: true,
      storeIds: stores.map(s => s.id),
      syncStatus: 'pending',
      syncVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }
    
    await db.users.add(defaultUser)
    return defaultUser
  },

  async verifyLogin(username: string, password: string): Promise<User | null> {
    const user = await userRepo.getUserByUsername(username)
    if (!user || !user.isActive) return null
    
    const hashedInput = simpleHash(password)
    if (user.password !== hashedInput) return null
    
    return user
  }
}
