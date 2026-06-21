import { create } from 'zustand'
import { StoreSettings, ReceiptSettings, AppPreferences } from '@/types'
import { settingsRepo } from '@/repositories/settingsRepo'

interface SettingsState {
  storeSettings: StoreSettings
  receiptSettings: ReceiptSettings
  appPreferences: AppPreferences
  isLoading: boolean
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
  setStoreSettings: (settings: Partial<StoreSettings>) => void
  setReceiptSettings: (settings: Partial<ReceiptSettings>) => void
  setAppPreferences: (preferences: Partial<AppPreferences>) => void
}

const defaultStoreSettings: StoreSettings = {
  name: 'POS PRO STORE',
  phone: '021-1234567',
  address: 'Jl. Digital No. 123, Jakarta Selatan',
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
  useVAT: true,
  vatRate: 11
}

const defaultReceiptSettings: ReceiptSettings = {
  showLogo: true,
  headerMessage: 'Selamat Datang di POS PRO!',
  footerMessage: 'Terima kasih atas kunjungan Anda.',
  showQrCode: true
}

const defaultAppPreferences: AppPreferences = {
  scanSound: true,
  lowStockNotification: true,
  autoDarkMode: false,
  animations: true
}

export const useSettingsStore = create<SettingsState>()(
  (set, get) => ({
    storeSettings: defaultStoreSettings,
    receiptSettings: defaultReceiptSettings,
    appPreferences: defaultAppPreferences,
    isLoading: true,

    loadSettings: async () => {
      set({ isLoading: true })
      try {
        const [store, receipt, app] = await Promise.all([
          settingsRepo.getStoreSettings(),
          settingsRepo.getReceiptSettings(),
          settingsRepo.getAppPreferences(),
        ])
        set({
          storeSettings: store,
          receiptSettings: receipt,
          appPreferences: app,
          isLoading: false
        })
      } catch {
        set({
          storeSettings: defaultStoreSettings,
          receiptSettings: defaultReceiptSettings,
          appPreferences: defaultAppPreferences,
          isLoading: false
        })
      }
    },

    saveSettings: async () => {
      await Promise.all([
        settingsRepo.saveStoreSettings(get().storeSettings),
        settingsRepo.saveReceiptSettings(get().receiptSettings),
        settingsRepo.saveAppPreferences(get().appPreferences),
      ])
    },

    setStoreSettings: (settings) => set((state) => ({
      storeSettings: { ...state.storeSettings, ...settings }
    })),

    setReceiptSettings: (settings) => set((state) => ({
      receiptSettings: { ...state.receiptSettings, ...settings }
    })),

    setAppPreferences: (preferences) => set((state) => ({
      appPreferences: { ...state.appPreferences, ...preferences }
    }))
  })
)
