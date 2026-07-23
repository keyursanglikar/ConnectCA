// // frontend/src/pages/ca/ComputationBill.jsx

// import React, { useState, useEffect, useRef } from 'react'
// import { useParams, useNavigate } from 'react-router-dom'
// import DashboardLayout from '../../components/common/Layout/DashboardLayout'
// import {
//   FileText, Eye, Clock, CheckCircle, XCircle, Loader2, ArrowLeft,
//   Receipt, User, Mail, Calendar, DollarSign, Send, File, FolderOpen,
//   ExternalLink, Upload as UploadIcon, FileCheck, RefreshCw, Cloud,
//   Check, X, Plus, Minus, Edit, Trash2, Printer, Download, Paperclip,
//   Trash, Save, EyeOff, AlertCircle, Info, ArrowRight,
//   FileSpreadsheet, FileImage, FileVideo, FileAudio, FileArchive,
//   AlertTriangle, ChevronDown, ChevronUp
// } from 'lucide-react'
// import axios from 'axios'
// import safeToast from '../../utils/toast'
// import { format } from 'date-fns'

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// const ComputationBill = () => {
//   const { id } = useParams()
//   const navigate = useNavigate()

//   // State
//   const [isLoading, setIsLoading] = useState(true)
//   const [submission, setSubmission] = useState(null)
//   const [estimatedBill, setEstimatedBill] = useState(null)
//   const [computationBill, setComputationBill] = useState(null)
//   const [computationBillStatus, setComputationBillStatus] = useState(null)
//   const [isEditing, setIsEditing] = useState(false)
//   const [editingComponents, setEditingComponents] = useState([])
//   const [notes, setNotes] = useState('')
//   const [isSaving, setIsSaving] = useState(false)
//   const [isSending, setIsSending] = useState(false)
//   const [isConfirming, setIsConfirming] = useState(false)
//   const [isUploading, setIsUploading] = useState(false)
//   const [uploadedFiles, setUploadedFiles] = useState([])
//   const [isCreatingBill, setIsCreatingBill] = useState(false)
//   const [onedriveStatus, setOnedriveStatus] = useState(null)
//   const [isUploadingToOneDrive, setIsUploadingToOneDrive] = useState(false)
//   const [uploadedBillFileName, setUploadedBillFileName] = useState(null)
//   const [isDeleting, setIsDeleting] = useState(false)
//   const fileInputRef = useRef(null)

//   useEffect(() => {
//     fetchData()
//     checkOneDriveStatus()
//   }, [id])

//   const fetchData = async () => {
//     setIsLoading(true)
//     try {
//       const token = localStorage.getItem('access_token')

//       // Fetch submission
//       const subResponse = await axios.get(`${API_URL}/submissions/${id}`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       })
//       setSubmission(subResponse.data)
      
//       // Set estimated bill from submission
//       if (subResponse.data.estimated_bill) {
//         setEstimatedBill(subResponse.data.estimated_bill)
//       }

//       // Fetch computation bill
//       const billResponse = await axios.get(`${API_URL}/submissions/${id}/computation-bill`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       })

//       if (billResponse.data.has_bill && billResponse.data.bill_data) {
//         setComputationBill(billResponse.data.bill_data)
//         setComputationBillStatus(billResponse.data.status || 'DRAFT')
//         setEditingComponents(billResponse.data.bill_data.fee_components || [])
//         setNotes(billResponse.data.bill_data.notes || '')
        
//         // Set uploaded files from bill data
//         const files = []
//         if (billResponse.data.bill_data.files && billResponse.data.bill_data.files.length > 0) {
//           files.push(...billResponse.data.bill_data.files)
//           setUploadedBillFileName(billResponse.data.bill_data.files[0]?.file_name || null)
//         } else if (billResponse.data.bill_data.file_name) {
//           files.push({
//             id: 1,
//             file_name: billResponse.data.bill_data.file_name,
//             file_size: billResponse.data.bill_data.file_size || 0,
//             file_path: billResponse.data.bill_data.file_path,
//             uploaded_at: billResponse.data.bill_data.created_at || new Date().toISOString(),
//             uploaded_by: 'CA'
//           })
//           setUploadedBillFileName(billResponse.data.bill_data.file_name)
//         }
//         setUploadedFiles(files)
//       } else {
//         // No bill exists - clear all state
//         setComputationBill(null)
//         setComputationBillStatus(null)
//         setUploadedFiles([])
//         setUploadedBillFileName(null)
//         setEditingComponents([])
//         setNotes('')
//       }

//     } catch (error) {
//       console.error('Error fetching data:', error)
//       safeToast.error('Failed to load data')
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const checkOneDriveStatus = async () => {
//     try {
//       const token = localStorage.getItem('access_token')
//       const response = await axios.get(`${API_URL}/onedrive/status`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       })
//       setOnedriveStatus(response.data)
//     } catch (error) {
//       console.log('OneDrive not connected')
//     }
//   }

//   // Handle upload computation bill file
// // frontend/src/pages/ca/ComputationBill.jsx - Updated upload handler

// const handleUploadComputationFile = async (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // Check file type
//     const validExtensions = ['.pdf', '.docx', '.doc'];
//     const fileExt = '.' + file.name.split('.').pop().toLowerCase();
//     if (!validExtensions.includes(fileExt)) {
//         safeToast.error('Please upload PDF or DOCX files only');
//         if (fileInputRef.current) {
//             fileInputRef.current.value = '';
//         }
//         return;
//     }

//     setIsUploading(true);
//     try {
//         const token = localStorage.getItem('access_token');
//         const formData = new FormData();
//         formData.append('file', file);

//         console.log('📤 Uploading file:', file.name, 'Size:', file.size);

//         const response = await axios.post(
//             `${API_URL}/submissions/${id}/upload-computation-bill`,
//             formData,
//             {
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     // Don't set Content-Type - let browser set it with boundary
//                 },
//                 timeout: 60000,
//                 withCredentials: true
//             }
//         );

//         console.log('✅ Upload response:', response.data);

//         // Get the parsed fee components from the backend
//         const parsedComponents = response.data.bill_data?.fee_components || [];
        
//         // Create the computation bill data
//         const billData = { 
//             ...response.data.bill_data, 
//             fee_components: parsedComponents,
//             total: parsedComponents.reduce((sum, c) => sum + (c.amount || 0), 0)
//         };

//         setComputationBill(billData);
//         setComputationBillStatus('DRAFT');
//         setEditingComponents(parsedComponents);
//         setUploadedBillFileName(file.name);
        
//         // Add file to uploaded list
//         const files = response.data.bill_data?.files || [];
//         if (files.length > 0) {
//             setUploadedFiles(files);
//         } else {
//             setUploadedFiles([{
//                 id: 1,
//                 file_name: file.name,
//                 file_size: file.size,
//                 file_path: '',
//                 uploaded_at: new Date().toISOString(),
//                 uploaded_by: 'CA'
//             }]);
//         }

//         const detectedCount = response.data.detected_count || 0;
//         if (detectedCount > 0) {
//             safeToast.success(`✅ ${detectedCount} income categories detected from the uploaded bill`);
//         } else {
//             safeToast.success('Computation bill uploaded successfully');
//         }
        
//         // Refresh data to get the latest state
//         await fetchData();

//     } catch (error) {
//         console.error('❌ Error uploading bill:', error);
        
//         // Handle specific error cases
//         if (error.response?.status === 413) {
//             safeToast.error('File too large. Please upload a smaller file.');
//         } else if (error.response?.status === 401) {
//             safeToast.error('Session expired. Please login again.');
//             navigate('/login');
//         } else if (error.response?.status === 403) {
//             safeToast.error('You do not have permission to upload bills.');
//         } else if (error.response?.data?.detail) {
//             safeToast.error(error.response.data.detail);
//         } else if (error.code === 'ECONNABORTED') {
//             safeToast.error('Upload timed out. Please try again.');
//         } else if (error.message === 'Network Error') {
//             safeToast.error('Cannot connect to server. Please make sure the backend is running.');
//         } else {
//             safeToast.error('Failed to upload bill. Please try again.');
//         }
//     } finally {
//         setIsUploading(false);
//         if (fileInputRef.current) {
//             fileInputRef.current.value = '';
//         }
//     }
// };


//   const handleRemoveFile = async (fileId) => {
//     if (!window.confirm('Are you sure you want to delete this computation bill? This action cannot be undone.')) return
    
//     setIsDeleting(true)
//     try {
//       const token = localStorage.getItem('access_token')
      
//       // Call the delete endpoint
//       const response = await axios.delete(
//         `${API_URL}/submissions/${id}/computation-files/${fileId}`,
//         { headers: { 'Authorization': `Bearer ${token}` } }
//       )

//       // IMMEDIATELY clear all local state
//       setUploadedFiles([])
//       setUploadedBillFileName(null)
//       setComputationBill(null)
//       setComputationBillStatus(null)
//       setEditingComponents([])
//       setNotes('')
      
//       safeToast.success('Computation bill deleted successfully')
      
//       // Force a full refresh to ensure consistency
//       await fetchData()
      
//     } catch (error) {
//       console.error('Error removing file:', error)
      
//       // If delete fails with 404, the file is already gone
//       if (error.response?.status === 404) {
//         setUploadedFiles([])
//         setUploadedBillFileName(null)
//         setComputationBill(null)
//         setComputationBillStatus(null)
//         safeToast.success('Computation bill already removed')
//         await fetchData()
//         return
//       }
      
//       // Try a different approach - fetch and clear via update
//       try {
//         const token = localStorage.getItem('access_token')
//         await axios.put(
//           `${API_URL}/submissions/${id}/computation-bill/update`,
//           {
//             fee_components: [],
//             notes: ''
//           },
//           { headers: { 'Authorization': `Bearer ${token}` } }
//         )
        
//         setUploadedFiles([])
//         setUploadedBillFileName(null)
//         setComputationBill(null)
//         setComputationBillStatus(null)
//         setEditingComponents([])
//         setNotes('')
//         safeToast.success('Computation bill removed successfully')
//         await fetchData()
//         return
//       } catch (updateError) {
//         console.error('Error clearing bill via update:', updateError)
//       }
      
//       // Last resort - directly modify the database via SQL (if needed)
//       safeToast.error('Failed to delete the bill. Please try again.')
//     } finally {
//       setIsDeleting(false)
//     }
//   }

// // frontend/src/pages/ca/ComputationBill.jsx - Complete edit/save flow

// // Edit button handler
// const handleEditBill = () => {
//     console.log('✏️ Entering edit mode');
//     // Get current components from computation bill
//     const currentComponents = computationBill?.fee_components || [];
//     // Ensure each component has an ID
//     const componentsWithId = currentComponents.map((comp, idx) => ({
//         ...comp,
//         id: comp.id || `comp-${idx}-${Date.now()}`
//     }));
//     setEditingComponents(componentsWithId);
//     setNotes(computationBill?.notes || '');
//     setIsEditing(true);
// };

// // Save button handler
// const handleSaveBill = async () => {
//     setIsSaving(true);
//     try {
//         const token = localStorage.getItem('access_token');
        
//         // Validate components
//         const invalidComponents = editingComponents.filter(
//             comp => !comp.label || comp.label.trim() === '' || comp.amount < 0
//         );
        
//         if (invalidComponents.length > 0) {
//             safeToast.error('Please fill in all fields correctly');
//             setIsSaving(false);
//             return;
//         }
        
//         // Prepare components for saving
//         const componentsToSave = editingComponents.map(comp => ({
//             id: comp.id || `manual-${Date.now()}-${Math.random()}`,
//             label: comp.label || 'Fee Component',
//             amount: parseFloat(comp.amount) || 0,
//             category: comp.category || 'manual',
//             is_base: comp.is_base || false,
//             is_extra: comp.is_extra || false,
//             source: comp.source || 'manual',
//             gst: comp.gst || (parseFloat(comp.amount) || 0) * 0.18,
//             total: comp.total || (parseFloat(comp.amount) || 0) * 1.18,
//             document_name: comp.document_name || 'Manual Entry',
//             fee_category_id: comp.fee_category_id || null,
//             fee_name: comp.fee_name || comp.label || 'Fee Component'
//         }));

//         const requestData = {
//             fee_components: componentsToSave,
//             notes: notes || ''
//         };

//         console.log('📤 Saving bill with components:', componentsToSave);

//         const response = await axios.put(
//             `${API_URL}/submissions/${id}/computation-bill/update`,
//             requestData,
//             {
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 }
//             }
//         );

//         console.log('✅ Save response:', response.data);

//         // Update state
//         const savedData = response.data.bill_data;
//         setComputationBill(savedData);
//         setComputationBillStatus(response.data.status || 'EDITED');
//         setEditingComponents(savedData.fee_components || []);
//         setNotes(savedData.notes || '');
//         setIsEditing(false);
        
//         safeToast.success('Bill updated successfully');
        
//         // Refresh data
//         await fetchData();

//     } catch (error) {
//         console.error('❌ Error saving bill:', error);
//         safeToast.error(error.response?.data?.detail || 'Failed to save bill');
//     } finally {
//         setIsSaving(false);
//     }
// };

// // Cancel edit handler
// const handleCancelEdit = () => {
//     setIsEditing(false);
//     // Restore from computation bill
//     setEditingComponents(computationBill?.fee_components || []);
//     setNotes(computationBill?.notes || '');
// };

// // frontend/src/pages/ca/ComputationBill.jsx - Updated save handler

// const handleSaveBill = async () => {
//     setIsSaving(true);
//     try {
//         const token = localStorage.getItem('access_token');
        
//         // Prepare the data - ensure all components have required fields
//         const componentsToSave = editingComponents.map(comp => ({
//             id: comp.id || `manual-${Date.now()}-${Math.random()}`,
//             label: comp.label || 'Fee Component',
//             amount: parseFloat(comp.amount) || 0,
//             category: comp.category || 'manual',
//             is_base: comp.is_base || false,
//             is_extra: comp.is_extra || false,
//             source: comp.source || 'manual',
//             gst: comp.gst || (parseFloat(comp.amount) || 0) * 0.18,
//             total: comp.total || (parseFloat(comp.amount) || 0) * 1.18,
//             document_name: comp.document_name || 'Manual Entry'
//         }));

//         const requestData = {
//             fee_components: componentsToSave,
//             notes: notes || ''
//         };

//         console.log('📤 Saving bill:', requestData);

//         const response = await axios.put(
//             `${API_URL}/submissions/${id}/computation-bill/update`,
//             requestData,
//             {
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 }
//             }
//         );

//         console.log('✅ Save response:', response.data);

//         // Update state with the saved data
//         const savedData = response.data.bill_data;
//         setComputationBill(savedData);
//         setComputationBillStatus(response.data.status || 'EDITED');
//         setEditingComponents(savedData.fee_components || []);
//         setNotes(savedData.notes || '');
//         setIsEditing(false);
        
//         safeToast.success('Bill updated successfully');
        
//         // Refresh data to ensure consistency
//         await fetchData();

//     } catch (error) {
//         console.error('❌ Error saving bill:', error);
        
//         if (error.response?.data?.detail) {
//             safeToast.error(error.response.data.detail);
//         } else if (error.response?.status === 401) {
//             safeToast.error('Session expired. Please login again.');
//             navigate('/login');
//         } else {
//             safeToast.error('Failed to save bill. Please try again.');
//         }
//     } finally {
//         setIsSaving(false);
//     }
// };




//   const handleSendBill = async () => {
//     setIsSending(true)
//     try {
//       const token = localStorage.getItem('access_token')

//       const response = await axios.post(
//         `${API_URL}/submissions/${id}/computation-bill/send`,
//         {},
//         { headers: { 'Authorization': `Bearer ${token}` } }
//       )

//       setComputationBill(response.data.bill_data)
//       setComputationBillStatus('SENT')
//       safeToast.success('Bill sent to client successfully')
//       await fetchData()

//     } catch (error) {
//       console.error('Error sending bill:', error)
//       safeToast.error(error.response?.data?.detail || 'Failed to send bill')
//     } finally {
//       setIsSending(false)
//     }
//   }

//   const handleConfirmBill = async () => {
//     setIsConfirming(true)
//     try {
//       const token = localStorage.getItem('access_token')

//       const response = await axios.post(
//         `${API_URL}/submissions/${id}/computation-bill/confirm`,
//         {},
//         { headers: { 'Authorization': `Bearer ${token}` } }
//       )

//       setComputationBill(response.data.bill_data)
//       setComputationBillStatus('CONFIRMED')
//       safeToast.success('Bill confirmed successfully')
//       await fetchData()

//     } catch (error) {
//       console.error('Error confirming bill:', error)
//       safeToast.error(error.response?.data?.detail || 'Failed to confirm bill')
//     } finally {
//       setIsConfirming(false)
//     }
//   }

//   const handleProceedFurther = async () => {
//     try {
//       const token = localStorage.getItem('access_token')

//       const response = await axios.post(
//         `${API_URL}/submissions/${id}/proceed`,
//         {},
//         { headers: { 'Authorization': `Bearer ${token}` } }
//       )

//       safeToast.success(response.data.message || 'Proceeded further successfully')
//       await fetchData()
//       navigate('/client/documents')

//     } catch (error) {
//       console.error('Error proceeding further:', error)
//       safeToast.error(error.response?.data?.detail || 'Failed to proceed')
//     }
//   }

//   const handleUploadToOneDrive = async () => {
//     setIsUploadingToOneDrive(true)
//     try {
//       const token = localStorage.getItem('access_token')

//       const response = await axios.post(
//         `${API_URL}/submissions/${id}/upload-to-onedrive`,
//         {},
//         { headers: { 'Authorization': `Bearer ${token}` } }
//       )

//       safeToast.success(`✅ Uploaded to OneDrive! ${response.data.documents_count} files uploaded.`)
//       await fetchData()

//     } catch (error) {
//       console.error('Error uploading to OneDrive:', error)
//       if (error.response?.data?.detail?.includes('connect OneDrive')) {
//         safeToast.info('Please connect OneDrive first')
//         window.location.href = `${API_URL}/onedrive/login`
//       } else {
//         safeToast.error(error.response?.data?.detail || 'Failed to upload to OneDrive')
//       }
//     } finally {
//       setIsUploadingToOneDrive(false)
//     }
//   }

//   const addFeeComponent = () => {
//     setEditingComponents([
//       ...editingComponents,
//       {
//         id: `manual-${Date.now()}`,
//         document_id: null,
//         document_name: 'Manual Entry',
//         category: 'manual',
//         label: 'New Fee Component',
//         amount: 0,
//         source: 'manual',
//         is_extra: true,
//         is_base: false
//       }
//     ])
//   }

//   const removeFeeComponent = (index) => {
//     if (!window.confirm('Remove this component?')) return
//     const updated = editingComponents.filter((_, i) => i !== index)
//     setEditingComponents(updated)
//   }

//   const updateFeeComponent = (index, field, value) => {
//     const updated = [...editingComponents]
//     updated[index][field] = value
//     setEditingComponents(updated)
//   }

//   const getStatusBadge = (status) => {
//     const statusMap = {
//       'DRAFT': { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
//       'EDITED': { label: 'Edited', color: 'bg-yellow-100 text-yellow-700' },
//       'SENT': { label: 'Sent to Client', color: 'bg-blue-100 text-blue-700' },
//       'CONFIRMED': { label: 'Confirmed by Client', color: 'bg-green-100 text-green-700' },
//       'FINALIZED': { label: 'Finalized', color: 'bg-purple-100 text-purple-700' }
//     }
//     const config = statusMap[status] || statusMap['DRAFT']
//     return (
//       <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
//         {config.label}
//       </span>
//     )
//   }

//   const getTotal = (components) => {
//     if (!components) return 0
//     return components.reduce((sum, comp) => sum + (comp.amount || 0), 0)
//   }

//   const getEstimatedTotal = () => {
//     if (!estimatedBill?.lines) return 0
//     return estimatedBill.lines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0)
//   }

//   const getFileIcon = (fileName) => {
//     if (!fileName) return <File className="w-4 h-4 text-gray-500" />
//     const ext = fileName.split('.').pop().toLowerCase()
//     switch (ext) {
//       case 'pdf': return <FileText className="w-4 h-4 text-red-500" />
//       case 'xlsx':
//       case 'xls':
//       case 'csv': return <FileSpreadsheet className="w-4 h-4 text-green-500" />
//       case 'doc':
//       case 'docx': return <FileText className="w-4 h-4 text-blue-500" />
//       default: return <File className="w-4 h-4 text-gray-500" />
//     }
//   }

//   const formatFileSize = (bytes) => {
//     if (!bytes) return ''
//     const sizes = ['B', 'KB', 'MB', 'GB']
//     const i = Math.floor(Math.log(bytes) / Math.log(1024))
//     return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
//   }

//   if (isLoading) {
//     return (
//       <DashboardLayout>
//         <div className="flex items-center justify-center h-64">
//           <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
//         </div>
//       </DashboardLayout>
//     )
//   }

//   if (!submission) {
//     return (
//       <DashboardLayout>
//         <div className="text-center py-12">
//           <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
//           <p className="text-lg font-medium text-gray-500">Submission not found</p>
//           <button onClick={() => navigate('/ca/submissions')} className="text-primary-500 hover:underline">
//             Back to submissions
//           </button>
//         </div>
//       </DashboardLayout>
//     )
//   }

//   const isClient = localStorage.getItem('user_role') === 'CLIENT'

//   return (
//     <DashboardLayout
//       title={isClient ? "Review Bill" : "Computation Bill"}
//       subtitle={`Submission #${submission.id} - ${submission.client_name}`}
//     >
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
//         <div>
//           <button
//             onClick={() => navigate(isClient ? '/client/documents' : `/ca/submissions/${id}`)}
//             className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-2"
//           >
//             <ArrowLeft className="w-4 h-4 mr-1" />
//             {isClient ? 'Back to Documents' : 'Back to Submission'}
//           </button>
//           <div className="flex items-center gap-3">
//             <h2 className="text-lg font-semibold">{isClient ? 'Review Bill' : 'Computation Bill'}</h2>
//             {computationBillStatus && getStatusBadge(computationBillStatus)}
//           </div>
//         </div>
//         <button
//           onClick={fetchData}
//           className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
//         >
//           <RefreshCw className="w-4 h-4" />
//           Refresh
//         </button>
//       </div>

//       {/* OneDrive Status Banner */}
//       {!isClient && onedriveStatus && !onedriveStatus.connected && (
//         <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between mb-6">
//           <div className="flex items-center gap-3">
//             <Cloud className="w-5 h-5 text-yellow-600" />
//             <div>
//               <p className="text-sm font-medium text-yellow-800">OneDrive not connected</p>
//               <p className="text-xs text-yellow-600">Connect your OneDrive to upload files</p>
//             </div>
//           </div>
//           <button
//             onClick={() => window.location.href = `${API_URL}/onedrive/login`}
//             className="bg-primary-600 hover:bg-primary-700 text-white text-sm py-1.5 px-4 rounded-lg flex items-center"
//           >
//             <Cloud className="w-4 h-4 mr-2" />
//             Connect OneDrive
//           </button>
//         </div>
//       )}

//       {/* Client Info */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//         <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
//           <p className="text-sm text-gray-500">Client</p>
//           <p className="font-semibold flex items-center gap-2">
//             <User className="w-4 h-4 text-gray-400" />
//             {submission.client_name}
//           </p>
//         </div>
//         <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
//           <p className="text-sm text-gray-500">Email</p>
//           <p className="font-semibold flex items-center gap-2">
//             <Mail className="w-4 h-4 text-gray-400" />
//             {submission.client_email}
//           </p>
//         </div>
//         <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
//           <p className="text-sm text-gray-500">Status</p>
//           <p className="font-semibold flex items-center gap-2">
//             <Clock className="w-4 h-4 text-gray-400" />
//             {submission.status}
//           </p>
//         </div>
//         <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
//           <p className="text-sm text-gray-500">Estimated Total</p>
//           <p className="font-semibold flex items-center gap-2 text-primary-600">
//             <DollarSign className="w-4 h-4 text-gray-400" />
//             ₹{getEstimatedTotal().toFixed(0)}
//           </p>
//         </div>
//       </div>

//       {/* Main Content - Two Column Layout */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

//         {/* LEFT COLUMN - Upload Computation Bill */}
//         <div className="space-y-4">
//           <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
//             <h3 className="font-semibold mb-4 flex items-center gap-2">
//               <UploadIcon className="w-5 h-5 text-primary-500" />
//               Upload Computation Bill
//             </h3>
            
//             {!isClient && (
//               <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
//                 <input
//                   type="file"
//                   accept=".pdf,.docx,.doc"
//                   onChange={handleUploadComputationFile}
//                   className="hidden"
//                   id="computation-file-upload"
//                   ref={fileInputRef}
//                   disabled={isUploading}
//                 />
//                 <label
//                   htmlFor="computation-file-upload"
//                   className="cursor-pointer flex flex-col items-center"
//                 >
//                   <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
//                   <p className="text-sm text-gray-600">Click to upload computation bill</p>
//                   <p className="text-xs text-gray-400">PDF, DOCX files accepted</p>
//                   {isUploading && (
//                     <div className="mt-2 flex items-center gap-2">
//                       <Loader2 className="animate-spin w-4 h-4 text-primary-500" />
//                       <span className="text-sm text-gray-500">Uploading...</span>
//                     </div>
//                   )}
//                 </label>
//               </div>
//             )}

//             {isClient && !computationBill && (
//               <div className="text-center py-8 text-gray-500">
//                 <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
//                 <p className="text-sm">No computation bill uploaded yet</p>
//                 <p className="text-xs">Please wait for your CA to upload the bill</p>
//               </div>
//             )}

//             {isClient && computationBill && (
//               <div className="text-center py-4 text-green-600 bg-green-50 rounded-lg border border-green-200">
//                 <FileCheck className="w-8 h-8 mx-auto text-green-500 mb-1" />
//                 <p className="text-sm font-medium">Computation bill uploaded</p>
//                 <p className="text-xs text-gray-500">{uploadedBillFileName}</p>
//               </div>
//             )}

//             {/* Uploaded Files List */}
//             {uploadedFiles.length > 0 && (
//               <div className="mt-4">
//                 <div className="flex items-center justify-between mb-2">
//                   <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
//                   <span className="text-xs text-gray-400">{uploadedFiles.length} file(s)</span>
//                 </div>
//                 <div className="space-y-2">
//                   {uploadedFiles.map((file, idx) => (
//                     <div 
//                       key={file.id || idx} 
//                       className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors group"
//                     >
//                       <div className="flex items-center gap-3 min-w-0 flex-1">
//                         {getFileIcon(file.file_name)}
//                         <div className="min-w-0 flex-1">
//                           <p className="text-sm font-medium truncate">{file.file_name}</p>
//                           <p className="text-xs text-gray-500">
//                             {formatFileSize(file.file_size)}
//                             {file.uploaded_at && ` • ${format(new Date(file.uploaded_at), 'MMM dd, yyyy')}`}
//                           </p>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-1 flex-shrink-0">
//                         {file.url && (
//                           <a
//                             href={file.url}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
//                             title="View File"
//                           >
//                             <Eye size={16} />
//                           </a>
//                         )}
//                         {!isClient && (
//                           <button
//                             onClick={() => handleRemoveFile(file.id)}
//                             disabled={isDeleting}
//                             className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
//                             title="Delete Computation Bill"
//                           >
//                             {isDeleting ? (
//                               <Loader2 className="w-4 h-4 animate-spin" />
//                             ) : (
//                               <Trash size={16} />
//                             )}
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//                 {!isClient && uploadedFiles.length > 0 && (
//                   <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
//                     <AlertCircle className="w-3 h-3" />
//                     Click the trash icon to delete the entire computation bill
//                   </p>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* OneDrive Files - View Only */}
//           {submission.onedrive_upload_status === 'COMPLETED' && submission.document_links && (
//             <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="font-semibold flex items-center gap-2">
//                   <Cloud className="w-5 h-5 text-blue-500" />
//                   OneDrive Files
//                   <span className="text-sm font-normal text-gray-400 ml-2">(View Only)</span>
//                 </h3>
//                 {submission.onedrive_folder_url && (
//                   <a
//                     href={submission.onedrive_folder_url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
//                   >
//                     <ExternalLink className="w-4 h-4" />
//                     Open in OneDrive
//                   </a>
//                 )}
//               </div>
//               <div className="space-y-2 max-h-60 overflow-y-auto">
//                 {submission.document_links.map((doc, idx) => (
//                   <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
//                     <div className="flex items-center gap-3">
//                       {doc.type === 'Computation' ? (
//                         <FileCheck className="w-4 h-4 text-green-500" />
//                       ) : (
//                         <FileText className="w-4 h-4 text-blue-500" />
//                       )}
//                       <span className="text-sm font-medium">{doc.name}</span>
//                     </div>
//                     <a
//                       href={doc.link}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
//                     >
//                       <Eye className="w-4 h-4" />
//                       View
//                     </a>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* RIGHT COLUMN - Bills */}
//         <div className="space-y-4">

//           {/* Estimated Bill Section (View Only) */}
//           {estimatedBill && estimatedBill.lines && estimatedBill.lines.length > 0 && (
//             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//               <div className="p-4 border-b border-gray-200 bg-gray-50">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h3 className="font-semibold flex items-center gap-2">
//                       <Receipt className="w-5 h-5 text-gray-500" />
//                       Estimated Bill
//                       <span className="text-sm font-normal text-gray-400">(View Only)</span>
//                     </h3>
//                     <p className="text-sm text-gray-500">Submitted by client</p>
//                   </div>
//                   <span className="text-sm text-gray-400">
//                     {estimatedBill.lines.length} items
//                   </span>
//                 </div>
//               </div>
//               <div className="p-4">
//                 <div className="space-y-2">
//                   {estimatedBill.lines.map((line, idx) => (
//                     <div key={idx} className="flex items-center justify-between p-2 bg-primary-50 rounded-lg border border-primary-100">
//                       <span className="text-sm">{line.label || line.description || 'Item'}</span>
//                       <span className="font-semibold">₹{parseFloat(line.amount || 0).toFixed(0)}</span>
//                     </div>
//                   ))}
//                   <div className="flex items-center justify-between pt-2 border-t-2 border-primary-200 text-sm font-semibold text-primary-700">
//                     <span>Total</span>
//                     <span>₹{getEstimatedTotal().toFixed(0)}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Computation Bill Section */}
//           {computationBill ? (
//             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//               <div className="p-4 border-b border-gray-200 bg-gray-50">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h3 className="font-semibold flex items-center gap-2">
//                       <FileCheck className="w-5 h-5 text-primary-500" />
//                       Computation Bill
//                     </h3>
//                     <p className="text-sm text-gray-500">
//                       {uploadedBillFileName ? `From: ${uploadedBillFileName}` : 'Generated from documents'}
//                     </p>
//                     {computationBill.parsed_client_name && (
//                       <p className="text-xs text-gray-400">
//                         Client: {computationBill.parsed_client_name} 
//                         {computationBill.parsed_pan && ` • PAN: ${computationBill.parsed_pan}`}
//                       </p>
//                     )}
//                   </div>
//                   <div className="flex items-center gap-2 flex-wrap">
//                     {!isClient && (computationBillStatus === 'DRAFT' || computationBillStatus === 'EDITED') && (
//                       <>
//                         <button
//                           onClick={handleEditBill}
//                           className="btn-outline flex items-center text-sm py-1.5 px-3"
//                         >
//                           <Edit className="w-4 h-4 mr-1" />
//                           Edit
//                         </button>
//                         <button
//                           onClick={handleSendBill}
//                           disabled={isSending}
//                           className="btn-primary flex items-center text-sm py-1.5 px-3"
//                         >
//                           {isSending ? (
//                             <Loader2 className="animate-spin w-4 h-4 mr-1" />
//                           ) : (
//                             <Send className="w-4 h-4 mr-1" />
//                           )}
//                           Send to Client
//                         </button>
//                       </>
//                     )}
//                     {isClient && computationBillStatus === 'SENT' && (
//                       <button
//                         onClick={handleConfirmBill}
//                         disabled={isConfirming}
//                         className="btn-success flex items-center text-sm py-1.5 px-3"
//                       >
//                         {isConfirming ? (
//                           <Loader2 className="animate-spin w-4 h-4 mr-1" />
//                         ) : (
//                           <Check className="w-4 h-4 mr-1" />
//                         )}
//                         Confirm Bill
//                       </button>
//                     )}
//                     {!isClient && computationBillStatus === 'CONFIRMED' && (
//                       <button
//                         onClick={() => safeToast.info('Client has confirmed the bill')}
//                         className="btn-success flex items-center text-sm py-1.5 px-3"
//                       >
//                         <CheckCircle className="w-4 h-4 mr-1" />
//                         Client Confirmed
//                       </button>
//                     )}
//                     {isClient && computationBillStatus === 'CONFIRMED' && (
//                       <button
//                         onClick={handleProceedFurther}
//                         className="btn-primary flex items-center text-sm py-1.5 px-3"
//                       >
//                         <ArrowRight className="w-4 h-4 mr-1" />
//                         Proceed Further
//                       </button>
//                     )}
//                     {!isClient && computationBillStatus === 'FINALIZED' && (
//                       <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center">
//                         <CheckCircle className="w-4 h-4 mr-1" />
//                         Finalized
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div className="p-4">
//                 {!isEditing ? (
//                   <div className="space-y-3">
//                     {/* Fee Components */}
//                     {computationBill.fee_components && computationBill.fee_components.length > 0 ? (
//                       computationBill.fee_components.map((comp, idx) => (
//                         <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
//                           <div className="flex-1">
//                             <div className="flex items-center gap-2 flex-wrap">
//                               <span className="font-medium text-sm">{comp.label}</span>
//                               {comp.is_base && (
//                                 <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Base</span>
//                               )}
//                               {comp.is_extra && (
//                                 <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Extra</span>
//                               )}
//                               {comp.source === 'manual' && (
//                                 <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Manual</span>
//                               )}
//                               {comp.source === 'document' && (
//                                 <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Detected</span>
//                               )}
//                             </div>
//                             {comp.document_name && comp.document_name !== 'Manual Entry' && comp.document_name !== 'Base Fee' && (
//                               <p className="text-xs text-gray-500">From: {comp.document_name}</p>
//                             )}
//                           </div>
//                           <span className="font-semibold">₹{comp.amount.toFixed(0)}</span>
//                         </div>
//                       ))
//                     ) : (
//                       <div className="text-center py-8 text-gray-500">
//                         <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
//                         <p className="text-sm">No fee components found</p>
//                         <p className="text-xs">Upload a computation bill to auto-detect components</p>
//                       </div>
//                     )}

//                     {/* Total */}
//                     <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
//                       <span className="text-lg font-bold">Total</span>
//                       <span className="text-2xl font-bold text-primary-600">
//                         ₹{getTotal(computationBill.fee_components || []).toFixed(0)}
//                       </span>
//                     </div>

//                     {computationBill.notes && (
//                       <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
//                         <p className="text-sm text-gray-600">{computationBill.notes}</p>
//                       </div>
//                     )}

//                     {computationBill.parse_error && (
//                       <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
//                         <p className="text-sm text-red-600 flex items-center gap-2">
//                           <AlertCircle className="w-4 h-4" />
//                           {computationBill.parse_error}
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   // Edit Mode
//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between">
//                       <h4 className="font-medium">Edit Fee Components</h4>
//                       <button
//                         onClick={addFeeComponent}
//                         className="btn-outline text-sm py-1 px-3 flex items-center"
//                       >
//                         <Plus className="w-4 h-4 mr-1" />
//                         Add Component
//                       </button>
//                     </div>

//                     <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
//                       {editingComponents.map((comp, idx) => (
//                         <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
//                           <div className="flex-1 grid grid-cols-2 gap-2">
//                             <input
//                               type="text"
//                               value={comp.label || ''}
//                               onChange={(e) => updateFeeComponent(idx, 'label', e.target.value)}
//                               placeholder="Label"
//                               className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
//                             />
//                             <input
//                               type="number"
//                               value={comp.amount || 0}
//                               onChange={(e) => updateFeeComponent(idx, 'amount', parseFloat(e.target.value) || 0)}
//                               placeholder="Amount"
//                               className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
//                             />
//                           </div>
//                           <button
//                             onClick={() => removeFeeComponent(idx)}
//                             className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </button>
//                         </div>
//                       ))}
//                     </div>

//                     <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
//                       <span className="text-lg font-bold">Total</span>
//                       <span className="text-2xl font-bold text-primary-600">
//                         ₹{getTotal(editingComponents).toFixed(0)}
//                       </span>
//                     </div>

//                     <div className="mt-4">
//                       <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
//                       <textarea
//                         value={notes}
//                         onChange={(e) => setNotes(e.target.value)}
//                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
//                         placeholder="Add notes for the client..."
//                         rows="3"
//                       />
//                     </div>

//                     <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
//                       <button
//                         onClick={() => {
//                           setIsEditing(false)
//                           setEditingComponents(computationBill?.fee_components || [])
//                           setNotes(computationBill?.notes || '')
//                         }}
//                         className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
//                       >
//                         Cancel
//                       </button>
//                       <button
//                         onClick={handleSaveBill}
//                         disabled={isSaving}
//                         className="btn-primary flex items-center"
//                       >
//                         {isSaving ? (
//                           <Loader2 className="animate-spin w-4 h-4 mr-2" />
//                         ) : (
//                           <Save className="w-4 h-4 mr-2" />
//                         )}
//                         Save Changes
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           ) : (
//             // No Computation Bill
//             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 text-center">
//               <FileCheck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
//               <p className="text-gray-500 font-medium">No Computation Bill</p>
//               <p className="text-sm text-gray-400 mt-1">
//                 {isClient ? 'Please wait for your CA to upload the bill' : 'Upload a computation bill to get started'}
//               </p>
//             </div>
//           )}

//           {/* Upload to OneDrive Button (CA Only) */}
//           {!isClient && computationBillStatus === 'FINALIZED' && submission.onedrive_upload_status !== 'COMPLETED' && (
//             <div className="bg-white rounded-xl shadow-sm p-4 border border-blue-200 bg-blue-50">
//               <button
//                 onClick={handleUploadToOneDrive}
//                 disabled={isUploadingToOneDrive}
//                 className="w-full btn-primary flex items-center justify-center text-sm py-2.5 disabled:opacity-50"
//               >
//                 {isUploadingToOneDrive ? (
//                   <Loader2 className="animate-spin w-4 h-4 mr-2" />
//                 ) : (
//                   <>
//                     <Cloud className="w-4 h-4 mr-2" />
//                     Upload to OneDrive
//                   </>
//                 )}
//               </button>
//               <p className="text-xs text-gray-500 mt-2 text-center">
//                 Upload the final bill and documents to OneDrive
//               </p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Status Messages */}
//       {computationBillStatus === 'SENT' && isClient && (
//         <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
//           <p className="text-sm text-yellow-700 flex items-center gap-2">
//             <AlertCircle className="w-5 h-5" />
//             Please review the computation bill and confirm it to proceed.
//           </p>
//         </div>
//       )}

//       {computationBillStatus === 'CONFIRMED' && !isClient && (
//         <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
//           <p className="text-sm text-green-700 flex items-center gap-2">
//             <CheckCircle className="w-5 h-5" />
//             Client has confirmed the bill. You can now upload to OneDrive.
//           </p>
//         </div>
//       )}

//       {computationBillStatus === 'CONFIRMED' && isClient && (
//         <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
//           <p className="text-sm text-green-700 flex items-center gap-2">
//             <CheckCircle className="w-5 h-5" />
//             Bill confirmed! Click "Proceed Further" to continue.
//           </p>
//         </div>
//       )}
//     </DashboardLayout>
//   )
// }

// export default ComputationBill











// frontend/src/pages/ca/ComputationBill.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/common/Layout/DashboardLayout.jsx'
import {
  FileText, Eye, Clock, CheckCircle, XCircle, Loader2, ArrowLeft,
  Receipt, User, Mail, Calendar, DollarSign, Send, File, FolderOpen,
  ExternalLink, Upload as UploadIcon, FileCheck, RefreshCw, Cloud,
  Check, X, Plus, Minus, Edit, Trash2, Printer, Download, Paperclip,
  Trash, Save, EyeOff, AlertCircle, Info, ArrowRight,
  FileSpreadsheet, FileImage, FileVideo, FileAudio, FileArchive,
  AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react'
import axios from 'axios'
import safeToast from '../../utils/toast.js'
import { format } from 'date-fns'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const ComputationBill = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  // State
  const [isLoading, setIsLoading] = useState(true)
  const [submission, setSubmission] = useState(null)
  const [estimatedBill, setEstimatedBill] = useState(null)
  const [computationBill, setComputationBill] = useState(null)
  const [computationBillStatus, setComputationBillStatus] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingComponents, setEditingComponents] = useState([])
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isCreatingBill, setIsCreatingBill] = useState(false)
  const [onedriveStatus, setOnedriveStatus] = useState(null)
  const [isUploadingToOneDrive, setIsUploadingToOneDrive] = useState(false)
  const [uploadedBillFileName, setUploadedBillFileName] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchData()
    checkOneDriveStatus()
  }, [id])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')

      // Fetch submission
      const subResponse = await axios.get(`${API_URL}/submissions/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setSubmission(subResponse.data)
      
      // Set estimated bill from submission
      if (subResponse.data.estimated_bill) {
        setEstimatedBill(subResponse.data.estimated_bill)
      }

      // Fetch computation bill
      const billResponse = await axios.get(`${API_URL}/submissions/${id}/computation-bill`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (billResponse.data.has_bill && billResponse.data.bill_data) {
        const billData = billResponse.data.bill_data
        setComputationBill(billData)
        setComputationBillStatus(billResponse.data.status || 'DRAFT')
        setEditingComponents(billData.fee_components || [])
        setNotes(billData.notes || '')
        
        // Set uploaded files from bill data
        const files = []
        if (billData.files && billData.files.length > 0) {
          files.push(...billData.files)
          setUploadedBillFileName(billData.files[0]?.file_name || null)
        } else if (billData.file_name) {
          files.push({
            id: 1,
            file_name: billData.file_name,
            file_size: billData.file_size || 0,
            file_path: billData.file_path,
            uploaded_at: billData.created_at || new Date().toISOString(),
            uploaded_by: 'CA'
          })
          setUploadedBillFileName(billData.file_name)
        }
        setUploadedFiles(files)
      } else {
        // No bill exists - clear all state
        setComputationBill(null)
        setComputationBillStatus(null)
        setUploadedFiles([])
        setUploadedBillFileName(null)
        setEditingComponents([])
        setNotes('')
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      safeToast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const checkOneDriveStatus = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.get(`${API_URL}/onedrive/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setOnedriveStatus(response.data)
    } catch (error) {
      console.log('OneDrive not connected')
    }
  }

  // Handle upload computation bill file
  const handleUploadComputationFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validExtensions = ['.pdf', '.docx', '.doc'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(fileExt)) {
        safeToast.error('Please upload PDF or DOCX files only');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        return;
    }

    setIsUploading(true);
    try {
        const token = localStorage.getItem('access_token');
        const formData = new FormData();
        formData.append('file', file);

        console.log('📤 Uploading file:', file.name, 'Size:', file.size);

        const response = await axios.post(
            `${API_URL}/submissions/${id}/upload-computation-bill`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                timeout: 60000,
                withCredentials: true
            }
        );

        console.log('✅ Upload response:', response.data);

        // Get the parsed fee components from the backend
        const parsedComponents = response.data.bill_data?.fee_components || [];
        
        // Create the computation bill data
        const billData = { 
            ...response.data.bill_data, 
            fee_components: parsedComponents,
            total: parsedComponents.reduce((sum, c) => sum + (c.amount || 0), 0)
        };

        setComputationBill(billData);
        setComputationBillStatus('DRAFT');
        setEditingComponents(parsedComponents);
        setUploadedBillFileName(file.name);
        
        // Add file to uploaded list
        const files = response.data.bill_data?.files || [];
        if (files.length > 0) {
            setUploadedFiles(files);
        } else {
            setUploadedFiles([{
                id: 1,
                file_name: file.name,
                file_size: file.size,
                file_path: '',
                uploaded_at: new Date().toISOString(),
                uploaded_by: 'CA'
            }]);
        }

        const detectedCount = response.data.detected_count || 0;
        if (detectedCount > 0) {
            safeToast.success(`✅ ${detectedCount} income categories detected from the uploaded bill`);
        } else {
            safeToast.success('Computation bill uploaded successfully');
        }
        
        // Refresh data to get the latest state
        await fetchData();

    } catch (error) {
        console.error('❌ Error uploading bill:', error);
        
        if (error.response?.status === 413) {
            safeToast.error('File too large. Please upload a smaller file.');
        } else if (error.response?.status === 401) {
            safeToast.error('Session expired. Please login again.');
            navigate('/login');
        } else if (error.response?.status === 403) {
            safeToast.error('You do not have permission to upload bills.');
        } else if (error.response?.data?.detail) {
            safeToast.error(error.response.data.detail);
        } else if (error.code === 'ECONNABORTED') {
            safeToast.error('Upload timed out. Please try again.');
        } else if (error.message === 'Network Error') {
            safeToast.error('Cannot connect to server. Please make sure the backend is running.');
        } else {
            safeToast.error('Failed to upload bill. Please try again.');
        }
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  }

  const handleRemoveFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this computation bill? This action cannot be undone.')) return
    
    setIsDeleting(true)
    try {
      const token = localStorage.getItem('access_token')
      
      // Call the delete endpoint
      const response = await axios.delete(
        `${API_URL}/submissions/${id}/computation-files/${fileId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      // IMMEDIATELY clear all local state
      setUploadedFiles([])
      setUploadedBillFileName(null)
      setComputationBill(null)
      setComputationBillStatus(null)
      setEditingComponents([])
      setNotes('')
      
      safeToast.success('Computation bill deleted successfully')
      
      // Force a full refresh to ensure consistency
      await fetchData()
      
    } catch (error) {
      console.error('Error removing file:', error)
      
      // If delete fails with 404, the file is already gone
      if (error.response?.status === 404) {
        setUploadedFiles([])
        setUploadedBillFileName(null)
        setComputationBill(null)
        setComputationBillStatus(null)
        safeToast.success('Computation bill already removed')
        await fetchData()
        return
      }
      
      // Try a different approach - fetch and clear via update
      try {
        const token = localStorage.getItem('access_token')
        await axios.put(
          `${API_URL}/submissions/${id}/computation-bill/update`,
          {
            fee_components: [],
            notes: ''
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        )
        
        setUploadedFiles([])
        setUploadedBillFileName(null)
        setComputationBill(null)
        setComputationBillStatus(null)
        setEditingComponents([])
        setNotes('')
        safeToast.success('Computation bill removed successfully')
        await fetchData()
        return
      } catch (updateError) {
        console.error('Error clearing bill via update:', updateError)
      }
      
      safeToast.error('Failed to delete the bill. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Edit button handler
  const handleEditBill = () => {
    console.log('✏️ Entering edit mode');
    // Get current components from computation bill
    const currentComponents = computationBill?.fee_components || [];
    // Ensure each component has an ID
    const componentsWithId = currentComponents.map((comp, idx) => ({
        ...comp,
        id: comp.id || `comp-${idx}-${Date.now()}`
    }));
    setEditingComponents(componentsWithId);
    setNotes(computationBill?.notes || '');
    setIsEditing(true);
  };

  // Save button handler
  const handleSaveBill = async () => {
    setIsSaving(true);
    try {
        const token = localStorage.getItem('access_token');
        
        // Validate components
        const invalidComponents = editingComponents.filter(
            comp => !comp.label || comp.label.trim() === '' || comp.amount < 0
        );
        
        if (invalidComponents.length > 0) {
            safeToast.error('Please fill in all fields correctly');
            setIsSaving(false);
            return;
        }
        
        // Prepare components for saving
        const componentsToSave = editingComponents.map(comp => ({
            id: comp.id || `manual-${Date.now()}-${Math.random()}`,
            label: comp.label || 'Fee Component',
            amount: parseFloat(comp.amount) || 0,
            category: comp.category || 'manual',
            is_base: comp.is_base || false,
            is_extra: comp.is_extra || false,
            source: comp.source || 'manual',
            gst: comp.gst || (parseFloat(comp.amount) || 0) * 0.18,
            total: comp.total || (parseFloat(comp.amount) || 0) * 1.18,
            document_name: comp.document_name || 'Manual Entry',
            fee_category_id: comp.fee_category_id || null,
            fee_name: comp.fee_name || comp.label || 'Fee Component'
        }));

        const requestData = {
            fee_components: componentsToSave,
            notes: notes || ''
        };

        console.log('📤 Saving bill with components:', componentsToSave);

        const response = await axios.put(
            `${API_URL}/submissions/${id}/computation-bill/update`,
            requestData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Save response:', response.data);

        // Update state
        const savedData = response.data.bill_data;
        setComputationBill(savedData);
        setComputationBillStatus(response.data.status || 'EDITED');
        setEditingComponents(savedData.fee_components || []);
        setNotes(savedData.notes || '');
        setIsEditing(false);
        
        safeToast.success('Bill updated successfully');
        
        // Refresh data
        await fetchData();

    } catch (error) {
        console.error('❌ Error saving bill:', error);
        safeToast.error(error.response?.data?.detail || 'Failed to save bill');
    } finally {
        setIsSaving(false);
    }
  };

  // Cancel edit handler
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Restore from computation bill
    setEditingComponents(computationBill?.fee_components || []);
    setNotes(computationBill?.notes || '');
  };

  const handleSendBill = async () => {
    setIsSending(true)
    try {
      const token = localStorage.getItem('access_token')

      const response = await axios.post(
        `${API_URL}/submissions/${id}/computation-bill/send`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      setComputationBill(response.data.bill_data)
      setComputationBillStatus('SENT')
      safeToast.success('Bill sent to client successfully')
      await fetchData()

    } catch (error) {
      console.error('Error sending bill:', error)
      safeToast.error(error.response?.data?.detail || 'Failed to send bill')
    } finally {
      setIsSending(false)
    }
  }

  const handleConfirmBill = async () => {
    setIsConfirming(true)
    try {
      const token = localStorage.getItem('access_token')

      const response = await axios.post(
        `${API_URL}/submissions/${id}/computation-bill/confirm`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      setComputationBill(response.data.bill_data)
      setComputationBillStatus('CONFIRMED')
      safeToast.success('Bill confirmed successfully')
      await fetchData()

    } catch (error) {
      console.error('Error confirming bill:', error)
      safeToast.error(error.response?.data?.detail || 'Failed to confirm bill')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleProceedFurther = async () => {
    try {
      const token = localStorage.getItem('access_token')

      const response = await axios.post(
        `${API_URL}/submissions/${id}/proceed`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      safeToast.success(response.data.message || 'Proceeded further successfully')
      await fetchData()
      navigate('/client/documents')

    } catch (error) {
      console.error('Error proceeding further:', error)
      safeToast.error(error.response?.data?.detail || 'Failed to proceed')
    }
  }

  const handleUploadToOneDrive = async () => {
    setIsUploadingToOneDrive(true)
    try {
      const token = localStorage.getItem('access_token')

      const response = await axios.post(
        `${API_URL}/submissions/${id}/upload-to-onedrive`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      safeToast.success(`✅ Uploaded to OneDrive! ${response.data.documents_count} files uploaded.`)
      await fetchData()

    } catch (error) {
      console.error('Error uploading to OneDrive:', error)
      if (error.response?.data?.detail?.includes('connect OneDrive')) {
        safeToast.info('Please connect OneDrive first')
        window.location.href = `${API_URL}/onedrive/login`
      } else {
        safeToast.error(error.response?.data?.detail || 'Failed to upload to OneDrive')
      }
    } finally {
      setIsUploadingToOneDrive(false)
    }
  }

  const addFeeComponent = () => {
    setEditingComponents([
      ...editingComponents,
      {
        id: `manual-${Date.now()}`,
        document_id: null,
        document_name: 'Manual Entry',
        category: 'manual',
        label: 'New Fee Component',
        amount: 0,
        source: 'manual',
        is_extra: true,
        is_base: false,
        gst: 0,
        total: 0
      }
    ])
  }

  const removeFeeComponent = (index) => {
    if (!window.confirm('Remove this component?')) return
    const updated = editingComponents.filter((_, i) => i !== index)
    setEditingComponents(updated)
  }

  const updateFeeComponent = (index, field, value) => {
    const updated = [...editingComponents]
    updated[index][field] = value
    // Auto-calculate GST and total if amount changes
    if (field === 'amount') {
      const amount = parseFloat(value) || 0
      updated[index].gst = amount * 0.18
      updated[index].total = amount + updated[index].gst
    }
    setEditingComponents(updated)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'DRAFT': { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
      'EDITED': { label: 'Edited', color: 'bg-yellow-100 text-yellow-700' },
      'SENT': { label: 'Sent to Client', color: 'bg-blue-100 text-blue-700' },
      'SENT_TO_CLIENT': { label: 'Sent to Client', color: 'bg-blue-100 text-blue-700' },
      'CONFIRMED': { label: 'Confirmed by Client', color: 'bg-green-100 text-green-700' },
      'CONFIRMED_BY_CLIENT': { label: 'Confirmed by Client', color: 'bg-green-100 text-green-700' },
      'FINALIZED': { label: 'Finalized', color: 'bg-purple-100 text-purple-700' }
    }
    const config = statusMap[status] || statusMap['DRAFT']
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getTotal = (components) => {
    if (!components) return 0
    return components.reduce((sum, comp) => sum + (comp.amount || 0), 0)
  }

  const getEstimatedTotal = () => {
    if (!estimatedBill?.lines) return 0
    return estimatedBill.lines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0)
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
      default: return <File className="w-4 h-4 text-gray-500" />
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
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
          <button onClick={() => navigate('/ca/submissions')} className="text-primary-500 hover:underline">
            Back to submissions
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const isClient = localStorage.getItem('user_role') === 'CLIENT'

  return (
    <DashboardLayout
      title={isClient ? "Review Bill" : "Computation Bill"}
      subtitle={`Submission #${submission.id} - ${submission.client_name}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate(isClient ? '/client/documents' : `/ca/submissions/${id}`)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {isClient ? 'Back to Documents' : 'Back to Submission'}
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{isClient ? 'Review Bill' : 'Computation Bill'}</h2>
            {computationBillStatus && getStatusBadge(computationBillStatus)}
          </div>
        </div>
        <button
          onClick={fetchData}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* OneDrive Status Banner */}
      {!isClient && onedriveStatus && !onedriveStatus.connected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Cloud className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">OneDrive not connected</p>
              <p className="text-xs text-yellow-600">Connect your OneDrive to upload files</p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = `${API_URL}/onedrive/login`}
            className="bg-primary-600 hover:bg-primary-700 text-white text-sm py-1.5 px-4 rounded-lg flex items-center"
          >
            <Cloud className="w-4 h-4 mr-2" />
            Connect OneDrive
          </button>
        </div>
      )}

      {/* Client Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Client</p>
          <p className="font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            {submission.client_name}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            {submission.client_email}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Status</p>
          <p className="font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            {submission.status}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Estimated Total</p>
          <p className="font-semibold flex items-center gap-2 text-primary-600">
            <DollarSign className="w-4 h-4 text-gray-400" />
            ₹{getEstimatedTotal().toFixed(0)}
          </p>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT COLUMN - Upload Computation Bill */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <UploadIcon className="w-5 h-5 text-primary-500" />
              Upload Computation Bill
            </h3>
            
            {!isClient && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleUploadComputationFile}
                  className="hidden"
                  id="computation-file-upload"
                  ref={fileInputRef}
                  disabled={isUploading}
                />
                <label
                  htmlFor="computation-file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload computation bill</p>
                  <p className="text-xs text-gray-400">PDF, DOCX files accepted</p>
                  {isUploading && (
                    <div className="mt-2 flex items-center gap-2">
                      <Loader2 className="animate-spin w-4 h-4 text-primary-500" />
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </div>
                  )}
                </label>
              </div>
            )}

            {isClient && !computationBill && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No computation bill uploaded yet</p>
                <p className="text-xs">Please wait for your CA to upload the bill</p>
              </div>
            )}

            {isClient && computationBill && (
              <div className="text-center py-4 text-green-600 bg-green-50 rounded-lg border border-green-200">
                <FileCheck className="w-8 h-8 mx-auto text-green-500 mb-1" />
                <p className="text-sm font-medium">Computation bill uploaded</p>
                <p className="text-xs text-gray-500">{uploadedBillFileName}</p>
              </div>
            )}

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
                  <span className="text-xs text-gray-400">{uploadedFiles.length} file(s)</span>
                </div>
                <div className="space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div 
                      key={file.id || idx} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {getFileIcon(file.file_name)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{file.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.file_size)}
                            {file.uploaded_at && ` • ${format(new Date(file.uploaded_at), 'MMM dd, yyyy')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {file.url && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View File"
                          >
                            <Eye size={16} />
                          </a>
                        )}
                        {!isClient && (
                          <button
                            onClick={() => handleRemoveFile(file.id)}
                            disabled={isDeleting}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Computation Bill"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {!isClient && uploadedFiles.length > 0 && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Click the trash icon to delete the entire computation bill
                  </p>
                )}
              </div>
            )}
          </div>

          {/* OneDrive Files - View Only */}
          {submission.onedrive_upload_status === 'COMPLETED' && submission.document_links && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-blue-500" />
                  OneDrive Files
                  <span className="text-sm font-normal text-gray-400 ml-2">(View Only)</span>
                </h3>
                {submission.onedrive_folder_url && (
                  <a
                    href={submission.onedrive_folder_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in OneDrive
                  </a>
                )}
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {submission.document_links.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                    <div className="flex items-center gap-3">
                      {doc.type === 'Computation' ? (
                        <FileCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-500" />
                      )}
                      <span className="text-sm font-medium">{doc.name}</span>
                    </div>
                    <a
                      href={doc.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - Bills */}
        <div className="space-y-4">

          {/* Estimated Bill Section (View Only) */}
          {estimatedBill && estimatedBill.lines && estimatedBill.lines.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-gray-500" />
                      Estimated Bill
                      <span className="text-sm font-normal text-gray-400">(View Only)</span>
                    </h3>
                    <p className="text-sm text-gray-500">Submitted by client</p>
                  </div>
                  <span className="text-sm text-gray-400">
                    {estimatedBill.lines.length} items
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {estimatedBill.lines.map((line, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-primary-50 rounded-lg border border-primary-100">
                      <span className="text-sm">{line.label || line.description || 'Item'}</span>
                      <span className="font-semibold">₹{parseFloat(line.amount || 0).toFixed(0)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t-2 border-primary-200 text-sm font-semibold text-primary-700">
                    <span>Total</span>
                    <span>₹{getEstimatedTotal().toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Computation Bill Section */}
          {computationBill ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-primary-500" />
                      Computation Bill
                    </h3>
                    <p className="text-sm text-gray-500">
                      {uploadedBillFileName ? `From: ${uploadedBillFileName}` : 'Generated from documents'}
                    </p>
                    {computationBill.parsed_client_name && (
                      <p className="text-xs text-gray-400">
                        Client: {computationBill.parsed_client_name} 
                        {computationBill.parsed_pan && ` • PAN: ${computationBill.parsed_pan}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isClient && (computationBillStatus === 'DRAFT' || computationBillStatus === 'EDITED') && (
                      <>
                        <button
                          onClick={handleEditBill}
                          className="btn-outline flex items-center text-sm py-1.5 px-3"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={handleSendBill}
                          disabled={isSending}
                          className="btn-primary flex items-center text-sm py-1.5 px-3"
                        >
                          {isSending ? (
                            <Loader2 className="animate-spin w-4 h-4 mr-1" />
                          ) : (
                            <Send className="w-4 h-4 mr-1" />
                          )}
                          Send to Client
                        </button>
                      </>
                    )}
                    {isClient && computationBillStatus === 'SENT' && (
                      <button
                        onClick={handleConfirmBill}
                        disabled={isConfirming}
                        className="btn-success flex items-center text-sm py-1.5 px-3"
                      >
                        {isConfirming ? (
                          <Loader2 className="animate-spin w-4 h-4 mr-1" />
                        ) : (
                          <Check className="w-4 h-4 mr-1" />
                        )}
                        Confirm Bill
                      </button>
                    )}
                    {!isClient && computationBillStatus === 'CONFIRMED' && (
                      <button
                        onClick={() => safeToast.info('Client has confirmed the bill')}
                        className="btn-success flex items-center text-sm py-1.5 px-3"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Client Confirmed
                      </button>
                    )}
                    {isClient && computationBillStatus === 'CONFIRMED' && (
                      <button
                        onClick={handleProceedFurther}
                        className="btn-primary flex items-center text-sm py-1.5 px-3"
                      >
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Proceed Further
                      </button>
                    )}
                    {!isClient && computationBillStatus === 'FINALIZED' && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Finalized
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4">
                {!isEditing ? (
                  <div className="space-y-3">
                    {/* Fee Components */}
                    {computationBill.fee_components && computationBill.fee_components.length > 0 ? (
                      computationBill.fee_components.map((comp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{comp.label}</span>
                              {comp.is_base && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Base</span>
                              )}
                              {comp.is_extra && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Extra</span>
                              )}
                              {comp.source === 'manual' && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Manual</span>
                              )}
                              {comp.source === 'document' && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Detected</span>
                              )}
                              {comp.source === 'auto_matched' && (
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Auto-Matched</span>
                              )}
                            </div>
                            {comp.document_name && comp.document_name !== 'Manual Entry' && comp.document_name !== 'Base Fee' && (
                              <p className="text-xs text-gray-500">From: {comp.document_name}</p>
                            )}
                            {comp.fee_name && comp.fee_name !== comp.label && (
                              <p className="text-xs text-gray-400">Fee: {comp.fee_name}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">₹{comp.amount.toFixed(0)}</span>
                            {comp.gst && (
                              <p className="text-xs text-gray-400">+ GST: ₹{comp.gst.toFixed(0)}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">No fee components found</p>
                        <p className="text-xs">Upload a computation bill to auto-detect components</p>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                      <span className="text-lg font-bold">Total</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-primary-600">
                          ₹{getTotal(computationBill.fee_components || []).toFixed(0)}
                        </span>
                        {computationBill.total_gst && (
                          <p className="text-xs text-gray-500">Includes GST: ₹{computationBill.total_gst?.toFixed(0) || '0'}</p>
                        )}
                      </div>
                    </div>

                    {computationBill.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600">{computationBill.notes}</p>
                      </div>
                    )}

                    {computationBill.parse_error && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-600 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {computationBill.parse_error}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Edit Fee Components</h4>
                      <button
                        onClick={addFeeComponent}
                        className="btn-outline text-sm py-1 px-3 flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Component
                      </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                      {editingComponents.map((comp, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={comp.label || ''}
                              onChange={(e) => updateFeeComponent(idx, 'label', e.target.value)}
                              placeholder="Label"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            />
                            <input
                              type="number"
                              value={comp.amount || 0}
                              onChange={(e) => updateFeeComponent(idx, 'amount', parseFloat(e.target.value) || 0)}
                              placeholder="Amount"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            />
                          </div>
                          <button
                            onClick={() => removeFeeComponent(idx)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-bold text-primary-600">
                        ₹{getTotal(editingComponents).toFixed(0)}
                      </span>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                        placeholder="Add notes for the client..."
                        rows="3"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBill}
                        disabled={isSaving}
                        className="btn-primary flex items-center"
                      >
                        {isSaving ? (
                          <Loader2 className="animate-spin w-4 h-4 mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // No Computation Bill
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 text-center">
              <FileCheck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No Computation Bill</p>
              <p className="text-sm text-gray-400 mt-1">
                {isClient ? 'Please wait for your CA to upload the bill' : 'Upload a computation bill to get started'}
              </p>
            </div>
          )}

          {/* Upload to OneDrive Button (CA Only) */}
          {!isClient && computationBillStatus === 'FINALIZED' && submission.onedrive_upload_status !== 'COMPLETED' && (
            <div className="bg-white rounded-xl shadow-sm p-4 border border-blue-200 bg-blue-50">
              <button
                onClick={handleUploadToOneDrive}
                disabled={isUploadingToOneDrive}
                className="w-full btn-primary flex items-center justify-center text-sm py-2.5 disabled:opacity-50"
              >
                {isUploadingToOneDrive ? (
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                ) : (
                  <>
                    <Cloud className="w-4 h-4 mr-2" />
                    Upload to OneDrive
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Upload the final bill and documents to OneDrive
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {computationBillStatus === 'SENT' && isClient && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Please review the computation bill and confirm it to proceed.
          </p>
        </div>
      )}

      {computationBillStatus === 'CONFIRMED' && !isClient && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Client has confirmed the bill. You can now upload to OneDrive.
          </p>
        </div>
      )}

      {computationBillStatus === 'CONFIRMED' && isClient && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Bill confirmed! Click "Proceed Further" to continue.
          </p>
        </div>
      )}
    </DashboardLayout>
  )
}

export default ComputationBill