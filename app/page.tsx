"use client"
import { useState, useEffect } from "react"
import BookScene from "@/components/BookScene"

export default function Page() {
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
    <div className="relative w-full min-h-[600vh]">
      {/* 3D Scene Container - Fixed Background */}
      <div className="fixed inset-0 z-40">
        <BookScene />
      </div>

      {/* Scrollable Dummy Content to drive the animation */}
      <div className="relative z-1 w-full h-[600vh] pointer-events-none">
        {/* Spacer for 100vh */}
        <div className="h-screen" />
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
        fontFamily: 'var(--font-sans)',
        fontWeight: 900,
        color: 'rgba(20, 20, 20, 1)',
        opacity: titleOpacity,
        transition: 'opacity 0.3s ease-out'
      }}>
        <div style={{ fontSize: '176px', lineHeight: '1', letterSpacing: '-4px' }}>ONY</div>
        <div style={{ fontSize: '160px', lineHeight: '1', letterSpacing: '-4px' }}>2025</div>
      </div>
    </div>
  )
}
