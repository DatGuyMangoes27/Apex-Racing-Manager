import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Car } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import { getTeamLogo, getDriverPortrait } from '@/utils/generated-assets'
import { getClassLiveriesFromManifest } from '@/utils/images'

const COUNTRY_FLAGS: Record<string, string> = {
  'Brazil': '\u{1F1E7}\u{1F1F7}', 'Germany': '\u{1F1E9}\u{1F1EA}', 'UK': '\u{1F1EC}\u{1F1E7}', 'England': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  'Belgium': '\u{1F1E7}\u{1F1EA}', 'Italy': '\u{1F1EE}\u{1F1F9}', 'Australia': '\u{1F1E6}\u{1F1FA}', 'Japan': '\u{1F1EF}\u{1F1F5}',
  'USA': '\u{1F1FA}\u{1F1F8}', 'France': '\u{1F1EB}\u{1F1F7}', 'Spain': '\u{1F1EA}\u{1F1F8}', 'Austria': '\u{1F1E6}\u{1F1F9}',
  'Netherlands': '\u{1F1F3}\u{1F1F1}', 'Portugal': '\u{1F1F5}\u{1F1F9}', 'Canada': '\u{1F1E8}\u{1F1E6}',
  'Argentina': '\u{1F1E6}\u{1F1F7}', 'Mexico': '\u{1F1F2}\u{1F1FD}', 'China': '\u{1F1E8}\u{1F1F3}', 'South Africa': '\u{1F1FF}\u{1F1E6}',
  'Sweden': '\u{1F1F8}\u{1F1EA}', 'Finland': '\u{1F1EB}\u{1F1EE}', 'Denmark': '\u{1F1E9}\u{1F1F0}', 'Norway': '\u{1F1F3}\u{1F1F4}',
  'Malaysia': '\u{1F1F2}\u{1F1FE}', 'Singapore': '\u{1F1F8}\u{1F1EC}', 'New Zealand': '\u{1F1F3}\u{1F1FF}',
  'Hungary': '\u{1F1ED}\u{1F1FA}', 'Czech Republic': '\u{1F1E8}\u{1F1FF}', 'Monaco': '\u{1F1F2}\u{1F1E8}',
  'Thailand': '\u{1F1F9}\u{1F1ED}', 'Colombia': '\u{1F1E8}\u{1F1F4}', 'India': '\u{1F1EE}\u{1F1F3}',
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

export function TeamIdentityCard() {
  const { player, careerState } = useCareerStore()
  const { getSeriesById, getStandings } = useRivalStore()

  const data = useMemo(() => {
    if (!careerState) return null
    const teamName = careerState.ownedTeam?.name ?? 'My Team'
    const teamLogoId = careerState.ownedTeam?.logoId ?? ''
    const resolvedSeriesId = player?.currentSeriesId || careerState.seriesEntries?.[0]?.seriesId
    const series = resolvedSeriesId ? getSeriesById(resolvedSeriesId) : null
    const seriesName = series?.shortName || series?.name || 'No Series'

    const cars = careerState.cars ?? []
    const ownerCar = cars.find((c: any) => c.driverType === 'owner') || cars[0]
    let carImagePath = ownerCar?.liveryPath || null
    const carLiveryName = ownerCar?.liveryName || null

    if (!carImagePath && ownerCar?.chassisId) {
      const classLiveries = getClassLiveriesFromManifest(ownerCar.chassisId)
      if (classLiveries.length > 0) carImagePath = classLiveries[0]
    }

    const standings = resolvedSeriesId ? getStandings(resolvedSeriesId) : null
    const driverStandings = standings?.driverStandings ?? []
    const hiredDrivers = careerState.ownedTeam?.drivers ?? []
    const drivers = hiredDrivers.map((d: any) => {
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

    return { teamName, teamLogoId, seriesName, carImagePath, carLiveryName, drivers }
  }, [careerState, player, getSeriesById, getStandings])

  if (!data) return null

  return (
    <div
      className="rounded overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(to bottom, #374354, #2a3442, #263040)' }}
    >
      {/* Team Logo + Series Name */}
      <div className="flex flex-col items-center pt-5 pb-3 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-56 h-16 flex items-center justify-center mb-2"
        >
          <img
            src={getTeamLogo(data.teamLogoId)}
            alt={data.teamName}
            className="max-w-full max-h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.parentElement!.innerHTML = `<span style="font-family: Rajdhani, sans-serif; font-weight: 800; font-size: 1.5rem; color: #d4dae3; letter-spacing: 0.05em;">${data.teamName}</span>`
            }}
          />
        </motion.div>
        <span
          className="text-[11px] uppercase tracking-[0.2em] font-semibold"
          style={{ color: '#8a9ab0', fontFamily: 'Rajdhani, sans-serif' }}
        >
          {data.seriesName}
        </span>
      </div>

      {/* Driver Portraits — side by side with flags + positions */}
      {data.drivers.length > 0 && (
        <div className="flex items-center justify-center gap-8 px-4 py-3">
          {data.drivers.map((driver, i) => {
            const flag = COUNTRY_FLAGS[driver.nationality] || ''
            return (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, x: i === 0 ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex flex-col items-center gap-1.5"
              >
                {/* Portrait circle */}
                <div
                  className="w-16 h-16 rounded-full overflow-hidden"
                  style={{
                    border: '2px solid #4a5a6e',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  }}
                >
                  <img
                    src={getDriverPortrait(driver.portrait, driver.nationality)}
                    alt={driver.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.parentElement!.classList.add('flex', 'items-center', 'justify-center')
                      target.parentElement!.style.background = '#3a4a5e'
                      target.parentElement!.innerHTML = `<span style="font-size: 0.7rem; font-weight: 700; color: #8a9ab0;">${driver.shortName?.slice(0, 2) || '??'}</span>`
                    }}
                  />
                </div>

                {/* Name + position */}
                <div className="flex items-center gap-1.5">
                  {flag && <span className="text-sm">{flag}</span>}
                  <span
                    className="text-xs font-bold"
                    style={{ color: '#c8d0dc', fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    {driver.shortName || driver.name}
                  </span>
                  {driver.position !== null && (
                    <span
                      className="text-xs font-bold"
                      style={{ color: '#8a9ab0', fontFamily: 'Rajdhani, sans-serif' }}
                    >
                      {driver.position}{getOrdinal(driver.position)}
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Car Livery — full bleed with vignettes */}
      <div className="relative h-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#263040] z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#2a3442]/60 z-10" />
        {data.carImagePath ? (
          <motion.img
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            src={data.carImagePath}
            alt={data.carLiveryName || 'Team car'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: '#1e2a38' }}>
            <Car className="w-16 h-16" style={{ color: '#3a4a5e' }} />
          </div>
        )}
      </div>
    </div>
  )
}
