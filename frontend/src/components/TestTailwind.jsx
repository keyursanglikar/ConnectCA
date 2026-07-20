import React from 'react'

const TestTailwind = () => {
  return (
    <div className="p-8">
      <div className="bg-blue-500 text-white p-4 rounded-lg mb-4">
        Tailwind CSS is working!
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-500 p-4 rounded text-white">Red</div>
        <div className="bg-green-500 p-4 rounded text-white">Green</div>
        <div className="bg-purple-500 p-4 rounded text-white">Purple</div>
      </div>
      <button className="btn-primary mt-4">Primary Button</button>
      <button className="btn-secondary mt-4 ml-2">Secondary Button</button>
    </div>
  )
}

export default TestTailwind