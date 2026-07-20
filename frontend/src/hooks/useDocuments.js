import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../api/axios.config'
import { API_ENDPOINTS } from '../utils/constants'
import { toast } from 'sonner'

// Fetch all documents
const fetchDocuments = async (params) => {
  const response = await axiosInstance.get(API_ENDPOINTS.DOCUMENTS.BASE, { params })
  return response.data
}

// Upload document
const uploadDocument = async (data) => {
  const formData = new FormData()
  formData.append('file', data.file)
  formData.append('client_id', data.clientId)
  formData.append('fy_id', data.fyId)
  formData.append('file_title', data.fileTitle)
  
  const response = await axiosInstance.post(API_ENDPOINTS.DOCUMENTS.BASE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

// Update document status
const updateDocumentStatus = async ({ id, status }) => {
  const response = await axiosInstance.put(API_ENDPOINTS.DOCUMENTS.STATUS(id), { status })
  return response.data
}

// Delete document
const deleteDocument = async (id) => {
  const response = await axiosInstance.delete(API_ENDPOINTS.DOCUMENTS.BY_ID(id))
  return response.data
}

// Download document
const downloadDocument = async (id) => {
  const response = await axiosInstance.get(API_ENDPOINTS.DOCUMENTS.DOWNLOAD(id), {
    responseType: 'blob',
  })
  return response.data
}

export const useDocuments = (params = {}) => {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => fetchDocuments(params),
    staleTime: 5 * 60 * 1000,
  })
}

export const useUploadDocument = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document uploaded successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to upload document')
    },
  })
}

export const useUpdateDocumentStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateDocumentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document status updated!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update document status')
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document deleted successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete document')
    },
  })
}

export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: downloadDocument,
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to download document')
    },
  })
}