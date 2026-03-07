// ============================================
// MANUFACTURING QUEUE COMPONENT
// ============================================
// View and manage in-house parts manufacturing

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gauge, Car, CircleDot, ArrowUpDown, Cog, Clock, CheckCircle, AlertTriangle, Play, Pause, X, Plus, Settings, Trash2, ChevronUp, Factory } from 'lucide-react'
import { Card, CardHeader, CardContent, Badge, Button, Progress } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import type { ManufacturingJobStatus } from '@/data/facility-config'
import { SPARE_PART_NAMES, MANUFACTURING_CONFIG, calculateManufacturingTime } from '@/data/spare-parts-config'
import type { SparePartType } from '@/data/spare-parts-config'
import { getManufacturingQueueStatus, getPendingProductionByType, getMaxConcurrentJobs } from '@/simulation/logistics/partsManufacturing'

// CardTitle component - simple wrapper for card titles
const CardTitle = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
  <h3 className={`font-semibold text-text-primary ${className}`} {...props}>{children}</h3>
)

function PartTypeIcon({ type, className }: { type: string; className: string }): React.ReactElement | null {
  switch (type) {
    case 'engine': return <Gauge className={className} />
    case 'chassis': return <Car className={className} />
    case 'brakes': return <CircleDot className={className} />
    case 'suspension': return <ArrowUpDown className={className} />
    case 'gearbox': return <Cog className={className} />
    default: return <Cog className={className} />
  }
}

// ============================================
// JOB STATUS BADGE
// ============================================

const JobStatusBadge: React.FC<{ status: ManufacturingJobStatus }> = ({ status }) => {
  switch (status) {
    case 'in_progress':
      return (
        <Badge className="bg-accent-orange text-white">
          <Play className="w-3 h-3 mr-1" />
          In Progress
        </Badge>
      )
    case 'queued':
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Queued
        </Badge>
      )
    case 'completed':
      return (
        <Badge className="bg-status-success text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      )
    case 'cancelled':
      return (
        <Badge variant="destructive">
          <Trash2 className="w-3 h-3 mr-1" />
          Cancelled
        </Badge>
      )
  }
}

// ============================================
// MANUFACTURING JOB CARD
// ============================================

interface ManufacturingJobCardProps {
  job: ManufacturingJob
  currentWeek: number
  currentYear: number
  onCancel?: (jobId: string) => void
  onPrioritize?: (jobId: string) => void
}

const ManufacturingJobCard: React.FC<ManufacturingJobCardProps> = ({
  job,
  currentWeek,
  currentYear,
  onCancel,
  onPrioritize
}) => {
  // Calculate progress for in-progress jobs
  let progress = 0
  let weeksRemaining = 0
  
  if (job.status === 'in_progress') {
    const totalWeeks = (job.completionYear - job.startYear) * 52 + (job.completionWeek - job.startWeek)
    const elapsedWeeks = (currentYear - job.startYear) * 52 + (currentWeek - job.startWeek)
    progress = Math.min(100, Math.max(0, (elapsedWeeks / totalWeeks) * 100))
    weeksRemaining = Math.max(0, (job.completionYear - currentYear) * 52 + (job.completionWeek - currentWeek))
  } else if (job.status === 'queued') {
    weeksRemaining = (job.completionYear - job.startYear) * 52 + (job.completionWeek - job.startWeek)
  }
  
  const totalCost = job.materialCost + job.laborCost
  
  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      job.status === 'in_progress' 
        ? 'bg-accent-orange/10 border-accent-orange/30' 
        : 'bg-surface-medium border-border-subtle'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            job.status === 'in_progress' ? 'bg-accent-orange/20' : 'bg-surface-dark'
          }`}>
            <PartTypeIcon type={job.partType} className="w-5 h-5 text-text-primary" />
          </div>
          <div>
            <div className="font-medium text-text-primary">
              {SPARE_PART_NAMES[job.partType]} × {job.quantity}
            </div>
            <div className="text-sm text-text-secondary">
              Target Quality: {job.qualityTarget}%
            </div>
          </div>
        </div>
        <JobStatusBadge status={job.status} />
      </div>
      
      {/* Progress bar for in-progress jobs */}
      {job.status === 'in_progress' && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-secondary">Progress</span>
            <span className="text-text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-surface-dark rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-orange transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Info row */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-text-secondary">
            <Clock className="w-4 h-4" />
            {job.status === 'completed' ? (
              <span>Completed</span>
            ) : (
              <span>{weeksRemaining} week{weeksRemaining !== 1 ? 's' : ''} remaining</span>
            )}
          </div>
          <div className="text-text-secondary">
            Cost: <span className="text-accent-green">${totalCost.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Actions */}
        {(job.status === 'queued' || job.status === 'in_progress') && (
          <div className="flex items-center gap-2">
            {job.status === 'queued' && onPrioritize && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onPrioritize(job.id)}
                title="Move to front of queue"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            )}
            {onCancel && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onCancel(job.id)}
                className="text-status-danger hover:text-status-danger"
                title="Cancel job"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// QUEUE SUMMARY
// ============================================

interface QueueSummaryProps {
  state: SparePartsState
  manufacturingLevel: number
}

const QueueSummary: React.FC<QueueSummaryProps> = ({ state, manufacturingLevel }) => {
  const queueStatus = getManufacturingQueueStatus(state)
  const pendingByType = getPendingProductionByType(state)
  const maxJobs = getMaxConcurrentJobs(manufacturingLevel)
  
  const activeJobCount = state.manufacturingQueue.filter(
    j => j.status === 'in_progress' || j.status === 'queued'
  ).length
  
  return (
    <Card className="bg-surface-dark border-border-subtle">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Factory className="w-5 h-5 text-accent-orange" />
          Queue Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-2xl font-bold text-text-primary">
              {activeJobCount} / {maxJobs}
            </div>
            <div className="text-sm text-text-secondary">Active Jobs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent-orange">
              {queueStatus.totalQueuedParts}
            </div>
            <div className="text-sm text-text-secondary">Parts in Production</div>
          </div>
        </div>
        
        {/* Pending by type */}
        <div className="text-sm text-text-secondary mb-2">Pending Production:</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(pendingByType).map(([type, count]) => (
            count > 0 && (
              <Badge key={type} variant="outline" className="text-xs">
                <PartTypeIcon type={type as SparePartType} className="w-3 h-3 mr-1" />
                {count} {SPARE_PART_NAMES[type as SparePartType]}
              </Badge>
            )
          ))}
          {Object.values(pendingByType).every(c => c === 0) && (
            <span className="text-text-tertiary text-xs">No pending production</span>
          )}
        </div>
        
        {queueStatus.estimatedQueueClearWeeks > 0 && (
          <div className="mt-4 pt-3 border-t border-border-subtle">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-text-secondary" />
              <span className="text-text-secondary">
                Queue clears in ~{queueStatus.estimatedQueueClearWeeks} weeks
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// MANUFACTURING ESTIMATES
// ============================================

interface ManufacturingEstimatesProps {
  manufacturingLevel: number
}

const ManufacturingEstimates: React.FC<ManufacturingEstimatesProps> = ({ manufacturingLevel }) => {
  return (
    <Card className="bg-surface-dark border-border-subtle">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Production Times (Lvl {manufacturingLevel})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {(['brakes', 'suspension', 'gearbox', 'engine', 'chassis'] as SparePartType[]).map(partType => {
            const config = MANUFACTURING_CONFIG[partType]
            const time = calculateManufacturingTime(partType, manufacturingLevel)
            const quality = config.baseQuality + (manufacturingLevel - 1) * 2
            
            return (
              <div key={partType} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <PartTypeIcon type={partType} className="w-4 h-4 text-text-secondary" />
                  <span className="text-text-primary">{SPARE_PART_NAMES[partType]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-text-secondary">
                    {time < 1 ? `${Math.round(time * 7)} days` : `${time} wk${time !== 1 ? 's' : ''}`}
                  </span>
                  <span className="text-accent-blue text-xs">~{quality}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

interface ManufacturingQueueProps {
  state: SparePartsState
  manufacturingLevel: number
  currentWeek: number
  currentYear: number
  onNewJob?: () => void
  onCancelJob?: (jobId: string) => void
  onPrioritizeJob?: (jobId: string) => void
}

export const ManufacturingQueue: React.FC<ManufacturingQueueProps> = ({
  state,
  manufacturingLevel,
  currentWeek,
  currentYear,
  onNewJob,
  onCancelJob,
  onPrioritizeJob
}) => {
  const activeJobs = state.manufacturingQueue.filter(
    j => j.status === 'in_progress' || j.status === 'queued'
  )
  const completedJobs = state.manufacturingQueue.filter(j => j.status === 'completed')
  
  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QueueSummary state={state} manufacturingLevel={manufacturingLevel} />
        <ManufacturingEstimates manufacturingLevel={manufacturingLevel} />
      </div>
      
      {/* Active Jobs */}
      <Card className="bg-surface-dark border-border-subtle">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Production Queue</CardTitle>
            {onNewJob && (
              <Button variant="outline" size="sm" onClick={onNewJob}>
                <Plus className="w-4 h-4 mr-1" />
                New Job
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeJobs.length === 0 ? (
            <div className="text-center py-8">
              <Factory className="w-12 h-12 mx-auto mb-3 text-text-tertiary opacity-50" />
              <p className="text-text-secondary">No active manufacturing jobs</p>
              <p className="text-sm text-text-tertiary mt-1">
                Queue new parts production to build your inventory
              </p>
              {onNewJob && (
                <Button variant="outline" className="mt-4" onClick={onNewJob}>
                  <Plus className="w-4 h-4 mr-2" />
                  Start Manufacturing
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs
                .sort((a, b) => {
                  // In-progress first, then queued by position
                  if (a.status === 'in_progress' && b.status !== 'in_progress') return -1
                  if (b.status === 'in_progress' && a.status !== 'in_progress') return 1
                  return 0
                })
                .map(job => (
                  <ManufacturingJobCard
                    key={job.id}
                    job={job}
                    currentWeek={currentWeek}
                    currentYear={currentYear}
                    onCancel={onCancelJob}
                    onPrioritize={onPrioritizeJob}
                  />
                ))
              }
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Recently Completed (collapsible) */}
      {completedJobs.length > 0 && (
        <Card className="bg-surface-dark border-border-subtle">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-text-secondary">
              Recently Completed ({completedJobs.slice(0, 5).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 opacity-60">
              {completedJobs.slice(0, 5).map(job => (
                <div 
                  key={job.id}
                  className="flex items-center justify-between p-2 bg-surface-medium rounded"
                >
                  <div className="flex items-center gap-2">
                    <PartTypeIcon type={job.partType} className="w-4 h-4" />
                    <span className="text-sm">
                      {SPARE_PART_NAMES[job.partType]} × {job.quantity}
                    </span>
                  </div>
                  <CheckCircle className="w-4 h-4 text-status-success" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ManufacturingQueue
