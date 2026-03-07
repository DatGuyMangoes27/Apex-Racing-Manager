/**
 * Calendar Conflict Resolution Modal
 * 
 * Displayed when the player has races in multiple championships on the same weekend.
 * Player must choose which race to attend - others will be marked as DNS (Did Not Start).
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Trophy,
  AlertTriangle,
  Check,
  X,
  Flag,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '@/components/ui';

interface CalendarConflict {
  week: number;
  day: number;
  entries: Array<{
    id: string;
    seriesId: string;
    trackName: string;
    type: string;
  }>;
}

interface ConflictModalProps {
  conflict: CalendarConflict | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (conflictWeek: number, selectedEntryId: string) => void;
  seriesNames?: Record<string, string>;
  seriesColors?: Record<string, string>;
}

export function ConflictModal({ conflict, isOpen, onClose, onResolve, seriesNames = {}, seriesColors = {} }: ConflictModalProps) {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)

  if (!conflict) return null

  const handleResolve = () => {
    if (selectedEntryId) {
      onResolve(conflict.week, selectedEntryId)
      setSelectedEntryId(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Conflict" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-status-warning">Calendar Conflict Detected</p>
            <p className="text-sm text-text-muted mt-1">
              You have multiple events scheduled for the same weekend. Choose which event to attend.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {conflict.entries.map((entry) => (
            <motion.button
              key={entry.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedEntryId(entry.id)}
              className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                selectedEntryId === entry.id
                  ? 'border-accent-red bg-accent-red/10'
                  : 'border-surface-border hover:border-accent-red/50 bg-surface-secondary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Flag className="w-5 h-5 text-accent-red" />
                <div className="flex-1">
                  <p className="font-medium">{entry.trackName}</p>
                  <p className="text-sm text-text-muted">
                    {seriesNames[entry.seriesId] || entry.seriesId}
                  </p>
                </div>
                {selectedEntryId === entry.id && (
                  <Check className="w-5 h-5 text-accent-red" />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={!selectedEntryId}
            onClick={handleResolve}
          >
            <Check className="w-4 h-4 mr-2" />
            Confirm Selection
          </Button>
        </div>
      </div>
    </Modal>
  )
}