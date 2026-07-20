import React from 'react'
import MetricCard from '../common/Cards/MetricCard'
import { Users, FileText, DollarSign, Clock, TrendingUp, CheckCircle } from 'lucide-react'

const DashboardMetrics = ({ metrics, loading = false }) => {
  const defaultMetrics = [
    {
      title: 'Total Clients',
      value: '156',
      icon: Users,
      trend: 12,
      color: 'blue',
    },
    {
      title: 'Active Cases',
      value: '43',
      icon: FileText,
      trend: -3,
      color: 'green',
    },
    {
      title: 'Revenue This Month',
      value: '₹2,45,000',
      icon: DollarSign,
      trend: 18,
      color: 'purple',
    },
    {
      title: 'Pending Documents',
      value: '27',
      icon: Clock,
      trend: -8,
      color: 'yellow',
    },
    {
      title: 'Completed Cases',
      value: '89',
      icon: CheckCircle,
      trend: 15,
      color: 'green',
    },
    {
      title: 'Growth Rate',
      value: '24%',
      icon: TrendingUp,
      trend: 5,
      color: 'blue',
    },
  ]

  const displayMetrics = metrics || defaultMetrics

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {displayMetrics.map((metric, index) => (
        <MetricCard
          key={index}
          {...metric}
          loading={loading}
        />
      ))}
    </div>
  )
}

export default DashboardMetrics