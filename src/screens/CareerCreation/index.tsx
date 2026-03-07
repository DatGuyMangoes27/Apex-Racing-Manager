import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import type { PlayerDriver } from '@/store/careerStore'
import { createBackgroundFromScenario, getScenarioById } from '@/data/backgrounds'
import {
  loadAllPreGeneratedContent,
  resetUsedIds,
} from '@/services/preGeneratedContentService'
import { CareerCreationProvider, useCareerCreation } from './CareerCreationContext'
import type { CareerCreationState } from './CareerCreationContext'
import MainMenu from './components/MainMenu'

const _FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const _FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
import BackgroundStep from './components/BackgroundStep'
import LocationStep from './components/LocationStep'
import TeamIdentityStep from './components/TeamIdentityStep'
import ManagerCreationStep from './components/ManagerCreationStep'
import ReviewStep from './components/ReviewStep'
import BottomNavBar from './components/BottomNavBar'

// ============================================
// Step Renderer
// ============================================

function StepRenderer({ onBackToMenu }: { onBackToMenu?: () => void }) {
  const { currentStep } = useCareerCreation()
  const isFullScreen = currentStep === 'background' || currentStep === 'location'

  return (
    <div className={`flex-1 min-h-0 relative ${isFullScreen ? 'overflow-hidden' : 'overflow-auto'}`}>
      <AnimatePresence mode="wait">
        {currentStep === 'background' && <BackgroundStep key="background" onBackToMenu={onBackToMenu} />}
        {currentStep === 'location' && <LocationStep key="location" />}
        {currentStep === 'teamIdentity' && <TeamIdentityStep key="teamIdentity" />}
        {currentStep === 'managerCreation' && <ManagerCreationStep key="managerCreation" />}
        {currentStep === 'review' && <ReviewStep key="review" />}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// Validation logic per step
// ============================================

function useForwardDisabled(ctx: CareerCreationState): boolean {
  const { currentStep, selectedBackgroundId, teamName, firstName, lastName, nationality } = ctx

  switch (currentStep) {
    case 'background':
      return !selectedBackgroundId
    case 'location':
      return false
    case 'teamIdentity':
      return !teamName.trim()
    case 'managerCreation':
      return !firstName.trim() || !lastName.trim() || !nationality
    case 'review':
      return false
    default:
      return false
  }
}

// ============================================
// Inner component (has access to context)
// ============================================

function CareerCreationInner({ onBackToMenu }: { onBackToMenu: () => void }) {
  const navigate = useNavigate()
  const { createCareer } = useCareerStore()
  const { initializeWorld } = useRivalStore()
  const ctx = useCareerCreation()
  const forwardDisabled = useForwardDisabled(ctx)

  const handleStartCareer = async () => {
    const {
      selectedBackground,
      firstName,
      lastName,
      nationality,
      dateOfBirth,
      teamCountry,
      teamName,
      geminiApiKey,
      selectedPortraitPath,
    } = ctx

    if (!selectedBackground || !firstName || !lastName) return

    // Save Gemini API key to commentary-settings localStorage if provided
    if (geminiApiKey.trim()) {
      try {
        const existing = localStorage.getItem('commentary-settings')
        let commentarySettings = existing ? JSON.parse(existing) : {}
        commentarySettings = {
          ...commentarySettings,
          geminiKey: geminiApiKey.trim(),
        }
        localStorage.setItem('commentary-settings', JSON.stringify(commentarySettings))
      } catch (e) {
        console.warn('[CareerCreation] Failed to save Gemini API key:', e)
      }
    }

    // Load pre-generated content pool
    resetUsedIds()
    try {
      const { success, stats } = await loadAllPreGeneratedContent()
      if (success) {
        console.log('[CareerCreation] Pre-generated content loaded:', stats)
        useCareerStore.setState({ preGenContentLoaded: true })
      }
    } catch (e) {
      console.warn('[CareerCreation] Error loading pre-generated content:', e)
    }

    // Initialize the rival world
    initializeWorld()

    // Build DOB string
    const dobStr = `${dateOfBirth.year}-${String(dateOfBirth.month).padStart(2, '0')}-${String(dateOfBirth.day).padStart(2, '0')}`
    const birthYear = dateOfBirth.year
    const age = new Date().getFullYear() - birthYear

    // Build background from scenario system
    const scenarioId = selectedBackground.id === 'self_made' ? 'karting_prodigy' : 'karting_prodigy'
    const scenario = getScenarioById(scenarioId)
    const playerBackground = scenario
      ? createBackgroundFromScenario(scenario)
      : undefined

    // Create the player
    const newPlayer: PlayerDriver = {
      id: `player-${Date.now()}`,
      firstName,
      lastName,
      nationality,
      dateOfBirth: dobStr,
      age,
      careerStartAge: age,
      scenario: 'team_owner',
      stats: {
        pace: 65, consistency: 60, racecraft: 55,
        wetSkill: 50, tireMgmt: 55, fitness: 60, awareness: 55,
        aggression: 50, experience: 0, adaptability: 55, focus: 60,
        potential: 80,
      },
      mentalState: {
        confidence: 50, motivation: 75, stress: 20, fatigue: 10,
        morale: 70, form: 50,
      },
      health: {
        overall: 90, fitness: 70, injured: false,
        injuries: [], mentalHealth: 80,
      },
      finances: {
        balance: selectedBackground.startingCash,
        salary: 0,
        sponsorDeals: [],
        pendingOffers: [],
        transactions: [],
        lifestyleLevel: 'modest',
        livingExpenses: 2000,
      },
      reputation: selectedBackground.startingReputation || 20,
      totalRaces: 0,
      totalWins: 0,
      totalPodiums: 0,
      totalPoles: 0,
      championships: 0,
      raceHistory: [],
      background: {
        ...(playerBackground || {}),
        type: selectedBackground.id,
        teamCountry,
        teamName,
        ...selectedBackground,
      } as any,
      trackHistory: {},
      goatProgress: {
        currentTier: 'amateur',
        totalPoints: 0,
        categories: {},
        milestones: [],
        currentStreak: 0,
      },
      totalFastestLaps: 0,
      consecutiveWins: 0,
      consecutivePodiums: 0,
      consecutivePoints: 0,
      hatTricks: 0,
      grandSlams: 0,
      comebackWins: 0,
      seasonsCompleted: 0,
      perfectSeasons: 0,
      dnfFreeSeasons: 0,
      seriesChampionships: [],
      mediaStarPower: {
        level: 0,
        xp: 0,
        followers: 0,
        viralMoments: 0,
        controversies: 0,
        endorsements: [],
      },
      datingPreference: 'none',
    }

    // Create career without personal life setup
    createCareer(newPlayer)

    setTimeout(() => {
      navigate('/home')
    }, 1500)
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-white">
      <StepRenderer onBackToMenu={onBackToMenu} />
      <BottomNavBar
        onStartCareer={handleStartCareer}
        forwardDisabled={forwardDisabled}
      />
    </div>
  )
}

// ============================================
// Main Export (handles menu vs creation flow)
// ============================================

export default function CareerCreation() {
  const navigate = useNavigate()
  const { hasActiveCareer, player, careerState, resetCareer } = useCareerStore()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isCreatingWorld, setIsCreatingWorld] = useState(false)
  const [showCreation, setShowCreation] = useState(false)

  const handleContinue = () => {
    navigate('/home')
  }

  const handleNewCareer = () => {
    setShowCreation(true)
  }

  const handleConfirmDelete = () => {
    resetCareer()
    setShowDeleteModal(false)
  }

  // Show creation flow
  if (showCreation) {
    return (
      <CareerCreationProvider>
        <CareerCreationInner onBackToMenu={() => setShowCreation(false)} />
      </CareerCreationProvider>
    )
  }

  // Show main menu
  return (
    <MainMenu
      hasSaveData={hasActiveCareer}
      player={player}
      careerState={
        careerState
          ? { currentYear: careerState.currentYear, currentWeek: careerState.currentWeek }
          : null
      }
      onContinue={handleContinue}
      onNewCareer={handleNewCareer}
      onDeleteSave={() => setShowDeleteModal(true)}
      showDeleteModal={showDeleteModal}
      onCloseDeleteModal={() => setShowDeleteModal(false)}
      onConfirmDelete={handleConfirmDelete}
      isCreatingWorld={isCreatingWorld}
    />
  )
}
