// frontend/src/components/common/Modals/OneDriveConnectionModal.jsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Cloud, 
  Link2, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  X,
  Shield,
  FolderOpen,
  Users,
  FileCheck,
  Zap
} from 'lucide-react'

const OneDriveConnectionModal = ({ isOpen, onClose, onConnect, onSkip }) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('idle') // idle, connecting, success, error

  // Listen for OneDrive connection messages
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'ONEDRIVE_CONNECTED') {
        console.log('✅ OneDrive connected message received')
        setConnectionStatus('success')
        setIsConnecting(false)
        
        setTimeout(() => {
          onConnect?.()
          onClose()
        }, 1500)
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [onConnect, onClose])

  // ✅ Check for URL params when component mounts or when modal opens
  useEffect(() => {
    if (isOpen) {
      const params = new URLSearchParams(window.location.search)
      const onedriveConnected = params.get('onedrive_connected')
      const onedriveError = params.get('onedrive_error')
      
      if (onedriveConnected === 'true') {
        console.log('✅ OneDrive connected via URL param')
        setConnectionStatus('success')
        setIsConnecting(false)
        
        setTimeout(() => {
          onConnect?.()
          onClose()
        }, 1500)
      }
      
      if (onedriveError) {
        console.error('❌ OneDrive error via URL param:', onedriveError)
        setConnectionStatus('error')
        setIsConnecting(false)
      }
    }
  }, [isOpen, onConnect, onClose])

  const handleConnect = () => {
    setIsConnecting(true)
    setConnectionStatus('connecting')
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    
    // ✅ Redirect in the SAME window (no popup)
    window.location.href = `${API_URL}/onedrive/login`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Connect OneDrive</h3>
                <p className="text-xs text-gray-500">Secure cloud storage for your CA documents</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isConnecting}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {connectionStatus === 'idle' && (
              <div className="space-y-5">
                {/* Welcome Message */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-gray-800">
                    <span className="font-bold text-blue-800">🎉 Welcome to EazyTax!</span> 
                    <br />
                    <span className="text-gray-600">
                      To securely store and manage your CA documents, please connect your OneDrive account.
                    </span>
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-1.5 bg-green-100 rounded-full mt-0.5">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Auto-sync Documents</p>
                      <p className="text-xs text-gray-500">All client documents automatically backed up</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-1.5 bg-green-100 rounded-full mt-0.5">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Client Collaboration</p>
                      <p className="text-xs text-gray-500">Share documents securely with clients</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-1.5 bg-green-100 rounded-full mt-0.5">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Access Anywhere</p>
                      <p className="text-xs text-gray-500">Your files are available on any device</p>
                    </div>
                  </div>
                </div>

                {/* Connect Button */}
                <button
                  onClick={handleConnect}
                  className="w-full bg-gradient-to-r from-[#1B2A4A] to-[#2a3f66] text-white py-3 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 font-medium transform hover:scale-[1.02]"
                >
                  <Link2 className="w-4 h-4" />
                  Connect OneDrive Now
                </button>

                {/* Skip Option */}
                <button
                  onClick={() => {
                    onSkip?.()
                    onClose()
                  }}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
                >
                  Skip for now (connect later from settings)
                </button>
              </div>
            )}

            {connectionStatus === 'connecting' && (
              <div className="text-center py-8">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping"></div>
                  <div className="absolute inset-1 bg-blue-500 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Connecting to OneDrive</h4>
                <p className="text-sm text-gray-500 mt-1">Please wait, you'll be redirected to Microsoft...</p>
                <p className="text-xs text-gray-400 mt-4">Don't close this window</p>
              </div>
            )}

            {connectionStatus === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-green-600">✅ Connected Successfully!</h4>
                <p className="text-sm text-gray-500 mt-1">Your OneDrive account is now linked</p>
              </div>
            )}

            {connectionStatus === 'error' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h4 className="text-lg font-semibold text-red-600">Connection Failed</h4>
                <p className="text-sm text-gray-500 mt-1">Unable to connect to OneDrive. Please try again.</p>
                <button
                  onClick={() => setConnectionStatus('idle')}
                  className="mt-4 bg-[#1B2A4A] text-white px-6 py-2 rounded-lg hover:bg-[#16223b] transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Secure connection
              </span>
              <span className="w-px h-3 bg-gray-300"></span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Microsoft Graph API
              </span>
              <span className="w-px h-3 bg-gray-300"></span>
              <ExternalLink className="w-3 h-3" />
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default OneDriveConnectionModal