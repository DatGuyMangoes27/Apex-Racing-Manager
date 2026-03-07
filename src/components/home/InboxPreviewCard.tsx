/**
 * InboxPreviewCard — Figma-inspired email preview list
 * Shows top 4 unread emails with sender, subject, and urgency dot.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'

export function InboxPreviewCard() {
  const navigate = useNavigate()
  const { careerState, getUnreadEmailCount } = useCareerStore()

  const emails = useMemo(() => {
    if (!careerState?.emails) return []
    return careerState.emails
      .filter(e =>
        !e.read &&
        !e.archived &&
        (
          e.interruptClass === 'critical' ||
          e.requiresAction ||
          e.actionType === 'accept_decline' ||
          e.actionType === 'review_counter' ||
          e.actionType === 'delegation_approval'
        )
      )
      .slice(0, 4)
      .map(e => ({
        id: e.id,
        sender: e.sender || 'Unknown',
        subject: e.subject || 'No subject',
        hasAction: e.actionType === 'accept_decline' || e.actionType === 'review_counter',
        isUrgent: e.expiresWeek && e.expiresWeek <= (careerState.currentWeek || 0) + 2,
      }))
  }, [careerState])

  const unreadCount = getUnreadEmailCount?.('action') ?? emails.length
  const digestCount = useMemo(
    () => (careerState?.emails || []).filter(e => !e.read && !e.archived && (e.interruptClass === 'digest' || e.digestMode === 'digest')).length,
    [careerState?.emails]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="rounded-2xl border-2 border-black/80 bg-white/[0.08] backdrop-blur-sm shadow-lg overflow-hidden flex-1"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black/80">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-300" />
          <span className="font-display font-black text-sm text-white tracking-tight">
            INBOX
          </span>
        </div>
        {unreadCount > 0 && (
          <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
            {unreadCount}
          </span>
        )}
      </div>
      {digestCount > 0 && (
        <div className="px-4 py-1 border-b-2 border-black/80">
          <p className="text-[10px] text-slate-400">+ {digestCount} digest update{digestCount === 1 ? '' : 's'}</p>
        </div>
      )}

      {/* Email list */}
      <div className="divide-y divide-white/[0.06]">
        {emails.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-slate-500">No unread messages</p>
          </div>
        ) : (
          emails.map((email) => (
            <button
              key={email.id}
              onClick={() => navigate('/emails')}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-display font-bold text-white truncate">
                  {email.sender}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {email.subject}
                </p>
              </div>
              {email.isUrgent && (
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
              )}
              {email.hasAction && !email.isUrgent && (
                <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 shrink-0" />
              )}
            </button>
          ))
        )}
      </div>
    </motion.div>
  )
}
