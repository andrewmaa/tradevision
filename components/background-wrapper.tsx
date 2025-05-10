"use client"

import { usePathname } from "next/navigation"
import BackgroundPaths from "./background-paths"

export function BackgroundWrapper() {
  const pathname = usePathname()
  const showBackground = pathname !== '/'

  if (!showBackground) return null

  return (
    <div className="fixed inset-0 z-0">
      <BackgroundPaths />
    </div>
  )
} 