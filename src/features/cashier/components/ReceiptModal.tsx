import { 
  X, 
  Printer, 
  Share2,
  ShoppingBag
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { usePosStore } from '@/store/usePosStore'
import { shareToWhatsApp } from '@/lib/utils'
import { jsPDF } from 'jspdf'
import { toast } from 'sonner'

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
    customer?: {
      id: string
      name: string
      phone?: string
      email?: string
      address?: string
    } | null
  }
}

export default function ReceiptModal({ isOpen, onClose, transactionData }: ReceiptModalProps) {
  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const formatRp = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`

  const buildPdfFile = async () => {
    const doc = new jsPDF({ unit: 'mm', format: [80, 200] })
    const marginX = 6
    let y = 10

    const writeLine = (text: string, opts?: { bold?: boolean; size?: number }) => {
      doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
      doc.setFontSize(opts?.size ?? 10)
      const lines = doc.splitTextToSize(text, 80 - marginX * 2)
      doc.text(lines, marginX, y)
      y += lines.length * 5
    }

    writeLine('POS PRO STORE', { bold: true, size: 14 })
    writeLine('Jl. Digital No. 123, Jakarta Selatan', { size: 9 })
    writeLine('Telp: 0812-3456-7890', { size: 9 })
    y += 2
    doc.setDrawColor(200)
    doc.line(marginX, y, 80 - marginX, y)
    y += 6

    writeLine(`ID: ${transactionData.id}`, { bold: true, size: 10 })
    writeLine(`Waktu: ${format(transactionData.timestamp, 'dd MMM yyyy HH:mm', { locale: id })}`, { size: 9 })
    y += 2

    writeLine('Item:', { bold: true, size: 10 })
    for (const item of transactionData.items) {
      const qty = Number(item.quantity || 0)
      const price = Number(item.price || 0)
      const lineTotal = qty * price
      writeLine(`${item.name}`, { size: 9 })
      writeLine(`${qty} x ${formatRp(price)} = ${formatRp(lineTotal)}`, { size: 9 })
      y += 1
    }

    y += 2
    doc.line(marginX, y, 80 - marginX, y)
    y += 6

    writeLine(`Subtotal: ${formatRp(transactionData.subtotal)}`, { size: 10 })
    writeLine(`Pajak: ${formatRp(transactionData.tax)}`, { size: 10 })
    writeLine(`Total: ${formatRp(transactionData.total)}`, { bold: true, size: 12 })

    y += 2
    doc.line(marginX, y, 80 - marginX, y)
    y += 6

    writeLine(`Metode: ${transactionData.method}`, { size: 10 })
    writeLine(`Bayar: ${formatRp(transactionData.amountPaid)}`, { size: 10 })
    writeLine(`Kembalian: ${formatRp(transactionData.change)}`, { size: 10 })

    y += 4
    writeLine('Terima kasih.', { bold: true, size: 10 })

    const blob = doc.output('blob')
    const filename = `Struk-${transactionData.id}.pdf`
    return new File([blob], filename, { type: 'application/pdf' })
  }

  const downloadPdf = async () => {
    const file = await buildPdfFile()
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('PDF struk berhasil diunduh.')
  }

  const handleShareWhatsAppPdf = async () => {
    try {
      const file = await buildPdfFile()
      const navAny = navigator as any
      if (navAny?.canShare?.({ files: [file] }) && navAny?.share) {
        await navAny.share({
          title: `Struk ${transactionData.id}`,
          text: `Struk ${transactionData.id}`,
          files: [file],
        })
        return
      }

      await downloadPdf()
      const text = `Struk ${transactionData.id} (PDF) sudah diunduh. Silakan lampirkan file Struk-${transactionData.id}.pdf di WhatsApp.`
      shareToWhatsApp(text)
    } catch (e: any) {
      toast.error(e?.message || 'Gagal membuat PDF struk.')
    }
  }

  const handleShareWhatsApp = () => {
    const lines = transactionData.items.map((item) => {
      const lineTotal = (item.price * item.quantity)
      return `- ${item.name} x${item.quantity} @ Rp ${item.price.toLocaleString('id-ID')} = Rp ${lineTotal.toLocaleString('id-ID')}`
    })

    const text =
      `Struk POS PRO STORE\n` +
      `ID: ${transactionData.id}\n` +
      `Waktu: ${format(transactionData.timestamp, 'dd MMM yyyy HH:mm', { locale: id })}\n\n` +
      `Item:\n${lines.join('\n')}\n\n` +
      `Subtotal: Rp ${transactionData.subtotal.toLocaleString('id-ID')}\n` +
      `Pajak: Rp ${transactionData.tax.toLocaleString('id-ID')}\n` +
      `Total: Rp ${transactionData.total.toLocaleString('id-ID')}\n` +
      `Metode: ${transactionData.method}\n` +
      `Bayar: Rp ${transactionData.amountPaid.toLocaleString('id-ID')}\n` +
      `Kembalian: Rp ${transactionData.change.toLocaleString('id-ID')}\n\n` +
      `Terima kasih.`

    shareToWhatsApp(text)
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
        className="relative w-full max-w-md bg-white text-gray-900 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden h-[90vh]"
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

          {/* Customer Info */}
          {transactionData.customer && (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Member</p>
              <p className="font-bold text-sm">{transactionData.customer.name}</p>
              {transactionData.customer.phone && (
                <p className="text-xs text-gray-500">{transactionData.customer.phone}</p>
              )}
            </div>
          )}

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
            onClick={() => void handleShareWhatsAppPdf()}
            className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:scale-105 transition-all active:scale-95"
          >
            <Share2 size={16} />
            WhatsApp PDF
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
