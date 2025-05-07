"use client"

import { useState } from "react"
import { Search, Home, BarChart2, Settings, BookOpen, Menu, X } from "lucide-react"
import AnalyzeStock from '../components/AnalyzeStock'

export default function TradeVision() {
  const [searchValue, setSearchValue] = useState("")
  const [shouldAnalyze, setShouldAnalyze] = useState(false)
  const [currentSearch, setCurrentSearch] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleAnalyze = () => {
    if (searchValue.trim()) {
      setCurrentSearch(searchValue.trim().toUpperCase());
      setShouldAnalyze(true);
    }
  }

  // Only run pipeline when button is pressed or Enter is hit
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  return (
    <main className="min-h-screen flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md md:hidden"
      >
        {isSidebarOpen ? (
          <X className="w-6 h-6 text-[#484848]" />
        ) : (
          <Menu className="w-6 h-6 text-[#484848]" />
        )}
      </button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-56 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#484848] mb-12">TradeVision</h1>
          <nav className="space-y-6">
            <a href="#" className="flex items-center space-x-3 text-[#484848] hover:text-[#8d8d8d] transition-colors">
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </a>
            <a href="#" className="flex items-center space-x-3 text-[#484848] hover:text-[#8d8d8d] transition-colors">
              <BarChart2 className="w-5 h-5" />
              <span>Analysis</span>
            </a>
            <a href="#" className="flex items-center space-x-3 text-[#484848] hover:text-[#8d8d8d] transition-colors">
              <BookOpen className="w-5 h-5" />
              <span>Learn</span>
            </a>
            <a href="#" className="flex items-center space-x-3 text-[#484848] hover:text-[#8d8d8d] transition-colors">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </a>
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 md:ml-56 bg-[#f5f5f5] min-h-screen">
        <div className="w-full max-w-xl mx-auto pt-8 pb-4 px-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Search className="w-5 h-5 text-[#8d8d8d]" />
            </div>
            <input
              type="text"
              placeholder="Enter stock symbols (comma-separated)..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="w-full py-3 pl-12 pr-12 bg-white rounded-full shadow-md focus:outline-none text-[#484848]"
            />
            <button 
              onClick={handleAnalyze}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#f5f5f5] rounded-full p-2 hover:bg-[#e5e5e5] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 5L19 12L12 19"
                  stroke="#8d8d8d"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M5 12H19" stroke="#8d8d8d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 px-4 pb-8 overflow-y-auto">
          {shouldAnalyze && <AnalyzeStock key={currentSearch} searchValue={currentSearch} />}
        </div>
      </div>
    </main>
  )
}
