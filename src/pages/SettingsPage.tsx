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
  ChevronRight,
  Camera,
  Image as ImageIcon
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

type TabType = 'store' | 'receipt' | 'app' | 'security'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('store')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Pengaturan berhasil disimpan!')
    }, 1500)
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
          disabled={isLoading}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {isLoading ? (
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
                    <div className="w-32 h-32 rounded-[2rem] bg-accent/50 border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-primary/5 hover:border-primary/40 transition-all cursor-pointer group relative">
                      <ImageIcon size={32} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                      <p className="text-[10px] font-black uppercase mt-2">Ganti Logo</p>
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Nama Toko</label>
                        <input 
                          type="text" 
                          defaultValue="POS PRO STORE - JAKARTA"
                          className="w-full h-14 px-6 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">No. Telepon Bisnis</label>
                        <input 
                          type="tel" 
                          defaultValue="021-1234567"
                          className="w-full h-14 px-6 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Alamat Kantor Pusat</label>
                      <textarea 
                        defaultValue="Jl. Digital No. 123, SCBD Kav 52-53, Jakarta Selatan, 12190"
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
                        <input type="text" placeholder="@instagram_toko" className="flex-1 bg-transparent border-none text-sm font-bold focus:ring-0" />
                      </div>
                      <div className="flex items-center gap-3 bg-accent/30 p-2 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-blue-500">
                          <Globe size={20} />
                        </div>
                        <input type="text" placeholder="www.website.com" className="flex-1 bg-transparent border-none text-sm font-bold focus:ring-0" />
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
                        <select className="w-full h-12 px-4 rounded-xl bg-accent/30 border-none ring-1 ring-border/40 text-sm font-bold">
                          <option>IDR (Rp)</option>
                          <option>USD ($)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase ml-2">Zona Waktu</p>
                        <select className="w-full h-12 px-4 rounded-xl bg-accent/30 border-none ring-1 ring-border/40 text-sm font-bold">
                          <option>Asia/Jakarta (WIB)</option>
                          <option>Asia/Makassar (WITA)</option>
                        </select>
                      </div>
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
                          <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Pesan Pembuka (Header)</label>
                          <input type="text" defaultValue="Selamat Datang di POS PRO!" className="w-full h-12 px-6 rounded-xl bg-accent/30 border-none ring-1 ring-border/40 text-sm font-bold" />
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
                          <textarea defaultValue="Terima kasih atas kunjungan Anda. Simpan struk ini sebagai bukti pembelian yang sah." className="w-full h-24 p-4 rounded-xl bg-accent/30 border-none ring-1 ring-border/40 text-sm font-bold resize-none" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-accent/30 rounded-2xl border border-border/40">
                          <div>
                            <p className="font-bold text-sm">Cetak QR Struk</p>
                            <p className="text-xs text-muted-foreground">QR Code untuk akses struk digital.</p>
                          </div>
                          <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Preview */}
                  <div className="w-full xl:w-[350px] shrink-0">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 text-center">Preview Struk</p>
                    <div className="bg-white text-gray-900 p-8 rounded-[2rem] shadow-2xl space-y-4 font-mono text-xs scale-90 origin-top">
                      <div className="text-center space-y-1">
                        <p className="font-black text-sm uppercase">POS PRO STORE</p>
                        <p>Jl. Digital No. 123, Jakarta</p>
                        <p>021-1234567</p>
                      </div>
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
                        <div className="w-16 h-16 bg-gray-200 mx-auto rounded flex items-center justify-center text-[8px] font-bold text-gray-400">QR CODE</div>
                        <p className="px-4">Terima kasih atas kunjungan Anda.</p>
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
                        <p className="font-bold text-sm">Suara Scan Barcode</p>
                        <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                          <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-accent/30 rounded-2xl border border-border/40">
                        <p className="font-bold text-sm">Notifikasi Stok Rendah</p>
                        <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                          <div className="w-4 h-4 bg-white rounded-full ml-auto" />
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
                        <p className="font-bold text-sm">Mode Gelap Otomatis</p>
                        <div className="w-12 h-6 bg-muted rounded-full relative p-1 cursor-pointer">
                          <div className="w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-accent/30 rounded-2xl border border-border/40">
                        <p className="font-bold text-sm">Animasi Transisi</p>
                        <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                          <div className="w-4 h-4 bg-white rounded-full ml-auto" />
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
                className="p-8 lg:p-12 flex flex-col items-center justify-center text-center space-y-6 opacity-40 grayscale"
              >
                <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center">
                  <ShieldCheck size={48} className="text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Pengaturan Keamanan</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1 max-w-md mx-auto">
                    Fitur otentikasi dua faktor (2FA) dan manajemen sesi perangkat sedang dikembangkan.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
