import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Newspaper,
  Megaphone,
  Wrench,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertCircle,
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { getNewsImage } from '@/utils/generated-assets'

interface FeedItem {
  id: string
  type: 'press' | 'headline' | 'development' | 'event'
  title: string
  source?: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'controversial'
  week: number
  year: number
  imageUrl?: string  // AI-generated image from Nano Banana Pro
}

const typeIcons: Record<FeedItem['type'], React.ReactNode> = {
  press: <Newspaper className="w-3.5 h-3.5" />,
  headline: <Megaphone className="w-3.5 h-3.5" />,
  development: <Wrench className="w-3.5 h-3.5" />,
  event: <Zap className="w-3.5 h-3.5" />,
}

const sentimentIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  positive: { icon: <ThumbsUp className="w-3 h-3" />, color: 'text-status-success' },
  neutral: { icon: <Minus className="w-3 h-3" />, color: 'text-text-muted' },
  negative: { icon: <ThumbsDown className="w-3 h-3" />, color: 'text-status-danger' },
  controversial: { icon: <AlertCircle className="w-3 h-3" />, color: 'text-accent-orange' },
}

export function NewsFeed({ compact = false, maxItems }: { compact?: boolean; maxItems?: number }) {
  const { careerState } = useCareerStore()

  const feedItems = useMemo(() => {
    if (!careerState) return []
    const items: FeedItem[] = []

    // Press clippings
    careerState.pressClippings?.forEach(clip => {
      items.push({
        id: `press-${clip.id}`,
        type: 'press',
        title: clip.headline,
        source: clip.outlet,
        sentiment: clip.sentiment,
        week: clip.week,
        year: clip.year,
        imageUrl: clip.imageDataUrl,
      })
    })

    // Team headlines
    careerState.teamMediaState?.teamHeadlines?.forEach((hl, i) => {
      items.push({
        id: `headline-${i}-${hl.week}-${hl.year}`,
        type: 'headline',
        title: hl.headline,
        sentiment: hl.sentiment || 'neutral',
        week: hl.week,
        year: hl.year,
      })
    })

    // Development events (player team only)
    careerState.developmentEvents?.filter(e => e.isPlayerTeam).forEach(ev => {
      items.push({
        id: `dev-${ev.id}`,
        type: 'development',
        title: ev.title,
        sentiment: ev.type === 'breakthrough' ? 'positive' : ev.type === 'setback' ? 'negative' : 'neutral',
        week: ev.week,
        year: ev.year,
      })
    })

    // Career events (resolved ones)
    careerState.events?.filter(e => e.resolved).forEach(ev => {
      items.push({
        id: `event-${ev.id}`,
        type: 'event',
        title: ev.title,
        sentiment: ev.severity === 'positive' ? 'positive' : ev.severity === 'negative' ? 'negative' : 'neutral',
        week: ev.week,
        year: ev.year,
      })
    })
    
    // Daily briefing news headlines (from the daily briefing system)
    const dailyBriefing = (careerState as any).dailyBriefing
    if (dailyBriefing?.newsHeadlines) {
      dailyBriefing.newsHeadlines.forEach((headline: any) => {
        items.push({
          id: headline.id || `briefing-${items.length}`,
          type: 'headline',
          title: headline.headline,
          source: headline.source,
          sentiment: headline.isAboutPlayer ? 'positive' : 'neutral',
          week: dailyBriefing.generatedForWeek ?? careerState.currentWeek,
          year: careerState.currentYear,
        })
      })
    }

    // Sort by year desc, then week desc. Take most recent 8.
    items.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.week - a.week
    })

    return items.slice(0, maxItems ?? 8)
  }, [careerState])

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-xl border border-surface-border overflow-hidden"
      >
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-surface-border">
          <Newspaper className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-[10px] font-display font-semibold text-text-muted uppercase tracking-wider">News</span>
        </div>
        {feedItems.length === 0 ? (
          <p className="px-3 py-2 text-[10px] text-text-muted">No news yet</p>
        ) : (
          <div className="divide-y divide-border/30">
            {feedItems.map((item, i) => {
              const sentimentInfo = sentimentIcons[item.sentiment] || sentimentIcons.neutral
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.03 }}
                  className="px-3 py-1.5 flex items-center gap-2 hover:bg-surface-secondary/30 transition-colors"
                >
                  <span className={`shrink-0 ${sentimentInfo.color}`}>{sentimentInfo.icon}</span>
                  <p className="text-[11px] text-text-primary truncate flex-1">{item.title}</p>
                  <span className="text-[9px] text-text-muted shrink-0 font-mono">W{item.week}</span>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card>
        <CardHeader
          title="News & Headlines"
          icon={<Newspaper className="w-4 h-4" />}
        />
        <CardContent className="p-0">
          {feedItems.length === 0 ? (
            <div className="p-4">
              <p className="text-sm text-text-muted text-center">No news yet - complete races and activities to generate headlines</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {feedItems.map((item, i) => {
                const sentimentInfo = sentimentIcons[item.sentiment] || sentimentIcons.neutral
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                    className="px-4 py-3 flex items-start gap-3 hover:bg-surface-secondary/30 transition-colors"
                  >
                    {/* News thumbnail - use AI-generated image if available */}
                    <div className="w-10 h-10 rounded-md bg-surface-secondary overflow-hidden shrink-0 mt-0.5">
                      <img
                        src={item.imageUrl || getNewsImage(item.type === 'press' ? 'strategy' : item.type === 'headline' ? 'race-start' : item.type === 'development' ? 'testing' : 'championship')}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.parentElement!.classList.add('flex', 'items-center', 'justify-center', 'text-text-muted')
                          target.parentElement!.innerHTML = '<span class="text-xs">' + (typeIcons[item.type] ? '📰' : '📰') + '</span>'
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary leading-snug">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.source && (
                          <span className="text-[10px] text-text-muted font-medium uppercase tracking-wide">{item.source}</span>
                        )}
                        <span className="text-[10px] text-text-muted">
                          Wk {item.week}, Y{item.year}
                        </span>
                      </div>
                    </div>

                    {/* Sentiment */}
                    <div className={`shrink-0 mt-1 ${sentimentInfo.color}`}>
                      {sentimentInfo.icon}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
