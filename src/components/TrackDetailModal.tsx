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

import {
  MapPin,
  Route,
  Flag,
  Trophy,
  Star,
      {/* Timeline */}
      <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-surface-border">
        <span>First visit: {history.firstVisitYear}</span>
        <span>Last visit: {history.lastVisitYear}</span>
      </div>
    </div>
  )
}

export default TrackDetailModal
