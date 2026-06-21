import { 
  Settings, 
  Store as StoreIcon, 
  Receipt as ReceiptIcon, 
  Smartphone, 
  ShieldCheck, 
  Bell, 
  Save, 
  Printer, 
  Globe, 
  Languages, 
  HelpCircle,
  Camera,
  Image as ImageIcon,
  CreditCard,
  CheckCircle2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { activateLicense, getLicenseStatus } from '@/repositories/transactionsRepo'
import { useSettingsStore } from '@/store/useSettingsStore'
import { capitalizeWords, formatPhoneNumber } from '@/lib/formatters'

type TabType = 'store' | 'receipt' | 'app' | 'security'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('store')
  const [isSaving, setIsSaving] = useState(false)
  const [activationCode, setActivationCode] = useState('')
  const [isActivating, setIsActivating] = useState(false)
  
  const {
    storeSettings,
    receiptSettings,
    appPreferences,
    isLoading,
    loadSettings,
    saveSettings,
    setStoreSettings: updateStoreSettings,
    setReceiptSettings: updateReceiptSettings,
    setAppPreferences: updateAppPreferences
  } = useSettingsStore()

  const license = useLiveQuery(async () => getLicenseStatus(), [], null)
  
  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveSettings()
      toast.success('Pengaturan berhasil disimpan!')
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        updateStoreSettings({ logo: result })
        toast.success('Logo berhasil diupload!')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateStoreSettings({ name: capitalizeWords(e.target.value) })
  }

  const handleStorePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateStoreSettings({ phone: formatPhoneNumber(e.target.value) })
  }

  const handleStoreAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateStoreSettings({ address: capitalizeWords(e.target.value) })
  }

  const handleSocialInstagramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateStoreSettings({ 
      socialMedia: { ...storeSettings.socialMedia, instagram: e.target.value }
    })
  }

  const handleSocialWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateStoreSettings({ 
      socialMedia: { ...storeSettings.socialMedia, website: e.target.value.toLowerCase() }
    })
  }

  const toggleSwitch = (key: keyof typeof receiptSettings | keyof typeof appPreferences, value: boolean) => {
    if (key in receiptSettings) {
      updateReceiptSettings({ [key]: value })
    } else if (key in appPreferences) {
      updateAppPreferences({ [key]: value })
    }
  }

  const tabs = [
    { id: 'store', label: 'Profil Toko', icon: StoreIcon },
    { id: 'receipt', label: 'Kustomisasi Struk', icon: ReceiptIcon },
    { id: 'app', label: 'Preferensi Aplikasi', icon: Smartphone },
    { id: 'security', label: 'Keamanan', icon: ShieldCheck },
  ]

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase flex items-center gap-4">
            <Settings className="text-primary w-10 h-10 lg:w-12 lg:h-12" />
            Pengaturan
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Konfigurasi sistem dan kustomisasi toko Anda.</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={20} strokeWidth={2.5} />
          )}
          SIMPAN PERUBAHAN
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Tab Navigation */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-card p-3 rounded-[2rem] border border-border/40 shadow-sm space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-bold text-sm",
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="mt-6 p-6 bg-accent/30 rounded-[2rem] border border-border/40">
            <div className="flex items-center gap-3 text-primary mb-2">
              <HelpCircle size={18} />
              <p className="text-sm font-black uppercase tracking-widest">Butuh Bantuan?</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Hubungi tim teknis kami jika Anda kesulitan melakukan konfigurasi.
            </p>
            <button className="mt-4 w-full py-3 rounded-xl bg-card border border-border/40 text-xs font-black uppercase tracking-widest hover:bg-accent transition-all">
              Hubungi Support
            </button>
          </div>
        </div>

        {/* Right: Tab Content */}
        <div className="flex-1 bg-card rounded-[2.5rem] border border-border/40 shadow-sm overflow-hidden min-h-[600px]">
          <AnimatePresence mode="wait">
            {activeTab === 'store' && (
              <motion.div
                key="store"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 lg:p-12 space-y-10"
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="shrink-0">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 ml-2">Logo Toko</p>
                    <div className="w-32 h-32 rounded-[2rem] bg-accent/50 border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer group relative overflow-hidden">
                      {storeSettings.logo ? (
                        <img src={storeSettings.logo} alt="Logo Toko" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <ImageIcon size={32} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                          <p className="text-[10px] font-black uppercase mt-2">Ganti Logo</p>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Nama Toko</label>
                        <input 
                          type="text" 
                          value={storeSettings.name}
                          onChange={handleStoreNameChange}
                          className="w-full h-14 px-6 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">No. Telepon Bisnis</label>
                        <input 
                          type="tel" 
                          value={storeSettings.phone}
                          onChange={handleStorePhoneChange}
                          className="w-full h-14 px-6 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Alamat Kantor Pusat</label>
                      <textarea 
                        value={storeSettings.address}
                        onChange={handleStoreAddressChange}
                        className="w-full h-28 p-6 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-border/40 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                      <Globe size={18} className="text-primary" />
                      Social Media
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-accent/30 p-2 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-pink-500">
                          <ImageIcon size={20} />
                        </div>
                        <input 
                          type="text" 
                          placeholder="@instagram_toko" 
                          value={storeSettings.socialMedia?.instagram || ''}
                          onChange={handleSocialInstagramChange}
                          className="flex-1 bg-transparent border-none text-sm font-bold focus:ring-0" 
                        />
                      </div>
                      <div className="flex items-center gap-3 bg-accent/30 p-2 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-blue-500">
                          <Globe size={20} />
                        </div>
                        <input 
                          type="text" 
                          placeholder="www.website.com" 
                          value={storeSettings.socialMedia?.website || ''}
                          onChange={handleSocialWebsiteChange}
                          className="flex-1 bg-transparent border-none text-sm font-bold focus:ring-0" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                      <Languages size={18} className="text-primary" />
                      Regional
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase ml-2">Mata Uang</p>
                        <select 
                          value={storeSettings.currency}
                          onChange={(e) => updateStoreSettings({ currency: e.target.value })}
                          className="w-full h-12 px-4 rounded-xl bg-accent/30 border-none ring-1 ring-border/40 text-sm font-bold"
                        >
                          <option value="IDR">IDR (Rp)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase ml-2">Zona Waktu</p>
                        <select 
                          value={storeSettings.timezone}
                          onChange={(e) => updateStoreSettings({ timezone: e.target.value })}
                          className="w-full h-12 px-4 rounded-xl bg-accent/30 border-none ring-1 ring-border/40 text-sm font-bold"
                        >
                          <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                          <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                          <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                      <CreditCard size={18} className="text-primary" />
                      Pajak (PPN)
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-accent/30 rounded-2xl border border-border/40">
                        <div>
                          <p className="font-bold text-sm">Pakai PPN</p>
                          <p className="text-xs text-muted-foreground">Menghitung pajak PPN pada transaksi.</p>
                        </div>
                        <div 
                          onClick={() => updateStoreSettings({ useVAT: !storeSettings.useVAT })}
                          className={cn(
                            "w-12 h-6 rounded-full relative p-1 cursor-pointer transition-all",
                            storeSettings.useVAT ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 bg-white rounded-full transition-all",
                            storeSettings.useVAT ? "ml-auto" : ""
                          )} />
                        </div>
                      </div>
                      {storeSettings.useVAT && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-muted-foreground uppercase ml-2">Tarif PPN (%)</p>
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            step="0.1"
                            value={storeSettings.vatRate}
                            onChange={(e) => updateStoreSettings({ vatRate: Number(e.target.value) })}
                            className="w-full h-12 px-4 rounded-xl bg-accent/30 border-none ring-1 ring-border/40 text-sm font-bold"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'receipt' && (
              <motion.div
                key="receipt"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 lg:p-12"
              >
                <div className="flex flex-col xl:flex-row gap-12">
                  <div className="flex-1 space-y-8">
                    <div className="space-y-6">
                      <h4 className="font-black text-lg uppercase tracking-tight flex items-center gap-3">
                        <Printer className="text-primary" />
                        Header Struk
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-accent/30 rounded-2xl border border-border/40">
                          <div>
                            <p className="font-bold text-sm">Tampilkan Logo</p>
                            <p className="text-xs text-muted-foreground">Logo akan muncul di bagian paling atas struk.</p>
                          </div>
                          <div 
                            onClick={() => toggleSwitch('showLogo', !receiptSettings.showLogo)}
                            className={cn(
                              "w-12 h-6 rounded-full relative p-1 cursor-pointer transition-all",
                              receiptSettings.showLogo ? "bg-primary" : "bg-muted"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 bg-white rounded-full transition-all",
                              receiptSettings.showLogo ? "ml-auto" : ""
                            )} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Pesan Pembuka (Header)</label>
                          <input 
                            type="text" 
                            value={receiptSettings.headerMessage}
                            onChange={(e) => updateReceiptSettings({ headerMessage: e.target.value })}
                            className="w-full h-12 px-6 rounded-xl bg-accent/30 border-none ring-1 ring-border/40 text-sm font-bold focus:ring-2 focus:ring-primary/40 transition-all" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="font-black text-lg uppercase tracking-tight flex items-center gap-3">
                        <ImageIcon className="text-primary" />
                        Footer Struk
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Pesan Penutup (Footer)</label>
                          <textarea 
                            value={receiptSettings.footerMessage}
                            onChange={(e) => updateReceiptSettings({ footerMessage: e.target.value })}
                            className="w-full h-24 p-4 rounded-xl bg-accent/30 border-none ring-1 ring-border/40 text-sm font-bold resize-none focus:ring-2 focus:ring-primary/40 transition-all" 
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-accent/30 rounded-2xl border border-border/40">
                          <div>
                            <p className="font-bold text-sm">Cetak QR Struk</p>
                            <p className="text-xs text-muted-foreground">QR Code untuk akses struk digital.</p>
                          </div>
                          <div 
                            onClick={() => toggleSwitch('showQrCode', !receiptSettings.showQrCode)}
                            className={cn(
                              "w-12 h-6 rounded-full relative p-1 cursor-pointer transition-all",
                              receiptSettings.showQrCode ? "bg-primary" : "bg-muted"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 bg-white rounded-full transition-all",
                              receiptSettings.showQrCode ? "ml-auto" : ""
                            )} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Preview */}
                  <div className="w-full xl:w-[350px] shrink-0">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 text-center">Preview Struk</p>
                    <div className="bg-white text-gray-900 p-8 rounded-[2rem] shadow-2xl space-y-4 font-mono text-xs scale-90 origin-top">
                      {receiptSettings.showLogo && storeSettings.logo && (
                        <div className="flex justify-center mb-4">
                          <img src={storeSettings.logo} alt="Logo" className="w-16 h-16 object-contain rounded-lg" />
                        </div>
                      )}
                      <div className="text-center space-y-1">
                        <p className="font-black text-sm uppercase">{storeSettings.name}</p>
                        <p>{storeSettings.address}</p>
                        <p>{storeSettings.phone}</p>
                      </div>
                      {receiptSettings.headerMessage && (
                        <p className="text-center italic text-gray-500 pt-2">{receiptSettings.headerMessage}</p>
                      )}
                      <div className="border-t border-dashed border-gray-300 pt-4 space-y-2">
                        <div className="flex justify-between">
                          <span>Cappuccino XL</span>
                          <span>35.000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Croissant</span>
                          <span>18.000</span>
                        </div>
                      </div>
                      <div className="border-t border-dashed border-gray-300 pt-4">
                        <div className="flex justify-between font-black text-sm">
                          <span>TOTAL</span>
                          <span>53.000</span>
                        </div>
                      </div>
                      <div className="pt-4 text-center space-y-2">
                        {receiptSettings.showQrCode && (
                          <div className="w-16 h-16 bg-gray-200 mx-auto rounded flex items-center justify-center text-[8px] font-bold text-gray-400">QR CODE</div>
                        )}
                        {receiptSettings.footerMessage && (
                          <p className="px-4">{receiptSettings.footerMessage}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'app' && (
              <motion.div
                key="app"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 lg:p-12 space-y-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="font-black text-lg uppercase tracking-tight flex items-center gap-3">
                      <Bell className="text-primary" />
                      Notifikasi & Suara
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-accent/30 rounded-2xl border border-border/40">
                        <div>
                          <p className="font-bold text-sm">Suara Scan Barcode</p>
                          <p className="text-xs text-muted-foreground">Bunyi saat scan barcode berhasil.</p>
                        </div>
                        <div 
                          onClick={() => toggleSwitch('scanSound', !appPreferences.scanSound)}
                          className={cn(
                            "w-12 h-6 rounded-full relative p-1 cursor-pointer transition-all",
                            appPreferences.scanSound ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 bg-white rounded-full transition-all",
                            appPreferences.scanSound ? "ml-auto" : ""
                          )} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-accent/30 rounded-2xl border border-border/40">
                        <div>
                          <p className="font-bold text-sm">Notifikasi Stok Rendah</p>
                          <p className="text-xs text-muted-foreground">Dapatkan pemberitahuan saat stok barang hampir habis.</p>
                        </div>
                        <div 
                          onClick={() => toggleSwitch('lowStockNotification', !appPreferences.lowStockNotification)}
                          className={cn(
                            "w-12 h-6 rounded-full relative p-1 cursor-pointer transition-all",
                            appPreferences.lowStockNotification ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 bg-white rounded-full transition-all",
                            appPreferences.lowStockNotification ? "ml-auto" : ""
                          )} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="font-black text-lg uppercase tracking-tight flex items-center gap-3">
                      <Smartphone className="text-primary" />
                      Layar & Tampilan
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-accent/30 rounded-2xl border border-border/40">
                        <div>
                          <p className="font-bold text-sm">Mode Gelap Otomatis</p>
                          <p className="text-xs text-muted-foreground">Sesuaikan tema dengan pengaturan sistem.</p>
                        </div>
                        <div 
                          onClick={() => toggleSwitch('autoDarkMode', !appPreferences.autoDarkMode)}
                          className={cn(
                            "w-12 h-6 rounded-full relative p-1 cursor-pointer transition-all",
                            appPreferences.autoDarkMode ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 bg-white rounded-full transition-all",
                            appPreferences.autoDarkMode ? "ml-auto" : ""
                          )} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-accent/30 rounded-2xl border border-border/40">
                        <div>
                          <p className="font-bold text-sm">Animasi Transisi</p>
                          <p className="text-xs text-muted-foreground">Efek animasi saat berpindah halaman.</p>
                        </div>
                        <div 
                          onClick={() => toggleSwitch('animations', !appPreferences.animations)}
                          className={cn(
                            "w-12 h-6 rounded-full relative p-1 cursor-pointer transition-all",
                            appPreferences.animations ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 bg-white rounded-full transition-all",
                            appPreferences.animations ? "ml-auto" : ""
                          )} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8 lg:p-12 space-y-10"
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Lisensi & Aktivasi</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1 max-w-2xl">
                      Mode trial gratis: maksimal 250 transaksi penjualan atau 14 hari sejak pertama digunakan.
                    </p>
                  </div>
                  <div className={cn(
                    "px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest border",
                    license?.isPaid ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}>
                    {license?.isPaid ? 'Premium' : 'Trial'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status Trial */}
                  <div className="bg-accent/20 border border-border/40 rounded-[2rem] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Status Trial</p>
                      <ShieldCheck size={18} className="text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-muted-foreground">Transaksi terpakai</p>
                        <p className="text-sm font-black">{license ? license.saleCount : '-'}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-muted-foreground">Sisa transaksi</p>
                        <p className="text-sm font-black">{license ? license.trialTransactionsLeft : '-'}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-muted-foreground">Sisa hari</p>
                        <p className="text-sm font-black">{license ? license.trialDaysLeft : '-'}</p>
                      </div>
                    </div>
                    {!license?.isPaid && license?.trialExpired && (
                      <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
                        <p className="text-sm font-black uppercase tracking-widest">Trial sudah habis</p>
                        <p className="text-xs font-bold mt-1">
                          Silakan beli paket premium untuk terus menggunakan aplikasi.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Paket Premium */}
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-[2rem] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-primary uppercase tracking-widest">Paket Premium</p>
                      <CheckCircle2 size={18} className="text-primary" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-end gap-2">
                        <p className="text-3xl font-black text-primary">Rp 99.000</p>
                        <p className="text-xs font-bold text-muted-foreground mb-1">/ bulan</p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span>Unlimited transaksi</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span>Support 24/7</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span>Backup data otomatis</span>
                        </li>
                      </ul>
                      {!license?.isPaid && (
                        <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                          <CreditCard size={16} />
                          Beli Paket
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
