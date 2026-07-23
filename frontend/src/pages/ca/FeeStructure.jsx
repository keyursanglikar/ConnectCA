// src/pages/ca/FeeStructure.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/common/Layout/DashboardLayout.jsx'
import { 
  Plus, Edit, Trash2, DollarSign, Search, X, Save, Loader2,
  CheckCircle, AlertCircle, RefreshCw, FileText, Tags,
  Star, Sparkles, Send, Receipt, ClipboardList, FileSpreadsheet,
  Printer, Download, Eye, EyeOff, RotateCcw, ChevronDown, ChevronRight,
  Percent, Layers, Briefcase, TrendingUp, Globe, Building2,
  Hash, Info, User, Mail, Building, Calendar, Clock
} from 'lucide-react'
import axios from 'axios'
import safeToast from '../../utils/toast.js'

// Fee Type Colors
const FEE_TYPE_COLORS = {
  basic: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: 'FileText' },
  capital_gains: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: 'TrendingUp' },
  business: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: 'Briefcase' },
  nri: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: 'Globe' },
  foreign_income: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: 'Building2' },
  other: { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: 'Layers' }
}

const FeeStructure = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [fees, setFees] = useState([])
  const [clients, setClients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingFee, setEditingFee] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [deletingName, setDeletingName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hoveredFee, setHoveredFee] = useState(null)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedFeeIds, setSelectedFeeIds] = useState([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showAllFees, setShowAllFees] = useState(true)
  const [isInitializing, setIsInitializing] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    defaults: true,
    custom: true
  })

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    base_fee: '',
    gst_rate: 18,
    keywords: '',
    fee_type: 'basic',
    is_active: true
  })

  const [errors, setErrors] = useState({})

  const feeTypes = [
    { value: 'all', label: 'All Services' },
    { value: 'basic', label: 'Basic ITR' },
    { value: 'capital_gains', label: 'Capital Gains' },
    { value: 'business', label: 'Business Income' },
    { value: 'nri', label: 'NRI' },
    { value: 'foreign_income', label: 'Foreign Income' },
    { value: 'other', label: 'Other Services' }
  ]

  useEffect(() => {
    fetchFees()
    fetchClients()
  }, [])

  const fetchFees = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      const response = await axios.get(`${API_URL}/fees/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setFees(response.data || [])
    } catch (error) {
      console.error('Error fetching fees:', error)
      safeToast.error('Failed to load fee structure')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      const response = await axios.get(`${API_URL}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setClients(response.data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

const handleInitializeDefaults = async () => {
  setIsInitializing(true)
  try {
    const token = localStorage.getItem('access_token')
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    
    // This will now only create missing default fees
    const response = await axios.post(
      `${API_URL}/fees/initialize`,
      {},
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    
    // Show appropriate message
    if (response.data.created_count > 0) {
      safeToast.success(`${response.data.created_count} default fees added!`)
    } else if (response.data.existing_count > 0) {
      safeToast.info(`All ${response.data.existing_count} default fees already exist`)
    } else {
      safeToast.info('No changes made - all default fees are already present')
    }
    
    await fetchFees()
  } catch (error) {
    console.error('Error initializing fees:', error)
    safeToast.error('Failed to initialize default fees')
  } finally {
    setIsInitializing(false)
  }
}
  const validateForm = () => {
    const newErrors = {}
    if (!formData.name) newErrors.name = 'Name is required'
    if (!formData.code) newErrors.code = 'Code is required'
    if (!formData.base_fee) newErrors.base_fee = 'Base fee is required'
    else if (parseFloat(formData.base_fee) < 0) newErrors.base_fee = 'Fee must be greater than 0'
    
    // Check for duplicate code (excluding the current editing fee)
    const duplicate = fees.find(f => 
      f.code === formData.code.toUpperCase() && 
      f.id !== editingFee?.id
    )
    if (duplicate) {
      newErrors.code = `Fee with code '${formData.code}' already exists`
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

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      const payload = {
        ...formData,
        base_fee: parseFloat(formData.base_fee),
        gst_rate: parseFloat(formData.gst_rate),
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
      }
      
      if (editingFee) {
        await axios.put(
          `${API_URL}/fees/categories/${editingFee.id}`,
          payload,
          { headers: { 'Authorization': `Bearer ${token}` } }
        )
        safeToast.success('Fee category updated successfully!')
      } else {
        await axios.post(
          `${API_URL}/fees/categories`,
          payload,
          { headers: { 'Authorization': `Bearer ${token}` } }
        )
        safeToast.success('Fee category created successfully!')
      }
      
      setShowModal(false)
      resetForm()
      await fetchFees()
    } catch (error) {
      console.error('Error saving fee:', error)
      safeToast.error(error.response?.data?.detail || 'Failed to save fee category')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      await axios.delete(
        `${API_URL}/fees/categories/${deletingId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      safeToast.success('Fee category deleted successfully!')
      setShowDeleteConfirm(false)
      setDeletingId(null)
      setDeletingName('')
      await fetchFees()
    } catch (error) {
      console.error('Error deleting fee:', error)
      if (error.response?.status === 400) {
        safeToast.error('Cannot delete: This fee is being used by existing clients')
      } else {
        safeToast.error('Failed to delete fee category')
      }
    }
  }

  const handlePublishPamplate = async () => {
    if (!selectedClientId) {
      safeToast.error('Please select a client')
      return
    }
    
    if (selectedFeeIds.length === 0) {
      safeToast.error('Please select at least one fee to publish')
      return
    }

    setIsPublishing(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      const payload = {
        client_id: parseInt(selectedClientId),
        fee_ids: selectedFeeIds.map(id => parseInt(id))
      }
      
      await axios.post(
        `${API_URL}/fees/publish`,
        payload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      safeToast.success('Fee pamplate published successfully!')
      setShowPublishModal(false)
      setSelectedClientId('')
      setSelectedFeeIds([])
      await fetchFees()
      safeToast.info('Client can now view their fee pamplate')
    } catch (error) {
      console.error('Error publishing fee pamplate:', error)
      safeToast.error(error.response?.data?.detail || 'Failed to publish fee pamplate')
    } finally {
      setIsPublishing(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      base_fee: '',
      gst_rate: 18,
      keywords: '',
      fee_type: 'basic',
      is_active: true
    })
    setEditingFee(null)
    setErrors({})
  }

  const openCreateModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (fee) => {
    setEditingFee(fee)
    setFormData({
      name: fee.name,
      code: fee.code,
      description: fee.description || '',
      base_fee: fee.base_fee,
      gst_rate: fee.gst_rate,
      keywords: (fee.keywords || []).join(', '),
      fee_type: fee.fee_type || 'basic',
      is_active: fee.is_active
    })
    setErrors({})
    setShowModal(true)
  }

  const openDeleteConfirm = (fee) => {
    setDeletingId(fee.id)
    setDeletingName(fee.name)
    setShowDeleteConfirm(true)
  }

  const toggleFeeSelection = (feeId) => {
    setSelectedFeeIds(prev => 
      prev.includes(feeId) 
        ? prev.filter(id => id !== feeId)
        : [...prev, feeId]
    )
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const calculateTotal = (fee) => {
    return parseFloat(fee.base_fee) * (1 + parseFloat(fee.gst_rate) / 100)
  }

  const getFeeTypeColor = (type) => {
    return FEE_TYPE_COLORS[type] || FEE_TYPE_COLORS.other
  }

  const getFeeTypeLabel = (type) => {
    const found = feeTypes.find(t => t.value === type)
    return found ? found.label : type
  }

  // Split fees into Default and Custom
  const defaultFees = fees.filter(f => f.is_system_default === true)
  const customFees = fees.filter(f => f.is_system_default === false)

  // Filter based on search
  const filteredDefaultFees = defaultFees.filter(fee => {
    return fee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fee.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  })

  const filteredCustomFees = customFees.filter(fee => {
    return fee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fee.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Filter by type for the right side preview
  const filteredFees = fees.filter(fee => {
    const matchesSearch = fee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fee.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || fee.fee_type === selectedType
    return matchesSearch && matchesType
  })

  const totalActiveFees = fees.filter(f => f.is_active).length
  const totalPublishedFees = fees.filter(f => f.is_published).length
  const totalRevenue = fees.reduce((sum, f) => sum + parseFloat(f.base_fee), 0)

  // Get client name by ID
  const getClientName = (id) => {
    const client = clients.find(c => c.id === parseInt(id))
    return client ? client.name : 'Unknown Client'
  }

  return (
    <DashboardLayout 
      title="Fee Structure" 
      subtitle="Manage your service fees and publish pamplate to clients"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-xl">
              <Receipt className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Fee Structure</h1>
              <p className="text-sm text-gray-500">Manage your service fees and publish pamplate to clients</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search fees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              {feeTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <button
              onClick={fetchFees}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleInitializeDefaults}
              disabled={isInitializing}
              className="btn-outline flex items-center text-sm px-3 py-2"
            >
              {isInitializing ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-1" />
              )}
              Defaults
            </button>
            <button
              onClick={() => setShowPublishModal(true)}
              className="btn-secondary flex items-center text-sm px-3 py-2"
            >
              <Send className="w-4 h-4 mr-1" />
              Publish
            </button>
            <button
              onClick={openCreateModal}
              className="btn-primary flex items-center text-sm px-3 py-2"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Fee
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
            <p className="text-xs text-gray-500">Total Services</p>
            <p className="text-xl font-bold text-gray-900">{fees.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
            <p className="text-xs text-gray-500">Default Fees</p>
            <p className="text-xl font-bold text-yellow-600">{defaultFees.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
            <p className="text-xs text-gray-500">Custom Fees</p>
            <p className="text-xl font-bold text-purple-600">{customFees.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
            <p className="text-xs text-gray-500">Published</p>
            <p className="text-xl font-bold text-blue-600">{totalPublishedFees}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
            <p className="text-xs text-gray-500">Total Value</p>
            <p className="text-xl font-bold text-primary-600">₹{totalRevenue.toFixed(0)}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[calc(100vh-380px)]">
          {/* Left Side - Categories */}
          <div className="lg:col-span-4 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex flex-col">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                  <ClipboardList className="w-4 h-4 text-primary-500" />
                  Fee Categories
                </h3>
                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full shadow-sm">{fees.length} items</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
                </div>
              ) : fees.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                  <FileText className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm font-medium">No fee categories found</p>
                  <p className="text-xs">Click "Defaults" or "Add Fee"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Default Fees Section */}
                  {filteredDefaultFees.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection('defaults')}
                        className="w-full flex items-center justify-between px-3 py-2 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold text-sm text-gray-900">Default Fees</span>
                          <span className="text-xs text-gray-500">({filteredDefaultFees.length})</span>
                        </div>
                        {expandedSections.defaults ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      {expandedSections.defaults && (
                        <div className="p-1 space-y-0.5 bg-white">
                          {filteredDefaultFees.map((fee) => (
                            <div
                              key={fee.id}
                              onMouseEnter={() => setHoveredFee(fee.id)}
                              onMouseLeave={() => setHoveredFee(null)}
                              className={`group-item flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                                selectedFeeIds.includes(fee.id) ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'
                              } ${!fee.is_active ? 'opacity-60' : ''}`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <input
                                  type="checkbox"
                                  checked={selectedFeeIds.includes(fee.id)}
                                  onChange={() => toggleFeeSelection(fee.id)}
                                  className="w-3.5 h-3.5 text-primary-500 border-gray-300 rounded focus:ring-primary-500 flex-shrink-0"
                                  disabled={!fee.is_active}
                                />
                                <span className="text-sm truncate">{fee.name}</span>
                                <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500 flex-shrink-0" title="Default fee" />
                                {fee.is_published && (
                                  <span className="text-[8px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full flex-shrink-0">Published</span>
                                )}
                                {!fee.is_active && (
                                  <span className="text-[8px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full flex-shrink-0">Inactive</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span className="text-sm font-medium text-gray-700">₹{parseFloat(fee.base_fee).toFixed(0)}</span>
                                <button
                                  onClick={() => openEditModal(fee)}
                                  className={`p-1 rounded transition-all duration-200 ${
                                    hoveredFee === fee.id 
                                      ? 'text-blue-600 bg-blue-50 opacity-100' 
                                      : 'text-gray-400 opacity-0 group-hover:opacity-100'
                                  }`}
                                  title="Edit fee"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  className="p-1 rounded text-gray-300 cursor-not-allowed opacity-40"
                                  title="Default fees cannot be deleted"
                                  disabled
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom Fees Section */}
                  {filteredCustomFees.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection('custom')}
                        className="w-full flex items-center justify-between px-3 py-2 bg-purple-50 hover:bg-purple-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <span className="font-semibold text-sm text-gray-900">Custom Fees</span>
                          <span className="text-xs text-gray-500">({filteredCustomFees.length})</span>
                        </div>
                        {expandedSections.custom ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      {expandedSections.custom && (
                        <div className="p-1 space-y-0.5 bg-white">
                          {filteredCustomFees.map((fee) => (
                            <div
                              key={fee.id}
                              onMouseEnter={() => setHoveredFee(fee.id)}
                              onMouseLeave={() => setHoveredFee(null)}
                              className={`group-item flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                                selectedFeeIds.includes(fee.id) ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-50'
                              } ${!fee.is_active ? 'opacity-60' : ''}`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <input
                                  type="checkbox"
                                  checked={selectedFeeIds.includes(fee.id)}
                                  onChange={() => toggleFeeSelection(fee.id)}
                                  className="w-3.5 h-3.5 text-primary-500 border-gray-300 rounded focus:ring-primary-500 flex-shrink-0"
                                  disabled={!fee.is_active}
                                />
                                <span className="text-sm truncate">{fee.name}</span>
                                {fee.is_published && (
                                  <span className="text-[8px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full flex-shrink-0">Published</span>
                                )}
                                {!fee.is_active && (
                                  <span className="text-[8px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full flex-shrink-0">Inactive</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <span className="text-sm font-medium text-gray-700">₹{parseFloat(fee.base_fee).toFixed(0)}</span>
                                <button
                                  onClick={() => openEditModal(fee)}
                                  className={`p-1 rounded transition-all duration-200 ${
                                    hoveredFee === fee.id 
                                      ? 'text-blue-600 bg-blue-50 opacity-100' 
                                      : 'text-gray-400 opacity-0 group-hover:opacity-100'
                                  }`}
                                  title="Edit fee"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => openDeleteConfirm(fee)}
                                  className={`p-1 rounded transition-all duration-200 ${
                                    hoveredFee === fee.id 
                                      ? 'text-red-600 bg-red-50 opacity-100' 
                                      : 'text-gray-400 opacity-0 group-hover:opacity-100'
                                  }`}
                                  title="Delete fee"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Fee Pamplate Preview */}
          <div className="lg:col-span-8 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex flex-col">
            <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary-100 rounded-lg">
                    <Receipt className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Fee Pamplate Preview</h3>
                    <p className="text-[10px] text-gray-500">
                      {filteredFees.length} services • {defaultFees.length} default • {customFees.length} custom
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setShowAllFees(!showAllFees)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title={showAllFees ? "Hide all fees" : "Show all fees"}
                  >
                    {showAllFees ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Print">
                    <Printer size={14} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Download">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredFees.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FileSpreadsheet className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm font-medium">No Fees Found</p>
                  <p className="text-xs">Add fee categories or adjust your filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Fee Pamplate Header */}
                  <div className="text-center pb-3 border-b-2 border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Fee Structure</h2>
                    <p className="text-xs text-gray-500">All fees are exclusive of GST unless mentioned otherwise</p>
                    <div className="flex justify-center gap-3 mt-1 text-[10px] text-gray-400">
                      <span>Effective: {new Date().toLocaleDateString()}</span>
                      <span>•</span>
                      <span>All prices in INR (₹)</span>
                    </div>
                  </div>

                  {/* Fee Pamplate Items */}
                  {showAllFees && (
                    <div className="space-y-1.5">
                      {filteredFees.map((fee) => {
                        const colors = getFeeTypeColor(fee.fee_type)
                        const total = calculateTotal(fee)
                        const isSelected = selectedFeeIds.includes(fee.id)
                        const isDefault = fee.is_system_default === true
                        
                        return (
                          <div 
                            key={fee.id}
                            className={`group p-2.5 rounded-lg border transition-all duration-200 ${
                              isSelected ? 'border-primary-300 bg-primary-50' :
                              fee.is_active ? 'border-gray-200 hover:border-primary-300 hover:shadow-sm' : 'border-gray-100 bg-gray-50/50 opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleFeeSelection(fee.id)}
                                    className="w-3.5 h-3.5 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                                    disabled={!fee.is_active}
                                  />
                                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${colors.bg} ${colors.color}`}>
                                    {getFeeTypeLabel(fee.fee_type)}
                                  </span>
                                  <h4 className="text-sm font-semibold text-gray-900">{fee.name}</h4>
                                  {isDefault && (
                                    <span className="text-[8px] px-1.5 py-0.5 bg-yellow-100 text-yellow-600 rounded-full flex items-center gap-0.5">
                                      <Star className="w-2.5 h-2.5 fill-yellow-500" />
                                      Default
                                    </span>
                                  )}
                                  {fee.is_published && (
                                    <span className="text-[8px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">Published</span>
                                  )}
                                  {!fee.is_active && (
                                    <span className="text-[8px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">Inactive</span>
                                  )}
                                </div>
                                {fee.description && (
                                  <p className="text-xs text-gray-500 mt-0.5 ml-5">{fee.description}</p>
                                )}
                                {fee.keywords && fee.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-0.5 mt-1 ml-5">
                                    {fee.keywords.slice(0, 3).map((kw, i) => (
                                      <span key={i} className="text-[8px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                        #{kw}
                                      </span>
                                    ))}
                                    {fee.keywords.length > 3 && (
                                      <span className="text-[8px] px-1.5 py-0.5 text-gray-400">+{fee.keywords.length - 3}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end ml-3 flex-shrink-0">
                                <div className="text-right">
                                  <span className="text-base font-bold text-gray-900">₹{parseFloat(fee.base_fee).toFixed(0)}</span>
                                  <span className="text-[10px] text-gray-400 ml-0.5">+ GST</span>
                                </div>
                                <span className="text-[10px] text-gray-400">
                                  Total: ₹{total.toFixed(0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Fee Pamplate Footer */}
                  <div className="pt-2 border-t-2 border-gray-200 text-center text-[10px] text-gray-400">
                    <p>This is a system-generated fee structure. Please verify all fees before proceeding.</p>
                    <p className="mt-0.5">For any queries, please contact your CA.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-white px-6 py-4 flex items-center justify-between border-b border-gray-200 z-10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {editingFee ? (
                  <>
                    <Edit className="w-5 h-5 text-primary-500" />
                    Edit Fee Category
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-primary-500" />
                    Add Fee Category
                  </>
                )}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Basic ITR - Salary"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.code ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., BASIC_ITR"
                  />
                  {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Fee Type
                  </label>
                  <select
                    value={formData.fee_type}
                    onChange={(e) => setFormData({ ...formData, fee_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {feeTypes.filter(t => t.value !== 'all').map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Base Fee (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      value={formData.base_fee}
                      onChange={(e) => setFormData({ ...formData, base_fee: e.target.value })}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.base_fee ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="500"
                      min="0"
                      step="100"
                    />
                  </div>
                  {errors.base_fee && <p className="mt-1 text-sm text-red-600">{errors.base_fee}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    GST Rate (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      value={formData.gst_rate}
                      onChange={(e) => setFormData({ ...formData, gst_rate: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="18"
                      min="0"
                      max="100"
                      step="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Keywords (comma separated)
                </label>
                <div className="relative">
                  <Tags className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <textarea
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                    placeholder="e.g., salary, house property, form 16"
                    rows="3"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Keywords used to automatically match documents with this fee category
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[60px]"
                  placeholder="Brief description of this fee category"
                  rows="2"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingFee ? 'Update' : 'Create'} Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Delete Fee Category</h3>
            </div>
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{deletingName}"</span>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. Any clients using this fee will be affected.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeletingId(null)
                  setDeletingName('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Pamplate Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-50 to-white px-6 py-4 flex items-center justify-between border-b border-gray-200 z-10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Send className="w-5 h-5 text-primary-500" />
                Publish Fee Pamplate
              </h2>
              <button
                onClick={() => {
                  setShowPublishModal(false)
                  setSelectedClientId('')
                  setSelectedFeeIds([])
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Select Client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Select the client who will receive this fee pamplate
                </p>
              </div>

              {/* Selected Fees Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Selected Fees ({selectedFeeIds.length})
                </label>
                <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto border border-gray-200">
                  {selectedFeeIds.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No fees selected. Select fees from the left panel.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {fees.filter(f => selectedFeeIds.includes(f.id)).map((fee) => {
                        const isDefault = fee.is_system_default === true
                        return (
                          <div key={fee.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200">
                            <div>
                              <p className="text-sm font-medium">{fee.name}</p>
                              <p className="text-xs text-gray-500">{fee.code}</p>
                              {isDefault && (
                                <span className="text-[8px] px-1.5 py-0.5 bg-yellow-100 text-yellow-600 rounded-full flex items-center gap-0.5">
                                  <Star className="w-2 h-2 fill-yellow-500" />
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">₹{parseFloat(fee.base_fee).toFixed(0)}</p>
                              <p className="text-xs text-gray-400">+ GST {parseFloat(fee.gst_rate).toFixed(0)}%</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              {selectedFeeIds.length > 0 && (
                <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                  <h4 className="text-sm font-semibold text-primary-700 mb-2">Fee Summary</h4>
                  {(() => {
                    const selectedFees = fees.filter(f => selectedFeeIds.includes(f.id))
                    const totalFee = selectedFees.reduce((sum, f) => sum + parseFloat(f.base_fee), 0)
                    const totalGst = selectedFees.reduce((sum, f) => sum + (parseFloat(f.base_fee) * parseFloat(f.gst_rate) / 100), 0)
                    const grandTotal = totalFee + totalGst
                    
                    return (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Base Fee</span>
                          <span className="font-semibold">₹{totalFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total GST</span>
                          <span className="font-semibold">₹{totalGst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-primary-200 pt-1 mt-1">
                          <span className="font-bold text-primary-700">Grand Total</span>
                          <span className="font-bold text-primary-700">₹{grandTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowPublishModal(false)
                    setSelectedClientId('')
                    setSelectedFeeIds([])
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePublishPamplate}
                  disabled={isPublishing || !selectedClientId || selectedFeeIds.length === 0}
                  className="btn-primary flex items-center"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Publish Pamplate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default FeeStructure