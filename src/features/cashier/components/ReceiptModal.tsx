import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  CheckCircle2,
  ShoppingBag
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { usePosStore } from '@/store/usePosStore'

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  transactionData: {
    id: string
    items: any[]
    total: number
    subtotal: number
    tax: number
    amountPaid: number
    change: number
    method: string
    timestamp: Date
  }
}

export default function ReceiptModal({ isOpen, onClose, transactionData }: ReceiptModalProps) {
  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white text-gray-900 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Receipt Header */}
        <div className="p-8 text-center border-b border-dashed border-gray-200">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight">POS PRO STORE</h2>
          <p className="text-xs font-bold text-gray-500 mt-1">Jl. Digital No. 123, Jakarta Selatan</p>
          <p className="text-xs font-bold text-gray-500">Telp: 0812-3456-7890</p>
        </div>

        {/* Receipt Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>#{transactionData.id}</span>
            <span>{format(transactionData.timestamp, 'dd MMM yyyy HH:mm', { locale: id })}</span>
          </div>

          <div className="space-y-3">
            {transactionData.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <div className="flex-1 pr-4">
                  <p className="font-bold leading-tight">{item.name}</p>
                  <p className="text-xs text-gray-500 font-medium">{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</p>
                </div>
                <span className="font-bold">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-dashed border-gray-200 space-y-2">
            <div className="flex justify-between text-sm font-medium text-gray-500">
              <span>Subtotal</span>
              <span>Rp {transactionData.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-500">
              <span>Pajak (11%)</span>
              <span>Rp {transactionData.tax.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-lg font-black pt-2">
              <span>TOTAL</span>
              <span className="text-primary">Rp {transactionData.total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-gray-200 space-y-2">
            <div className="flex justify-between text-sm font-medium text-gray-500">
              <span className="uppercase">Metode: {transactionData.method}</span>
              <span>Rp {transactionData.amountPaid.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-emerald-600">
              <span>KEMBALIAN</span>
              <span>Rp {transactionData.change.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="pt-6 text-center">
            <div className="inline-block p-2 bg-gray-50 rounded-xl mb-4">
              {/* Simple Mock QR Code */}
              <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center text-[10px] font-bold text-gray-400">
                QR RECEIPT
              </div>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Terima kasih atas kunjungan Anda</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl bg-white border border-gray-200 font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
          >
            Tutup
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95"
          >
            <Printer size={16} />
            Cetak
          </button>
        </div>
      </motion.div>
    </div>
  )
}
