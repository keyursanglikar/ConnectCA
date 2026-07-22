// frontend/src/pages/ca/SubmissionDetail.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../components/common/Layout/DashboardLayout'
import { 
  FileText, Eye, Clock, CheckCircle, XCircle, Loader2, ArrowLeft,
  Receipt, User, Mail, Calendar, DollarSign, Send, File, FolderOpen,
  ExternalLink, Upload as UploadIcon, FileCheck, RefreshCw, Cloud,
  Check, X, FileSpreadsheet, FileImage, FileVideo, FileAudio, FileArchive,
  Info, AlertCircle, PlusCircle, Download, Trash2, Share2, Folder,
  Database, Server, HardDrive, Link as LinkIcon, Copy, Check as CheckIcon
} from 'lucide-react'
import axiosInstance from '../../api/axios.config'
import safeToast from '../../utils/toast'
import { format } from 'date-fns'

const SubmissionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [submission, setSubmission] = useState(null)
  const [notes, setNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingToOneDrive, setIsUploadingToOneDrive] = useState(false)
  const [onedriveStatus, setOnedriveStatus] = useState(null)
  const [onedriveFiles, setOnedriveFiles] = useState([])
  const [hasComputationBill, setHasComputationBill] = useState(false)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

  // ✅ Handle OneDrive callback from popup
  useEffect(() => {
    const onedriveConnected = searchParams.get('onedrive_connected')
    const onedriveError = searchParams.get('onedrive_error')
    const email = searchParams.get('email')
    
    if (onedriveConnected === 'true') {
      safeToast.success('✅ OneDrive connected successfully!')
      window.history.replaceState({}, '', `/ca/submissions/${id}`)
      checkOneDriveStatus()
      fetchSubmission()
      if (window.opener) {
        window.opener.postMessage({ type: 'ONEDRIVE_CONNECTED' }, '*')
        setTimeout(() => window.close(), 1000)
      }
      setIsPopupOpen(false)
    }
    
    if (onedriveError) {
      let errorMessage = `❌ OneDrive connection failed: ${onedriveError}`
      if (email) {
        errorMessage += ` (Email: ${email})`
      }
      safeToast.error(errorMessage)
      window.history.replaceState({}, '', `/ca/submissions/${id}`)
      setIsPopupOpen(false)
    }
  }, [searchParams, id])

  useEffect(() => {
    fetchSubmission()
    checkOneDriveStatus()
  }, [id])

  const fetchSubmission = async () => {
    setIsLoading(true)
    try {
      const response = await axiosInstance.get(`/submissions/${id}`)
      setSubmission(response.data)
      
      if (response.data.computation_bill_status) {
        setHasComputationBill(true)
      }
      
      if (response.data.onedrive_upload_status === 'COMPLETED') {
        fetchOneDriveFiles()
      }
    } catch (error) {
      console.error('Error fetching submission:', error)
      safeToast.error('Failed to load submission details')
      navigate('/ca/submissions')
    } finally {
      setIsLoading(false)
    }
  }

  const checkOneDriveStatus = async () => {
    try {
      const response = await axiosInstance.get('/v1/onedrive/status')
      setOnedriveStatus(response.data)
    } catch (error) {
      console.log('OneDrive not connected')
      setOnedriveStatus({ connected: false })
    }
  }

  const fetchOneDriveFiles = async () => {
    try {
      const response = await axiosInstance.get(`/submissions/${id}/onedrive-files`)
      setOnedriveFiles(response.data.document_links || [])
    } catch (error) {
      console.error('Error fetching OneDrive files:', error)
    }
  }

  const handleConnectOneDrive = () => {
    const API_URL_V1 = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
    
    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2
    
    setIsPopupOpen(true)
    
    const popup = window.open(
      `${API_URL_V1}/onedrive/login`,
      'OneDrive Connect',
      `width=${width},height=${height},left=${left},top=${top}`
    )
    
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'ONEDRIVE_CONNECTED') {
        window.removeEventListener('message', handleMessage)
        setIsPopupOpen(false)
        safeToast.success('✅ OneDrive connected successfully!')
        checkOneDriveStatus()
        fetchSubmission()
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    const checkPopupClosed = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkPopupClosed)
        window.removeEventListener('message', handleMessage)
        setIsPopupOpen(false)
      }
    }, 500)
  }

  const handleUpdateStatus = async (newStatus) => {
    setIsUpdating(true)
    try {
      await axiosInstance.patch(
        `/submissions/${id}/status`,
        { status: newStatus, notes }
      )
      
      safeToast.success(`Status updated to ${newStatus}`)
      fetchSubmission()
    } catch (error) {
      console.error('Error updating status:', error)
      safeToast.error('Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUploadToOneDrive = async () => {
    setIsUploadingToOneDrive(true)
    try {
      // Check if OneDrive is connected
      try {
        const statusResponse = await axiosInstance.get('/v1/onedrive/status')
        
        if (!statusResponse.data.connected) {
          safeToast.info('Please connect OneDrive first')
          handleConnectOneDrive()
          setIsUploadingToOneDrive(false)
          return
        }
      } catch (statusError) {
        safeToast.info('Please connect OneDrive first')
        handleConnectOneDrive()
        setIsUploadingToOneDrive(false)
        return
      }
      
      const response = await axiosInstance.post(
        `/submissions/${id}/upload-to-onedrive`,
        {}
      )
      
      safeToast.success(`✅ Successfully uploaded to OneDrive! ${response.data.documents_count} files uploaded.`)
      
      await fetchSubmission()
      await fetchOneDriveFiles()
      
    } catch (error) {
      console.error('Error uploading to OneDrive:', error)
      
      if (error.response?.data?.detail?.includes('connect OneDrive')) {
        safeToast.info('Please connect OneDrive first')
        handleConnectOneDrive()
      } else {
        safeToast.error(error.response?.data?.detail || 'Failed to upload to OneDrive')
      }
    } finally {
      setIsUploadingToOneDrive(false)
    }
  }

  const handleCopyFolderPath = () => {
    if (submission?.onedrive_folder_path) {
      navigator.clipboard.writeText(submission.onedrive_folder_path)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      safeToast.success('Folder path copied to clipboard!')
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      'REVIEWING': { label: 'Reviewing', color: 'bg-blue-100 text-blue-700', icon: Eye },
      'APPROVED': { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      'REJECTED': { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
      'BILL_GENERATED': { label: 'Bill Generated', color: 'bg-purple-100 text-purple-700', icon: Receipt },
      'BILL_SENT': { label: 'Bill Sent', color: 'bg-indigo-100 text-indigo-700', icon: Send },
      'BILL_CONFIRMED': { label: 'Bill Confirmed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
      'CONFIRMED': { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle }
    }
    const config = statusMap[status] || statusMap['PENDING']
    const Icon = config.icon
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    )
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
      case 'mov':
      case 'wmv':
      case 'flv': return <FileVideo className="w-4 h-4 text-pink-500" />
      case 'mp3':
      case 'wav':
      case 'aac':
      case 'flac': return <FileAudio className="w-4 h-4 text-yellow-500" />
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz': return <FileArchive className="w-4 h-4 text-orange-500" />
      default: return <File className="w-4 h-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
        </div>
      </DashboardLayout>
    )
  }

  if (!submission) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-lg font-medium text-gray-500">Submission not found</p>
          <Link to="/ca/submissions" className="text-primary-500 hover:underline">
            Back to submissions
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const isUploadedToOneDrive = submission?.onedrive_upload_status === 'COMPLETED'
  const canUploadToOneDrive = submission?.status === 'BILL_CONFIRMED' || submission?.status === 'CONFIRMED'
  const hasOneDriveFolder = submission?.onedrive_folder_url || submission?.onedrive_folder_path

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/ca/submissions')}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Submissions
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Submission #{submission.id}</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <User className="w-4 h-4" />
              From: {submission.client_name} ({submission.client_email})
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {getStatusBadge(submission.status)}
            {isUploadedToOneDrive && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 inline-flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                OneDrive
              </span>
            )}
            <span className="text-xs text-gray-400">
              Created: {format(new Date(submission.created_at), 'dd MMM yyyy')}
            </span>
          </div>
        </div>

        {/* ✅ OneDrive Folder Info Banner */}
        {hasOneDriveFolder && isUploadedToOneDrive && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Folder className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">📁 OneDrive Folder</p>
                  <p className="text-xs text-blue-600 font-mono mt-0.5">
                    {submission.onedrive_folder_path || 'Client documents'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={handleCopyFolderPath}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {copied ? (
                        <CheckIcon className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {copied ? 'Copied!' : 'Copy path'}
                    </button>
                    <span className="text-blue-300">|</span>
                    <span className="text-xs text-blue-600">
                      {onedriveFiles.length} file{onedriveFiles.length !== 1 ? 's' : ''} uploaded
                    </span>
                  </div>
                </div>
              </div>
              {submission.onedrive_folder_url && (
                <a
                  href={submission.onedrive_folder_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors flex-shrink-0 ml-4"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in OneDrive
                </a>
              )}
            </div>
          </div>
        )}

        {/* OneDrive Status Banner */}
        {onedriveStatus && !onedriveStatus.connected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cloud className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">OneDrive not connected</p>
                <p className="text-xs text-yellow-600">Connect your OneDrive to upload files securely</p>
              </div>
            </div>
            <button
              onClick={handleConnectOneDrive}
              disabled={isPopupOpen}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm py-1.5 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
              {isPopupOpen ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  Connect OneDrive
                </>
              )}
            </button>
          </div>
        )}

        {/* Two Column Layout - LEFT: 5 columns, RIGHT: 7 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ============================================================ */}
          {/* LEFT SIDEBAR - 5 columns */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* 1. Estimated Bill Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary-500" />
                  Estimated Bill
                </h2>
                <span className="text-xs text-gray-400">Client's estimate</span>
              </div>
              
              <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                {submission.estimated_bill?.lines?.length > 0 ? (
                  <>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {submission.estimated_bill.lines.map((line, idx) => (
                        <div key={idx} className="flex justify-between text-sm border-b border-primary-100 pb-2">
                          <span className="text-gray-700">{line.label}</span>
                          <span className="font-medium text-gray-900">₹{parseFloat(line.amount).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-primary-200 mt-2">
                      <span>Total Estimate</span>
                      <span className="text-primary-700">₹{parseFloat(submission.total_estimate || 0).toFixed(0)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No estimate available</p>
                )}
              </div>
            </div>

            {/* 2. Create / View Computation Bill */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-purple-200 bg-purple-50 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <FileCheck className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-purple-700">Computation Bill</h2>
                {hasComputationBill && (
                  <span className="ml-auto text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">Created</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {hasComputationBill 
                  ? 'View the computation bill created based on documents and fee structure.' 
                  : 'Create a detailed computation bill based on client documents.'}
              </p>
              <button
                onClick={() => navigate(`/ca/submissions/${id}/computation-bill`)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center text-sm transition-colors"
              >
                {hasComputationBill ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    View Computation Bill
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Computation Bill
                  </>
                )}
              </button>
            </div>

            {/* 3. Upload to OneDrive Card */}
            {canUploadToOneDrive && !isUploadedToOneDrive && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200 bg-blue-50 hover:shadow-md transition-shadow">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-blue-500" />
                  Upload to OneDrive
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Upload all documents and computation bill to OneDrive for secure storage and sharing.
                </p>
                
                {onedriveStatus?.connected ? (
                  <button
                    onClick={handleUploadToOneDrive}
                    disabled={isUploadingToOneDrive}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center text-sm transition-colors"
                  >
                    {isUploadingToOneDrive ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4 mr-2" />
                        Uploading to OneDrive...
                      </>
                    ) : (
                      <>
                        <Cloud className="w-4 h-4 mr-2" />
                        Upload to OneDrive
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleConnectOneDrive}
                    disabled={isPopupOpen}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center text-sm transition-colors"
                  >
                    {isPopupOpen ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4 mr-2" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Cloud className="w-4 h-4 mr-2" />
                        Connect OneDrive First
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* RIGHT SIDEBAR - 7 columns */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* 1. Uploaded Documents - View Only */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-primary-500" />
                  Uploaded Documents
                  <span className="text-sm font-normal text-gray-400 ml-2">
                    ({submission.documents?.length || 0})
                  </span>
                </h2>
                <span className="text-xs text-gray-400">View Only</span>
              </div>
              
              {submission.documents && submission.documents.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {submission.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-1.5 bg-primary-50 rounded-lg flex-shrink-0">
                          {getFileIcon(doc.file_title)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{doc.file_title || 'Untitled Document'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">
                              {doc.document_type || 'Unknown'}
                            </span>
                            {doc.uploaded_by && (
                              <span className="text-xs text-gray-400">
                                • Uploaded by {doc.uploaded_by}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-xs text-gray-500">Bill as:</p>
                        <p className="text-sm font-medium capitalize">
                          {doc.bill_as === 'ignore' ? 'Ignored' : doc.bill_as || 'ignore'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-medium">No documents uploaded</p>
                  <p className="text-xs">Client hasn't uploaded any documents yet</p>
                </div>
              )}
            </div>

            {/* 2. OneDrive Files - View Only */}
            {isUploadedToOneDrive && onedriveFiles.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-blue-500" />
                    OneDrive Files
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      ({onedriveFiles.length})
                    </span>
                  </h2>
                  {submission.onedrive_folder_url && (
                    <a
                      href={submission.onedrive_folder_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Folder
                    </a>
                  )}
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {onedriveFiles.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {doc.type === 'Computation' ? (
                          <FileCheck className="w-4 h-4 text-green-500" />
                        ) : doc.type === 'estimated_bill' ? (
                          <Receipt className="w-4 h-4 text-purple-500" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="text-sm font-medium truncate">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {doc.link && (
                          <a
                            href={doc.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Status Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary-500" />
                Status Actions
              </h2>
              
              {/* Notes Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this submission..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  rows="2"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleUpdateStatus('APPROVED')}
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm py-2 px-5 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                
                <button
                  onClick={() => handleUpdateStatus('REJECTED')}
                  disabled={isUpdating}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm py-2 px-5 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                
                <button
                  onClick={fetchSubmission}
                  disabled={isLoading}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-5 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              
              {/* Status Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><span className="font-medium text-gray-600">Approve:</span> Marks submission as approved</p>
                    <p><span className="font-medium text-gray-600">Reject:</span> Marks submission as rejected</p>
                    <p><span className="font-medium text-gray-600">Refresh:</span> Updates the page with latest data</p>
                    <p className="text-gray-400 mt-1">Current Status: <span className="font-medium text-gray-700">{submission.status}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SubmissionDetail