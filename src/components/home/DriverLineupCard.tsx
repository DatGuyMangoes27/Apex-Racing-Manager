import { useMemo } from 'react'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import { getDriverPortrait } from '@/utils/generated-assets'

const COUNTRY_FLAGS: Record<string, string> = {
  'Brazil': '\u{1F1E7}\u{1F1F7}', 'Germany': '\u{1F1E9}\u{1F1EA}', 'UK': '\u{1F1EC}\u{1F1E7}', 'England': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  'Belgium': '\u{1F1E7}\u{1F1EA}', 'Italy': '\u{1F1EE}\u{1F1F9}', 'Australia': '\u{1F1E6}\u{1F1FA}', 'Japan': '\u{1F1EF}\u{1F1F5}',
  'USA': '\u{1F1FA}\u{1F1F8}', 'France': '\u{1F1EB}\u{1F1F7}', 'Spain': '\u{1F1EA}\u{1F1F8}', 'Austria': '\u{1F1E6}\u{1F1F9}',
  'Netherlands': '\u{1F1F3}\u{1F1F1}', 'Portugal': '\u{1F1F5}\u{1F1F9}', 'Canada': '\u{1F1E8}\u{1F1E6}',
  'Argentina': '\u{1F1E6}\u{1F1F7}', 'Mexico': '\u{1F1F2}\u{1F1FD}', 'China': '\u{1F1E8}\u{1F1F3}', 'South Africa': '\u{1F1FF}\u{1F1E6}',
  'Sweden': '\u{1F1F8}\u{1F1EA}', 'Finland': '\u{1F1EB}\u{1F1EE}', 'Denmark': '\u{1F1E9}\u{1F1F0}', 'Norway': '\u{1F1F3}\u{1F1F4}',
  'Malaysia': '\u{1F1F2}\u{1F1FE}', 'Singapore': '\u{1F1F8}\u{1F1EC}', 'New Zealand': '\u{1F1F3}\u{1F1FF}',
}

export function DriverLineupCard() {
  const { player, careerState } = useCareerStore()
  const { getStandings } = useRivalStore()

  const drivers = useMemo(() => {
    if (!careerState?.ownedTeam) return []

    const resolvedSeriesId = player?.currentSeriesId || careerState.seriesEntries?.[0]?.seriesId
    const standings = resolvedSeriesId ? getStandings(resolvedSeriesId) : null
    const driverStandings = standings?.driverStandings ?? []

    const hiredDrivers = careerState.ownedTeam.drivers ?? []
    return hiredDrivers.map((d: any) => {
      const standing = driverStandings.find(
        (s: any) => s.driverName === d.name || s.driverId === d.id || s.driverId === d.rivalId
      )
      return {
        id: d.id || d.rivalId || d.name,
        name: d.name || `${d.firstName} ${d.lastName}`,
        shortName: d.shortName || d.name || d.lastName,
        nationality: d.nationality || '',
        position: standing?.position ?? null,
        portrait: d.portraitId || d.name || '',
      }
    })
  }, [careerState, player, getStandings])

  if (drivers.length === 0) return null

  return (
    <div className="bg-surface-elevated rounded-lg border border-surface-border p-4">
      {/* Side by side drivers like MM - circular portraits */}
      <div className="flex items-start justify-around gap-4">
        {drivers.map((driver: any) => {
          const flag = COUNTRY_FLAGS[driver.nationality] || ''
          return (
            <div key={driver.id} className="flex flex-col items-center text-center">
              {/* Circular portrait - large like MM */}
              <div className="w-20 h-20 rounded-full bg-surface-secondary overflow-hidden border-2 border-surface-border mb-2">
                <img
                  src={getDriverPortrait(driver.portrait, driver.nationality)}
                  alt={driver.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.classList.add('flex', 'items-center', 'justify-center')
                    target.parentElement!.innerHTML = `<span class="text-lg font-bold text-text-muted">${driver.shortName?.slice(0, 2) || '??'}</span>`
                  }}
                />
              </div>
              {/* Flag + Name + Position in one line like MM */}
              <div className="flex items-center gap-1.5">
                {flag && <span className="text-base">{flag}</span>}
                <span className="text-sm font-display font-bold text-text-primary">{driver.shortName || driver.name}</span>
                {driver.position !== null && (
                  <span className="text-sm text-text-muted font-medium">{driver.position}{getOrdinal(driver.position)}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
