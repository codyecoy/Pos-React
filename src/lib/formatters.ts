// Utility functions for text formatting

/**
 * Capitalize the first letter of each word
 */
export function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Format phone number (Indonesian format)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  
  // Convert 08 to +628
  if (cleaned.startsWith('08')) {
    cleaned = '628' + cleaned.slice(2)
  } else if (cleaned.startsWith('8')) {
    cleaned = '628' + cleaned.slice(1)
  }
  
  // Format with spaces
  if (cleaned.length > 4) {
    if (cleaned.length > 8) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6, 10)} ${cleaned.slice(10)}`
    }
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`
  }
  
  return cleaned ? `+${cleaned}` : ''
}

/**
 * Format email to lowercase
 */
export function formatEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Format currency (Indonesian Rupiah)
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num)
}
