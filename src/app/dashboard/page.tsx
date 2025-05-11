"use client"
import { Sidebar } from "@/components/sidebar"
import Dashboard from "@/components/Dashboard"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen text-black">
      <div className="flex min-h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex justify-center">
          <main className="w-full max-w-[1200px] p-6 lg:p-8 flex flex-col">
            <div className="flex flex-col items-center justify-center gap-6 mb-8">
              <h1 className="text-3xl font-bold mt-4" style = {{fontSize: "40px"}}>Dashboard</h1>
            </div>
            <div className="flex-1">
              <Dashboard />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
} 