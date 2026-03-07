import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe2, Trophy, Users, Building2, Factory, Newspaper,
  TrendingUp, DollarSign, Wrench, Flag
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import { ChampionshipsTab } from './ChampionshipsTab'
import { TeamsTab } from './TeamsTab'
import { DriversTab } from './DriversTab'
import { ManufacturersTab } from './ManufacturersTab'
import { NewsTab } from './NewsTab'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'

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
    icon: <Trophy className="w-[18px] h-[18px]" />,
    description: 'Your entries and series opportunities'
  },
  {
    id: 'teams',
    name: 'Competitors',
    shortName: 'Competitors',
    icon: <Building2 className="w-[18px] h-[18px]" />,
    description: 'Analyze rival teams in your series'
  },
  {
    id: 'drivers',
    name: 'Drivers',
    shortName: 'Drivers',
    icon: <Users className="w-[18px] h-[18px]" />,
    description: 'Driver market and rival intelligence'
  },
  {
    id: 'manufacturers',
    name: 'Manufacturers',
    shortName: 'Manufacturers',
    icon: <Factory className="w-[18px] h-[18px]" />,
    description: 'View manufacturer programs and factory teams'
  },
  {
    id: 'news',
    name: 'Paddock News',
    shortName: 'News',
    icon: <Newspaper className="w-[18px] h-[18px]" />,
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
      <div className="bg-white w-full h-full overflow-y-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Globe2 className="w-[48px] h-[48px] mx-auto text-[#4a5565] mb-[16px] animate-pulse" />
            <p className="text-[14px] text-[#4a5565]" style={FR}>Loading world data...</p>
          </div>
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
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        {/* Page Header */}
        <div className="flex items-center gap-[12px]">
          <Globe2 className="w-[24px] h-[24px] text-[#0a0a0a]" />
          <div>
            <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px]" style={FB}>
              {ownedTeam ? `${ownedTeam.name} - Paddock` : 'World Browser'}
            </h1>
            <p className="text-[14px] text-[#4a5565]" style={FR}>
              {ownedTeam 
                ? 'Manage your racing operation - entries, competitors, and drivers' 
                : 'Explore the racing world - championships, teams, drivers, and manufacturers'
              }
            </p>
          </div>
        </div>

        {/* Team Owner Stats Bar */}
        <div className={CARD}>
          <div className="p-[16px] flex items-center justify-between">
            <div className="flex items-center gap-[24px]">
              <StatItem 
                label="Team Reputation" 
                value={teamRep} 
                icon={<TrendingUp className="w-[16px] h-[16px] text-[#f59e0b]" />}
                showProgress
                progressValue={teamRep}
              />
              <StatItem 
                label="Active Series" 
                value={activeSeriesCount} 
                icon={<Flag className="w-[16px] h-[16px] text-[#ef4444]" />}
              />
              <StatItem 
                label="Staff" 
                value={totalStaff} 
                icon={<Users className="w-[16px] h-[16px] text-[#f59e0b]" />}
              />
              <StatItem 
                label="Development" 
                value={developmentLevel}
                suffix="/ 5"
                icon={<Wrench className="w-[16px] h-[16px] text-[#3b82f6]" />}
              />
            </div>
            <div className="flex items-center gap-[12px]">
              <DollarSign className="w-[16px] h-[16px] text-[#00a63e]" />
              <div>
                <p className="text-[12px] text-[#4a5565]" style={FR}>Available Funds</p>
                <p className="text-[20px] text-[#00a63e]" style={FBold}>{formatCurrency(cashOnHand)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-[4px] border-b border-black/10 pb-0">
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
        relative flex items-center gap-[8px] px-[24px] py-[12px] text-[14px] transition-colors
        ${isActive 
          ? 'text-[#0a0a0a]' 
          : 'text-[#4a5565] hover:text-[#0a0a0a]'
        }
      `}
      style={isActive ? FBold : FR}
      whileHover={{ y: -1 }}
      whileTap={{ y: 0 }}
    >
      {tab.icon}
      <span>{tab.shortName}</span>
      
      {/* Active Indicator */}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0a0a0a]"
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
    <div className="flex items-center gap-[12px]">
      <div className="w-[40px] h-[40px] rounded-[12px] bg-[#f9fafb] border-[0.8px] border-black/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[12px] text-[#4a5565]" style={FR}>{label}</p>
        <div className="flex items-center gap-[8px]">
          <p className="text-[20px] text-[#0a0a0a]" style={FBold}>
            {value}{suffix && <span className="text-[#4a5565] text-[13px] ml-[4px]">{suffix}</span>}
          </p>
          {showProgress && progressValue !== undefined && (
            <div className="w-[80px] h-[6px] bg-[#f0f0f0] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#0a0a0a] rounded-full"
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
