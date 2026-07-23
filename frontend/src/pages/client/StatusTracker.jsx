import React from 'react'
import Sidebar from '../../components/common/Layout/Sidebar.jsx'
import Topbar from '../../components/common/Layout/Topbar.jsx'
import { CheckCircle, Clock, FileText, Users, DollarSign, Award } from 'lucide-react'

const StatusTracker = () => {
  const steps = [
    { id: 1, label: 'Created', icon: FileText, completed: true },
    { id: 2, label: 'Documents Requested', icon: Clock, completed: true },
    { id: 3, label: 'Documents Uploaded', icon: Users, completed: true },
    { id: 4, label: 'Under Verification', icon: Clock, completed: true },
    { id: 5, label: 'Processing', icon: Clock, completed: false },
    { id: 6, label: 'Return Prepared', icon: FileText, completed: false },
    { id: 7, label: 'Waiting for Approval', icon: Clock, completed: false },
    { id: 8, label: 'Completed', icon: Award, completed: false },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Topbar />
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-6">Status Tracker</h1>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-6">Financial Year 2023-24</h3>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-4 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                      step.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      {step.completed ? (
                        <CheckCircle size={20} className="text-white" />
                      ) : (
                        <step.icon size={20} className="text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {step.completed && (
                        <p className="text-xs text-gray-500">Completed on Jan 15, 2024</p>
                      )}
                    </div>
                    {step.completed && (
                      <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default StatusTracker