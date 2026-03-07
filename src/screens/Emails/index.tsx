import { useState, useMemo } from 'react'
import {
  Mail,
  MailOpen,
  Star,
  Trash2,
  Clock,
  Paperclip,
  DollarSign,
  CheckCircle,
  X,
  Check,
  Users,
  Trophy,
  Handshake,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  CalendarCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui'
import { NegotiationModal } from '@/components/sponsors'
import { OpportunityResponseModal } from '@/components/opportunities'
import { useCareerStore, Email, EmailCategory, getDayName, SponsorNegotiation } from '@/store/careerStore'
import { TeamOpportunity } from '@/data/team-opportunities'
import { applyAutoScheduleToStore } from '@/simulation/activities/autoScheduler'
import type { ScheduleSuggestion } from '@/simulation/activities/suggestionEngine'

// ============================================
// FIGMA-EXACT INBOX — 3-panel layout
// White theme · black borders · Arial Black
// ============================================

const FONT_BLACK: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FONT_BOLD: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FONT_REGULAR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }

// Format relative time
function formatTimeAgo(emailDay: number, emailWeek: number, emailYear: number, currentDay: number, currentWeek: number, currentYear: number): string {
  const totalDaysCurrent = currentYear * 365 + currentWeek * 7 + currentDay
  const totalDaysEmail = emailYear * 365 + emailWeek * 7 + emailDay
  const diff = totalDaysCurrent - totalDaysEmail
  if (diff <= 0) return 'Just now'
  if (diff < 1) return 'Just now'
  if (diff === 1) return '1 day ago'
  if (diff < 7) return `${diff} days ago`
  const weeks = Math.floor(diff / 7)
  if (weeks === 1) return '1 week ago'
  return `${weeks} weeks ago`
}

export function Emails() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const {
    careerState,
    markEmailRead,
    markEmailUnread,
    toggleEmailStarred,
    archiveEmail,
    deleteEmail,
    getUnreadEmailCount,
    setPendingShortlistId,
    approveMerchandiseProductProposal,
    approveMerchandiseCollectionProposal,
    rejectMerchandiseProposal,
  } = useCareerStore()

  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [activeFilter, setActiveFilter] = useState<'action' | 'important' | 'digest' | 'all'>('action')
  const [negotiationModalOpen, setNegotiationModalOpen] = useState(false)
  const [selectedNegotiation, setSelectedNegotiation] = useState<SponsorNegotiation | null>(null)
  const [opportunityModalOpen, setOpportunityModalOpen] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<TeamOpportunity | null>(null)

  const emails = careerState?.emails ?? []
  const unreadCount = getUnreadEmailCount('all')
  const currentDay = careerState?.currentDay ?? 1
  const currentWeek = careerState?.currentWeek ?? 1
  const currentYear = careerState?.currentYear ?? 2026

  const isDelivered = (email: Email) => {
    if (email.receivedYear < currentYear) return true
    if (email.receivedYear > currentYear) return false
    if (email.receivedWeek < currentWeek) return true
    if (email.receivedWeek > currentWeek) return false
    return email.receivedDay <= currentDay
  }

  const filteredEmails = useMemo(() => {
    const delivered = emails
      .filter((email) => isDelivered(email) && !email.archived)
      .filter((email) => {
        if (!careerState?.coreLoopMode) return true
        const isCritical = email.interruptClass === 'critical' || !!email.requiresAction
        const isDigest = email.interruptClass === 'digest' || email.digestMode === 'digest'
        if (isCritical || isDigest) return true
        return email.category !== 'media' && email.category !== 'invitation'
      })
    const scoped = delivered.filter((email) => {
      const actionData = (email.actionData || {}) as Record<string, unknown>
      const isCritical = email.interruptClass === 'critical' || !!email.requiresAction ||
        email.actionType === 'accept_decline' ||
        email.actionType === 'review_counter' ||
        email.actionType === 'delegation_approval' ||
        email.actionType === 'negotiate_sponsor' ||
        (email.actionType === 'navigate' && actionData.type === 'team_sponsor_offer')
      const isDigest = email.interruptClass === 'digest' || email.digestMode === 'digest'
      const isImportant = email.interruptClass === 'important' && !isCritical && !isDigest
      if (activeFilter === 'action') return isCritical
      if (activeFilter === 'important') return isImportant
      if (activeFilter === 'digest') return isDigest
      return true
    })
    return scoped
      .sort((a, b) => {
        if (a.receivedYear !== b.receivedYear) return b.receivedYear - a.receivedYear
        if (a.receivedWeek !== b.receivedWeek) return b.receivedWeek - a.receivedWeek
        return b.receivedDay - a.receivedDay
      })
  }, [emails, currentDay, currentWeek, currentYear, activeFilter, careerState?.coreLoopMode])

  // ── Handlers ──────────────────────────────────────────────────

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email)
    if (!email.read) markEmailRead(email.id)
  }

  const handleStar = (email: Email, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleEmailStarred(email.id)
  }

  const handleArchive = (email: Email) => {
    archiveEmail(email.id)
    setSelectedEmail(null)
  }

  const handleDelete = (email: Email) => {
    deleteEmail(email.id)
    setSelectedEmail(null)
  }

  const handleOpenNegotiation = (email: Email) => {
    const negotiationId = email.actionData?.negotiationId as string
    if (!negotiationId) return
    const negotiation = careerState?.ownedTeam?.finances?.activeNegotiations?.find((n) => n.id === negotiationId)
    if (!negotiation) {
      addToast({ type: 'warning', message: `Negotiation has expired or been completed.`, duration: 4000 })
      return
    }
    setSelectedNegotiation(negotiation)
    setNegotiationModalOpen(true)
  }

  const isNegotiationAvailable = (email: Email): boolean => {
    if (!email.actionType || !['negotiate_sponsor', 'review_counter'].includes(email.actionType)) return true
    const negotiationId = email.actionData?.negotiationId as string
    if (!negotiationId) return false
    return !!careerState?.ownedTeam?.finances?.activeNegotiations?.find(
      (n) => n.id === negotiationId && !['accepted', 'declined', 'expired', 'sponsor_withdrew'].includes(n.status)
    )
  }

  const handleOpenOpportunity = (email: Email) => {
    const opportunityId = email.actionData?.opportunityId as string
    if (!opportunityId) return
    const opportunity = careerState?.pendingOpportunities?.find((o) => o.instanceId === opportunityId)
    if (!opportunity) {
      addToast({ type: 'error', message: 'Opportunity may have expired', duration: 3000 })
      return
    }
    setSelectedOpportunity(opportunity)
    setOpportunityModalOpen(true)
  }

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="bg-white w-full h-full flex flex-col">
      {/* ── HEADER ── */}
      <div className="border-b-[0.8px] border-black/20 px-[24px] pt-[24px] pb-[24px] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-[4px]">
            <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px] leading-[36px]" style={FONT_BLACK}>
              INBOX
            </h1>
            <p className="text-[14px] text-[#4a5565] leading-[20px]" style={FONT_REGULAR}>
              {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-black/5 w-[40px] h-[40px] rounded-[16px] flex items-center justify-center">
            <Mail className="w-[20px] h-[20px] text-[#0a0a0a]" />
          </div>
        </div>
        <div className="mt-[12px] flex gap-[8px]">
          {[
            { id: 'action', label: 'Action Required' },
            { id: 'important', label: 'Important' },
            { id: 'digest', label: 'Digest' },
            { id: 'all', label: 'All' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as typeof activeFilter)}
              className={`px-[10px] py-[4px] rounded-[10px] text-[11px] border ${
                activeFilter === f.id ? 'bg-black text-white border-black' : 'bg-white text-[#4a5565] border-black/20'
              }`}
              style={FONT_BOLD}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BODY: 3-panel ── */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT — Email List (400px) */}
        <div className="w-[400px] shrink-0 border-r-[0.8px] border-black/20 overflow-y-auto">
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Mail className="w-[48px] h-[48px] text-[#d1d5dc] mb-[12px]" />
              <p className="text-[14px] text-[#4a5565]" style={FONT_REGULAR}>No emails</p>
            </div>
          ) : (
            filteredEmails.map((email) => {
              const isSelected = selectedEmail?.id === email.id
              const isUnread = !email.read
              const timeAgo = formatTimeAgo(email.receivedDay, email.receivedWeek, email.receivedYear, currentDay, currentWeek, currentYear)

              return (
                <div
                  key={email.id}
                  onClick={() => handleSelectEmail(email)}
                  className={`border-b-[0.8px] border-black/10 px-[16px] py-[16px] cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#f9fafb]' : isUnread ? 'bg-[#f9fafb]' : 'bg-black/[0.02] hover:bg-[#f9fafb]'
                  }`}
                >
                  <div className="flex gap-[12px]">
                    {/* Envelope icon */}
                    <div className="mt-[4px] shrink-0">
                      {isUnread ? (
                        <Mail className="w-[16px] h-[16px] text-black" />
                      ) : (
                        <MailOpen className="w-[16px] h-[16px] text-[#4a5565]" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
                      {/* Row 1: Sender + time */}
                      <div className="flex items-center justify-between gap-[8px]">
                        <span
                          className="text-[14px] text-[#0a0a0a] leading-[20px] truncate"
                          style={isUnread ? FONT_BLACK : FONT_BOLD}
                        >
                          {email.sender}
                        </span>
                        <div className="flex items-center gap-[4px] shrink-0">
                          <Clock className="w-[12px] h-[12px] text-[#4a5565]" />
                          <span className="text-[10px] text-[#4a5565] leading-[15px]" style={FONT_REGULAR}>
                            {timeAgo}
                          </span>
                        </div>
                      </div>
                      {/* Row 2: Subject */}
                      <span
                        className="text-[12px] text-[#0a0a0a] leading-[16px] truncate"
                        style={isUnread ? FONT_BLACK : FONT_BOLD}
                      >
                        {email.subject}
                      </span>
                      {/* Row 3: Preview */}
                      <span className="text-[12px] text-[#4a5565] leading-[16px] truncate" style={FONT_REGULAR}>
                        {email.preview}
                      </span>
                      {/* Row 4: Category tag + attachment */}
                      <div className="flex items-center gap-[8px] mt-[2px]">
                        <span
                          className="bg-black/5 rounded-[10px] px-[8px] py-[2px] text-[10px] text-[#0a0a0a] leading-[15px]"
                          style={FONT_REGULAR}
                        >
                          {email.category.toUpperCase()}
                        </span>
                        {email.starred && <Star className="w-[12px] h-[12px] text-[#f59e0b] fill-[#f59e0b]" />}
                        {email.actionType && (
                          <Paperclip className="w-[12px] h-[12px] text-[#4a5565]" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* CENTER — Email Body */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#f9fafb]">
          {selectedEmail ? (
            <>
              {/* Email detail header */}
              <div className="bg-white border-b-[0.8px] border-black/20 px-[24px] pt-[24px] pb-[24px] shrink-0">
                <div className="flex items-start justify-between mb-[8px]">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[24px] text-[#0a0a0a] leading-[32px] mb-[8px]" style={FONT_BLACK}>
                      {selectedEmail.subject}
                    </h2>
                    <div className="flex items-center gap-[8px]">
                      <span className="text-[14px] text-[#4a5565] leading-[20px]" style={FONT_BLACK}>
                        {selectedEmail.sender}
                      </span>
                      <span className="text-[14px] text-[#4a5565] leading-[20px]" style={FONT_REGULAR}>•</span>
                      <span className="text-[14px] text-[#4a5565] leading-[20px]" style={FONT_REGULAR}>
                        {formatTimeAgo(selectedEmail.receivedDay, selectedEmail.receivedWeek, selectedEmail.receivedYear, currentDay, currentWeek, currentYear)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-[8px] shrink-0">
                    <button
                      onClick={(e) => handleStar(selectedEmail, e)}
                      className="bg-[#f3f4f6] w-[40px] h-[40px] rounded-[16px] flex items-center justify-center hover:bg-[#e5e7eb] transition-colors"
                    >
                      <Star
                        className={`w-[20px] h-[20px] ${
                          selectedEmail.starred ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[#4a5565]'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedEmail)}
                      className="bg-[#f3f4f6] w-[40px] h-[40px] rounded-[16px] flex items-center justify-center hover:bg-[#e5e7eb] transition-colors"
                    >
                      <Trash2 className="w-[20px] h-[20px] text-[#4a5565]" />
                    </button>
                  </div>
                </div>
                {/* Attachment indicator */}
                {Boolean(selectedEmail.actionData?.attachment) && (
                  <div className="bg-[#f3f4f6] inline-flex items-center gap-[8px] px-[16px] py-[6px] rounded-[16px] mt-[8px]">
                    <Paperclip className="w-[16px] h-[16px] text-[#0a0a0a]" />
                    <span className="text-[12px] text-[#0a0a0a]" style={FONT_BLACK}>
                      {String(selectedEmail.actionData?.attachment)}
                    </span>
                  </div>
                )}
              </div>

              {/* Email body + right sidebar */}
              <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Body content */}
                <div className="flex-1 overflow-y-auto p-[24px]">
                  <div className="bg-white border-[0.8px] border-black/20 rounded-[24px] p-[32px]">
                    <div className="whitespace-pre-wrap text-[14px] text-[#1e2939] leading-[22px]" style={FONT_REGULAR}>
                      {selectedEmail.body}
                    </div>

                    {/* Signature block */}
                    {selectedEmail.senderRole && (
                      <div className="border-t-[0.8px] border-black/10 mt-[32px] pt-[24px]">
                        <p className="text-[14px] text-black leading-[20px]" style={FONT_BLACK}>
                          {selectedEmail.sender}
                        </p>
                        <p className="text-[12px] text-[#4a5565] leading-[16px] mt-[2px]" style={FONT_REGULAR}>
                          {selectedEmail.senderRole}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Expiry warning */}
                  {selectedEmail.expiresWeek && (
                    <div className="mt-[16px] p-[16px] bg-[#fff7ed] border-[0.8px] border-[#f59e0b]/30 rounded-[16px] flex items-center gap-[12px]">
                      <AlertCircle className="w-[20px] h-[20px] text-[#f59e0b] shrink-0" />
                      <div>
                        <p className="text-[12px] text-[#0a0a0a]" style={FONT_BLACK}>Time Sensitive</p>
                        <p className="text-[12px] text-[#4a5565]" style={FONT_REGULAR}>
                          Expires in Week {selectedEmail.expiresWeek}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right sidebar: Quick Actions + Email Info */}
                <div className="w-[320px] shrink-0 overflow-y-auto p-[16px] flex flex-col gap-[16px]">
                  {/* Quick Actions */}
                  {selectedEmail.actionType && (
                    <div className="bg-white border-[0.8px] border-black/20 rounded-[24px] p-[24px]">
                      <p className="text-[12px] text-[#4a5565] tracking-[0.6px] leading-[16px] mb-[16px]" style={FONT_BLACK}>
                        QUICK ACTIONS
                      </p>
                      <div className="flex flex-col gap-[12px]">
                        <QuickActionButtons
                          email={selectedEmail}
                          onArchive={handleArchive}
                          onOpenNegotiation={handleOpenNegotiation}
                          onOpenOpportunity={handleOpenOpportunity}
                          isNegotiationAvailable={isNegotiationAvailable}
                          navigate={navigate}
                          careerState={careerState}
                          addToast={addToast}
                        />
                      </div>
                    </div>
                  )}

                  {/* Email Info */}
                  <div className="bg-white border-[0.8px] border-black/20 rounded-[24px] p-[24px]">
                    <p className="text-[12px] text-[#4a5565] tracking-[0.6px] leading-[16px] mb-[16px]" style={FONT_BLACK}>
                      EMAIL INFO
                    </p>
                    <div className="flex flex-col gap-[12px]">
                      <div>
                        <p className="text-[10px] text-[#6a7282] tracking-[0.5px] leading-[15px]" style={FONT_REGULAR}>FROM</p>
                        <p className="text-[14px] text-[#0a0a0a] leading-[20px]" style={FONT_BLACK}>{selectedEmail.sender}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6a7282] tracking-[0.5px] leading-[15px]" style={FONT_REGULAR}>TIME</p>
                        <p className="text-[14px] text-[#0a0a0a] leading-[20px]" style={FONT_BOLD}>
                          {formatTimeAgo(selectedEmail.receivedDay, selectedEmail.receivedWeek, selectedEmail.receivedYear, currentDay, currentWeek, currentYear)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6a7282] tracking-[0.5px] leading-[15px]" style={FONT_REGULAR}>CATEGORY</p>
                        <span className="inline-block bg-black/5 rounded-[10px] px-[8px] py-[4px] text-[10px] text-[#0a0a0a] mt-[4px]" style={FONT_BLACK}>
                          {selectedEmail.category.toUpperCase()}
                        </span>
                      </div>
                      {selectedEmail.senderRole && (
                        <div>
                          <p className="text-[10px] text-[#6a7282] tracking-[0.5px] leading-[15px]" style={FONT_REGULAR}>ROLE</p>
                          <p className="text-[14px] text-[#0a0a0a] leading-[20px]" style={FONT_BOLD}>{selectedEmail.senderRole}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom bar: Reply + Forward */}
              <div className="bg-white border-t-[0.8px] border-black/20 px-[24px] py-[24px] shrink-0">
                <div className="flex gap-[12px]">
                  <button
                    onClick={() => handleArchive(selectedEmail)}
                    className="bg-black h-[48px] rounded-[16px] px-[24px] flex items-center justify-center hover:bg-gray-900 transition-colors"
                  >
                    <span className="text-[16px] text-white leading-[24px]" style={FONT_BLACK}>REPLY</span>
                  </button>
                  <button
                    onClick={() => handleArchive(selectedEmail)}
                    className="border-[0.8px] border-black/20 h-[48px] rounded-[16px] px-[24px] flex items-center justify-center hover:bg-[#f3f4f6] transition-colors"
                  >
                    <span className="text-[16px] text-[#0a0a0a] leading-[24px]" style={FONT_BLACK}>FORWARD</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Mail className="w-[64px] h-[64px] text-[#d1d5dc] mb-[16px]" />
              <p className="text-[16px] text-[#4a5565]" style={FONT_REGULAR}>Select an email to read</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {selectedNegotiation && careerState?.ownedTeam && (
        <NegotiationModal
          isOpen={negotiationModalOpen}
          onClose={() => { setNegotiationModalOpen(false); setSelectedNegotiation(null) }}
          negotiation={selectedNegotiation}
          team={careerState.ownedTeam}
        />
      )}
      {selectedOpportunity && (
        <OpportunityResponseModal
          isOpen={opportunityModalOpen}
          onClose={() => { setOpportunityModalOpen(false); setSelectedOpportunity(null) }}
          opportunity={selectedOpportunity}
          currentWeek={careerState?.currentWeek ?? 1}
          currentYear={careerState?.currentYear ?? new Date().getFullYear()}
          scheduledActivities={careerState?.scheduledActivities ?? []}
        />
      )}
    </div>
  )
}

// ── Quick Action Buttons (preserves ALL game logic) ──────────────

function QuickActionButtons({
  email,
  onArchive,
  onOpenNegotiation,
  onOpenOpportunity,
  isNegotiationAvailable,
  navigate,
  careerState,
  addToast,
}: {
  email: Email
  onArchive: (email: Email) => void
  onOpenNegotiation: (email: Email) => void
  onOpenOpportunity: (email: Email) => void
  isNegotiationAvailable: (email: Email) => boolean
  navigate: (path: string) => void
  careerState: any
  addToast: ReturnType<typeof useToast>['addToast']
}) {
  const FONT_BLACK: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }

  const primaryBtn = 'bg-black text-white h-[44px] rounded-[16px] px-[20px] flex items-center gap-[12px] w-full hover:bg-gray-900 transition-colors'
  const secondaryBtn = 'border-[0.8px] border-black/20 h-[44px] rounded-[16px] px-[20px] flex items-center gap-[12px] w-full hover:bg-[#f3f4f6] transition-colors'

  // Accept/Decline
  if (email.actionType === 'accept_decline') {
    return (
      <>
        <button
          className={primaryBtn}
          onClick={() => {
            const actionData = email.actionData
            const store = useCareerStore.getState()
            if (actionData?.type === 'sponsor_offer' && actionData?.sponsorId) {
              store.acceptSponsorDeal(actionData.sponsorId as string)
              addToast({ type: 'success', message: 'Sponsor deal accepted!', duration: 3000 })
            } else if (actionData?.type === 'invitation' && actionData?.invitationId) {
              store.acceptInvitation(actionData.invitationId as string)
              addToast({ type: 'success', message: 'Invitation accepted — added to calendar', duration: 3000 })
            } else {
              addToast({ type: 'success', message: 'Accepted', duration: 2000 })
            }
            onArchive(email)
          }}
        >
          <Check className="w-[20px] h-[20px]" />
          <span className="text-[14px]" style={FONT_BLACK}>Accept</span>
        </button>
        <button
          className={secondaryBtn}
          onClick={() => {
            const actionData = email.actionData
            const store = useCareerStore.getState()
            if (actionData?.type === 'sponsor_offer' && actionData?.sponsorId) {
              store.declineSponsorDeal(actionData.sponsorId as string)
              addToast({ type: 'info', message: 'Sponsor declined', duration: 3000 })
            } else if (actionData?.type === 'invitation' && actionData?.invitationId) {
              store.declineInvitation(actionData.invitationId as string)
              addToast({ type: 'info', message: 'Invitation declined', duration: 3000 })
            }
            onArchive(email)
          }}
        >
          <X className="w-[20px] h-[20px] text-[#0a0a0a]" />
          <span className="text-[14px] text-[#0a0a0a]" style={FONT_BLACK}>Decline</span>
        </button>
      </>
    )
  }

  // Acknowledge
  if (email.actionType === 'acknowledge') {
    return (
      <button className={primaryBtn} onClick={() => onArchive(email)}>
        <Check className="w-[20px] h-[20px]" />
        <span className="text-[14px]" style={FONT_BLACK}>Acknowledge</span>
      </button>
    )
  }

  // Navigate
  if (email.actionType === 'navigate') {
    return (
      <button
        className={primaryBtn}
        onClick={() => {
          const destination = (email.actionData?.destination as string) || '/home'
          navigate(destination)
        }}
      >
        <ExternalLink className="w-[20px] h-[20px]" />
        <span className="text-[14px]" style={FONT_BLACK}>View Details</span>
      </button>
    )
  }

  // Sponsor negotiation
  if (email.actionType === 'negotiate_sponsor' || email.actionType === 'review_counter') {
    if (isNegotiationAvailable(email)) {
      return (
        <button className={primaryBtn} onClick={() => onOpenNegotiation(email)}>
          <Handshake className="w-[20px] h-[20px]" />
          <span className="text-[14px]" style={FONT_BLACK}>
            {email.actionType === 'review_counter' ? 'Review Counter' : 'Negotiate'}
          </span>
        </button>
      )
    }
    return (
      <button className={secondaryBtn} onClick={() => navigate('/sponsor-market')}>
        <ExternalLink className="w-[20px] h-[20px] text-[#0a0a0a]" />
        <span className="text-[14px] text-[#0a0a0a]" style={FONT_BLACK}>Browse Sponsors</span>
      </button>
    )
  }

  // Opportunity
  if (
    email.actionType === 'opportunity_media' ||
    email.actionType === 'opportunity_manufacturer' ||
    email.actionType === 'opportunity_special'
  ) {
    return (
      <button className={primaryBtn} onClick={() => onOpenOpportunity(email)}>
        <Trophy className="w-[20px] h-[20px]" />
        <span className="text-[14px]" style={FONT_BLACK}>View Opportunity</span>
      </button>
    )
  }

  // Shortlist
  if (email.actionType === 'open_shortlist') {
    return (
      <button
        className={primaryBtn}
        onClick={() => {
          const shortlistId = email.actionData?.shortlistId as string
          if (shortlistId) {
            const { setPendingShortlistId } = useCareerStore.getState()
            setPendingShortlistId(shortlistId)
            navigate('/staff-market')
          }
        }}
      >
        <Users className="w-[20px] h-[20px]" />
        <span className="text-[14px]" style={FONT_BLACK}>Open Shortlist</span>
      </button>
    )
  }

  // Merchandise proposals
  if (email.actionType === 'merchandise_proposal_product' || email.actionType === 'merchandise_proposal_collection') {
    const isProduct = email.actionType === 'merchandise_proposal_product'
    return (
      <>
        <button
          className={primaryBtn}
          onClick={() => {
            const proposalId = email.actionData?.proposalId as string
            if (!proposalId) return
            const store = useCareerStore.getState()
            if (isProduct) {
              const result = store.approveMerchandiseProductProposal(proposalId)
              addToast({ type: result.success ? 'success' : 'error', message: result.success ? 'Approved!' : (result.error ?? 'Failed'), duration: 3000 })
            } else {
              const result = store.approveMerchandiseCollectionProposal(proposalId)
              addToast({ type: result.success ? 'success' : 'error', message: result.success ? 'Collection approved!' : (result.error ?? 'Failed'), duration: 3000 })
            }
            if (isProduct || !isProduct) onArchive(email)
          }}
        >
          <Check className="w-[20px] h-[20px]" />
          <span className="text-[14px]" style={FONT_BLACK}>Approve</span>
        </button>
        <button
          className={secondaryBtn}
          onClick={() => {
            const proposalId = email.actionData?.proposalId as string
            if (proposalId) {
              const store = useCareerStore.getState()
              store.rejectMerchandiseProposal(proposalId, isProduct ? 'product' : 'collection')
              addToast({ type: 'info', message: 'Proposal rejected', duration: 3000 })
              onArchive(email)
            }
          }}
        >
          <X className="w-[20px] h-[20px] text-[#0a0a0a]" />
          <span className="text-[14px] text-[#0a0a0a]" style={FONT_BLACK}>Reject</span>
        </button>
      </>
    )
  }

  // Auto-schedule
  if (email.actionType === 'auto_schedule') {
    return (
      <>
        <button
          className={primaryBtn}
          onClick={() => {
            const suggestions = email.actionData?.suggestions as ScheduleSuggestion[] | undefined
            if (suggestions && suggestions.length > 0 && careerState) {
              const { scheduleActivity } = useCareerStore.getState()
              const count = applyAutoScheduleToStore(suggestions, careerState.currentWeek, scheduleActivity)
              addToast({ type: 'success', message: `${count} activities scheduled`, duration: 3000 })
              onArchive(email)
            }
          }}
        >
          <CalendarCheck className="w-[20px] h-[20px]" />
          <span className="text-[14px]" style={FONT_BLACK}>Auto-Schedule</span>
        </button>
        <button className={secondaryBtn} onClick={() => onArchive(email)}>
          <X className="w-[20px] h-[20px] text-[#0a0a0a]" />
          <span className="text-[14px] text-[#0a0a0a]" style={FONT_BLACK}>I'll Plan Myself</span>
        </button>
      </>
    )
  }

  // Delegation approval
  if (email.actionType === 'delegation_approval') {
    return (
      <>
        <button
          className={primaryBtn}
          onClick={() => {
            const approvalId = email.actionData?.delegationApprovalId as string
            if (approvalId) {
              const { approveDelegationAction } = useCareerStore.getState()
              const success = approveDelegationAction(approvalId)
              addToast({
                type: success ? 'success' : 'error',
                message: success ? 'Staff action approved' : 'Approval may have expired',
                duration: 3000,
              })
              if (success) onArchive(email)
            }
          }}
        >
          <Check className="w-[20px] h-[20px]" />
          <span className="text-[14px]" style={FONT_BLACK}>Approve</span>
        </button>
        <button
          className={secondaryBtn}
          onClick={() => {
            const approvalId = email.actionData?.delegationApprovalId as string
            if (approvalId) {
              const { declineDelegationAction } = useCareerStore.getState()
              declineDelegationAction(approvalId)
              addToast({ type: 'info', message: 'Staff notified — action declined', duration: 3000 })
              onArchive(email)
            }
          }}
        >
          <X className="w-[20px] h-[20px] text-[#0a0a0a]" />
          <span className="text-[14px] text-[#0a0a0a]" style={FONT_BLACK}>Decline</span>
        </button>
      </>
    )
  }

  return null
}
