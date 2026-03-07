import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useCareerStore } from '@/store/careerStore'

interface StatColumn {
  id: string
  label: string
  value: number
  best: number
  average: number
}

export function TeamStatsComparisonBars() {
  const { careerState } = useCareerStore()
  const ownedTeam = careerState?.ownedTeam

  const columns = useMemo(() => {
    if (!careerState || !ownedTeam) return []
    const items: StatColumn[] = []

    // 1. Car
    const cars = careerState.cars ?? []
    let carScore = 40
    if (cars.length > 0) {
      const avgHealth = cars.reduce((sum, c) => {
        const wearValues = c.partWear
          ? Object.values(c.partWear).filter((v): v is number => typeof v === 'number')
          : []
        const avgWear = wearValues.length > 0 ? wearValues.reduce((s, w) => s + w, 0) / wearValues.length : 0
        return sum + (100 - avgWear)
      }, 0) / cars.length
      const rndBonus = careerState.teamDevelopment
        ? Object.values(careerState.teamDevelopment.areas || {}).reduce(
            (sum, area: any) => sum + (area.level ?? 0) * 5, 0
          )
        : 0
      carScore = Math.min(100, Math.round((avgHealth * 0.6) + (rndBonus * 0.4) + 10))
    }
    items.push({ id: 'car', label: 'Car', value: carScore, best: Math.min(100, carScore + 20 + Math.round(Math.random() * 10)), average: Math.max(30, carScore - 5) })

    // 2. Drivers
    const drivers = ownedTeam.drivers ?? []
    let driverScore = 0
    if (drivers.length > 0) {
      driverScore = Math.round(
        drivers.reduce((sum: number, d: any) => sum + (d.skills?.overall ?? d.rating ?? 50), 0) / drivers.length
      )
    }
    items.push({ id: 'drivers', label: 'Drivers', value: driverScore, best: Math.min(100, driverScore + 15 + Math.round(Math.random() * 10)), average: Math.max(35, driverScore - 8) })

    // 3. Headquarters
    const facilities = ownedTeam.facilities ?? careerState.facilities
    let facilityScore = 30
    if (facilities) {
      const levels = Object.values(facilities)
        .map((f: any) => typeof f === 'number' ? f : (f?.level ?? 0))
        .filter((v): v is number => typeof v === 'number')
      if (levels.length > 0) {
        facilityScore = Math.min(100, Math.round((levels.reduce((s, l) => s + l, 0) / levels.length) * 20))
      }
    }
    items.push({ id: 'hq', label: 'Headquarters', value: facilityScore, best: Math.min(100, facilityScore + 25 + Math.round(Math.random() * 10)), average: Math.max(25, facilityScore - 3) })

    // 4. Staff
    const staff = ownedTeam.staff ?? []
    const staffCount = staff.length
    const avgStaffRating = staffCount > 0
      ? staff.reduce((sum: number, s: any) => sum + (s.skills?.overall ?? s.rating ?? 50), 0) / staffCount
      : 0
    const staffScore = Math.min(100, Math.round(staffCount * 8 + avgStaffRating * 0.4))
    items.push({ id: 'staff', label: 'Staff', value: staffScore, best: Math.min(100, staffScore + 20 + Math.round(Math.random() * 10)), average: Math.max(30, staffScore - 5) })

    // 5. Sponsors
    const sponsors = careerState.sponsors ?? ownedTeam.sponsors ?? []
    const sponsorScore = Math.min(100, sponsors.length * 20 + 10)
    items.push({ id: 'sponsors', label: 'Sponsors', value: sponsorScore, best: Math.min(100, sponsorScore + 25 + Math.round(Math.random() * 10)), average: Math.max(30, sponsorScore - 8) })

    // 6. Pit Crew
    let pitCrewScore = 0
    if (cars.length > 0) {
      pitCrewScore = Math.round(
        cars.reduce((sum, c) => {
          const wearValues = c.partWear
            ? Object.values(c.partWear).filter((v): v is number => typeof v === 'number')
            : []
          const avgWear = wearValues.length > 0 ? wearValues.reduce((s, w) => s + w, 0) / wearValues.length : 0
          return sum + (100 - avgWear)
        }, 0) / cars.length
      )
    }
    items.push({ id: 'pitcrew', label: 'Pit Crew', value: pitCrewScore, best: Math.min(100, pitCrewScore + 15 + Math.round(Math.random() * 10)), average: Math.max(40, pitCrewScore - 5) })

    return items
  }, [careerState, ownedTeam])

  if (columns.length === 0) return null

  const barMaxH = 170

  return (
    <div
      className="rounded overflow-hidden p-5"
      style={{ background: 'linear-gradient(to bottom, #374354, #2a3442)' }}
    >
      {/* Header */}
      <h3
        className="text-sm font-bold uppercase tracking-[0.15em] text-center mb-1"
        style={{ color: '#d4dae3', fontFamily: 'Rajdhani, sans-serif' }}
      >
        Team Stats
      </h3>

      {/* Legend */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-1.5">
          <svg width="8" height="10" viewBox="0 0 8 10" className="shrink-0">
            <polygon points="0,5 8,0 8,10" fill="#E10600" />
          </svg>
          <span className="text-[10px] font-medium" style={{ color: '#7a8a9a' }}>Best in Championship</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium" style={{ color: '#7a8a9a' }}>Average on Grid</span>
          <svg width="8" height="10" viewBox="0 0 8 10" className="shrink-0">
            <polygon points="8,5 0,0 0,10" fill="#6B6B6B" opacity="0.5" />
          </svg>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-2.5" style={{ height: `${barMaxH}px` }}>
        {columns.map((col, i) => {
          const barH = Math.max(8, (col.value / 100) * barMaxH)
          const bestY = barMaxH - (col.best / 100) * barMaxH
          const avgY = barMaxH - (col.average / 100) * barMaxH

          return (
            <div key={col.id} className="flex-1 flex flex-col items-center min-w-0">
              <div className="relative w-full flex justify-center" style={{ height: `${barMaxH}px` }}>
                {/* Bar background track */}
                <div
                  className="w-10 rounded-t absolute bottom-0 h-full"
                  style={{ background: 'rgba(30, 42, 56, 0.6)' }}
                />

                {/* Animated bar — MM3 green gradient */}
                <motion.div
                  className="w-10 rounded-t absolute bottom-0 overflow-hidden"
                  initial={{ height: 0 }}
                  animate={{ height: barH }}
                  transition={{ duration: 0.7, delay: 0.15 + i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <div
                    className="absolute inset-0 rounded-t"
                    style={{
                      background: `linear-gradient(to top, #2d8a4e, #4cb868 40%, #7dd89a)`,
                    }}
                  />
                  {/* Inner highlight */}
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t" style={{ background: 'rgba(255,255,255,0.2)' }} />
                  {/* Depth shadow */}
                  <div className="absolute inset-0" style={{ boxShadow: 'inset -3px 0 6px rgba(0,0,0,0.2)' }} />
                </motion.div>

                {/* Best marker — red triangle (left side) */}
                <motion.div
                  className="absolute left-0"
                  style={{ top: `${bestY - 5}px` }}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 + i * 0.05 }}
                >
                  <svg width="8" height="10" viewBox="0 0 8 10">
                    <polygon points="0,0 0,10 8,5" fill="#E10600" />
                  </svg>
                </motion.div>

                {/* Average marker — gray triangle (right side) */}
                <motion.div
                  className="absolute right-0"
                  style={{ top: `${avgY - 5}px` }}
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.9 + i * 0.05 }}
                >
                  <svg width="8" height="10" viewBox="0 0 8 10">
                    <polygon points="8,0 8,10 0,5" fill="#6B6B6B" opacity="0.5" />
                  </svg>
                </motion.div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between gap-2.5 mt-3 pt-3" style={{ borderTop: '1px solid #3a4a5e' }}>
        {columns.map((col) => (
          <div key={col.id} className="flex-1 text-center min-w-0">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider leading-tight block"
              style={{ color: '#7a8a9a', fontFamily: 'Rajdhani, sans-serif' }}
            >
              {col.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
