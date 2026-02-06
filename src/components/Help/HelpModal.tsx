import { Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Lightbulb, ArrowRight, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ScreenHelp } from './helpContent'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
  content: ScreenHelp
}

export function HelpModal({ isOpen, onClose, content }: HelpModalProps) {
  const navigate = useNavigate()

  const handleNavigate = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-surface-border bg-gradient-to-r from-accent-orange/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-orange/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-accent-orange" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl tracking-wide">{content.title}</h2>
                    <p className="text-sm text-text-muted">Help & Guide</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-surface-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                {/* Overview */}
                <div className="p-4 bg-surface-secondary/50 rounded-xl">
                  <p className="text-text-secondary leading-relaxed">{content.overview}</p>
                </div>

                {/* Sections */}
                <div className="space-y-4">
                  {content.sections.map((section, index) => (
                    <motion.div
                      key={section.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-surface-border rounded-xl overflow-hidden"
                    >
                      <div className="p-4 bg-background/50">
                        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 text-accent-orange" />
                          {section.title}
                        </h3>
                        <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                          {section.description}
                        </p>
                        
                        {/* Tips */}
                        {section.tips && section.tips.length > 0 && (
                          <ul className="mt-3 space-y-1.5">
                            {section.tips.map((tip, tipIndex) => (
                              <li 
                                key={tipIndex}
                                className="flex items-start gap-2 text-sm text-text-muted"
                              >
                                <span className="text-accent-orange mt-0.5">-</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Related Screens */}
                        {section.relatedScreens && section.relatedScreens.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {section.relatedScreens.map(screen => (
                              <button
                                key={screen.path}
                                onClick={() => handleNavigate(screen.path)}
                                className="px-3 py-1 text-xs bg-surface-secondary hover:bg-accent-orange/20 border border-surface-border hover:border-accent-orange/50 rounded-full transition-colors flex items-center gap-1"
                              >
                                {screen.name}
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Tips */}
                {content.quickTips.length > 0 && (
                  <div className="p-4 bg-accent-gold/10 border border-accent-gold/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-5 h-5 text-accent-gold" />
                      <h3 className="font-display font-semibold">Quick Tips</h3>
                    </div>
                    <ul className="space-y-2">
                      {content.quickTips.map((tip, index) => (
                        <li 
                          key={index}
                          className="flex items-start gap-2 text-sm text-text-secondary"
                        >
                          <span className="text-accent-gold font-bold">{index + 1}.</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-surface-border bg-background/50 flex justify-between items-center">
                <button
                  onClick={() => handleNavigate('/how-to-play')}
                  className="text-sm text-text-muted hover:text-accent-orange transition-colors flex items-center gap-1"
                >
                  <BookOpen className="w-4 h-4" />
                  Full Guide
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-surface-secondary hover:bg-surface-border rounded-lg text-sm font-medium transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>
  )
}
