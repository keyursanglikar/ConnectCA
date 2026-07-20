import React, { createContext, useState, useEffect, useContext } from 'react'
import axios from 'axios'
import safeToast from '../utils/toast'

const AuthContext = createContext(null)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      console.log('🔐 Initializing auth...')
      try {
        const token = localStorage.getItem('access_token')
        if (token) {
          console.log('📝 Token found, validating...')
          try {
            const response = await axios.get(`${API_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            console.log('✅ User validated:', response.data)
            setUser(response.data)
            setIsAuthenticated(true)
          } catch (error) {
            console.error('❌ Token validation failed:', error)
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            setIsAuthenticated(false)
            setUser(null)
          }
        } else {
          console.log('ℹ️ No token found')
        }
      } catch (error) {
        console.error('❌ Auth init error:', error)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setIsLoading(false)
        console.log('🏁 Auth init complete. isAuthenticated:', isAuthenticated)
      }
    }
    initAuth()
  }, [])

  const login = async (email, password) => {
    console.log('🔑 Login attempt:', email)
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password })
      console.log('📦 Login response:', response.data)
      
      const { access_token, refresh_token, user: userData } = response.data

      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)

      console.log('👤 User data:', userData)
      console.log('👤 User role:', userData?.role)
      console.log('👤 Is Super Admin:', userData?.is_super_admin)

      setUser(userData)
      setIsAuthenticated(true)

      safeToast.success(`Welcome ${userData?.name || 'User'}!`)

      return { success: true, user: userData }
    } catch (error) {
      console.error('❌ Login error:', error)

      safeToast.error(error)

      let errorMsg = 'Login failed. Please try again.'
      try {
        if (error.response?.data?.detail) {
          const detail = error.response.data.detail
          if (typeof detail === 'string') {
            errorMsg = detail
          } else if (Array.isArray(detail) && detail.length > 0) {
            errorMsg = detail[0]?.msg || detail[0]?.message || JSON.stringify(detail[0])
          } else if (typeof detail === 'object' && detail !== null) {
            errorMsg = detail.msg || detail.message || JSON.stringify(detail)
          }
        } else if (error.message && typeof error.message === 'string') {
          errorMsg = error.message
        }
      } catch (e) {
        console.error('Error extracting message:', e)
      }

      return { success: false, error: errorMsg }
    }
  }

  const logout = () => {
    console.log('🚪 Logging out...')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setIsAuthenticated(false)
    safeToast.info('Logged out successfully')
  }

  const value = { 
    user, 
    isLoading, 
    isAuthenticated, 
    login, 
    logout 
  }

  console.log('📊 Auth state:', { user, isLoading, isAuthenticated })

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }