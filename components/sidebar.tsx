"use client"

import { useState } from "react"
import { X, Menu, Wallet, LayoutDashboard, BarChart3, Globe, Home, ChevronDown, LifeBuoy, Settings, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`fixed top-4 z-[60] pl-4 pr-2 py-2 rounded-md bg-background/50 backdrop-blur lg:hidden transition-all duration-200 ease-in-out ${
          isSidebarOpen ? 'left-[260px]' : 'left-4'
        }`}
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
          ${className}
        `}
      >
        <div className="flex h-20 items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
            <span className="font-bold font-PPTelegraf tracking-tight" style={{ fontSize: '24px' }}>TradeVision</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-md hover:bg-accent lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="space-y-2 px-4 py-4">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => window.location.href = '/dashboard'}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => window.location.href = '/analyze'}>
            <BarChart3 className="h-4 w-4" />
            Stock Analysis
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Globe className="h-4 w-4" />
            Market
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Home className="h-4 w-4" />
            Funding
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Wallet className="h-4 w-4" />
            Yield Vaults
            <ChevronDown className="ml-auto h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <LifeBuoy className="h-4 w-4" />
            Support
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </nav>
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