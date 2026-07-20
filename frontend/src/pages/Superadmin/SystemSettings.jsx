import React, { useState } from 'react'
import DashboardLayout from '../../components/common/Layout/DashboardLayout'
import Input from '../../components/common/Forms/Input'
import Select from '../../components/common/Forms/Select'
import { Save, Globe, Shield, Mail, CreditCard, Database, Bell } from 'lucide-react'
import { toast } from 'sonner'

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    // General
    siteName: 'CA Firm Management',
    siteUrl: 'https://cafirm.com',
    supportEmail: 'support@cafirm.com',
    
    // Security
    sessionTimeout: '60',
    maxLoginAttempts: '5',
    passwordPolicy: 'medium',
    twoFactorAuth: false,
    
    // Email
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'noreply@cafirm.com',
    smtpPassword: '********',
    
    // Payment
    razorpayKeyId: 'rzp_test_XXXXXX',
    razorpayKeySecret: 'XXXXXXXX',
    currency: 'INR',
    
    // Storage
    storageProvider: 'google_drive',
    storageLimit: '100',
  })

  const sections = [
    {
      id: 'general',
      label: 'General Settings',
      icon: Globe,
      fields: [
        { key: 'siteName', label: 'Site Name', type: 'text' },
        { key: 'siteUrl', label: 'Site URL', type: 'url' },
        { key: 'supportEmail', label: 'Support Email', type: 'email' },
      ],
    },
    {
      id: 'security',
      label: 'Security Settings',
      icon: Shield,
      fields: [
        { key: 'sessionTimeout', label: 'Session Timeout (minutes)', type: 'number' },
        { key: 'maxLoginAttempts', label: 'Max Login Attempts', type: 'number' },
        { key: 'passwordPolicy', label: 'Password Policy', type: 'select' },
        { key: 'twoFactorAuth', label: 'Two-Factor Authentication', type: 'checkbox' },
      ],
    },
    {
      id: 'email',
      label: 'Email Configuration',
      icon: Mail,
      fields: [
        { key: 'smtpHost', label: 'SMTP Host', type: 'text' },
        { key: 'smtpPort', label: 'SMTP Port', type: 'number' },
        { key: 'smtpUser', label: 'SMTP Username', type: 'email' },
        { key: 'smtpPassword', label: 'SMTP Password', type: 'password' },
      ],
    },
    {
      id: 'payment',
      label: 'Payment Settings',
      icon: CreditCard,
      fields: [
        { key: 'razorpayKeyId', label: 'Razorpay Key ID', type: 'text' },
        { key: 'razorpayKeySecret', label: 'Razorpay Key Secret', type: 'password' },
        { key: 'currency', label: 'Currency', type: 'select' },
      ],
    },
    {
      id: 'storage',
      label: 'Storage Settings',
      icon: Database,
      fields: [
        { key: 'storageProvider', label: 'Storage Provider', type: 'select' },
        { key: 'storageLimit', label: 'Storage Limit (GB)', type: 'number' },
      ],
    },
  ]

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value })
  }

  const handleSave = () => {
    toast.success('Settings saved successfully!')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-500 mt-1">Configure system-wide settings and preferences</p>
          </div>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center whitespace-nowrap"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-6">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 hover:text-primary-600"
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      <span className="text-sm">{section.label}</span>
                    </a>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-6">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <div
                  key={section.id}
                  id={section.id}
                  className="bg-white rounded-xl shadow-sm p-6 scroll-mt-20"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <Icon className="w-5 h-5 text-primary-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">{section.label}</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.fields.map((field) => {
                      const value = settings[field.key]
                      
                      if (field.type === 'select') {
                        const options = {
                          passwordPolicy: [
                            { value: 'low', label: 'Low' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'high', label: 'High' },
                          ],
                          currency: [
                            { value: 'INR', label: 'INR (₹)' },
                            { value: 'USD', label: 'USD ($)' },
                            { value: 'EUR', label: 'EUR (€)' },
                          ],
                          storageProvider: [
                            { value: 'google_drive', label: 'Google Drive' },
                            { value: 'aws_s3', label: 'AWS S3' },
                            { value: 'local', label: 'Local Storage' },
                          ],
                        }
                        return (
                          <Select
                            key={field.key}
                            label={field.label}
                            options={options[field.key] || []}
                            value={value}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                          />
                        )
                      }
                      
                      return (
                        <Input
                          key={field.key}
                          label={field.label}
                          type={field.type}
                          value={value}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SystemSettings