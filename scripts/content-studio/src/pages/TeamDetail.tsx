import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) loadTeam(id)
  }, [id])

  async function loadTeam(teamId: string) {
    setLoading(true)
    try {
      const data = await window.api.loadProfile('teams', teamId)
      setTeam(data)
    } catch (err) {
      console.error('Failed to load team:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="p-8">
        <button onClick={() => navigate(-1)} className="text-blue-400 hover:text-blue-300 mb-4">Back</button>
        <p className="text-gray-400">Team not found.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto overflow-y-auto h-full">
      <button onClick={() => navigate(-1)} className="text-blue-400 hover:text-blue-300 text-sm mb-6 flex items-center gap-1">
        &larr; Back to browser
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{id?.replace('team-', '').replace(/-/g, ' ') || 'Team'}</h1>
        {team.reputation && (
          <p className="text-yellow-400 text-sm mt-1 italic">"{team.reputation}"</p>
        )}
      </div>

      {/* Origin */}
      {team.origin && (
        <Section title="Origin Story">
          <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">{team.origin}</p>
        </Section>
      )}

      {/* Philosophy */}
      {team.philosophy && (
        <Section title="Racing Philosophy">
          <p className="text-gray-300 text-sm">{team.philosophy}</p>
        </Section>
      )}

      {/* Headquarters */}
      {team.headquarters && (
        <Section title="Headquarters">
          <p className="text-gray-300 text-sm">{team.headquarters}</p>
        </Section>
      )}

      {/* Achievements */}
      {team.achievements && team.achievements.length > 0 && (
        <Section title="Notable Achievements">
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
            {team.achievements.map((a: any, i: number) => <li key={i}>{typeof a === 'string' ? a : a.description || a.title || JSON.stringify(a)}</li>)}
          </ul>
        </Section>
      )}

      {/* Team Principal */}
      {team.teamPrincipal && (
        <Section title="Team Principal">
          <div className="bg-surface-2 rounded-lg p-4 border border-surface-3">
            <p className="text-white font-medium">{team.teamPrincipal.name}</p>
            {team.teamPrincipal.nationality && (
              <p className="text-gray-500 text-xs">{team.teamPrincipal.nationality}</p>
            )}
            <p className="text-gray-300 text-sm mt-2">{team.teamPrincipal.background}</p>
          </div>
        </Section>
      )}

      {/* Key Figures */}
      {team.keyFigures && team.keyFigures.length > 0 && (
        <Section title="Key Figures">
          <div className="grid grid-cols-2 gap-3">
            {team.keyFigures.map((fig: any, i: number) => (
              <div key={i} className="bg-surface-2 rounded-lg p-3 border border-surface-3">
                <p className="text-white font-medium text-sm">{fig.name}</p>
                <p className="text-blue-400 text-xs">{fig.role}</p>
                <p className="text-gray-400 text-xs mt-1">{fig.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Fan Base */}
      {team.fanBase && (
        <Section title="Fan Culture">
          <p className="text-gray-300 text-sm">{team.fanBase}</p>
        </Section>
      )}

      {/* Famous Races (tracks) */}
      {team.famousRaces && team.famousRaces.length > 0 && (
        <Section title="Famous Races">
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
            {team.famousRaces.map((r: any, i: number) => <li key={i}>{typeof r === 'string' ? r : r.description || r.title || JSON.stringify(r)}</li>)}
          </ul>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-white mb-3 border-b border-surface-3 pb-2">{title}</h2>
      {children}
    </div>
  )
}
