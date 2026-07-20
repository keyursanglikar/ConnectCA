// // src/pages/client/Documents.jsx
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

// const ClientDocuments = () => {
//   const navigate = useNavigate()
//   const [isLoading, setIsLoading] = useState(true)
//   const [submissions, setSubmissions] = useState([])
//   const [documents, setDocuments] = useState([])
//   const [selectedDocument, setSelectedDocument] = useState(null)
//   const [showDocumentModal, setShowDocumentModal] = useState(false)
//   const [activeTab, setActiveTab] = useState('uploaded')
//   const [searchTerm, setSearchTerm] = useState('')
//   const [filterStatus, setFilterStatus] = useState('all')
//   const [uploading, setUploading] = useState(false)
//   const [selectedFiles, setSelectedFiles] = useState([])
//   const [viewMode, setViewMode] = useState('list')
//   const [estimatedBill, setEstimatedBill] = useState(null)
//   const [showBillModal, setShowBillModal] = useState(false)
//   const [selectedSubmission, setSelectedSubmission] = useState(null)

//   useEffect(() => {
//     fetchData()
//   }, [])

//   const fetchData = async () => {
//     setIsLoading(true)
//     try {
//       const token = localStorage.getItem('access_token')
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
//       const docsRes = await axios.get(`${API_URL}/client/documents`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       })
//       setDocuments(docsRes.data || [])
      
//       const submissionsRes = await axios.get(`${API_URL}/client/submissions`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       })
//       setSubmissions(submissionsRes.data || [])
      
//     } catch (error) {
//       console.error('Error fetching data:', error)
//       safeToast.error('Failed to load documents')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleUpload = async (e) => {
//     const files = Array.from(e.target.files)
//     if (files.length === 0) return
    
//     setUploading(true)
//     try {
//       const token = localStorage.getItem('access_token')
//       const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
//       for (const file of files) {
//         const formData = new FormData()
//         formData.append('file', file)
//         formData.append('document_type', file.name.split('.').pop().toUpperCase())
//         formData.append('file_title', file.name)
        
//         await axios.post(`${API_URL}/client/upload-document`, formData, {
//           headers: { 
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'multipart/form-data'
//           }
//         })
//       }
      
//       safeToast.success(`${files.length} document(s) uploaded successfully`)
//       fetchData()
//     } catch (error) {
//       console.error('Error uploading:', error)
//       safeToast.error('Failed to upload documents')
//     } finally {
//       setUploading(false)
//       setSelectedFiles([])
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

//   const handleViewBill = (submission) => {
//     setSelectedSubmission(submission)
//     setShowBillModal(true)
//   }

//   const handleConfirmBill = async (submissionId) => {
//     try {
//       await submissionApi.confirmBill(submissionId)
//       safeToast.success('Bill confirmed successfully')
//       fetchData()
//     } catch (error) {
//       safeToast.error('Failed to confirm bill')
//     }
//   }

//   const handleProceedFurther = async (submissionId) => {
//     try {
//       await submissionApi.proceedFurther(submissionId)
//       safeToast.success('Proceeded further successfully')
//       fetchData()
//     } catch (error) {
//       safeToast.error('Failed to proceed')
//     }
//   }

//   const filteredSubmissions = submissions.filter(sub => {
//     const matchesSearch = sub.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesStatus = filterStatus === 'all' || sub.status === filterStatus
//     return matchesSearch && matchesStatus
//   })

//   if (isLoading) {
//     return (
//       <DashboardLayout title="My Documents" subtitle="Loading...">
//         <div className="flex items-center justify-center h-64">
//           <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
//         </div>
//       </DashboardLayout>
//     )
//   }

//   return (
//     <DashboardLayout 
//       title="My Documents" 
//       subtitle="Upload and manage your documents"
//     >
//       {/* Stats Cards */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//         <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
//           <p className="text-xs text-gray-500">Total Documents</p>
//           <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
//         </div>
//         <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
//           <p className="text-xs text-gray-500">Submissions</p>
//           <p className="text-2xl font-bold text-blue-600">{submissions.length}</p>
//         </div>
//         <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
//           <p className="text-xs text-gray-500">Pending Review</p>
//           <p className="text-2xl font-bold text-yellow-600">
//             {submissions.filter(s => s.status === 'PENDING' || s.status === 'REVIEWING').length}
//           </p>
//         </div>
//         <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
//           <p className="text-xs text-gray-500">Confirmed</p>
//           <p className="text-2xl font-bold text-green-600">
//             {submissions.filter(s => s.status === 'CONFIRMED' || s.status === 'BILL_CONFIRMED').length}
//           </p>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="flex items-center justify-between mb-4 border-b border-gray-200">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => setActiveTab('uploaded')}
//             className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
//               activeTab === 'uploaded'
//                 ? 'border-primary-500 text-primary-600'
//                 : 'border-transparent text-gray-500 hover:text-gray-700'
//             }`}
//           >
//             Uploaded by Me
//             <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
//               {documents.filter(d => d.source === 'client').length}
//             </span>
//           </button>
//           <button
//             onClick={() => setActiveTab('ca_uploaded')}
//             className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
//               activeTab === 'ca_uploaded'
//                 ? 'border-primary-500 text-primary-600'
//                 : 'border-transparent text-gray-500 hover:text-gray-700'
//             }`}
//           >
//             Uploaded by CA
//             <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
//               {documents.filter(d => d.source === 'ca').length}
//             </span>
//           </button>
//           <button
//             onClick={() => setActiveTab('submissions')}
//             className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
//               activeTab === 'submissions'
//                 ? 'border-primary-500 text-primary-600'
//                 : 'border-transparent text-gray-500 hover:text-gray-700'
//             }`}
//           >
//             Submissions & Bills
//             <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
//               {submissions.length}
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
//           <label className="btn-primary flex items-center text-sm px-3 py-1.5 cursor-pointer">
//             <Upload className="w-4 h-4 mr-1.5" />
//             Upload Document
//             <input
//               type="file"
//               multiple
//               className="hidden"
//               onChange={handleUpload}
//               disabled={uploading}
//             />
//           </label>
//         </div>
//       </div>

//       {/* Search & Filter */}
//       <div className="flex items-center gap-4 mb-6">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//           <input
//             type="text"
//             placeholder="Search documents..."
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
//           <option value="APPROVED">Approved</option>
//           <option value="REJECTED">Rejected</option>
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

//       {/* Submissions & Bills Section */}
//       {activeTab === 'submissions' && (
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//           {filteredSubmissions.length === 0 ? (
//             <div className="text-center py-12">
//               <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
//               <p className="text-sm text-gray-500">Upload documents to create a submission.</p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-gray-200 bg-gray-50">
//                     <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Submission</th>
//                     <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
//                     <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                     <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Bill</th>
//                     <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                     <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100">
//                   {filteredSubmissions.map((submission) => (
//                     <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
//                       <td className="py-3 px-4">
//                         <div className="flex items-center gap-2">
//                           <FileText className="w-4 h-4 text-primary-500" />
//                           <span className="text-sm font-medium">#{submission.id}</span>
//                         </div>
//                       </td>
//                       <td className="py-3 px-4">
//                         <span className="text-sm text-gray-600">{submission.document_count || 0} files</span>
//                       </td>
//                       <td className="py-3 px-4">{getStatusBadge(submission.status)}</td>
//                       <td className="py-3 px-4">
//                         <span className="text-sm font-semibold text-gray-900">
//                           ₹{parseFloat(submission.total_estimate || 0).toFixed(0)}
//                         </span>
//                       </td>
//                       <td className="py-3 px-4 text-sm text-gray-500">
//                         {new Date(submission.created_at).toLocaleDateString()}
//                       </td>
//                       <td className="py-3 px-4">
//                         <div className="flex items-center justify-end gap-1">
//                           <button
//                             onClick={() => handleViewDocument(submission)}
//                             className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                             title="View Details"
//                           >
//                             <Eye size={16} />
//                           </button>
//                           {submission.status === 'BILL_SENT' && (
//                             <>
//                               <button
//                                 onClick={() => handleViewBill(submission)}
//                                 className="p-1.5 text-purple-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
//                                 title="View Bill"
//                               >
//                                 <Receipt size={16} />
//                               </button>
//                               <button
//                                 onClick={() => handleConfirmBill(submission.id)}
//                                 className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//                                 title="Confirm Bill"
//                               >
//                                 <Check size={16} />
//                               </button>
//                             </>
//                           )}
//                           {submission.status === 'BILL_CONFIRMED' && (
//                             <button
//                               onClick={() => handleProceedFurther(submission.id)}
//                               className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
//                               title="Proceed Further"
//                             >
//                               <ArrowRight size={16} />
//                             </button>
//                           )}
//                           {submission.status === 'CONFIRMED' && (
//                             <span className="text-xs text-green-600 font-medium flex items-center gap-1">
//                               <CheckCircle size={14} />
//                               Confirmed
//                             </span>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Documents List - Uploaded by Client */}
//       {(activeTab === 'uploaded' || activeTab === 'ca_uploaded') && (
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//           {documents.filter(d => activeTab === 'uploaded' ? d.source === 'client' : d.source === 'ca').length === 0 ? (
//             <div className="text-center py-12">
//               <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
//               <p className="text-sm text-gray-500">
//                 {activeTab === 'uploaded' 
//                   ? 'Upload your documents to get started.' 
//                   : 'CA has not uploaded any documents yet.'}
//               </p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-gray-200 bg-gray-50">
//                     <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
//                     <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
//                     <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                     <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
//                     <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100">
//                   {documents
//                     .filter(d => activeTab === 'uploaded' ? d.source === 'client' : d.source === 'ca')
//                     .map((doc) => (
//                       <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
//                         <td className="py-3 px-4">
//                           <div className="flex items-center gap-2">
//                             <FileText className="w-4 h-4 text-primary-500" />
//                             <span className="text-sm font-medium">{doc.file_title}</span>
//                           </div>
//                         </td>
//                         <td className="py-3 px-4 text-sm text-gray-500">{doc.document_type}</td>
//                         <td className="py-3 px-4">{getStatusBadge(doc.status)}</td>
//                         <td className="py-3 px-4 text-sm text-gray-500">
//                           {new Date(doc.uploaded_at).toLocaleDateString()}
//                         </td>
//                         <td className="py-3 px-4">
//                           <div className="flex items-center justify-end gap-1">
//                             <button
//                               onClick={() => handleViewDocument(doc)}
//                               className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                               title="View Document"
//                             >
//                               <Eye size={16} />
//                             </button>
//                             {doc.onedrive_link && (
//                               <a
//                                 href={doc.onedrive_link}
//                                 target="_blank"
//                                 rel="noopener noreferrer"
//                                 className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//                                 title="Open in OneDrive"
//                               >
//                                 <ExternalLink size={16} />
//                               </a>
//                             )}
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       )}

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

// export default ClientDocuments









// src/pages/client/Documents.jsx
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
  Inbox, Cloud
} from 'lucide-react'
import { documentApi } from '../../api/document.api'
import { submissionApi } from '../../api/submission.api'
import { billApi } from '../../api/bill.api'
import safeToast from '../../utils/toast'
import ViewDocumentModal from '../../components/common/Modals/ViewDocumentModal'

const ClientDocuments = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [submissions, setSubmissions] = useState([])
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [activeTab, setActiveTab] = useState('uploaded')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [viewMode, setViewMode] = useState('list')
  const [estimatedBill, setEstimatedBill] = useState(null)
  const [showBillModal, setShowBillModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [onedriveFiles, setOnedriveFiles] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      const docsRes = await axios.get(`${API_URL}/client/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setDocuments(docsRes.data || [])
      
      const submissionsRes = await axios.get(`${API_URL}/client/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setSubmissions(submissionsRes.data || [])
      
    } catch (error) {
      console.error('Error fetching data:', error)
      safeToast.error('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    setUploading(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('document_type', file.name.split('.').pop().toUpperCase())
        formData.append('file_title', file.name)
        
        await axios.post(`${API_URL}/client/upload-document`, formData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
      }
      
      safeToast.success(`${files.length} document(s) uploaded successfully`)
      fetchData()
    } catch (error) {
      console.error('Error uploading:', error)
      safeToast.error('Failed to upload documents')
    } finally {
      setUploading(false)
      setSelectedFiles([])
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

  const getFileIcon = (fileName) => {
    if (!fileName) return <File className="w-4 h-4 text-gray-500" />
    const ext = fileName.split('.').pop().toLowerCase()
    if (['pdf'].includes(ext)) return <FileText className="w-4 h-4 text-red-500" />
    if (['xlsx', 'xls', 'csv'].includes(ext)) return <FileSpreadsheet className="w-4 h-4 text-green-500" />
    if (['doc', 'docx'].includes(ext)) return <FileText className="w-4 h-4 text-blue-500" />
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return <Image className="w-4 h-4 text-purple-500" />
    if (['mp4', 'avi', 'mov'].includes(ext)) return <FileVideo className="w-4 h-4 text-pink-500" />
    if (['mp3', 'wav'].includes(ext)) return <FileAudio className="w-4 h-4 text-yellow-500" />
    if (['zip', 'rar', '7z'].includes(ext)) return <FileArchive className="w-4 h-4 text-orange-500" />
    return <File className="w-4 h-4 text-gray-500" />
  }

  const handleViewDocument = (document) => {
    setSelectedDocument(document)
    setShowDocumentModal(true)
  }

  const handleViewBill = (submission) => {
    setSelectedSubmission(submission)
    setShowBillModal(true)
  }

  const handleViewComputationBill = (submissionId) => {
    navigate(`/client/submissions/${submissionId}/computation-bill`)
  }

  const handleConfirmBill = async (submissionId) => {
    try {
      await submissionApi.confirmBill(submissionId)
      safeToast.success('Bill confirmed successfully')
      fetchData()
    } catch (error) {
      safeToast.error('Failed to confirm bill')
    }
  }

  const handleProceedFurther = async (submissionId) => {
    try {
      await submissionApi.proceedFurther(submissionId)
      safeToast.success('Proceeded further successfully')
      fetchData()
    } catch (error) {
      safeToast.error('Failed to proceed')
    }
  }

  const handleUploadToCA = async (submissionId) => {
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      await axios.post(`${API_URL}/client/submissions/${submissionId}/submit`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      safeToast.success('Documents submitted to CA successfully')
      fetchData()
    } catch (error) {
      safeToast.error('Failed to submit documents')
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.id?.toString().includes(searchTerm)
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_title?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'uploaded' ? doc.source === 'client' : doc.source === 'ca'
    return matchesSearch && matchesTab
  })

  if (isLoading) {
    return (
      <DashboardLayout title="My Documents" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="My Documents" 
      subtitle="Upload and manage your documents"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Total Documents</p>
          <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Submissions</p>
          <p className="text-2xl font-bold text-blue-600">{submissions.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600">
            {submissions.filter(s => s.status === 'PENDING' || s.status === 'REVIEWING').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Confirmed</p>
          <p className="text-2xl font-bold text-green-600">
            {submissions.filter(s => s.status === 'CONFIRMED' || s.status === 'BILL_CONFIRMED').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('uploaded')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'uploaded'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Uploaded by Me
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {documents.filter(d => d.source === 'client').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ca_uploaded')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ca_uploaded'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Uploaded by CA
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {documents.filter(d => d.source === 'ca').length}
            </span>
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
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {submissions.length}
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
          <label className="btn-primary flex items-center text-sm px-3 py-1.5 cursor-pointer">
            <Upload className="w-4 h-4 mr-1.5" />
            Upload Document
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search documents or submissions..."
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

      {/* Submissions & Bills Section */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-sm text-gray-500">Upload documents to create a submission.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Submission</th>
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
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {/* View Details */}
                          <button
                            onClick={() => handleViewDocument(submission)}
                            className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {/* ✅ View Computation Bill Button - Shows when bill exists */}
                          {submission.computation_bill_status && (
                            <button
                              onClick={() => handleViewComputationBill(submission.id)}
                              className="p-1.5 text-purple-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="View Computation Bill"
                            >
                              <Receipt size={16} />
                            </button>
                          )}
                          
                          {/* Bill Sent - Show View Bill and Confirm buttons */}
                          {submission.status === 'BILL_SENT' && (
                            <>
                              <button
                                onClick={() => handleViewBill(submission)}
                                className="p-1.5 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="View Bill"
                              >
                                <FileText size={16} />
                              </button>
                              <button
                                onClick={() => handleConfirmBill(submission.id)}
                                className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Confirm Bill"
                              >
                                <Check size={16} />
                              </button>
                            </>
                          )}
                          
                          {/* Bill Confirmed - Show Proceed Further button */}
                          {submission.status === 'BILL_CONFIRMED' && (
                            <button
                              onClick={() => handleProceedFurther(submission.id)}
                              className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Proceed Further"
                            >
                              <ArrowRight size={16} />
                            </button>
                          )}
                          
                          {/* Confirmed - Show status */}
                          {submission.status === 'CONFIRMED' && (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle size={14} />
                              Confirmed
                            </span>
                          )}
                          
                          {/* Submit to CA - For PENDING submissions */}
                          {submission.status === 'PENDING' && (
                            <button
                              onClick={() => handleUploadToCA(submission.id)}
                              className="p-1.5 text-primary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Submit to CA"
                            >
                              <Send size={16} />
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
      )}

      {/* Documents Section */}
      {(activeTab === 'uploaded' || activeTab === 'ca_uploaded') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-sm text-gray-500">
                {activeTab === 'uploaded' 
                  ? 'Upload your documents to get started.' 
                  : 'CA has not uploaded any documents yet.'}
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getFileIcon(doc.file_title)}
                          <span className="text-sm font-medium">{doc.file_title || 'Untitled'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">{doc.document_type || 'Unknown'}</td>
                      <td className="py-3 px-4">{getStatusBadge(doc.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Document"
                          >
                            <Eye size={16} />
                          </button>
                          {doc.onedrive_link && (
                            <a
                              href={doc.onedrive_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Open in OneDrive"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Grid View
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-white rounded-lg">
                      {getFileIcon(doc.file_title)}
                    </div>
                    {doc.status && getStatusBadge(doc.status)}
                  </div>
                  <p className="text-sm font-medium truncate">{doc.file_title || 'Untitled'}</p>
                  <p className="text-xs text-gray-500">{doc.document_type || 'Unknown'}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleViewDocument(doc)}
                      className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Document"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

export default ClientDocuments