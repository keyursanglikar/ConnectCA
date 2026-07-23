import React, { useState } from 'react'
import DashboardLayout from '../../components/common/Layout/DashboardLayout.jsx'
import { Plus, Search, Filter, Eye, Edit, Trash2, UserPlus, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Clients = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data
  const clients = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+91 9876543210', status: 'Active', type: 'Individual' },
    { id: 2, name: 'ABC Corp', email: 'abc@corp.com', phone: '+91 9876543211', status: 'Pending', type: 'Business' },
    { id: 3, name: 'Jane Smith', email: 'jane@smith.com', phone: '+91 9876543212', status: 'Active', type: 'Individual' },
  ]

  return (
    <DashboardLayout 
      title="Clients" 
      subtitle="Manage all your clients"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button 
          onClick={() => navigate('/ca/clients/add')}
          className="btn-primary flex items-center whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Client
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Phone</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium">{client.name}</td>
                  <td className="py-3 px-4 text-sm">{client.email}</td>
                  <td className="py-3 px-4 text-sm">{client.phone}</td>
                  <td className="py-3 px-4 text-sm">{client.type}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      client.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors text-blue-500">
                        <Eye size={16} />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors text-green-500">
                        <Edit size={16} />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors text-red-500">
                        <Trash2 size={16} />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors text-purple-500">
                        <Mail size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Clients