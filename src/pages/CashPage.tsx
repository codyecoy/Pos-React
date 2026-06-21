
import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  X,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Calendar as CalendarIcon,
  Tag,
  Save
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { COA, CashTransaction, CashTransactionType } from '@/types'
import { createId } from '@/lib/ids'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import { useConfirm } from '@/components/ui/confirm'
import { cashRepo } from '@/repositories/cashRepo'
import { formatCurrency } from '@/lib/formatters'
import { useAuthStore } from '@/store/useAuthStore'
import ComboBox from '@/components/ui/ComboBox'

export default function CashPage() {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [isCoaModalOpen, setIsCoaModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [transactions, setTransactions] = useState<CashTransaction[]>([])
  const [coas, setCoas] = useState<COA[]>([])
  const [balance, setBalance] = useState<number>(0)
  const [coaEdits, setCoaEdits] = useState<Record<string, Partial<COA>>>({})
  const [newCoa, setNewCoa] = useState<Partial<COA>>({
    code: '',
    name: '',
    type: 'expense',
    description: '',
    isActive: true
  })

  const { user } = useAuthStore()
  const confirm = useConfirm()

  // Load data
  const loadData = async () => {
    await cashRepo.seedCoaIfEmpty()
    const coasData = await cashRepo.listCoa()
    const transData = await cashRepo.listCashTransactions()
    const bal = await cashRepo.getCashBalance()
    setCoas(coasData)
    setTransactions(transData)
    setBalance(bal)

    // Initialize coa edits
    const edits: Record<string, Partial<COA>> = {}
    coasData.forEach(c => edits[c.id] = { ...c })
    setCoaEdits(edits)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return transactions
    return transactions.filter((t) => {
      const desc = (t.description || '').toLowerCase()
      const coaName = (t.coaName || '').toLowerCase()
      const ref = (t.referenceNumber || '').toLowerCase()
      return desc.includes(q) || coaName.includes(q) || ref.includes(q)
    })
  }, [transactions, searchQuery])

  const totalIncome = useMemo(() =>
    transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    , [transactions])

  const totalExpense = useMemo(() =>
    transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    , [transactions])

  // Transaction Modal State
  const [transactionForm, setTransactionForm] = useState<{
    type: CashTransactionType,
    amount: string,
    coaId: string,
    description: string,
    date: string,
    referenceNumber: string
  }>({
    type: 'income',
    amount: '',
    coaId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    referenceNumber: ''
  })

  useEffect(() => {
    if (selectedTransaction) {
      setTransactionForm({
        type: selectedTransaction.type,
        amount: String(selectedTransaction.amount),
        coaId: selectedTransaction.coaId,
        description: selectedTransaction.description,
        date: selectedTransaction.date.toISOString().split('T')[0],
        referenceNumber: selectedTransaction.referenceNumber || ''
      })
    } else {
      setTransactionForm({
        type: 'income',
        amount: '',
        coaId: coas.find(c => c.isActive)?.id || '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        referenceNumber: ''
      })
    }
  }, [selectedTransaction, isTransactionModalOpen, coas])

  const handleAddTransaction = () => {
    setSelectedTransaction(null)
    setIsTransactionModalOpen(true)
  }

  const handleEditTransaction = (transaction: CashTransaction) => {
    setSelectedTransaction(transaction)
    setIsTransactionModalOpen(true)
  }

  const handleSaveTransaction = async () => {
    const numAmount = Number(transactionForm.amount.replace(/[^0-9]/g, ''))
    if (!numAmount || numAmount <= 0) {
      toast.error('Jumlah harus diisi dan lebih dari 0!')
      return
    }
    if (!transactionForm.coaId) {
      toast.error('Pilih akun terlebih dahulu!')
      return
    }
    if (!transactionForm.description.trim()) {
      toast.error('Keterangan harus diisi!')
      return
    }

    const coa = coas.find(c => c.id === transactionForm.coaId)
    if (!coa) return

    const storeId = localStorage.getItem('pos_store_id') || 'DEFAULT'

    const transactionData: CashTransaction = {
      id: selectedTransaction?.id || createId(),
      storeId,
      type: transactionForm.type,
      amount: numAmount,
      coaId: coa.id,
      coaName: coa.name,
      coaCode: coa.code,
      description: transactionForm.description.trim(),
      date: new Date(transactionForm.date),
      cashierId: user?.id || '',
      cashierName: user?.name || 'Kasir',
      referenceNumber: transactionForm.referenceNumber.trim() || undefined
    }

    if (selectedTransaction) {
      await cashRepo.updateCashTransaction(selectedTransaction.id, transactionData)
      toast.success('Transaksi berhasil diperbarui!')
    } else {
      await cashRepo.createCashTransaction(transactionData)
      toast.success('Transaksi berhasil ditambahkan!')
    }

    await loadData()
    setIsTransactionModalOpen(false)
  }

  const handleDeleteTransaction = (id: string) => {
    void (async () => {
      const ok = await confirm({
        title: 'Hapus Transaksi',
        description: 'Apakah Anda yakin ingin menghapus transaksi ini?',
        confirmText: 'Hapus',
        cancelText: 'Batal',
        destructive: true
      })
      if (!ok) return
      await cashRepo.softDeleteCashTransaction(id)
      await loadData()
      toast.error('Transaksi telah dihapus.')
    })()
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    setTransactionForm(prev => ({ ...prev, amount: val }))
  }

  // COA Management
  const handleOpenCoaModal = () => {
    const initial: Record<string, Partial<COA>> = {}
    coas.forEach(c => initial[c.id] = { ...c })
    setCoaEdits(initial)
    setNewCoa({
      code: '',
      name: '',
      type: 'expense',
      description: '',
      isActive: true
    })
    setIsCoaModalOpen(true)
  }

  const handleAddCoa = async () => {
    if (!newCoa.code?.trim() || !newCoa.name?.trim()) {
      toast.error('Kode dan nama akun harus diisi!')
      return
    }
    const id = createId()
    const coa: COA = {
      id,
      code: newCoa.code.trim(),
      name: newCoa.name.trim(),
      type: newCoa.type || 'expense',
      description: newCoa.description?.trim() || '',
      isActive: newCoa.isActive !== false,
      syncStatus: 'pending',
      syncVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    }
    await cashRepo.upsertCoa(coa)
    await loadData()
    toast.success('Akun berhasil ditambahkan!')
    setNewCoa({
      code: '',
      name: '',
      type: 'expense',
      description: '',
      isActive: true
    })
  }

  const handleSaveCoa = async (id: string) => {
    const coaData = coaEdits[id]
    if (!coaData) return
    await cashRepo.upsertCoa(coaData as COA)
    await loadData()
    toast.success('Akun berhasil diperbarui!')
  }

  const handleDeleteCoa = async (coa: COA) => {
    const ok = await confirm({
      title: 'Hapus Akun COA',
      description: `Apakah Anda yakin ingin menghapus akun "${coa.name}"?`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      destructive: true
    })
    if (!ok) return
    await cashRepo.softDeleteCoa(coa.id)
    await loadData()
    toast.error('Akun telah dihapus.')
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight uppercase flex items-center gap-4">
            <Wallet className="text-primary w-10 h-10 lg:w-12 lg:h-12" />
            Manajemen Kas
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Catat semua pemasukan dan pengeluaran dengan akun COA.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCoaModal}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-accent/40 border border-border/40 font-black text-base hover:bg-accent transition-all active:scale-95"
          >
            <Tag size={22} strokeWidth={3} />
            AKUN COA
          </button>
          <button
            onClick={handleAddTransaction}
            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={22} strokeWidth={3} />
            TAMBAH TRANSAKSI
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 lg:p-8 rounded-[2.5rem] border border-emerald-200/40 shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-white/20">
              <ArrowUpCircle size={28} className="text-white" />
            </div>
          </div>
          <p className="text-emerald-100 font-bold text-sm uppercase tracking-widest mb-2">Total Pemasukan</p>
          <p className="text-3xl font-black text-white">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 lg:p-8 rounded-[2.5rem] border border-rose-200/40 shadow-lg shadow-rose-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-white/20">
              <ArrowDownCircle size={28} className="text-white" />
            </div>
          </div>
          <p className="text-rose-100 font-bold text-sm uppercase tracking-widest mb-2">Total Pengeluaran</p>
          <p className="text-3xl font-black text-white">{formatCurrency(totalExpense)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 lg:p-8 rounded-[2.5rem] border border-blue-200/40 shadow-lg shadow-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-white/20">
              <Wallet size={28} className="text-white" />
            </div>
          </div>
          <p className="text-blue-100 font-bold text-sm uppercase tracking-widest mb-2">Saldo Kas</p>
          <p className="text-3xl font-black text-white">{formatCurrency(balance)}</p>
        </div>
      </div>

      <div className="bg-card p-4 lg:p-6 rounded-[2.5rem] border border-border/40 shadow-sm space-y-6">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Cari transaksi..."
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto -mx-4 lg:-mx-6 px-4 lg:px-6 no-scrollbar">
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-black text-muted-foreground uppercase tracking-widest">
                <th className="pb-4 pl-6">Tanggal</th>
                <th className="pb-4">Akun COA</th>
                <th className="pb-4">Keterangan</th>
                <th className="pb-4">Jenis</th>
                <th className="pb-4">Jumlah</th>
                <th className="pb-4 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr className="bg-background">
                  <td colSpan={6} className="py-10 text-center">
                    <div className="text-muted-foreground font-medium">
                      {searchQuery ? 'Tidak ada transaksi yang sesuai.' : 'Belum ada transaksi kas.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((transaction) => (
                  <tr key={transaction.id} className="group bg-background hover:bg-accent/20 transition-all rounded-2xl shadow-sm border border-border/20">
                    <td className="py-4 pl-6 rounded-l-[1.5rem] border-y border-l border-border/20">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                          <CalendarIcon size={18} className="text-muted-foreground" />
                        </div>
                        <span className="font-bold text-sm">
                          {transaction.date.toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 border-y border-border/20">
                      <div>
                        <span className="font-bold text-sm">{transaction.coaName}</span>
                        <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">{transaction.coaCode}</div>
                      </div>
                    </td>
                    <td className="py-4 border-y border-border/20">
                      <span className="text-sm font-medium">{transaction.description}</span>
                      {transaction.referenceNumber && (
                        <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{transaction.referenceNumber}</div>
                      )}
                    </td>
                    <td className="py-4 border-y border-border/20">
                      <span className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                        transaction.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      )}>
                        {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td className="py-4 border-y border-border/20">
                      <span className={cn(
                        "font-black text-sm",
                        transaction.type === 'income' ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="py-4 pr-6 rounded-r-[1.5rem] border-y border-r border-border/20 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditTransaction(transaction)}
                          className="p-2.5 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                        >
                          <X size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="p-2.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isTransactionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTransactionModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-card rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 lg:p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-2xl tracking-tight uppercase">
                    {selectedTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
                  </h3>
                  <button onClick={() => setIsTransactionModalOpen(false)} className="p-2 rounded-xl hover:bg-accent transition-all">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Transaction Type */}
                  <div className="flex gap-2 bg-accent/30 p-2 rounded-2xl border border-border/40">
                    <button
                      onClick={() => setTransactionForm(prev => ({ ...prev, type: 'income' }))}
                      className={cn(
                        "flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all",
                        transactionForm.type === 'income' ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Pemasukan
                    </button>
                    <button
                      onClick={() => setTransactionForm(prev => ({ ...prev, type: 'expense' }))}
                      className={cn(
                        "flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all",
                        transactionForm.type === 'expense' ? "bg-rose-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Pengeluaran
                    </button>
                  </div>

                  {/* Date & Amount */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Tanggal</label>
                      <div className="relative group">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                        <input
                          type="date"
                          value={transactionForm.date}
                          onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Jumlah</label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary">Rp</span>
                        <input
                          type="text"
                          value={transactionForm.amount ? formatCurrency(Number(transactionForm.amount)).replace('Rp ', '') : ''}
                          onChange={handleAmountChange}
                          placeholder="0"
                          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold text-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* COA */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Akun COA</label>
                    <div className="relative group">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <ComboBox
                        value={transactionForm.coaId}
                        onChange={(v) => setTransactionForm(prev => ({ ...prev, coaId: v }))}
                        options={coas.filter(c => c.isActive).map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
                        placeholder={coas.length === 0 ? 'Belum ada akun' : 'Pilih akun'}
                        searchPlaceholder="Cari akun..."
                        emptyText="Akun tidak ditemukan."
                        disabled={coas.filter(c => c.isActive).length === 0}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">Keterangan</label>
                    <input
                      type="text"
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Deskripsi transaksi..."
                      className="w-full h-14 px-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold"
                    />
                  </div>

                  {/* Reference Number */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-4 block">No. Referensi (Opsional)</label>
                    <input
                      type="text"
                      value={transactionForm.referenceNumber}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                      placeholder="Nomor nota, dsb..."
                      className="w-full h-14 px-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-base font-bold"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsTransactionModalOpen(false)}
                      className="flex-1 py-5 rounded-[2rem] bg-accent/50 border border-border/40 font-black text-sm uppercase tracking-widest hover:bg-accent transition-all active:scale-95"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveTransaction()}
                      className="flex-[2] py-5 rounded-[2rem] bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95"
                    >
                      <Save size={20} strokeWidth={2.5} />
                      Simpan Transaksi
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COA Modal */}
      <AnimatePresence>
        {isCoaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCoaModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-card rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 lg:p-8 border-b border-border/40 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-xl tracking-tight uppercase">Master Akun COA</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Akun COA untuk mencatat transaksi kas.</p>
                </div>
                <button
                  onClick={() => setIsCoaModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-accent transition-all"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 lg:p-8 space-y-6">
                {/* Add new COA */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2 block">Kode Akun</label>
                    <input
                      value={newCoa.code}
                      onChange={(e) => setNewCoa(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Contoh: 1101"
                      className="w-full h-12 px-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2 block">Nama Akun</label>
                    <input
                      value={newCoa.name}
                      onChange={(e) => setNewCoa(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nama akun..."
                      className="w-full h-12 px-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2 block">Jenis</label>
                    <select
                      value={newCoa.type}
                      onChange={(e) => setNewCoa(prev => ({ ...prev, type: e.target.value as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' }))}
                      className="w-full h-12 px-4 rounded-2xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-bold"
                    >
                      <option value="asset">Asset</option>
                      <option value="liability">Liabilitas</option>
                      <option value="equity">Ekuitas</option>
                      <option value="revenue">Pendapatan</option>
                      <option value="expense">Biaya</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={() => void handleAddCoa()}
                      className="w-full px-5 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Tambah
                    </button>
                  </div>
                </div>

                {/* COA List */}
                <div className="space-y-3 max-h-[55vh] overflow-y-auto no-scrollbar pr-1">
                  {coas.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-accent/20 text-center text-sm font-bold text-muted-foreground">
                      Belum ada akun COA.
                    </div>
                  ) : (
                    coas.map((c) => (
                      <div key={c.id} className="p-4 rounded-2xl bg-background border border-border/30 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                          <Tag size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{c.code}</span>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                              c.type === 'income' || c.type === 'revenue' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                            )}>
                              {c.type === 'asset' ? 'Asset' : c.type === 'liability' ? 'Liabilitas' : c.type === 'equity' ? 'Ekuitas' : c.type === 'revenue' ? 'Pendapatan' : 'Biaya'}
                            </span>
                          </div>
                          <input
                            value={coaEdits[c.id]?.name ?? c.name}
                            onChange={(e) => setCoaEdits((prev) => ({ ...prev, [c.id]: { ...prev[c.id], name: e.target.value } }))}
                            className="w-full h-10 px-3 rounded-xl bg-accent/30 border-none ring-1 ring-border/40 focus:ring-2 focus:ring-primary/40 transition-all text-sm font-bold mt-1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => void handleSaveCoa(c.id)}
                            className="px-4 h-10 rounded-xl bg-primary/10 text-primary font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => void handleDeleteCoa(c)}
                            className="p-2.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
