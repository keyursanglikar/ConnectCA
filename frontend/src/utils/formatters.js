import { format, parseISO, isValid } from 'date-fns'
import { DATE_FORMATS } from './constants'

export const formatters = {
  // Date Formatters
  date: (value, formatStr = DATE_FORMATS.DISPLAY) => {
    if (!value) return '-'
    try {
      const date = typeof value === 'string' ? parseISO(value) : value
      return isValid(date) ? format(date, formatStr) : '-'
    } catch {
      return '-'
    }
  },

  dateTime: (value) => {
    return formatters.date(value, DATE_FORMATS.DISPLAY_WITH_TIME)
  },

  dateAPI: (value) => {
    return formatters.date(value, DATE_FORMATS.API)
  },

  // Number Formatters
  number: (value, decimals = 0) => {
    if (value === null || value === undefined) return '0'
    return Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  },

  currency: (value, symbol = '₹') => {
    if (value === null || value === undefined) return `${symbol}0`
    return `${symbol}${formatters.number(value, 2)}`
  },

  percentage: (value, decimals = 1) => {
    if (value === null || value === undefined) return '0%'
    return `${formatters.number(value, decimals)}%`
  },

  // Text Formatters
  uppercase: (value) => {
    return value?.toUpperCase() || ''
  },

  lowercase: (value) => {
    return value?.toLowerCase() || ''
  },

  titleCase: (value) => {
    if (!value) return ''
    return value
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  },

  truncate: (value, maxLength = 50) => {
    if (!value) return ''
    if (value.length <= maxLength) return value
    return `${value.substring(0, maxLength)}...`
  },

  // Phone Formatter
  phone: (value) => {
    if (!value) return ''
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
    }
    return value
  },

  // PAN Formatter
  pan: (value) => {
    if (!value) return ''
    const cleaned = value.toUpperCase().replace(/\s/g, '')
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 5)}${cleaned.slice(5, 9)}${cleaned.slice(9)}`
    }
    return value
  },

  // Aadhaar Formatter
  aadhaar: (value) => {
    if (!value) return ''
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 12) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`
    }
    return value
  },

  // GST Formatter
  gst: (value) => {
    if (!value) return ''
    const cleaned = value.toUpperCase().replace(/\s/g, '')
    if (cleaned.length === 15) {
      return `${cleaned.slice(0, 2)}${cleaned.slice(2, 12)}${cleaned.slice(12)}`
    }
    return value
  },

  // File Size
  fileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  },

  // Status Formatter
  status: (value, statusMap) => {
    return statusMap?.[value] || value || '-'
  },

  // Boolean Formatter
  boolean: (value) => {
    return value ? 'Yes' : 'No'
  },

  // JSON Formatter
  json: (value) => {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  },
}

// Export individual formatters for convenience
export const {
  date,
  dateTime,
  dateAPI,
  number,
  currency,
  percentage,
  uppercase,
  lowercase,
  titleCase,
  truncate,
  phone,
  pan,
  aadhaar,
  gst,
  fileSize,
  status,
  boolean,
  json,
} = formatters