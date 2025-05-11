"use client"

import { motion, useAnimationControls } from "framer-motion"
import { useEffect } from "react"

function FloatingPaths({ position }: { position: number }) {
  const controls = useAnimationControls()

  useEffect(() => {
    controls.start({
      pathLength: 1,
      opacity: [0.3, 0.6, 0.3],
      pathOffset: [0, 1, 0],
      transition: {
        duration: 20 + Math.random() * 10,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      }
    })
  }, [controls])

  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 696 316" fill="none">
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#43EFB9" /> 
            <stop offset="60%" stopColor="#4F49FF" /> 
            <stop offset="70%" stopColor="#43EFB9" /> 
          </linearGradient>
        </defs>
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="url(#pathGradient)"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={controls}
          />
        ))}
      </svg>
    </div>
  )
}

export default function BackgroundPaths() {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-transparent">
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>
    </div>
  )
} 