// src/api/bill.api.js
import axios from './axios.config'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const billApi = {
  // Get client bills
  getClientBills: async (clientId, status = null) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    const response = await axios.get(`${API_URL}/bills/client/${clientId}?${params}`)
    return response.data
  },

  // Get bill details
  getBill: async (billId) => {
    const response = await axios.get(`${API_URL}/bills/${billId}`)
    return response.data
  },

  // Update bill
  updateBill: async (billId, data) => {
    const response = await axios.put(`${API_URL}/bills/${billId}`, data)
    return response.data
  },

  // Delete bill
  deleteBill: async (billId) => {
    const response = await axios.delete(`${API_URL}/bills/${billId}`)
    return response.data
  },

  // Accept bill
  acceptBill: async (billId) => {
    const response = await axios.post(`${API_URL}/bills/${billId}/accept`)
    return response.data
  },

  // Reject bill
  rejectBill: async (billId, notes = null) => {
    const response = await axios.post(
      `${API_URL}/bills/${billId}/reject`,
      { notes }
    )
    return response.data
  },

  // Mark bill as paid
  markPaid: async (billId) => {
    const response = await axios.post(`${API_URL}/bills/${billId}/paid`)
    return response.data
  },

  // Get bill stats for CA
  getStats: async () => {
    const response = await axios.get(`${API_URL}/bills/stats`)
    return response.data
  }
}