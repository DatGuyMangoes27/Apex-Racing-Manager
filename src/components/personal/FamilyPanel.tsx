import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Heart, Baby, Crown, Users, Calendar,
  Star, Trophy, Award, GraduationCap, Car, Sparkles,
  Home, Gem, Cake, TrendingUp, UserPlus, Stethoscope,
  Smile, Shield, LogOut
} from 'lucide-react'
import { 
  Card, 
  CardHeader, 
  Badge, 
  Button,
  Modal,
  PortraitImage
} from '@/components/ui'
import { getChildPortrait } from '@/utils/generated-assets'
import { getContactPortrait } from '@/services/contactService'
import type { ContactInfo } from '@/types/personalLife'
import { useToast } from '@/components/ui/Toast'
import type { Partner, Child, FamilyTree } from '@/data/family-config'
import type { PersonalFinancialState } from '@/data/personal-finance-config'
import type { PregnancyState } from '@/services/familyBridgeService'
import { 
  PARTNER_TRAITS, 
  CHILD_TRAITS, 
  RELATIONSHIP_CONFIG,
  getPartnerTraitById,
  getChildTraitById
} from '@/data/family-config'
import { usePersonalLifeActions } from '@/hooks/usePersonalLifeActions'
import { useCareerStore } from '@/store/careerStore'
import { calculateDivorceSettlement, calculateSeparationDuration } from '@/simulation/personal/relationshipManager'

// ============================================
// TYPES
// ============================================

interface FamilyPanelProps {
  partner?: Partner
  children: Child[]
  familyTree?: FamilyTree
  finances: PersonalFinancialState
  currentWeek: number
  currentYear: number
  pregnancy?: PregnancyState
  messagingContacts?: ContactInfo[]
}

// ============================================
// MAIN COMPONENT
// ============================================

export function FamilyPanel({
  partner,
  children,
  familyTree,
  finances,
  currentWeek,
  currentYear,
  pregnancy,
  messagingContacts
}: FamilyPanelProps) {
  const navigate = useNavigate()
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [showDynasty, setShowDynasty] = useState(false)
  const [showProposeModal, setShowProposeModal] = useState(false)
  const [showWeddingModal, setShowWeddingModal] = useState(false)
  const [showPregnancyModal, setShowPregnancyModal] = useState(false)
  const [showBirthModal, setShowBirthModal] = useState(false)
  const [showEndRelationshipModal, setShowEndRelationshipModal] = useState(false)
  const [childName, setChildName] = useState('')
  const { addToast } = useToast()
  
  const personalLife = useCareerStore(s => s.careerState?.personalLife) as { separationProcess?: { type: string; partnerName: string; daysElapsed: number; estimatedDurationDays: number; isFinalized: boolean } } | undefined
  const playerInitiateSeparation = useCareerStore(s => s.playerInitiateSeparation)
  const separationProcess = personalLife?.separationProcess
  const isPartnerInSeparation = !!partner && separationProcess && !separationProcess.isFinalized && separationProcess.partnerName === `${partner.firstName} ${partner.lastName}`
  const canEndRelationship = !!partner && !isPartnerInSeparation && ['dating', 'engaged', 'married'].includes(partner.relationshipStatus)
  const divorcePreview = useMemo(() => {
    if (!showEndRelationshipModal || !partner || partner.relationshipStatus !== 'married') return null
    const marriageYear = partner.marriageDate?.year ?? currentYear
    const marriageDurationYears = Math.max(1, currentYear - marriageYear)
    const childrenCount = partner.childrenIds?.length ?? 0
    const netWorth = finances?.cachedNetWorth ?? finances?.liquidCash ?? 0
    const settlement = calculateDivorceSettlement(partner, netWorth, marriageDurationYears, childrenCount, null)
    return {
      assetDivisionPercent: settlement.assetDivision,
      estimatedAssetLoss: Math.round(netWorth * (settlement.assetDivision / 100)),
      alimonyMonthly: settlement.alimonyMonthly,
      childSupportMonthly: settlement.childSupportMonthly,
      durationWeeks: Math.ceil(calculateSeparationDuration('divorce', partner) / 7),
    }
  }, [showEndRelationshipModal, partner, currentYear, finances?.cachedNetWorth, finances?.liquidCash])
  
  // Personal life actions
  const {
    proposeToPartner,
    planWedding,
    spendTimeWithChild,
    startChildRacing,
    announcePregnancy,
    haveChild
  } = usePersonalLifeActions()

  // Stable partner portrait - look up the actual stored messaging contact (same as Phone)
  // This ensures the Family screen shows the exact same portrait as the Phone screen
  const partnerPortrait = useMemo(() => {
    if (!partner) return ''
    // Find the partner's stored contact from messaging (same source as Phone screen)
    const partnerId = partner.id || ''
    const storedContact = messagingContacts?.find(c => 
      c.type === 'partner' || c.id === `partner_${partnerId}` || c.id === partnerId
    )
    if (storedContact) {
      return getContactPortrait(storedContact)
    }
    return ''
  }, [partner?.id, messagingContacts])

  // Calculate proposal acceptance score for threshold display
  const proposalAcceptanceScore = useMemo(() => {
    if (!partner) return 0
    const loveWeight = partner.loveLevel * 0.4
    const trustWeight = partner.trustLevel * 0.3
    const happinessWeight = partner.happiness * 0.2
    const compatWeight = partner.compatibilityScore * 0.1
    return Math.round(loveWeight + trustWeight + happinessWeight + compatWeight)
  }, [partner?.loveLevel, partner?.trustLevel, partner?.happiness, partner?.compatibilityScore])

  const dynastyYears = familyTree 
    ? currentYear - familyTree.dynastyStartDate.year 
    : 0

  return (
    <div className="space-y-6">
      {/* Partner Section */}
      <Card variant="racing" padding="lg">
        <CardHeader 
          title="Relationship" 
          icon={<Heart className="w-5 h-5" />}
        />
        
        {partner ? (
          <div className="space-y-4">
            {/* Separation in progress */}
            {isPartnerInSeparation && separationProcess && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm">
                <p className="font-semibold">
                  {separationProcess.type === 'breakup' ? 'Breakup in progress' : 'Divorce proceedings'}
                </p>
                <p className="mt-1 text-text-muted">
                  {separationProcess.type === 'breakup'
                    ? `~${Math.max(0, separationProcess.estimatedDurationDays - separationProcess.daysElapsed)} days remaining`
                    : `~${Math.max(0, Math.ceil((separationProcess.estimatedDurationDays - separationProcess.daysElapsed) / 7))} weeks remaining`}
                </p>
              </div>
            )}

            {/* Partner Info */}
            <div className="p-4 bg-background rounded-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <PortraitImage
                    src={partnerPortrait}
                    name={`${partner.firstName} ${partner.lastName}`}
                    size="xl"
                    bordered
                    borderColor="default"
                  />
                  <div>
                    <h3 className="font-display font-bold text-xl">
                      {partner.firstName} {partner.lastName}
                    </h3>
                    <p className="text-text-muted">
                      {partner.age} years old • {partner.nationality}
                    </p>
                    <p className="text-sm text-text-muted capitalize">
                      {partner.career.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={
                    partner.relationshipStatus === 'married' ? 'green' :
                    partner.relationshipStatus === 'engaged' ? 'blue' :
                    partner.relationshipStatus === 'dating' ? 'purple' : 'outline'
                  }
                  className="capitalize"
                >
                  {partner.relationshipStatus === 'married' && <Gem className="w-3 h-3 mr-1" />}
                  {partner.relationshipStatus}
                </Badge>
              </div>

              {/* Relationship Metrics - matches Phone screen labels */}
              <div className="space-y-2.5 mb-4">
                {/* Affection (maps to partner.happiness) */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted flex items-center gap-1">
                      <Smile className="w-3 h-3 text-pink-400" /> Affection
                    </span>
                    <span className="text-pink-400 font-medium">{partner.happiness}%</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-pink-400 rounded-full transition-all"
                      style={{ width: `${partner.happiness}%` }}
                    />
                  </div>
                </div>
                {/* Trust (maps to partner.trustLevel) */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted flex items-center gap-1">
                      <Shield className="w-3 h-3 text-blue-400" /> Trust
                    </span>
                    <span className="text-blue-400 font-medium">{partner.trustLevel}%</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-400 rounded-full transition-all"
                      style={{ width: `${partner.trustLevel}%` }}
                    />
                  </div>
                </div>
                {/* Romance (maps to partner.loveLevel) */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted flex items-center gap-1">
                      <Heart className="w-3 h-3 text-red-400" /> Romance
                    </span>
                    <span className="text-red-400 font-medium">{partner.loveLevel}%</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-400 rounded-full transition-all"
                      style={{ width: `${partner.loveLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Traits */}
              <div className="mb-4">
                <p className="text-xs text-text-muted mb-2">Personality Traits</p>
                <div className="flex flex-wrap gap-2">
                  {partner.traits.map(traitId => {
                    const trait = getPartnerTraitById(traitId)
                    return trait ? (
                      <Badge key={traitId} variant="outline" size="sm">
                        {trait.name}
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>

              {/* Partner Career Income */}
              {partner.careerIncome > 0 && (
                <div className="p-3 bg-surface rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Partner's Income</span>
                    <span className="font-mono text-status-success">
                      ${partner.careerIncome.toLocaleString()}/mo
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Relationship Timeline */}
            <div className="p-4 bg-background/50 rounded-lg">
              <p className="text-sm font-medium mb-3">Relationship Timeline</p>
              <div className="space-y-2 text-sm">
                {partner.relationshipStartDate && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Heart className="w-4 h-4" />
                    <span>Started dating: Week {partner.relationshipStartDate.week}, Year {partner.relationshipStartDate.year}</span>
                  </div>
                )}
                {partner.engagementDate && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Gem className="w-4 h-4" />
                    <span>Engaged: Week {partner.engagementDate.week}, Year {partner.engagementDate.year}</span>
                  </div>
                )}
                {partner.marriageDate && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Sparkles className="w-4 h-4" />
                    <span>Married: Week {partner.marriageDate.week}, Year {partner.marriageDate.year}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pregnancy Status */}
            {pregnancy?.isPregnant && (
              <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Baby className="w-5 h-5 text-status-success" />
                    <span className="font-medium text-status-success">Expecting!</span>
                  </div>
                  <Badge variant="green" size="sm">
                    {pregnancy.gender !== 'unknown' 
                      ? pregnancy.gender === 'male' ? 'Boy' : 'Girl'
                      : 'Gender Unknown'}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-text-muted">
                    <span>Weeks Pregnant</span>
                    <span className="font-mono">{pregnancy.weeksPregnant || 0} / 36</span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-2">
                    <div 
                      className="bg-status-success h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((pregnancy.weeksPregnant || 0) / 36) * 100)}%` }}
                    />
                  </div>
                  {pregnancy.expectedBirthWeek && pregnancy.expectedBirthYear && (
                    <p className="text-text-muted">
                      Due: Week {pregnancy.expectedBirthWeek}, Year {pregnancy.expectedBirthYear}
                    </p>
                  )}
                  {(pregnancy.weeksPregnant || 0) >= 36 && (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => setShowBirthModal(true)}
                    >
                      <Baby className="w-4 h-4 mr-2" />
                      Welcome the Baby!
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {partner.relationshipStatus === 'dating' && (
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowProposeModal(true)}>
                    <Gem className="w-4 h-4 mr-2" />
                    Propose
                  </Button>
                  <p className="text-[10px] text-text-muted">
                    Acceptance chance: <span className={`font-bold ${
                      proposalAcceptanceScore >= 70 ? 'text-status-success' :
                      proposalAcceptanceScore >= 50 ? 'text-status-warning' :
                      'text-status-danger'
                    }`}>{proposalAcceptanceScore}%</span>
                    {proposalAcceptanceScore < 50 && ' — Build more love & trust first'}
                    {proposalAcceptanceScore >= 50 && proposalAcceptanceScore < 70 && ' — Could go either way'}
                    {proposalAcceptanceScore >= 70 && ' — Looking good!'}
                  </p>
                </div>
              )}
              {partner.relationshipStatus === 'engaged' && (
                <Button variant="secondary" size="sm" onClick={() => setShowWeddingModal(true)}>
                  <Cake className="w-4 h-4 mr-2" />
                  Plan Wedding
                </Button>
              )}
              {partner.relationshipStatus === 'married' && !pregnancy?.isPregnant && children.length < 6 && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setShowPregnancyModal(true)}
                >
                  <Baby className="w-4 h-4 mr-2" />
                  Try for Baby
                </Button>
              )}
              {canEndRelationship && (
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => setShowEndRelationshipModal(true)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  End Relationship
                </Button>
              )}
            </div>

            {/* End Relationship confirmation modal */}
            <Modal
              isOpen={showEndRelationshipModal}
              onClose={() => setShowEndRelationshipModal(false)}
              title={partner.relationshipStatus === 'married' ? 'File for divorce?' : 'Break up?'}
              size="sm"
            >
              <div className="text-sm text-text-secondary space-y-2">
                {partner.relationshipStatus === 'married' ? (
                  <>
                    <p>Are you sure you want to file for divorce from {partner.firstName} {partner.lastName}?</p>
                    {divorcePreview && (
                      <div className="mt-3 p-3 rounded-lg bg-surface-dark border border-border/10 text-xs space-y-1">
                        <p className="text-text-muted">Estimated impact:</p>
                        <p>Asset division: {divorcePreview.assetDivisionPercent}%</p>
                        <p>Estimated one-time loss: ${divorcePreview.estimatedAssetLoss.toLocaleString()}</p>
                        {divorcePreview.alimonyMonthly > 0 && (
                          <p>Alimony: ${divorcePreview.alimonyMonthly.toLocaleString()}/month</p>
                        )}
                        {divorcePreview.childSupportMonthly > 0 && (
                          <p>Child support: ${divorcePreview.childSupportMonthly.toLocaleString()}/month</p>
                        )}
                        <p className="text-text-muted mt-1">This could take roughly {divorcePreview.durationWeeks} weeks to finalize.</p>
                      </div>
                    )}
                    <p className="text-text-muted mt-2">Divorce proceedings can take several weeks to finalize depending on your situation.</p>
                  </>
                ) : (
                  <p>Are you sure you want to break up with {partner.firstName} {partner.lastName}? This will take a few days to resolve.</p>
                )}
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="secondary" onClick={() => setShowEndRelationshipModal(false)}>Cancel</Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    const ok = playerInitiateSeparation()
                    setShowEndRelationshipModal(false)
                  }}
                >
                  {partner.relationshipStatus === 'married' ? 'File for divorce' : 'Break up'}
                </Button>
              </div>
            </Modal>
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
            <h3 className="font-medium text-lg mb-2">Currently Single</h3>
            <p className="text-text-muted mb-6">
              Attend social events to meet potential partners
            </p>
            <Button 
              variant="primary" 
              onClick={() => {
                addToast({
                  type: 'info',
                  title: 'Find Your Match',
                  message: 'Attend social events to meet potential partners!'
                })
                navigate('/personal-life/social')
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Explore Dating Scene
            </Button>
          </div>
        )}
      </Card>

      {/* Children Section */}
      <Card variant="glass" padding="lg">
        <CardHeader 
          title="Children" 
          icon={<Baby className="w-5 h-5" />}
          subtitle={`${children.length} child${children.length !== 1 ? 'ren' : ''}`}
        />
        
        {children.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {children.map((child, index) => (
              <ChildCard 
                key={child.id}
                child={child}
                index={index}
                onClick={() => setSelectedChild(child)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            {pregnancy?.isPregnant ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-status-success/20 rounded-full flex items-center justify-center">
                  <Baby className="w-8 h-8 text-status-success" />
                </div>
                <h3 className="font-medium text-lg mb-2">Baby on the way!</h3>
                <p className="text-text-muted mb-2">
                  {pregnancy.weeksPregnant || 0} weeks pregnant
                </p>
                {pregnancy.gender !== 'unknown' && (
                  <Badge variant="green">
                    It's a {pregnancy.gender === 'male' ? 'boy' : 'girl'}!
                  </Badge>
                )}
              </>
            ) : (
              <>
                <Baby className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-50" />
                <p className="text-text-muted">
                  {partner?.relationshipStatus === 'married' 
                    ? 'Ready to start a family?' 
                    : partner 
                      ? 'No children yet - get married first!' 
                      : 'Find a partner to start a family'}
                </p>
                {partner?.relationshipStatus === 'married' && children.length < 6 && (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setShowPregnancyModal(true)}
                  >
                    <Baby className="w-4 h-4 mr-2" />
                    Try for Baby
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      {/* Dynasty Section */}
      {familyTree && (
        <Card variant="racing" padding="lg">
          <CardHeader 
            title="Dynasty Legacy" 
            icon={<Crown className="w-5 h-5 text-accent-gold" />}
            action={
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowDynasty(true)}
              >
                View Full Tree
              </Button>
            }
          />
          
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="p-4 bg-accent-gold/10 border border-accent-gold/30 rounded-lg text-center">
              <p className="text-xs text-text-muted mb-1">Dynasty Age</p>
              <p className="font-mono font-bold text-2xl text-accent-gold">
                {dynastyYears} yr{dynastyYears !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-4 bg-background rounded-lg text-center">
              <p className="text-xs text-text-muted mb-1">Generations</p>
              <p className="font-mono font-bold text-2xl">
                {familyTree.legacy.generationsActive}
              </p>
            </div>
            <div className="p-4 bg-background rounded-lg text-center">
              <p className="text-xs text-text-muted mb-1">Family Championships</p>
              <p className="font-mono font-bold text-2xl text-accent-gold">
                {familyTree.legacy.totalFamilyChampionships}
              </p>
            </div>
            <div className="p-4 bg-background rounded-lg text-center">
              <p className="text-xs text-text-muted mb-1">Family Wins</p>
              <p className="font-mono font-bold text-2xl">
                {familyTree.legacy.totalFamilyWins}
              </p>
            </div>
          </div>

          {/* Achievements */}
          {familyTree.achievements.length > 0 && (
            <div className="p-4 bg-background rounded-lg">
              <p className="text-sm font-medium mb-3">Dynasty Achievements</p>
              <div className="flex flex-wrap gap-2">
                {familyTree.achievements.map(achievement => (
                  <Badge 
                    key={achievement.id} 
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Award className="w-3 h-3 text-accent-gold" />
                    {achievement.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notable Family Members */}
          {(familyTree.legacy.notableDrivers.length > 0 || 
            familyTree.legacy.notableTeamPrincipals.length > 0) && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {familyTree.legacy.notableDrivers.length > 0 && (
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-text-muted mb-2">Notable Drivers</p>
                  <div className="space-y-1">
                    {familyTree.legacy.notableDrivers.map((name, i) => (
                      <p key={i} className="text-sm flex items-center gap-2">
                        <Car className="w-3 h-3 text-accent-red" />
                        {name}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {familyTree.legacy.notableTeamPrincipals.length > 0 && (
                <div className="p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-text-muted mb-2">Team Principals</p>
                  <div className="space-y-1">
                    {familyTree.legacy.notableTeamPrincipals.map((name, i) => (
                      <p key={i} className="text-sm flex items-center gap-2">
                        <Users className="w-3 h-3 text-accent-blue" />
                        {name}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Child Detail Modal */}
      <Modal
        isOpen={!!selectedChild}
        onClose={() => setSelectedChild(null)}
        title={selectedChild ? `${selectedChild.firstName}'s Profile` : ''}
        size="md"
      >
        {selectedChild && (
          <ChildDetailView 
            child={selectedChild} 
            onClose={() => setSelectedChild(null)}
            onSpendTime={(child) => {
              const result = spendTimeWithChild(child.id)
              addToast({
                type: result.success ? 'success' : 'error',
                title: result.success ? 'Quality Time' : 'Failed',
                message: result.success 
                  ? `${result.message} Bond +${result.bondGain || 0}`
                  : result.message
              })
              setSelectedChild(null)
            }}
            onStartRacing={(child) => {
              const result = startChildRacing(child.id)
              addToast({
                type: result.success ? 'success' : 'error',
                title: result.success ? 'Racing Career Started' : 'Failed',
                message: result.message
              })
              setSelectedChild(null)
            }}
          />
        )}
      </Modal>

      {/* Propose Modal */}
      <Modal
        isOpen={showProposeModal}
        onClose={() => setShowProposeModal(false)}
        title="Propose Marriage"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Pop the big question to {partner?.firstName}! Acceptance depends on romance, trust, affection, and compatibility.
          </p>
          <div className="p-4 bg-surface rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-text-muted">Acceptance Chance</p>
              <p className={`font-mono font-bold text-2xl ${
                proposalAcceptanceScore >= 70 ? 'text-status-success' :
                proposalAcceptanceScore >= 50 ? 'text-status-warning' :
                'text-status-danger'
              }`}>{proposalAcceptanceScore}%</p>
            </div>
            <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  proposalAcceptanceScore >= 70 ? 'bg-status-success' :
                  proposalAcceptanceScore >= 50 ? 'bg-status-warning' :
                  'bg-status-danger'
                }`}
                style={{ width: `${proposalAcceptanceScore}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
              <div className="flex justify-between">
                <span>Romance (40%)</span>
                <span className="text-red-400">{partner?.loveLevel || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Trust (30%)</span>
                <span className="text-blue-400">{partner?.trustLevel || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Affection (20%)</span>
                <span className="text-pink-400">{partner?.happiness || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Compat. (10%)</span>
                <span className="text-text-primary">{partner?.compatibilityScore || 0}</span>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-1">
              {proposalAcceptanceScore >= 70 
                ? 'Very likely to accept!' 
                : proposalAcceptanceScore >= 50
                  ? 'Could go either way...'
                  : 'You should wait and build your relationship first.'}
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-400">
              An engagement ring costs $50,000
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowProposeModal(false)}>
              Not Yet
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const result = proposeToPartner()
                if (result.accepted) {
                  addToast({
                    type: 'success',
                    title: 'They Said Yes!',
                    message: `${partner?.firstName} accepted your proposal!`
                  })
                } else if (result.success) {
                  addToast({
                    type: 'warning',
                    title: 'Not Ready',
                    message: result.message
                  })
                } else {
                  addToast({
                    type: 'error',
                    title: 'Cannot Propose',
                    message: result.message
                  })
                }
                setShowProposeModal(false)
              }}
            >
              <Gem className="w-4 h-4 mr-2" />
              Propose
            </Button>
          </div>
        </div>
      </Modal>

      {/* Plan Wedding Modal */}
      <Modal
        isOpen={showWeddingModal}
        onClose={() => setShowWeddingModal(false)}
        title="Plan Your Wedding"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Choose how you'd like to celebrate your special day with {partner?.firstName}.
          </p>
          <div className="space-y-3">
            {[
              { name: 'Intimate Ceremony', description: 'Close friends and family', cost: 25000 },
              { name: 'Grand Celebration', description: 'Full paddock invited', cost: 100000 },
              { name: 'Destination Wedding', description: 'Monaco or similar', cost: 250000 }
            ].map((option) => (
              <button
                key={option.name}
                className="w-full p-4 bg-surface hover:bg-surface/80 rounded-lg text-left transition-colors"
                onClick={() => {
                  const result = planWedding(option.cost)
                  addToast({
                    type: result.success ? 'success' : 'error',
                    title: result.success ? 'Congratulations!' : 'Failed',
                    message: result.message
                  })
                  setShowWeddingModal(false)
                }}
              >
                <p className="font-medium">{option.name}</p>
                <p className="text-sm text-text-muted">{option.description} - ${option.cost.toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Try for Baby Modal */}
      <Modal
        isOpen={showPregnancyModal}
        onClose={() => setShowPregnancyModal(false)}
        title="Start a Family"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center py-4">
            <Baby className="w-16 h-16 mx-auto mb-4 text-status-success opacity-80" />
            <p className="text-text-secondary mb-4">
              Ready to expand your family with {partner?.firstName}? 
              This will begin a 36-week pregnancy journey.
            </p>
            <p className="text-xs text-text-muted">
              Current children: {children.length} / 6 maximum
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              className="flex-1"
              onClick={() => setShowPregnancyModal(false)}
            >
              Not Yet
            </Button>
            <Button 
              variant="primary" 
              className="flex-1"
              onClick={() => {
                const result = announcePregnancy()
                addToast({
                  type: result.success ? 'success' : 'error',
                  title: result.success ? 'Wonderful News!' : 'Not Possible',
                  message: result.message
                })
                setShowPregnancyModal(false)
              }}
            >
              <Baby className="w-4 h-4 mr-2" />
              Try for Baby
            </Button>
          </div>
        </div>
      </Modal>

      {/* Birth Modal */}
      <Modal
        isOpen={showBirthModal}
        onClose={() => setShowBirthModal(false)}
        title="Welcome Your New Baby!"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="w-20 h-20 mx-auto mb-4 bg-status-success/20 rounded-full flex items-center justify-center">
              <Baby className="w-10 h-10 text-status-success" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              The big day has arrived!
            </h3>
            {pregnancy?.gender && pregnancy.gender !== 'unknown' && (
              <p className="text-text-secondary mb-4">
                It's a {pregnancy.gender === 'male' ? 'boy' : 'girl'}!
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Choose a name for your baby:
            </label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Enter name..."
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="ghost" 
              className="flex-1"
              onClick={() => {
                setShowBirthModal(false)
                setChildName('')
              }}
            >
              Use Random Name
            </Button>
            <Button 
              variant="primary" 
              className="flex-1"
              onClick={() => {
                const result = haveChild(childName || undefined)
                addToast({
                  type: result.success ? 'success' : 'error',
                  title: result.success ? 'Congratulations!' : 'Error',
                  message: result.message
                })
                setShowBirthModal(false)
                setChildName('')
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Welcome Baby
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface MetricBarProps {
  label: string
  value: number
  color: 'success' | 'warning' | 'danger' | 'pink' | 'blue'
}

function MetricBar({ label, value, color }: MetricBarProps) {
  const colorClasses = {
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    danger: 'bg-status-danger',
    pink: 'bg-pink-500',
    blue: 'bg-blue-400'
  }

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-muted">{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 bg-surface rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

interface ChildCardProps {
  child: Child
  index: number
  onClick: () => void
}

function ChildCard({ child, index, onClick }: ChildCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card 
        variant="default" 
        padding="md" 
        hoverable 
        className="cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <PortraitImage
              src={getChildPortrait(child.id || `child-${child.firstName}`.toLowerCase())}
              name={child.firstName}
              size="lg"
              bordered
            />
            <div>
              <h4 className="font-medium">{child.firstName}</h4>
              <p className="text-sm text-text-muted">Age {child.age}</p>
            </div>
          </div>
          {child.racingDevelopment?.isActive && (
            <Badge variant="red" size="sm">
              <Car className="w-3 h-3 mr-1" />
              Racing
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-background rounded">
            <span className="text-text-muted">Bond</span>
            <div className="h-1 bg-surface rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-pink-500"
                style={{ width: `${child.bondLevel}%` }}
              />
            </div>
          </div>
          <div className="p-2 bg-background rounded">
            <span className="text-text-muted">Happiness</span>
            <div className="h-1 bg-surface rounded-full mt-1 overflow-hidden">
              <div 
                className={`h-full ${
                  child.happiness >= 70 ? 'bg-status-success' :
                  child.happiness >= 40 ? 'bg-status-warning' : 'bg-status-danger'
                }`}
                style={{ width: `${child.happiness}%` }}
              />
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
          <GraduationCap className="w-3 h-3" />
          <span className="capitalize">{child.education.currentLevel.replace('_', ' ')}</span>
          {child.education.schoolType !== 'public' && (
            <Badge variant="outline" size="sm" className="capitalize">
              {child.education.schoolType}
            </Badge>
          )}
        </div>

        {/* Racing Progress */}
        {child.racingDevelopment?.isActive && (
          <div className="mt-3 p-2 bg-accent-red/10 border border-accent-red/30 rounded">
            <div className="flex justify-between text-xs">
              <span className="capitalize">{child.racingDevelopment.currentLevel.replace('_', ' ')}</span>
              <span className="font-mono">
                Rating: {child.racingDevelopment.currentRating.toFixed(0)}
              </span>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

interface ChildDetailViewProps {
  child: Child
  onClose: () => void
  onSpendTime: (child: Child) => void
  onStartRacing: (child: Child) => void
}

function ChildDetailView({ child, onClose, onSpendTime, onStartRacing }: ChildDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
        <PortraitImage
          src={getChildPortrait(child.id || `child-${child.firstName}`.toLowerCase())}
          name={`${child.firstName} ${child.lastName}`}
          size="xl"
          bordered
        />
        <div className="flex-1">
          <h3 className="font-display font-bold text-xl">
            {child.firstName} {child.lastName}
          </h3>
          <p className="text-text-muted">
            {child.age} years old • {child.gender}
          </p>
        </div>
        <Badge 
          variant={child.happiness >= 70 ? 'green' : child.happiness >= 40 ? 'yellow' : 'red'}
        >
          {child.happiness}% Happy
        </Badge>
      </div>

      {/* Bond & Happiness */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-background rounded-lg">
          <p className="text-sm text-text-muted mb-2">Bond Level</p>
          <div className="flex items-end gap-2">
            <span className="font-mono font-bold text-3xl">{child.bondLevel}</span>
            <span className="text-text-muted mb-1">/100</span>
          </div>
          <div className="h-2 bg-surface rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-pink-500"
              style={{ width: `${child.bondLevel}%` }}
            />
          </div>
        </div>
        <div className="p-4 bg-background rounded-lg">
          <p className="text-sm text-text-muted mb-2">Happiness</p>
          <div className="flex items-end gap-2">
            <span className="font-mono font-bold text-3xl">{child.happiness}</span>
            <span className="text-text-muted mb-1">/100</span>
          </div>
          <div className="h-2 bg-surface rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full ${
                child.happiness >= 70 ? 'bg-status-success' :
                child.happiness >= 40 ? 'bg-status-warning' : 'bg-status-danger'
              }`}
              style={{ width: `${child.happiness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Traits */}
      <div className="p-4 bg-background rounded-lg">
        <p className="text-sm font-medium mb-3">Personality Traits</p>
        <div className="flex flex-wrap gap-2">
          {child.traits.map(traitId => {
            const trait = getChildTraitById(traitId)
            return trait ? (
              <Badge key={traitId} variant="outline">
                {trait.name}
              </Badge>
            ) : null
          })}
        </div>
      </div>

      {/* Development Scores */}
      <div className="p-4 bg-background rounded-lg">
        <p className="text-sm font-medium mb-3">Development</p>
        <div className="grid grid-cols-2 gap-3">
          <DevScore label="Racing Aptitude" value={child.development.racingAptitude} />
          <DevScore label="Academic" value={child.development.academicAptitude} />
          <DevScore label="Social Skills" value={child.development.socialSkills} />
          <DevScore label="Discipline" value={child.development.discipline} />
          <DevScore label="Ambition" value={child.development.ambition} />
          <DevScore label="Physical Fitness" value={child.development.physicalFitness} />
        </div>
      </div>

      {/* Education */}
      <div className="p-4 bg-background rounded-lg">
        <p className="text-sm font-medium mb-3">Education</p>
        <div className="flex justify-between items-center mb-2">
          <span className="capitalize">{child.education.currentLevel.replace('_', ' ')}</span>
          <Badge variant="outline" className="capitalize">
            {child.education.schoolType}
          </Badge>
        </div>
        <div className="flex justify-between text-sm text-text-muted">
          <span>Academic Performance</span>
          <span className="font-mono">{child.education.performance}%</span>
        </div>
      </div>

      {/* Racing Development */}
      {child.racingDevelopment?.isActive && (
        <div className="p-4 bg-accent-red/10 border border-accent-red/30 rounded-lg">
          <p className="text-sm font-medium mb-3 flex items-center gap-2">
            <Car className="w-4 h-4 text-accent-red" />
            Racing Development
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-text-muted">Level</p>
              <p className="font-medium capitalize">
                {child.racingDevelopment.currentLevel.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Current Rating</p>
              <p className="font-mono font-bold">{child.racingDevelopment.currentRating.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Potential</p>
              <p className="font-mono font-bold text-accent-gold">
                {child.racingDevelopment.potentialRating}
              </p>
            </div>
          </div>
          {child.racingDevelopment.results.length > 0 && (
            <div className="mt-3 pt-3 border-t border-accent-red/30">
              <p className="text-xs text-text-muted mb-2">Recent Results</p>
              <div className="space-y-1">
                {child.racingDevelopment.results.slice(-3).reverse().map((result, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{result.event}</span>
                    <span className="font-mono">
                      P{result.position}/{result.totalParticipants}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button 
          variant="primary" 
          size="sm" 
          className="flex-1"
          onClick={() => onSpendTime(child)}
        >
          Spend Time Together
        </Button>
        {child.age >= RELATIONSHIP_CONFIG.childAgeForKarting && !child.racingDevelopment?.isActive && (
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => onStartRacing(child)}
          >
            <Car className="w-4 h-4 mr-2" />
            Start Racing
          </Button>
        )}
      </div>

      <Button variant="ghost" className="w-full" onClick={onClose}>
        Close
      </Button>
    </div>
  )
}

interface DevScoreProps {
  label: string
  value: number
}

function DevScore({ label, value }: DevScoreProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-surface rounded">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  )
}
