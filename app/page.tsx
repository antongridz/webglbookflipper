"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import BookScene from "@/components/BookScene"
import SettingsUI from "@/components/SettingsUI"
import { DEFAULT_BOOK_CONFIG, BookConfig } from "@/types/book"

export default function Page(props: { params: Promise<any>, searchParams: Promise<any> }) {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingPercentage, setLoadingProgress] = useState(0)
  const [config, setConfig] = useState<BookConfig>(DEFAULT_BOOK_CONFIG)

  const handleReset = () => {
    setConfig(DEFAULT_BOOK_CONFIG)
  }

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
      {/* Preloader */}
      {isLoading && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-background transition-opacity duration-500">
          <div className="mb-4 text-4xl font-black tracking-tighter text-foreground animate-pulse">
            ONY
          </div>
          <div className="mb-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Loading {loadingPercentage}%
          </div>
          <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out" 
              style={{ width: `${loadingPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* 3D Scene Container - Fixed Background */}
      <div className="fixed inset-0 z-40">
        <BookScene 
          config={config}
          onLoad={() => setIsLoading(false)} 
          onProgress={(p) => setLoadingProgress(p)}
        />
      </div>

      <SettingsUI 
        config={config} 
        onChange={setConfig} 
        onReset={handleReset} 
      />

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
        color: 'var(--foreground)',
        opacity: titleOpacity,
        transition: 'opacity 0.3s ease-out',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <motion.div 
          initial={{ opacity: 0, y: "40%" }}
          animate={!isLoading ? { opacity: 1, y: 0 } : {}}
          transition={{ 
            duration: 0.8, 
            ease: [0.215, 0.61, 0.355, 1], // cubic-bezier для плавного выезда
            delay: 0.1 
          }}
          style={{ fontSize: '176px', lineHeight: '0.9', letterSpacing: '-4px' }}
        >
          ONY
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: "40%" }}
          animate={!isLoading ? { opacity: 1, y: 0 } : {}}
          transition={{ 
            duration: 0.8, 
            ease: [0.215, 0.61, 0.355, 1],
            delay: 0.2 // Задержка 100мс после первой анимации
          }}
          style={{ fontSize: '160px', lineHeight: '0.9', letterSpacing: '-4px' }}
        >
          2025
        </motion.div>
      </div>
    </div>
  )
}
