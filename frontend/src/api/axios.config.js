// frontend/src/api/axios.config.js
import axios from 'axios'
import { toast } from 'sonner'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
  // ✅ Add this for CORS
  withCredentials: true,
})

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // ✅ Log request for debugging
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    // ✅ Log response for debugging
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status)
    return response
  },
  async (error) => {
    // ✅ Log error for debugging
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
    })
    
    const originalRequest = error.config
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      toast.error('❌ Cannot connect to server. Please make sure backend is running on port 8000.')
      return Promise.reject(error)
    }
    
    // Don't retry if already retried or if it's a login/refresh request
    if (originalRequest._retry || 
        originalRequest.url?.includes('/auth/login') || 
        originalRequest.url?.includes('/auth/refresh')) {
      
      // ✅ If it's a 401 on a protected endpoint (not login), redirect to login
      if (error.response?.status === 401 && !originalRequest.url?.includes('/auth/login')) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        toast.error('Session expired. Please login again.')
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
    
    // Handle 401 - Try to refresh token
    if (error.response?.status === 401) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }
        
        console.log('🔄 Refreshing token...')
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken
        })
        
        const { access_token } = response.data
        localStorage.setItem('access_token', access_token)
        
        console.log('✅ Token refreshed successfully')
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        console.error('❌ Refresh failed:', refreshError)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        toast.error('Session expired. Please login again.')
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }
    
    // Handle other errors
    if (error.response?.data?.detail) {
      toast.error(error.response.data.detail)
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message)
    } else if (error.message && error.message !== 'Network Error') {
      toast.error(error.message)
    }
    
    return Promise.reject(error)
  }
)

export default axiosInstance