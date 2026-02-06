import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Save } from 'lucide-react'
import { saveToNativeDB } from '@/store/careerStore'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  saving: boolean
  saved: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, saving: false, saved: false }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
  }

  handleEmergencySave = async () => {
    this.setState({ saving: true })
    try {
      await saveToNativeDB()
      this.setState({ saved: true, saving: false })
    } catch (e) {
      console.error('[ErrorBoundary] Emergency save failed:', e)
      this.setState({ saving: false })
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="max-w-lg w-full">
            <div className="bg-surface rounded-2xl border border-surface-border p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-status-danger/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-status-danger" />
              </div>
              
              <h1 className="font-display text-2xl font-bold text-white mb-2">
                Something Went Wrong
              </h1>
              <p className="text-text-secondary mb-6">
                An unexpected error occurred. Your progress may be at risk.
              </p>

              {this.state.error && (
                <div className="bg-background rounded-lg p-3 mb-6 text-left">
                  <p className="text-xs font-mono text-text-muted break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={this.handleEmergencySave}
                  disabled={this.state.saving || this.state.saved}
                  className={`
                    flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display font-semibold
                    transition-all
                    ${this.state.saved 
                      ? 'bg-status-success/20 text-status-success border border-status-success/30'
                      : 'bg-accent-red hover:bg-accent-red/80 text-white'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <Save className="w-5 h-5" />
                  {this.state.saving ? 'Saving...' : this.state.saved ? 'Progress Saved!' : 'Emergency Save'}
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display font-semibold
                    bg-surface-secondary hover:bg-surface-secondary/80 text-white border border-surface-border
                    transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reload App
                </button>
              </div>
              
              <p className="text-xs text-text-muted mt-6">
                If this keeps happening, try exporting your save from Settings before it corrupts.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
