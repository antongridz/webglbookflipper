"use client"
import BookScene from "@/components/BookScene"

export default function App() {
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '600vh', background: '#f3f4f6' }}>
      {/* 3D Scene Container - Fixed Background */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <BookScene />
      </div>

      {/* Scrollable Dummy Content to drive the animation */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '600vh', pointerEvents: 'none' }}>
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        </div>
      </div>

      {/* UI Overlay */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 20, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', padding: '16px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
        <h1 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interactive Portfolio</h1>
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Scroll to open & flip</p>
      </div>
    </div>
  )
}
