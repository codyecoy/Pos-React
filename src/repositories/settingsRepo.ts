import { db } from '@/lib/db'
import type { StoreSettings, ReceiptSettings, AppPreferences } from '@/types'

const STORE_SETTINGS_KEY = 'store_settings'
const RECEIPT_SETTINGS_KEY = 'receipt_settings'
const APP_PREFERENCES_KEY = 'app_preferences'

export const settingsRepo = {
  async getStoreSettings(): Promise<StoreSettings> {
    const setting = await db.settings.get(STORE_SETTINGS_KEY)
    if (!setting) {
      const defaultSettings: StoreSettings = {
        name: 'POS PRO STORE',
        phone: '021-1234567',
        address: 'Jl. Digital No. 123, Jakarta Selatan',
        currency: 'IDR',
        timezone: 'Asia/Jakarta',
      }
      await db.settings.put({
        key: STORE_SETTINGS_KEY,
        value: JSON.stringify(defaultSettings),
        updatedAt: new Date(),
      })
      return defaultSettings
    }
    return JSON.parse(setting.value) as StoreSettings
  },

  async saveStoreSettings(settings: StoreSettings): Promise<void> {
    await db.settings.put({
      key: STORE_SETTINGS_KEY,
      value: JSON.stringify(settings),
      updatedAt: new Date(),
    })
  },

  async getReceiptSettings(): Promise<ReceiptSettings> {
    const setting = await db.settings.get(RECEIPT_SETTINGS_KEY)
    if (!setting) {
      const defaultSettings: ReceiptSettings = {
        showLogo: true,
        headerMessage: 'Selamat Datang di POS PRO!',
        footerMessage: 'Terima kasih atas kunjungan Anda.',
        showQrCode: true,
      }
      await db.settings.put({
        key: RECEIPT_SETTINGS_KEY,
        value: JSON.stringify(defaultSettings),
        updatedAt: new Date(),
      })
      return defaultSettings
    }
    return JSON.parse(setting.value) as ReceiptSettings
  },

  async saveReceiptSettings(settings: ReceiptSettings): Promise<void> {
    await db.settings.put({
      key: RECEIPT_SETTINGS_KEY,
      value: JSON.stringify(settings),
      updatedAt: new Date(),
    })
  },

  async getAppPreferences(): Promise<AppPreferences> {
    const setting = await db.settings.get(APP_PREFERENCES_KEY)
    if (!setting) {
      const defaultSettings: AppPreferences = {
        scanSound: true,
        lowStockNotification: true,
        autoDarkMode: false,
        animations: true,
      }
      await db.settings.put({
        key: APP_PREFERENCES_KEY,
        value: JSON.stringify(defaultSettings),
        updatedAt: new Date(),
      })
      return defaultSettings
    }
    return JSON.parse(setting.value) as AppPreferences
  },

  async saveAppPreferences(preferences: AppPreferences): Promise<void> {
    await db.settings.put({
      key: APP_PREFERENCES_KEY,
      value: JSON.stringify(preferences),
      updatedAt: new Date(),
    })
  },
}
