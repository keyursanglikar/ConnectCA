import React from 'react'
import { 
  UserPlus, 
  FileText, 
  DollarSign, 
  Upload,
  Users,
  FileCheck,
  MessageSquare,
  Settings
} from 'lucide-react'
import { motion } from 'framer-motion'

const QuickActions = ({ actions = [], className = '' }) => {
  const defaultActions = [
    { icon: UserPlus, label: 'Add Client', color: 'blue', onClick: () => {} },
    { icon: FileText, label: 'Request Docs', color: 'green', onClick: () => {} },
    { icon: DollarSign, label: 'Generate Bill', color: 'purple', onClick: () => {} },
    { icon: Upload, label: 'Upload Files', color: 'orange', onClick: () => {} },
  ]

  const displayActions = actions.length > 0 ? actions : defaultActions

  const colorMap = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    red: 'bg-red-500 hover:bg-red-600',
    pink: 'bg-pink-500 hover:bg-pink-600',
    indigo: 'bg-indigo-500 hover:bg-indigo-600',
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {displayActions.map((action, index) => {
          const Icon = action.icon
          const colorClass = colorMap[action.color] || colorMap.blue
          
          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={action.onClick}
              className={`
                flex flex-col items-center justify-center p-4 rounded-lg 
                text-white transition-all duration-200
                ${colorClass}
                hover:shadow-lg transform hover:-translate-y-1
              `}
            >
              <Icon className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium text-center">{action.label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export default QuickActions