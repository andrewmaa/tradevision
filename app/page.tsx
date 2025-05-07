"use client"

import { useState } from "react"
import { ChevronDown, Search, Shield, HelpCircle } from "lucide-react"
import AnalyzeStock from '../components/AnalyzeStock'

export default function TradeVision() {
  const [searchValue, setSearchValue] = useState("")
  const [shouldAnalyze, setShouldAnalyze] = useState(false)
  const [currentSearch, setCurrentSearch] = useState("")

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
    <div className="flex w-full min-h-screen">
      {/* Sidebar */}
      <div className="w-56 bg-white flex flex-col border-r border-[#dbdbdb]">
        <div className="p-6 flex items-center gap-2">
          <div className="relative w-8 h-8">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 4L28 16L16 28L4 16L16 4Z" fill="#d4f9ed" />
              <path d="M10 14L16 8L22 14" stroke="#00A3FF" strokeWidth="2" />
              <path d="M22 18L16 24L10 18" stroke="#00A3FF" strokeWidth="2" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-black">TradeVision</h1>
        </div>

        <div className="mt-6">
          <div className="flex items-center px-6 py-2 text-[#484848] font-medium">
            <ChevronDown className="w-4 h-4 mr-2" />
            <svg className="w-4 h-4 mr-2" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="6" height="6" rx="1" stroke="#484848" strokeWidth="1.5" />
              <rect x="1" y="9" width="6" height="6" rx="1" stroke="#484848" strokeWidth="1.5" />
              <rect x="9" y="1" width="6" height="6" rx="1" stroke="#484848" strokeWidth="1.5" />
              <rect x="9" y="9" width="6" height="6" rx="1" stroke="#484848" strokeWidth="1.5" />
            </svg>
            <span>Dashboard</span>
          </div>

          <div className="flex items-center px-6 py-2 pl-12 text-[#484848]">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="3" width="12" height="10" rx="1" stroke="#484848" strokeWidth="1.5" />
              <path d="M5 7L7 9L11 5" stroke="#484848" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>My Investments</span>
          </div>
        </div>

        <div className="px-6 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
            <input
              type="text"
              placeholder="Search"
              className="w-full py-2 pl-9 pr-3 bg-[#d4f9ed]/30 rounded-md text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-auto mb-6 space-y-4">
          <div className="flex items-center px-6 py-2 text-[#484848]">
            <Shield className="w-4 h-4 mr-2" />
            <span>Security</span>
          </div>
          <div className="flex items-center px-6 py-2 text-[#484848]">
            <HelpCircle className="w-4 h-4 mr-2" />
            <span>Help Center</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[#f5f5f5]">
        {/* Search bar at the top */}
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
        {/* Results below search bar, scrollable if needed */}
        <div className="flex-1 px-4 pb-8 overflow-y-auto">
          {shouldAnalyze && <AnalyzeStock key={currentSearch} searchValue={currentSearch} />}
        </div>
      </div>
    </div>
  )
}
