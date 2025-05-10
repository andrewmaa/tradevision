"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useSettings } from "@/contexts/settings-context"
import { Github, Globe, Mail } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { showRawData, showTooltips, setShowRawData, setShowTooltips } = useSettings()

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>Customize how data is displayed in the application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Raw Data</Label>
                <p className="text-sm text-muted-foreground">
                  Display raw data tables on the analysis page
                </p>
              </div>
              <Switch
                checked={showRawData}
                onCheckedChange={setShowRawData}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Tooltips</Label>
                <p className="text-sm text-muted-foreground">
                  Display helpful tooltips throughout the application
                </p>
              </div>
              <Switch
                checked={showTooltips}
                onCheckedChange={setShowTooltips}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credits & Acknowledgments</CardTitle>
            <CardDescription>Special thanks to the following resources and contributors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
            <div>
                <h3 className="font-semibold mb-2">Contributors</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Andrew Ma - Fullstack Developer</li>
                  <li>• Kirsten Seto - UI/UX Designer</li>
                  <li>• Elisavet Perpatari - Backend Developer</li>
                  <li>• Esther Mizrachi - Backend Developer</li>
                  <li>• Terezia Juras - Backend Developer</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">API Providers</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Yahoo Finance - Financial data and market information</li>
                  <li>• Alpha Vantage - Real-time and historical stock data</li>
                  <li>• NewsAPI - News articles and sentiment analysis</li>
                  <li>• Reddit API - Social media sentiment and engagement</li>
                  <li>• OpenAI - ChatGPT for natural language processing</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Technologies</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Next.js - React framework for production</li>
                  <li>• Tailwind CSS - Utility-first CSS framework</li>
                  <li>• Python Flask - Backend framework</li>
                  <li>• Flask SSE - Server-Sent Events</li>
                  <li>• nltk - Natural language processing library</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Contact & Support</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Link href="mailto:andrew.ma@nyu.edu" className="flex items-center gap-2 hover:text-primary">
                    <Mail className="h-4 w-4" />
                    andrew.ma@nyu.edu
                  </Link>
                  <Link href="https://github.com/andrewmaa" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary">
                    <Github className="h-4 w-4" />
                    GitHub
                  </Link>
                  <Link href="https://andrewma.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary">
                    <Globe className="h-4 w-4" />
                    Website
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 