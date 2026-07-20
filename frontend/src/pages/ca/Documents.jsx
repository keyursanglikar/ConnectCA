// src/pages/ca/Documents.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import DashboardLayout from '../../components/common/Layout/DashboardLayout'
import {
  FileText, Upload, X, Loader2, CheckCircle, Clock, AlertCircle,
  Eye, EyeOff, Download, ExternalLink, Link as LinkIcon,
  Send, Filter, Search, ChevronDown, ChevronUp,
  Calendar, User, Building, FolderOpen, FileCheck,
  ThumbsUp, ThumbsDown, MoreVertical, Edit, Printer,
  DollarSign, Receipt, Check, ArrowRight, Sparkles,
  Plus, Trash2, RefreshCw, List, Grid, Info,
  File, Folder, Image, Music, Film, Archive, 
  FileArchive, FileCode, FileSpreadsheet, 
  FileVideo, FileAudio, FileImage, FileJson,
  Inbox
} from 'lucide-react'
import { documentApi } from '../../api/document.api'
import { submissionApi } from '../../api/submission.api'
import { billApi } from '../../api/bill.api'
import safeToast from '../../utils/toast'

import ViewDocumentModal from '../../components/common/Modals/ViewDocumentModal'

const CADocuments = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [submissions, setSubmissions] = useState([])
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [activeTab, setActiveTab] = useState('received')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [selectedClient, setSelectedClient] = useState('')
  const [clients, setClients] = useState([])
  const [viewMode, setViewMode] = useState('list')

  useEffect(() => {
    fetchData()
    fetchClients()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const submissionsData = await submissionApi.getSubmissions()
      setSubmissions(submissionsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      safeToast.error('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      const response = await axios.get(`${API_URL}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setClients(response.data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      'REVIEWING': { label: 'Reviewing', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      'APPROVED': { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200' },
      'REJECTED': { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
      'BILL_GENERATED': { label: 'Bill Generated', color: 'bg-purple-100 text-purple-700 border-purple-200' },
      'BILL_SENT': { label: 'Bill Sent', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
      'BILL_CONFIRMED': { label: 'Bill Confirmed', color: 'bg-green-100 text-green-700 border-green-200' },
      'CONFIRMED': { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    }
    const config = statusMap[status] || statusMap['PENDING']
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>{config.label}</span>
  }

  const handleViewDocument = (document) => {
    setSelectedDocument(document)
    setShowDocumentModal(true)
  }

  const handleUploadComputation = async (submissionId) => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.pdf,.doc,.docx,.xlsx,.xls,.jpg,.png'
    fileInput.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      const link = prompt('Enter OneDrive share link:')
      if (link) {
        try {
          await submissionApi.uploadComputation(submissionId, link, file.name)
          safeToast.success('Computation uploaded successfully')
          fetchData()
        } catch (error) {
          safeToast.error('Failed to upload computation')
        }
      }
    }
    fileInput.click()
  }

  const handleGenerateBill = async (submissionId) => {
    try {
      const result = await submissionApi.generateBill(submissionId)
      safeToast.success(`Bill generated: ${result.bill_number}`)
      fetchData()
    } catch (error) {
      safeToast.error('Failed to generate bill')
    }
  }

  const handleSendBill = async (submissionId) => {
    try {
      await submissionApi.sendBillToClient(submissionId)
      safeToast.success('Bill sent to client')
      fetchData()
    } catch (error) {
      safeToast.error('Failed to send bill')
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.bill_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus
    return matchesSearch && matchesStatus
  })

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
      title="Document Management" 
      subtitle="Manage client documents and submissions"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Total Submissions</p>
          <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600">
            {submissions.filter(s => s.status === 'PENDING' || s.status === 'REVIEWING').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Bills Generated</p>
          <p className="text-2xl font-bold text-purple-600">
            {submissions.filter(s => s.status === 'BILL_GENERATED' || s.status === 'BILL_SENT').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Confirmed</p>
          <p className="text-2xl font-bold text-green-600">
            {submissions.filter(s => s.status === 'BILL_CONFIRMED' || s.status === 'CONFIRMED').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('received')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'received'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Received from Clients
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {submissions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('uploaded')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'uploaded'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Uploaded to Clients
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {documents.filter(d => d.source === 'ca').length}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {viewMode === 'list' ? <Grid size={18} /> : <List size={18} />}
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary flex items-center text-sm px-3 py-1.5"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by client or document..."
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
          <option value="REVIEWING">Reviewing</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="BILL_GENERATED">Bill Generated</option>
          <option value="BILL_SENT">Bill Sent</option>
          <option value="BILL_CONFIRMED">Bill Confirmed</option>
          <option value="CONFIRMED">Confirmed</option>
        </select>
        <button
          onClick={fetchData}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
            <p className="text-sm text-gray-500">Client submissions will appear here once they upload documents.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Submission</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Bill</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-500" />
                        <span className="text-sm font-medium">#{submission.id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{submission.client_name}</p>
                        <p className="text-xs text-gray-500">{submission.client_email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{submission.document_count || 0} files</span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(submission.status)}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{parseFloat(submission.total_estimate || 0).toFixed(0)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/ca/submissions/${submission.id}`)}
                          className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {submission.status === 'PENDING' && (
                          <button
                            onClick={() => handleUploadComputation(submission.id)}
                            className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Upload Computation"
                          >
                            <Upload size={16} />
                          </button>
                        )}
                        {(submission.status === 'REVIEWING' || submission.status === 'PENDING') && (
                          <button
                            onClick={() => handleGenerateBill(submission.id)}
                            className="p-1.5 text-purple-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Generate Bill"
                          >
                            <DollarSign size={16} />
                          </button>
                        )}
                        {submission.status === 'BILL_GENERATED' && (
                          <button
                            onClick={() => handleSendBill(submission.id)}
                            className="p-1.5 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Send Bill to Client"
                          >
                            <Send size={16} />
                          </button>
                        )}
                        {submission.bill_id && (
                          <button
                            onClick={() => navigate(`/ca/invoices/${submission.bill_id}`)}
                            className="p-1.5 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Bill"
                          >
                            <Receipt size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

export default CADocuments