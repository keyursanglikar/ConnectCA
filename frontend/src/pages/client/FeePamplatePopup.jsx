// src/pages/client/FeePamplatePopup.jsx
import React, { useState, useEffect } from 'react'
import { 
  Receipt, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  X,
  Check,
  AlertCircle,
  Shield,
  DollarSign,
  FileText,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Eye,
  Sparkles,
  Scale,
  Calendar,
  Hash,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { feeApi } from '../../api/fee.api'
import safeToast from '../../utils/toast'

const FeePamplatePopup = ({ 
  isOpen, 
  onAccept, 
  onClose, 
  isViewOnly = false,
  initialData = null,
  statusData = null
}) => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [pamplate, setPamplate] = useState(initialData)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [error, setError] = useState(null)
  const [hasFetched, setHasFetched] = useState(!!initialData)
  const [isAccepted, setIsAccepted] = useState(false)
  const [newItemIds, setNewItemIds] = useState([])
  const [status, setStatus] = useState(statusData)
  const [showTerms, setShowTerms] = useState(true)

  useEffect(() => {
    if (isOpen && !hasFetched && !isAccepted && !initialData) {
      fetchMyPamplate()
    } else if (initialData) {
      setPamplate(initialData)
      setHasFetched(true)
      setIsLoading(false)
    }
  }, [isOpen, hasFetched, isAccepted, initialData])

  const fetchMyPamplate = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const statusRes = await feeApi.getMyPamplateStatus()
      setStatus(statusRes)
      
      if (!statusRes.has_pamplate) {
        setError('NO_PAMPLATE')
        return
      }
      
      if (statusRes.has_accepted && !isViewOnly) {
        setIsAccepted(true)
        if (onAccept) {
          onAccept()
        }
        return
      }
      
      const data = await feeApi.getMyPamplate()
      
      if (data && data.fee_data) {
        data.fee_data = data.fee_data.sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at) - new Date(a.created_at)
          }
          return 0
        })
      }
      
      if (data.previous_accepted_fee_ids && data.fee_data) {
        const newItems = data.fee_data.filter(
          item => !data.previous_accepted_fee_ids.includes(item.id)
        )
        setNewItemIds(newItems.map(item => item.id))
      }
      
      setPamplate(data)
      setHasFetched(true)
    } catch (error) {
      console.error('Error fetching fee pamplate:', error)
      if (error.response?.status === 404) {
        setError('NO_PAMPLATE')
      } else if (error.response?.status === 401) {
        localStorage.removeItem('access_token')
        navigate('/login')
        safeToast.error('Session expired. Please login again.')
      } else {
        setError('ERROR')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!pamplate) return
    
    setIsAccepting(true)
    try {
      await feeApi.acceptPamplate(pamplate.id)
      
      safeToast.success('Fee pamphlet accepted successfully!')
      
      setIsAccepted(true)
      setPamplate({ ...pamplate, accepted_at: new Date().toISOString() })
      
      if (onAccept) {
        onAccept()
      }
      
    } catch (error) {
      console.error('Error accepting fee pamplate:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token')
        navigate('/login')
        safeToast.error('Session expired. Please login again.')
      } else {
        safeToast.error(error.response?.data?.detail || 'Failed to accept fee pamphlet')
      }
    } finally {
      setIsAccepting(false)
    }
  }

  const handleReject = async () => {
    if (!pamplate) return
    
    if (!window.confirm(
      '⚠️ Are you sure you want to reject this fee pamphlet?\n\n' +
      'You will be logged out and will need to contact your CA for a new fee structure.'
    )) return
    
    setIsRejecting(true)
    try {
      await feeApi.rejectPamplate(pamplate.id)
      
      safeToast.info('Fee pamphlet rejected. You will be logged out.')
      
      localStorage.removeItem('access_token')
      setTimeout(() => {
        navigate('/login')
      }, 1000)
      
    } catch (error) {
      console.error('Error rejecting fee pamplate:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token')
        navigate('/login')
        safeToast.error('Session expired. Please login again.')
      } else {
        safeToast.error(error.response?.data?.detail || 'Failed to reject fee pamphlet')
      }
    } finally {
      setIsRejecting(false)
    }
  }

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else if (onAccept) {
      onAccept()
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    navigate('/login')
    safeToast.info('Logged out successfully')
  }

  if (isAccepted) {
    return null
  }

  if (!isOpen) return null

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary-200 rounded-full animate-spin border-t-primary-600"></div>
              <Receipt className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary-600" />
            </div>
            <p className="text-gray-600 mt-4 font-medium">Loading your fee pamphlet...</p>
            <p className="text-sm text-gray-400 mt-1">Please wait</p>
          </div>
        </div>
      </div>
    )
  }

  if (error === 'NO_PAMPLATE') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto">
          <div className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Fee Pamphlet Yet</h2>
              <div className="space-y-3 text-left w-full mt-2">
                <p className="text-gray-600 text-sm">
                  Your CA has not published a fee pamphlet for you yet.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span>Please wait until your CA publishes the fee structure. You will be able to access your dashboard once it's published and you accept it.</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-6 w-full">
                <button
                  onClick={fetchMyPamplate}
                  className="flex-1 btn-outline text-sm px-4 py-2.5 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check Again
                </button>
                {!isViewOnly && (
                  <button
                    onClick={handleLogout}
                    className="flex-1 btn-outline text-sm px-4 py-2.5 flex items-center justify-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                )}
                {isViewOnly && (
                  <button
                    onClick={handleClose}
                    className="flex-1 btn-primary text-sm px-4 py-2.5 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto">
          <div className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h2>
              <p className="text-gray-600 text-sm mb-6">
                Could not load your fee pamphlet. Please try again or contact your CA.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={fetchMyPamplate}
                  className="flex-1 btn-primary text-sm px-4 py-2.5 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                {isViewOnly && (
                  <button
                    onClick={handleClose}
                    className="flex-1 btn-outline text-sm px-4 py-2.5 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!pamplate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto">
          <div className="p-8">
            <div className="flex flex-col items-center text-center">
              <Receipt className="w-20 h-20 text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Fee Pamphlet</h2>
              <p className="text-gray-600 text-sm mb-6">
                Your CA has not published a fee pamphlet for you yet. Please wait for the CA to publish it.
              </p>
              <button
                onClick={fetchMyPamplate}
                className="btn-primary w-full text-sm px-4 py-2.5 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Check Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const hasNewItems = newItemIds.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto max-h-[95vh] flex flex-col">
        
        {/* ============ HEADER ============ */}
        <div className="flex-shrink-0 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Fee Structure &amp; Terms</h2>
              <p className="text-sm text-gray-500 mt-0.5">Proposed by Your CA</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Pamphlet ID</p>
              <p className="text-sm font-mono font-semibold text-gray-900">#FP-{String(pamplate.id).padStart(6, '0')}</p>
            </div>
          </div>
        </div>

        {/* ============ BODY ============ */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          
          {/* ===== CLIENT & CA INFO ===== */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">CA Firm</p>
              <p className="font-semibold text-gray-900 text-lg mt-1">ABC &amp; Associates</p>
              <p className="text-sm text-gray-500">Chartered Accountants</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Prepared For</p>
              <p className="font-semibold text-gray-900 text-lg mt-1">{pamplate.client_name}</p>
              <p className="text-sm text-gray-500">{pamplate.client_email}</p>
            </div>
          </div>

          {/* ===== META INFO ===== */}
          <div className="flex items-center gap-8 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Issued On</span>
              <span className="font-medium text-gray-900">
                {new Date(pamplate.published_at).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Pamphlet ID</span>
              <span className="font-medium font-mono text-gray-900">#FP-{String(pamplate.id).padStart(6, '0')}</span>
            </div>
          </div>

          {/* ===== STATUS BANNER ===== */}
          {!isViewOnly && !pamplate.accepted_at && !pamplate.rejected_at && (
            <div className="mb-6 flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800 text-sm">Awaiting Your Response</p>
                <p className="text-xs text-blue-600">Please review the fee structure and accept to continue.</p>
              </div>
            </div>
          )}

          {pamplate.rejected_at && (
            <div className="mb-6 flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-200">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800 text-sm">This fee pamphlet was rejected</p>
                <p className="text-xs text-red-600">Please contact your CA for a revised fee structure.</p>
              </div>
            </div>
          )}

          {/* ===== FEE STRUCTURE TABLE ===== */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-sm">Fee Structure</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pamplate.fee_data && pamplate.fee_data.length > 0 ? (
                    pamplate.fee_data.map((fee, index) => {
                      const isNew = isViewOnly && newItemIds.includes(fee.id)
                      return (
                        <tr key={index} className={`hover:bg-gray-50 transition-colors ${isNew ? 'bg-green-50' : ''}`}>
                          <td className="px-6 py-3 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 text-sm">{fee.name}</span>
                              {isNew && (
                                <span className="text-[10px] px-2 py-0.5 bg-green-500 text-white rounded-full flex items-center gap-1 animate-pulse">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  NEW
                                </span>
                              )}
                              {fee.description && (
                                <span className="text-xs text-gray-400 block">{fee.description}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600">
                            {fee.fee_type === 'basic' ? 'Annually' : 
                             fee.fee_type === 'business' ? 'Monthly' :
                             fee.fee_type === 'capital_gains' ? 'As Required' :
                             fee.fee_type === 'nri' ? 'Annually' :
                             fee.fee_type === 'foreign_income' ? 'Annually' : 'As Required'}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className="font-semibold text-gray-900">₹{parseFloat(fee.base_fee).toFixed(0)}</span>
                            <span className="text-xs text-gray-400 block">+ GST {parseFloat(fee.gst_rate).toFixed(0)}%</span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        <p className="text-sm">No fee items in this pamphlet</p>
                      </td>
                    </tr>
                  )}
                  {/* TOTAL ROW */}
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan="3" className="px-6 py-3 text-right font-semibold text-gray-900">
                      TOTAL ANNUAL FEE (₹)
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900 text-lg">
                      ₹{parseFloat(pamplate.total_fee || 0).toFixed(0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== SUMMARY ===== */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-sm">Summary</h3>
            </div>
            <div className="px-6 py-4 space-y-2">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-gray-600">Base Fee (Total Annual Fee)</span>
                <span className="font-semibold text-gray-900">₹{parseFloat(pamplate.total_fee || 0).toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-t border-gray-100">
                <span className="text-sm text-gray-600">GST ({pamplate.gst_rate || 18}%)</span>
                <span className="font-semibold text-gray-900">₹{parseFloat(pamplate.total_gst || 0).toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 mt-1 border-t-2 border-primary-200">
                <span className="font-bold text-primary-700">GRAND TOTAL (Incl. GST)</span>
                <span className="font-bold text-primary-700 text-xl">₹{parseFloat(pamplate.grand_total || 0).toFixed(0)}</span>
              </div>
              <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  All fees are exclusive of out-of-pocket expenses.
                </p>
              </div>
            </div>
          </div>

          {/* ===== TERMS & CONDITIONS ===== */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary-500" />
                Terms &amp; Conditions
              </h3>
            </div>
            <div className="px-6 py-4 space-y-2.5">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">Fees are non-refundable once paid.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">Additional services will be charged as per actuals or mutually agreed rates.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">Out-of-pocket expenses (Govt. fees, Stamp Duty, etc.) will be charged extra as applicable.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">All payments are to be made in advance as per agreed schedule.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">This fee structure is valid for the financial year 2025-26.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">Any changes in laws/tax rates may impact the fees.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">This agreement is governed by the laws of India.</p>
              </div>
            </div>
          </div>

          {/* ===== ACCEPTANCE NOTE ===== */}
          <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-200 text-center">
            <p className="text-sm text-primary-700 font-medium">
              By accepting this fee structure, you agree to all the terms and conditions mentioned here.
            </p>
          </div>
        </div>

        {/* ============ FOOTER ============ */}
        <div className="flex-shrink-0 px-8 py-5 border-t border-gray-200 bg-white">
          {!isViewOnly && !pamplate.accepted_at && !pamplate.rejected_at ? (
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={handleReject}
                disabled={isRejecting}
                className="px-8 py-2.5 text-sm font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                {isRejecting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin w-4 h-4" />
                    Rejecting...
                  </span>
                ) : (
                  'Reject'
                )}
              </button>
              <button
                onClick={handleAccept}
                disabled={isAccepting}
                className="px-8 py-2.5 btn-primary text-sm font-medium flex items-center gap-2"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Accept & Continue
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end">
              <button
                onClick={handleClose}
                className="px-8 py-2.5 btn-primary text-sm font-medium flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FeePamplatePopup