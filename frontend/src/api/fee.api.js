// src/api/fee.api.js
import axios from './axios.config'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const feeApi = {
  // Get fee pamphlet status
  getMyPamplateStatus: async () => {
    const response = await axios.get(`${API_URL}/fees/my-pamplate/status`)
    return response.data
  },

  // Get full fee pamphlet
  getMyPamplate: async () => {
    const response = await axios.get(`${API_URL}/fees/my-pamplate`)
    return response.data
  },

  // Accept fee pamphlet
  acceptPamplate: async (pamplateId) => {
    const response = await axios.post(`${API_URL}/fees/my-pamplate/${pamplateId}/accept`)
    return response.data
  },

  // Reject fee pamphlet
  rejectPamplate: async (pamplateId) => {
    const response = await axios.post(`${API_URL}/fees/my-pamplate/${pamplateId}/reject`)
    return response.data
  }
}