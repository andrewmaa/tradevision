<<<<<<< HEAD
"use client"

=======
import type React from "react"
>>>>>>> parent of 270fce9 (Update project configuration, enhance UI components, and improve backend functionality)
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import BackgroundPaths from "@/components/BackgroundPaths"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "TradeVision",
  description: "Investment tracking platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
<<<<<<< HEAD
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
          <Toaster />
=======
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
>>>>>>> parent of 270fce9 (Update project configuration, enhance UI components, and improve backend functionality)
        </ThemeProvider>
      </body>
    </html>
  )
}
