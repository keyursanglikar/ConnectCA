// src/api/submission.api.js
import axios from './axios.config'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const submissionApi = {
  // ============ SUBMISSIONS ============
  
  // Get all submissions for CA
  getSubmissions: async (status = null, skip = 0, limit = 50) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    params.append('skip', skip)
    params.append('limit', limit)
    
    const response = await axios.get(`${API_URL}/submissions?${params}`)
    return response.data
  },

  // Get submission details
  getSubmission: async (submissionId) => {
    const response = await axios.get(`${API_URL}/submissions/${submissionId}`)
    return response.data
  },

  // Get client's submissions
  getClientSubmissions: async () => {
    const response = await axios.get(`${API_URL}/client/my-submissions`)
    return response.data
  },

  // Create submission (Client)
  createSubmission: async (submissionData) => {
    const response = await axios.post(`${API_URL}/submissions`, submissionData)
    return response.data
  },

  // Update submission status (CA)
  updateStatus: async (submissionId, status, notes = null) => {
    const response = await axios.patch(
      `${API_URL}/submissions/${submissionId}/status`,
      { status, notes }
    )
    return response.data
  },

  // ============ DOCUMENTS ============
  
  // Upload documents (CA)
  uploadDocuments: async (submissionId, files) => {
    const formData = new FormData()
    for (let file of files) {
      formData.append('files', file)
    }
    const response = await axios.post(
      `${API_URL}/submissions/${submissionId}/upload-documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  // Get documents for a submission
  getDocuments: async (submissionId) => {
    const response = await axios.get(`${API_URL}/submissions/${submissionId}/documents`)
    return response.data
  },

  // Delete document (CA)
  deleteDocument: async (submissionId, documentId) => {
    const response = await axios.delete(`${API_URL}/submissions/${submissionId}/documents/${documentId}`)
    return response.data
  },

  // Upload computation (CA)
  uploadComputation: async (submissionId, computationLink, fileName = null) => {
    const response = await axios.post(
      `${API_URL}/submissions/${submissionId}/upload-computation`,
      { computation_link: computationLink, file_name: fileName }
    )
    return response.data
  },

  // ============ BILLS ============
  
  // Generate bill (CA)
  generateBill: async (submissionId, notes = null) => {
    const response = await axios.post(
      `${API_URL}/submissions/${submissionId}/generate-bill`,
      { notes }
    )
    return response.data
  },

  // Edit bill (CA)
  editBill: async (billId, items, notes = null) => {
    const response = await axios.put(
      `${API_URL}/submissions/edit-bill`,
      { bill_id: billId, items, notes }
    )
    return response.data
  },

  // Send bill to client (CA)
  sendBillToClient: async (submissionId) => {
    const response = await axios.post(
      `${API_URL}/submissions/${submissionId}/send-bill`
    )
    return response.data
  },

  // Confirm bill (Client)
  confirmBill: async (submissionId) => {
    const response = await axios.post(
      `${API_URL}/submissions/${submissionId}/confirm-bill`
    )
    return response.data
  },

  // ============ COMPUTATION BILL ============
  
  // Create computation bill (CA)
  createComputationBill: async (submissionId, adjustments = {}) => {
    const response = await axios.post(
      `${API_URL}/submissions/${submissionId}/computation-bill/create`,
      { adjustments }
    )
    return response.data
  },

  // Get computation bill
  getComputationBill: async (submissionId) => {
    const response = await axios.get(`${API_URL}/submissions/${submissionId}/computation-bill`)
    return response.data
  },

  // Update computation bill (CA)
  updateComputationBill: async (submissionId, feeComponents, notes = null) => {
    const response = await axios.put(
      `${API_URL}/submissions/${submissionId}/computation-bill/update`,
      { fee_components: feeComponents, notes }
    )
    return response.data
  },

  // Send computation bill to client (CA)
  sendComputationBill: async (submissionId) => {
    const response = await axios.post(
      `${API_URL}/submissions/${submissionId}/computation-bill/send`
    )
    return response.data
  },

  // Confirm computation bill (Client)
  confirmComputationBill: async (submissionId) => {
    const response = await axios.post(
      `${API_URL}/submissions/${submissionId}/computation-bill/confirm`
    )
    return response.data
  },

  // Finalize computation bill (CA)
  finalizeComputationBill: async (submissionId) => {
    const response = await axios.post(
      `${API_URL}/submissions/${submissionId}/computation-bill/finalize`
    )
    return response.data
  },

  // Upload computation bill file (CA)
  uploadComputationBillFile: async (submissionId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await axios.post(
      `${API_URL}/submissions/${submissionId}/upload-computation-bill`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  // ============ ONEDRIVE ============
  
  // Upload to OneDrive (CA)
  uploadToOneDrive: async (submissionId) => {
    const response = await axios.post(
      `${API_URL}/submissions/${submissionId}/upload-to-onedrive`
    )
    return response.data
  },

  // Get OneDrive files
  getOneDriveFiles: async (submissionId) => {
    const response = await axios.get(`${API_URL}/submissions/${submissionId}/onedrive-files`)
    return response.data
  },

  // ============ CLIENT ACTIONS ============
  
  // Proceed further (Client)
  proceedFurther: async (submissionId) => {
    const response = await axios.post(
      `${API_URL}/submissions/${submissionId}/proceed`
    )
    return response.data
  },

  // Submit documents to CA (Client)
  submitToCA: async (submissionId) => {
    const response = await axios.post(
      `${API_URL}/client/submissions/${submissionId}/submit`
    )
    return response.data
  },

  // ============ BILLS (Legacy/Regular) ============
  
  // Get bill details
  getBill: async (billId) => {
    const response = await axios.get(`${API_URL}/bills/${billId}`)
    return response.data
  },

  // Get all bills
  getBills: async (status = null) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    const response = await axios.get(`${API_URL}/bills?${params}`)
    return response.data
  }
}

export default submissionApi