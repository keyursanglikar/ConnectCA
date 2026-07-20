import { toast } from 'sonner'

/**
 * Safely converts any error to a string message
 */
const safeGetErrorMessage = (error) => {
  // If it's already a string, return it
  if (typeof error === 'string') {
    return error
  }

  // If it's null or undefined
  if (!error) {
    return 'An unknown error occurred'
  }

  // If it's an Error object
  if (error instanceof Error) {
    return error.message || 'An error occurred'
  }

  // Handle axios error response
  if (error.response && error.response.data) {
    const data = error.response.data
    console.log('Error response data:', data)

    // If data is a string
    if (typeof data === 'string') {
      return data
    }

    // Handle detail field
    if (data.detail) {
      // If detail is a string
      if (typeof data.detail === 'string') {
        return data.detail
      }

      // If detail is an array of validation errors
      if (Array.isArray(data.detail)) {
        const messages = data.detail
          .map(err => {
            if (typeof err === 'string') return err
            if (err && err.msg) return err.msg
            if (err && err.message) return err.message
            return null
          })
          .filter(msg => msg !== null)

        if (messages.length > 0) {
          return messages.join(', ')
        }
      }

      // If detail is an object with msg
      if (typeof data.detail === 'object' && data.detail !== null) {
        if (data.detail.msg) return data.detail.msg
        if (data.detail.message) return data.detail.message
      }
    }

    // Handle message field
    if (data.message && typeof data.message === 'string') {
      return data.message
    }

    // Handle error field
    if (data.error && typeof data.error === 'string') {
      return data.error
    }
  }

  // If error has a message property
  if (error.message && typeof error.message === 'string') {
    return error.message
  }

  // If error has a msg property
  if (error.msg && typeof error.msg === 'string') {
    return error.msg
  }

  // Last resort - try to stringify
  try {
    const stringified = JSON.stringify(error)
    if (stringified === '{}' || stringified === '[object Object]') {
      return 'An error occurred'
    }
    return stringified
  } catch {
    return 'An unknown error occurred'
  }
}

/**
 * Safe toast functions that always receive strings
 */
export const safeToast = {
  success: (message) => {
    const safeMessage = typeof message === 'string' ? message : safeGetErrorMessage(message)
    toast.success(safeMessage)
  },
  error: (error) => {
    const safeMessage = safeGetErrorMessage(error)
    toast.error(safeMessage)
  },
  info: (message) => {
    const safeMessage = typeof message === 'string' ? message : safeGetErrorMessage(message)
    toast.info(safeMessage)
  },
  warning: (message) => {
    const safeMessage = typeof message === 'string' ? message : safeGetErrorMessage(message)
    toast.warning(safeMessage)
  },
  loading: (message) => {
    const safeMessage = typeof message === 'string' ? message : safeGetErrorMessage(message)
    return toast.loading(safeMessage)
  },
  dismiss: (id) => toast.dismiss(id),
  custom: (options) => toast.custom(options),
}

// Export default for convenience
export default safeToast