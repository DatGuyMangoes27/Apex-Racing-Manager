import { useState, useEffect } from 'react'
import { Minus, Square, X, Maximize2 } from 'lucide-react'

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  const handleMinimize = () => window.electron?.minimize?.()
  const handleMaximize = () => { window.electron?.maximize?.(); setIsMaximized(!isMaximized) }
  const handleClose = () => window.electron?.close?.()

  return (
    <div className="h-8 bg-gray-900 flex items-center justify-between select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="px-3 text-xs font-medium text-text-muted">AMS2 Career Companion</div>
      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button onClick={handleMinimize} className="px-3 hover:bg-gray-700 transition-colors flex items-center">
          <Minus className="w-3.5 h-3.5 text-text-muted" />
        </button>
        <button onClick={handleMaximize} className="px-3 hover:bg-gray-700 transition-colors flex items-center">
          {isMaximized ? <Square className="w-3 h-3 text-text-muted" /> : <Maximize2 className="w-3.5 h-3.5 text-text-muted" />}
        </button>
        <button onClick={handleClose} className="px-3 hover:bg-red-600 transition-colors flex items-center">
          <X className="w-3.5 h-3.5 text-text-muted" />
        </button>
      </div>
    </div>
  )
}
