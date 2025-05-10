"use client"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { useSettings } from "@/contexts/settings-context"

interface SettingsAwareTooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export function SettingsAwareTooltip({
  children,
  content,
  side = "top",
  align = "center",
}: SettingsAwareTooltipProps) {
  const { showTooltips } = useSettings()

  if (!showTooltips) {
    return <>{children}</>
  }

  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <div className="cursor-help">
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side={side} align={align}>
        {content}
      </HoverCardContent>
    </HoverCard>
  )
} 