import React from 'react'
import { motion } from 'framer-motion'

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'primary',
  loading = false,
  className = '',
}) => {
  const colorMap = {
    primary: {
      bg: 'bg-primary-50',
      text: 'text-primary-500',
      iconBg: 'bg-primary-100',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-500',
      iconBg: 'bg-green-100',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-500',
      iconBg: 'bg-red-100',
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-500',
      iconBg: 'bg-yellow-100',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-500',
      iconBg: 'bg-blue-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-500',
      iconBg: 'bg-purple-100',
    },
  }

  const colors = colorMap[color] || colorMap.primary

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm p-6 animate-pulse ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <p className={`text-sm mt-2 ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} 
              {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colors.bg} ${colors.text} flex-shrink-0 ml-4`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default MetricCard