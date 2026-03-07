import { useState, createContext, useContext, useCallback, type ReactNode } from 'react'

// ============================================
// TOAST SYSTEM
// ============================================

interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {}
})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration || 3000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-right ${
              toast.type === 'success' ? 'bg-green-600 text-white' :
              toast.type === 'error' ? 'bg-red-600 text-white' :
              toast.type === 'warning' ? 'bg-yellow-500 text-black' :
              'bg-gray-700 text-white'
            }`}
            onClick={() => removeToast(toast.id)}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  return {
    toast: context.addToast,
    toasts: context.toasts,
    addToast: context.addToast,
    removeToast: context.removeToast,
    success: (message: string) => context.addToast({ message, type: 'success' }),
    error: (message: string) => context.addToast({ message, type: 'error' }),
    warning: (message: string) => context.addToast({ message, type: 'warning' }),
    info: (message: string) => context.addToast({ message, type: 'info' })
  }
}

export function createWeekToast(week: number, year: number) {
  return { message: `Week ${week}, Year ${year}`, type: 'info' as const }
}

export function createSaveToast() {
  return { message: 'Game saved successfully', type: 'success' as const }
}

export function createAchievementToast(achievementName: string) {
  return { message: `Achievement Unlocked: ${achievementName}`, type: 'success' as const, duration: 5000 }
}
