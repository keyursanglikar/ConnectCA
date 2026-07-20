import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '../api/axios.config'
import { API_ENDPOINTS } from '../utils/constants'
import { toast } from 'sonner'

// Fetch all clients
const fetchClients = async (params) => {
  const response = await axiosInstance.get(API_ENDPOINTS.CLIENTS.BASE, { params })
  return response.data
}

// Fetch single client
const fetchClient = async (id) => {
  const response = await axiosInstance.get(API_ENDPOINTS.CLIENTS.BY_ID(id))
  return response.data
}

// Create client
const createClient = async (data) => {
  const response = await axiosInstance.post(API_ENDPOINTS.CLIENTS.BASE, data)
  return response.data
}

// Update client
const updateClient = async ({ id, data }) => {
  const response = await axiosInstance.put(API_ENDPOINTS.CLIENTS.BY_ID(id), data)
  return response.data
}

// Delete client
const deleteClient = async (id) => {
  const response = await axiosInstance.delete(API_ENDPOINTS.CLIENTS.BY_ID(id))
  return response.data
}

// Send credentials
const sendCredentials = async (id) => {
  const response = await axiosInstance.post(API_ENDPOINTS.CLIENTS.SEND_CREDENTIALS(id))
  return response.data
}

export const useClients = (params = {}) => {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => fetchClients(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useClient = (id) => {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => fetchClient(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export const useCreateClient = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client created successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create client')
    },
  })
}

export const useUpdateClient = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateClient,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] })
      toast.success('Client updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update client')
    },
  })
}

export const useDeleteClient = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client deleted successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete client')
    },
  })
}

export const useSendCredentials = () => {
  return useMutation({
    mutationFn: sendCredentials,
    onSuccess: () => {
      toast.success('Credentials sent successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to send credentials')
    },
  })
}