// import React, { useState, useEffect } from 'react'
// import { motion } from 'framer-motion'
// import { 
//   Users, 
//   FileText, 
//   DollarSign, 
//   Clock,
//   TrendingUp,
//   Bell,
//   CheckCircle,
//   AlertCircle,
//   UserCheck,
//   Mail,
//   ArrowUpRight,
//   ArrowDownRight
// } from 'lucide-react'
// import DashboardLayout from '../../components/common/Layout/DashboardLayout'
// import MetricCard from '../../components/common/Cards/MetricCard'
// import axios from 'axios'
// import safeToast from '../../utils/toast'
// import { format } from 'date-fns'

// const Dashboard = () => {
//   const [stats, setStats] = useState([
//     { title: 'Total Clients', value: '0', icon: Users, trend: 0, color: 'blue' },
//     { title: 'Active Cases', value: '0', icon: FileText, trend: 0, color: 'orange' },
//     { title: 'Revenue This Month', value: '₹0', icon: DollarSign, trend: 0, color: 'green' },
//     { title: 'Pending Documents', value: '0', icon: Clock, trend: 0, color: 'red' },
//   ])
//   const [recentActivities, setRecentActivities] = useState([])
//   const [notifications, setNotifications] = useState([])
//   const [isLoading, setIsLoading] = useState(true)

//   useEffect(() => {
//     fetchDashboardData()
//     fetchNotifications()
//   }, [])

//   const fetchDashboardData = async () => {
//     try {
//       const token = localStorage.getItem('access_token')
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
//       const response = await axios.get(`${API_URL}/dashboard/ca`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       })
      
//       const data = response.data
//       setStats([
//         { 
//           title: 'Total Clients', 
//           value: data.total_clients || '0', 
//           icon: Users, 
//           trend: data.client_growth || 0, 
//           color: 'blue' 
//         },
//         { 
//           title: 'Active Cases', 
//           value: data.active_clients || '0', 
//           icon: FileText, 
//           trend: 0, 
//           color: 'orange' 
//         },
//         { 
//           title: 'Revenue This Month', 
//           value: `₹${data.total_revenue?.toLocaleString() || '0'}`, 
//           icon: DollarSign, 
//           trend: data.revenue_growth || 0, 
//           color: 'green' 
//         },
//         { 
//           title: 'Pending Documents', 
//           value: data.pending_documents || '0', 
//           icon: Clock, 
//           trend: 0, 
//           color: 'red' 
//         },
//       ])
      
//       setRecentActivities(data.recent_activities || [])
//     } catch (error) {
//       console.error('Error fetching dashboard data:', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const fetchNotifications = async () => {
//     try {
//       const token = localStorage.getItem('access_token')
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
//       const response = await axios.get(`${API_URL}/notifications`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       })
      
//       setNotifications(response.data || [])
//     } catch (error) {
//       console.error('Error fetching notifications:', error)
//     }
//   }

//   const getNotificationIcon = (type) => {
//     switch(type) {
//       case 'login':
//         return <UserCheck className="w-4 h-4 text-blue-500" />
//       case 'document':
//         return <FileText className="w-4 h-4 text-yellow-500" />
//       case 'payment':
//         return <DollarSign className="w-4 h-4 text-green-500" />
//       default:
//         return <Bell className="w-4 h-4 text-gray-500" />
//     }
//   }

//   return (
//     <DashboardLayout 
//       title="Dashboard" 
//       subtitle="Welcome back! Here's what's happening with your clients."
//     >
//       {/* Stats Grid */}
//       <motion.div 
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6"
//       >
//         {stats.map((stat, index) => (
//           <MetricCard key={index} {...stat} loading={isLoading} />
//         ))}
//       </motion.div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Recent Activity */}
//         <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
//           <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
//           <div className="space-y-4">
//             {recentActivities.length === 0 ? (
//               <p className="text-gray-500 text-center py-4">No recent activity</p>
//             ) : (
//               recentActivities.map((activity, index) => (
//                 <div key={index} className="flex items-center justify-between py-2 border-b">
//                   <div className="flex items-center space-x-3">
//                     <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
//                       {activity.type === 'client_created' && <Users size={20} className="text-primary-500" />}
//                       {activity.type === 'document_uploaded' && <FileText size={20} className="text-primary-500" />}
//                       {activity.type === 'payment_received' && <DollarSign size={20} className="text-primary-500" />}
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium">{activity.title}</p>
//                       <p className="text-xs text-gray-500">
//                         {format(new Date(activity.time), 'MMM dd, yyyy h:mm a')}
//                       </p>
//                     </div>
//                   </div>
//                   <span className={`text-sm ${
//                     activity.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
//                   }`}>
//                     {activity.status === 'completed' ? (
//                       <CheckCircle className="w-4 h-4 inline mr-1" />
//                     ) : (
//                       <Clock className="w-4 h-4 inline mr-1" />
//                     )}
//                     {activity.status}
//                   </span>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>

//         {/* Notifications */}
//         <div className="bg-white rounded-xl shadow-sm p-6">
//           <h2 className="text-lg font-semibold mb-4 flex items-center">
//             <Bell className="w-5 h-5 mr-2 text-primary-500" />
//             Notifications
//             {notifications.filter(n => !n.read).length > 0 && (
//               <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
//                 {notifications.filter(n => !n.read).length}
//               </span>
//             )}
//           </h2>
//           <div className="space-y-3 max-h-96 overflow-y-auto">
//             {notifications.length === 0 ? (
//               <p className="text-gray-500 text-center py-4 text-sm">No notifications</p>
//             ) : (
//               notifications.map((notification) => (
//                 <div 
//                   key={notification.id} 
//                   className={`p-3 rounded-lg border ${notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}
//                 >
//                   <div className="flex items-start space-x-3">
//                     <div className="mt-1">
//                       {getNotificationIcon(notification.type)}
//                     </div>
//                     <div className="flex-1">
//                       <p className="text-sm font-medium">{notification.message}</p>
//                       <p className="text-xs text-gray-500">
//                         {format(new Date(notification.created_at), 'MMM dd, yyyy h:mm a')}
//                       </p>
//                       {notification.data?.client_name && (
//                         <p className="text-xs text-gray-400 mt-1">
//                           Client: {notification.data.client_name}
//                         </p>
//                       )}
//                     </div>
//                     {!notification.read && (
//                       <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
//                     )}
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   )
// }

// export default Dashboard





// src/pages/ca/Dashboard.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/common/Layout/DashboardLayout'
import {
  Users, FileText, DollarSign, TrendingUp, Clock, CheckCircle,
  AlertCircle, Bell, Calendar, Activity, Download, Eye,
  ArrowUp, ArrowDown, MoreVertical, RefreshCw, Loader2,
  UserPlus, FileCheck, CreditCard, Briefcase, Building,
  MessageSquare, Mail, Phone, MapPin, Link as LinkIcon,
  Star, Award, Zap, Sparkles, Shield, Lock, Key,
  Smartphone, Monitor, Server, Cloud, Database
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import axios from 'axios'
import safeToast from '../../utils/toast'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClients: 0,
    totalDocuments: 0,
    totalBills: 0,
    totalRevenue: 0,
    pendingBills: 0,
    pendingDocuments: 0,
    recentClients: [],
    recentDocuments: [],
    notifications: [], // ✅ Initialize as empty array
    upcomingDeadlines: []
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

      // Fetch dashboard stats
      const statsResponse = await axios.get(`${API_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // Fetch notifications
      const notificationsResponse = await axios.get(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      // ✅ Ensure notifications is always an array
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
      // ✅ Set default empty values on error
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
    <DashboardLayout 
      title="Dashboard" 
      subtitle={`Welcome back, ${user?.name || 'CA'}!`}
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
            <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              Mark All Read
            </button>
          </div>
          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {stats.notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No notifications
              </div>
            ) : (
              // ✅ Use notifications directly since we already ensured it's an array
              stats.notifications.map((notification, index) => (
                <div key={index} className={`p-3 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50/50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full ${!notification.is_read ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {notification.type === 'submission_received' ? (
                        <FileText className={`w-3.5 h-3.5 ${!notification.is_read ? 'text-blue-600' : 'text-gray-400'}`} />
                      ) : notification.type === 'bill_generated' || notification.type === 'bill_received' ? (
                        <DollarSign className={`w-3.5 h-3.5 ${!notification.is_read ? 'text-purple-600' : 'text-gray-400'}`} />
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
  )
}

export default Dashboard