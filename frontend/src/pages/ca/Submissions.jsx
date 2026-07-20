// src/pages/ca/Submissions.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import DashboardLayout from '../../components/common/Layout/DashboardLayout'
import { 
  FileText, Eye, Clock, CheckCircle, XCircle, Loader2, ArrowLeft,
  Receipt, User, Mail, Calendar, Tag, DollarSign, Building2,
  Search, Filter, ChevronDown, ChevronRight, File, FolderOpen,
  Send, PlusCircle, AlertCircle, Check, X, RefreshCw,
  Calendar as CalendarIcon, MessageSquare, Users,
  TrendingUp, BarChart3, Activity
} from 'lucide-react'
import axios from 'axios'
import safeToast from '../../utils/toast'
import { format } from 'date-fns'

const Submissions = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [submissions, setSubmissions] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      const response = await axios.get(`${API_URL}/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setSubmissions(response.data || [])
    } catch (error) {
      console.error('Error fetching submissions:', error)
      safeToast.error('Failed to load submissions')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { 
        label: 'Pending', 
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: Clock,
        description: 'Waiting for review'
      },
      'REVIEWING': { 
        label: 'Reviewing', 
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Eye,
        description: 'Being reviewed'
      },
      'APPROVED': { 
        label: 'Approved', 
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle,
        description: 'Approved by CA'
      },
      'REJECTED': { 
        label: 'Rejected', 
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
        description: 'Rejected by CA'
      },
      'BILL_GENERATED': { 
        label: 'Bill Generated', 
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: Receipt,
        description: 'Bill created'
      },
      'BILL_SENT': { 
        label: 'Bill Sent', 
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: Send,
        description: 'Sent to client'
      },
      'BILL_CONFIRMED': { 
        label: 'Bill Confirmed', 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle,
        description: 'Confirmed by client'
      },
      'CONFIRMED': { 
        label: 'Confirmed', 
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle,
        description: 'Final confirmed'
      }
    }
    const config = statusMap[status] || statusMap['PENDING']
    const Icon = config.icon
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 border ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'border-l-4 border-yellow-400',
      'REVIEWING': 'border-l-4 border-blue-400',
      'APPROVED': 'border-l-4 border-green-400',
      'REJECTED': 'border-l-4 border-red-400',
      'BILL_GENERATED': 'border-l-4 border-purple-400',
      'BILL_SENT': 'border-l-4 border-indigo-400',
      'BILL_CONFIRMED': 'border-l-4 border-emerald-400',
      'CONFIRMED': 'border-l-4 border-green-500'
    }
    return colors[status] || colors['PENDING']
  }

  const handleReviewSubmission = (submissionId) => {
    navigate(`/ca/submissions/${submissionId}`)
  }

  const handleRefresh = () => {
    fetchSubmissions()
    safeToast.info('Refreshed submissions')
  }

  const getStatusCount = (status) => {
    return submissions.filter(s => s.status === status).length
  }

  const getStatusStats = () => {
    return {
      total: submissions.length,
      pending: getStatusCount('PENDING'),
      reviewing: getStatusCount('REVIEWING'),
      approved: getStatusCount('APPROVED'),
      rejected: getStatusCount('REJECTED'),
      bills: getStatusCount('BILL_GENERATED') + getStatusCount('BILL_SENT') + getStatusCount('BILL_CONFIRMED'),
      confirmed: getStatusCount('CONFIRMED')
    }
  }

  const stats = getStatusStats()

  const filteredSubmissions = submissions
    .filter(sub => {
      const matchesSearch = 
        sub.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.id?.toString().includes(searchTerm)
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
      if (sortBy === 'highest') return parseFloat(b.total_estimate || 0) - parseFloat(a.total_estimate || 0)
      if (sortBy === 'lowest') return parseFloat(a.total_estimate || 0) - parseFloat(b.total_estimate || 0)
      return 0
    })

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage)
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="Client Submissions" 
      subtitle="Review and manage client fee estimations"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100 hover:shadow-md transition-shadow">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow-sm p-3 border border-yellow-100">
          <p className="text-xs text-yellow-600">Pending</p>
          <p className="text-xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 rounded-xl shadow-sm p-3 border border-blue-100">
          <p className="text-xs text-blue-600">Reviewing</p>
          <p className="text-xl font-bold text-blue-700">{stats.reviewing}</p>
        </div>
        <div className="bg-green-50 rounded-xl shadow-sm p-3 border border-green-100">
          <p className="text-xs text-green-600">Approved</p>
          <p className="text-xl font-bold text-green-700">{stats.approved}</p>
        </div>
        <div className="bg-red-50 rounded-xl shadow-sm p-3 border border-red-100">
          <p className="text-xs text-red-600">Rejected</p>
          <p className="text-xl font-bold text-red-700">{stats.rejected}</p>
        </div>
        <div className="bg-purple-50 rounded-xl shadow-sm p-3 border border-purple-100">
          <p className="text-xs text-purple-600">Bills</p>
          <p className="text-xl font-bold text-purple-700">{stats.bills}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl shadow-sm p-3 border border-emerald-100">
          <p className="text-xs text-emerald-600">Confirmed</p>
          <p className="text-xl font-bold text-emerald-700">{stats.confirmed}</p>
        </div>
      </div>

      {/* Search, Filter & Controls */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by client name, email or submission ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="REVIEWING">Reviewing</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="BILL_GENERATED">Bill Generated</option>
                <option value="BILL_SENT">Bill Sent</option>
                <option value="BILL_CONFIRMED">Bill Confirmed</option>
                <option value="CONFIRMED">Confirmed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-w-[120px]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Estimate</option>
                <option value="lowest">Lowest Estimate</option>
              </select>
            </div>

            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Clients\' fee estimations will appear here once they submit documents'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                }}
                className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Submission
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Estimate
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedSubmissions.map((sub) => (
                    <tr 
                      key={sub.id} 
                      className={`hover:bg-gray-50 transition-colors ${getStatusColor(sub.status)}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-primary-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">#{sub.id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{sub.client_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{sub.client_email || 'No email'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">{sub.document_count || 0} files</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="text-sm font-semibold text-gray-900">
                            ₹{parseFloat(sub.total_estimate || 0).toFixed(0)}
                          </span>
                          {sub.total_estimate > 0 && (
                            <p className="text-[10px] text-gray-400">Estimated</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {format(new Date(sub.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleReviewSubmission(sub.id)}
                            className="bg-primary-600 hover:bg-primary-700 text-white text-sm px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm hover:shadow"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredSubmissions.length)} of{' '}
                  {filteredSubmissions.length} submissions
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Submissions