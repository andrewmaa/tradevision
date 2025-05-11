"use client"

import { useEffect, useState } from "react"

export function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // 1024px is the lg breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMobile) return null

  return (
    <div className="fixed inset-0 bg-background z-[100] flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Mobile Access Not Supported</h1>
        <p className="text-muted-foreground">
          This application is currently optimized for desktop use only. Please access TradeVision from a desktop or laptop computer for the best experience.
        </p>
      </div>
    </div>
  )
} 