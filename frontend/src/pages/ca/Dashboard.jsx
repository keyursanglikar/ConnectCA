// frontend/src/pages/ca/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../components/common/Layout/DashboardLayout.jsx'
import OneDriveConnectionModal from '../../components/common/Modals/OneDriveConnectionModal'
import { useAuth } from '../../context/AuthContext'
import {
  Users, FileText, DollarSign, TrendingUp, Clock, CheckCircle,
  AlertCircle, Bell, Calendar, Activity, Download, Eye,
  ArrowUp, ArrowDown, MoreVertical, RefreshCw, Loader2,
  UserPlus, FileCheck, CreditCard, Briefcase, Building,
  MessageSquare, Mail, Phone, MapPin, Link as LinkIcon,
  Star, Award, Zap, Sparkles, Shield, Lock, Key,
  Smartphone, Monitor, Server, Cloud, Database,
  CloudOff, AlertTriangle, Check, X
} from 'lucide-react'
import axios from 'axios'
import safeToast from '../../utils/toast'

const Dashboard = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, showOneDrivePopup, setShowOneDrivePopup, refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [onedriveStatus, setOnedriveStatus] = useState({
    connected: false,
    checking: true
  })
  
  // ✅ Use ref to track if notification has been shown (prevents infinite loop)
  const hasShownOneDriveSuccess = useRef(false)
  
  const [stats, setStats] = useState({
    totalClients: 0,
    totalDocuments: 0,
    totalBills: 0,
    totalRevenue: 0,
    pendingBills: 0,
    pendingDocuments: 0,
    recentClients: [],
    recentDocuments: [],
    notifications: [],
    upcomingDeadlines: []
  })

  // ✅ Check OneDrive status
  useEffect(() => {
    const checkOneDriveStatus = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
        
        const response = await axios.get(`${API_URL}/onedrive/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        setOnedriveStatus({
          connected: response.data.connected || false,
          checking: false
        })
      } catch (error) {
        console.error('Failed to check OneDrive status:', error)
        setOnedriveStatus({
          connected: false,
          checking: false
        })
      }
    }
    
    checkOneDriveStatus()
  }, [user])

  // ✅ Handle OneDrive callback from redirect - FIXED INFINITE LOOP
  useEffect(() => {
    const onedriveConnected = searchParams.get('onedrive_connected')
    const onedriveError = searchParams.get('onedrive_error')
    
    // ✅ Only process if not already shown
    if (onedriveConnected === 'true' && !hasShownOneDriveSuccess.current) {
      console.log('✅ OneDrive connected successfully!')
      
      // Mark as shown to prevent infinite loop
      hasShownOneDriveSuccess.current = true
      
      // Show success message - ONLY ONCE
      safeToast.success('✅ OneDrive connected successfully!', {
        duration: 4000,
        position: 'top-center'
      })
      
      // Update OneDrive status
      setOnedriveStatus({
        connected: true,
        checking: false
      })
      
      // Refresh user data
      refreshUser()
      
      // Close the modal if it's open
      setShowOneDrivePopup(false)
      
      // Clear the first_time_ca_login flag
      localStorage.removeItem('first_time_ca_login')
      
      // ✅ Remove the query param from URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
      
      // ✅ Also update searchParams state to remove the param
      setSearchParams({})
    }
    
    if (onedriveError && !hasShownOneDriveSuccess.current) {
      console.error('❌ OneDrive connection error:', onedriveError)
      hasShownOneDriveSuccess.current = true
      
      safeToast.error(`OneDrive connection failed: ${onedriveError}`, {
        duration: 5000,
        position: 'top-center'
      })
      
      // Remove the query param from URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
      setSearchParams({})
    }
  }, [searchParams, refreshUser, setShowOneDrivePopup, setSearchParams])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // ✅ Handle OneDrive connection success from modal
  const handleOneDriveConnected = async () => {
    safeToast.success('✅ OneDrive connected successfully!')
    await refreshUser()
    setShowOneDrivePopup(false)
    localStorage.removeItem('first_time_ca_login')
    
    // Update OneDrive status
    setOnedriveStatus({
      connected: true,
      checking: false
    })
  }

  // ✅ Handle OneDrive connection skip
  const handleOneDriveSkip = () => {
    safeToast.info('You can connect OneDrive later from Settings')
    setShowOneDrivePopup(false)
  }

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

      const statsResponse = await axios.get(`${API_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const notificationsResponse = await axios.get(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const notificationsData = notificationsResponse.data?.notifications || []
      const notificationsList = Array.isArray(notificationsData) ? notificationsData : []

      setStats({
        totalClients: statsResponse.data?.total_clients || 0,
        totalDocuments: statsResponse.data?.total_documents || 0,
        totalBills: statsResponse.data?.total_bills || 0,
        totalRevenue: statsResponse.data?.total_revenue || 0,
        pendingBills: statsResponse.data?.pending_bills || 0,
        pendingDocuments: statsResponse.data?.pending_documents || 0,
        recentClients: statsResponse.data?.recent_clients || [],
        recentDocuments: statsResponse.data?.recent_documents || [],
        notifications: notificationsList,
        upcomingDeadlines: statsResponse.data?.upcoming_deadlines || []
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setStats(prev => ({
        ...prev,
        notifications: []
      }))
      safeToast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'REVIEWING': 'bg-blue-100 text-blue-700 border-blue-200',
      'APPROVED': 'bg-green-100 text-green-700 border-green-200',
      'REJECTED': 'bg-red-100 text-red-700 border-red-200',
      'BILL_GENERATED': 'bg-purple-100 text-purple-700 border-purple-200',
      'BILL_SENT': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'BILL_CONFIRMED': 'bg-green-100 text-green-700 border-green-200',
      'CONFIRMED': 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  // ✅ Render OneDrive Status Indicator
// ✅ Render OneDrive Status Indicator
const renderOneDriveStatus = () => {
  if (onedriveStatus.checking) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        <span className="text-xs text-gray-500">Checking...</span>
      </div>
    )
  }
  
  if (onedriveStatus.connected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
        <Cloud className="w-4 h-4 text-green-600" />
        <span className="text-xs font-medium text-green-700">OneDrive Connected</span>
        <Check className="w-3.5 h-3.5 text-green-600" />
        {onedriveStatus.wasRefreshed && (
          <span className="text-[10px] text-green-500 bg-green-100 px-1.5 py-0.5 rounded">
            Auto-refreshed
          </span>
        )}
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
      <CloudOff className="w-4 h-4 text-red-600" />
      <span className="text-xs font-medium text-red-700">OneDrive Not Connected</span>
      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
    </div>
  )
}

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Welcome back!">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
          <span className="ml-3 text-gray-500">Loading dashboard...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <>
      <DashboardLayout 
        title="Dashboard" 
        subtitle={`Welcome back, ${user?.name || 'CA'}!`}
        headerActions={renderOneDriveStatus()}
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalClients}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
              <ArrowUp className="w-3 h-3" />
              <span>12% this month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalDocuments}</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <FileText className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-yellow-600">
              <Clock className="w-3 h-3" />
              <span>{stats.pendingDocuments} pending</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Bills</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalBills}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-purple-600">
              <Clock className="w-3 h-3" />
              <span>{stats.pendingBills} pending</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
              <ArrowUp className="w-3 h-3" />
              <span>8% this month</span>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Clients */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-500" />
                Recent Clients
              </h3>
              <button 
                onClick={() => navigate('/ca/clients')}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {stats.recentClients.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No clients yet
                </div>
              ) : (
                stats.recentClients.map((client, index) => (
                  <div key={index} className="p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                        {client.name?.charAt(0) || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                        <p className="text-xs text-gray-500 truncate">{client.email}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(client.status)}`}>
                        {client.status || 'Active'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Documents */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-500" />
                Recent Documents
              </h3>
              <button 
                onClick={() => navigate('/ca/documents')}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {stats.recentDocuments.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No documents yet
                </div>
              ) : (
                stats.recentDocuments.map((doc, index) => (
                  <div key={index} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.file_title}</p>
                          <p className="text-xs text-gray-500">{doc.client_name || 'Unknown Client'}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(doc.status)} flex-shrink-0`}>
                        {doc.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary-500" />
                Notifications
                {stats.notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                    {stats.notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </h3>
              <button 
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('access_token')
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
                    await axios.post(`${API_URL}/notifications/mark-all-read`, {}, {
                      headers: { 'Authorization': `Bearer ${token}` }
                    })
                    safeToast.success('All notifications marked as read')
                    fetchDashboardData()
                  } catch (error) {
                    console.error('Error marking notifications as read:', error)
                  }
                }}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark All Read
              </button>
            </div>
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {stats.notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No notifications
                </div>
              ) : (
                stats.notifications.map((notification, index) => (
                  <div key={index} className={`p-3 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50/50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-full ${!notification.is_read ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        {notification.type === 'submission_received' ? (
                          <FileText className={`w-3.5 h-3.5 ${!notification.is_read ? 'text-blue-600' : 'text-gray-400'}`} />
                        ) : notification.type === 'bill_generated' || notification.type === 'bill_received' ? (
                          <DollarSign className={`w-3.5 h-3.5 ${!notification.is_read ? 'text-purple-600' : 'text-gray-400'}`} />
                        ) : notification.type === 'client_created' ? (
                          <Users className={`w-3.5 h-3.5 ${!notification.is_read ? 'text-green-600' : 'text-gray-400'}`} />
                        ) : (
                          <Bell className={`w-3.5 h-3.5 ${!notification.is_read ? 'text-yellow-600' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {notification.created_at ? new Date(notification.created_at).toLocaleDateString() : ''}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5"></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button 
              onClick={() => navigate('/ca/clients/add')}
              className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
            >
              <UserPlus className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <span className="text-xs font-medium text-blue-700">Add Client</span>
            </button>
            <button 
              onClick={() => navigate('/ca/documents')}
              className="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors text-center"
            >
              <FileCheck className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
              <span className="text-xs font-medium text-yellow-700">Review Documents</span>
            </button>
            <button 
              onClick={() => navigate('/ca/invoices/generate')}
              className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
            >
              <DollarSign className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <span className="text-xs font-medium text-purple-700">Generate Bill</span>
            </button>
            <button 
              onClick={() => navigate('/ca/clients')}
              className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center"
            >
              <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <span className="text-xs font-medium text-green-700">View Clients</span>
            </button>
          </div>
        </div>
      </DashboardLayout>

      {/* ✅ OneDrive Connection Modal - Shows on first login */}
      <OneDriveConnectionModal
        isOpen={showOneDrivePopup}
        onClose={() => setShowOneDrivePopup(false)}
        onConnect={handleOneDriveConnected}
        onSkip={handleOneDriveSkip}
      />
    </>
  )
}

export default Dashboard