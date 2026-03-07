import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AMS2RealTeam } from '@/data/ams2-teams-real'
import type { OwnerBackground } from '@/data/owner-backgrounds'
import { getAllOwnerBackgrounds, OWNER_BACKGROUNDS } from '@/data/owner-backgrounds'

// ============================================
// TYPES
// ============================================

export type FlowMode = 'create_team'

export type CreationStep =
  | 'background'
  | 'location'
  | 'teamIdentity'
  | 'managerCreation'
  | 'review'

export interface DateOfBirth {
  day: number
  month: number
  year: number
}

export interface CareerCreationState {
  // Flow
  flowMode: FlowMode
  currentStep: CreationStep

  // Choose Team
  selectedRealTeam: AMS2RealTeam | null

  // Create Team
  selectedBackgroundId: string | null
  teamCountry: string
  teamName: string

  // Manager (shared)
  firstName: string
  lastName: string
  dateOfBirth: DateOfBirth
  nationality: string
  selectedPortraitPath: string | null
  selectedBackstoryId: string | null // For Choose Team flow (background selection)

  // Optional
  geminiApiKey: string

  // Computed
  selectedBackground: OwnerBackground | null
  stepOrder: CreationStep[]
  currentStepIndex: number
  canGoBack: boolean
  canGoForward: boolean
  isLastStep: boolean

  // Actions
  setFlowMode: (mode: FlowMode) => void
  setStep: (step: CreationStep) => void
  goBack: () => void
  goForward: () => void

  setSelectedRealTeam: (team: AMS2RealTeam | null) => void
  setSelectedBackgroundId: (id: string | null) => void
  setTeamCountry: (country: string) => void
  setTeamName: (name: string) => void

  setFirstName: (name: string) => void
  setLastName: (name: string) => void
  setDateOfBirth: (dob: DateOfBirth) => void
  setNationality: (nationality: string) => void
  setSelectedPortraitPath: (path: string | null) => void
  setSelectedBackstoryId: (id: string | null) => void
  setGeminiApiKey: (key: string) => void
}

// ============================================
// STEP ORDERING
// ============================================

function getStepOrder(_flowMode: FlowMode): CreationStep[] {
  return ['background', 'location', 'teamIdentity', 'managerCreation', 'review']
}

// ============================================
// CONTEXT
// ============================================

const CareerCreationContext = createContext<CareerCreationState | null>(null)

export function useCareerCreation(): CareerCreationState {
  const ctx = useContext(CareerCreationContext)
  if (!ctx) throw new Error('useCareerCreation must be used within CareerCreationProvider')
  return ctx
}

// ============================================
// PROVIDER
// ============================================

export function CareerCreationProvider({ children }: { children: ReactNode }) {
  const [flowMode, setFlowModeRaw] = useState<FlowMode>('create_team')
  const [currentStep, setCurrentStep] = useState<CreationStep>('background')

  // Choose Team
  const [selectedRealTeam, setSelectedRealTeam] = useState<AMS2RealTeam | null>(null)

  // Create Team
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null)
  const [teamCountry, setTeamCountry] = useState('United Kingdom')
  const [teamName, setTeamName] = useState('')

  // Manager
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState<DateOfBirth>({ day: 1, month: 1, year: 1990 })
  const [nationality, setNationality] = useState('United Kingdom')
  const [selectedPortraitPath, setSelectedPortraitPath] = useState<string | null>(null)
  const [selectedBackstoryId, setSelectedBackstoryId] = useState<string | null>(null)
  const [geminiApiKey, setGeminiApiKey] = useState('')

  // Computed
  const stepOrder = getStepOrder(flowMode)
  const currentStepIndex = stepOrder.indexOf(currentStep)
  const canGoBack = currentStepIndex > 0
  const canGoForward = currentStepIndex < stepOrder.length - 1
  const isLastStep = currentStepIndex === stepOrder.length - 1

  const selectedBackground = selectedBackgroundId ? (OWNER_BACKGROUNDS[selectedBackgroundId] || null) : null

  const setFlowMode = useCallback((mode: FlowMode) => {
    setFlowModeRaw(mode)
    setCurrentStep('background')
  }, [])

  const setStep = useCallback((step: CreationStep) => {
    setCurrentStep(step)
  }, [])

  const goBack = useCallback(() => {
    const idx = stepOrder.indexOf(currentStep)
    if (idx > 0) {
      setCurrentStep(stepOrder[idx - 1])
    }
  }, [stepOrder, currentStep])

  const goForward = useCallback(() => {
    const idx = stepOrder.indexOf(currentStep)
    if (idx < stepOrder.length - 1) {
      setCurrentStep(stepOrder[idx + 1])
    }
  }, [stepOrder, currentStep])

  const value: CareerCreationState = {
    flowMode,
    currentStep,
    selectedRealTeam,
    selectedBackgroundId,
    teamCountry,
    teamName,
    firstName,
    lastName,
    dateOfBirth,
    nationality,
    selectedPortraitPath,
    selectedBackstoryId,
    geminiApiKey,
    selectedBackground,
    stepOrder,
    currentStepIndex,
    canGoBack,
    canGoForward,
    isLastStep,
    setFlowMode,
    setStep,
    goBack,
    goForward,
    setSelectedRealTeam,
    setSelectedBackgroundId,
    setTeamCountry,
    setTeamName,
    setFirstName,
    setLastName,
    setDateOfBirth,
    setNationality,
    setSelectedPortraitPath,
    setSelectedBackstoryId,
    setGeminiApiKey,
  }

  return (
    <CareerCreationContext.Provider value={value}>
      {children}
    </CareerCreationContext.Provider>
  )
}
