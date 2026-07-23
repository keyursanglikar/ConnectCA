import React, { useState } from 'react'
import DashboardLayout from '../../components/common/Layout/DashboardLayout.jsx'
import DataTable from '../../components/common/Tables/DataTable.jsx'
import Modal from '../../components/common/Modals/Modal.jsx'
import ConfirmDialog from '../../components/common/Modals/ConfirmDialog.jsx'
import Input from '../../components/common/Forms/Input.jsx'
import Select from '../../components/common/Forms/Select.jsx'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  UserPlus,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Building2
} from 'lucide-react'
import { toast } from 'sonner'

const CAManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCA, setSelectedCA] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    firmName: '',
    firmAddress: '',
    gstNumber: '',
    panNumber: '',
    specialization: '',
    experience: '',
    status: 'active',
  })

  // Mock data
  const caData = [
    {
      id: 1,
      name: 'CA Rajesh Kumar',
      email: 'rajesh@cafirm.com',
      phone: '+91 9876543210',
      firmName: 'Rajesh & Associates',
      clients: 45,
      status: 'active',
      joinedDate: '2024-01-15',
    },
    {
      id: 2,
      name: 'CA Priya Sharma',
      email: 'priya@cafirm.com',
      phone: '+91 9876543211',
      firmName: 'Priya Tax Solutions',
      clients: 32,
      status: 'active',
      joinedDate: '2024-02-01',
    },
    {
      id: 3,
      name: 'CA Amit Patel',
      email: 'amit@cafirm.com',
      phone: '+91 9876543212',
      firmName: 'Amit & Co.',
      clients: 28,
      status: 'inactive',
      joinedDate: '2024-01-20',
    },
  ]

  const columns = [
    {
      key: 'name',
      label: 'CA Name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-xs text-gray-500">{row.firmName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Contact',
      render: (row) => (
        <div>
          <div className="flex items-center space-x-1 text-sm">
            <Mail className="w-3 h-3 text-gray-400" />
            <span>{row.email}</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Phone className="w-3 h-3 text-gray-400" />
            <span>{row.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'clients',
      label: 'Clients',
      render: (row) => (
        <span className="font-medium">{row.clients}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const statusConfig = {
          active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
          inactive: { label: 'Inactive', color: 'bg-red-100 text-red-700', icon: XCircle },
          pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
        }
        const config = statusConfig[row.status] || statusConfig.pending
        const Icon = config.icon
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${config.color}`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </span>
        )
      },
    },
    {
      key: 'joinedDate',
      label: 'Joined',
      render: (row) => (
        <span className="text-sm text-gray-500">{row.joinedDate}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleViewCA(row)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Eye className="w-4 h-4 text-blue-500" />
          </button>
          <button 
            onClick={() => handleEditCA(row)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Edit className="w-4 h-4 text-green-500" />
          </button>
          <button 
            onClick={() => handleDeleteCA(row)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
          <button 
            onClick={() => handleResendCredentials(row)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Mail className="w-4 h-4 text-purple-500" />
          </button>
        </div>
      ),
    },
  ]

  const handleViewCA = (ca) => {
    setSelectedCA(ca)
    // Open view modal or navigate to detail page
    toast.info(`Viewing ${ca.name}`)
  }

  const handleEditCA = (ca) => {
    setSelectedCA(ca)
    setFormData({
      name: ca.name,
      email: ca.email,
      phone: ca.phone,
      firmName: ca.firmName,
      status: ca.status,
    })
    setIsEditModalOpen(true)
  }

  const handleDeleteCA = (ca) => {
    setSelectedCA(ca)
    setIsDeleteDialogOpen(true)
  }

  const handleResendCredentials = (ca) => {
    toast.success(`Credentials resent to ${ca.email}`)
  }

  const handleCreateCA = () => {
    // Validate form
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill all required fields')
      return
    }
    
    // Here you would call API to create CA
    toast.success('CA account created successfully! Credentials sent via email.')
    setIsCreateModalOpen(false)
    setFormData({
      name: '',
      email: '',
      phone: '',
      firmName: '',
      firmAddress: '',
      gstNumber: '',
      panNumber: '',
      specialization: '',
      experience: '',
      status: 'active',
    })
  }

  const handleUpdateCA = () => {
    toast.success('CA details updated successfully!')
    setIsEditModalOpen(false)
  }

  const handleDeleteConfirm = () => {
    toast.success('CA account deleted successfully!')
    setIsDeleteDialogOpen(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CA Management</h1>
            <p className="text-gray-500 mt-1">Manage all CA accounts across the platform</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary flex items-center whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create CA Account
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, firm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button className="btn-outline flex items-center w-full sm:w-auto">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'pending', label: 'Pending' },
                ]}
                value="all"
                onChange={() => {}}
                className="w-full sm:w-40"
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={caData}
            pagination={{
              page: 1,
              pageSize: 10,
              total: caData.length,
              from: 1,
              to: caData.length,
              totalPages: 1,
            }}
          />
        </div>
      </div>

      {/* Create CA Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create CA Account"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="CA Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="ca@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              label="Firm Name"
              placeholder="CA & Associates"
              value={formData.firmName}
              onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
            />
            <Input
              label="Firm Address"
              placeholder="123, Business Park, City"
              value={formData.firmAddress}
              onChange={(e) => setFormData({ ...formData, firmAddress: e.target.value })}
            />
            <Input
              label="GST Number"
              placeholder="22ABCDE1234F1Z5"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
            />
            <Input
              label="PAN Number"
              placeholder="ABCDE1234F"
              value={formData.panNumber}
              onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
            />
            <Select
              label="Specialization"
              options={[
                { value: 'all', label: 'All Services' },
                { value: 'tax', label: 'Taxation' },
                { value: 'audit', label: 'Audit' },
                { value: 'consulting', label: 'Consulting' },
                { value: 'corporate', label: 'Corporate' },
              ]}
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCA}
              className="btn-primary flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Account
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit CA Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit CA Details"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              label="Firm Name"
              value={formData.firmName}
              onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
            />
            <Select
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'pending', label: 'Pending' },
                { value: 'suspended', label: 'Suspended' },
              ]}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateCA}
              className="btn-primary"
            >
              Update Details
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete CA Account"
        message={`Are you sure you want to delete ${selectedCA?.name}'s account? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="danger"
      />
    </DashboardLayout>
  )
}

export default CAManagement