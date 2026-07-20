import React from 'react'
import Sidebar from '../../components/common/Layout/Sidebar'
import Topbar from '../../components/common/Layout/Topbar'
import { ArrowLeft, Download, Edit, FileText, DollarSign, Clock } from 'lucide-react'

const ClientDetail = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Topbar />
        <main className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">Client Profile</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-primary-500 text-white flex items-center justify-center text-2xl font-bold mx-auto">
                    JD
                  </div>
                  <h2 className="text-xl font-semibold mt-3">John Doe</h2>
                  <p className="text-gray-500 text-sm">Individual</p>
                  <div className="flex justify-center space-x-2 mt-4">
                    <button className="btn-primary text-sm">Edit</button>
                    <button className="btn-outline text-sm">Documents</button>
                  </div>
                </div>
                <div className="border-t border-gray-200 mt-6 pt-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium">john@example.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-medium">+91 9876543210</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">PAN</span>
                    <span className="font-medium">ABCDE1234F</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Documents</p>
                      <p className="text-2xl font-bold">24</p>
                    </div>
                    <FileText size={24} className="text-primary-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Invoices</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                    <DollarSign size={24} className="text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="text-sm font-medium">Document uploaded</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                      <span className="text-sm text-green-600">Completed</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ClientDetail