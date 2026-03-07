import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

// Safely render any value - handles objects returned by Gemini
function safeRender(val: any): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (typeof val === 'object') {
    // Common object patterns from Gemini
    if (val.name && val.reason) return `${val.name}: ${val.reason}`
    if (val.driver && val.reason) return `${val.driver}: ${val.reason}`
    if (val.name && val.description) return `${val.name}: ${val.description}`
    if (val.title && val.description) return `${val.title}: ${val.description}`
    // Fallback: join all string values
    const vals = Object.values(val).filter(v => typeof v === 'string')
    if (vals.length > 0) return vals.join(' - ')
    return JSON.stringify(val)
  }
  return String(val)
}

export default function ProfileDetail() {
  const { category, id } = useParams<{ category: string; id: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (category && id) {
      loadProfile(category, id)
    }
  }, [category, id])

  async function loadProfile(cat: string, profileId: string) {
    setLoading(true)
    try {
      const data = await window.api.loadProfile(cat, profileId)
      setProfile(data)
    } catch (err) {
      console.error('Failed to load profile:', err)
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

  if (!profile) {
    return (
      <div className="p-8">
        <button onClick={() => navigate(-1)} className="text-blue-400 hover:text-blue-300 mb-4">Back</button>
        <p className="text-gray-400">Profile not found.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto overflow-y-auto h-full">
      <button onClick={() => navigate(-1)} className="text-blue-400 hover:text-blue-300 text-sm mb-6 flex items-center gap-1">
        &larr; Back to browser
      </button>

      {/* Header */}
      <div className="flex gap-6 mb-8">
        {/* Portrait */}
        <div className="w-32 h-32 rounded-xl bg-surface-2 border border-surface-3 flex-shrink-0 overflow-hidden">
          {profile.hasImage ? (
            <img
              src={`file://${profile.imagePath}`}
              alt={profile.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">?</div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white">{profile.name || id}</h1>
          <div className="flex gap-4 mt-2 text-gray-400 text-sm">
            {profile.nationality && <span>{profile.nationality}</span>}
            {profile.age && <span>Age {profile.age}</span>}
            {profile.gender && <span className="capitalize">{profile.gender}</span>}
            {profile.role && <span className="text-blue-400">{profile.role.replace(/_/g, ' ')}</span>}
            {profile.contactType && <span className="text-purple-400">{profile.contactType.replace(/_/g, ' ')}</span>}
            {profile.career && <span className="text-green-400">{profile.career.replace(/_/g, ' ')}</span>}
          </div>
          {profile.nickname && (
            <p className="text-yellow-400 text-sm mt-1">"{profile.nickname}"</p>
          )}
        </div>
      </div>

      {/* Physical Description */}
      {profile.physical && (
        <Section title="Physical Appearance">
          <div className="grid grid-cols-5 gap-3">
            {profile.physical.skinTone && <Detail label="Skin" value={profile.physical.skinTone} />}
            {profile.physical.hairColor && <Detail label="Hair" value={`${profile.physical.hairColor} ${profile.physical.hairStyle || ''}`} />}
            {profile.physical.eyeColor && <Detail label="Eyes" value={profile.physical.eyeColor} />}
            {profile.physical.facialHair && <Detail label="Facial Hair" value={profile.physical.facialHair} />}
          </div>
          {profile.physical.description && (
            <p className="text-gray-300 text-sm mt-3">{profile.physical.description}</p>
          )}
        </Section>
      )}

      {/* Bio / Biography */}
      {(profile.bio || profile.biography) && (
        <Section title="Biography">
          <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">{profile.bio || profile.biography}</p>
        </Section>
      )}

      {/* Driving Style (drivers) */}
      {profile.drivingStyle && (
        <Section title="Driving Style">
          <p className="text-gray-300 text-sm">{profile.drivingStyle}</p>
        </Section>
      )}

      {/* Career Highlights */}
      {profile.careerHighlight && (
        <Section title="Career Highlight">
          <p className="text-green-300 text-sm">{profile.careerHighlight}</p>
          {profile.careerLowPoint && (
            <p className="text-red-300 text-sm mt-2"><strong>Low point:</strong> {profile.careerLowPoint}</p>
          )}
        </Section>
      )}

      {/* Famous Quote */}
      {profile.famousQuote && (
        <Section title="Famous Quote">
          <blockquote className="text-gray-300 text-sm italic border-l-2 border-yellow-500 pl-4">{profile.famousQuote}</blockquote>
        </Section>
      )}

      {/* Quirks */}
      {profile.quirks && profile.quirks.length > 0 && (
        <Section title="Quirks">
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
            {profile.quirks.map((q: any, i: number) => <li key={i}>{safeRender(q)}</li>)}
          </ul>
        </Section>
      )}

      {/* Rivalries */}
      {profile.rivalries && profile.rivalries.length > 0 && (
        <Section title="Rivalries">
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
            {profile.rivalries.map((r: any, i: number) => (
              <li key={i}>{typeof r === 'string' ? r : `${r.driver || r.name || ''}: ${r.reason || r.description || JSON.stringify(r)}`}</li>
            ))}
          </ul>
        </Section>
      )}

      {/* Traits */}
      {profile.traits && (
        <Section title="Personality Traits">
          <div className="flex gap-2 flex-wrap">
            {(Array.isArray(profile.traits) ? profile.traits : [profile.traits]).map((t: any, i: number) => (
              <span key={i} className="px-2 py-1 bg-surface-3 rounded text-xs text-gray-300">{safeRender(t)}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <Section title="Interests">
          <div className="flex gap-2 flex-wrap">
            {profile.interests.map((interest: any, i: number) => (
              <span key={i} className="px-2 py-1 bg-surface-3 rounded text-xs text-blue-300">{safeRender(interest)}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Desires (partners) */}
      {profile.desires && (
        <Section title="Desires & Expectations">
          <div className="grid grid-cols-2 gap-2">
            <Detail label="Wants Marriage" value={profile.desires.wantsMarriage ? 'Yes' : 'No'} />
            <Detail label="Wants Children" value={profile.desires.wantsChildren ? `Yes (${profile.desires.desiredChildrenCount})` : 'No'} />
            <Detail label="Lifestyle" value={profile.desires.lifestyleExpectations} />
            <Detail label="Love Language" value={profile.loveLanguage || 'N/A'} />
          </div>
        </Section>
      )}

      {/* Contact-specific */}
      {profile.connectionToMotorsport && (
        <Section title="Connection to Motorsport">
          <p className="text-gray-300 text-sm">{profile.connectionToMotorsport}</p>
        </Section>
      )}

      {profile.canHelp && profile.canHelp.length > 0 && (
        <Section title="How They Can Help">
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
            {profile.canHelp.map((h: any, i: number) => <li key={i}>{safeRender(h)}</li>)}
          </ul>
        </Section>
      )}

      {/* Meeting Context */}
      {profile.meetingContext && (
        <Section title="How You Meet">
          <p className="text-gray-300 text-sm">{profile.meetingContext}</p>
        </Section>
      )}

      {profile.firstImpression && (
        <Section title="First Impression">
          <p className="text-gray-300 text-sm italic">{profile.firstImpression}</p>
        </Section>
      )}

      {/* Deal Breakers (partners) */}
      {profile.dealBreakers && (
        <Section title="Deal Breakers">
          <ul className="list-disc list-inside text-red-300 text-sm space-y-1">
            {profile.dealBreakers.map((d: any, i: number) => <li key={i}>{safeRender(d)}</li>)}
          </ul>
        </Section>
      )}

      {/* Skills (staff) */}
      {profile.skills && typeof profile.skills === 'object' && (
        <Section title="Skills">
          <div className="space-y-2">
            {Object.entries(profile.skills).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-gray-400 text-xs w-24 capitalize">{key}</span>
                <div className="flex-1 bg-surface-1 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${val as number}%` }} />
                </div>
                <span className="text-gray-300 text-xs w-8">{val as number}</span>
              </div>
            ))}
          </div>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-gray-300 text-sm capitalize">{value}</p>
    </div>
  )
}
