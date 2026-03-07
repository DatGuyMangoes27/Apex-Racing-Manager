import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { Card, CardHeader, CardContent } from '@/components/ui'

function getPositionColor(pos: number, dnf: boolean): string {
  if (dnf) return 'bg-status-danger/20 text-status-danger border-status-danger/30'
  if (pos === 1) return 'bg-accent-gold/20 text-accent-gold border-accent-gold/40'
  if (pos === 2) return 'bg-gray-300/20 text-gray-300 border-gray-300/30'
  if (pos === 3) return 'bg-amber-700/20 text-amber-600 border-amber-700/30'
  if (pos <= 5) return 'bg-status-success/15 text-status-success border-status-success/30'
  if (pos <= 10) return 'bg-status-info/15 text-status-info border-status-info/30'
  return 'bg-surface-secondary text-text-secondary border-surface-border'
}

function getPositionLabel(pos: number, dnf: boolean): string {
  if (dnf) return 'DNF'
  return `P${pos}`
}

export function RecentForm({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const { player } = useCareerStore()

  const { results, trend } = useMemo(() => {
    if (!player?.raceHistory?.length) return { results: [], trend: 'neutral' as const }

    const recent = player.raceHistory.slice(-5)

    // Calculate trend: compare average of last 3 vs first 2 (if 5 results)
    let trendDir: 'up' | 'down' | 'neutral' = 'neutral'
    if (recent.length >= 4) {
      const recentAvg = recent.slice(-2).reduce((s, r) => s + (r.dnf ? 20 : r.racePosition), 0) / 2
      const olderAvg = recent.slice(0, 2).reduce((s, r) => s + (r.dnf ? 20 : r.racePosition), 0) / 2
      if (recentAvg < olderAvg - 1) trendDir = 'up'     // Lower position = better
      else if (recentAvg > olderAvg + 1) trendDir = 'down'
    }

    return { results: recent, trend: trendDir }
  }, [player?.raceHistory])

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-status-success' : trend === 'down' ? 'text-status-danger' : 'text-text-muted'
  const trendLabel = trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Steady'

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-3 rounded-xl border border-surface-border"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-[10px] font-display font-semibold text-text-muted uppercase tracking-wider">Form</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendIcon className={`w-3 h-3 ${trendColor}`} />
            <span className={`text-[10px] font-medium ${trendColor}`}>{trendLabel}</span>
          </div>
        </div>
        {results.length === 0 ? (
          <p className="text-[10px] text-text-muted">No races yet</p>
        ) : (
          <div className="flex items-center gap-1.5">
            {results.map((result, i) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                className={`w-9 h-9 rounded-md border font-display font-bold text-[11px] flex items-center justify-center ${getPositionColor(result.racePosition, result.dnf)}`}
              >
                {getPositionLabel(result.racePosition, result.dnf)}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col">
        <CardHeader
          title="Recent Form"
          icon={<BarChart3 className="w-4 h-4" />}
          action={
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/stats') }}
              className="text-xs text-text-muted hover:text-accent-red transition-colors"
            >
              View Stats
            </button>
          }
        />
        <CardContent className="flex-1 flex flex-col justify-center">
          {results.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">No races completed yet</p>
          ) : (
            <>
              {/* Position badges */}
              <div className="flex items-center gap-2 justify-center mb-4">
                {results.map((result, i) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className={`w-11 h-11 rounded-lg border font-display font-bold text-sm flex items-center justify-center ${getPositionColor(result.racePosition, result.dnf)}`}
                    >
                      {getPositionLabel(result.racePosition, result.dnf)}
                    </div>
                    <span className="text-[10px] text-text-muted truncate max-w-[48px]">
                      R{result.round}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Trend indicator */}
              <div className="flex items-center justify-center gap-2">
                <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                <span className={`text-xs font-medium ${trendColor}`}>{trendLabel}</span>
              </div>

              {/* Quick stats row */}
              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border">
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{player?.totalWins || 0}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{player?.totalPodiums || 0}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">Podiums</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-text-primary">{player?.totalPoles || 0}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">Poles</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
