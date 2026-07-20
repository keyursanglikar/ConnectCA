import React from 'react'
import { motion } from 'framer-motion'
import { 
  UserPlus, 
  FileText, 
  DollarSign, 
  CheckCircle,
  Clock,
  AlertCircle,
  Upload
} from 'lucide-react'

const RecentActivity = ({ activities = [], loading = false, className = '' }) => {
  const defaultActivities = [
    {
      id: 1,
      type: 'client',
      title: 'New client added',
      description: 'John Doe registered as a client',
      time: '2 hours ago',
      status: 'completed',
    },
    {
      id: 2,
      type: 'document',
      title: 'Document uploaded',
      description: 'PAN Card uploaded by Jane Smith',
      time: '4 hours ago',
      status: 'pending',
    },
    {
      id: 3,
      type: 'payment',
      title: 'Payment received',
      description: '₹15,000 received from ABC Corp',
      time: '6 hours ago',
      status: 'completed',
    },
    {
      id: 4,
      type: 'status',
      title: 'Status updated',
      description: 'Case #123 moved to processing',
      time: '1 day ago',
      status: 'in_progress',
    },
  ]

  const displayActivities = activities.length > 0 ? activities : defaultActivities

  const getIcon = (type) => {
    const icons = {
      client: UserPlus,
      document: FileText,
      payment: DollarSign,
      status: Clock,
      upload: Upload,
      alert: AlertCircle,
    }
    return icons[type] || FileText
  }

  const getStatusColor = (status) => {
    const colors = {
      completed: 'text-green-600 bg-green-100',
      pending: 'text-yellow-600 bg-yellow-100',
      in_progress: 'text-blue-600 bg-blue-100',
      error: 'text-red-600 bg-red-100',
    }
    return colors[status] || colors.pending
  }

  const getStatusLabel = (status) => {
    const labels = {
      completed: 'Completed',
      pending: 'Pending',
      in_progress: 'In Progress',
      error: 'Error',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {displayActivities.map((activity, index) => {
          const Icon = getIcon(activity.type)
          const statusColor = getStatusColor(activity.status)
          
          return (
            <motion.div
              key={activity.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`p-2 rounded-full ${statusColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                    {getStatusLabel(activity.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default RecentActivity