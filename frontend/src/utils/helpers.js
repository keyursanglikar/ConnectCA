import { format, formatDistanceToNow, parseISO, differenceInDays } from 'date-fns'
import { DATE_FORMATS, PATTERNS } from './constants'

// Date Helpers
export const formatDate = (date, formatStr = DATE_FORMATS.DISPLAY) => {
  if (!date) return '-'
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date
    return format(parsedDate, formatStr)
  } catch {
    return '-'
  }
}

export const formatDateRelative = (date) => {
  if (!date) return '-'
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(parsedDate, { addSuffix: true })
  } catch {
    return '-'
  }
}

export const getDaysDifference = (date1, date2) => {
  try {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2
    return differenceInDays(d1, d2)
  } catch {
    return 0
  }
}

// Currency Helpers
export const formatCurrency = (amount, currency = '₹') => {
  if (amount === null || amount === undefined) return `${currency}0`
  return `${currency}${Number(amount).toLocaleString('en-IN')}`
}

export const formatCurrencyWithGST = (amount, gstRate = 18) => {
  const baseAmount = Number(amount) || 0
  const gstAmount = (baseAmount * gstRate) / 100
  const total = baseAmount + gstAmount
  return {
    baseAmount: formatCurrency(baseAmount),
    gstAmount: formatCurrency(gstAmount),
    total: formatCurrency(total),
    gstRate,
  }
}

// String Helpers
export const truncateText = (text, maxLength = 50) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export const titleCase = (str) => {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// File Helpers
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export const getFileExtension = (filename) => {
  if (!filename) return ''
  return filename.split('.').pop()?.toLowerCase() || ''
}

export const isAllowedFileType = (filename, allowedExtensions) => {
  const ext = getFileExtension(filename)
  return allowedExtensions.includes(`.${ext}`)
}

// Array Helpers
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key]
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {})
}

export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

export const paginate = (array, page = 1, limit = 10) => {
  const start = (page - 1) * limit
  const end = start + limit
  return array.slice(start, end)
}

// Object Helpers
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

export const omit = (obj, keys) => {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

export const pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key]
    }
    return result
  }, {})
}

// Validation Helpers
export const isValidEmail = (email) => {
  return PATTERNS.EMAIL.test(email)
}

export const isValidPAN = (pan) => {
  return PATTERNS.PAN.test(pan)
}

export const isValidAadhaar = (aadhaar) => {
  return PATTERNS.AADHAAR.test(aadhaar)
}

export const isValidPhone = (phone) => {
  return PATTERNS.PHONE.test(phone)
}

// Color Helpers
export const getStatusColor = (status, statusMap) => {
  return statusMap?.[status] || 'gray'
}

export const getStatusLabel = (status, statusMap) => {
  return statusMap?.[status] || status
}

// Random Helpers
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

export const generateInvoiceNumber = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV-${year}${month}${day}-${random}`
}

// Environment Helpers
export const isDevelopment = () => {
  return import.meta.env.MODE === 'development'
}

export const isProduction = () => {
  return import.meta.env.MODE === 'production'
}

export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
}

// Debounce
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}