import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Layout } from './components/layout/Layout'
import { VideoBackground } from './components/video/VideoBackground'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/ui'
import { useAutosave } from './hooks/useAutosave'
import { Home } from './screens/Home'
import { Calendar } from './screens/Calendar'
import { RaceDay } from './screens/RaceDay'
import { Garage } from './screens/Garage'
import { Finances } from './screens/Finances'
import { Facilities } from './screens/Facilities'
import { StaffMarket } from './screens/StaffMarket'
import { Contracts } from './screens/Contracts'
import { SeriesEntry } from './screens/SeriesEntry'
import { Marketplace } from './screens/Marketplace'
import { Media } from './screens/Media'
import { Stats } from './screens/Stats'
import { Paddock } from './screens/Paddock'
import { Settings } from './screens/Settings'
import { SeasonEnd } from './screens/SeasonEnd'
import { CareerCreation } from './screens/CareerCreation'
import { Logs } from './screens/Logs'
import { Emails } from './screens/Emails'
import { SponsorMarket } from './screens/SponsorMarket'
import { HowToPlay } from './screens/HowToPlay'
import Loans from './screens/Loans'
import Investments from './screens/Investments'
import Merchandise from './screens/Merchandise'
import { Manufacturing } from './screens/Manufacturing'
import { PersonalLife } from './screens/PersonalLife'
import { Phone } from './screens/Phone'
import { PersonalLifeWealth } from './screens/PersonalLife/Wealth'
import { PersonalLifeFamily } from './screens/PersonalLife/Family'
import { PersonalLifeLifestyle } from './screens/PersonalLife/Lifestyle'
import { PersonalLifeSocial } from './screens/PersonalLife/Social'
import { Scouting } from './screens/Scouting'
import { useCareerStore, useCareerStoreHydration } from './store/careerStore'
import { setupStreamingAudioIPC, initStreamingAudio } from './services/streamingAudio'
import { FirstTimeTutorial, useTutorialState } from './components/Tutorial'
import { StatChangeOverlay } from './components/ui/StatChangeOverlay'

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
      <div className="min-h-screen bg-background flex items-center justify-center">
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
            <div className="w-full h-full rounded-full border-4 border-surface-secondary border-t-accent-red" />
          </motion.div>
          <p className="text-text-muted text-lg">Loading Career Data...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
    <ToastProvider>
      <HashRouter>
        <VideoBackground />
        <Layout showSidebar={hasActiveCareer}>
          <AnimatePresence mode="wait">
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
                  <Route path="/loans" element={<Loans />} />
                  <Route path="/investments" element={<Investments />} />
                  <Route path="/merchandise" element={<Merchandise />} />
                  <Route path="/manufacturing" element={<Manufacturing />} />
                  <Route path="/personal-life" element={<PersonalLife />} />
                  <Route path="/phone" element={<Phone />} />
                  <Route path="/personal-life/wealth" element={<PersonalLifeWealth />} />
                  <Route path="/personal-life/family" element={<PersonalLifeFamily />} />
                  <Route path="/personal-life/lifestyle" element={<PersonalLifeLifestyle />} />
                  <Route path="/personal-life/social" element={<PersonalLifeSocial />} />
                  <Route path="/scouting" element={<Scouting />} />
                  <Route path="/contracts" element={<Contracts />} />
                  <Route path="/series-entry" element={<SeriesEntry />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/paddock" element={<Paddock />} />
                  <Route path="/media" element={<Media />} />
                  <Route path="/emails" element={<Emails />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/logs" element={<Logs />} />
                  <Route path="/season-end" element={<SeasonEnd />} />
                  <Route path="/how-to-play" element={<HowToPlay />} />
                </>
              )}
            </Routes>
          </AnimatePresence>
          
          {/* Stat change floating indicators */}
          {hasActiveCareer && <StatChangeOverlay />}
          
          {/* First-time tutorial overlay */}
          <TutorialWrapper />
        </Layout>
      </HashRouter>
    </ToastProvider>
    </ErrorBoundary>
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


