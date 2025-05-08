"use client"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Input } from "@/components/ui/input"
import AnalyzeStock from "@/components/AnalyzeStock"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export default function AnalyzePage() {
  const [searchValue, setSearchValue] = useState("")
  const [shouldAnalyze, setShouldAnalyze] = useState(false)
  const [currentSearch, setCurrentSearch] = useState("")
  const router = useRouter()

  const handleAnalyze = () => {
    if (searchValue.trim()) {
      setCurrentSearch(searchValue.trim().toUpperCase());
      setShouldAnalyze(true);
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="lg:grid lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <main className="p-6 lg:p-8 flex flex-col min-h-screen">
          <motion.div 
            className="flex flex-col items-center"
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
          >
            <h1 
              className="font-bold font-PPTelegraf tracking-tight" 
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
          <AnimatePresence>
            {shouldAnalyze && (
              <motion.div 
                className="mt-6 p-6 min-h-[200px] w-full"
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
                <AnalyzeStock key={currentSearch} searchValue={currentSearch} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
} 