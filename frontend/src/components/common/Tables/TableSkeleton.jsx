import React from 'react'

const TableSkeleton = ({ columns = 5, rows = 5, className = '' }) => {
  return (
    <div className={`w-full animate-pulse ${className}`}>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(Math.min(columns, 4))].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-4 gap-4">
                {[...Array(Math.min(columns, 4))].map((_, j) => (
                  <div
                    key={j}
                    className={`h-4 bg-gray-200 rounded ${j === 0 ? 'w-3/4' : 'w-1/2'}`}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TableSkeleton