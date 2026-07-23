import React from 'react'
import DashboardLayout from '../../components/common/Layout/DashboardLayout.jsx'
import DashboardMetrics from '../../components/dashboard/DashboardMetrics.jsx'
import RecentActivity from '../../components/dashboard/RecentActivity.jsx'
import QuickActions from '../../components/dashboard/QuickActions.jsx'
import { Users, Building2, UserPlus, Activity, DollarSign, Clock } from 'lucide-react'

const SuperAdminDashboard = () => {
  const metrics = [
    {
      title: 'Total CA Firms',
      value: '24',
      icon: Building2,
      trend: 8,
      color: 'blue',
    },
    {
      title: 'Total CAs',
      value: '56',
      icon: Users,
      trend: 12,
      color: 'green',
    },
    {
      title: 'Active CAs',
      value: '48',
      icon: UserPlus,
      trend: 5,
      color: 'purple',
    },
    {
      title: 'Total Clients',
      value: '1,247',
      icon: Activity,
      trend: 22,
      color: 'orange',
    },
    {
      title: 'Revenue Generated',
      value: '₹12,45,000',
      icon: DollarSign,
      trend: 18,
      color: 'green',
    },
    {
      title: 'Pending Approvals',
      value: '7',
      icon: Clock,
      trend: -3,
      color: 'yellow',
    },
  ]

  const quickActions = [
    { icon: UserPlus, label: 'Create CA', color: 'blue', onClick: () => {} },
    { icon: Building2, label: 'Manage Firms', color: 'green', onClick: () => {} },
    { icon: Users, label: 'View All CAs', color: 'purple', onClick: () => {} },
    { icon: Activity, label: 'Audit Logs', color: 'orange', onClick: () => {} },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage CA firms and users across the platform</p>
        </div>

        <DashboardMetrics metrics={metrics} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <QuickActions actions={quickActions} />
          </div>
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SuperAdminDashboard