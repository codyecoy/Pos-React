import { useState, useEffect } from 'react'
import { 
  ShoppingBag, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck,
  X,
  CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/useAuthStore'
import { authApi } from '@/services/api'
import { capitalizeWords, formatEmail } from '@/lib/formatters'

export default function LoginPage() {
  const location = useLocation()
  const mode = location.pathname === '/register' ? 'register' : 'login'

  useEffect(() => {
    // Meminta fullscreen ketika halaman dimuat
    const enterFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log('Gagal masuk fullscreen:', err)
        })
      }
    }

    enterFullscreen()
  }, [])

  const [name, setName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [email, setEmail] = useState('admin@pospro.com')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const login = useAuthStore((state) => state.login)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [isForgotLoading, setIsForgotLoading] = useState(false)
  const [forgotStep, setForgotStep] = useState<'email' | 'success'>('email')

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(capitalizeWords(e.target.value))
  }

  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreName(capitalizeWords(e.target.value))
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(formatEmail(e.target.value))
  }

  const handleForgotEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForgotEmail(formatEmail(e.target.value))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    void (async () => {
      try {
        if (mode === 'register') {
          const payload = {
            name: name.trim(),
            storeName: storeName.trim(),
            email: email.trim(),
            password,
          }
          const res = await authApi.register(payload)
          const { user, stores, token } = res.data as any
          if (token) localStorage.setItem('pos_token', String(token))
          login(user, Array.isArray(stores) ? stores : [])
          return
        }

        const res = await authApi.login({ email: email.trim(), password })
        const { user, stores, token } = res.data as any
        if (token) localStorage.setItem('pos_token', String(token))
        login(user, Array.isArray(stores) ? stores : [])
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Login gagal.'
        toast.error(String(msg))
      } finally {
        setIsLoading(false)
      }
    })()
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      toast.error('Silakan masukkan email Anda.')
      return
    }
    setIsForgotLoading(true)
    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      setForgotStep('success')
      toast.success('Email reset password telah dikirim!')
    } catch (e: any) {
      toast.error('Gagal mengirim email reset password.')
    } finally {
      setIsForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Left Side: Illustration/Branding */}
      <div className="hidden md:flex flex-1 bg-primary relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        
        <div className="relative z-10 text-primary-foreground max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-8 shadow-2xl"
          >
            <ShoppingBag size={40} strokeWidth={2.5} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6"
          >
            Sistem Kasir <br /> Paling Cerdas.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg lg:text-xl font-medium text-primary-foreground/80 leading-relaxed"
          >
            Kelola transaksi, stok, dan laporan bisnis Anda dengan mudah di layar tablet Android.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="font-bold">Keamanan Terjamin</p>
              <p className="text-sm text-primary-foreground/60">Enkripsi data end-to-end</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-card">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center md:text-left">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
              {mode === 'register' ? 'Daftar Akun' : 'Masuk ke Akun'}
            </h2>
            <p className="text-muted-foreground font-medium mt-2">
              {mode === 'register' ? 'Buat akun dan toko pertama Anda.' : 'Silakan masukkan detail login Anda.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Nama Anda</label>
                  <div className="relative group">
                    <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      required
                      className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
                      placeholder="Nama lengkap"
                      value={name}
                      onChange={handleNameChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Nama Toko</label>
                  <div className="relative group">
                    <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      required
                      className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
                      placeholder="Contoh: Toko Sembako Jaya"
                      value={storeName}
                      onChange={handleStoreNameChange}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                <input 
                          type="email" 
                          required
                          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
                          placeholder="nama@toko.com"
                          value={email}
                          onChange={handleEmailChange}
                        />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Kata Sandi</label>
                {mode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Lupa sandi?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  className="w-full h-14 pl-12 pr-12 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-all"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex items-center gap-3 px-1">
                <input 
                  type="checkbox" 
                  id="remember" 
                  className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary/20" 
                />
                <label htmlFor="remember" className="text-sm font-bold text-muted-foreground cursor-pointer select-none">
                  Ingat saya di perangkat ini
                </label>
              </div>
            )}

            <button 
              disabled={isLoading}
              className={cn(
                "w-full py-5 rounded-[2rem] bg-primary text-primary-foreground font-black text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 transition-all active:scale-95",
                isLoading && "opacity-70 cursor-wait"
              )}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'register' ? 'DAFTAR SEKARANG' : 'MASUK SEKARANG'}
                  <ArrowRight size={22} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-border/40 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {mode === 'register' ? (
                <>
                  Sudah punya akun? <Link to="/login" className="font-black text-primary hover:underline">Masuk</Link>
                </>
              ) : (
                <>
                  Belum punya akun? <Link to="/register" className="font-black text-primary hover:underline">Daftar akun</Link>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isForgotPasswordOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsForgotPasswordOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-border/40"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Lupa Kata Sandi</p>
                    <p className="text-xl font-black tracking-tight">Reset Kata Sandi</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsForgotPasswordOpen(false)
                      setForgotStep('email')
                      setForgotEmail('')
                    }}
                    className="p-2 rounded-xl hover:bg-accent transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {forgotStep === 'email' ? (
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                      Masukkan email Anda, kami akan mengirimkan tautan untuk mereset kata sandi.
                    </p>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2 block">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                        <input 
                          type="email" 
                          required
                          value={forgotEmail}
                          onChange={handleForgotEmailChange}
                          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
                          placeholder="nama@toko.com"
                        />
                      </div>
                    </div>
                    <button 
                      disabled={isForgotLoading}
                      className={cn(
                        "w-full py-5 rounded-[2rem] bg-primary text-primary-foreground font-black text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 transition-all active:scale-95",
                        isForgotLoading && "opacity-70 cursor-wait"
                      )}
                    >
                      {isForgotLoading ? (
                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'KIRIM TAUTAN RESET'
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6 text-center">
                    <div className="w-20 h-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-black">Tautan Terkirim!</p>
                      <p className="text-sm text-muted-foreground">
                        Periksa email Anda untuk mendapatkan tautan reset kata sandi.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setIsForgotPasswordOpen(false)
                        setForgotStep('email')
                        setForgotEmail('')
                      }}
                      className="w-full py-5 rounded-[2rem] bg-accent/50 border border-border/40 font-black text-lg transition-all active:scale-95"
                    >
                      KEMBALI KE MASUK
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
