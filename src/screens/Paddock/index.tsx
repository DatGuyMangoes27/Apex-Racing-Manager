import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe2, Trophy, Users, Building2, Factory, Newspaper,
  TrendingUp, DollarSign, Wrench, Flag
} from 'lucide-react'
import { Card, PageHeader } from '@/components/ui'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import { ChampionshipsTab } from './ChampionshipsTab'
import { TeamsTab } from './TeamsTab'
import { DriversTab } from './DriversTab'
import { ManufacturersTab } from './ManufacturersTab'
import { NewsTab } from './NewsTab'

type TabId = 'championships' | 'teams' | 'drivers' | 'manufacturers' | 'news'

interface Tab {
  id: TabId
  name: string
  shortName: string
  icon: React.ReactNode
  description: string
}

const TABS: Tab[] = [
  {
    id: 'championships',
    name: 'Championships',
    shortName: 'Championships',
    icon: <Trophy className="w-5 h-5" />,
    description: 'Your entries and series opportunities'
  },
  {
    id: 'teams',
    name: 'Competitors',
    shortName: 'Competitors',
    icon: <Building2 className="w-5 h-5" />,
    description: 'Analyze rival teams in your series'
  },
  {
    id: 'drivers',
    name: 'Drivers',
    shortName: 'Drivers',
    icon: <Users className="w-5 h-5" />,
    description: 'Driver market and rival intelligence'
  },
  {
    id: 'manufacturers',
    name: 'Manufacturers',
    shortName: 'Manufacturers',
    icon: <Factory className="w-5 h-5" />,
    description: 'View manufacturer programs and factory teams'
  },
  {
    id: 'news',
    name: 'Paddock News',
    shortName: 'News',
    icon: <Newspaper className="w-5 h-5" />,
    description: 'Transfer news and simulation insights'
  }
]

export function Paddock() {
  const { careerState } = useCareerStore()
  const { series, initializeWorld } = useRivalStore()
  
  const [activeTab, setActiveTab] = useState<TabId>('championships')
  const [isLoading, setIsLoading] = useState(false)

  // Get team owner data
  const ownedTeam = careerState?.ownedTeam
  const seriesEntries = careerState?.seriesEntries || []
  
  // Initialize world if needed
  useEffect(() => {
    if (series.length === 0) {
      setIsLoading(true)
      initializeWorld()
      setIsLoading(false)
    }
  }, [series.length, initializeWorld])

  // Team owner stats for the header
  const totalStaff = ownedTeam 
    ? (ownedTeam.staff?.length || 0) + (ownedTeam.facilityStaff?.length || 0)
    : 0
  
  const teamRep = ownedTeam?.reputation ?? 0
  const activeSeriesCount = seriesEntries.length
  const cashOnHand = ownedTeam?.budgets?.cash ?? 0
  
  // Calculate development level (average of facility levels)
  const developmentLevel = ownedTeam?.facilities
    ? Math.round(
        Object.values(ownedTeam.facilities).reduce(
          (sum, f) => sum + (f.currentLevel || 1), 0
        ) / Object.keys(ownedTeam.facilities).length
      )
    : 1

  if (isLoading || series.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Globe2 className="w-12 h-12 mx-auto text-text-muted mb-4 animate-pulse" />
          <p className="text-text-muted">Loading world data...</p>
        </div>
      </div>
    )
  }

  // Format currency for display
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
    return `$${amount.toLocaleString()}`
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={ownedTeam ? `${ownedTeam.name} - Paddock` : 'World Browser'}
        subtitle={ownedTeam 
          ? 'Manage your racing operation - entries, competitors, and drivers' 
          : 'Explore the racing world - championships, teams, drivers, and manufacturers'
        }
        icon={<Globe2 className="w-6 h-6" />}
      />

      {/* Team Owner Stats Bar */}
      <Card variant="racing" padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <StatItem 
              label="Team Reputation" 
              value={teamRep} 
              icon={<TrendingUp className="w-4 h-4 text-accent-gold" />}
              showProgress
              progressValue={teamRep}
            />
            <StatItem 
              label="Active Series" 
              value={activeSeriesCount} 
              icon={<Flag className="w-4 h-4 text-accent-red" />}
            />
            <StatItem 
              label="Staff" 
              value={totalStaff} 
              icon={<Users className="w-4 h-4 text-accent-orange" />}
            />
            <StatItem 
              label="Development" 
              value={developmentLevel}
              suffix="/ 5"
              icon={<Wrench className="w-4 h-4 text-blue-400" />}
            />
          </div>
          <div className="flex items-center gap-3">
            <DollarSign className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-text-muted">Available Funds</p>
              <p className="font-display font-bold text-xl text-green-400">{formatCurrency(cashOnHand)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-surface-border pb-0">
        {TABS.map(tab => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'championships' && <ChampionshipsTab />}
          {activeTab === 'teams' && <TeamsTab />}
          {activeTab === 'drivers' && <DriversTab />}
          {activeTab === 'manufacturers' && <ManufacturersTab />}
          {activeTab === 'news' && <NewsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Tab Button Component
interface TabButtonProps {
  tab: Tab
  isActive: boolean
  onClick: () => void
}

function TabButton({ tab, isActive, onClick }: TabButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
        ${isActive 
          ? 'text-accent-red' 
          : 'text-text-muted hover:text-text-primary'
        }
      `}
      whileHover={{ y: -1 }}
      whileTap={{ y: 0 }}
    >
      {tab.icon}
      <span>{tab.shortName}</span>
      
      {/* Active Indicator */}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-red"
          layoutId="activeTabIndicator"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  )
}

// Stat Item Component
interface StatItemProps {
  label: string
  value: number
  icon: React.ReactNode
  suffix?: string
  showProgress?: boolean
  progressValue?: number
}

function StatItem({ label, value, icon, suffix, showProgress, progressValue }: StatItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <div className="flex items-center gap-2">
          <p className="font-display font-bold text-xl">
            {value}{suffix && <span className="text-text-muted text-sm ml-1">{suffix}</span>}
          </p>
          {showProgress && progressValue !== undefined && (
            <div className="w-20 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-accent-red to-accent-gold rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressValue, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
