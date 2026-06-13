import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import CashierPage from './pages/CashierPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import CustomersPage from './pages/CustomersPage'
import ReportsPage from './pages/ReportsPage'
import AuditLogPage from './pages/AuditLogPage'
import SettingsPage from './pages/SettingsPage'
import SuppliersPage from './pages/SuppliersPage'
import PurchasingPage from './pages/PurchasingPage'
import DebtsPage from './pages/DebtsPage'
import LoginPage from './pages/LoginPage'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/useAuthStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { startSyncEngine, syncDownFromServer } from '@/sync/syncEngine'
import { ConfirmProvider } from '@/components/ui/confirm'
import { ensureLicenseValidOrReset } from '@/repositories/transactionsRepo'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { isLoggedIn, logout } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Fungsi untuk meminta full screen
  const requestFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Gagal masuk full screen:', err)
      })
    }
  }

  // Meminta full screen saat aplikasi dimuat dan saat user login
  useEffect(() => {
    requestFullScreen()

    // Listener klik untuk masuk full screen saat ada interaksi pengguna
    const handleUserInteraction = () => {
      requestFullScreen()
    }

    document.addEventListener('click', handleUserInteraction, { once: true })

    return () => {
      document.removeEventListener('click', handleUserInteraction)
    }
  }, [])

  // Listener untuk memastikan tetap full screen saat perubahan state login
  useEffect(() => {
    requestFullScreen()
  }, [isLoggedIn])

  // Listener untuk keluar full screen ketika full screen berubah
  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
      requestFullScreen()
      }
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange)
    }
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return
    void (async () => {
      await ensureLicenseValidOrReset()
      try {
        await syncDownFromServer()
      } catch {
      } finally {
        useInventoryStore.getState().hydrate()
      }
    })()
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) return
    const stop = startSyncEngine()
    return () => stop()
  }, [isLoggedIn])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  if (!isLoggedIn) {
    return (
      <ConfirmProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </Router>
      </ConfirmProvider>
    )
  }

  return (
    <ConfirmProvider>
      <Router>
        <div className="flex h-screen bg-background overflow-hidden">
          <Sidebar onLogout={logout} />
          {isMobileMenuOpen && (
            <Sidebar 
              onLogout={logout} 
              isMobile 
              onClose={() => setIsMobileMenuOpen(false)} 
            />
          )}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <Header 
              isDarkMode={isDarkMode} 
              toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
              onLogout={logout}
              onMenuClick={() => setIsMobileMenuOpen(true)}
            />
            <main className="flex-1 overflow-y-auto p-4 tablet:p-6">
              <Routes>
                <Route path="/" element={<Navigate to="/cashier" replace />} />
                <Route path="/cashier" element={<CashierPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/audit-log" element={<AuditLogPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/purchasing" element={<PurchasingPage />} />
                <Route path="/debts" element={<DebtsPage />} />
                <Route path="*" element={<Navigate to="/cashier" replace />} />
              </Routes>
            </main>
          </div>
        </div>
        <Toaster position="top-right" richColors />
      </Router>
    </ConfirmProvider>
  )
}

export default App
