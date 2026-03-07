import { useState } from 'react'
import { useStudio } from '../context/StudioContext'

export default function Settings() {
  const { apiKeys, setApiKeys, projectRoot, dailyBudget, setDailyBudget, publishToApp, selectProjectRoot } = useStudio()
  const [localKeys, setLocalKeys] = useState(apiKeys.length > 0 ? apiKeys.join('\n') : '')
  const [localBudget, setLocalBudget] = useState(String(dailyBudget))
  const [saved, setSaved] = useState(false)
  const [publishStatus, setPublishStatus] = useState<string | null>(null)

  function handleSave() {
    const keys = localKeys.split('\n').map(k => k.trim()).filter(k => k.length > 0)
    setApiKeys(keys)
    setDailyBudget(parseInt(localBudget) || 2000)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handlePublish() {
    setPublishStatus('Publishing...')
    const result = await publishToApp()
    setPublishStatus(result.success ? 'Published successfully!' : `Failed: ${result.error}`)
    setTimeout(() => setPublishStatus(null), 3000)
  }

  const keyCount = localKeys.split('\n').map(k => k.trim()).filter(k => k.length > 0).length

  return (
    <div className="p-8 max-w-2xl overflow-y-auto h-full">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      {/* API Keys */}
      <div className="bg-surface-2 rounded-lg p-5 border border-surface-3 mb-6">
        <h2 className="text-lg font-semibold text-white mb-2">Gemini API Keys</h2>
        <p className="text-gray-400 text-sm mb-2">
          Enter your Google AI Studio API keys, one per line. Multiple keys enable higher parallelism.
        </p>
        <p className="text-gray-500 text-xs mb-4">
          With {keyCount} key{keyCount !== 1 ? 's' : ''}, generation will use ~{Math.max(20, keyCount * 4)} parallel workers for text and ~{Math.max(10, keyCount * 2)} for images.
        </p>
        <textarea
          value={localKeys}
          onChange={e => setLocalKeys(e.target.value)}
          placeholder={"AIza... (key 1)\nAIza... (key 2)\nAIza... (key 3)"}
          rows={6}
          className="w-full px-4 py-2 bg-surface-1 border border-surface-3 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-blue-500 resize-none"
        />
        <p className="text-gray-500 text-xs mt-2">{keyCount} key{keyCount !== 1 ? 's' : ''} configured</p>
      </div>

      {/* Project Root */}
      <div className="bg-surface-2 rounded-lg p-5 border border-surface-3 mb-6">
        <h2 className="text-lg font-semibold text-white mb-2">Project Root</h2>
        <p className="text-gray-400 text-sm mb-2">Path to the AMS2 Career Mod project folder.</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 px-4 py-2 bg-surface-1 border border-surface-3 rounded-lg text-gray-300 text-sm font-mono truncate">
            {projectRoot || 'Not set'}
          </div>
          <button
            onClick={selectProjectRoot}
            className="px-4 py-2 bg-surface-3 hover:bg-surface-4 text-white rounded-lg text-sm shrink-0"
          >
            Browse...
          </button>
        </div>
        {!projectRoot && (
          <p className="text-red-400 text-xs mt-2">Project folder not set. Select your AMS2 Career Mod folder.</p>
        )}
      </div>

      {/* Daily Budget */}
      <div className="bg-surface-2 rounded-lg p-5 border border-surface-3 mb-6">
        <h2 className="text-lg font-semibold text-white mb-2">Daily Image Budget</h2>
        <p className="text-gray-400 text-sm mb-4">
          Maximum images to generate per day (Gemini rate limit). With multiple keys, each key contributes to this shared budget.
        </p>
        <input
          type="number"
          value={localBudget}
          onChange={e => setLocalBudget(e.target.value)}
          min={100}
          max={10000}
          className="w-32 px-4 py-2 bg-surface-1 border border-surface-3 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
        >
          Save Settings
        </button>
        {saved && <span className="text-green-400 text-sm">Saved!</span>}
      </div>

      {/* Publish Section */}
      <div className="bg-surface-2 rounded-lg p-5 border border-surface-3">
        <h2 className="text-lg font-semibold text-white mb-2">Publish to App</h2>
        <p className="text-gray-400 text-sm mb-4">
          Copy all generated data to the main AMS2 app's expected directories.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePublish}
            className="px-6 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            Publish Now
          </button>
          {publishStatus && (
            <span className={`text-sm ${publishStatus.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
              {publishStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
