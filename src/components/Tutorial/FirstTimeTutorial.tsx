import { useState, useEffect, useCallback } from 'react'

// ============================================
// TUTORIAL STATE HOOK
// ============================================

export function useTutorialState() {
  const [shouldShowTutorial, setShouldShowTutorial] = useState(false)

  useEffect(() => {
    const hasCompleted = localStorage.getItem('tutorial_completed')
    if (!hasCompleted) {
      setShouldShowTutorial(true)
    }
  }, [])

  const markTutorialComplete = useCallback(() => {
    localStorage.setItem('tutorial_completed', 'true')
    setShouldShowTutorial(false)
  }, [])

  return { shouldShowTutorial, markTutorialComplete }
}

// ============================================
// FIRST TIME TUTORIAL COMPONENT
// ============================================

interface FirstTimeTutorialProps {
  onComplete: () => void
}

export function FirstTimeTutorial({ onComplete }: FirstTimeTutorialProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl p-8 max-w-lg mx-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Welcome to AMS2 Career Companion</h2>
        <p className="text-gray-300 mb-6">
          Manage your racing career, team finances, personal life, and more.
          Navigate using the sidebar to explore different aspects of your career.
        </p>
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Get Started
        </button>
      </div>
    </div>
  )
}

export default FirstTimeTutorial
