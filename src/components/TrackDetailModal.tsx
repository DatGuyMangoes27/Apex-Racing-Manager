/**
 * TrackDetailModal - Rich track information modal
 * 
 * Shows comprehensive track details including:
 * - Track overview (name, country, type, layouts)
 * - Narrative content (atmosphere, character, famous corners)
 * - History and notable moments
 * - Racing characteristics (overtaking spots, key factors)
 * - Player history at this track (if visited)
 */

import { MapPin, Route, Flag, Trophy, Star, X, Globe, Clock, ChevronRight, Info, Layers, Car, Wind } from 'lucide-react'
import { Modal, Card, Badge, Button, TrackImage } from '@/components/ui'

interface TrackHistory {
  firstVisitYear: number
  lastVisitYear: number
  totalRaces: number
  bestFinish: number
  wins: number
}

interface TrackDetailModalProps {
  isOpen: boolean
  onClose: () => void
  track: any
  history?: TrackHistory
}

function TrackDetailModal({ isOpen, onClose, track, history }: TrackDetailModalProps) {
  if (!track) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={track.name || 'Track Details'}>
      <div className="space-y-4">
        {/* Track Hero Image */}
        <div className="rounded-lg overflow-hidden -mt-2">
          <TrackImage
            trackId={track.id || track.name}
            trackName={track.name}
            imageType="aerial"
            size="banner"
          />
        </div>
        <div className="text-text-muted text-sm">
          {track.country && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {track.country}</span>}
        </div>
        {history && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-primary">Your History</h3>
            <div className="text-sm text-text-muted">
              <div>Races: {history.totalRaces} | Best: P{history.bestFinish} | Wins: {history.wins}</div>
            </div>
            {/* Timeline */}
            <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-surface-border">
              <span>First visit: {history.firstVisitYear}</span>
              <span>Last visit: {history.lastVisitYear}</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default TrackDetailModal
