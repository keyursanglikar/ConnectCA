// src/api/document.api.js
import axios from './axios.config'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const documentApi = {
  // Upload document
  uploadDocument: async (formData) => {
    const response = await axios.post(
      `${API_URL}/documents/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  // Get client documents
  getClientDocuments: async (clientId) => {
    const response = await axios.get(`${API_URL}/documents/client/${clientId}`)
    return response.data
  },

  // Get document details
  getDocument: async (documentId) => {
    const response = await axios.get(`${API_URL}/documents/${documentId}`)
    return response.data
  },

  // Delete document
  deleteDocument: async (documentId) => {
    const response = await axios.delete(`${API_URL}/documents/${documentId}`)
    return response.data
  },

  // Update document status
  updateStatus: async (documentId, status, remarks = null) => {
    const response = await axios.patch(
      `${API_URL}/documents/${documentId}/status`,
      { status, remarks }
    )
    return response.data
  },

  // Confirm fee for document
  confirmFee: async (documentId) => {
    const response = await axios.post(
      `${API_URL}/documents/${documentId}/confirm-fee`
    )
    return response.data
  },

  // Get documents by submission
  getDocumentsBySubmission: async (submissionId) => {
    const response = await axios.get(`${API_URL}/documents/submission/${submissionId}`)
    return response.data
  }
}