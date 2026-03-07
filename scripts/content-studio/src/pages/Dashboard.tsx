import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudio } from '../context/StudioContext'

export default function Dashboard() {
  const { apiKeys, projectRoot, summary, isGenerating, imagesRemaining, refreshSummary, startTextGen, publishToApp, selectProjectRoot } = useStudio()
  const navigate = useNavigate()

  useEffect(() => {
    refreshSummary()
  }, [refreshSummary])

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">AMS2 Content Studio</h1>
        <p className="text-gray-400 mt-1">Generate and manage all game content from one place</p>
      </div>

      {/* Project Root Warning */}
      {!projectRoot && (
        <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4">
          <p className="text-red-300 font-medium">Project Folder Not Set</p>
          <p className="text-red-400/70 text-sm mt-1 mb-3">
            Select your AMS2 Career Mod project folder to get started.
          </p>
          <button
            onClick={selectProjectRoot}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
          >
            Select Project Folder
          </button>
        </div>
      )}

      {/* API Key Warning */}
      {projectRoot && apiKeys.length === 0 && (
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
          <p className="text-yellow-300 font-medium">No API Key Set</p>
          <p className="text-yellow-400/70 text-sm mt-1">
            Go to <button onClick={() => navigate('/settings')} className="underline hover:text-yellow-200">Settings</button> to add your Gemini API key before generating content.
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Text Tasks Remaining"
          value={summary?.textTasks ?? '...'}
          color="text-blue-400"
        />
        <StatCard
          label="Image Tasks Remaining"
          value={summary?.imageTasks ?? '...'}
          color="text-purple-400"
        />
        <StatCard
          label="Images Today"
          value={imagesRemaining}
          suffix={`/ ${summary?.estimatedDays ?? '?'} days total`}
          color="text-green-400"
        />
        <StatCard
          label="Estimated API Calls"
          value={summary?.estimatedApiCalls ?? '...'}
          color="text-amber-400"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/generation')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
        >
          Start Generating
        </button>
        <button
          onClick={() => navigate('/browser')}
          className="px-6 py-3 bg-surface-3 hover:bg-surface-4 text-white rounded-lg font-medium transition-colors"
        >
          Browse Content
        </button>
        <button
          onClick={async () => {
            const result = await publishToApp()
            if (result.success) {
              alert('Published successfully!')
            } else {
              alert(`Failed: ${result.error}`)
            }
          }}
          className="px-6 py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
        >
          Publish to App
        </button>
      </div>

      {/* Category Breakdown */}
      {summary?.byCategory && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Category Breakdown</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(summary.byCategory).map(([category, counts]) => (
              <CategoryCard key={category} category={category} text={counts.text} image={counts.image} />
            ))}
          </div>
        </div>
      )}

      {/* Generation Status */}
      {isGenerating && (
        <div className="bg-surface-2 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <p className="text-white font-medium">Generation in progress...</p>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, suffix, color }: { label: string; value: string | number; suffix?: string; color: string }) {
  return (
    <div className="bg-surface-2 rounded-lg p-4 border border-surface-3">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {suffix && <p className="text-gray-500 text-xs mt-1">{suffix}</p>}
    </div>
  )
}

function CategoryCard({ category, text, image }: { category: string; text: number; image: number }) {
  const total = text + image
  const label = category.replace(/-/g, ' ').replace(/(^|\s)\w/g, c => c.toUpperCase())

  return (
    <div className="bg-surface-1 rounded-lg p-3 border border-surface-2 flex items-center justify-between">
      <div>
        <p className="text-white font-medium text-sm">{label}</p>
        <p className="text-gray-500 text-xs">{total} tasks remaining</p>
      </div>
      <div className="flex gap-3 text-xs">
        {text > 0 && <span className="text-blue-400">{text} text</span>}
        {image > 0 && <span className="text-purple-400">{image} img</span>}
        {total === 0 && <span className="text-green-400">Done</span>}
      </div>
    </div>
  )
}
