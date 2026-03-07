import { ReactNode, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import clsx from 'clsx'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
}

const sizeVariants = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw]'
}

// Tween transition for predictable exit timing (spring can overshoot or stall)
const backdropTransition = { duration: 0.2, ease: 'easeOut' }
const contentTransition = { type: 'spring' as const, damping: 25, stiffness: 300 }

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  children, 
  size = 'md',
  showCloseButton = true
}: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Safety net: if AnimatePresence fails to unmount, force-hide the backdrop
  useEffect(() => {
    if (!isOpen) {
      safetyTimerRef.current = setTimeout(() => {
        if (backdropRef.current && backdropRef.current.isConnected) {
          // Element is still in DOM after exit should have completed — force hide it
          backdropRef.current.style.display = 'none'
          backdropRef.current.style.pointerEvents = 'none'
        }
      }, 1000)
    }
    return () => {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current)
    }
  }, [isOpen])

  const handleBackdropClick = useCallback(() => {
    onClose()
  }, [onClose])

  const handleCloseButtonClick = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={backdropRef}
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, pointerEvents: 'auto' as const }}
          exit={{ opacity: 0, pointerEvents: 'none' as const }}
          transition={backdropTransition}
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={contentTransition}
            onClick={(e) => e.stopPropagation()}
            className={clsx(
              'w-full bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden',
              sizeVariants[size]
            )}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between p-6 border-b border-surface-border">
                <div>
                  {title && (
                    <h2 className="font-display font-bold text-xl tracking-wide">{title}</h2>
                  )}
                  {subtitle && (
                    <p className="text-sm text-text-muted mt-1">{subtitle}</p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={handleCloseButtonClick}
                    className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-surface-secondary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Confirmation dialog variant
interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info'
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-text-secondary mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button 
          variant={variant === 'danger' ? 'danger' : 'primary'} 
          onClick={handleConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}


