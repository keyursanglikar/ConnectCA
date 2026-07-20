import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../api/axios.config'
import { API_ENDPOINTS } from '../utils/constants'
import { toast } from 'sonner'

// Fetch all invoices
const fetchInvoices = async (params) => {
  const response = await axiosInstance.get(API_ENDPOINTS.INVOICES.BASE, { params })
  return response.data
}

// Fetch single invoice
const fetchInvoice = async (id) => {
  const response = await axiosInstance.get(API_ENDPOINTS.INVOICES.BY_ID(id))
  return response.data
}

// Create invoice
const createInvoice = async (data) => {
  const response = await axiosInstance.post(API_ENDPOINTS.INVOICES.BASE, data)
  return response.data
}

// Update invoice
const updateInvoice = async ({ id, data }) => {
  const response = await axiosInstance.put(API_ENDPOINTS.INVOICES.BY_ID(id), data)
  return response.data
}

// Send invoice
const sendInvoice = async (id) => {
  const response = await axiosInstance.post(API_ENDPOINTS.INVOICES.SEND(id))
  return response.data
}

// Generate payment link
const generatePaymentLink = async (id) => {
  const response = await axiosInstance.post(API_ENDPOINTS.INVOICES.PAYMENT_LINK(id))
  return response.data
}

export const useInvoices = (params = {}) => {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => fetchInvoices(params),
    staleTime: 5 * 60 * 1000,
  })
}

export const useInvoice = (id) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => fetchInvoice(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export const useCreateInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice created successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create invoice')
    },
  })
}

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateInvoice,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] })
      toast.success('Invoice updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update invoice')
    },
  })
}

export const useSendInvoice = () => {
  return useMutation({
    mutationFn: sendInvoice,
    onSuccess: () => {
      toast.success('Invoice sent successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to send invoice')
    },
  })
}

export const useGeneratePaymentLink = () => {
  return useMutation({
    mutationFn: generatePaymentLink,
    onSuccess: (data) => {
      toast.success('Payment link generated!')
      return data
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to generate payment link')
    },
  })
}