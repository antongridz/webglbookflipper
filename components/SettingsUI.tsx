"use client"

import type React from "react"
import { useState } from "react"
import { Settings, X, ChevronDown, Sparkles, Sun, Maximize, MousePointer2, Moon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { BookConfig } from "@/types/book"
import { useEffect } from "react"

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  unit?: string
}

const CustomSlider: React.FC<SliderProps> = ({ 
  label, 
  value, 
  min, 
  max, 
  step = 1, 
  onChange, 
  unit = ""
}) => {
  const [isTouching, setIsTouching] = useState(false)
  const percentage = ((value - min) / (max - min)) * 100

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number.parseFloat(e.target.value))
  }

  return (
    <div className="w-full rounded-xl px-4 py-2 transition-all duration-300 border border-border bg-secondary/30 hover:bg-secondary/50">
      <div className="flex items-center gap-4">
        {/* Label */}
        <div className="flex items-center gap-1 shrink-0 w-28">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-white">
            {label}
          </span>
        </div>

        {/* Slider Area */}
        <div className="relative flex-1 h-8 flex items-center">
          {/* Track */}
          <div className="absolute w-full h-1 bg-input rounded-full" />
          
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSliderChange}
            onMouseDown={() => setIsTouching(true)}
            onMouseUp={() => setIsTouching(false)}
            onTouchStart={() => setIsTouching(true)}
            onTouchEnd={() => setIsTouching(false)}
            onTouchCancel={() => setIsTouching(false)}
            className="absolute w-full h-8 opacity-0 cursor-pointer z-10"
          />

          {/* Animated Thumb */}
          <motion.div
            className="absolute bg-primary rounded-full shadow-lg z-20 pointer-events-none"
            style={{ left: `${percentage}%` }}
            animate={{
              width: isTouching ? "64px" : "12px",
              height: "32px",
              x: "-50%",
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          />
        </div>

        {/* Value */}
        <div className="shrink-0 w-10 text-right">
          <span className="text-xs font-mono font-bold text-foreground">
            {value}{unit}
          </span>
        </div>
      </div>
    </div>
  )
}

interface SettingsUIProps {
  config: BookConfig
  onChange: (config: BookConfig) => void
  onReset: () => void
}

const SettingsUI: React.FC<SettingsUIProps> = ({ config, onChange, onReset }) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (config.isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [config.isDarkMode])

  const updateConfig = (key: keyof BookConfig, value: any) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="fixed top-5 right-5 z-[1000]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-2xl transition-all active:scale-90 border border-border bg-background/80 backdrop-blur-md ${
          isOpen ? "text-primary rotate-90" : "text-foreground hover:bg-accent"
        }`}
      >
        {isOpen ? <X size={24} /> : <Settings size={24} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute top-16 right-0 w-[400px] max-h-[85vh] overflow-hidden rounded-[2rem] border border-border bg-background/80 backdrop-blur-2xl shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-black tracking-tight uppercase">Config</h2>
              <button 
                onClick={onReset}
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-full border border-border hover:border-primary"
              >
                Reset
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* General */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 mb-2 opacity-50 text-zinc-600 dark:text-white">
                  <Maximize size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">General</span>
                </div>
                <CustomSlider label="Page Count" value={config.pageCount} min={2} max={50} step={1} onChange={(v) => updateConfig("pageCount", v)} />
              </section>

              {/* Material & Effects */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 mb-2 opacity-50 text-zinc-600 dark:text-white">
                  <Sparkles size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Material & FX</span>
                </div>
                
                <div className="flex gap-2 mb-2">
                  {/* Dark Mode Toggle */}
                  <div className="flex-1 rounded-xl px-4 py-3 transition-all border border-border bg-secondary/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {config.isDarkMode ? <Moon size={14} className="text-primary" /> : <Sun size={14} className="text-primary" />}
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-white">Dark Mode</span>
                    </div>
                    <button
                      onClick={() => updateConfig("isDarkMode", !config.isDarkMode)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${config.isDarkMode ? "bg-primary" : "bg-input"}`}
                    >
                      <motion.div 
                        animate={{ x: config.isDarkMode ? 22 : 2 }}
                        className="absolute top-1 w-3 h-3 bg-background rounded-full shadow-lg"
                      />
                    </button>
                  </div>

                  {/* Holographic Toggle */}
                  <div className="flex-1 rounded-xl px-4 py-3 transition-all border border-border bg-secondary/30 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-white">Hologram</span>
                    <button
                      onClick={() => updateConfig("holographic", !config.holographic)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${config.holographic ? "bg-primary" : "bg-input"}`}
                    >
                      <motion.div 
                        animate={{ x: config.holographic ? 22 : 2 }}
                        className="absolute top-1 w-3 h-3 bg-background rounded-full shadow-lg"
                      />
                    </button>
                  </div>
                </div>

                <CustomSlider label="Roughness" value={config.roughness} min={0} max={1} step={0.01} onChange={(v) => updateConfig("roughness", v)} />
                <CustomSlider label="Metalness" value={config.metalness} min={0} max={1} step={0.01} onChange={(v) => updateConfig("metalness", v)} />
                <CustomSlider label="Tilt" value={config.tiltSensitivity} min={0} max={1} step={0.01} onChange={(v) => updateConfig("tiltSensitivity", v)} />
              </section>

              {/* Lighting */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 mb-2 opacity-50 text-zinc-600 dark:text-white">
                  <Sun size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Lighting</span>
                </div>
                <CustomSlider label="Intensity" value={config.lightIntensity} min={0} max={5} step={0.1} onChange={(v) => updateConfig("lightIntensity", v)} />
                <CustomSlider label="Softness" value={config.shadowRadius} min={0} max={20} step={0.5} onChange={(v) => updateConfig("shadowRadius", v)} />
                <CustomSlider label="Light X" value={config.lightX} min={-20} max={20} step={0.5} onChange={(v) => updateConfig("lightX", v)} />
                <CustomSlider label="Light Y" value={config.lightY} min={0} max={30} step={0.5} onChange={(v) => updateConfig("lightY", v)} />
                <CustomSlider label="Light Z" value={config.lightZ} min={-20} max={20} step={0.5} onChange={(v) => updateConfig("lightZ", v)} />
              </section>

              {/* Theme */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 mb-2 opacity-50 text-zinc-600 dark:text-white">
                  <ChevronDown size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Environment</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["Studio", "Dark", "Warm", "Cyber"].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => updateConfig("envPreset", preset)}
                      className={`py-3 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                        config.envPreset === preset 
                          ? "bg-primary text-primary-foreground border-primary shadow-md" 
                          : "bg-secondary/30 border-border text-muted-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </section>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-border flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
              <MousePointer2 size={12} />
              Scroll to explore
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}

export default SettingsUI

