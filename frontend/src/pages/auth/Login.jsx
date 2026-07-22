// import React, { useState, useEffect } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import { useAuth } from '../../hooks/useAuth'
// import { motion } from 'framer-motion'
// import { 
//   Eye, 
//   EyeOff, 
//   Loader2, 
//   Shield, 
//   User, 
//   Building2,
//   Mail,
//   Lock,
//   AlertCircle,
//   CheckCircle,
//   Bell
// } from 'lucide-react'

// const Login = () => {
//   console.log('Login component rendering')
//   const navigate = useNavigate()
  
//   let auth
//   try {
//     auth = useAuth()
//   } catch (error) {
//     console.error('Auth context error:', error)
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B2A4A] to-[#0F1A2E] p-4">
//         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
//           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <AlertCircle className="w-8 h-8 text-red-600" />
//           </div>
//           <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
//           <p className="text-gray-600">Unable to initialize authentication system. Please try again.</p>
//           <button 
//             onClick={() => window.location.reload()}
//             className="mt-4 bg-[#1B2A4A] text-white px-4 py-2 rounded-lg hover:bg-[#16223b] transition-colors w-full"
//           >
//             Reload Page
//           </button>
//         </div>
//       </div>
//     )
//   }

//   const { login, isLoading: authLoading } = auth
//   const [formData, setFormData] = useState({ 
//     email: 'admin@cafirm.com', 
//     password: 'Admin@123' 
//   })
//   const [showPassword, setShowPassword] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')
//   const [showNotification, setShowNotification] = useState(false)
//   const [notificationMessage, setNotificationMessage] = useState('')
//   const [rememberMe, setRememberMe] = useState(false)
//   const [selectedRole, setSelectedRole] = useState('superadmin')

//   useEffect(() => {
//     const savedEmail = localStorage.getItem('remembered_email')
//     if (savedEmail) {
//       setFormData(prev => ({ ...prev, email: savedEmail }))
//       setRememberMe(true)
//     }
    
//     const queryParams = new URLSearchParams(window.location.search)
//     const notification = queryParams.get('notification')
//     if (notification) {
//       setShowNotification(true)
//       setNotificationMessage(decodeURIComponent(notification))
//       window.history.replaceState({}, document.title, window.location.pathname)
//     }
//   }, [])

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     console.log('Login form submitted')
//     setError('')
//     setSuccess('')
//     setIsLoading(true)
    
//     try {
//       const result = await login(formData.email, formData.password)
//       setIsLoading(false)
      
//       if (result.success) {
//         console.log('Login successful!')
//         console.log('User data:', result.user)
//         console.log('User role:', result.user?.role)
        
//         if (rememberMe) {
//           localStorage.setItem('remembered_email', formData.email)
//         } else {
//           localStorage.removeItem('remembered_email')
//         }
        
//         setSuccess('Login successful! Redirecting...')
        
//         // ============================================
//         // FIX: Direct navigation based on role
//         // The backend returns role as: SUPER_ADMIN, CA, CLIENT
//         // ============================================
//         setTimeout(() => {
//           const role = result.user?.role
//           console.log('Navigating based on role:', role)
          
//           // Super Admin - exact match from backend
//           if (role === 'SUPER_ADMIN') {
//             console.log('✅ Redirecting to Super Admin Dashboard')
//             navigate('/super-admin/dashboard')
//             return
//           }
          
//           // Client - exact match from backend
//           if (role === 'CLIENT') {
//             console.log('✅ Redirecting to Client Dashboard')
//             setShowNotification(true)
//             setNotificationMessage(`Welcome ${result.user?.name || 'Client'}!`)
//             setTimeout(() => {
//               navigate('/client/dashboard')
//             }, 500)
//             return
//           }
          
//           // CA - exact match from backend (or default)
//           console.log('✅ Redirecting to CA Dashboard')
//           navigate('/ca/dashboard')
//         }, 500)
//         // ============================================
        
//       } else {
//         const errorMsg = typeof result.error === 'string' 
//           ? result.error 
//           : 'Login failed. Please check your credentials.'
//         setError(errorMsg)
//       }
//     } catch (err) {
//       setIsLoading(false)
//       const errorMsg = typeof err === 'string' 
//         ? err 
//         : err?.message || 'An unexpected error occurred. Please try again.'
//       setError(errorMsg)
//       console.error('Login error:', err)
//     }
//   }

//   const handleQuickFill = (email, role) => {
//     setFormData({ email, password: role === 'superadmin' ? 'Admin@123' : 'password' })
//     setSelectedRole(role)
//     setError('')
//   }

//   const testAccounts = [
//     {
//       role: 'superadmin',
//       label: 'Super Admin',
//       email: 'admin@cafirm.com',
//       icon: Shield,
//       color: 'text-purple-600',
//       bgColor: 'bg-purple-50 hover:bg-purple-100',
//       borderColor: 'border-purple-200',
//     },
//     {
//       role: 'ca',
//       label: 'CA Firm',
//       email: 'ca@example.com',
//       icon: Building2,
//       color: 'text-blue-600',
//       bgColor: 'bg-blue-50 hover:bg-blue-100',
//       borderColor: 'border-blue-200',
//     },
//     {
//       role: 'client',
//       label: 'Client',
//       email: 'client@example.com',
//       icon: User,
//       color: 'text-green-600',
//       bgColor: 'bg-green-50 hover:bg-green-100',
//       borderColor: 'border-green-200',
//     },
//   ]

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B2A4A] via-[#16223b] to-[#0F1A2E] p-4">
//       <motion.div 
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative"
//       >
//         {/* Logo & Header */}
//         <div className="text-center mb-8">
//           <div className="w-16 h-16 bg-[#1B2A4A] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
//             <span className="text-white font-bold text-2xl">CA</span>
//           </div>
//           <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
//           <p className="text-gray-500 mt-1">Sign in to your account to continue</p>
//         </div>

//         {/* Notification Banner */}
//         {showNotification && (
//           <motion.div 
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-2"
//           >
//             <Bell className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
//             <p className="text-sm text-blue-700">{notificationMessage}</p>
//           </motion.div>
//         )}

//         {/* Error/Success Messages */}
//         {error && (
//           <motion.div 
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2"
//           >
//             <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
//             <p className="text-sm text-red-600">{error}</p>
//           </motion.div>
//         )}

//         {success && (
//           <motion.div 
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2"
//           >
//             <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
//             <p className="text-sm text-green-600">{success}</p>
//           </motion.div>
//         )}

//         {/* Login Form */}
//         <form onSubmit={handleSubmit} className="space-y-5">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1.5">
//               Email Address
//             </label>
//             <div className="relative">
//               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//               <input
//                 type="email"
//                 value={formData.email}
//                 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                 className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:border-transparent transition-all"
//                 placeholder="Enter your email"
//                 required
//                 disabled={isLoading || authLoading}
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1.5">
//               Password
//             </label>
//             <div className="relative">
//               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//               <input
//                 type={showPassword ? 'text' : 'password'}
//                 value={formData.password}
//                 onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//                 className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:border-transparent transition-all"
//                 placeholder="Enter your password"
//                 required
//                 disabled={isLoading || authLoading}
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
//                 disabled={isLoading || authLoading}
//               >
//                 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//               </button>
//             </div>
//           </div>

//           <div className="flex items-center justify-between">
//             <label className="flex items-center space-x-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={rememberMe}
//                 onChange={(e) => setRememberMe(e.target.checked)}
//                 className="w-4 h-4 text-[#1B2A4A] border-gray-300 rounded focus:ring-[#1B2A4A]"
//                 disabled={isLoading || authLoading}
//               />
//               <span className="text-sm text-gray-600">Remember me</span>
//             </label>
//             <Link 
//               to="/forgot-password" 
//               className="text-sm text-[#1B2A4A] hover:text-[#16223b] font-medium transition-colors"
//             >
//               Forgot password?
//             </Link>
//           </div>

//           <button
//             type="submit"
//             disabled={isLoading || authLoading}
//             className="w-full bg-[#1B2A4A] text-white py-2.5 rounded-lg hover:bg-[#16223b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
//           >
//             {isLoading || authLoading ? (
//               <>
//                 <Loader2 className="animate-spin mr-2 w-4 h-4" />
//                 Signing in...
//               </>
//             ) : (
//               'Sign In'
//             )}
//           </button>
//         </form>

//         {/* Test Accounts */}
//         <div className="mt-6">
//           <div className="relative">
//             <div className="absolute inset-0 flex items-center">
//               <div className="w-full border-t border-gray-200"></div>
//             </div>
//             <div className="relative flex justify-center text-sm">
//               <span className="px-3 bg-white text-gray-500">Quick Test Accounts</span>
//             </div>
//           </div>
          
//           <div className="mt-4 grid grid-cols-1 gap-2">
//             {testAccounts.map((account) => {
//               const Icon = account.icon
//               const isSelected = selectedRole === account.role
//               return (
//                 <button
//                   key={account.role}
//                   type="button"
//                   onClick={() => handleQuickFill(account.email, account.role)}
//                   className={`
//                     flex items-center justify-between w-full px-4 py-2.5 
//                     rounded-lg border-2 transition-all duration-200
//                     ${account.bgColor}
//                     ${account.borderColor}
//                     ${isSelected ? 'ring-2 ring-offset-2 ring-[#1B2A4A]' : ''}
//                     hover:shadow-md
//                   `}
//                   disabled={isLoading || authLoading}
//                 >
//                   <div className="flex items-center space-x-3">
//                     <Icon className={`w-4 h-4 ${account.color}`} />
//                     <span className="text-sm font-medium text-gray-700">{account.label}</span>
//                   </div>
//                   <span className="text-xs text-gray-500">{account.email}</span>
//                 </button>
//               )
//             })}
//           </div>
//           <p className="text-xs text-gray-400 text-center mt-3">
//             Click any test account to auto-fill credentials
//           </p>
//         </div>

//         {/* Footer Links */}
//         <div className="mt-6 text-center">
//           <p className="text-sm text-gray-600">
//             Don't have an account?{' '}
//             <Link to="/register" className="text-[#1B2A4A] hover:text-[#16223b] font-medium transition-colors">
//               Sign up
//             </Link>
//           </p>
//           <div className="mt-3 flex items-center justify-center space-x-4">
//             <span className="text-xs text-gray-400">Secure Login</span>
//             <span className="w-px h-3 bg-gray-300"></span>
//             <span className="text-xs text-gray-400">SSL Encrypted</span>
//           </div>
//         </div>

//         {/* Loading Overlay */}
//         {(isLoading || authLoading) && (
//           <div className="absolute inset-0 bg-white/50 rounded-2xl flex items-center justify-center backdrop-blur-sm">
//             <div className="flex flex-col items-center">
//               <Loader2 className="animate-spin w-8 h-8 text-[#1B2A4A]" />
//               <p className="text-sm text-gray-500 mt-2">Authenticating...</p>
//             </div>
//           </div>
//         )}
//       </motion.div>
//     </div>
//   )
// }

// export default Login



// frontend/src/pages/auth/Login.jsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { motion } from 'framer-motion'
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  Bell,
  Users,
  Building2,
  UserCog,
  Briefcase,
  ShieldCheck,
  User,
  ArrowRight
} from 'lucide-react'

const Login = () => {
  console.log('Login component rendering')
  const navigate = useNavigate()
  
  let auth
  try {
    auth = useAuth()
  } catch (error) {
    console.error('Auth context error:', error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B2A4A] to-[#0F1A2E] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600">Unable to initialize authentication system. Please try again.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#1B2A4A] text-white px-4 py-2 rounded-lg hover:bg-[#16223b] transition-colors w-full"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  const { login, isLoading: authLoading } = auth
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '' 
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [selectedRole, setSelectedRole] = useState('ca')

  const roleConfigs = {
    superadmin: {
      label: 'Super Admin',
      icon: ShieldCheck,
      color: 'from-purple-600 to-purple-800',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600',
      subtitle: 'Manage all users and system settings'
    },
    ca: {
      label: 'CA Firm',
      icon: Building2,
      color: 'from-blue-600 to-blue-800',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600',
      subtitle: 'Manage clients, documents and billings'
    },
    client: {
      label: 'Client',
      icon: User,
      color: 'from-green-600 to-green-800',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-600',
      subtitle: 'View your documents and estimates'
    }
  }

  const currentRole = roleConfigs[selectedRole] || roleConfigs.ca
  const RoleIcon = currentRole.icon

  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email')
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }))
      setRememberMe(true)
    }
    
    const queryParams = new URLSearchParams(window.location.search)
    const notification = queryParams.get('notification')
    if (notification) {
      setShowNotification(true)
      setNotificationMessage(decodeURIComponent(notification))
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('Login form submitted')
    setError('')
    setSuccess('')
    setIsLoading(true)
    
    try {
      const result = await login(formData.email, formData.password)
      setIsLoading(false)
      
      if (result.success) {
        console.log('Login successful!')
        console.log('User data:', result.user)
        console.log('User role:', result.user?.role)
        
        if (rememberMe) {
          localStorage.setItem('remembered_email', formData.email)
        } else {
          localStorage.removeItem('remembered_email')
        }
        
        setSuccess('Login successful! Redirecting...')
        
        setTimeout(() => {
          const role = result.user?.role
          console.log('Navigating based on role:', role)
          
          if (role === 'SUPER_ADMIN') {
            console.log('✅ Redirecting to Super Admin Dashboard')
            navigate('/super-admin/dashboard')
            return
          }
          
          if (role === 'CLIENT') {
            console.log('✅ Redirecting to Client Dashboard')
            setShowNotification(true)
            setNotificationMessage(`Welcome ${result.user?.name || 'Client'}!`)
            setTimeout(() => {
              navigate('/client/dashboard')
            }, 500)
            return
          }
          
          console.log('✅ Redirecting to CA Dashboard')
          navigate('/ca/dashboard')
        }, 500)
        
      } else {
        const errorMsg = typeof result.error === 'string' 
          ? result.error 
          : 'Login failed. Please check your credentials.'
        setError(errorMsg)
      }
    } catch (err) {
      setIsLoading(false)
      const errorMsg = typeof err === 'string' 
        ? err 
        : err?.message || 'An unexpected error occurred. Please try again.'
      setError(errorMsg)
      console.error('Login error:', err)
    }
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setFormData({ email: '', password: '' })
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B2A4A] via-[#16223b] to-[#0F1A2E] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative"
      >
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#1B2A4A] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">CA</span>
          </div>
          
          {/* ✅ Dynamic Title based on selected role */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <RoleIcon className={`w-5 h-5 ${currentRole.textColor}`} />
            <h1 className="text-2xl font-bold text-gray-900">
              {currentRole.label} Login
            </h1>
          </div>
          <p className="text-gray-500 text-sm">{currentRole.subtitle}</p>
        </div>

        {/* Role Selector */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 text-center mb-3">Select your role to login</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleRoleSelect('superadmin')}
              className={`p-3 rounded-xl border-2 transition-all text-center ${
                selectedRole === 'superadmin'
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              <ShieldCheck className={`w-5 h-5 mx-auto mb-1 ${selectedRole === 'superadmin' ? 'text-purple-600' : 'text-gray-400'}`} />
              <p className={`text-[10px] font-medium ${selectedRole === 'superadmin' ? 'text-purple-700' : 'text-gray-500'}`}>
                Super Admin
              </p>
            </button>
            <button
              onClick={() => handleRoleSelect('ca')}
              className={`p-3 rounded-xl border-2 transition-all text-center ${
                selectedRole === 'ca'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <Building2 className={`w-5 h-5 mx-auto mb-1 ${selectedRole === 'ca' ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className={`text-[10px] font-medium ${selectedRole === 'ca' ? 'text-blue-700' : 'text-gray-500'}`}>
                CA Firm
              </p>
            </button>
            <button
              onClick={() => handleRoleSelect('client')}
              className={`p-3 rounded-xl border-2 transition-all text-center ${
                selectedRole === 'client'
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
              }`}
            >
              <User className={`w-5 h-5 mx-auto mb-1 ${selectedRole === 'client' ? 'text-green-600' : 'text-gray-400'}`} />
              <p className={`text-[10px] font-medium ${selectedRole === 'client' ? 'text-green-700' : 'text-gray-500'}`}>
                Client
              </p>
            </button>
          </div>
        </div>

        {/* Notification Banner */}
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-2"
          >
            <Bell className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">{notificationMessage}</p>
          </motion.div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2"
          >
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-600">{success}</p>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
                disabled={isLoading || authLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
                disabled={isLoading || authLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading || authLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#1B2A4A] border-gray-300 rounded focus:ring-[#1B2A4A]"
                disabled={isLoading || authLoading}
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <Link 
              to="/forgot-password" 
              className="text-sm text-[#1B2A4A] hover:text-[#16223b] font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading || authLoading}
            className="w-full bg-[#1B2A4A] text-white py-2.5 rounded-lg hover:bg-[#16223b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
          >
            {isLoading || authLoading ? (
              <>
                <Loader2 className="animate-spin mr-2 w-4 h-4" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </form>

       
        {/* Footer Links */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#1B2A4A] hover:text-[#16223b] font-medium transition-colors">
              Sign up
            </Link>
          </p>
         
        </div>

        {/* Loading Overlay */}
        {(isLoading || authLoading) && (
          <div className="absolute inset-0 bg-white/50 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <Loader2 className="animate-spin w-8 h-8 text-[#1B2A4A]" />
              <p className="text-sm text-gray-500 mt-2">Authenticating...</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Login