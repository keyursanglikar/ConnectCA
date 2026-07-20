import { PATTERNS } from './constants'

export const validators = {
  // Required Field
  required: (value, message = 'This field is required') => {
    if (!value && value !== 0) {
      return message
    }
    return null
  },

  // Email Validation
  email: (value, message = 'Please enter a valid email address') => {
    if (!value) return null
    if (!PATTERNS.EMAIL.test(value)) {
      return message
    }
    return null
  },

  // Phone Validation
  phone: (value, message = 'Please enter a valid 10-digit phone number') => {
    if (!value) return null
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length !== 10) {
      return message
    }
    return null
  },

  // PAN Validation
  pan: (value, message = 'Please enter a valid PAN (e.g., ABCDE1234F)') => {
    if (!value) return null
    const cleaned = value.toUpperCase().replace(/\s/g, '')
    if (!PATTERNS.PAN.test(cleaned)) {
      return message
    }
    return null
  },

  // Aadhaar Validation
  aadhaar: (value, message = 'Please enter a valid 12-digit Aadhaar number') => {
    if (!value) return null
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length !== 12) {
      return message
    }
    return null
  },

  // GST Validation
  gst: (value, message = 'Please enter a valid GST number') => {
    if (!value) return null
    const cleaned = value.toUpperCase().replace(/\s/g, '')
    if (!PATTERNS.GST.test(cleaned)) {
      return message
    }
    return null
  },

  // Password Validation
  password: (value, message = 'Password must be at least 8 characters long') => {
    if (!value) return null
    if (value.length < 8) {
      return message
    }
    return null
  },

  // Confirm Password
  confirmPassword: (password, confirmPassword, message = 'Passwords do not match') => {
    if (password !== confirmPassword) {
      return message
    }
    return null
  },

  // Min Length
  minLength: (length, message) => {
    return (value) => {
      if (!value) return null
      if (value.length < length) {
        return message || `Must be at least ${length} characters`
      }
      return null
    }
  },

  // Max Length
  maxLength: (length, message) => {
    return (value) => {
      if (!value) return null
      if (value.length > length) {
        return message || `Must be at most ${length} characters`
      }
      return null
    }
  },

  // Min Value
  minValue: (min, message) => {
    return (value) => {
      if (value === null || value === undefined) return null
      if (Number(value) < min) {
        return message || `Value must be at least ${min}`
      }
      return null
    }
  },

  // Max Value
  maxValue: (max, message) => {
    return (value) => {
      if (value === null || value === undefined) return null
      if (Number(value) > max) {
        return message || `Value must be at most ${max}`
      }
      return null
    }
  },

  // URL Validation
  url: (value, message = 'Please enter a valid URL') => {
    if (!value) return null
    try {
      new URL(value)
      return null
    } catch {
      return message
    }
  },

  // File Size Validation
  fileSize: (maxSize, message) => {
    return (file) => {
      if (!file) return null
      if (file.size > maxSize) {
        return message || `File size must be less than ${maxSize / (1024 * 1024)}MB`
      }
      return null
    }
  },

  // File Type Validation
  fileType: (allowedTypes, message) => {
    return (file) => {
      if (!file) return null
      if (!allowedTypes.includes(file.type)) {
        return message || `File type must be one of: ${allowedTypes.join(', ')}`
      }
      return null
    }
  },

  // Contains Number
  containsNumber: (message = 'Must contain at least one number') => {
    return (value) => {
      if (!value) return null
      if (!/\d/.test(value)) {
        return message
      }
      return null
    }
  },

  // Contains Uppercase
  containsUppercase: (message = 'Must contain at least one uppercase letter') => {
    return (value) => {
      if (!value) return null
      if (!/[A-Z]/.test(value)) {
        return message
      }
      return null
    }
  },

  // Contains Lowercase
  containsLowercase: (message = 'Must contain at least one lowercase letter') => {
    return (value) => {
      if (!value) return null
      if (!/[a-z]/.test(value)) {
        return message
      }
      return null
    }
  },

  // Contains Special Character
  containsSpecial: (message = 'Must contain at least one special character') => {
    return (value) => {
      if (!value) return null
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        return message
      }
      return null
    }
  },
}

// Combine validators for common use cases
export const validateEmail = (value) => {
  const requiredError = validators.required(value)
  if (requiredError) return requiredError
  return validators.email(value)
}

export const validatePhone = (value) => {
  const requiredError = validators.required(value)
  if (requiredError) return requiredError
  return validators.phone(value)
}

export const validatePassword = (value) => {
  const requiredError = validators.required(value)
  if (requiredError) return requiredError
  
  const passwordError = validators.password(value)
  if (passwordError) return passwordError
  
  const numberError = validators.containsNumber()(value)
  if (numberError) return numberError
  
  const uppercaseError = validators.containsUppercase()(value)
  if (uppercaseError) return uppercaseError
  
  return null
}

export const validatePAN = (value) => {
  if (!value) return null
  return validators.pan(value)
}

export const validateAadhaar = (value) => {
  if (!value) return null
  return validators.aadhaar(value)
}