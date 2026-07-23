import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/common/Layout/DashboardLayout.jsx'
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  CreditCard, 
  FileText, 
  Calendar,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import axios from 'axios'
import safeToast from '../../utils/toast'

const CreateClient = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [financialYears, setFinancialYears] = useState([])
  
  const [formData, setFormData] = useState({
    // Personal Details
    name: '',
    email: '',
    phone: '',
    dob: '',
    client_type: 'INDIVIDUAL',  // Changed to uppercase
    pan_number: '',
    aadhaar_number: '',
    address: '',
    business_name: '',
    gst_number: '',
    
    // Financial Year (optional)
    financial_year: '',
    
    // Send credentials
    send_credentials: true
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchFinancialYears()
  }, [])

  const fetchFinancialYears = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      const response = await axios.get(`${API_URL}/financial-years`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setFinancialYears(response.data || [])
    } catch (error) {
      console.error('Error fetching financial years:', error)
      // Use default years if API fails
      setFinancialYears([
        { id: 1, year: '2023-24' },
        { id: 2, year: '2024-25' },
        { id: 3, year: '2025-26' }
      ])
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name) newErrors.name = 'Full name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits'
    }
    
    if (formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number.toUpperCase())) {
      newErrors.pan_number = 'PAN number is invalid (e.g., ABCDE1234F)'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      safeToast.error('Please fix the errors in the form')
      return
    }

    setIsLoading(true)
    
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      // Format date with time for backend
      const formattedDob = formData.dob ? `${formData.dob}T00:00:00` : null
      
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone ? formData.phone.trim() : null,
        dob: formattedDob,
        client_type: formData.client_type,  // Already uppercase
        pan_number: formData.pan_number ? formData.pan_number.trim().toUpperCase() : null,
        aadhaar_number: formData.aadhaar_number ? formData.aadhaar_number.trim() : null,
        address: formData.address || null,
        business_name: formData.business_name || null,
        gst_number: formData.gst_number ? formData.gst_number.trim().toUpperCase() : null,
        financial_year: formData.financial_year || null,
        send_credentials: formData.send_credentials
      }
      
      console.log('📤 Sending payload:', JSON.stringify(payload, null, 2))
      
      const response = await axios.post(
        `${API_URL}/clients`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.status === 200 || response.status === 201) {
        safeToast.success('Client created successfully!')
        
        if (formData.send_credentials) {
          safeToast.info(`📧 Login credentials sent to ${formData.email}`)
          safeToast.info('🔗 Client can login using the link in email')
        }
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          dob: '',
          client_type: 'INDIVIDUAL',  // Reset to uppercase
          pan_number: '',
          aadhaar_number: '',
          address: '',
          business_name: '',
          gst_number: '',
          financial_year: '',
          send_credentials: true
        })
        
        setTimeout(() => {
          navigate('/ca/clients')
        }, 3000)
      }
    } catch (error) {
      console.error('❌ Error creating client:', error)
      
      let errorMsg = 'Failed to create client'
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
          errorMsg = detail
        } else if (Array.isArray(detail)) {
          const messages = detail.map(err => {
            const field = err.loc?.slice(1).join('.') || 'field'
            return `${field}: ${err.msg}`
          }).join(', ')
          errorMsg = messages
        }
      }
      
      safeToast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Client</h1>
            <p className="text-gray-500 mt-1">Client will receive login credentials via email</p>
          </div>
          <button
            onClick={() => navigate('/ca/clients')}
            className="btn-outline flex items-center"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary-500" />
              Personal Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="9876543210"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-primary-500" />
              Business Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Client Type
                </label>
                <select
                  value={formData.client_type}
                  onChange={(e) => setFormData({ ...formData, client_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="BUSINESS">Business</option>
                  <option value="HUF">HUF</option>
                  <option value="PARTNERSHIP">Partnership</option>
                  <option value="COMPANY">Company</option>
                  <option value="LLP">LLP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Business name (if applicable)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  PAN Number
                </label>
                <input
                  type="text"
                  value={formData.pan_number}
                  onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.pan_number ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="ABCDE1234F"
                />
                {errors.pan_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.pan_number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  value={formData.aadhaar_number}
                  onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="123456789012"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  GST Number
                </label>
                <input
                  type="text"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="22ABCDE1234F1Z5 (optional)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[80px]"
                    placeholder="123, Main Street, City, State - 123456"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Financial Year (Optional) */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary-500" />
              Financial Year (Optional)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Financial Year
                </label>
                <select
                  value={formData.financial_year}
                  onChange={(e) => setFormData({ ...formData, financial_year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Financial Year (Optional)</option>
                  {financialYears.map((fy) => (
                    <option key={fy.id} value={fy.year}>
                      {fy.year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Send Credentials Option */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.send_credentials}
                onChange={(e) => setFormData({ ...formData, send_credentials: e.target.checked })}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <label className="text-sm text-gray-700">
                Send login credentials via email automatically
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Client will receive an email with their username, password, and login link
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/ca/clients')}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex items-center px-6 py-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Client & Send Credentials
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default CreateClient