"use client"
import { Sidebar } from "@/components/sidebar"
import Dashboard from "@/components/Dashboard"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen text-black">
      <div className="lg:grid lg:grid-cols-[280px_1fr] min-h-screen">
        <Sidebar />
        <main className="p-6 lg:p-8 flex flex-col relative">
          <div className="flex flex-col items-center justify-center gap-6 mb-8 relative z-10">
            <h1 className="text-3xl font-bold" style = {{fontSize: "40px"}}>Dashboard</h1>
          </div>
          <div className="flex-1 relative z-10">
            <Dashboard />
          </div>
        </main>
      </div>
    </div>
  )
} 