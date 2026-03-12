import { useState } from 'react'
import { 
  ShoppingBag, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/useAuthStore'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@pospro.com')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API Call
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Selamat datang kembali, Budi!')
      
      login({
        id: '1',
        name: 'Budi Santoso',
        role: 'admin'
      }, [
        { id: 'S1', name: 'Cabang Jakarta Selatan', address: 'Jl. Sudirman No. 10', phone: '021-1234567' },
        { id: 'S2', name: 'Cabang Bandung', address: 'Jl. Asia Afrika No. 45', phone: '022-7654321' },
      ])
      
      navigate('/dashboard')
    }, 1500)
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
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">Masuk ke Akun</h2>
            <p className="text-muted-foreground font-medium mt-2">Silakan masukkan detail login Anda.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Email Kantor</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  required
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
                  placeholder="nama@toko.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Kata Sandi</label>
                <a href="#" className="text-xs font-bold text-primary hover:underline">Lupa sandi?</a>
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
                  MASUK SEKARANG
                  <ArrowRight size={22} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-border/40 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Belum punya akun? <a href="#" className="font-black text-primary hover:underline">Hubungi Admin</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
