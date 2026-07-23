import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/common/Layout/DashboardLayout.jsx'
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Download,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  ArrowLeft,
  FileCheck,
  DollarSign
} from 'lucide-react'
import axios from 'axios'
import safeToast from '../../utils/toast.js'

const ClientDocuments = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [client, setClient] = useState(null)
  const [documents, setDocuments] = useState([])
  const [financialYears, setFinancialYears] = useState([])
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const [requestData, setRequestData] = useState({
    document_type: '',
    file_title: '',
    fy_id: '',
    remarks: ''
  })

  const documentTypes = [
    'PAN Card',
    'Aadhaar Card',
    'Bank Statements',
    'Salary Slips',
    'Investment Proofs',
    'Rental Agreements',
    'Property Papers',
    'Form 16',
    'GST Returns',
    'ITR Copies',
    'Audit Reports',
    'Balance Sheet',
    'Profit & Loss Statement',
    'Other'
  ]

  useEffect(() => {
    if (id) {
      fetchClientData()
      fetchDocuments()
      fetchFinancialYears()
    }
  }, [id])

  const fetchClientData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      const response = await axios.get(`${API_URL}/clients/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setClient(response.data)
    } catch (error) {
      console.error('Error fetching client:', error)
      safeToast.error('Failed to load client data')
    }
  }

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      const response = await axios.get(`${API_URL}/clients/${id}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setDocuments(response.data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFinancialYears = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      const response = await axios.get(`${API_URL}/financial-years`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setFinancialYears(response.data || [])
    } catch (error) {
      console.error('Error fetching financial years:', error)
      setFinancialYears([
        { id: 1, year: '2023-24' },
        { id: 2, year: '2024-25' },
        { id: 3, year: '2025-26' }
      ])
    }
  }

  const handleRequestDocument = async (e) => {
    e.preventDefault()
    
    if (!requestData.document_type || !requestData.file_title || !requestData.fy_id) {
      safeToast.error('Please fill all required fields')
      return
    }

    setIsUploading(true)
    
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      const payload = {
        client_id: parseInt(id),
        fy_id: parseInt(requestData.fy_id),
        document_type: requestData.document_type,
        file_title: requestData.file_title,
        remarks: requestData.remarks
      }
      
      const response = await axios.post(
        `${API_URL}/clients/documents/request`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.status === 200 || response.status === 201) {
        safeToast.success('Document request sent successfully!')
        setShowRequestModal(false)
        setRequestData({
          document_type: '',
          file_title: '',
          fy_id: '',
          remarks: ''
        })
        fetchDocuments()
      }
    } catch (error) {
      console.error('Error requesting document:', error)
      safeToast.error('Failed to request document')
    } finally {
      setIsUploading(false)
    }
  }

  const handleStatusUpdate = async (docId, status) => {
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      await axios.patch(
        `${API_URL}/clients/documents/${docId}/status`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      safeToast.success(`Document ${status.toLowerCase()} successfully`)
      fetchDocuments()
    } catch (error) {
      console.error('Error updating document status:', error)
      safeToast.error('Failed to update document status')
    }
  }

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return
    
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      await axios.delete(
        `${API_URL}/clients/documents/${docId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      
      safeToast.success('Document deleted successfully')
      fetchDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      safeToast.error('Failed to delete document')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_upload: { label: 'Pending Upload', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      uploaded: { label: 'Uploaded', color: 'bg-blue-100 text-blue-700', icon: Upload },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
      re_upload_required: { label: 'Re-upload Required', color: 'bg-orange-100 text-orange-700', icon: AlertCircle }
    }
    
    const config = statusConfig[status] || statusConfig.pending_upload
    const Icon = config.icon
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin w-8 h-8 text-primary-500 mx-auto" />
            <p className="mt-2 text-gray-500">Loading documents...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/ca/clients')}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Clients
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {client?.name || 'Client'} - Documents
            </h1>
            <p className="text-gray-500 mt-1">
              Manage documents for {client?.name}
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Request Document
          </button>
        </div>

        {/* Client Summary */}
        {client && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">Client Name</p>
              <p className="font-semibold">{client.name}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold">{client.email}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-semibold capitalize">{client.status}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">Fee Status</p>
              <p className={`font-semibold ${
                client.fee_status === 'paid' ? 'text-green-600' :
                client.fee_status === 'pending' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {client.fee_status?.toUpperCase() || 'PENDING'}
              </p>
            </div>
          </div>
        )}

        {/* Documents Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Document</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Uploaded By</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      No documents found. Request documents from the client.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{doc.file_title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{doc.document_type}</td>
                      <td className="py-3 px-4">{getStatusBadge(doc.status)}</td>
                      <td className="py-3 px-4 text-sm capitalize">{doc.uploaded_by || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">
                        {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {doc.gdrive_web_link && (
                            <a
                              href={doc.gdrive_web_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-gray-100 rounded transition-colors text-blue-500"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                          )}
                          {doc.status === 'uploaded' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(doc.id, 'approved')}
                                className="p-1 hover:bg-gray-100 rounded transition-colors text-green-500"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(doc.id, 'rejected')}
                                className="p-1 hover:bg-gray-100 rounded transition-colors text-red-500"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {doc.status === 'rejected' && (
                            <button
                              onClick={() => handleStatusUpdate(doc.id, 're_upload_required')}
                              className="p-1 hover:bg-gray-100 rounded transition-colors text-orange-500"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        {documents.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">Total Documents</p>
              <p className="text-2xl font-bold">{documents.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {documents.filter(d => d.status === 'pending_upload' || d.status === 'uploaded').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {documents.filter(d => d.status === 'approved').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {documents.filter(d => d.status === 'rejected').length}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Request Document Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Request Document</h2>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleRequestDocument} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={requestData.document_type}
                    onChange={(e) => setRequestData({ ...requestData, document_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Document Type</option>
                    {documentTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    File Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={requestData.file_title}
                    onChange={(e) => setRequestData({ ...requestData, file_title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter a title for this document"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Financial Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={requestData.fy_id}
                    onChange={(e) => setRequestData({ ...requestData, fy_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Financial Year</option>
                    {financialYears.map((fy) => (
                      <option key={fy.id} value={fy.id}>{fy.year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={requestData.remarks}
                    onChange={(e) => setRequestData({ ...requestData, remarks: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                    placeholder="Any additional instructions for the client..."
                    rows="3"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="btn-primary flex items-center"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4 mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Send Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default ClientDocuments