"use client"

import { useState, useEffect } from "react"
import { X, Menu, Wallet, LayoutDashboard, BarChart3, Globe, Home, ChevronDown, LifeBuoy, Settings, Eye, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import { MobileWarning } from "./mobile-warning"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // After mounting, we have access to the theme
  useEffect(() => setMounted(true), [])

  return (
    <>
      <MobileWarning />
      {/* Hamburger Menu Button - Only visible on mobile when sidebar is closed */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className={`fixed top-4 left-4 p-2 z-[60] rounded-md z-40 lg:hidden text-foreground ${isSidebarOpen ? "hidden" : ""}`}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          bg-background border-r
          w-[280px]
          transition-all duration-200 ease-in-out
          z-50
          lg:static lg:block
          ${isSidebarOpen ? "fixed inset-y-0 left-0 translate-x-0" : "fixed inset-y-0 left-0 -translate-x-full"}
          lg:translate-x-0
          flex flex-col min-h-screen relative
          ${className}
        `}
      >
        <div className="flex h-20 items-center justify-between border-b px-6 py-4">
          <button 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer" 
            onClick={() => window.location.href = '/'}
            aria-label="Go to home page"
          >
            <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
            <span className="font-bold font-PPTelegraf tracking-tight text-foreground" style={{ fontSize: '24px' }}>TradeVision</span>
          </button>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-md lg:hidden text-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="space-y-2 px-4 py-4">
          <Button variant="ghost" className="w-full justify-start gap-2 text-foreground" onClick={() => window.location.href = '/dashboard'}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-foreground" onClick={() => window.location.href = '/analyze'}>
            <BarChart3 className="h-4 w-4" />
            Stock Analysis
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-foreground" onClick={() => window.location.href = '/market'}>
            <Globe className="h-4 w-4" />
            Market
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-foreground">
            <Home className="h-4 w-4" />
            Funding
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-foreground">
            <Wallet className="h-4 w-4" />
            Yield Vaults
            <ChevronDown className="ml-auto h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-foreground">
            <LifeBuoy className="h-4 w-4" />
            Support
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-foreground">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 px-4 py-4">
          {/* Theme Toggle Button */}
          <Button
            variant="default"
            size="icon"
            className="w-10 h-10"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  )
}