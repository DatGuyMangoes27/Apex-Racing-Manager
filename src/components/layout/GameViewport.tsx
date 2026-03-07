import { ReactNode, useEffect, useRef, useState } from 'react'

// Fixed internal resolution — all UI is designed for this size
const DESIGN_WIDTH = 1920
const DESIGN_HEIGHT = 1080

interface GameViewportProps {
  children: ReactNode
}

/**
 * GameViewport renders the entire app at a fixed 1920×1080 internal resolution,
 * then scales it to fit the actual window — exactly like a game engine.
 * UI elements remain the same pixel size regardless of window dimensions.
 */
export function GameViewport({ children }: GameViewportProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const el = outerRef.current
    if (!el) return

    function recalc() {
      const w = window.innerWidth
      const h = window.innerHeight
      const s = Math.min(w / DESIGN_WIDTH, h / DESIGN_HEIGHT)
      setScale(s)
      // Center the scaled content (letterboxing)
      setOffset({
        x: Math.max(0, (w - DESIGN_WIDTH * s) / 2),
        y: Math.max(0, (h - DESIGN_HEIGHT * s) / 2),
      })
    }

    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [])

  return (
    <div
      ref={outerRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          left: offset.x,
          top: offset.y,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  )
}
