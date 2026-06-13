import { db } from '@/lib/db'
import type { User } from '@/types'
import { createId } from '@/lib/ids'

const USER_KEY = 'current_user'

// Simple hashing (for demo purposes only - in production use bcrypt or similar)
export const simpleHash = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString()
}

export const authRepo = {
  async getCurrentUser(): Promise<User | null> {
    const setting = await db.settings.get(USER_KEY)
    if (!setting) return null
    return JSON.parse(setting.value) as User
  },

  async saveCurrentUser(user: User): Promise<void> {
    await db.settings.put({
      key: USER_KEY,
      value: JSON.stringify(user),
      updatedAt: new Date(),
    })
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = await authRepo.getCurrentUser()
    if (!user) throw new Error('User tidak ditemukan')
    
    // Check if user has a password set
    if (user.password) {
      const hashedCurrent = simpleHash(currentPassword)
      if (hashedCurrent !== user.password) {
        throw new Error('Password saat ini salah')
      }
    } else if (currentPassword) {
      // If no password set but user provided one, that's wrong
      throw new Error('Password saat ini salah')
    }

    const updatedUser: User = {
      ...user,
      password: simpleHash(newPassword),
    }

    await authRepo.saveCurrentUser(updatedUser)
  },

  async createInitialUser(): Promise<User> {
    const defaultUser: User = {
      id: createId(),
      name: 'Admin',
      role: 'admin',
    }
    await authRepo.saveCurrentUser(defaultUser)
    return defaultUser
  }
}
