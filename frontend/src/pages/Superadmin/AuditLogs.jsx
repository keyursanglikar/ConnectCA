import React, { useState } from 'react'
import DashboardLayout from '../../components/common/Layout/DashboardLayout'
import DataTable from '../../components/common/Tables/DataTable'
import { Search, Filter, Download, Calendar, User, Activity, Clock } from 'lucide-react'

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const logs = [
    {
      id: 1,
      user: 'CA Rajesh Kumar',
      action: 'Created new client',
      details: 'Added client "ABC Corp" to the system',
      ip: '192.168.1.1',
      timestamp: '2024-01-15 10:30:00',
      status: 'success',
    },
    {
      id: 2,
      user: 'CA Priya Sharma',
      action: 'Generated invoice',
      details: 'Invoice #INV-2024-001 for ₹25,000',
      ip: '192.168.1.2',
      timestamp: '2024-01-15 11:45:00',
      status: 'success',
    },
    {
      id: 3,
      user: 'Super Admin',
      action: 'Created CA account',
      details: 'Created account for "CA Amit Patel"',
      ip: '192.168.1.100',
      timestamp: '2024-01-15 09:15:00',
      status: 'success',
    },
    {
      id: 4,
      user: 'CA Rajesh Kumar',
      action: 'Login failed',
      details: 'Invalid password attempt',
      ip: '192.168.1.5',
      timestamp: '2024-01-14 23:50:00',
      status: 'error',
    },
  ]

  const columns = [
    {
      key: 'timestamp',
      label: 'Date & Time',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{row.timestamp}</span>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-semibold">
            {row.user.charAt(0)}
          </div>
          <span className="text-sm font-medium">{row.user}</span>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <span className="text-sm">{row.action}</span>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      render: (row) => (
        <span className="text-sm text-gray-500">{row.details}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'success' ? 'bg-green-100 text-green-700' :
          row.status === 'error' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {row.status}
        </span>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-500 mt-1">Track all activities across the platform</p>
          </div>
          <button className="btn-primary flex items-center whitespace-nowrap">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button className="btn-outline flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={logs}
            pagination={{
              page: 1,
              pageSize: 10,
              total: logs.length,
              from: 1,
              to: logs.length,
              totalPages: 1,
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AuditLogs