import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Smile,
  Frown,
  Meh,
  Shield,
  Car,
  FlaskConical,
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { Card } from '@/components/ui'

interface QuickStat {
  id: string
  label: string
  value: string
  subValue?: string
  icon: React.ReactNode
  color: string
  bgColor: string
  path: string
}

function formatCash(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}

function getMoodIcon(mood: number): React.ReactNode {
  if (mood >= 60) return <Smile className="w-4 h-4" />
  if (mood >= 35) return <Meh className="w-4 h-4" />
  return <Frown className="w-4 h-4" />
}

function getMoodColor(mood: number): { color: string; bgColor: string } {
  if (mood >= 70) return { color: 'text-status-success', bgColor: 'bg-status-success/15' }
  if (mood >= 45) return { color: 'text-accent-orange', bgColor: 'bg-accent-orange/15' }
  return { color: 'text-status-danger', bgColor: 'bg-status-danger/15' }
}

export function TeamQuickStats() {
  const navigate = useNavigate()
  const { careerState } = useCareerStore()
  const ownedTeam = careerState?.ownedTeam

  const stats = useMemo(() => {
    if (!careerState) return []
    const items: QuickStat[] = []

    // 1. Cash balance
    if (ownedTeam) {
      const cash = ownedTeam.budgets?.cash ?? ownedTeam.finances?.cash ?? 0
      items.push({
        id: 'cash',
        label: 'Cash',
        value: formatCash(cash),
        icon: <DollarSign className="w-4 h-4" />,
        color: cash > 0 ? 'text-status-success' : 'text-status-danger',
        bgColor: cash > 0 ? 'bg-status-success/15' : 'bg-status-danger/15',
        path: '/finances',
      })
    }

    // 2. Board mood
    if (ownedTeam) {
      const mood = ownedTeam.boardMood ?? 50
      const moodColors = getMoodColor(mood)
      items.push({
        id: 'board',
        label: 'Board',
        value: `${mood}%`,
        icon: getMoodIcon(mood),
        color: moodColors.color,
        bgColor: moodColors.bgColor,
        path: '/finances',
      })
    }

    // 3. Team readiness
    if (ownedTeam) {
      // Quick readiness calc based on staff count, car health, and finances
      const staffCount = (ownedTeam.staff?.length || 0)
      const hasEngineer = ownedTeam.staff?.some(s => s.role === 'chief_engineer' || s.role === 'engineer')
      const hasStrategist = ownedTeam.staff?.some(s => s.role === 'strategist')
      const staffScore = Math.min(100, staffCount * 20 + (hasEngineer ? 20 : 0) + (hasStrategist ? 20 : 0))

      const carCount = careerState.cars?.length || 0
      const avgCarHealth = carCount > 0
        ? careerState.cars!.reduce((sum, c) => {
            const wearValues = c.partWear ? Object.values(c.partWear).filter((v): v is number => typeof v === 'number') : []
            const avgWear = wearValues.length > 0 ? wearValues.reduce((s, w) => s + w, 0) / wearValues.length : 0
            return sum + (100 - avgWear)
          }, 0) / carCount
        : 0

      const readiness = Math.round((staffScore + avgCarHealth) / 2)
      const readyColor = readiness >= 70 ? 'text-status-success' : readiness >= 45 ? 'text-accent-orange' : 'text-status-danger'
      const readyBg = readiness >= 70 ? 'bg-status-success/15' : readiness >= 45 ? 'bg-accent-orange/15' : 'bg-status-danger/15'

      items.push({
        id: 'readiness',
        label: 'Readiness',
        value: `${readiness}%`,
        icon: <Shield className="w-4 h-4" />,
        color: readyColor,
        bgColor: readyBg,
        path: '/garage',
      })
    }

    // 4. Fleet health
    if (careerState.cars?.length) {
      const cars = careerState.cars
      const avgHealth = Math.round(
        cars.reduce((sum, c) => {
          const wearValues = c.partWear ? Object.values(c.partWear).filter((v): v is number => typeof v === 'number') : []
          const avgWear = wearValues.length > 0 ? wearValues.reduce((s, w) => s + w, 0) / wearValues.length : 0
          return sum + (100 - avgWear)
        }, 0) / cars.length
      )
      const fleetColor = avgHealth >= 70 ? 'text-status-success' : avgHealth >= 45 ? 'text-accent-orange' : 'text-status-danger'
      const fleetBg = avgHealth >= 70 ? 'bg-status-success/15' : avgHealth >= 45 ? 'bg-accent-orange/15' : 'bg-status-danger/15'

      items.push({
        id: 'fleet',
        label: 'Fleet',
        value: `${avgHealth}%`,
        subValue: `${cars.length} car${cars.length > 1 ? 's' : ''}`,
        icon: <Car className="w-4 h-4" />,
        color: fleetColor,
        bgColor: fleetBg,
        path: '/garage',
      })
    }

    // 5. Active R&D
    if (careerState.teamDevelopment) {
      const activeResearch = Object.values(careerState.teamDevelopment.areas || {}).reduce(
        (count, area) => count + (area.activeResearch ? 1 : 0), 0
      )
      items.push({
        id: 'rnd',
        label: 'R&D',
        value: `${activeResearch}`,
        subValue: 'active',
        icon: <FlaskConical className="w-4 h-4" />,
        color: activeResearch > 0 ? 'text-accent-cyan' : 'text-text-muted',
        bgColor: activeResearch > 0 ? 'bg-accent-cyan/15' : 'bg-surface-secondary',
        path: '/garage',
      })
    }

    return items
  }, [careerState, ownedTeam])

  if (stats.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className={`grid gap-3 ${
        stats.length <= 3 ? 'grid-cols-3' :
        stats.length === 4 ? 'grid-cols-2 lg:grid-cols-4' :
        'grid-cols-2 lg:grid-cols-5'
      }`}>
        {stats.map((stat, i) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 + i * 0.05 }}
            onClick={() => navigate(stat.path)}
            className="cursor-pointer group"
          >
            <Card className="p-3 hover:border-accent-red/30 transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center ${stat.color} shrink-0`}>
                  {stat.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted font-medium">{stat.label}</div>
                  <div className={`text-lg font-display font-bold ${stat.color} leading-tight`}>{stat.value}</div>
                  {stat.subValue && (
                    <div className="text-[10px] text-text-muted">{stat.subValue}</div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
