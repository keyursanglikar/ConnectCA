// src/pages/Documents.jsx (Shared component for both CA and Client)
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/common/Layout/DashboardLayout'
import {
  FileText, Upload, X, Loader2, CheckCircle, Clock, AlertCircle,
  Eye, EyeOff, Download, ExternalLink, Link as LinkIcon,
  Send, Filter, Search, ChevronDown, ChevronUp,
  Calendar, User, Building, FolderOpen, FileCheck,
  ThumbsUp, ThumbsDown, MoreVertical, Edit, Printer,
  DollarSign, Receipt, Check, ArrowRight, Sparkles
} from 'lucide-react'
import { documentApi } from '../api/document.api'
import { submissionApi } from '../api/submission.api'
import { billApi } from '../api/bill.api'
import safeToast from '../utils/toast'
import ViewDocumentModal from '../components/common/Modals/ViewDocumentModal'

const Documents = ({ role = 'ca' }) => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [activeTab, setActiveTab] = useState('received') // 'received', 'uploaded', 'submissions'
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [selectedClient, setSelectedClient] = useState('')
  const [clients, setClients] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      if (role === 'ca') {
        // Fetch submissions for CA
        const submissionsData = await submissionApi.getSubmissions()
        setSubmissions(submissionsData)
      } else {
        // Fetch documents for client
        // ... client specific fetch
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      safeToast.error('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
      'REVIEWING': { label: 'Reviewing', color: 'bg-blue-100 text-blue-700' },
      'APPROVED': { label: 'Approved', color: 'bg-green-100 text-green-700' },
      'REJECTED': { label: 'Rejected', color: 'bg-red-100 text-red-700' },
      'BILL_GENERATED': { label: 'Bill Generated', color: 'bg-purple-100 text-purple-700' },
      'BILL_SENT': { label: 'Bill Sent', color: 'bg-indigo-100 text-indigo-700' },
      'BILL_CONFIRMED': { label: 'Bill Confirmed', color: 'bg-green-100 text-green-700' },
      'CONFIRMED': { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700' }
    }
    const config = statusMap[status] || statusMap['PENDING']
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Documents" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title={role === 'ca' ? 'Document Management' : 'My Documents'} 
      subtitle={role === 'ca' ? 'Manage client documents and submissions' : 'View your documents and submissions'}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Total Documents</p>
          <p className="text-2xl font-bold text-gray-900">24</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">8</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-green-600">12</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Rejected</p>
          <p className="text-2xl font-bold text-red-600">4</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('received')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'received'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {role === 'ca' ? 'Received from Clients' : 'Uploaded to CA'}
        </button>
        <button
          onClick={() => setActiveTab('uploaded')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'uploaded'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {role === 'ca' ? 'Uploaded to Clients' : 'Uploaded by CA'}
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'submissions'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Submissions & Bills
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        {role === 'ca' && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary flex items-center text-sm px-4 py-2"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab === 'received' ? 'received' : 'uploaded'} documents</h3>
            <p className="text-sm text-gray-500">
              {role === 'ca' 
                ? 'Documents from clients will appear here once they upload them.' 
                : 'Upload documents to CA to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                  {role === 'ca' && (
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  )}
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Bill</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Example row - replace with actual data */}
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary-500" />
                      <span className="text-sm font-medium">ITR Documents</span>
                    </div>
                  </td>
                  {role === 'ca' && (
                    <td className="py-3 px-4 text-sm">John Doe</td>
                  )}
                  <td className="py-3 px-4">{getStatusBadge('PENDING')}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">2024-01-15</td>
                  <td className="py-3 px-4 text-sm font-semibold">₹ 5,000</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedDocument({ id: 1 })
                          setShowDocumentModal(true)
                        }}
                        className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {role === 'ca' && (
                        <>
                          <button
                            className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Upload Computation"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-purple-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Generate Bill"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Document Modal */}
      <ViewDocumentModal
        isOpen={showDocumentModal}
        onClose={() => {
          setShowDocumentModal(false)
          setSelectedDocument(null)
        }}
        document={selectedDocument}
      />
    </DashboardLayout>
  )
}

export default Documents