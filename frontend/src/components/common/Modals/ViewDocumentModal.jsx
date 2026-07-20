// src/components/common/Modals/ViewDocumentModal.jsx
import React, { useState } from 'react'
import { X, FileText, Download, Eye, Link, ExternalLink } from 'lucide-react'

const ViewDocumentModal = ({ isOpen, onClose, document }) => {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen || !document) return null

  const handleView = () => {
    if (document.onedrive_link) {
      window.open(document.onedrive_link, '_blank')
    } else if (document.gdrive_web_link) {
      window.open(document.gdrive_web_link, '_blank')
    } else {
      alert('No viewable link available for this document')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'PENDING_UPLOAD': 'bg-yellow-100 text-yellow-700',
      'UPLOADED': 'bg-blue-100 text-blue-700',
      'APPROVED': 'bg-green-100 text-green-700',
      'REJECTED': 'bg-red-100 text-red-700',
      'RE_UPLOAD_REQUIRED': 'bg-orange-100 text-orange-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'PENDING_UPLOAD': 'Pending Upload',
      'UPLOADED': 'Uploaded',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected',
      'RE_UPLOAD_REQUIRED': 'Re-upload Required'
    }
    return labels[status] || status
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <FileText className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{document.file_title}</h3>
              <p className="text-xs text-gray-500">{document.document_type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Document Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Status</p>
              <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                {getStatusLabel(document.status)}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Uploaded By</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {document.uploaded_by === 'ca' ? 'CA' : 'Client'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Uploaded At</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {document.uploaded_at ? new Date(document.uploaded_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">File Size</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {document.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Classification Info */}
          {document.bill_as && document.bill_as !== 'ignore' && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-xs text-blue-600">Bill As</p>
              <p className="text-sm font-medium text-blue-900 mt-1">{document.bill_as}</p>
              {document.detected_label && (
                <p className="text-xs text-blue-600 mt-1">Detected: {document.detected_label}</p>
              )}
              {document.confidence && (
                <p className="text-xs text-blue-600">Confidence: {document.confidence}</p>
              )}
            </div>
          )}

          {/* Remarks */}
          {document.remarks && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Remarks</p>
              <p className="text-sm text-gray-900 mt-1">{document.remarks}</p>
            </div>
          )}

          {/* View Link */}
          {(document.onedrive_link || document.gdrive_web_link) && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Document Link</p>
              <button
                onClick={handleView}
                className="mt-1 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-2"
              >
                {document.is_view_only ? (
                  <>
                    <Eye className="w-4 h-4" />
                    View Document (Read Only)
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Open Document
                  </>
                )}
              </button>
              {document.is_view_only && (
                <p className="text-xs text-gray-400 mt-1">View only - No download/edit access</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          {(document.onedrive_link || document.gdrive_web_link) && (
            <button
              onClick={handleView}
              className="btn-primary flex items-center px-4 py-2"
            >
              {document.is_view_only ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  View Document
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewDocumentModal