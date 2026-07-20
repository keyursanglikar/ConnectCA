import React, { useState, useRef } from 'react'
import { Upload, X, File, Image, CheckCircle } from 'lucide-react'
import { formatFileSize } from '../../../utils/helpers'

const FileUpload = ({
  label,
  accept,
  multiple = false,
  maxSize = 100 * 1024 * 1024, // 100MB
  value = [],
  onChange,
  error,
  helperText,
  required,
  disabled,
  className = '',
  containerClassName = '',
  preview = true,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState(value || [])
  const fileInputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    handleFiles(selectedFiles)
  }

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} exceeds maximum size of ${formatFileSize(maxSize)}`)
        return false
      }
      return true
    })

    let updatedFiles
    if (multiple) {
      updatedFiles = [...files, ...validFiles]
    } else {
      updatedFiles = validFiles.slice(0, 1)
    }

    setFiles(updatedFiles)
    onChange(updatedFiles)
  }

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onChange(updatedFiles)
  }

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return Image
    }
    return File
  }

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-600 mb-2">
          {isDragging ? 'Drop files here' : 'Drag and drop files here'}
        </p>
        <p className="text-sm text-gray-400 mb-4">or click to browse</p>
        <p className="text-xs text-gray-400">
          Max file size: {formatFileSize(maxSize)}
          {accept && ` • Accepted: ${accept}`}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
      )}

      {preview && files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => {
            const FileIcon = getFileIcon(file)
            const isImage = file.type.startsWith('image/')
            
            return (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {isImage && URL.createObjectURL ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <FileIcon className="w-10 h-10 text-primary-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.uploaded && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FileUpload