import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import { 
  Home, 
  Calendar, 
  Flag, 
  Car, 
  DollarSign, 
  Tv, 
  ChevronRight,
  ChevronDown,
  Building2,
  Factory,
  Settings,
  Save,
  Check,
  Terminal,
  Mail,
  Trophy,
  ShoppingCart,
  Handshake,
  Briefcase,
  BookOpen,
  Landmark,
  TrendingUp,
  ShoppingBag,
  Package,
  Heart,
  Wallet,
  Users,
  Activity,
  Star,
  Smartphone,
  Search,
  _Clock,
  Sun,
  Moon,
  Battery,
  BatteryLow,
  BatteryWarning,
  Zap,
  type LucideIcon
} from 'lucide-react'
import clsx from 'clsx'
import { useSettingsStore } from '@/store/settingsStore'
import { useCareerStore, forceSaveCareer, saveToNativeDB, getDayName } from '@/store/careerStore'
import { useNotifications } from '@/hooks'
import { useToast } from '@/components/ui'
import { calculateFatigueZone, getFatigueZoneInfo, TIME_BUDGET_CONFIG } from '@/simulation/timeBudget'

// Types for navigation structure
interface NavItem {
  path: string
  icon: LucideIcon
  label: string
  context: 'home' | 'calendar' | 'raceday' | 'garage' | 'finances' | 'media' | 'personal'
}

interface NavGroup {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

// Grouped navigation structure
const navGroups: NavGroup[] = [
  {
    id: 'core',
    label: 'Core',
    icon: Home,
    items: [
      { path: '/home', icon: Home, label: 'Hub', context: 'home' },
      { path: '/emails', icon: Mail, label: 'Inbox', context: 'home' },
      { path: '/calendar', icon: Calendar, label: 'Calendar', context: 'calendar' },
      { path: '/paddock', icon: Building2, label: 'Paddock', context: 'home' },
      { path: '/scouting', icon: Search, label: 'Scouting', context: 'home' },
    ]
  },
  {
    id: 'racing',
    label: 'Racing',
    icon: Flag,
    items: [
      { path: '/race-day', icon: Flag, label: 'Race Day', context: 'raceday' },
      { path: '/garage', icon: Car, label: 'Garage', context: 'garage' },
      { path: '/marketplace', icon: ShoppingCart, label: 'Marketplace', context: 'garage' },
      { path: '/series-entry', icon: Trophy, label: 'Series Entry', context: 'garage' },
    ]
  },
  {
    id: 'business',
    label: 'Business',
    icon: DollarSign,
    items: [
      { path: '/finances', icon: DollarSign, label: 'Finances', context: 'finances' },
      { path: '/loans', icon: Landmark, label: 'Loans', context: 'finances' },
      { path: '/investments', icon: TrendingUp, label: 'Investments', context: 'finances' },
      { path: '/merchandise', icon: ShoppingBag, label: 'Merchandise', context: 'finances' },
      { path: '/facilities', icon: Factory, label: 'Facilities', context: 'finances' },
      { path: '/manufacturing', icon: Package, label: 'Manufacturing', context: 'finances' },
      { path: '/staff-market', icon: Briefcase, label: 'Staff Market', context: 'finances' },
      { path: '/sponsor-market', icon: Handshake, label: 'Sponsors', context: 'finances' },
    ]
  },
  {
    id: 'personal',
    label: 'Personal Life',
    icon: Heart,
    items: [
      { path: '/personal-life', icon: Heart, label: 'Overview', context: 'personal' },
      { path: '/phone', icon: Smartphone, label: 'Phone', context: 'personal' },
      { path: '/personal-life/wealth', icon: Wallet, label: 'Wealth', context: 'personal' },
      { path: '/personal-life/family', icon: Users, label: 'Family', context: 'personal' },
      { path: '/personal-life/lifestyle', icon: Activity, label: 'Lifestyle', context: 'personal' },
      { path: '/personal-life/social', icon: Star, label: 'Social', context: 'personal' },
    ]
  },
  {
    id: 'media',
    label: 'Media',
    icon: Tv,
    items: [
      { path: '/media', icon: Tv, label: 'Media Hub', context: 'media' },
    ]
  },
]

const systemItems: NavItem[] = [
  { path: '/how-to-play', icon: BookOpen, label: 'How to Play', context: 'home' },
  { path: '/settings', icon: Settings, label: 'AMS2 Settings', context: 'home' },
  { path: '/logs', icon: Terminal, label: 'Debug Logs', context: 'home' },
]

interface SidebarProps {
  onEndDay?: () => void
}

export function Sidebar({ onEndDay }: SidebarProps = {}) {
  const location = useLocation()
  const { setCurrentVideoContext } = useSettingsStore()
  const { player, careerState, hasActiveCareer, getUnreadEmailCount } = useCareerStore()
  const { hasNotifications, getNotificationCount, getNotificationsForScreen } = useNotifications()
  const { addToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Track expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    core: true,
    racing: true,
    business: false,
    personal: false,
    media: true,
  })
  
  // Get unread email count
  const unreadEmailCount = getUnreadEmailCount()

  // Find which group contains the current route and auto-expand it
  const activeGroupId = useMemo(() => {
    for (const group of navGroups) {
      if (group.items.some(item => item.path === location.pathname)) {
        return group.id
      }
    }
    return null
  }, [location.pathname])

  // Auto-expand group containing active route
  useEffect(() => {
    if (activeGroupId && !expandedGroups[activeGroupId]) {
      setExpandedGroups(prev => ({ ...prev, [activeGroupId]: true }))
    }
  }, [activeGroupId])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const handleNavClick = (context: NavItem['context']) => {
    setCurrentVideoContext(context)
  }

  const handleManualSave = async () => {
    if (!hasActiveCareer || isSaving) return
    
    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      // Force save to localStorage/zustand persist
      forceSaveCareer()
      // Also save to native database (Electron)
      await saveToNativeDB()
      
      setSaveSuccess(true)
      addToast({
        type: 'success',
        title: 'Game Saved',
        message: 'Your career has been saved successfully.',
        duration: 2000
      })
      
      // Reset success state after animation
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save your career. Please try again.',
        duration: 3000
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Get notification type color (warning = amber, action = red, info = blue)
  const getNotificationColor = (path: string) => {
    const notifs = getNotificationsForScreen(path)
    if (notifs.length === 0) return ''
    // Use highest priority notification type
    const highestPriority = notifs[0]
    switch (highestPriority.type) {
      case 'warning': return 'bg-status-warning'
      case 'action': return 'bg-accent-red'
      case 'info': return 'bg-status-info'
      default: return 'bg-accent-red'
    }
  }

  // Get total notification count for a group
  const getGroupNotificationCount = (group: NavGroup) => {
    return group.items.reduce((total, item) => {
      if (item.path === '/emails') {
        return total + unreadEmailCount
      }
      return total + getNotificationCount(item.path)
    }, 0)
  }

  // Check if any item in group has notifications
  const groupHasNotifications = (group: NavGroup) => {
    return group.items.some(item => {
      if (item.path === '/emails') return unreadEmailCount > 0
      return hasNotifications(item.path)
    })
  }

  // Render a single nav item
  const renderNavItem = (item: NavItem, isNested: boolean = false) => {
    const isActive = location.pathname === item.path
    const notifCount = getNotificationCount(item.path)
    const hasNotif = hasNotifications(item.path)
    const notifColor = getNotificationColor(item.path)
    
    // Special handling for emails - show unread count
    const isEmailsItem = item.path === '/emails'
    const emailNotifCount = isEmailsItem ? unreadEmailCount : 0
    const hasEmailNotif = isEmailsItem && unreadEmailCount > 0
    
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={() => handleNavClick(item.context)}
        className={clsx(
          'group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
          'hover:bg-surface-secondary',
          isActive && 'bg-surface-secondary',
          isNested && 'ml-3'
        )}
      >
        {isActive && (
          <motion.div
            layoutId="activeNav"
            className="absolute left-0 w-1 h-6 bg-accent-red rounded-r"
            initial={false}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <div className="relative">
          <item.icon 
            className={clsx(
              'w-4 h-4 transition-colors',
              isActive ? 'text-accent-red' : 'text-text-muted group-hover:text-text-secondary'
            )} 
          />
          {/* Notification dot */}
          {(hasNotif || hasEmailNotif) && (
            <span 
              className={clsx(
                'absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse',
                hasEmailNotif ? 'bg-accent-blue' : notifColor
              )}
              title={hasEmailNotif ? `${unreadEmailCount} unread emails` : getNotificationsForScreen(item.path).map(n => n.message).join(', ')}
            />
          )}
        </div>
        <span className={clsx(
          'font-medium text-sm flex-1 transition-colors',
          isActive ? 'text-white' : 'text-text-secondary group-hover:text-white'
        )}>
          {item.label}
        </span>
        {/* Show notification count badge */}
        {(notifCount > 1 || emailNotifCount > 0) && (
          <span className={clsx(
            'px-1.5 py-0.5 text-xs font-bold rounded-full text-white',
            hasEmailNotif ? 'bg-accent-blue' : notifColor
          )}>
            {emailNotifCount > 0 ? emailNotifCount : notifCount}
          </span>
        )}
        <ChevronRight 
          className={clsx(
            'w-3 h-3 transition-all',
            isActive 
              ? 'text-accent-red opacity-100' 
              : 'text-text-muted opacity-0 group-hover:opacity-100'
          )} 
        />
      </NavLink>
    )
  }

  // Render a collapsible group
  const renderNavGroup = (group: NavGroup) => {
    const isExpanded = expandedGroups[group.id]
    const isActiveGroup = activeGroupId === group.id
    const groupNotifCount = getGroupNotificationCount(group)
    const hasGroupNotif = groupHasNotifications(group)
    
    return (
      <div key={group.id} className="mb-1">
        {/* Group Header */}
        <button
          onClick={() => toggleGroup(group.id)}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
            'hover:bg-surface-secondary/50',
            isActiveGroup && 'bg-surface-secondary/30'
          )}
        >
          <div className="relative">
            <group.icon 
              className={clsx(
                'w-4 h-4 transition-colors',
                isActiveGroup ? 'text-accent-red' : 'text-text-muted'
              )} 
            />
            {/* Group notification indicator */}
            {hasGroupNotif && !isExpanded && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent-red animate-pulse" />
            )}
          </div>
          <span className={clsx(
            'font-semibold text-sm flex-1 text-left transition-colors',
            isActiveGroup ? 'text-white' : 'text-text-secondary'
          )}>
            {group.label}
          </span>
          {/* Badge for collapsed group notifications */}
          {groupNotifCount > 0 && !isExpanded && (
            <span className="px-1.5 py-0.5 text-xs font-bold rounded-full text-white bg-accent-red">
              {groupNotifCount}
            </span>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-text-muted" />
          </motion.div>
        </button>
        
        {/* Group Items */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="py-1 space-y-0.5">
                {group.items.map(item => renderNavItem(item, true))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <aside className="w-64 bg-surface/50 backdrop-blur-xl border-r border-surface-border flex flex-col">
      {/* Driver Info + Time Budget Card */}
      {player && (
        <div className="p-3 border-b border-surface-border space-y-3">
          {/* Player Identity Row */}
          <div className="glass-card p-3 racing-stripe">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-red to-accent-orange flex items-center justify-center flex-shrink-0">
                <span className="font-display font-bold text-sm">
                  {player.firstName[0]}{player.lastName[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-xs text-text-secondary">{player.firstName}</p>
                <p className="font-display font-bold text-base -mt-0.5 truncate">{player.lastName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="bg-background/50 rounded px-2 py-1">
                <span className="text-text-muted text-[10px]">Age</span>
                <p className="font-mono font-medium text-xs">{player.age}</p>
              </div>
              <div className="bg-background/50 rounded px-2 py-1">
                <span className="text-text-muted text-[10px]">Rep</span>
                <p className="font-mono font-medium text-xs">{player.reputation.toFixed(1)}</p>
              </div>
            </div>
          </div>

          {/* Day & Time Budget Section */}
          {careerState && (() => {
            const currentDay = careerState.currentDay ?? 1
            const currentWeek = careerState.currentWeek
            const currentYear = careerState.currentYear
            const dayName = getDayName(currentDay)
            const dayBudget = careerState.dayBudget
            const hoursRemaining = dayBudget?.hoursRemaining ?? 16
            const totalHours = dayBudget?.totalHours ?? 16
            const hoursUsed = dayBudget?.hoursUsed ?? 0
            const zone = dayBudget ? calculateFatigueZone(hoursUsed) : 'green'
            const zoneInfo = getFatigueZoneInfo(zone)
            const usedPercent = totalHours > 0 ? (hoursUsed / totalHours) * 100 : 0
            const greenEnd = (TIME_BUDGET_CONFIG.GREEN_ZONE_MAX / totalHours) * 100
            const yellowEnd = (TIME_BUDGET_CONFIG.YELLOW_ZONE_MAX / totalHours) * 100
            
            const zoneColors = {
              green: { bar: 'bg-status-success', text: 'text-status-success', bg: 'bg-status-success/10', border: 'border-status-success/30' },
              yellow: { bar: 'bg-accent-orange', text: 'text-accent-orange', bg: 'bg-accent-orange/10', border: 'border-accent-orange/30' },
              red: { bar: 'bg-accent-red', text: 'text-accent-red', bg: 'bg-accent-red/10', border: 'border-accent-red/30' }
            }
            const colors = zoneColors[zone]
            
            const getBatteryIcon = () => {
              if (hoursRemaining <= 2) return <BatteryLow className="w-3.5 h-3.5 text-accent-red" />
              if (hoursRemaining <= 5) return <BatteryWarning className="w-3.5 h-3.5 text-accent-orange" />
              return <Battery className="w-3.5 h-3.5 text-status-success" />
            }
            
            return (
              <div className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}>
                {/* Day Info Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {currentDay <= 5 ? (
                      <Sun className="w-3.5 h-3.5 text-accent-gold" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-accent-blue" />
                    )}
                    <span className="font-display font-bold text-sm">{dayName}</span>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono">W{currentWeek} · {currentYear}</span>
                </div>
                
                {/* Hours Remaining - Big Number */}
                <div className="flex items-center gap-2 mb-2">
                  {getBatteryIcon()}
                  <span className={`font-mono font-black text-2xl leading-none ${colors.text}`}>
                    {hoursRemaining}h
                  </span>
                  <span className="text-[10px] text-text-muted">/ {totalHours}h</span>
                  <div className="ml-auto">
                    <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                      zone === 'green' ? 'bg-status-success/20 text-status-success' :
                      zone === 'yellow' ? 'bg-accent-orange/20 text-accent-orange' :
                      'bg-accent-red/20 text-accent-red'
                    }`}>
                      <Zap className="w-2.5 h-2.5 inline mr-0.5" />
                      {zoneInfo.label}
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="relative h-2 bg-background/40 rounded-full overflow-hidden mb-2">
                  {/* Zone backgrounds */}
                  <div className="absolute inset-y-0 left-0 bg-status-success/10 rounded-l-full" style={{ width: `${greenEnd}%` }} />
                  <div className="absolute inset-y-0 bg-accent-orange/10" style={{ left: `${greenEnd}%`, width: `${yellowEnd - greenEnd}%` }} />
                  <div className="absolute inset-y-0 right-0 bg-accent-red/10 rounded-r-full" style={{ left: `${yellowEnd}%` }} />
                  {/* Used bar */}
                  <motion.div
                    className={`absolute inset-y-0 left-0 rounded-full ${colors.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${usedPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                  {/* Zone markers */}
                  <div className="absolute inset-y-0 w-px bg-text-muted/30" style={{ left: `${greenEnd}%` }} />
                  <div className="absolute inset-y-0 w-px bg-text-muted/30" style={{ left: `${yellowEnd}%` }} />
                </div>
                
                {/* Fatigue Debt */}
                {dayBudget && dayBudget.fatigueDebt > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-accent-orange mb-2">
                    <Moon className="w-2.5 h-2.5" />
                    <span className="font-mono">-{dayBudget.fatigueDebt}h fatigue debt</span>
                  </div>
                )}
                
                {/* End Day Button */}
                <button
                  onClick={() => onEndDay?.()}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-md font-display font-bold text-sm transition-all ${
                    hoursRemaining <= 0
                      ? 'bg-accent-red text-white hover:bg-accent-red/90 animate-pulse'
                      : 'bg-surface-secondary/80 text-text-primary hover:bg-surface-secondary border border-surface-border/50'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  End Day
                </button>
              </div>
            )
          })()}
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {/* Grouped Navigation */}
        {navGroups.map(group => renderNavGroup(group))}
        
        {/* Separator */}
        <div className="my-3 border-t border-surface-border" />
        
        {/* System Items (not grouped) */}
        <div className="space-y-0.5">
          {systemItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => handleNavClick(item.context)}
                className={clsx(
                  'group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                  'hover:bg-surface-secondary',
                  isActive && 'bg-surface-secondary'
                )}
              >
                <item.icon 
                  className={clsx(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-accent-orange' : 'text-text-muted group-hover:text-text-secondary'
                  )} 
                />
                <span className={clsx(
                  'font-medium text-sm flex-1 transition-colors',
                  isActive ? 'text-white' : 'text-text-secondary group-hover:text-white'
                )}>
                  {item.label}
                </span>
                <ChevronRight 
                  className={clsx(
                    'w-3 h-3 transition-all',
                    isActive 
                      ? 'text-accent-orange opacity-100' 
                      : 'text-text-muted opacity-0 group-hover:opacity-100'
                  )} 
                />
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Manual Save Button */}
      {hasActiveCareer && (
        <div className="px-4 py-2 border-t border-surface-border">
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className={clsx(
              'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200',
              'font-medium text-sm',
              isSaving && 'opacity-50 cursor-not-allowed',
              saveSuccess 
                ? 'bg-status-success/20 text-status-success border border-status-success/30' 
                : 'bg-surface-secondary hover:bg-surface-elevated text-text-secondary hover:text-white border border-surface-border hover:border-accent-orange/50'
            )}
          >
            {isSaving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Save className="w-4 h-4" />
                </motion.div>
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Game</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Season Info */}
      {careerState && (
        <div className="p-4 border-t border-surface-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Season</span>
            <span className="font-mono font-medium">{careerState.currentYear}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-text-muted">Week</span>
            <span className="font-mono font-medium">{careerState.currentWeek}/52</span>
          </div>
          <div className="mt-2 h-1 bg-surface-secondary rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-accent-red to-accent-orange rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(careerState.currentWeek / 52) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}
    </aside>
  )
}
