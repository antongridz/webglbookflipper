"use client"
import { useState, useEffect } from "react"
import BookScene from "@/components/BookScene"

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.body.scrollHeight - window.innerHeight
      const progress = scrollHeight <= 0 ? 0 : window.scrollY / scrollHeight
      setScrollProgress(progress)
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Initial call

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Hide title when user starts scrolling (after 5% scroll)
  const titleOpacity = scrollProgress < 0.05 ? 1 : Math.max(0, 1 - (scrollProgress - 0.05) / 0.1)

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '600vh', background: '#f3f4f6' }}>
      {/* 3D Scene Container - Fixed Background */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 40 }}>
        <BookScene />
      </div>

      {/* Scrollable Dummy Content to drive the animation */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '600vh', pointerEvents: 'none' }}>
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        </div>
      </div>

      {/* Title Overlay */}
      <div style={{ 
        position: 'fixed', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        zIndex: 10, 
        pointerEvents: 'none',
        textAlign: 'center',
        fontFamily: '"Google Sans Flex", sans-serif',
        fontWeight: 900,
        color: 'rgba(20, 20, 20, 1)',
        opacity: titleOpacity,
        transition: 'opacity 0.3s ease-out'
      }}>
        <div style={{ fontSize: '176px', lineHeight: '1', letterSpacing: '-4px' }}>ONY</div>
        <div style={{ fontSize: '160px', lineHeight: '1', letterSpacing: '-4px' }}>2025</div>
      </div>

      {/* UI Overlay */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 20, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', padding: '16px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
        <h1 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interactive Portfolio</h1>
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Scroll to open & flip</p>
      </div>
    </div>
  )
}

