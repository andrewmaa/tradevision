import "./globals.css"
import { Inter } from "next/font/google"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { SettingsProvider } from "@/contexts/settings-context"
import { Metadata } from "next"
import { BackgroundWrapper } from "@/components/background-wrapper"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'TradeVision',
  description: 'Your intelligent trading companion',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://andrewma.b-cdn.net/" crossOrigin="anonymous"></link>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.className} min-h-screen relative`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange
        >
          <SettingsProvider>
            <BackgroundWrapper />
            <main className="relative z-10">
              {children}
            </main>
          </SettingsProvider>
          <Toaster />
        </ThemeProvider>
      </body>
      <Analytics />
    </html>
  )
}