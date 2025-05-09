"use client"

import "./globals.css"
import { Inter } from "next/font/google"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import BackgroundPaths from "@/components/background-paths"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://andrewma.b-cdn.net/" crossOrigin="anonymous"></link>
      </head>
      <body className={`${inter.className} min-h-screen relative`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          forcedTheme="light"
        >
          <div className="fixed inset-0 z-0">
            <BackgroundPaths />
          </div>
          <main className="relative z-10">
            {children}
          </main>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}