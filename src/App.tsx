import { useEffect, lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Layout } from './components/layout/Layout'
// GameViewport (resolution scaling) removed — app renders at native resolution
// VideoBackground removed — Figma design uses white background
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/ui'
import { useAutosave } from './hooks/useAutosave'
import { useCareerStore, useCareerStoreHydration } from './store/careerStore'
import { setupStreamingAudioIPC, initStreamingAudio } from './services/streamingAudio'
import { FirstTimeTutorial, useTutorialState } from './components/Tutorial'
import { StatChangeOverlay } from './components/ui/StatChangeOverlay'

// CareerCreation is the initial route — keep eager
import CareerCreation from './screens/CareerCreation'

// Lazy-load all other screens (code-split into separate chunks)
const Home = lazy(() => import('./screens/Home'))
const Calendar = lazy(() => import('./screens/Calendar').then(m => ({ default: m.Calendar })))
const RaceDay = lazy(() => import('./screens/RaceDay'))
const Garage = lazy(() => import('./screens/Garage').then(m => ({ default: m.Garage })))
const Finances = lazy(() => import('./screens/Finances').then(m => ({ default: m.Finances })))
const Facilities = lazy(() => import('./screens/Facilities').then(m => ({ default: m.Facilities })))
const StaffMarket = lazy(() => import('./screens/StaffMarket').then(m => ({ default: m.StaffMarket })))
const Contracts = lazy(() => import('./screens/Contracts'))
const SeriesEntry = lazy(() => import('./screens/SeriesEntry').then(m => ({ default: m.SeriesEntry })))
const Marketplace = lazy(() => import('./screens/Marketplace').then(m => ({ default: m.Marketplace })))
const Media = lazy(() => import('./screens/Media'))
const Stats = lazy(() => import('./screens/Stats'))
const Paddock = lazy(() => import('./screens/Paddock').then(m => ({ default: m.Paddock })))
const Settings = lazy(() => import('./screens/Settings').then(m => ({ default: m.Settings })))
const SeasonEnd = lazy(() => import('./screens/SeasonEnd'))
const Logs = lazy(() => import('./screens/Logs'))
const Emails = lazy(() => import('./screens/Emails').then(m => ({ default: m.Emails })))
const SponsorMarket = lazy(() => import('./screens/SponsorMarket'))
const HowToPlay = lazy(() => import('./screens/HowToPlay'))
const Loans = lazy(() => import('./screens/Loans'))
const Investments = lazy(() => import('./screens/Investments'))
const Merchandise = lazy(() => import('./screens/Merchandise'))
const Manufacturing = lazy(() => import('./screens/Manufacturing'))
const PersonalLife = lazy(() => import('./screens/PersonalLife').then(m => ({ default: m.PersonalLife })))
const Phone = lazy(() => import('./screens/Phone'))
const PersonalLifeWealth = lazy(() => import('./screens/PersonalLife/Wealth').then(m => ({ default: m.PersonalLifeWealth })))
const PersonalLifeFamily = lazy(() => import('./screens/PersonalLife/Family').then(m => ({ default: m.PersonalLifeFamily })))
const PersonalLifeLifestyle = lazy(() => import('./screens/PersonalLife/Lifestyle').then(m => ({ default: m.PersonalLifeLifestyle })))
const PersonalLifeSocial = lazy(() => import('./screens/PersonalLife/Social').then(m => ({ default: m.PersonalLifeSocial })))
const Scouting = lazy(() => import('./screens/Scouting').then(m => ({ default: m.Scouting })))

function App() {
  const hydrated = useCareerStoreHydration()
  const hasActiveCareerFromStore = useCareerStore(state => state.hasActiveCareer)
  
  // Autosave on configured interval
  useAutosave()

  // Initialize streaming audio on mount
  useEffect(() => {
    // Initialize Web Audio API (needs user interaction first, but this preps it)
    initStreamingAudio()
    // Setup IPC listeners for streaming audio from main process
    setupStreamingAudioIPC()
    console.log('[App] Streaming audio initialized')
  }, [])
  
  // IMPORTANT: Only trust the store value AFTER hydration is complete
  // Before hydration, the store returns default values (false), not persisted values
  const hasActiveCareer = hydrated ? hasActiveCareerFromStore : false

  console.log('[App] Render - hydrated:', hydrated, 'storeValue:', hasActiveCareerFromStore, 'using:', hasActiveCareer)

  // Show loading screen while waiting for hydration
  if (!hydrated) {
    return (
      <div className="w-full h-full bg-white flex items-center justify-center" style={{ position: 'fixed', inset: 0 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-6"
          >
            <div className="w-full h-full rounded-full border-4 border-gray-200 border-t-black" />
          </motion.div>
          <p className="text-gray-500 text-lg" style={{ fontFamily: "'Arial Black', 'Arial', sans-serif" }}>Loading Career Data...</p>
        </motion.div>
      </div>
    )
  }

  // Lightweight fallback for lazy-loaded routes
  const routeFallback = (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-8 h-8 rounded-full border-4 border-surface-secondary border-t-accent-red animate-spin" />
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
    <ErrorBoundary>
    <ToastProvider>
      <HashRouter>
        <Layout showSidebar={hasActiveCareer}>
          <AnimatePresence mode="wait">
            <Suspense fallback={routeFallback}>
            <Routes>
              {/* Menu/Career Creation - always the starting point */}
              <Route path="/" element={<CareerCreation />} />
              <Route path="/menu" element={<CareerCreation />} />
              
              {!hasActiveCareer ? (
                // No career - redirect everything to menu
                <Route path="*" element={<Navigate to="/" replace />} />
              ) : (
                // Has career - show main app routes (user navigates here via Continue button)
                <>
                  <Route path="/home" element={<Home />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/race-day" element={<RaceDay />} />
                  <Route path="/garage" element={<Garage />} />
                  <Route path="/finances" element={<Finances />} />
                  <Route path="/facilities" element={<Facilities />} />
                  <Route path="/staff-market" element={<StaffMarket />} />
                  <Route path="/sponsor-market" element={<SponsorMarket />} />
                  {/* Hidden routes — redirect to nearest relevant screen */}
                  <Route path="/loans" element={<Navigate to="/finances" replace />} />
                  <Route path="/investments" element={<Navigate to="/finances" replace />} />
                  <Route path="/merchandise" element={<Navigate to="/finances" replace />} />
                  <Route path="/manufacturing" element={<Navigate to="/garage" replace />} />
                  <Route path="/personal-life" element={<Navigate to="/home" replace />} />
                  <Route path="/personal-life/wealth" element={<Navigate to="/finances" replace />} />
                  <Route path="/personal-life/family" element={<Navigate to="/home" replace />} />
                  <Route path="/personal-life/lifestyle" element={<Navigate to="/home" replace />} />
                  <Route path="/personal-life/social" element={<Navigate to="/home" replace />} />
                  <Route path="/phone" element={<Navigate to="/home" replace />} />
                  <Route path="/scouting" element={<Navigate to="/staff-market" replace />} />
                  <Route path="/stats" element={<Navigate to="/paddock" replace />} />
                  <Route path="/logs" element={<Logs />} />
                  <Route path="/how-to-play" element={<Navigate to="/settings" replace />} />
                  <Route path="/contracts" element={<Contracts />} />
                  <Route path="/series-entry" element={<SeriesEntry />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/paddock" element={<Paddock />} />
                  <Route path="/media" element={<Media />} />
                  <Route path="/emails" element={<Emails />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/season-end" element={<SeasonEnd />} />
                </>
              )}
            </Routes>
            </Suspense>
          </AnimatePresence>
          
          {/* Stat change floating indicators */}
          {hasActiveCareer && <StatChangeOverlay />}
          
          {/* First-time tutorial overlay */}
          <TutorialWrapper />
        </Layout>
      </HashRouter>
    </ToastProvider>
    </ErrorBoundary>
    </div>
  )
}

// Tutorial wrapper component to access router context
function TutorialWrapper() {
  const { shouldShowTutorial, markTutorialComplete } = useTutorialState()
  
  if (!shouldShowTutorial) return null
  
  return (
    <FirstTimeTutorial onComplete={markTutorialComplete} />
  )
}

export default App


