import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCareerStore } from '@/store/careerStore'
import { getTeamLogo } from '@/utils/generated-assets'

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/home':           { title: 'HOME',         subtitle: 'The central hub, with an overview of your entire operation.' },
  '/personal-life':  { title: 'PLAYER',       subtitle: 'Manage your personal life, lifestyle and wellbeing.' },
  '/emails':         { title: 'MAIL',         subtitle: 'Read and respond to emails from contacts and staff.' },
  '/garage':         { title: 'CAR',          subtitle: 'Design parts, manage liveries and configure your cars.' },
  '/facilities':     { title: 'HEADQUARTERS', subtitle: 'Upgrade and manage your team facilities.' },
  '/finances':       { title: 'TEAM',         subtitle: 'Manage your team finances, budgets and contracts.' },
  '/race-day':       { title: 'RACE DAY',     subtitle: 'Manage your drivers and strategy during the race.' },
  '/staff-market':   { title: 'STAFF',        subtitle: 'Hire and manage your team personnel.' },
  '/scouting':       { title: 'SCOUTING',     subtitle: 'Scout new talent and evaluate potential signings.' },
  '/sponsor-market': { title: 'SPONSORS',     subtitle: 'Find and negotiate sponsorship deals.' },
  '/media':          { title: 'MEDIA',        subtitle: 'Manage your media presence and public relations.' },
  '/manufacturing':  { title: 'PIT CREW',     subtitle: 'Manufacturing and logistics operations.' },
  '/paddock':        { title: 'STANDINGS',    subtitle: 'Championship standings, teams and drivers.' },
  '/calendar':       { title: 'CALENDAR',     subtitle: 'View your schedule and plan activities.' },
  '/settings':       { title: 'SETTINGS',     subtitle: 'Configure game options and preferences.' },
  '/stats':          { title: 'STATS',        subtitle: 'Performance statistics and analytics.' },
}

function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`
}

export function DayContextBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { careerState } = useCareerStore()

  const pageMeta = useMemo(() => {
    const path = location.pathname
    return PAGE_META[path] ?? { title: path.replace('/', '').toUpperCase() || 'HOME', subtitle: '' }
  }, [location.pathname])

  const balance = careerState?.ownedTeam?.budgets?.cash ?? 0
  const teamLogoId = careerState?.ownedTeam?.logoId ?? ''
  const teamName = careerState?.ownedTeam?.name ?? ''

  if (!careerState) return null

  return (
    <div className="h-14 bg-surface/80 backdrop-blur-sm border-b border-surface-border flex items-center px-5 shrink-0 z-10">
      {/* Left: Team logo + Page title + subtitle — matches MM layout */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Team logo */}
        <div className="w-28 h-10 flex items-center justify-center shrink-0">
          <img
            src={getTeamLogo(teamLogoId)}
            alt={teamName}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.parentElement!.innerHTML = `<span class="text-sm font-display font-bold text-text-primary">${teamName}</span>`
            }}
          />
        </div>

        {/* Page title + subtitle */}
        <div className="flex flex-col min-w-0">
          <h1 className="text-lg font-display font-black text-text-primary tracking-wide leading-tight">
            {pageMeta.title}
          </h1>
          {pageMeta.subtitle && (
            <p className="text-[11px] text-text-muted truncate leading-tight">
              {pageMeta.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Balance pill — dark rounded like MM */}
      <button
        onClick={() => navigate('/finances')}
        className="flex items-center gap-2 px-5 py-2 rounded-full bg-surface-secondary/80 border border-surface-border hover:bg-surface-secondary transition-colors shrink-0"
      >
        <span className="text-xs text-text-muted font-medium uppercase tracking-wide">Balance</span>
        <span className={`text-sm font-display font-bold ${balance >= 0 ? 'text-text-primary' : 'text-accent-red'}`}>
          {formatCurrency(balance)}
        </span>
      </button>
    </div>
  )
}
