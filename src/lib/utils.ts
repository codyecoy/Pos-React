import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildWhatsAppShareUrl(text: string, phone?: string) {
  const cleanedPhone = phone ? phone.replace(/[^\d]/g, '') : ''
  const base = cleanedPhone ? `https://wa.me/${cleanedPhone}` : 'https://wa.me/'
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}text=${encodeURIComponent(text)}`
}

export function shareToWhatsApp(text: string, phone?: string) {
  const url = buildWhatsAppShareUrl(text, phone)
  window.open(url, '_blank', 'noopener,noreferrer')
}
