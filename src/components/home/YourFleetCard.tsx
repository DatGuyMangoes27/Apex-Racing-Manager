/**
 * YourFleetCard — Figma-inspired 3-car fleet display
 * Shows car image, name, overall rating, and status (Ready/Maint).
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Car, ChevronRight } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'

export function YourFleetCard() {
  const navigate = useNavigate()
  const { careerState } = useCareerStore()

  const fleet = useMemo(() => {
    if (!careerState?.cars) return []
    return careerState.cars.slice(0, 3).map(car => {
      const wearValues = car.partWear
        ? Object.values(car.partWear).filter((v): v is number => typeof v === 'number')
        : []
      const avgWear = wearValues.length > 0
        ? wearValues.reduce((s, w) => s + w, 0) / wearValues.length
        : 0
      const health = Math.round(100 - avgWear)
      const needsMaint = health < 60

      return {
        id: car.id || car.name,
        name: car.name || car.model || 'Unknown',
        health,
        needsMaint,
        status: needsMaint ? 'MAINT' : 'READY',
      }
    })
  }, [careerState])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border-2 border-black/80 bg-white/[0.08] backdrop-blur-sm shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black/80">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-slate-300" />
          <span className="font-display font-black text-sm text-white tracking-tight">
            YOUR FLEET
          </span>
        </div>
        <button
          onClick={() => navigate('/garage')}
          className="flex items-center gap-0.5 text-[10px] font-display font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
        >
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Fleet grid */}
      <div className="p-3 flex gap-2">
        {fleet.length === 0 ? (
          <div className="flex-1 py-8 text-center">
            <Car className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No cars in fleet</p>
          </div>
        ) : (
          fleet.map((car, i) => (
            <motion.button
              key={car.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06 }}
              onClick={() => navigate('/garage')}
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] overflow-hidden hover:bg-white/[0.06] transition-colors group"
            >
              {/* Car image placeholder */}
              <div className="h-[90px] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
                <Car className="w-10 h-10 text-slate-700 group-hover:text-slate-600 transition-colors" />
              </div>

              {/* Car info */}
              <div className="p-2 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-display font-bold text-white uppercase tracking-wider truncate max-w-[80px]">
                    {car.name}
                  </p>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${
                    car.needsMaint ? 'text-orange-400' : 'text-emerald-400'
                  }`}>
                    {car.status}
                  </span>
                </div>
                <span className="font-display font-black text-2xl text-white leading-none">
                  {car.health}
                </span>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </motion.div>
  )
}
