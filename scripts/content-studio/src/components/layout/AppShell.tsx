import { NavLink, Outlet } from 'react-router-dom'
import { useStudio } from '../../context/StudioContext'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', exact: true },
  { to: '/generation', label: 'Generation' },
  { to: '/browser', label: 'Browse Content' },
  { to: '/settings', label: 'Settings' },
]

export default function AppShell() {
  const { isGenerating, generationType, imagesRemaining, dailyBudget, summary } = useStudio()

  return (
    <div className="flex h-screen bg-surface-0 text-gray-200">
      {/* Sidebar */}
      <aside className="w-56 bg-surface-1 border-r border-surface-2 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-surface-2">
          <h1 className="text-lg font-bold text-white">AMS2</h1>
          <p className="text-xs text-gray-500">Content Studio</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 font-medium'
                    : 'text-gray-400 hover:bg-surface-2 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer Status */}
        <div className="p-4 border-t border-surface-2 space-y-3">
          {/* Generation Status */}
          {isGenerating && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400">
                {generationType === 'text' ? 'Generating text...' : 'Generating images...'}
              </span>
            </div>
          )}

          {/* Image Budget */}
          <div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Images Today</span>
              <span>{imagesRemaining}/{dailyBudget}</span>
            </div>
            <div className="w-full bg-surface-3 rounded-full h-1.5 mt-1">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all"
                style={{ width: `${(imagesRemaining / dailyBudget) * 100}%` }}
              />
            </div>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="text-xs text-gray-500 space-y-0.5">
              <div className="flex justify-between">
                <span>Text tasks</span>
                <span>{summary.textTasks}</span>
              </div>
              <div className="flex justify-between">
                <span>Image tasks</span>
                <span>{summary.imageTasks}</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
