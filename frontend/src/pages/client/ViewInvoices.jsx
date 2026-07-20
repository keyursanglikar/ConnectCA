import React from 'react'
import Sidebar from '../../components/common/Layout/Sidebar'
import Topbar from '../../components/common/Layout/Topbar'
import { Download, Eye, DollarSign, CreditCard } from 'lucide-react'

const ViewInvoices = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Topbar />
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-6">My Invoices</h1>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">INV-2024-001</td>
                    <td className="py-3 px-4">2024-01-15</td>
                    <td className="py-3 px-4">₹15,000</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        Pending
                      </span>
                    </td>
                    <td className="py-3 px-4 space-x-2">
                      <button className="text-primary-500 hover:text-primary-600">
                        <Eye size={18} />
                      </button>
                      <button className="text-blue-500 hover:text-blue-600">
                        <Download size={18} />
                      </button>
                      <button className="btn-primary text-sm py-1 px-3">
                        <CreditCard size={16} className="inline mr-1" />
                        Pay
                      </button>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">INV-2024-002</td>
                    <td className="py-3 px-4">2024-01-10</td>
                    <td className="py-3 px-4">₹8,500</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Paid
                      </span>
                    </td>
                    <td className="py-3 px-4 space-x-2">
                      <button className="text-primary-500 hover:text-primary-600">
                        <Eye size={18} />
                      </button>
                      <button className="text-blue-500 hover:text-blue-600">
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ViewInvoices