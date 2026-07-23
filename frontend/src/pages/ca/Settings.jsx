import React from 'react'
import Sidebar from '../../components/common/Layout/Sidebar.jsx'
import Topbar from '../../components/common/Layout/Topbar.jsx'
import { Save, User, Bell, Shield, Palette } from 'lucide-react'

const Settings = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Topbar />
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <nav className="space-y-2">
                <button className="w-full text-left px-4 py-2 bg-primary-50 text-primary-500 rounded-lg font-medium">
                  <User size={18} className="inline mr-2" />
                  Profile
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <Bell size={18} className="inline mr-2" />
                  Notifications
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <Shield size={18} className="inline mr-2" />
                  Security
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <Palette size={18} className="inline mr-2" />
                  Appearance
                </button>
              </nav>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-6">Profile Settings</h3>
                
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input type="text" className="input-field" defaultValue="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input type="email" className="input-field" defaultValue="ca@example.com" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input type="tel" className="input-field" defaultValue="+91 9876543210" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input type="text" className="input-field" defaultValue="CA Firm" />
                  </div>

                  <button type="submit" className="btn-primary flex items-center">
                    <Save size={20} className="mr-2" />
                    Save Changes
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Settings