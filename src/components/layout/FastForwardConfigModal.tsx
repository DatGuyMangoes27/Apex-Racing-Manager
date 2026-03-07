import { Modal } from '@/components/ui'
import { useCareerStore, DEFAULT_FAST_FORWARD_CONFIG, type FastForwardConfig } from '@/store/careerStore'
import { CalendarCheck, Mail, Star, AlertTriangle, DollarSign } from 'lucide-react'

interface FastForwardConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

const CONFIG_ITEMS: Array<{
  key: keyof FastForwardConfig
  label: string
  description: string
  icon: React.ReactNode
}> = [
  {
    key: 'autoAcceptSchedule',
    label: 'Auto-accept PA schedule',
    description: "Accept Julia's weekly suggestions automatically",
    icon: <CalendarCheck className="w-4 h-4 text-accent-blue" />
  },
  {
    key: 'stopOnCalendarConflict',
    label: 'Stop on calendar conflicts',
    description: 'Pause when a scheduling conflict needs your input',
    icon: <AlertTriangle className="w-4 h-4 text-accent-orange" />
  },
  {
    key: 'stopOnUrgentEmails',
    label: 'Stop on urgent emails',
    description: 'Pause on offers, contracts, or mandatory tasks',
    icon: <Mail className="w-4 h-4 text-accent-red" />
  },
  {
    key: 'stopOnStarredEmails',
    label: 'Stop on starred emails',
    description: 'Pause when a starred email arrives',
    icon: <Star className="w-4 h-4 text-accent-gold" />
  },
  {
    key: 'stopOnNegativeCash',
    label: 'Stop on negative cash',
    description: 'Pause when any bank balance drops below zero',
    icon: <DollarSign className="w-4 h-4 text-status-success" />
  }
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-accent-blue' : 'bg-surface-tertiary'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export function FastForwardConfigModal({ isOpen, onClose }: FastForwardConfigModalProps) {
  const { careerState, updateFastForwardConfig } = useCareerStore()
  const config = careerState?.fastForward?.config ?? DEFAULT_FAST_FORWARD_CONFIG

  const handleToggle = (key: keyof FastForwardConfig) => {
    updateFastForwardConfig({ [key]: !config[key] })
  }

  const handleResetDefaults = () => {
    updateFastForwardConfig({ ...DEFAULT_FAST_FORWARD_CONFIG })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fast Forward Settings" size="sm">
      <div>
        <p className="text-sm text-text-muted mb-5">
          Configure what happens when you skip to race week.
        </p>

        <div className="space-y-2">
          {CONFIG_ITEMS.map(({ key, label, description, icon }) => (
            <div
              key={key}
              onClick={() => handleToggle(key)}
              className={`flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-all duration-150 border ${
                config[key]
                  ? 'bg-accent-blue/10 border-accent-blue/30'
                  : 'bg-surface/50 border-border/50 hover:border-border'
              }`}
            >
              <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                config[key] ? 'bg-accent-blue/20' : 'bg-surface-secondary'
              }`}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${
                  config[key] ? 'text-text-primary' : 'text-text-secondary'
                }`}>{label}</p>
                <p className="text-xs text-text-muted mt-0.5">{description}</p>
              </div>
              <Toggle checked={config[key]} onChange={() => handleToggle(key)} />
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-border/50 flex justify-between items-center">
          <button
            onClick={handleResetDefaults}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Reset to defaults
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-accent-orange/20 text-accent-orange text-sm font-display font-semibold hover:bg-accent-orange/30 transition-colors border border-accent-orange/30"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  )
}
