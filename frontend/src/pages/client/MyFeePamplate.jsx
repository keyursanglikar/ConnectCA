import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../components/common/Layout/DashboardLayout.jsx'
import { 
  Receipt, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Download,
  Printer,
  Eye,
  Calendar,
  User,
  Mail,
  Building2,
  Tag,
  Percent,
  AlertCircle,
  Check,
  X,
  Send,
  FileText
} from 'lucide-react'
import axios from 'axios'
import safeToast from '../../utils/toast.js'

const MyFeePamplate = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [pamplate, setPamplate] = useState(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  useEffect(() => {
    fetchMyPamplate()
  }, [])

  const fetchMyPamplate = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      const response = await axios.get(`${API_URL}/fees/my-pamplate`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      setPamplate(response.data)
    } catch (error) {
      console.error('Error fetching fee pamplate:', error)
      if (error.response?.status === 404) {
        // No pamplate found - that's okay
        setPamplate(null)
      } else {
        safeToast.error('Failed to load fee pamplate')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!pamplate) return
    
    setIsAccepting(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      await axios.post(
        `${API_URL}/fees/my-pamplate/${pamplate.id}/accept`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      safeToast.success('Fee pamplate accepted successfully!')
      fetchMyPamplate()
    } catch (error) {
      console.error('Error accepting fee pamplate:', error)
      safeToast.error('Failed to accept fee pamplate')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleReject = async () => {
    if (!pamplate) return
    
    if (!window.confirm('Are you sure you want to reject this fee pamplate?')) return
    
    setIsRejecting(true)
    try {
      const token = localStorage.getItem('access_token')
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
      
      await axios.post(
        `${API_URL}/fees/my-pamplate/${pamplate.id}/reject`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      safeToast.success('Fee pamplate rejected')
      fetchMyPamplate()
    } catch (error) {
      console.error('Error rejecting fee pamplate:', error)
      safeToast.error('Failed to reject fee pamplate')
    } finally {
      setIsRejecting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Fee Pamplate" subtitle="Your fee structure">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
        </div>
      </DashboardLayout>
    )
  }

  if (!pamplate) {
    return (
      <DashboardLayout title="Fee Pamplate" subtitle="Your fee structure">
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Receipt className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium">No Fee Pamplate Published</h3>
          <p className="text-sm">Your CA has not published a fee pamplate for you yet.</p>
          <p className="text-xs text-gray-400 mt-2">Please contact your CA for fee details.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="Fee Pamplate" 
      subtitle="Your personalized fee structure"
    >
      <div className="max-w-4xl mx-auto">
        {/* Status Banner */}
        <div className={`mb-6 p-4 rounded-xl border ${
          pamplate.accepted_at 
            ? 'bg-green-50 border-green-200' 
            : pamplate.rejected_at 
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-3">
            {pamplate.accepted_at ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : pamplate.rejected_at ? (
              <XCircle className="w-5 h-5 text-red-600" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-600" />
            )}
            <div>
              <p className="font-medium">
                {pamplate.accepted_at 
                  ? '✅ Fee pamplate accepted' 
                  : pamplate.rejected_at 
                  ? '❌ Fee pamplate rejected'
                  : '⏳ Awaiting your response'
                }
              </p>
              <p className="text-sm text-gray-600">
                Published on {new Date(pamplate.published_at).toLocaleDateString()} 
                {pamplate.accepted_at && ` • Accepted on ${new Date(pamplate.accepted_at).toLocaleDateString()}`}
                {pamplate.rejected_at && ` • Rejected on ${new Date(pamplate.rejected_at).toLocaleDateString()}`}
              </p>
            </div>
          </div>
        </div>

        {/* Fee Pamplate Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Fee Pamplate</h2>
                <p className="text-primary-100 mt-1">CA Firm Management</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-200">Client</p>
                <p className="font-semibold">{pamplate.client_name}</p>
                <p className="text-sm text-primary-200">{pamplate.client_email}</p>
              </div>
            </div>
          </div>

          {/* Fee Items */}
          <div className="p-6">
            <div className="space-y-4">
              {pamplate.fee_data.map((fee, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary-500" />
                      <h4 className="font-semibold text-gray-900">{fee.name}</h4>
                      <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-600">
                        {fee.code}
                      </span>
                    </div>
                    {fee.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{fee.description}</p>
                    )}
                    {fee.keywords && fee.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {fee.keywords.slice(0, 3).map((kw, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900">₹{parseFloat(fee.base_fee).toFixed(0)}</p>
                    <p className="text-xs text-gray-400">+ GST {parseFloat(fee.gst_rate).toFixed(0)}%</p>
                    <p className="text-sm font-semibold text-primary-600">
                      ₹{(parseFloat(fee.base_fee) * (1 + parseFloat(fee.gst_rate) / 100)).toFixed(0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <h4 className="font-semibold text-primary-700 mb-3">Fee Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Base Fee</span>
                  <span className="font-semibold">₹{parseFloat(pamplate.total_fee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total GST</span>
                  <span className="font-semibold">₹{parseFloat(pamplate.total_gst).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-primary-200">
                  <span className="text-primary-700">Grand Total</span>
                  <span className="text-primary-700">₹{parseFloat(pamplate.grand_total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!pamplate.accepted_at && !pamplate.rejected_at && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="btn-primary flex items-center px-8 py-3"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Accept Fee Pamplate
                    </>
                  )}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="btn-outline flex items-center px-8 py-3 border-red-500 text-red-500 hover:bg-red-50"
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Footer Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Pamplate ID: #{pamplate.id} • {new Date(pamplate.published_at).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Printer size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Download size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default MyFeePamplate