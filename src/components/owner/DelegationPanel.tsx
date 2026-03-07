import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, XCircle, Sparkles, Info
} from 'lucide-react'
import { Card, CardHeader, Badge, StaffPortrait } from '@/components/ui'
import { getPortraitByManifestId, getFallbackPortrait, getStaffPortrait, getRandomStaffPortraitByRole } from '@/utils/generated-assets'
import { useCareerStore } from '@/store/careerStore'
import { 
  STAFF_DELEGATION_MAP, 
  DELEGATION_SKILL_KEY_MAP,
  calculateDelegationQuality, 
  getDelegationEffectiveness,
  type DelegationDomain,
  type DelegationCapability,
  type StaffRole,
  type FacilityStaffSkills
} from '@/data/facility-staff-config'

const roleLabels: Record<string, string> = {
  chief_engineer: 'Chief Engineer',
  strategist: 'Race Strategist',
  technical_director: 'Technical Director',
  team_manager: 'Team Manager',
  pr_manager: 'PR Manager',
  crew_chief: 'Crew Chief',
  data_engineer: 'Data Engineer',
  reserve_driver: 'Reserve Driver',
  data_analyst: 'Data Analyst',
  race_engineer: 'Race Engineer',
  performance_engineer: 'Performance Engineer',
  marketing_manager: 'Marketing Manager'
}

const qualityColors: Record<string, { bg: string; text: string; border: string }> = {
  Excellent: { bg: 'bg-status-success/10', text: 'text-status-success', border: 'border-status-success/30' },
  Decent: { bg: 'bg-accent-blue/10', text: 'text-accent-blue', border: 'border-accent-blue/30' },
  Poor: { bg: 'bg-status-warning/10', text: 'text-status-warning', border: 'border-status-warning/30' }
}

interface DelegationPanelProps {
  compact?: boolean
}

export function DelegationPanel({ compact = false }: DelegationPanelProps) {
  const { careerState, toggleDelegation, getDelegationFlags, getLastDelegationReport } = useCareerStore()
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)
  
  // Search BOTH staff arrays -- hired team staff (Technical Director, etc.) are stored in facilityStaff
  const teamStaff = careerState?.ownedTeam?.staff ?? []
  const facilityStaff = careerState?.ownedTeam?.facilityStaff ?? []
  const allStaff = [...teamStaff, ...facilityStaff]
  const delegationFlags = getDelegationFlags()
  const lastReport = getLastDelegationReport()
  
  // Build a list of all possible delegation capabilities with the staff that can handle them
  const delegationOptions: Array<{
    capability: DelegationCapability
    staffMember: (typeof allStaff)[0] | null
    quality: number
    effectiveness: ReturnType<typeof getDelegationEffectiveness>
    requiredRole: string
  }> = []
  
  // Go through each role in the delegation map
  for (const [role, capabilities] of Object.entries(STAFF_DELEGATION_MAP)) {
    if (!capabilities) continue
    for (const cap of capabilities) {
      // Find the staff member with this role (search both team and facility staff arrays)
      const staffMember = allStaff.find(s => s.role === role)
      
      let quality = 0
      let effectiveness = getDelegationEffectiveness(0)
      
      if (staffMember) {
        // Map the capability's primarySkill to the actual FacilityStaffSkills key
        const primaryKey = DELEGATION_SKILL_KEY_MAP[cap.primarySkill] ?? 'technical'
        const secondaryKey = cap.secondarySkill ? DELEGATION_SKILL_KEY_MAP[cap.secondarySkill] : undefined
        const skills = staffMember.skills as FacilityStaffSkills | undefined
        const primarySkillValue = skills ? (skills[primaryKey] || 50) : 50
        const secondarySkillValue = secondaryKey && skills ? (skills[secondaryKey] || 0) : undefined
        const experience = ('experience' in staffMember ? (staffMember as any).experience : 0) || 3
        quality = calculateDelegationQuality(primarySkillValue, experience, secondarySkillValue)
        effectiveness = getDelegationEffectiveness(quality)
      }
      
      delegationOptions.push({
        capability: cap,
        staffMember: staffMember || null,
        quality,
        effectiveness,
        requiredRole: role
      })
    }
  }
  
  const activeCount = Object.values(delegationFlags).filter(Boolean).length
  
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${activeCount > 0 ? 'bg-accent-blue/10' : 'bg-surface-secondary'} flex items-center justify-center`}>
          <Users2 className={`w-5 h-5 ${activeCount > 0 ? 'text-accent-blue' : 'text-text-muted'}`} />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">Delegation</p>
          <p className="font-display font-bold text-xl">{activeCount} Active</p>
        </div>
      </div>
    )
  }
  
  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Staff Delegation"
        icon={<Users2 className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            {lastReport.length > 0 && (
              <button
                onClick={() => setShowReport(!showReport)}
                className="text-xs text-accent-blue hover:text-accent-blue/80 transition-colors"
              >
                {showReport ? 'Hide Report' : 'Last Report'}
              </button>
            )}
            <Badge variant={activeCount > 0 ? 'blue' : 'neutral'}>
              {activeCount} / {delegationOptions.length} Active
            </Badge>
          </div>
        }
      />
      
      {/* Info Banner */}
      <div className="p-3 bg-accent-blue/5 border border-accent-blue/20 rounded-lg mb-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-accent-blue mt-0.5 flex-shrink-0" />
          <p className="text-xs text-text-muted">
            Delegate tasks to your staff for automatic weekly handling. 
            Higher-skilled staff make better decisions. Poor performers may waste resources.
          </p>
        </div>
      </div>
      
      {/* Last Delegation Report */}
      <AnimatePresence>
        {showReport && lastReport.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-3 bg-surface-secondary/30 rounded-lg space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Last Week's Delegation Report</p>
              {lastReport.map((report, idx) => (
                <div key={idx} className="p-2 bg-surface-secondary/50 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{report.staffName}</span>
                    <Badge variant={report.quality >= 0.8 ? 'green' : report.quality >= 0.5 ? 'blue' : 'orange'} size="sm">
                      {getDelegationEffectiveness(report.quality).label}
                    </Badge>
                  </div>
                  <ul className="space-y-1">
                    {report.actions.map((action: string, aIdx: number) => (
                      <li key={aIdx} className="text-xs text-text-muted flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-accent-blue flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                  {report.effects && (
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      {report.effects.budgetImpact !== 0 && (
                        <span className={`text-xs font-mono ${(report.effects.budgetImpact ?? 0) >= 0 ? 'text-status-success' : 'text-status-error'}`}>
                          ${((report.effects.budgetImpact ?? 0) / 1000).toFixed(0)}k
                        </span>
                      )}
                      {report.effects.reputation !== 0 && (
                        <span className={`text-xs font-mono ${(report.effects.reputation ?? 0) >= 0 ? 'text-status-success' : 'text-status-error'}`}>
                          Rep {(report.effects.reputation ?? 0) > 0 ? '+' : ''}{report.effects.reputation}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Delegation Toggles */}
      <div className="space-y-2">
        {delegationOptions.map(({ capability, staffMember, quality, effectiveness, requiredRole }) => {
          const isEnabled = delegationFlags[capability.domain] || false
          const isExpanded = expandedDomain === capability.domain
          const hasStaff = !!staffMember
          const colors = qualityColors[effectiveness.label] || qualityColors.Poor
          
          return (
            <motion.div
              key={capability.domain}
              className={`rounded-lg border transition-colors ${
                isEnabled 
                  ? `${colors.bg} ${colors.border}` 
                  : 'bg-surface-secondary/30 border-transparent'
              }`}
              layout
            >
              {/* Main Row */}
              <div className="p-3 flex items-center gap-3">
                {/* Staff Portrait or Empty */}
                <div className="flex-shrink-0">
                  {staffMember ? (
                    <StaffPortrait
                      src={
                        staffMember.portraitId
                          ? (getPortraitByManifestId(staffMember.portraitId) || getFallbackPortrait(staffMember.gender || 'male'))
                          : (getStaffPortrait(staffMember.id) || getRandomStaffPortraitByRole(staffMember.role))
                      }
                      name={staffMember.name}
                      role={roleLabels[staffMember.role] || staffMember.role}
                      size="sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-text-muted" />
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{capability.label}</span>
                    {hasStaff && (
                      <Badge 
                        variant={effectiveness.label === 'Excellent' ? 'green' : effectiveness.label === 'Decent' ? 'blue' : 'orange'} 
                        size="sm"
                      >
                        {effectiveness.label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-muted truncate">
                    {hasStaff 
                      ? `${staffMember!.name} • ${roleLabels[staffMember!.role] || staffMember!.role}`
                      : `Requires ${roleLabels[requiredRole] || requiredRole}`
                    }
                  </p>
                </div>
                
                {/* Toggle + Expand */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setExpandedDomain(isExpanded ? null : capability.domain)}
                    className="p-1 hover:bg-surface-secondary/50 rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => hasStaff && toggleDelegation(capability.domain, !isEnabled)}
                    disabled={!hasStaff}
                    className={`transition-colors ${!hasStaff ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isEnabled ? (
                      <ToggleRight className="w-8 h-8 text-status-success" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-text-muted" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2">
                      <p className="text-xs text-text-muted">
                        {capability.description}
                      </p>
                      
                      {hasStaff ? (
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs text-text-muted">Quality Score</p>
                            <div className="flex items-center gap-1">
                              <div className="w-20 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-full ${
                                    quality >= 0.8 ? 'bg-status-success' : quality >= 0.5 ? 'bg-accent-blue' : 'bg-status-warning'
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${quality * 100}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                              <span className="text-xs font-mono">{Math.round(quality * 100)}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-text-muted">Effectiveness</p>
                            <p className="text-xs">{effectiveness.description}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-status-warning">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-xs">Hire a {roleLabels[requiredRole] || requiredRole} to enable this delegation</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
      
      {/* Overall Summary */}
      {activeCount > 0 && (
        <div className="mt-4 p-3 bg-status-success/5 border border-status-success/20 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-success" />
            <span className="text-sm font-medium text-status-success">
              {activeCount} domain{activeCount > 1 ? 's' : ''} auto-managed
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Your staff will handle these areas automatically each week. 
            Check the weekly reports in your email for details.
          </p>
        </div>
      )}
    </Card>
  )
}
