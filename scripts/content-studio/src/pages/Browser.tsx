import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = [
  { id: 'drivers', label: 'Drivers' },
  { id: 'teams', label: 'Teams' },
  { id: 'tracks', label: 'Tracks' },
  { id: 'staff', label: 'Staff' },
  { id: 'partners', label: 'Partners' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'prerace', label: 'Pre-Race' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'misc', label: 'Miscellaneous' },
]

export default function Browser() {
  const [activeCategory, setActiveCategory] = useState('drivers')
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadProfiles(activeCategory)
  }, [activeCategory])

  async function loadProfiles(category: string) {
    setLoading(true)
    try {
      const data = await window.api.listGeneratedProfiles(category)
      setProfiles(data || [])
    } catch (err) {
      console.error('Failed to load profiles:', err)
      setProfiles([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = search
    ? profiles.filter(p => {
        const name = (p.name || p.teamPrincipal?.name || p.id || '').toLowerCase()
        const bio = (p.bio || p.biography || p.origin || '').toLowerCase()
        const q = search.toLowerCase()
        return name.includes(q) || bio.includes(q)
      })
    : profiles

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-48 bg-surface-1 border-r border-surface-2 p-3 space-y-1">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Categories</h2>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id)
              setSearch('')
            }}
            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
              activeCategory === cat.id
                ? 'bg-blue-600/20 text-blue-400 font-medium'
                : 'text-gray-400 hover:bg-surface-2 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {CATEGORIES.find(c => c.id === activeCategory)?.label || 'Browse'}
            </h1>
            <p className="text-gray-500 text-sm">{filtered.length} profiles loaded</p>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="px-4 py-2 bg-surface-2 border border-surface-3 rounded-lg text-white text-sm w-64 focus:outline-none focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p className="text-lg">No profiles yet</p>
            <p className="text-sm mt-1">Run generation to create content</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                category={activeCategory}
                onClick={() => {
                  if (activeCategory === 'teams') {
                    navigate(`/team/${profile.id}`)
                  } else {
                    navigate(`/profile/${activeCategory}/${profile.id}`)
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileCard({ profile, category, onClick }: { profile: any; category: string; onClick: () => void }) {
  const name = profile.name || profile.teamPrincipal?.name || profile.id
  const subtitle = profile.nationality
    ? `${profile.nationality}, ${profile.age || '?'}`
    : profile.country || profile.contactType?.replace(/_/g, ' ') || ''
  const snippet = profile.bio || profile.biography || profile.origin || profile.history || ''
  const truncated = snippet.length > 150 ? snippet.slice(0, 150) + '...' : snippet

  return (
    <button
      onClick={onClick}
      className="bg-surface-2 rounded-lg border border-surface-3 hover:border-blue-500/50 transition-colors text-left p-4 flex gap-4"
    >
      {/* Portrait placeholder */}
      <div className="w-16 h-16 rounded-lg bg-surface-3 flex-shrink-0 flex items-center justify-center overflow-hidden">
        {profile.hasImage ? (
          <img
            src={`file://${profile.imagePath}`}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <span className="text-gray-600 text-2xl">
            {category === 'teams' ? 'T' : category === 'tracks' ? 'C' : '?'}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm truncate">{name}</p>
        <p className="text-gray-500 text-xs">{subtitle}</p>
        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{truncated}</p>
      </div>
    </button>
  )
}
