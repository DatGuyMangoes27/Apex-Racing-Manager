import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  User,
  Globe,
  Briefcase,
  Sparkles,
  Play,
  Plus,
  Trash2,
  Trophy,
  Calendar,
  DollarSign,
} from 'lucide-react'
import { Card, CardHeader, Badge, Button } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import type { PlayerBackground } from '@/store/careerStore'

// ============================================
// Main Menu Component
// ============================================
interface MainMenuProps {
  hasSaveData: boolean
  player: PlayerDriver | null
  careerState: { currentYear: number; currentWeek: number } | null
  onContinue: () => void
  onNewCareer: () => void
  onDeleteSave: () => void
  showDeleteModal: boolean
  onCloseDeleteModal: () => void
  onConfirmDelete: () => void
  isCreatingWorld: boolean
}

function MainMenu({ 
  hasSaveData, player, careerState, 
  onContinue, onNewCareer, onDeleteSave,
  showDeleteModal, onCloseDeleteModal, onConfirmDelete,
  isCreatingWorld
}: MainMenuProps) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center py-12 relative overflow-hidden">
      <img 
        src={HERO_IMAGES.mainMenu}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" style={{ zIndex: 1 }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative"
        style={{ zIndex: 10 }}
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-block mb-6"
          >
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-accent-red to-accent-orange flex items-center justify-center shadow-xl shadow-accent-red/30">
              <span className="font-display font-black text-4xl text-white">A2</span>
            </div>
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-display font-bold text-5xl tracking-wide mb-2 drop-shadow-lg"
          >
            AMS2 Team Manager
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-text-secondary text-lg drop-shadow-md"
          >
            Career Companion
          </motion.p>
        </div>

        {hasSaveData && player && careerState && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <Card variant="racing" padding="lg" className="relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2">
                <Badge variant="green" size="sm">
                  <Save className="w-3 h-3 mr-1" />
                  Saved
                </Badge>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-accent-red to-accent-orange flex items-center justify-center text-2xl font-display font-bold">
                  {player.firstName[0]}{player.lastName[0]}
                </div>
                
                <div className="flex-1">
                  <h2 className="font-display font-bold text-2xl">
                    {player.firstName} {player.lastName}
                  </h2>
                  <p className="text-text-muted mb-3">{player.nationality}</p>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-text-muted" />
                      <span>Season {careerState.currentYear}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-accent-gold" />
                      <span>{player.championships} titles</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-accent-orange" />
                      <span>Rep: {(Math.round(player.reputation * 10) / 10).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-status-success" />
                      <span>${player.finances.bankBalance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="flex-1"
                  onClick={onContinue}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Continue Career
                </Button>
                <Button 
                  variant="ghost" 
                  size="lg"
                  onClick={onDeleteSave}
                  className="text-status-danger hover:bg-status-danger/10"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: hasSaveData ? 0.5 : 0.4 }}
          className="space-y-3"
        >
          <Button
            variant={hasSaveData ? "secondary" : "primary"}
            size="lg"
            className="w-full"
            onClick={onNewCareer}
          >
            <Plus className="w-5 h-5 mr-2" />
            Start New Career
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-12 text-text-muted text-sm"
        >
          <p>v2.0.0 • Team Ownership Mode</p>
          <p className="text-xs mt-1">Your progress is saved automatically</p>
        </motion.div>
      </motion.div>

      <Modal
        isOpen={showDeleteModal}
        onClose={onCloseDeleteModal}
        title="Delete Save Data?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-status-warning/10 border border-status-warning/30 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-status-warning flex-shrink-0" />
            <div>
              <p className="font-medium text-status-warning">This cannot be undone!</p>
              <p className="text-sm text-text-muted mt-1">
                Starting a new career will permanently delete your existing save data.
              </p>
            </div>
          </div>

          {player && (
            <div className="p-4 bg-surface rounded-xl">
              <p className="text-sm text-text-muted mb-2">Current save:</p>
              <p className="font-display font-bold">{player.firstName} {player.lastName}</p>
              <p className="text-sm text-text-muted">
                {player.totalRaces} races • {player.totalWins} wins • Rep: {(Math.round(player.reputation * 10) / 10).toFixed(1)}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={onCloseDeleteModal}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              className="flex-1 bg-status-danger hover:bg-status-danger/80"
              onClick={onConfirmDelete}
            >
              Delete & Start New
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCreatingWorld}
        onClose={() => {}}
        title="Creating World..."
        size="sm"
      >
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <Globe className="w-16 h-16 text-accent-primary animate-pulse" />
              <motion.div
                className="absolute inset-0 border-4 border-accent-primary/30 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <p className="text-lg font-display font-bold mt-4">Generating Teams & Championships</p>
            <p className="text-sm text-text-muted text-center mt-2">
              Creating your racing world with rival teams, drivers, and series...
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ============================================
// Step 1: Background Selection
// ============================================
interface BackgroundStepProps {
  selectedBackground: string | null
  onSelect: (id: string) => void
  onNext: () => void
  canProceed: boolean
}

function BackgroundStep({ selectedBackground, onSelect, onNext, canProceed }: BackgroundStepProps) {
  const backgrounds = getAllOwnerBackgrounds()
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="mb-6">
        <h2 className="font-display font-semibold text-xl mb-2">Choose Your Background</h2>
        <p className="text-text-muted text-sm">Your background determines your starting capital, connections, and unique advantages in the racing world.</p>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {backgrounds.map((bg) => {
          const IconComponent = BACKGROUND_ICONS[bg.icon] || User
          const isSelected = selectedBackground === bg.id
          const bgImage = getOwnerBackgroundImage(bg.id)
          
          return (
            <motion.div
              key={bg.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(bg.id)}
              className={`
                flex flex-col overflow-hidden rounded-xl cursor-pointer transition-all h-full
                border-2 ${isSelected ? 'border-accent-red ring-2 ring-accent-red/20' : 'border-surface-border hover:border-accent-red/50'}
                bg-surface
              `}
            >
              {/* Image Section - Top Half */}
              <div className="relative h-32 w-full overflow-hidden shrink-0">
                <img 
                  src={bgImage}
                  alt={bg.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80" />
                
                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 bg-accent-red rounded-full flex items-center justify-center shadow-lg z-10"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </div>
              
              {/* Content Section - Bottom Half */}
              <div className="p-4 flex flex-col flex-1 border-t border-surface-border/50">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isSelected 
                      ? 'bg-accent-red/10 text-accent-red border border-accent-red/20' 
                      : 'bg-surface-secondary text-text-secondary border border-surface-border'
                    }
                  `}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-display font-semibold text-sm mb-0.5 truncate ${isSelected ? 'text-accent-red' : 'text-text-primary'}`}>
                      {bg.name}
                    </h3>
                    <p className="text-xs text-text-muted italic truncate">{bg.tagline}</p>
                  </div>
                </div>
                
                <p className="text-xs text-text-secondary mb-4 flex-1 line-clamp-3">
                  {bg.description}
                </p>
                
                <div className="flex flex-wrap gap-2 text-xs mt-auto">
                  <span className="px-1.5 py-0.5 bg-surface-secondary text-status-success rounded border border-status-success/20 font-mono">
                    {formatCurrency(bg.startingCash)}
                  </span>
                  <span className="px-1.5 py-0.5 bg-surface-secondary text-accent-blue rounded border border-accent-blue/20">
                    Rep: {bg.startingReputation}
                  </span>
                  <span className={`px-1.5 py-0.5 bg-surface-secondary rounded border border-surface-border ${DIFFICULTY_COLORS[bg.difficulty]}`}>
                    {getDifficultyLabel(bg.difficulty)}
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {/* Selected background details */}
      {selectedBackground && OWNER_BACKGROUNDS[selectedBackground] && (
        <Card variant="glass" padding="lg" className="mb-6">
          <div className="flex items-start gap-4">
            <Info className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-display font-semibold mb-2">{OWNER_BACKGROUNDS[selectedBackground].name}</h4>
              <p className="text-sm text-text-secondary mb-4">{OWNER_BACKGROUNDS[selectedBackground].bio}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Perks</p>
                  <div className="space-y-2">
                    {OWNER_BACKGROUNDS[selectedBackground].perks.map(perk => (
                      <div key={perk.id} className="flex items-start gap-2">
                        <Sparkles className="w-3 h-3 text-accent-gold flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-sm font-medium">{perk.name}</p>
                          <p className="text-xs text-text-muted">{perk.effect}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Connections</p>
                  <div className="space-y-1 text-sm">
                    {OWNER_BACKGROUNDS[selectedBackground].manufacturerConnections && 
                     OWNER_BACKGROUNDS[selectedBackground].manufacturerConnections!.length > 0 ? (
                      <p className="text-status-success">
                        +{OWNER_BACKGROUNDS[selectedBackground].manufacturerRelationBonus}% with {OWNER_BACKGROUNDS[selectedBackground].manufacturerConnections!.join(', ')}
                      </p>
                    ) : (
                      <p className="text-text-muted">No manufacturer connections</p>
                    )}
                    {OWNER_BACKGROUNDS[selectedBackground].hasPaddockRespect && (
                      <p className="text-accent-blue">Paddock respect</p>
                    )}
                    {OWNER_BACKGROUNDS[selectedBackground].hasCorporateNetwork && (
                      <p className="text-accent-purple">Corporate network</p>
                    )}
                    {OWNER_BACKGROUNDS[selectedBackground].hasGrassrootsSupport && (
                      <p className="text-accent-orange">Grassroots support</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          icon={<ChevronRight className="w-4 h-4" />}
          iconPosition="right"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  )
}

// ============================================
// Step 2: Location Selection (Interactive Map)
// ============================================
interface LocationStepProps {
  teamCountry: string
  onSelectCountry: (country: string) => void
  onBack: () => void
  onNext: () => void
}

function LocationStep({ teamCountry, onSelectCountry, onBack, onNext }: LocationStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="mb-6">
        <h2 className="font-display font-semibold text-xl mb-2">Choose Your Headquarters</h2>
        <p className="text-text-muted text-sm">
          Your team's base location affects travel costs, logistics, and development bonuses. 
          Click on the map to explore different locations and their advantages.
        </p>
      </div>
      
      <WorldMap
        selectedCountry={teamCountry}
        onSelectCountry={onSelectCountry}
        className="mb-6"
      />
      
      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!teamCountry}
          icon={<ChevronRight className="w-4 h-4" />}
          iconPosition="right"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  )
}

// ============================================
// Step 3: Profile Creation
// ============================================
interface ProfileStepProps {
  firstName: string
  lastName: string
  nationality: string
  teamName: string
  teamCountry: string
  selectedBackground: OwnerBackground | null
  onFirstNameChange: (value: string) => void
  onLastNameChange: (value: string) => void
  onNationalityChange: (value: string) => void
  onTeamNameChange: (value: string) => void
  onBack: () => void
  onNext: () => void
  canProceed: boolean
}

function ProfileStep({ 
  firstName, lastName, nationality,
  teamName, teamCountry, selectedBackground,
  onFirstNameChange, onLastNameChange, onNationalityChange,
  onTeamNameChange,
  onBack, onNext, canProceed 
}: ProfileStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="grid grid-cols-2 gap-6">
        {/* Owner Profile */}
        <Card variant="glass" padding="lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-red to-accent-orange flex items-center justify-center text-2xl font-display font-bold">
              {firstName[0] || '?'}{lastName[0] || '?'}
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Owner Profile</h2>
              <p className="text-text-muted text-sm">The face of your racing empire</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              placeholder="Enter first name"
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              placeholder="Enter last name"
            />
            <Select
              label="Nationality"
              value={nationality}
              onChange={(e) => onNationalityChange(e.target.value)}
              options={NATIONALITIES.map(n => ({ value: n, label: n }))}
            />
          </div>
        </Card>
        
        {/* Team Setup */}
        <Card variant="glass" padding="lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
              <Building className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Team Identity</h2>
              <p className="text-text-muted text-sm">Establish your racing operation</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <Input
              label="Team Name"
              value={teamName}
              onChange={(e) => onTeamNameChange(e.target.value)}
              placeholder="e.g. Phoenix Racing"
            />
            
            {/* Show selected HQ from previous step */}
            <div className="p-3 bg-surface-secondary rounded-lg">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Team Headquarters</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent-blue" />
                {teamCountry}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {getLocationPerk(teamCountry).name}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Background reminder */}
      {selectedBackground && (
        <Card variant="default" padding="md" className="mt-6">
          <div className="flex items-center gap-3">
            <Badge variant="blue">{selectedBackground.name}</Badge>
            <span className="text-sm text-text-muted">
              Starting with {formatCurrency(selectedBackground.startingCash)} and {selectedBackground.startingReputation} reputation
            </span>
          </div>
        </Card>
      )}
      
      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          icon={<ChevronRight className="w-4 h-4" />}
          iconPosition="right"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  )
}

// ============================================
// Step 3: Review and Start
// ============================================
interface ReviewStepProps {
  firstName: string
  lastName: string
  nationality: string
  teamName: string
  teamCountry: string
  background: OwnerBackground
  onBack: () => void
  onStart: () => void
}

function ReviewStep({ 
  firstName, 
  lastName, 
  nationality, 
  teamName,
  teamCountry,
  background,
  onBack, 
  onStart 
}: ReviewStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Owner card */}
        <Card variant="racing" padding="lg" className="col-span-1">
          <div className="text-center mb-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent-red to-accent-orange flex items-center justify-center text-3xl font-display font-bold mb-4">
              {firstName[0]}{lastName[0]}
            </div>
            <h2 className="font-display font-bold text-xl">{firstName}</h2>
            <h2 className="font-display font-bold text-2xl -mt-1">{lastName}</h2>
            <div className="flex items-center justify-center gap-2 mt-2 text-text-muted">
              <Globe className="w-4 h-4" />
              <span>{nationality}</span>
            </div>
          </div>
          
          <div className="space-y-2 text-sm border-t border-surface-border pt-4">
            <div className="flex justify-between">
              <span className="text-text-muted">Background</span>
              <span className="font-medium text-right">{background.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Starting Capital</span>
              <span className="font-mono text-status-success">
                {formatCurrency(background.startingCash)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Reputation</span>
              <span className="font-mono">{background.startingReputation}</span>
            </div>
          </div>
        </Card>

        {/* Team & Summary */}
        <Card variant="glass" padding="lg" className="col-span-2">
          <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-accent-blue" />
            {teamName}
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide">Headquarters</p>
                <p className="font-medium">{teamCountry}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide">Initial Board Mood</p>
                <p className="font-medium">{background.initialBoardMood}%</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide">Fan Sentiment</p>
                <p className="font-medium">{50 + background.fanSentimentBonus}%</p>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Your Advantages</p>
              <div className="space-y-2">
                {background.perks.map(perk => (
                  <div key={perk.id} className="flex items-start gap-2">
                    <Sparkles className="w-3 h-3 text-accent-gold flex-shrink-0 mt-1" />
                    <p className="text-sm">{perk.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-surface-secondary rounded-lg">
            <p className="text-sm text-text-secondary italic">"{background.bio}"</p>
          </div>
        </Card>
      </div>

      {/* What's next */}
      <Card variant="default" padding="md" className="mb-6">
        <h4 className="font-display font-semibold mb-2 flex items-center gap-2">
          <Info className="w-4 h-4 text-accent-blue" />
          Your First Steps
        </h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-accent-red/20 text-accent-red flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <p className="text-text-secondary">Visit the marketplace to acquire your first car</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-accent-orange/20 text-accent-orange flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <p className="text-text-secondary">Enter a series that fits your budget and goals</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-accent-blue/20 text-accent-blue flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <p className="text-text-secondary">Assign yourself as driver and prepare for race day</p>
          </div>
        </div>
      </Card>
      
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onStart}
          size="lg"
          className="px-8"
        >
          <Play className="w-5 h-5 mr-2" />
          Found Team
        </Button>
      </div>
    </motion.div>
  )
}
