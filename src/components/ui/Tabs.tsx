import { createContext, useContext, useState, ReactNode } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

// Context for tabs
interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

// Main Tabs container
interface TabsProps {
  defaultValue?: string
  value?: string  // Controlled mode
  onValueChange?: (value: string) => void  // Callback for controlled mode
  children: ReactNode
  className?: string
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  
  // Support both controlled and uncontrolled modes
  const activeTab = value !== undefined ? value : internalValue
  
  const setActiveTab = (tab: string) => {
    // In uncontrolled mode, update internal state
    if (value === undefined) {
      setInternalValue(tab)
    }
    // Always call the callback if provided
    onValueChange?.(tab)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

// Tabs list (the tab buttons container)
interface TabsListProps {
  children: ReactNode
  className?: string
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={clsx(
      'flex gap-1 p-1 bg-surface rounded-lg border border-surface-border',
      className
    )}>
      {children}
    </div>
  )
}

// Individual tab trigger
interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext()
  const isActive = activeTab === value

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={clsx(
        'relative px-4 py-2 text-sm font-medium rounded-md transition-colors',
        isActive 
          ? 'text-white' 
          : 'text-text-muted hover:text-text-secondary',
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-surface-secondary rounded-md"
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  )
}

// Tab content panel
interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab } = useTabsContext()
  
  if (activeTab !== value) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}












