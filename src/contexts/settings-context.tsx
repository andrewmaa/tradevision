"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface SettingsContextType {
  showRawData: boolean
  showTooltips: boolean
  setShowRawData: (value: boolean) => void
  setShowTooltips: (value: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [showRawData, setShowRawData] = useState(false)
  const [showTooltips, setShowTooltips] = useState(true)

  useEffect(() => {
    const savedShowRawData = localStorage.getItem("showRawData")
    const savedShowTooltips = localStorage.getItem("showTooltips")
    
    if (savedShowRawData !== null) {
      setShowRawData(savedShowRawData === "true")
    }
    if (savedShowTooltips !== null) {
      setShowTooltips(savedShowTooltips === "true")
    }
  }, [])

  const handleShowRawDataChange = (value: boolean) => {
    setShowRawData(value)
    localStorage.setItem("showRawData", value.toString())
  }

  const handleShowTooltipsChange = (value: boolean) => {
    setShowTooltips(value)
    localStorage.setItem("showTooltips", value.toString())
  }

  return (
    <SettingsContext.Provider
      value={{
        showRawData,
        showTooltips,
        setShowRawData: handleShowRawDataChange,
        setShowTooltips: handleShowTooltipsChange,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
} 