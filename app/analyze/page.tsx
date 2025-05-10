"use client"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Input } from "@/components/ui/input"
import AnalyzeStock from "@/components/AnalyzeStock"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export default function AnalyzePage() {
  const [searchValue, setSearchValue] = useState("")
  const [shouldAnalyze, setShouldAnalyze] = useState(false)
  const [currentSearch, setCurrentSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showData, setShowData] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Add effect to handle URL parameters
  useEffect(() => {
    const ticker = searchParams.get('ticker')
    if (ticker) {
      setSearchValue(ticker)
      setCurrentSearch(ticker.toUpperCase())
      setShouldAnalyze(true)
      setShowData(true)
      setIsLoading(true)
    }
  }, [searchParams])

  const handleAnalyze = () => {
    if (searchValue.trim()) {
      // Only reset data-related states
      setShowData(false);
      setIsLoading(true);
      setCurrentSearch(searchValue.trim().toUpperCase());
      
      // Only set shouldAnalyze if it's the first search
      if (!shouldAnalyze) {
        setShouldAnalyze(true);
      } else {
        // If we're already analyzed, show data after a brief delay
        setTimeout(() => {
          setShowData(true);
        }, 100);
      }
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen">
      <div className="lg:grid lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <main className="p-6 lg:p-8 flex flex-col min-h-screen relative">
          <motion.div 
            className="flex flex-col items-center relative z-10 bg-background/30 backdrop-blur-sm rounded-2xl p-8 w-full max-w-lg mx-auto"
            initial={{ y: "calc(50vh - 50%)", gap: "1.5rem" }}
            animate={{
              y: shouldAnalyze ? 0 : "calc(50vh - 50%)",
              gap: shouldAnalyze ? "0.5rem" : "1.5rem"
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              duration: 0.5
            }}
            onAnimationComplete={() => {
              if (shouldAnalyze && !showData) {
                setShowData(true);
              }
            }}
          >
            <img src="/logo.svg" alt="Logo" className="h-16 w-16" />
            <h1 
              className="font-bold font-PPTelegraf tracking-tight text-foreground" 
              style={{ fontSize: '60px' }}
            >
              TradeVision
            </h1>
            <div className="flex justify-center px-4 py-4 gap-2 max-w-md">
              <Input 
                placeholder="Search" 
                className="bg-background/50" 
                value={searchValue} 
                onChange={(e) => setSearchValue(e.target.value)} 
                onKeyDown={handleInputKeyDown} 
              />
              <Button variant="default" onClick={handleAnalyze}>Analyze</Button>
            </div>
          </motion.div>
          <AnimatePresence mode="wait">
            {showData && (
              <motion.div 
                key={currentSearch}
                className="mt-6 p-6 min-h-[200px] w-full relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                  duration: 0.5
                }}
              >
                <div className="w-full max-w-4xl mx-auto">
                  <div className="min-h-[400px]">
                    <AnalyzeStock 
                      key={currentSearch} 
                      searchValue={currentSearch} 
                      onLoadingChange={setIsLoading}
                      onSearchValueChange={setSearchValue}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </main>
      </div>
    </div>
  )
} 