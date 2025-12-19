"use client"
import BookScene from "@/components/BookScene"

export default function Page() {
  return (
    <div className="relative w-full bg-gray-100">
      {/* 3D Scene Container - Fixed Background */}
      <div className="fixed inset-0 z-0">
        <BookScene />
      </div>

      {/* Scrollable Dummy Content to drive the animation */}
      <div className="relative z-10 w-full h-[600vh] pointer-events-none">
        {/* We can place floating HTML markers here if needed in the future */}
      </div>

      {/* UI Overlay */}
      <div className="fixed top-5 right-5 z-20 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200">
        <h1 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Interactive Portfolio</h1>
        <p className="text-xs text-gray-500 mt-1">Scroll to open & flip</p>
      </div>
    </div>
  )
}
