import { ReactNode, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, Info } from 'lucide-react'
import clsx from 'clsx'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: TooltipPosition
  delay?: number
  maxWidth?: number
  className?: string
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  maxWidth = 280,
  className
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [adjustedPosition, setAdjustedPosition] = useState(position)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && containerRef.current && tooltipRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      
      // Check if tooltip would overflow viewport and adjust position
      let newPosition = position
      
      if (position === 'top' && containerRect.top - tooltipRect.height < 10) {
        newPosition = 'bottom'
      } else if (position === 'bottom' && containerRect.bottom + tooltipRect.height > window.innerHeight - 10) {
        newPosition = 'top'
      } else if (position === 'left' && containerRect.left - tooltipRect.width < 10) {
        newPosition = 'right'
      } else if (position === 'right' && containerRect.right + tooltipRect.width > window.innerWidth - 10) {
        newPosition = 'left'
      }
      
      if (newPosition !== adjustedPosition) {
        setAdjustedPosition(newPosition)
      }
    }
  }, [isVisible, position, adjustedPosition])

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
    setAdjustedPosition(position)
  }

  const positionClasses: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  const arrowClasses: Record<TooltipPosition, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-surface-secondary border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-surface-secondary border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-surface-secondary border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-surface-secondary border-y-transparent border-l-transparent'
  }

  const animationVariants = {
    top: { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } },
    bottom: { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: 4 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: -4 }, animate: { opacity: 1, x: 0 } }
  }

  return (
    <div 
      ref={containerRef}
      className={clsx('relative inline-flex', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            ref={tooltipRef}
            initial={animationVariants[adjustedPosition].initial}
            animate={animationVariants[adjustedPosition].animate}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              'absolute z-[100] px-3 py-2 text-sm',
              'bg-surface-secondary border border-surface-border rounded-lg shadow-card',
              'text-text-secondary whitespace-normal',
              positionClasses[adjustedPosition]
            )}
            style={{ maxWidth, width: 'max-content' }}
          >
            {content}
            {/* Arrow */}
            <div 
              className={clsx(
                'absolute w-0 h-0 border-[6px]',
                arrowClasses[adjustedPosition]
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Info tooltip with icon - for explaining terms
interface InfoTooltipProps {
  content: ReactNode
  position?: TooltipPosition
  iconSize?: number
  className?: string
}

export function InfoTooltip({ 
  content, 
  position = 'top',
  iconSize = 14,
  className 
}: InfoTooltipProps) {
  return (
    <Tooltip content={content} position={position}>
      <Info 
        className={clsx(
          'text-text-muted hover:text-text-secondary cursor-help transition-colors',
          className
        )} 
        size={iconSize}
      />
    </Tooltip>
  )
}

// Help tooltip with question mark icon
interface HelpTooltipProps {
  content: ReactNode
  position?: TooltipPosition
  iconSize?: number
  className?: string
}

export function HelpTooltip({ 
  content, 
  position = 'top',
  iconSize = 14,
  className 
}: HelpTooltipProps) {
  return (
    <Tooltip content={content} position={position}>
      <HelpCircle 
        className={clsx(
          'text-text-muted hover:text-text-secondary cursor-help transition-colors',
          className
        )} 
        size={iconSize}
      />
    </Tooltip>
  )
}

// Metric tooltip - styled for displaying metric explanations
interface MetricTooltipProps {
  label: string
  description: string
  value?: string | number
  children: ReactNode
  position?: TooltipPosition
}

export function MetricTooltip({
  label,
  description,
  value,
  children,
  position = 'top'
}: MetricTooltipProps) {
  return (
    <Tooltip
      position={position}
      maxWidth={320}
      content={
        <div className="space-y-1">
          <div className="font-display font-semibold text-white">{label}</div>
          <div className="text-text-secondary text-xs leading-relaxed">{description}</div>
          {value !== undefined && (
            <div className="text-accent-orange font-mono text-xs mt-2">
              Current: {value}
            </div>
          )}
        </div>
      }
    >
      {children}
    </Tooltip>
  )
}

// Tooltip definitions for common game terms - can be imported where needed
export const tooltipDefinitions = {
  // Financial terms
  runway: {
    label: 'Financial Runway',
    description: 'The number of weeks your team can operate with current funds before running out of money. Based on your average weekly expenses.'
  },
  costCap: {
    label: 'Cost Cap',
    description: 'A spending limit imposed by the series regulations. Exceeding this may result in penalties including point deductions or disqualification.'
  },
  budgetAllocation: {
    label: 'Budget Allocation',
    description: 'How your team\'s budget is divided between development, operations, travel, and contingency funds.'
  },
  revenueShare: {
    label: 'Revenue Share',
    description: 'Income received from the series based on your championship position and prize money distribution.'
  },
  
  // Staff & Team terms
  chiefEngineer: {
    label: 'Chief Engineer',
    description: 'Oversees car setup and technical decisions. Higher skill improves car reliability and performance consistency.'
  },
  strategist: {
    label: 'Strategist',
    description: 'Plans race strategy including pit stops and tire management. Better strategists make fewer tactical errors.'
  },
  performanceAnalyst: {
    label: 'Performance Analyst',
    description: 'Analyzes telemetry and race data. Improves development efficiency and helps identify performance issues.'
  },
  
  // Facility terms
  aeroFacility: {
    label: 'Aerodynamics Facility',
    description: 'Develops downforce and drag reduction. Higher levels unlock more aggressive aero upgrades.'
  },
  chassisFacility: {
    label: 'Chassis Facility',
    description: 'Improves chassis stiffness, weight distribution, and handling balance.'
  },
  simulatorFacility: {
    label: 'Simulator',
    description: 'Allows drivers to practice and engineers to test setups. Reduces development risk and improves qualifying performance.'
  },
  
  // Development terms
  developmentPoints: {
    label: 'Development Points',
    description: 'Resources spent on improving your car\'s performance. Earned through facilities and accumulated over time.'
  },
  reliabilityBranch: {
    label: 'Reliability Development',
    description: 'Focuses on reducing mechanical failures and extending part lifespan. Critical for endurance events.'
  },
  performanceBranch: {
    label: 'Performance Development',
    description: 'Focuses on raw speed improvements. More risky but offers larger performance gains.'
  },
  
  // Sponsor terms
  sponsorSatisfaction: {
    label: 'Sponsor Satisfaction',
    description: 'How happy your sponsor is with your performance. Drops if you fail to meet targets. Low satisfaction risks contract termination.'
  },
  performanceTargets: {
    label: 'Performance Targets',
    description: 'Goals set by sponsors such as podium finishes, wins, or championship position. Meet these to maintain satisfaction.'
  },
  
  // Board terms
  boardMood: {
    label: 'Board Mood',
    description: 'How the team\'s board of directors feels about your management. Affected by results, finances, and meeting expectations.'
  },
  boardPatience: {
    label: 'Board Patience',
    description: 'How much leeway the board gives you for poor results. Low patience means you\'re at risk of being fired.'
  },
  
  // Media terms
  mediaScrutiny: {
    label: 'Media Scrutiny',
    description: 'How much attention the media pays to your actions. Higher profile teams face more scrutiny and consequences for mistakes.'
  },
  publicImage: {
    label: 'Public Image',
    description: 'Your reputation with fans and the public. Affects merchandise sales, fan engagement, and sponsor interest.'
  },
  
  // Racing terms
  partWear: {
    label: 'Part Wear',
    description: 'Degradation of car components over races. Worn parts have higher failure risk and reduced performance.'
  },
  driverFatigue: {
    label: 'Driver Fatigue',
    description: 'Accumulated tiredness from racing and travel. High fatigue increases mistake probability and reduces consistency.'
  },
  racecraft: {
    label: 'Racecraft',
    description: 'Ability to overtake, defend position, and race wheel-to-wheel. Higher racecraft means better race-day performance.'
  },
  consistency: {
    label: 'Consistency',
    description: 'How reliably the driver performs lap after lap. Consistent drivers make fewer mistakes under pressure.'
  }
}
