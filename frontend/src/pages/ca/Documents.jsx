// // src/pages/ca/Documents.jsx
// import React, { useState, useEffect } from 'react'
// import { useNavigate } from 'react-router-dom'
// import axios from 'axios'
// import DashboardLayout from '../../components/common/Layout/DashboardLayout'
// import {
//   FileText, Upload, X, Loader2, CheckCircle, Clock, AlertCircle,
//   Eye, EyeOff, Download, ExternalLink, Link as LinkIcon,
//   Send, Filter, Search, ChevronDown, ChevronUp,
//   Calendar, User, Building, FolderOpen, FileCheck,
//   ThumbsUp, ThumbsDown, MoreVertical, Edit, Printer,
//   DollarSign, Receipt, Check, ArrowRight, Sparkles,
//   Plus, Trash2, RefreshCw, List, Grid, Info,
//   File, Folder, Image, Music, Film, Archive, 
//   FileArchive, FileCode, FileSpreadsheet, 
//   FileVideo, FileAudio, FileImage, FileJson,
//   Inbox
// } from 'lucide-react'
// import { documentApi } from '../../api/document.api'
// import { submissionApi } from '../../api/submission.api'
// import { billApi } from '../../api/bill.api'
// import safeToast from '../../utils/toast'

// import ViewDocumentModal from '../../components/common/Modals/ViewDocumentModal'

// const CADocuments = () => {
//   const navigate = useNavigate()
//   const [isLoading, setIsLoading] = useState(true)
//   const [submissions, setSubmissions] = useState([])
//   const [documents, setDocuments] = useState([])
//   const [selectedDocument, setSelectedDocument] = useState(null)
//   const [showDocumentModal, setShowDocumentModal] = useState(false)
//   const [activeTab, setActiveTab] = useState('received')
//   const [searchTerm, setSearchTerm] = useState('')
//   const [filterStatus, setFilterStatus] = useState('all')
//   const [showUploadModal, setShowUploadModal] = useState(false)
//   const [uploading, setUploading] = useState(false)
//   const [selectedFiles, setSelectedFiles] = useState([])
//   const [selectedClient, setSelectedClient] = useState('')
//   const [clients, setClients] = useState([])
//   const [viewMode, setViewMode] = useState('list')

//   useEffect(() => {
//     fetchData()
//     fetchClients()
//   }, [])

//   const fetchData = async () => {
//     setIsLoading(true)
//     try {
//       const submissionsData = await submissionApi.getSubmissions()
//       setSubmissions(submissionsData)
//     } catch (error) {
//       console.error('Error fetching data:', error)
//       safeToast.error('Failed to load documents')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const fetchClients = async () => {
//     try {
//       const token = localStorage.getItem('access_token')
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
//       const response = await axios.get(`${API_URL}/clients`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       })
//       setClients(response.data || [])
//     } catch (error) {
//       console.error('Error fetching clients:', error)
//     }
//   }

//   const getStatusBadge = (status) => {
//     const statusMap = {
//       'PENDING': { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
//       'REVIEWING': { label: 'Reviewing', color: 'bg-blue-100 text-blue-700 border-blue-200' },
//       'APPROVED': { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200' },
//       'REJECTED': { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
//       'BILL_GENERATED': { label: 'Bill Generated', color: 'bg-purple-100 text-purple-700 border-purple-200' },
//       'BILL_SENT': { label: 'Bill Sent', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
//       'BILL_CONFIRMED': { label: 'Bill Confirmed', color: 'bg-green-100 text-green-700 border-green-200' },
//       'CONFIRMED': { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
//     }
//     const config = statusMap[status] || statusMap['PENDING']
//     return <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>{config.label}</span>
//   }

//   const handleViewDocument = (document) => {
//     setSelectedDocument(document)
//     setShowDocumentModal(true)
//   }

//   const handleUploadComputation = async (submissionId) => {
//     const fileInput = document.createElement('input')
//     fileInput.type = 'file'
//     fileInput.accept = '.pdf,.doc,.docx,.xlsx,.xls,.jpg,.png'
//     fileInput.onchange = async (e) => {
//       const file = e.target.files[0]
//       if (!file) return
      
//       const link = prompt('Enter OneDrive share link:')
//       if (link) {
//         try {
//           await submissionApi.uploadComputation(submissionId, link, file.name)
//           safeToast.success('Computation uploaded successfully')
//           fetchData()
//         } catch (error) {
//           safeToast.error('Failed to upload computation')
//         }
//       }
//     }
//     fileInput.click()
//   }

//   const handleGenerateBill = async (submissionId) => {
//     try {
//       const result = await submissionApi.generateBill(submissionId)
//       safeToast.success(`Bill generated: ${result.bill_number}`)
//       fetchData()
//     } catch (error) {
//       safeToast.error('Failed to generate bill')
//     }
//   }

//   const handleSendBill = async (submissionId) => {
//     try {
//       await submissionApi.sendBillToClient(submissionId)
//       safeToast.success('Bill sent to client')
//       fetchData()
//     } catch (error) {
//       safeToast.error('Failed to send bill')
//     }
//   }

//   const filteredSubmissions = submissions.filter(sub => {
//     const matchesSearch = sub.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       sub.bill_number?.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesStatus = filterStatus === 'all' || sub.status === filterStatus
//     return matchesSearch && matchesStatus
//   })

//   if (isLoading) {
//     return (
//       <DashboardLayout title="Documents" subtitle="Loading...">
//         <div className="flex items-center justify-center h-64">
//           <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
//         </div>
//       </DashboardLayout>
//     )
//   }

//   return (
//     <DashboardLayout 
//       title="Document Management" 
//       subtitle="Manage client documents and submissions"
//     >
//       {/* Stats Cards */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//         <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
//           <p className="text-xs text-gray-500">Total Submissions</p>
//           <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
//         </div>
//         <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
//           <p className="text-xs text-gray-500">Pending Review</p>
//           <p className="text-2xl font-bold text-yellow-600">
//             {submissions.filter(s => s.status === 'PENDING' || s.status === 'REVIEWING').length}
//           </p>
//         </div>
//         <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
//           <p className="text-xs text-gray-500">Bills Generated</p>
//           <p className="text-2xl font-bold text-purple-600">
//             {submissions.filter(s => s.status === 'BILL_GENERATED' || s.status === 'BILL_SENT').length}
//           </p>
//         </div>
//         <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
//           <p className="text-xs text-gray-500">Confirmed</p>
//           <p className="text-2xl font-bold text-green-600">
//             {submissions.filter(s => s.status === 'BILL_CONFIRMED' || s.status === 'CONFIRMED').length}
//           </p>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="flex items-center justify-between mb-4 border-b border-gray-200">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => setActiveTab('received')}
//             className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
//               activeTab === 'received'
//                 ? 'border-primary-500 text-primary-600'
//                 : 'border-transparent text-gray-500 hover:text-gray-700'
//             }`}
//           >
//             Received from Clients
//             <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
//               {submissions.length}
//             </span>
//           </button>
//           <button
//             onClick={() => setActiveTab('uploaded')}
//             className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
//               activeTab === 'uploaded'
//                 ? 'border-primary-500 text-primary-600'
//                 : 'border-transparent text-gray-500 hover:text-gray-700'
//             }`}
//           >
//             Uploaded to Clients
//             <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
//               {documents.filter(d => d.source === 'ca').length}
//             </span>
//           </button>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
//             className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
//           >
//             {viewMode === 'list' ? <Grid size={18} /> : <List size={18} />}
//           </button>
//           <button
//             onClick={() => setShowUploadModal(true)}
//             className="btn-primary flex items-center text-sm px-3 py-1.5"
//           >
//             <Upload className="w-4 h-4 mr-1.5" />
//             Upload Document
//           </button>
//         </div>
//       </div>

//       {/* Search & Filter */}
//       <div className="flex items-center gap-4 mb-6">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//           <input
//             type="text"
//             placeholder="Search by client or document..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
//           />
//         </div>
//         <select
//           value={filterStatus}
//           onChange={(e) => setFilterStatus(e.target.value)}
//           className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
//         >
//           <option value="all">All Status</option>
//           <option value="PENDING">Pending</option>
//           <option value="REVIEWING">Reviewing</option>
//           <option value="APPROVED">Approved</option>
//           <option value="REJECTED">Rejected</option>
//           <option value="BILL_GENERATED">Bill Generated</option>
//           <option value="BILL_SENT">Bill Sent</option>
//           <option value="BILL_CONFIRMED">Bill Confirmed</option>
//           <option value="CONFIRMED">Confirmed</option>
//         </select>
//         <button
//           onClick={fetchData}
//           className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//         >
//           <RefreshCw size={18} />
//         </button>
//       </div>

//       {/* Submissions List */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//         {filteredSubmissions.length === 0 ? (
//           <div className="text-center py-12">
//             <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
//             <p className="text-sm text-gray-500">Client submissions will appear here once they upload documents.</p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b border-gray-200 bg-gray-50">
//                   <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Submission</th>
//                   <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
//                   <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
//                   <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                   <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Bill</th>
//                   <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                   <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-100">
//                 {filteredSubmissions.map((submission) => (
//                   <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
//                     <td className="py-3 px-4">
//                       <div className="flex items-center gap-2">
//                         <FileText className="w-4 h-4 text-primary-500" />
//                         <span className="text-sm font-medium">#{submission.id}</span>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <div>
//                         <p className="text-sm font-medium text-gray-900">{submission.client_name}</p>
//                         <p className="text-xs text-gray-500">{submission.client_email}</p>
//                       </div>
//                     </td>
//                     <td className="py-3 px-4">
//                       <span className="text-sm text-gray-600">{submission.document_count || 0} files</span>
//                     </td>
//                     <td className="py-3 px-4">{getStatusBadge(submission.status)}</td>
//                     <td className="py-3 px-4">
//                       <span className="text-sm font-semibold text-gray-900">
//                         ₹{parseFloat(submission.total_estimate || 0).toFixed(0)}
//                       </span>
//                     </td>
//                     <td className="py-3 px-4 text-sm text-gray-500">
//                       {new Date(submission.created_at).toLocaleDateString()}
//                     </td>
//                     <td className="py-3 px-4">
//                       <div className="flex items-center justify-end gap-1">
//                         <button
//                           onClick={() => navigate(`/ca/submissions/${submission.id}`)}
//                           className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                           title="View Details"
//                         >
//                           <Eye size={16} />
//                         </button>
//                         {submission.status === 'PENDING' && (
//                           <button
//                             onClick={() => handleUploadComputation(submission.id)}
//                             className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//                             title="Upload Computation"
//                           >
//                             <Upload size={16} />
//                           </button>
//                         )}
//                         {(submission.status === 'REVIEWING' || submission.status === 'PENDING') && (
//                           <button
//                             onClick={() => handleGenerateBill(submission.id)}
//                             className="p-1.5 text-purple-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
//                             title="Generate Bill"
//                           >
//                             <DollarSign size={16} />
//                           </button>
//                         )}
//                         {submission.status === 'BILL_GENERATED' && (
//                           <button
//                             onClick={() => handleSendBill(submission.id)}
//                             className="p-1.5 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
//                             title="Send Bill to Client"
//                           >
//                             <Send size={16} />
//                           </button>
//                         )}
//                         {submission.bill_id && (
//                           <button
//                             onClick={() => navigate(`/ca/invoices/${submission.bill_id}`)}
//                             className="p-1.5 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                             title="View Bill"
//                           >
//                             <Receipt size={16} />
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* View Document Modal */}
//       <ViewDocumentModal
//         isOpen={showDocumentModal}
//         onClose={() => {
//           setShowDocumentModal(false)
//           setSelectedDocument(null)
//         }}
//         document={selectedDocument}
//       />
//     </DashboardLayout>
//   )
// }

// export default CADocuments






// src/pages/ca/Documents.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import DashboardLayout from '../../components/common/Layout/DashboardLayout.jsx'
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
  Inbox, Cloud, FolderTree, Users, ChevronRight as ChevronRightIcon,
  HardDrive, Database, Server, FolderPlus, UploadCloud
} from 'lucide-react'
import safeToast from '../../utils/toast'

const CADocuments = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientFiles, setClientFiles] = useState([])
  const [folderPath, setFolderPath] = useState('')
  const [onedriveStatus, setOnedriveStatus] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('list')
  const [uploadProgress, setUploadProgress] = useState({})
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchClients()
    checkOneDriveStatus()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      fetchClientFiles(selectedClient.id)
    } else {
      setClientFiles([])
      setFolderPath('')
    }
  }, [selectedClient])

  const fetchClients = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      const response = await axios.get(`${API_URL}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setClients(response.data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      safeToast.error('Failed to load clients')
    } finally {
      setIsLoading(false)
    }
  }

  const checkOneDriveStatus = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      const response = await axios.get(`${API_URL}/onedrive/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setOnedriveStatus(response.data)
    } catch (error) {
      console.log('OneDrive not connected')
      setOnedriveStatus({ connected: false })
    }
  }

  const fetchClientFiles = async (clientId) => {
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      const response = await axios.get(`${API_URL}/onedrive/client-folder/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.data.success) {
        setClientFiles(response.data.files || [])
        setFolderPath(response.data.folder_path || '')
      } else {
        setClientFiles([])
        setFolderPath('')
        if (response.data.error) {
          console.log('Folder not found:', response.data.error)
        }
      }
    } catch (error) {
      console.error('Error fetching client files:', error)
      setClientFiles([])
      setFolderPath('')
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(prev => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    setSelectedFiles(prev => [...prev, ...files])
  }

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUploadToClient = async () => {
    if (!selectedClient) {
      safeToast.warning('Please select a client first')
      return
    }

    if (selectedFiles.length === 0) {
      safeToast.warning('Please select files to upload')
      return
    }

    if (!onedriveStatus?.connected) {
      safeToast.warning('Please connect OneDrive first')
      return
    }

    setUploading(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      let successCount = 0
      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('client_id', selectedClient.id)
        
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 'uploading'
        }))
        
        const response = await axios.post(
          `${API_URL}/onedrive/upload-to-client`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: percentCompleted
              }))
            }
          }
        )
        
        if (response.data.success) {
          successCount++
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 'complete'
          }))
        } else {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 'error'
          }))
        }
      }
      
      if (successCount === selectedFiles.length) {
        safeToast.success(`✅ ${successCount} document(s) uploaded successfully!`)
      } else {
        safeToast.warning(`Uploaded ${successCount} of ${selectedFiles.length} documents`)
      }
      
      await fetchClientFiles(selectedClient.id)
      setSelectedFiles([])
      setUploadProgress({})
      setShowUploadModal(false)
      
    } catch (error) {
      console.error('Error uploading documents:', error)
      safeToast.error('Failed to upload documents')
    } finally {
      setUploading(false)
    }
  }

  const handleConnectOneDrive = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    window.open(`${API_URL}/onedrive/login`, '_blank')
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (fileName) => {
    if (!fileName) return <File className="w-4 h-4 text-gray-500" />
    const ext = fileName.split('.').pop().toLowerCase()
    switch (ext) {
      case 'pdf': return <FileText className="w-4 h-4 text-red-500" />
      case 'xlsx':
      case 'xls':
      case 'csv': return <FileSpreadsheet className="w-4 h-4 text-green-500" />
      case 'doc':
      case 'docx': return <FileText className="w-4 h-4 text-blue-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp': return <FileImage className="w-4 h-4 text-purple-500" />
      case 'mp4':
      case 'avi':
      case 'mov': return <FileVideo className="w-4 h-4 text-pink-500" />
      case 'mp3':
      case 'wav': return <FileAudio className="w-4 h-4 text-yellow-500" />
      case 'zip':
      case 'rar':
      case '7z': return <FileArchive className="w-4 h-4 text-orange-500" />
      default: return <File className="w-4 h-4 text-gray-500" />
    }
  }

  const getFileTypeBadge = (fileName) => {
    if (!fileName) return null
    const ext = fileName.split('.').pop().toLowerCase()
    const types = {
      pdf: 'PDF',
      xlsx: 'Excel',
      xls: 'Excel',
      doc: 'Word',
      docx: 'Word',
      jpg: 'Image',
      jpeg: 'Image',
      png: 'Image',
      gif: 'Image',
      svg: 'Image',
      webp: 'Image',
      mp4: 'Video',
      avi: 'Video',
      mov: 'Video',
      mp3: 'Audio',
      wav: 'Audio',
      zip: 'Archive',
      rar: 'Archive',
      txt: 'Text'
    }
    return types[ext] || ext.toUpperCase()
  }

  const getStatusColor = (status) => {
    const colors = {
      'uploading': 'text-yellow-500',
      'complete': 'text-green-500',
      'error': 'text-red-500'
    }
    return colors[status] || 'text-gray-500'
  }

  const filteredFiles = clientFiles.filter(file => 
    file.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <DashboardLayout title="Documents" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
          <span className="ml-2 text-gray-500">Loading clients...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="Client Documents" 
      subtitle="Manage client documents stored in OneDrive"
    >
      {/* OneDrive Status Banner */}
      {onedriveStatus && !onedriveStatus.connected ? (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-800">OneDrive not connected. Please connect to upload and view documents.</span>
          </div>
          <button
            onClick={handleConnectOneDrive}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg text-sm"
          >
            Connect OneDrive
          </button>
        </div>
      ) : onedriveStatus?.connected ? (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-700">OneDrive connected</span>
          {onedriveStatus.token_expires_in > 0 && (
            <span className="text-xs text-green-600 ml-auto">
              Token expires in {Math.floor(onedriveStatus.token_expires_in / 60)} min
            </span>
          )}
        </div>
      ) : null}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Total Clients</p>
          <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Documents in OneDrive</p>
          <p className="text-2xl font-bold text-blue-600">{clientFiles.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Selected Client</p>
          <p className="text-2xl font-bold text-gray-900 truncate">
            {selectedClient ? selectedClient.name : '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">OneDrive Status</p>
          <p className="text-2xl font-bold text-green-600">
            {onedriveStatus?.connected ? '✅ Connected' : '❌ Disconnected'}
          </p>
        </div>
      </div>

      {/* Client Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Client
            </label>
            <select
              value={selectedClient?.id || ''}
              onChange={(e) => {
                const client = clients.find(c => c.id === parseInt(e.target.value))
                setSelectedClient(client || null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">Choose a client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          </div>
          
          {selectedClient && (
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-primary-50 rounded-lg border border-primary-200">
                <span className="text-xs text-primary-700 font-medium">
                  {clientFiles.length} files
                </span>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn-primary flex items-center text-sm px-4 py-2"
                disabled={!onedriveStatus?.connected}
              >
                <Upload className="w-4 h-4 mr-1.5" />
                Upload Files
              </button>
              <button
                onClick={() => fetchClientFiles(selectedClient.id)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          )}
        </div>
        
        {selectedClient && folderPath && (
          <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <Folder className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-mono text-gray-600 truncate">{folderPath}</span>
            </p>
          </div>
        )}
      </div>

      {/* Client Documents */}
      {selectedClient ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header with Search */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-4 h-4 text-primary-500" />
              <span className="font-medium text-gray-900">
                {selectedClient.name}'s Documents
              </span>
              <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                {clientFiles.length} files
              </span>
            </div>
            <div className="flex items-center gap-2">
              {clientFiles.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {viewMode === 'list' ? <Grid size={16} /> : <List size={16} />}
              </button>
            </div>
          </div>
          
          {/* Files List */}
          {clientFiles.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {onedriveStatus?.connected 
                  ? `No documents found in ${selectedClient.name}'s OneDrive folder. Upload files to get started.`
                  : 'Connect OneDrive to view and upload documents.'}
              </p>
              {onedriveStatus?.connected && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 btn-primary text-sm px-4 py-2 inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Files
                </button>
              )}
            </div>
          ) : viewMode === 'list' ? (
            // List View
            <div className="divide-y divide-gray-100">
              {filteredFiles.map((file, index) => (
                <div key={index} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                        {getFileIcon(file.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900 truncate">{file.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {getFileTypeBadge(file.name)}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                          {file.lastModifiedDateTime && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(file.lastModifiedDateTime).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                      {file.webUrl && (
                        <a
                          href={file.webUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Open in OneDrive"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                      {file['@microsoft.graph.downloadUrl'] && (
                        <a
                          href={file['@microsoft.graph.downloadUrl']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Grid View
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
              {filteredFiles.map((file, index) => (
                <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow text-center">
                  <div className="flex justify-center mb-2">
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      {getFileIcon(file.name)}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                  <div className="flex justify-center gap-1 mt-2">
                    {file.webUrl && (
                      <a
                        href={file.webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Open in OneDrive"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {file['@microsoft.graph.downloadUrl'] && (
                      <a
                        href={file['@microsoft.graph.downloadUrl']}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Download"
                      >
                        <Download size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Select a client</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Choose a client from the dropdown above to view their OneDrive documents.
          </p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Upload Files</h2>
                <p className="text-sm text-gray-500">
                  Upload to {selectedClient.name}'s OneDrive folder
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedFiles([])
                  setUploadProgress({})
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Client Info */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedClient.name}</p>
                    <p className="text-sm text-gray-500">{selectedClient.email}</p>
                  </div>
                </div>
              </div>

              {/* OneDrive Status */}
              <div className={`p-3 rounded-lg border ${onedriveStatus?.connected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center gap-2">
                  <Cloud className={`w-4 h-4 ${onedriveStatus?.connected ? 'text-green-600' : 'text-yellow-600'}`} />
                  <span className={`text-sm ${onedriveStatus?.connected ? 'text-green-700' : 'text-yellow-700'}`}>
                    {onedriveStatus?.connected ? '✅ OneDrive connected' : '⚠️ OneDrive not connected'}
                  </span>
                </div>
                {folderPath && (
                  <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                    📁 {folderPath}
                  </p>
                )}
              </div>

              {/* Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <UploadCloud className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600">
                  Drag & drop files here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF, Excel, Word, Images supported
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 btn-outline text-sm px-4 py-2 inline-flex items-center gap-2"
                  disabled={!selectedClient || !onedriveStatus?.connected}
                >
                  <Plus className="w-4 h-4" />
                  Add Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                />
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {selectedFiles.map((file, index) => {
                      const progress = uploadProgress[file.name]
                      const isComplete = progress === 'complete'
                      const isError = progress === 'error'
                      const isUploading = progress === 'uploading' || (typeof progress === 'number' && progress < 100)
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {getFileIcon(file.name)}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isComplete && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {isError && <AlertCircle className="w-4 h-4 text-red-500" />}
                            {isUploading && (
                              <div className="flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin text-primary-500" />
                                <span className="text-xs text-gray-500">
                                  {typeof progress === 'number' ? `${progress}%` : 'Uploading...'}
                                </span>
                              </div>
                            )}
                            {!progress && (
                              <button
                                onClick={() => handleRemoveFile(index)}
                                className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedFiles([])
                  setUploadProgress({})
                }}
                className="btn-outline text-sm px-4 py-2"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUploadToClient}
                disabled={uploading || selectedFiles.length === 0 || !selectedClient || !onedriveStatus?.connected}
                className="btn-primary text-sm px-6 py-2 flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    Upload to OneDrive
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default CADocuments