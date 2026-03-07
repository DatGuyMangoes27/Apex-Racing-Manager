import { useState, useMemo, useCallback, useEffect, useRef, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Phone as PhoneIcon, Heart, Users, Star, Search, Send, Image, Smile, ChevronLeft, MoreVertical, Check, Clock, X, Gift, Settings, Sparkles, CheckCheck, MessageSquare, MapPin, Calendar, Briefcase, Shield, Trophy, Handshake, Building2, LogOut, Camera, UtensilsCrossed, Mountain, Baby, Dumbbell, Dog, PartyPopper, Wrench } from 'lucide-react'
import { PortraitImage } from '@/components/ui'
import { PhoneFrame, PhoneChatHeader, MessageBubble as PhoneMessageBubble, TypingIndicator, ChatListItem, ChatWallpaper } from '@/components/ui/PhoneFrame'
import { useCareerStore } from '@/store/careerStore'
import { formatGameHour, getRelativeDayLabel, getConversationListTimestamp, DAY_PERIODS, DAY_PERIOD_ORDER, type DayPeriod } from '@/data/day-periods-config'
import { getActivityTimeCost } from '@/data/activity-time-costs'
import type { ActivityCategory } from '@/store/careerStore'
import type { ContactInfo, PotentialDate } from '@/types/personalLife'
import { createDefaultMessagingState } from '@/types/personalLife'
import type { MessageChoice, Conversation, TextMessage } from '@/data/messaging-config'
import { MESSAGING_CONFIG, SESSION_FAREWELL_TEMPLATES } from '@/data/messaging-config'
import { syncAutomaticContacts, getContactPortrait, syncGroupChats, buildSocialGraph, calculateContactOnlineStatus, createConversation } from '@/services/contactService'
import { generateMessageChoices, generateNpcResponse, isDialogueAIAvailable, buildDialogueContext, analyzeMessageForInvitation } from '@/services/dialogueAI'
import { SOCIAL_ACTIONS, SOCIAL_ACTION_CATEGORIES, getGroupedActionsForContact, getCombinedBonusMultiplier, getLoveLanguageMultiplier, getInterestBonusMultiplier, type SocialAction, type SocialActionCategory } from '@/data/social-actions-config'
import { usePersonalLifeActions } from '@/hooks/usePersonalLifeActions'
import type { ContactRequestType } from '@/types/personalLife'

const _FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const _FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const _FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const _CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'

// Contact type alias for UI (same as ContactInfo but with mood property)
type Contact = ContactInfo & { mood?: ContactInfo['currentMood'] }

// Convert ContactInfo to Contact (UI type)
function contactInfoToContact(contact: ContactInfo): Contact {
  return {
    ...contact,
    mood: contact.currentMood
  }
}

function contactToContactInfo(contact: any): ContactInfo & { pregenId?: string } {
  return {
    id: contact.id,
    name: contact.name,
    type: contact.type,
    portraitId: contact.portraitId,
    gender: contact.gender,
    traits: contact.traits,
    relationshipLevel: contact.relationshipLevel,
    affectionMeter: contact.affectionMeter,
    romanceMeter: contact.romanceMeter,
    trustMeter: contact.trustMeter,
    currentMood: contact.mood,
    isOnline: contact.isOnline,
    isFavorite: contact.isFavorite,
    metAt: contact.metAt,
    metWeek: contact.metWeek,
    metYear: contact.metYear,
    datingStatus: contact.datingStatus,
    pregenId: contact.pregenId,
  }
}

function _getLastSeenText(lastMessageTime?: { week: number; day: number; year: number }, currentWeek?: number, currentYear?: number): string {
  if (!lastMessageTime || !currentWeek || !currentYear) return 'Never'
  
  const weekDiff = (currentYear - lastMessageTime.year) * 52 + (currentWeek - lastMessageTime.week)
  
  if (weekDiff === 0) return 'Today'
  if (weekDiff === 1) return 'Last week'
  if (weekDiff < 4) return `${weekDiff} weeks ago`
  if (weekDiff < 52) return `${Math.floor(weekDiff / 4)} months ago`
  return 'Over a year ago'
}

type SuggestedMessageActivity = {
  type: ContactRequestType
  eventName: string
  description: string
  timeCost?: number
  suggestedDay?: number
  suggestedWeek?: number
}

const VALID_REQUEST_TYPES: ContactRequestType[] = [
  'social_invite',
  'dinner_invite',
  'date_request',
  'media_request',
  'sponsor_appearance',
  'charity_ask',
  'introduction',
  'race_tickets',
  'advice',
  'career_favor',
]

function inferSuggestedDayAndWeek(
  text: string,
  currentDay: number,
  currentWeek: number
): { suggestedDay?: number; suggestedWeek?: number } {
  const dayMap: Record<string, number> = {
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7
  }
  const dayMatch = text.match(/\b(this|next|on)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)
  if (!dayMatch) return {}

  const prefix = (dayMatch[1] || '').toLowerCase()
  const dayName = dayMatch[2].toLowerCase()
  const suggestedDay = dayMap[dayName]
  if (!suggestedDay) return {}

  let suggestedWeek = currentWeek
  if (prefix === 'next') {
    suggestedWeek = currentWeek + 1
  } else if (suggestedDay <= currentDay) {
    // If the proposed day already passed this week, carry it to next week.
    suggestedWeek = currentWeek + 1
  }

  return { suggestedDay, suggestedWeek }
}

function parseSuggestedActivityFromMessage(
  content: string,
  contactName: string,
  contactType: Contact['type'],
  currentDay: number,
  currentWeek: number
): SuggestedMessageActivity | null {
  const text = (content || '').trim()
  if (!text || text.length < 16) return null
  const lc = text.toLowerCase()

  // Gating phrases reduce accidental detection on generic chat.
  const hasInviteIntent = [
    /how about we/i,
    /\blet'?s\b/i,
    /\bwant to\b/i,
    /\bwanna\b/i,
    /\bwe should\b/i,
    /\bgo\b/i,
    /\bjoin me\b/i,
    /\bthis weekend\b/i,
  ].some((r) => r.test(lc))
  if (!hasInviteIntent) return null

  const firstName = contactName.split(' ')[0] || 'them'
  const timing = inferSuggestedDayAndWeek(lc, currentDay, currentWeek)

  if (/\bcycling|bike|biking|ride\b/i.test(lc)) {
    return {
      type: 'social_invite',
      eventName: `Cycling with ${firstName}`,
      description: `${firstName} suggested going cycling together.`,
      timeCost: 3,
      ...timing,
    }
  }
  if (/\bhike|hiking|trail|walk\b/i.test(lc)) {
    return {
      type: 'social_invite',
      eventName: `Outdoor walk with ${firstName}`,
      description: `${firstName} suggested an outdoor walk or hike.`,
      timeCost: 2,
      ...timing,
    }
  }
  if (/\bdinner|lunch|brunch|coffee|cafe|restaurant|meal\b/i.test(lc)) {
    return {
      type: contactType === 'partner' ? 'date_request' : 'dinner_invite',
      eventName: `${contactType === 'partner' ? 'Date' : 'Meal'} with ${firstName}`,
      description: `${firstName} invited you to meet for food/drinks.`,
      timeCost: 2,
      ...timing,
    }
  }
  if (/\bmovie|cinema|concert|show|weekend\b/i.test(lc)) {
    return {
      type: contactType === 'partner' ? 'date_request' : 'social_invite',
      eventName: `Weekend outing with ${firstName}`,
      description: `${firstName} suggested a weekend outing together.`,
      timeCost: 3,
      ...timing,
    }
  }

  // Generic fallback for intentful "let's do X" style messages.
  return {
    type: contactType === 'partner' ? 'date_request' : 'social_invite',
    eventName: `Plans with ${firstName}`,
    description: `${firstName} suggested meeting up.`,
    timeCost: 2,
    ...timing,
  }
}

function toSuggestedActivityFromAIResult(
  aiResult: Awaited<ReturnType<typeof analyzeMessageForInvitation>>,
  contactName: string,
  contactType: Contact['type']
): SuggestedMessageActivity | null {
  if (!aiResult || !aiResult.isInvitation) return null
  const reqType = (aiResult.type || 'social_invite') as ContactRequestType
  const safeType: ContactRequestType = VALID_REQUEST_TYPES.includes(reqType) ? reqType : 'social_invite'
  const firstName = contactName.split(' ')[0] || 'them'
  return {
    type: safeType,
    eventName: aiResult.eventName || `${contactType === 'partner' ? 'Date' : 'Plans'} with ${firstName}`,
    description: aiResult.description || `${firstName} suggested making plans together.`,
    timeCost: aiResult.timeCost ?? 2,
    suggestedDay: aiResult.suggestedDay ?? undefined,
    suggestedWeek: aiResult.suggestedWeek ?? undefined,
  }
}

// ============================================
// SUB-COMPONENTS
// ============================================

function ContactListItem({ 
  contact, 
  conversation,
  isSelected,
  onClick 
}: { 
  contact: Contact
  conversation?: Conversation
  isSelected: boolean
  onClick: () => void 
}) {
  const unreadCount = conversation?.unreadCount || 0
  const lastMessage = useMemo(() => {
    if (!conversation?.messages?.length) return undefined
    const score = (msg: TextMessage) => {
      const ts = msg.timestamp || ({} as any)
      return ((ts.year ?? 0) * 100000000) + ((ts.week ?? 0) * 1000000) + ((ts.day ?? 0) * 10000) + Math.round((ts.hour ?? 0) * 100)
    }
    return conversation.messages.reduce((latest, current) => (score(current) >= score(latest) ? current : latest), conversation.messages[0])
  }, [conversation?.messages])
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        p-3 rounded-xl cursor-pointer transition-colors
        ${isSelected 
          ? 'bg-racing-red/20 border border-racing-red/40' 
          : 'bg-surface-dark/30 hover:bg-surface-dark/50 border border-transparent'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <PortraitImage
            src={getContactPortrait(contactToContactInfo(contact))}
            name={contact.name}
            size="lg"
          />
          {contact.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-surface-darker" />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary truncate">{contact.name}</span>
            {contact.isFavorite && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
            {contact.type === 'partner' && <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />}
          </div>
          {lastMessage && (
            <p className="text-xs text-text-muted truncate">
              {lastMessage.sender === 'player' && <span className="text-text-secondary">You: </span>}
              {lastMessage.hasPhoto && <Image className="w-3 h-3 inline mr-1 opacity-60" />}
              {lastMessage.hasPhoto ? (lastMessage.photoCaption || lastMessage.content || 'Photo') : lastMessage.content}
            </p>
          )}
        </div>
        
        {/* Status */}
        <div className="flex flex-col items-end gap-1">
          {unreadCount > 0 && (
            <span className="min-w-[20px] text-center bg-[#ef4444] text-white text-[11px] font-bold px-[6px] py-[2px] rounded-full">
              {unreadCount}
            </span>
          )}
          <span className="text-xs text-text-muted">{contact.lastSeen}</span>
        </div>
      </div>
    </motion.div>
  )
}

/** Icon and gradient for placeholder photo categories (when no AI image available) */
const PHOTO_PLACEHOLDER_STYLES: Record<string, { icon: typeof Camera; gradient: string; label: string }> = {
  selfie:        { icon: Camera,            gradient: 'from-pink-600/40 to-purple-600/40',   label: 'Selfie' },
  scenery:       { icon: Mountain,          gradient: 'from-emerald-600/40 to-cyan-600/40',  label: 'Photo' },
  kids:          { icon: Baby,              gradient: 'from-amber-500/40 to-orange-500/40',  label: 'Photo' },
  food:          { icon: UtensilsCrossed,   gradient: 'from-red-600/40 to-orange-500/40',    label: 'Photo' },
  activity:      { icon: Dumbbell,          gradient: 'from-blue-600/40 to-indigo-500/40',   label: 'Photo' },
  couple_memory: { icon: Heart,             gradient: 'from-rose-600/40 to-pink-500/40',     label: 'Memory' },
  pet:           { icon: Dog,               gradient: 'from-amber-600/40 to-yellow-500/40',  label: 'Photo' },
  work:          { icon: Wrench,            gradient: 'from-slate-600/40 to-zinc-500/40',    label: 'Photo' },
  event:         { icon: PartyPopper,       gradient: 'from-violet-600/40 to-fuchsia-500/40',label: 'Photo' },
  race_day:      { icon: Trophy,            gradient: 'from-racing-red/40 to-orange-600/40', label: 'Race Day' },
}

function PhotoMessageImage({ message }: { message: TextMessage }) {
  const [expanded, setExpanded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const hasRealImage = message.photoUrl && !imgError

  if (hasRealImage) {
    return (
      <>
        <div
          className="relative cursor-pointer overflow-hidden rounded-lg mb-1.5 -mx-1.5 -mt-1"
          onClick={() => setExpanded(true)}
        >
          <img
            src={message.photoUrl}
            alt={message.photoCaption || 'Photo'}
            className="w-full max-h-[220px] object-cover rounded-lg"
            onError={() => setImgError(true)}
          />
          {/* Subtle overlay gradient at bottom for readability */}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/20 to-transparent rounded-b-lg" />
        </div>

        {/* Lightbox / expanded view */}
        {expanded && (
          <div
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setExpanded(false)}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={message.photoUrl}
              alt={message.photoCaption || 'Photo'}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
            <button
              className="absolute top-6 right-6 text-white/80 hover:text-white"
              onClick={() => setExpanded(false)}
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        )}
      </>
    )
  }

  // Themed placeholder when no real image
  const category = message.photoCategory || 'scenery'
  const style = PHOTO_PLACEHOLDER_STYLES[category] || PHOTO_PLACEHOLDER_STYLES.scenery
  const PlaceholderIcon = style.icon

  return (
    <div className={`
      flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-lg mb-1.5 -mx-1.5 -mt-1
      bg-gradient-to-br ${style.gradient}
    `}>
      <PlaceholderIcon className="w-8 h-8 opacity-60" />
      <span className="text-xs opacity-50">{style.label}</span>
    </div>
  )
}

function MessageBubble({ message, isPlayer }: { message: TextMessage; isPlayer: boolean }) {
  const isPhotoMessage = message.hasPhoto

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isPlayer ? 'justify-end' : 'justify-start'}`}
    >
      <div 
        className={`
          max-w-[75%] rounded-2xl
          ${isPhotoMessage ? 'px-2.5 pt-1.5 pb-2' : 'px-4 py-2.5'}
          ${isPlayer 
            ? 'bg-blue-600 text-white rounded-br-md' 
            : 'bg-surface-dark text-text-primary rounded-bl-md'
          }
        `}
      >
        {/* Photo attachment */}
        {isPhotoMessage && <PhotoMessageImage message={message} />}

        {/* Message text / caption */}
        <div className={isPhotoMessage ? 'px-1.5' : ''}>
          <p className="text-sm whitespace-pre-wrap">
            {message.photoCaption || message.content}
          </p>
          <div className={`flex items-center gap-1 mt-1 ${isPlayer ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] opacity-60">
              {formatGameHour(message.timestamp.hour)}
            </span>
            {isPlayer && (
              message.isRead 
                ? <CheckCheck className="w-3 h-3 opacity-60" />
                : <Check className="w-3 h-3 opacity-60" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/** WhatsApp-style date separator pill between messages from different days */
function DateSeparator({ week, day, year, currentWeek, currentDay, currentYear }: {
  week: number; day: number; year: number
  currentWeek: number; currentDay: number; currentYear: number
}) {
  const label = getRelativeDayLabel(week, day, year, currentWeek, currentDay, currentYear)
  return (
    <div className="flex justify-center my-3">
      <span className="px-3 py-1 rounded-full bg-[#1d2b36]/80 text-[11px] text-[#8696a0] shadow-sm">
        {label}
      </span>
    </div>
  )
}

function AffectionMeters({ contact }: { contact: Contact }) {
  return (
    <div className="space-y-2">
      {/* Affection */}
      <div className="flex items-center gap-2">
        <Smile className="w-4 h-4 text-pink-400" />
        <div className="flex-1 h-2 bg-surface-darker rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-pink-500 to-pink-400"
            initial={{ width: 0 }}
            animate={{ width: `${contact.affectionMeter}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-xs text-text-muted w-8">{contact.affectionMeter}%</span>
      </div>
      
      {/* Romance (if romantic contact) */}
      {contact.type === 'partner' && (
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-400" />
          <div className="flex-1 h-2 bg-surface-darker rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-red-500 to-red-400"
              initial={{ width: 0 }}
              animate={{ width: `${contact.romanceMeter}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
          </div>
          <span className="text-xs text-text-muted w-8">{contact.romanceMeter}%</span>
        </div>
      )}
      
      {/* Trust */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-400" />
        <div className="flex-1 h-2 bg-surface-darker rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
            initial={{ width: 0 }}
            animate={{ width: `${contact.trustMeter}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>
        <span className="text-xs text-text-muted w-8">{contact.trustMeter}%</span>
      </div>
    </div>
  )
}

// Compact meters for the session info bar
function AffectionMetersCompact({ contact }: { contact: Contact }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1" title={`Affection: ${contact.affectionMeter}%`}>
        <Smile className="w-3 h-3 text-pink-400" />
        <div className="w-10 h-1.5 bg-surface-darker rounded-full overflow-hidden">
          <div className="h-full bg-pink-400 transition-all" style={{ width: `${contact.affectionMeter}%` }} />
        </div>
      </div>
      {(contact.type === 'partner' || contact.type === 'potential_date') && (
        <div className="flex items-center gap-1" title={`Romance: ${contact.romanceMeter}%`}>
          <Heart className="w-3 h-3 text-red-400" />
          <div className="w-10 h-1.5 bg-surface-darker rounded-full overflow-hidden">
            <div className="h-full bg-red-400 transition-all" style={{ width: `${contact.romanceMeter}%` }} />
          </div>
        </div>
      )}
      <div className="flex items-center gap-1" title={`Trust: ${contact.trustMeter}%`}>
        <Shield className="w-3 h-3 text-blue-400" />
        <div className="w-10 h-1.5 bg-surface-darker rounded-full overflow-hidden">
          <div className="h-full bg-blue-400 transition-all" style={{ width: `${contact.trustMeter}%` }} />
        </div>
      </div>
    </div>
  )
}

// ── Intent tag display config ──
// Uses opaque dark-tinted backgrounds so pills are always readable on any gradient button.
const INTENT_TAG_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  flirting:        { label: 'Flirting',        icon: '💋', color: 'bg-pink-900 text-pink-200 border border-pink-400/60' },
  romance:         { label: 'Romance',         icon: '❤️', color: 'bg-red-900 text-red-200 border border-red-400/60' },
  friendly:        { label: 'Friendly',        icon: '😊', color: 'bg-green-900 text-green-200 border border-green-500/50' },
  supportive:      { label: 'Support',         icon: '🤗', color: 'bg-blue-900 text-blue-200 border border-blue-500/50' },
  professional:    { label: 'Business',        icon: '💼', color: 'bg-slate-800 text-slate-200 border border-slate-500/50' },
  banter:          { label: 'Banter',          icon: '😏', color: 'bg-purple-900 text-purple-200 border border-purple-500/50' },
  confrontational: { label: 'Confrontation',   icon: '⚡', color: 'bg-orange-900 text-orange-200 border border-orange-500/50' },
  apologetic:      { label: 'Apology',         icon: '🙏', color: 'bg-amber-900 text-amber-200 border border-amber-500/50' },
  planning:        { label: 'Plans',           icon: '📅', color: 'bg-cyan-900 text-cyan-200 border border-cyan-500/50' },
  curious:         { label: 'Curious',         icon: '🤔', color: 'bg-indigo-900 text-indigo-200 border border-indigo-500/50' },
  news:            { label: 'News',            icon: '📰', color: 'bg-teal-900 text-teal-200 border border-teal-500/50' },
  decline:         { label: 'Decline',         icon: '🙅', color: 'bg-zinc-800 text-zinc-200 border border-zinc-500/50' },
}

/** Derive an intentTag when missing (e.g. old cached choices). */
function deriveIntentTag(choice: MessageChoice): string {
  if (choice.intentTag) return choice.intentTag
  const cat = choice.category as string
  const tone = choice.tone as string
  if (cat === 'flirt' || tone === 'flirty') return 'flirting'
  if (cat === 'romantic' || tone === 'romantic') return 'romance'
  if (cat === 'support' || tone === 'supportive') return 'supportive'
  if (cat === 'apology' || tone === 'apologetic') return 'apologetic'
  if (cat === 'tease' || tone === 'playful') return 'banter'
  if (tone === 'confrontational') return 'confrontational'
  if (tone === 'professional') return 'professional'
  if (cat === 'decline') return 'decline'
  if (cat === 'invitation' || cat === 'make_plans') return 'planning'
  if (cat === 'question' || cat === 'check_in') return 'curious'
  if (cat === 'share_news') return 'news'
  return 'friendly'
}

function MessageChoiceWheel({ 
  choices, 
  onSelect,
  isLoading 
}: { 
  choices: MessageChoice[]
  onSelect: (choice: MessageChoice) => void
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-text-muted">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span>Generating responses...</span>
        </div>
      </div>
    )
  }
  
  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'romantic': return 'from-pink-600 to-pink-500'
      case 'flirty': return 'from-rose-600 to-rose-500'
      case 'friendly': return 'from-green-600 to-green-500'
      case 'supportive': return 'from-blue-600 to-blue-500'
      case 'excited': return 'from-yellow-600 to-yellow-500'
      case 'playful': return 'from-purple-600 to-purple-500'
      case 'casual': return 'from-slate-600 to-slate-500'
      default: return 'from-racing-red to-racing-orange'
    }
  }
  
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'risky': return (
        <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-900 text-yellow-300 border border-yellow-500/60 whitespace-nowrap">
          ⚠ Risky
        </span>
      )
      case 'bold': return (
        <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-900 text-red-300 border border-red-400/60 whitespace-nowrap">
          🔥 Bold
        </span>
      )
      default: return null
    }
  }
  
  const getIntentTag = (choice: MessageChoice) => {
    const tag = deriveIntentTag(choice)
    const config = INTENT_TAG_CONFIG[tag] || INTENT_TAG_CONFIG.friendly
    return { tag, ...config }
  }
  
  return (
    <div className="space-y-2">
      {choices.map((choice, index) => {
        const intent = getIntentTag(choice)
        const isRomantic = intent.tag === 'flirting' || intent.tag === 'romance'
        
        return (
          <motion.button
            key={choice.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(choice)}
            className={`
              w-full p-3 rounded-xl text-left transition-all
              bg-gradient-to-r ${getToneColor(choice.tone)} hover:shadow-lg
              ${isRomantic ? 'ring-1 ring-pink-300/40' : ''}
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Intent tag pill */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${intent.color}`}>
                    <span>{intent.icon}</span>
                    <span>{intent.label}</span>
                  </span>
                  {getRiskBadge(choice.riskLevel)}
                </div>
                <p className="font-medium text-white text-sm">{choice.preview}</p>
                <p className="text-xs text-white/70 mt-0.5">{choice.fullMessage}</p>
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

function ConversationView({
  contact,
  conversation,
  onBack,
  playerName,
  responsePortalId
}: {
  contact: Contact
  conversation: Conversation
  onBack: () => void
  playerName: string
  responsePortalId?: string
}) {
  const { player, careerState, addMessage, sendPlayerMessageAndQueueReply, deliverPendingNpcReply, getConversationNpcTyping, cacheMessageChoices, clearCachedChoices, markConversationRead, updateConversationSession, updateRelationshipMeters, sendGift, sendDateInvite, consumeHoursFromBudget } = useCareerStore()
  const { executeSocialAction, scheduleSocialAction } = usePersonalLifeActions()
  const [messageChoices, setMessageChoices] = useState<MessageChoice[]>([])
  const [isLoadingChoices, setIsLoadingChoices] = useState(false)
  const [showSocialActions, setShowSocialActions] = useState(false)
  
  // Get messages from store conversation
  const storeConversation = careerState?.messaging?.conversations[conversation.id]
  const messages = storeConversation?.messages || conversation.messages
  const isMessageVisibleNow = useCallback((msg?: TextMessage) => {
    if (!msg?.timestamp) return true
    const ts = msg.timestamp
    const nowYear = careerState?.currentYear ?? 2024
    const nowWeek = careerState?.currentWeek ?? 1
    const nowDay = careerState?.currentDay ?? 1
    const nowHour = careerState?.dayBudget?.currentHour ?? 7
    const msgYear = ts.year ?? nowYear
    const msgWeek = ts.week ?? nowWeek
    const msgDay = ts.day ?? nowDay
    const msgHour = ts.hour ?? 0
    const messageDisplayHour = Math.floor(msgHour)

    if (msgYear < nowYear) return true
    if (msgYear > nowYear) return false
    if (msgWeek < nowWeek) return true
    if (msgWeek > nowWeek) return false
    if (msgDay < nowDay) return true
    if (msgDay > nowDay) return false
    return messageDisplayHour <= nowHour
  }, [careerState?.currentYear, careerState?.currentWeek, careerState?.currentDay, careerState?.dayBudget?.currentHour])
  const orderedMessages = useMemo(() => {
    const scoreMessageTime = (msg: any): number => {
      const ts = msg?.timestamp || {}
      const year = ts.year ?? 0
      const week = ts.week ?? 0
      const day = ts.day ?? 0
      const hour = ts.hour ?? 0
      return (year * 100000000) + (week * 1000000) + (day * 10000) + Math.round(hour * 100)
    }

    const indexed = messages.map((msg: any, index: number) => ({ msg, index }))
    const firstScore = indexed.length > 0 ? scoreMessageTime(indexed[0].msg) : 0
    const lastScore = indexed.length > 0 ? scoreMessageTime(indexed[indexed.length - 1].msg) : 0
    const sourceLooksNewestFirst = firstScore > lastScore

    // Normalize timeline order so mixed legacy insertion patterns still render correctly.
    // When timestamps are identical, preserve a chronology-aware insertion order instead of
    // using lexicographic id sorting (which can mis-order true reply flow).
    return indexed.sort((a: any, b: any) => {
      const timeDiff = scoreMessageTime(a.msg) - scoreMessageTime(b.msg)
      if (timeDiff !== 0) return timeDiff
      return sourceLooksNewestFirst ? b.index - a.index : a.index - b.index
    }).map((entry: any) => entry.msg)
  }, [messages])
  const visibleOrderedMessages = useMemo(
    () => orderedMessages.filter(m => isMessageVisibleNow(m)),
    [orderedMessages, isMessageVisibleNow]
  )
  const visibleUnreadCount = useMemo(
    () => visibleOrderedMessages.filter((m: any) => m?.sender !== 'player' && !(m?.isRead || m?.read)).length,
    [visibleOrderedMessages]
  )
  const displayMessages = useMemo(() => [...visibleOrderedMessages].reverse(), [visibleOrderedMessages])
  
  const currentWeek = careerState?.currentWeek ?? 1
  const _currentDay = careerState?.currentDay ?? 1
  const _currentYear = careerState?.currentYear ?? 2024
  
  // ── Build game state for AI context (shared between loadChoices and handleSendMessage) ──
  const gameStateForAI = useMemo(() => ({
    player: {
      firstName: player?.firstName || 'Player',
      lastName: player?.lastName || '',
      mentalState: player?.mentalState || { stress: 30 },
      health: player?.health ? { injuryState: player.health.injured ? { type: player.health.injuryType, severity: player.health.injuryType, recoveryWeeksRemaining: player.health.recoveryWeeks } : undefined } : undefined,
      reputation: player?.reputation || 50,
      raceHistory: (player?.raceHistory || []).map(r => ({ position: (r as any).position ?? (r as any).finishPosition ?? 0, trackName: (r as any).trackName, seriesName: (r as any).seriesName, dnf: (r as any).dnf, fastestLap: (r as any).fastestLap, wetRace: (r as any).wetRace, week: (r as any).week ?? 0, year: (r as any).year ?? 0 })),
      totalWins: player?.totalWins || 0,
      totalPodiums: player?.totalPodiums || 0,
      consecutiveWins: player?.consecutiveWins || 0,
      consecutivePodiums: player?.consecutivePodiums || 0,
      totalFastestLaps: player?.totalFastestLaps || 0,
      championships: player?.championships || 0,
    },
    currentWeek,
    currentYear: _currentYear,
    currentDay: _currentDay,
    nextRaceWeek: careerState?.nextRaceWeek,
    nextRaceTrack: careerState?.nextRaceTrack,
    seasonCompleted: careerState?.seasonCompleted,
    ownedTeam: careerState?.ownedTeam ? {
      name: careerState.ownedTeam.name,
      tier: careerState.ownedTeam.tier as string,
      boardMood: careerState.ownedTeam.boardMood,
      teamMorale: careerState.ownedTeam.teamMorale,
      staff: (careerState.ownedTeam.staff || []).map(s => ({ name: s.name, role: s.role })),
      facilityStaff: (careerState.ownedTeam.facilityStaff || []).map(s => ({ name: s.name, role: s.role })),
      finances: { cash: (careerState.ownedTeam.finances as any)?.cash ?? (careerState.ownedTeam.finances as any)?.bankBalance ?? 0, weeklyBurnRate: (careerState.ownedTeam.finances as any)?.weeklyBurnRate },
      budgets: careerState.ownedTeam.budgets ? { costCapSpend: (careerState.ownedTeam.budgets as any)?.costCapSpend, costCapLimit: (careerState.ownedTeam.budgets as any)?.costCapLimit } : undefined,
    } : null,
    seriesEntries: careerState?.seriesEntries?.map(e => ({
      seriesId: e.seriesId,
      seriesName: (e as any).seriesName,
      standings: (e as any).standings,
    })),
    personalLife: careerState?.personalLife ? {
      partner: careerState.personalLife.partner ? {
        firstName: careerState.personalLife.partner.firstName,
        lastName: careerState.personalLife.partner.lastName,
        happiness: (careerState.personalLife.partner as any).happiness ?? 70,
        relationshipStatus: (careerState.personalLife.partner as any).relationshipStatus,
      } : undefined,
      children: (careerState.personalLife.children || []).map(c => ({ firstName: c.firstName, age: c.age })),
      messaging: careerState.messaging ? { contacts: careerState.messaging.contacts.map(c => ({ id: c.id })) } : undefined,
      lifestyleLevel: careerState.personalLife.lifestyleLevel ? { tier: careerState.personalLife.lifestyleLevel.tier } : undefined,
      rivalries: (careerState.personalLife.rivalries || []).map(r => ({ rivalName: (r as any).rivalName || '', intensity: (r as any).intensity || 50, isActive: (r as any).isActive ?? true })),
      scandals: (careerState.personalLife.scandals || []).map(s => ({ type: (s as any).type || '', isResolved: (s as any).isResolved ?? false, publicKnowledge: (s as any).publicKnowledge ?? false })),
      foundations: (careerState.personalLife.foundations || []).map(f => ({ name: f.name, cause: (f as any).cause || '' })),
    } : undefined,
    socialPosts: careerState?.socialPosts?.slice(-10),
    socialMediaState: careerState?.socialMediaState ? { totalFollowers: (careerState.socialMediaState as any).totalFollowers ?? (careerState.socialMediaState as any).followers } : undefined,
    pressClippings: careerState?.pressClippings?.slice(-5),
    boardTargets: careerState?.boardTargets?.map(t => ({ description: (t as any).description || '', progress: (t as any).progress })),
  }), [player, careerState, currentWeek, _currentYear, _currentDay])
  
  // Mark conversation as read on mount
  useEffect(() => {
    if (visibleUnreadCount > 0) {
      markConversationRead(conversation.id)
    }
  }, [conversation.id, visibleUnreadCount, markConversationRead])
  
  // ── Time cost & session tracking ──
  // Reset exchanges if the game day changed since last exchange
  const currentGameDay = careerState?.currentDay ?? 1
  const currentGameWeek = careerState?.currentWeek ?? 1
  const lastExchangeDay = storeConversation?.lastExchangeDay
  const isDifferentDay = lastExchangeDay !== undefined && lastExchangeDay !== currentGameDay
  const initialExchanges = isDifferentDay ? 0 : (storeConversation?.exchangesToday || 0)
  
  const [exchangeCount, setExchangeCount] = useState(initialExchanges)
  const [isNpcTyping, setIsNpcTyping] = useState(false)
  const maxExchanges = MESSAGING_CONFIG.maxExchangesPerSession
  const timeCostPerExchange = MESSAGING_CONFIG.timeCostPerExchange
  
  // Reset exchange count when game day changes (e.g., player advanced the day while chat was open)
  useEffect(() => {
    if (isDifferentDay && exchangeCount > 0) {
      setExchangeCount(0)
      updateConversationSession(conversation.id, { exchangesToday: 0, lastExchangeDay: currentGameDay })
    }
  }, [currentGameDay, isDifferentDay, exchangeCount, conversation.id, updateConversationSession])
  
  // Check if player has enough time budget (if budget system exists)
  const hoursRemaining = careerState?.dayBudget?.hoursRemaining ?? 16
  const canAffordExchange = hoursRemaining >= timeCostPerExchange
  const sessionLimitReached = exchangeCount >= maxExchanges
  
  // Guard ref to prevent concurrent AI generation calls (prevents the "refresh 3 times" issue)
  const isGeneratingRef = useRef(false)
  const lastGeneratedForMsgId = useRef<string>('')
  
  // Stable reference to the last message ID (avoids dependency on full messages array)
  const lastMsgId = visibleOrderedMessages.length > 0 ? visibleOrderedMessages[visibleOrderedMessages.length - 1]?.id : '__empty__'
  
  // Generate message choices using full game-state context (with caching)
  const loadChoices = useCallback(async () => {
    if (sessionLimitReached) return  // Don't load choices if session ended
    if (isGeneratingRef.current) return  // Already generating — skip
    
    // ── Check cached choices first to avoid regeneration on refresh ──
    const cached = storeConversation?.cachedChoices
    if (cached && cached.afterMessageId === lastMsgId) {
      // Cache is still valid (no new messages since generation)
      const sameDayGenerated = cached.generatedForDay &&
        cached.generatedForDay.week === (careerState?.currentWeek ?? 1) &&
        cached.generatedForDay.day === (careerState?.currentDay ?? 1) &&
        cached.generatedForDay.year === (careerState?.currentYear ?? 2024)
      if (sameDayGenerated && cached.choices.length > 0) {
        // If cached choices are templates and the API is now available, regenerate
        const shouldRegenerate = !cached.isAIGenerated && isDialogueAIAvailable()
        if (!shouldRegenerate) {
          setMessageChoices(cached.choices as MessageChoice[])
          return
        }
      }
    }
    
    // If we already generated for this exact message, don't regenerate
    if (lastGeneratedForMsgId.current === lastMsgId) return
    
    isGeneratingRef.current = true
    setIsLoadingChoices(true)
    try {
      // Build FULL game-state-aware context (replaces hardcoded values)
      const contactInfo = contactToContactInfo(contact)
      const context = buildDialogueContext(contactInfo, storeConversation, gameStateForAI)
      
      // Check if the NPC's last message included an invitation (pending request from this contact)
      const pendingFromContact = (careerState?.messaging?.pendingRequests || []).find(
        r => r.contactId === contact.id && r.status === 'pending'
      )
      if (pendingFromContact) {
        context.lastNpcActionRequest = pendingFromContact.description || `${pendingFromContact.type}: ${pendingFromContact.eventName || 'an event'}`
      }
      
      const choices = await generateMessageChoices(context)
      setMessageChoices(choices)
      lastGeneratedForMsgId.current = lastMsgId
      
      // ── Persist to store so they survive refresh ──
      if (choices.length > 0) {
        cacheMessageChoices(conversation.id, choices, lastMsgId, isDialogueAIAvailable())
      }
    } catch (error) {
      console.error('Failed to generate choices:', error)
    } finally {
      isGeneratingRef.current = false
      setIsLoadingChoices(false)
    }
  }, [contact, gameStateForAI, sessionLimitReached, lastMsgId, storeConversation?.cachedChoices, careerState?.currentWeek, careerState?.currentDay, careerState?.currentYear, conversation.id, cacheMessageChoices])
  
  useEffect(() => {
    loadChoices()
  }, [loadChoices])
  
  // Store a pending invitation choice so the Social Actions Panel can send it after scheduling
  const [pendingInvitationChoice, setPendingInvitationChoice] = useState<MessageChoice | null>(null)
  const [planningMessageId, setPlanningMessageId] = useState<string | null>(null)

  const getDerivedSuggestionForMessage = useCallback((msg: TextMessage): SuggestedMessageActivity | null => {
    if (msg.sender === 'player') return null
    return parseSuggestedActivityFromMessage(
      msg.content || '',
      contact.name,
      contact.type,
      careerState?.currentDay ?? 1,
      careerState?.currentWeek ?? 1
    )
  }, [contact.name, contact.type, careerState?.currentDay, careerState?.currentWeek])

  const hasPendingRequestForSuggestion = useCallback((suggestion: SuggestedMessageActivity): boolean => {
    const requests = careerState?.messaging?.pendingRequests || []
    return requests.some((r: any) =>
      r.contactId === contact.id &&
      (r.status === 'pending' || r.status === 'accepted') &&
      r.type === suggestion.type &&
      r.eventName === suggestion.eventName &&
      (r.suggestedDay ?? null) === (suggestion.suggestedDay ?? null) &&
      (r.suggestedWeek ?? null) === (suggestion.suggestedWeek ?? null)
    )
  }, [careerState?.messaging?.pendingRequests, contact.id])

  const handlePlanFromMessage = useCallback(async (message: TextMessage) => {
    if (planningMessageId) return
    setPlanningMessageId(message.id)
    try {
      let suggestion = getDerivedSuggestionForMessage(message)

      // Improve accuracy with AI extraction when available.
      if (isDialogueAIAvailable() && message.content) {
        try {
          const aiParsed = await analyzeMessageForInvitation(
            message.content,
            contact.name,
            contact.type,
            careerState?.currentWeek ?? 1,
            careerState?.currentDay ?? 1
          )
          const aiSuggestion = toSuggestedActivityFromAIResult(aiParsed, contact.name, contact.type)
          if (aiSuggestion) suggestion = aiSuggestion
        } catch (err) {
          console.warn('[Phone] AI invitation parsing failed, using fallback parser:', err)
        }
      }

      if (!suggestion) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: 'Could not infer a clear activity from that message.', type: 'info' }
        }))
        return
      }

      if (hasPendingRequestForSuggestion(suggestion)) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { message: 'That plan is already in your Invitations list.', type: 'info' }
        }))
        return
      }

      const storeState = useCareerStore.getState()
      const msgState = storeState.careerState?.messaging
      if (!storeState.careerState || !msgState) return

      const newRequest = {
        id: `req_msg_manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        contactId: contact.id,
        type: suggestion.type,
        description: suggestion.description,
        timeCost: suggestion.timeCost,
        suggestedDay: suggestion.suggestedDay,
        suggestedWeek: suggestion.suggestedWeek,
        eventName: suggestion.eventName,
        relationshipReward: 5,
        expiresWeek: (storeState.careerState.currentWeek || 1) + 2,
        expiresYear: storeState.careerState.currentYear || 1,
        status: 'pending' as const,
      }

      useCareerStore.setState({
        careerState: {
          ...storeState.careerState,
          messaging: {
            ...msgState,
            pendingRequests: [...(msgState.pendingRequests || []), newRequest],
          }
        }
      })

      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: `Added "${suggestion.eventName}" to Invitations.`, type: 'success' }
      }))
    } finally {
      setPlanningMessageId(null)
    }
  }, [
    planningMessageId,
    getDerivedSuggestionForMessage,
    hasPendingRequestForSuggestion,
    contact.id,
    contact.name,
    contact.type,
    careerState?.currentWeek,
    careerState?.currentDay,
  ])

  const handleSendMessage = async (choice: MessageChoice) => {
    // Check budget & session limits
    if (sessionLimitReached || !canAffordExchange) return
    
    // If the player chose an invitation/make_plans message, open the Social Actions Panel
    // so they can pick & schedule the actual activity BEFORE the message is sent.
    // This prevents the NPC from responding before anything is scheduled.
    if (choice.category === 'invitation' || choice.category === 'make_plans') {
      setPendingInvitationChoice(choice)
      setShowSocialActions(true)
      return
    }
    
    // If the player is declining an NPC invitation via text, mark the pending request as declined
    if (choice.category === 'decline') {
      const storeState = useCareerStore.getState()
      const currentMessaging = storeState.careerState?.messaging
      if (currentMessaging) {
        const pendingFromContact = (currentMessaging.pendingRequests || []).find(
          r => r.contactId === contact.id && r.status === 'pending'
        )
        if (pendingFromContact) {
          const updatedRequests = (currentMessaging.pendingRequests || []).map(r =>
            r.id === pendingFromContact.id ? { ...r, status: 'declined' as const } : r
          )
          useCareerStore.setState({
            careerState: {
              ...storeState.careerState!,
              messaging: {
                ...currentMessaging,
                pendingRequests: updatedRequests,
              }
            }
          })
          // Small relationship penalty for declining (less than ignoring entirely)
          updateRelationshipMeters(contact.id, {
            affection: -1,
            trust: -1,
          })
          console.log(`[Phone] Player declined invitation via text from ${contact.name}`)
        }
      }
      // Send the decline message normally so the NPC can respond to it
      sendChoiceMessage(choice)
      return
    }
    
    sendChoiceMessage(choice)
  }

  // Shared helper: actually sends a message choice and queues the NPC reply
  const sendChoiceMessage = useCallback((choice: MessageChoice) => {
    // Add player message to store
    addMessage(conversation.id, {
      content: choice.fullMessage,
      isPlayer: true
    })
    
    setMessageChoices([])
    lastGeneratedForMsgId.current = ''  // Reset so choices regenerate after NPC replies
    const newCount = exchangeCount + 1
    setExchangeCount(newCount)
    
    // Persist exchange tracking to store so it survives component remounts
    updateConversationSession(conversation.id, {
      exchangesToday: newCount,
      lastExchangeDay: currentGameDay,
      conversationStage: 'ongoing',
    })
    
    // Deduct time cost from day budget
    consumeHoursFromBudget(timeCostPerExchange, 'low', 'Text Messaging')
    
    // Queue NPC reply generation in background (fire-and-forget)
    // Player can navigate away — reply will arrive asynchronously
    sendPlayerMessageAndQueueReply(conversation.id, choice.fullMessage, choice.category)
    setIsNpcTyping(true)
    setIsLoadingChoices(true)
  }, [conversation.id, addMessage, sendPlayerMessageAndQueueReply, updateConversationSession, consumeHoursFromBudget, exchangeCount, currentGameDay, timeCostPerExchange])
  
  // ── Poll for pending NPC reply delivery ──
  // This runs while the player has the conversation open, delivering the reply
  // when it's ready. If the player leaves, the store-level delivery handles it.
  useEffect(() => {
    if (!getConversationNpcTyping(conversation.id)) {
      // If there was a pending reply that just got delivered, update UI
      if (isNpcTyping) {
        setIsNpcTyping(false)
        setIsLoadingChoices(false)
        
        // Check if we should end conversation or continue
        const pending = careerState?.messaging?.pendingNpcReplies?.[conversation.id]
        if (pending?.generatedResponse?.shouldEndConversation) {
          setExchangeCount(maxExchanges)
          updateConversationSession(conversation.id, { conversationStage: 'cooling_off' })
        } else if (exchangeCount + 1 >= maxExchanges) {
          // Session limit reached — send farewell and mark session end
          const farewellTemplates = SESSION_FAREWELL_TEMPLATES[contact.type] || SESSION_FAREWELL_TEMPLATES.friend
          const farewell = farewellTemplates[Math.floor(Math.random() * farewellTemplates.length)]
          const finalMsg = farewell.replace('{name}', contact.name.split(' ')[0])
          setTimeout(() => {
            addMessage(conversation.id, { content: finalMsg, isPlayer: false, isSessionEnd: true })
            updateConversationSession(conversation.id, { conversationStage: 'cooling_off' })
          }, 800)
        } else {
          // Reload choices for next message
          loadChoices()
        }
      }
      return
    }
    
    // Poll every 500ms to check if reply is ready to deliver
    const pollInterval = setInterval(() => {
      const delivered = deliverPendingNpcReply(conversation.id)
      if (delivered) {
        setIsNpcTyping(false)
        setIsLoadingChoices(false)
        
        // Check conversation flow
        const latestState = useCareerStore.getState().careerState
        const latestConv = latestState?.messaging?.conversations?.[conversation.id]
        const lastMsg = latestConv?.messages?.[latestConv.messages.length - 1]
        
        if (exchangeCount + 1 >= maxExchanges) {
          const farewellTemplates = SESSION_FAREWELL_TEMPLATES[contact.type] || SESSION_FAREWELL_TEMPLATES.friend
          const farewell = farewellTemplates[Math.floor(Math.random() * farewellTemplates.length)]
          const finalMsg = farewell.replace('{name}', contact.name.split(' ')[0])
          setTimeout(() => {
            addMessage(conversation.id, { content: finalMsg, isPlayer: false, isSessionEnd: true })
            updateConversationSession(conversation.id, { conversationStage: 'cooling_off' })
          }, 800)
        } else {
          loadChoices()
        }
      }
    }, 500)
    
    return () => clearInterval(pollInterval)
  }, [conversation.id, isNpcTyping, getConversationNpcTyping, deliverPendingNpcReply, exchangeCount, maxExchanges, contact.type, contact.name, addMessage, loadChoices, careerState?.messaging?.pendingNpcReplies])
  
  // Legacy handlers replaced by SocialActionsPanel + executeSocialAction
  // Gift sending and date planning now go through the unified social actions system
  
  // ── Helper for contact-type subtitle ──
  const getContactSubtitle = () => {
    if (contact.isOnline) return 'Online'
    if (contact.type === 'team_staff') return contact.staffRole || 'Team Staff'
    if (contact.type === 'rival_driver') return contact.driverTeamName || 'Rival Driver'
    if (contact.type === 'sponsor_rep') return contact.sponsorName || 'Sponsor'
    if (contact.type === 'team_principal') return 'Team Principal'
    if (contact.type === 'partner') return contact.datingStatus === 'married' ? 'Partner ❤️' : 'Dating ❤️'
    return contact.lastSeen || contact.occupation || contact.type
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* ── PhoneFrame-styled Chat Header ── */}
      <div className="flex items-center gap-3 p-4 border-b border-border/10 bg-surface-darker/80 backdrop-blur-sm">
        <button className="p-[4px] rounded-[8px] hover:bg-black/5 transition-colors" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="relative">
          <PortraitImage
            src={getContactPortrait(contactToContactInfo(contact))}
            name={contact.name}
            size="md"
          />
          {contact.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-surface-darker" />
          )}
          {/* Contact type dot */}
          <div className={`absolute -top-0.5 -left-0.5 w-3 h-3 rounded-full border border-surface-darker ${
            contact.type === 'partner' || contact.type === 'potential_date' ? 'bg-pink-500' :
            contact.type === 'team_staff' ? 'bg-blue-500' :
            contact.type === 'rival_driver' ? 'bg-orange-500' :
            contact.type === 'sponsor_rep' ? 'bg-emerald-500' :
            contact.type === 'team_principal' ? 'bg-purple-500' :
            contact.type === 'family' ? 'bg-yellow-500' :
            'bg-gray-400'
          }`} />
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-text-primary">{contact.name}</h3>
          <p className="text-xs text-text-muted">
            {getContactSubtitle()}
          </p>
        </div>
        
        {/* Interact Button */}
        <button
          onClick={() => setShowSocialActions(true)}
          className="p-[6px] rounded-[8px] hover:bg-black/5 transition-colors text-[#ef4444] flex items-center gap-[6px]"
        >
          <Heart className="w-4 h-4" />
          <span className="text-xs">Interact</span>
        </button>
      </div>
      
      {/* ── Session Info Bar ── */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-surface-dark/50 border-b border-border/10 text-[11px]">
        <div className="flex items-center gap-3">
          <span className="text-text-muted">
            <Clock className="w-3 h-3 inline mr-1 opacity-60" />
            {exchangeCount}/{maxExchanges} messages
          </span>
          <span className="text-text-muted">
            Cost: {timeCostPerExchange}h each
          </span>
        </div>
        <AffectionMetersCompact contact={contact} />
      </div>
      
      {/* ── Chat Messages ── */}
      <ChatWallpaper>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex flex-col-reverse gap-3">
            {displayMessages.map((message, index) => {
              // Show date separator when the day changes between consecutive messages
              // Since displayMessages is reversed (newest first), the "next" index is chronologically earlier
              const nextMsg = displayMessages[index + 1]
              const showSeparator = !nextMsg ||
                nextMsg.timestamp.day !== message.timestamp.day ||
                nextMsg.timestamp.week !== message.timestamp.week ||
                nextMsg.timestamp.year !== message.timestamp.year
              
              const currentDay = careerState?.currentDay ?? 1
              const currentYear = careerState?.currentYear ?? 2024
              
              return (
                <Fragment key={message.id}>
                  <div>
                    <MessageBubble 
                      message={message} 
                      isPlayer={message.sender === 'player'} 
                    />
                    {(() => {
                      const suggestion = getDerivedSuggestionForMessage(message)
                      if (!suggestion || hasPendingRequestForSuggestion(suggestion)) return null
                      return (
                        <div className={`mt-1 ${message.sender === 'player' ? 'text-right' : 'text-left'}`}>
                          <button
                            onClick={() => { void handlePlanFromMessage(message) }}
                            disabled={planningMessageId === message.id}
                            className="text-[10px] px-2.5 py-1 rounded-full bg-[#00a884]/20 text-[#00d4aa] border border-[#00a884]/40 hover:bg-[#00a884]/30 transition-colors"
                            title={`Add "${suggestion.eventName}" to Invitations`}
                          >
                            {planningMessageId === message.id ? 'Planning...' : 'Plan this'}
                          </button>
                        </div>
                      )
                    })()}
                  </div>
                  {showSeparator && (
                    <DateSeparator
                      week={message.timestamp.week}
                      day={message.timestamp.day}
                      year={message.timestamp.year}
                      currentWeek={currentWeek}
                      currentDay={currentDay}
                      currentYear={currentYear}
                    />
                  )}
                </Fragment>
              )
            })}
          </div>
          
          {/* Typing indicator */}
          {isNpcTyping && (
            <TypingIndicator name={contact.name.split(' ')[0]} />
          )}
        </div>
      </ChatWallpaper>
      
      {/* ── Response Choices (rendered outside phone if portal exists) ── */}
      {(() => {
        const responseArea = (
          <div className="p-4">
            {sessionLimitReached ? (
              <div className="text-center py-3">
                <p className="text-sm text-text-muted">
                  <MessageCircle className="w-4 h-4 inline mr-1" />
                  Conversation session ended
                </p>
                <p className="text-xs text-text-muted mt-1">Come back tomorrow to continue chatting</p>
              </div>
            ) : !canAffordExchange ? (
              <div className="text-center py-3">
                <p className="text-sm text-yellow-400">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Not enough time today
                </p>
                <p className="text-xs text-text-muted mt-1">Each message costs {timeCostPerExchange}h</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-racing-red" />
                  <span className="text-xs text-text-muted">Choose your response</span>
                  {!isDialogueAIAvailable() && (
                    <span className="text-[11px] px-[8px] py-[2px] border-[0.8px] border-black/20 rounded-[8px] text-[#4a5565]">Template Mode</span>
                  )}
                </div>
                
                <MessageChoiceWheel
                  choices={messageChoices}
                  onSelect={handleSendMessage}
                  isLoading={isLoadingChoices}
                />
                
                <button
                  onClick={onBack}
                  className="w-full mt-3 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  End conversation
                </button>
              </>
            )}
          </div>
        )
        
        if (responsePortalId && typeof document !== 'undefined') {
          const portalTarget = document.getElementById(responsePortalId)
          if (portalTarget) return createPortal(responseArea, portalTarget)
        }
        
        // Fallback: render inside phone if no portal target
        return (
          <div className="border-t border-border/10 bg-surface-darker/50">
            {responseArea}
          </div>
        )
      })()}
      
      {/* Social Actions Modal */}
      {showSocialActions && (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) { if (pendingInvitationChoice) { sendChoiceMessage(pendingInvitationChoice); setPendingInvitationChoice(null) } setShowSocialActions(false) } }}>
        <div className="bg-white rounded-[24px] w-full max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-[20px] border-b border-black/10">
            <h2 className="text-[18px] font-bold text-[#0a0a0a]" style={{ fontFamily: "'Arial Black', 'Arial', sans-serif" }}>
              {pendingInvitationChoice 
                ? `Schedule activity with ${contact.name}` 
                : `Interact with ${contact.name}`}
            </h2>
            <button onClick={() => { if (pendingInvitationChoice) { sendChoiceMessage(pendingInvitationChoice); setPendingInvitationChoice(null) } setShowSocialActions(false) }} className="p-[4px] rounded-full hover:bg-black/5">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-[20px] overflow-y-auto">
        <SocialActionsPanel
          contact={contact}
          onExecute={(actionId) => {
            const result = executeSocialAction(contact.id, actionId)
            if (result.success) {
              const action = SOCIAL_ACTIONS.find(a => a.id === actionId)
              if (action) {
                // If there's a pending invitation choice, use its text instead of generic
                const playerMsg = pendingInvitationChoice
                  ? pendingInvitationChoice.fullMessage
                  : action.category === 'gift'
                    ? `Sent a gift: ${action.name} 🎁`
                    : action.category === 'event_invite'
                      ? `Invited you: ${action.name} 🎟️`
                      : `Planned: ${action.name} 📅`
                addMessage(conversation.id, {
                  content: playerMsg,
                  isPlayer: true
                })
                // Queue AI-generated NPC reaction to the social action
                sendPlayerMessageAndQueueReply(conversation.id, playerMsg, `social_action_${action.category}`)
                setIsNpcTyping(true)
                setIsLoadingChoices(true)
                
                // Clear pending invitation & close panel
                if (pendingInvitationChoice) {
                  setPendingInvitationChoice(null)
                  setShowSocialActions(false)
                  // Also persist exchange tracking
                  const newCount = exchangeCount + 1
                  setExchangeCount(newCount)
                  updateConversationSession(conversation.id, {
                    exchangesToday: newCount,
                    lastExchangeDay: currentGameDay,
                    conversationStage: 'ongoing',
                  })
                  consumeHoursFromBudget(timeCostPerExchange, 'low', 'Text Messaging')
                }
              }
            }
            return result
          }}
          onSchedule={(actionId, week, day) => {
            const result = scheduleSocialAction(contact.id, actionId, week, day)
            if (result.success) {
              const action = SOCIAL_ACTIONS.find(a => a.id === actionId)
              if (action) {
                const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                // If there's a pending invitation choice, use its text + scheduling info
                const playerMsg = pendingInvitationChoice
                  ? `${pendingInvitationChoice.fullMessage}\n📅 Scheduled ${action.name} for ${dayNames[day]}, Week ${week}`
                  : `Scheduled ${action.name} for ${dayNames[day]}, Week ${week} 📅`
                addMessage(conversation.id, {
                  content: playerMsg,
                  isPlayer: true
                })
                // Queue AI-generated NPC reaction to the scheduled activity
                sendPlayerMessageAndQueueReply(conversation.id, playerMsg, `social_action_${action.category}`)
                setIsNpcTyping(true)
                setIsLoadingChoices(true)
                
                // Clear pending invitation & close panel
                if (pendingInvitationChoice) {
                  setPendingInvitationChoice(null)
                  setShowSocialActions(false)
                  // Also persist exchange tracking
                  const newCount = exchangeCount + 1
                  setExchangeCount(newCount)
                  updateConversationSession(conversation.id, {
                    exchangesToday: newCount,
                    lastExchangeDay: currentGameDay,
                    conversationStage: 'ongoing',
                  })
                  consumeHoursFromBudget(timeCostPerExchange, 'low', 'Text Messaging')
                }
              }
            }
            return result
          }}
          onClose={() => {
            if (pendingInvitationChoice) {
              sendChoiceMessage(pendingInvitationChoice)
              setPendingInvitationChoice(null)
            }
            setShowSocialActions(false)
          }}
        />
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

function GiftSelector({ 
  contact, 
  onSend, 
}: { 
  contact: Contact
  onSend: (gift: { name: string; value: number }) => void
  onClose: () => void
}) {
  const gifts = [
    { id: 'flowers', name: 'Flowers', value: 50, icon: '💐', effect: '+3 Affection' },
    { id: 'chocolates', name: 'Chocolates', value: 30, icon: '🍫', effect: '+2 Affection' },
    { id: 'jewelry', name: 'Jewelry', value: 500, icon: '💍', effect: '+8 Affection, +3 Romance' },
    { id: 'watch', name: 'Luxury Watch', value: 2000, icon: '⌚', effect: '+12 Affection, +5 Romance' },
    { id: 'trip', name: 'Surprise Trip', value: 5000, icon: '✈️', effect: '+15 Affection, +10 Romance, +5 Trust' },
    { id: 'car', name: 'New Car', value: 50000, icon: '🚗', effect: '+25 Affection, +15 Romance, +10 Trust' }
  ]
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Choose a gift for {contact.name}. More expensive gifts have bigger effects but might seem too forward early in a relationship.
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {gifts.map(gift => (
          <motion.button
            key={gift.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSend(gift)}
            className="p-4 bg-surface-dark rounded-xl text-left hover:bg-surface-dark/80 transition-colors"
          >
            <span className="text-3xl">{gift.icon}</span>
            <h4 className="font-medium mt-2">{gift.name}</h4>
            <p className="text-xs text-text-muted">${gift.value.toLocaleString()}</p>
            <p className="text-xs text-green-400 mt-1">{gift.effect}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function DatePlanner({ 
  contact, 
  onPlan, 
}: { 
  contact: Contact
  onPlan: (date: { type: string; location: string }) => void
  onClose: () => void
}) {
  const dateTypes = [
    { id: 'coffee', name: 'Coffee Date', location: 'Local Café', cost: 50, icon: '☕', time: '1 hour' },
    { id: 'dinner', name: 'Romantic Dinner', location: 'Fine Restaurant', cost: 300, icon: '🍽️', time: '2-3 hours' },
    { id: 'movie', name: 'Movie Night', location: 'Cinema', cost: 100, icon: '🎬', time: '2 hours' },
    { id: 'concert', name: 'Concert', location: 'Music Venue', cost: 500, icon: '🎵', time: '4 hours' },
    { id: 'weekend', name: 'Weekend Getaway', location: 'Resort', cost: 3000, icon: '🏖️', time: '2 days' },
    { id: 'adventure', name: 'Adventure Date', location: 'Various', cost: 800, icon: '🪂', time: '4-6 hours' }
  ]
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Plan a date with {contact.name}. They seem to be in a {contact.mood?.overall || 'neutral'} mood today.
      </p>
      
      <div className="space-y-3">
        {dateTypes.map(date => (
          <motion.button
            key={date.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onPlan({ type: date.name, location: date.location })}
            className="w-full p-4 bg-surface-dark rounded-xl text-left hover:bg-surface-dark/80 transition-colors flex items-center gap-4"
          >
            <span className="text-3xl">{date.icon}</span>
            <div className="flex-1">
              <h4 className="font-medium">{date.name}</h4>
              <p className="text-xs text-text-muted">{date.location}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">${date.cost}</p>
              <p className="text-xs text-text-muted">{date.time}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// SOCIAL ACTIONS PANEL (unified gifts, hangouts, dates, invitations, business)
// ============================================

function SocialActionsPanel({
  contact,
  onExecute,
  onSchedule,
  onClose,
}: {
  contact: Contact
  onExecute: (actionId: string) => { success: boolean; message: string }
  onSchedule: (actionId: string, week: number, day: number) => { success: boolean; message: string }
  onClose: () => void
}) {
  const careerState = useCareerStore(s => s.careerState)
  const { getSocialActionCooldown } = useCareerStore.getState()
  const liquidCash = careerState?.personalLife?.finances?.liquidCash ?? 0
  const currentWeek = careerState?.currentWeek ?? 1
  const currentDay = careerState?.currentDay ?? 1
  const currentYear = careerState?.currentYear ?? 1

  const grouped = useMemo(() => getGroupedActionsForContact(contact.type), [contact.type])
  
  // Filter to categories that have at least 1 action
  const availableCategories = useMemo(() =>
    SOCIAL_ACTION_CATEGORIES.filter(cat => grouped[cat.id]?.length > 0),
  [grouped])
  
  const [activeCategory, setActiveCategory] = useState<SocialActionCategory>(
    availableCategories[0]?.id ?? 'gift'
  )
  const [confirmAction, setConfirmAction] = useState<SocialAction | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<{ week: number; day: number } | null>(null)
  
  const actions = grouped[activeCategory] || []
  
  // Build available day slots for scheduling (current week remaining days + next week)
  const availableDays = useMemo(() => {
    const days: { week: number; day: number; label: string; isFull: boolean }[] = []
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const scheduledActivities = careerState?.scheduledActivities || []
    
    // Remaining days of current week (starting from tomorrow, or today if it's early)
    for (let d = currentDay; d <= 7; d++) {
      const dayScheduled = scheduledActivities.filter(
        a => a.scheduledWeek === currentWeek && a.scheduledDay === d && a.status === 'scheduled'
      )
      const hoursUsed = dayScheduled.reduce((sum, a) => sum + (a.duration || 0), 0)
      days.push({
        week: currentWeek,
        day: d,
        label: d === currentDay ? `${dayNames[d - 1]} (Today)` : dayNames[d - 1],
        isFull: hoursUsed >= 14
      })
    }
    
    // All days of next week
    for (let d = 1; d <= 7; d++) {
      const dayScheduled = scheduledActivities.filter(
        a => a.scheduledWeek === currentWeek + 1 && a.scheduledDay === d && a.status === 'scheduled'
      )
      const hoursUsed = dayScheduled.reduce((sum, a) => sum + (a.duration || 0), 0)
      days.push({
        week: currentWeek + 1,
        day: d,
        label: `${dayNames[d - 1]} (W${currentWeek + 1})`,
        isFull: hoursUsed >= 14
      })
    }
    
    return days
  }, [currentWeek, currentDay, careerState?.scheduledActivities])
  
  const getActionState = useCallback((action: SocialAction): { disabled: boolean; reason?: string } => {
    if (action.cost > 0 && liquidCash < action.cost) {
      return { disabled: true, reason: 'Can\'t afford' }
    }
    if (action.minRelationship && contact.relationshipLevel < action.minRelationship) {
      return { disabled: true, reason: `Need ${action.minRelationship}% relationship` }
    }
    if (action.cooldownWeeks) {
      const weeksSince = getSocialActionCooldown(contact.id, action.id)
      if (weeksSince < action.cooldownWeeks) {
        const remaining = action.cooldownWeeks - weeksSince
        return { disabled: true, reason: `Wait ${remaining}w` }
      }
    }
    return { disabled: false }
  }, [liquidCash, contact, getSocialActionCooldown])

  const handleConfirm = useCallback(() => {
    if (!confirmAction) return
    
    const needsScheduling = confirmAction.timeCost > 0
    
    if (needsScheduling) {
      // Must pick a day first
      if (!selectedDay) return
      const result = onSchedule(confirmAction.id, selectedDay.week, selectedDay.day)
      if (result.success) {
        setResultMessage(result.message)
        setConfirmAction(null)
        setSelectedDay(null)
        setTimeout(() => onClose(), 1800)
      } else {
        setResultMessage(result.message)
        setConfirmAction(null)
        setSelectedDay(null)
      }
    } else {
      // Instant execution (gifts, zero-time actions)
      const result = onExecute(confirmAction.id)
      if (result.success) {
        setResultMessage(result.message)
        setConfirmAction(null)
        setTimeout(() => onClose(), 1500)
      } else {
        setResultMessage(result.message)
        setConfirmAction(null)
      }
    }
  }, [confirmAction, selectedDay, onExecute, onSchedule, onClose])

  const isRomantic = contact.type === 'partner' || contact.type === 'potential_date'

  // Confirmation view
  if (confirmAction) {
    const state = getActionState(confirmAction)
    const needsScheduling = confirmAction.timeCost > 0
    return (
      <div className="space-y-4">
        <div className="text-center py-2">
          <span className="text-4xl">{confirmAction.icon}</span>
          <h4 className="font-semibold text-text-primary mt-2">{confirmAction.name}</h4>
          <p className="text-xs text-text-muted mt-1">{confirmAction.description}</p>
        </div>
        
        <div className="bg-surface-dark/60 rounded-xl p-3 space-y-2 border border-border/10">
          {confirmAction.cost > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Cost</span>
              <span className="text-yellow-400 font-medium">${confirmAction.cost.toLocaleString()}</span>
            </div>
          )}
          {confirmAction.timeCost > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Time</span>
              <span className="text-text-secondary">{confirmAction.timeCost >= 8 ? `${Math.round(confirmAction.timeCost / 8)} day${confirmAction.timeCost >= 16 ? 's' : ''}` : `${confirmAction.timeCost}h`}</span>
            </div>
          )}
          {/* Base Effects */}
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Effects</span>
            <div className="flex gap-2 flex-wrap justify-end">
              {confirmAction.effects.affection > 0 && <span className="text-pink-400">+{confirmAction.effects.affection} Affection</span>}
              {confirmAction.effects.trust > 0 && <span className="text-blue-400">+{confirmAction.effects.trust} Trust</span>}
              {isRomantic && confirmAction.effects.romance && confirmAction.effects.romance > 0 && <span className="text-red-400">+{confirmAction.effects.romance} Romance</span>}
            </div>
          </div>
          
          {/* Bonus Preview */}
          {(() => {
            const bonusMult = getCombinedBonusMultiplier(confirmAction, contact.loveLanguage, contact.interests)
            const loveMult = getLoveLanguageMultiplier(confirmAction, contact.loveLanguage)
            const interestMult = getInterestBonusMultiplier(confirmAction, contact.interests)
            const hasLoveBonus = loveMult > 1.0
            const hasInterestBonus = interestMult > 1.0
            const hasAnyBonus = bonusMult > 1.0
            
            if (!hasAnyBonus) return null
            
            return (
              <div className="mt-1 pt-1 border-t border-border/10 space-y-1">
                {hasLoveBonus && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-yellow-400 flex items-center gap-1">
                      <span>💛</span> Love Language Match
                    </span>
                    <span className="text-yellow-400 font-medium">+{Math.round((loveMult - 1) * 100)}%</span>
                  </div>
                )}
                {hasInterestBonus && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span>✨</span> Shared Interests
                    </span>
                    <span className="text-emerald-400 font-medium">+{Math.round((interestMult - 1) * 100)}%</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] font-medium">
                  <span className="text-accent-gold">Total Bonus</span>
                  <span className="text-accent-gold">{bonusMult.toFixed(1)}x</span>
                </div>
                {/* Show boosted values */}
                <div className="flex justify-between text-[10px] pt-0.5">
                  <span className="text-text-muted">With bonuses</span>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {confirmAction.effects.affection > 0 && <span className="text-pink-300 font-medium">+{(confirmAction.effects.affection * bonusMult).toFixed(1)} Aff</span>}
                    {confirmAction.effects.trust > 0 && <span className="text-blue-300 font-medium">+{(confirmAction.effects.trust * bonusMult).toFixed(1)} Trust</span>}
                    {isRomantic && confirmAction.effects.romance && confirmAction.effects.romance > 0 && <span className="text-red-300 font-medium">+{(confirmAction.effects.romance * bonusMult).toFixed(1)} Rom</span>}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
        
        {/* Day picker for time-consuming activities */}
        {needsScheduling && (() => {
          const timeCost = getActivityTimeCost(confirmAction.id)
          const activityPeriod = timeCost.preferredPeriod || timeCost.allowedPeriods?.[0]
          const periodConfig = activityPeriod ? DAY_PERIODS[activityPeriod] : null
          const periodIcons: Record<DayPeriod, string> = { morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙' }
          
          return (
            <div className="space-y-2">
              {/* Timeslot indicator */}
              {periodConfig && activityPeriod && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-dark/40 border border-border/10">
                  <span className="text-base">{periodIcons[activityPeriod]}</span>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-text-secondary">{periodConfig.label}</span>
                    <span className="text-[10px] text-text-muted ml-1.5">
                      {periodConfig.startHour > 12 ? `${periodConfig.startHour - 12}pm` : periodConfig.startHour === 12 ? '12pm' : `${periodConfig.startHour}am`}
                      {' - '}
                      {periodConfig.endHour > 12 ? `${periodConfig.endHour - 12}pm` : periodConfig.endHour === 12 ? '12pm' : `${periodConfig.endHour}am`}
                    </span>
                  </div>
                  {timeCost.allowedPeriods && timeCost.allowedPeriods.length > 1 && (
                    <div className="flex gap-1">
                      {timeCost.allowedPeriods.map(p => (
                        <span
                          key={p}
                          className={`text-[10px] px-1.5 py-0.5 rounded ${p === activityPeriod ? 'bg-accent-blue/20 text-accent-blue' : 'bg-surface-dark/50 text-text-muted'}`}
                          title={DAY_PERIODS[p].label}
                        >
                          {periodIcons[p]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Calendar className="w-3.5 h-3.5" />
                <span>Pick a day</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                {availableDays.map(slot => (
                  <button
                    key={`${slot.week}-${slot.day}`}
                    onClick={() => !slot.isFull && setSelectedDay({ week: slot.week, day: slot.day })}
                    disabled={slot.isFull}
                    className={`px-2 py-2 rounded-lg text-[11px] font-medium transition-all border ${
                      selectedDay?.week === slot.week && selectedDay?.day === slot.day
                        ? 'bg-racing-red/20 text-racing-red border-racing-red/40 ring-1 ring-racing-red/20'
                        : slot.isFull
                          ? 'bg-surface-dark/30 text-text-muted/40 border-transparent cursor-not-allowed'
                          : 'bg-surface-dark/50 text-text-secondary border-border/10 hover:bg-surface-dark/70 hover:border-border/20'
                    }`}
                  >
                    {slot.label}
                    {slot.isFull && <span className="block text-[9px] text-yellow-500/60">Full</span>}
                  </button>
                ))}
              </div>
            </div>
          )
        })()}
        
        <div className="flex gap-2">
          <button
            onClick={() => { setConfirmAction(null); setSelectedDay(null) }}
            className="flex-1 py-2.5 rounded-xl bg-surface-dark/60 text-text-muted text-sm hover:bg-surface-dark/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={state.disabled || (needsScheduling && !selectedDay)}
            className="flex-1 py-2.5 rounded-xl bg-racing-red text-white text-sm font-medium hover:bg-racing-red/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {needsScheduling ? (
              <>
                <Calendar className="w-3.5 h-3.5" />
                Schedule
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    )
  }

  // Result message view
  if (resultMessage) {
    return (
      <div className="py-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <p className="text-sm text-text-primary">{resultMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">
        Choose an activity with {contact.name}.
      </p>
      
      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {availableCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-racing-red/20 text-racing-red border border-racing-red/30'
                : 'bg-surface-dark/40 text-text-muted hover:bg-surface-dark/60 border border-transparent'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>
      
      {/* Action cards */}
      <div className={`${activeCategory === 'gift' ? 'grid grid-cols-2 gap-2' : 'space-y-2'} max-h-[360px] overflow-y-auto pr-1`}>
        {actions.map(action => {
          const state = getActionState(action)
          return (
            <motion.button
              key={action.id}
              whileHover={state.disabled ? {} : { scale: 1.01 }}
              whileTap={state.disabled ? {} : { scale: 0.99 }}
              onClick={() => !state.disabled && setConfirmAction(action)}
              disabled={state.disabled}
              className={`w-full text-left rounded-xl transition-colors ${
                activeCategory === 'gift' ? 'p-3 bg-surface-dark/50' : 'p-3 bg-surface-dark/50 flex items-center gap-3'
              } ${
                state.disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-surface-dark/70'
              } border border-border/5`}
            >
              {activeCategory === 'gift' ? (
                // Grid layout for gifts
                <>
                  <span className="text-2xl">{action.icon}</span>
                  <h4 className="font-medium text-sm text-text-primary mt-1.5">{action.name}</h4>
                  {action.cost > 0 && <p className="text-[11px] text-text-muted">${action.cost.toLocaleString()}</p>}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {action.effects.affection > 0 && <span className="text-[10px] text-pink-400">+{action.effects.affection} Aff</span>}
                    {action.effects.trust > 0 && <span className="text-[10px] text-blue-400">+{action.effects.trust} Trs</span>}
                    {isRomantic && action.effects.romance && action.effects.romance > 0 && <span className="text-[10px] text-red-400">+{action.effects.romance} Rom</span>}
                  </div>
                  {state.reason && <p className="text-[10px] text-yellow-500 mt-1">{state.reason}</p>}
                </>
              ) : (
                // List layout for activities
                <>
                  <span className="text-2xl flex-shrink-0">{action.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-text-primary">{action.name}</h4>
                    <p className="text-[11px] text-text-muted truncate">{action.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {action.effects.affection > 0 && <span className="text-[10px] text-pink-400">+{action.effects.affection} Affection</span>}
                      {action.effects.trust > 0 && <span className="text-[10px] text-blue-400">+{action.effects.trust} Trust</span>}
                      {isRomantic && action.effects.romance && action.effects.romance > 0 && <span className="text-[10px] text-red-400">+{action.effects.romance} Romance</span>}
                    </div>
                    {state.reason && <p className="text-[10px] text-yellow-500 mt-0.5">{state.reason}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {action.cost > 0 && <p className="text-xs font-medium text-text-primary">${action.cost.toLocaleString()}</p>}
                    {action.cost === 0 && <p className="text-xs text-green-400">Free</p>}
                    {action.timeCost > 0 && <p className="text-[10px] text-text-muted">{action.timeCost >= 8 ? `${Math.round(action.timeCost / 8)}d` : `${action.timeCost}h`}</p>}
                  </div>
                </>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// DATING TAB COMPONENT
// ============================================

// ============================================
// CONTACT DETAIL PANEL (Staff-detail-modal-style view)
// ============================================

function ContactDetailPanel({
  contact,
  messaging,
  currentWeek,
  currentYear,
  onClose,
  onOpenChat,
}: {
  contact: Contact
  messaging: ReturnType<typeof createDefaultMessagingState>
  currentWeek?: number
  currentYear?: number
  onClose: () => void
  onOpenChat: (contact: Contact) => void
}) {

  const conversation = Object.values(messaging.conversations).find(c => c.contactId === contact.id)
  const totalExchanges = conversation?.messages?.length || 0
  const lastMsgTime = conversation?.lastMessageTime
  
  // Calculate days since last contact
  const daysSinceContact = useMemo(() => {
    if (!lastMsgTime || !currentWeek || !currentYear) return null
    const currentDays = currentYear * 365 + currentWeek * 7
    const lastDays = (lastMsgTime.year || currentYear) * 365 + lastMsgTime.week * 7 + (lastMsgTime.day || 0)
    return Math.max(0, Math.floor((currentDays - lastDays) / 7))
  }, [lastMsgTime, currentWeek, currentYear])

  // Relationship type label & color
  const typeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    partner: { label: 'Partner', color: 'text-pink-400', bgColor: 'bg-pink-500/10 border-pink-500/20' },
    potential_date: { label: 'Dating Prospect', color: 'text-pink-300', bgColor: 'bg-pink-400/10 border-pink-400/20' },
    family: { label: 'Family', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/20' },
    friend: { label: 'Friend', color: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/20' },
    business: { label: 'Business', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
    team_staff: { label: 'Team Staff', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10 border-cyan-500/20' },
    rival_driver: { label: 'Rival Driver', color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/20' },
    rival: { label: 'Rival', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20' },
    sponsor_rep: { label: 'Sponsor Rep', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
    team_principal: { label: 'Team Principal', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/20' },
  }
  const tConfig = typeConfig[contact.type] || { label: contact.type, color: 'text-text-muted', bgColor: 'bg-surface-secondary border-surface-border' }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* ── Header with back button ── */}
      <div className="px-4 py-3 border-b border-border/10 bg-surface-darker/50 flex items-center gap-3 flex-shrink-0">
        <button onClick={onClose} className="p-1 hover:bg-surface-dark/50 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-text-muted" />
        </button>
        <h2 className="text-sm font-bold text-text-primary flex-1">Contact Profile</h2>
        <button
          onClick={() => onOpenChat(contact)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-racing-red/20 text-racing-red text-xs font-medium hover:bg-racing-red/30 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Chat
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        
        {/* ── Identity Card - Hero style with large portrait ── */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <PortraitImage
              src={getContactPortrait(contactToContactInfo(contact))}
              name={contact.name}
              size="3xl"
              bordered
              borderColor="default"
            />
            {contact.isOnline && (
              <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-surface-dark" />
            )}
          </div>
          <h3 className="text-xl font-bold text-text-primary mt-3">{contact.name}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap justify-center">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${tConfig.bgColor} ${tConfig.color}`}>
              {tConfig.label}
            </span>
            {contact.nationality && (
              <span className="text-xs text-text-muted flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {contact.nationality}
              </span>
            )}
            {contact.age && (
              <span className="text-xs text-text-muted">
                Age {contact.age}
              </span>
            )}
          </div>
          {contact.occupation && (
            <p className="text-xs text-text-secondary mt-1.5 capitalize flex items-center gap-1.5">
              <Briefcase className="w-3 h-3 text-text-muted" />
              {contact.occupation}
            </p>
          )}
          {contact.isOnline ? (
            <p className="text-[10px] text-green-400 mt-1">Online now</p>
          ) : (
            <p className="text-[10px] text-text-muted mt-1">Last seen: {contact.lastSeen || 'Recently'}</p>
          )}
        </div>

        {/* ── Relationship Meters ── */}
        <div className="bg-surface-dark/40 rounded-xl p-3 space-y-2.5 border border-border/10">
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-racing-red" />
            Relationship
          </h4>
          {/* Overall Level */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text-muted">Overall</span>
              <span className="text-text-primary font-medium">{contact.relationshipLevel}%</span>
            </div>
            <div className="h-2 bg-surface-darker rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-racing-red to-accent-orange rounded-full" initial={{ width: 0 }} animate={{ width: `${contact.relationshipLevel}%` }} transition={{ duration: 0.6 }} />
            </div>
          </div>
          {/* Affection */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text-muted flex items-center gap-1"><Smile className="w-3 h-3 text-pink-400" /> Affection</span>
              <span className="text-pink-400 font-medium">{contact.affectionMeter}%</span>
            </div>
            <div className="h-1.5 bg-surface-darker rounded-full overflow-hidden">
              <motion.div className="h-full bg-pink-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${contact.affectionMeter}%` }} transition={{ duration: 0.6 }} />
            </div>
          </div>
          {/* Trust */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text-muted flex items-center gap-1"><Shield className="w-3 h-3 text-blue-400" /> Trust</span>
              <span className="text-blue-400 font-medium">{contact.trustMeter}%</span>
            </div>
            <div className="h-1.5 bg-surface-darker rounded-full overflow-hidden">
              <motion.div className="h-full bg-blue-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${contact.trustMeter}%` }} transition={{ duration: 0.6 }} />
            </div>
          </div>
          {/* Romance (if applicable) */}
          {(contact.type === 'partner' || contact.type === 'potential_date') && (
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-text-muted flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" /> Romance</span>
                <span className="text-red-400 font-medium">{contact.romanceMeter || 0}%</span>
              </div>
              <div className="h-1.5 bg-surface-darker rounded-full overflow-hidden">
                <motion.div className="h-full bg-red-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${contact.romanceMeter || 0}%` }} transition={{ duration: 0.6 }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Quick Facts (How you met, motorsport connection) ── */}
        <div className="bg-surface-dark/40 rounded-xl p-3 space-y-2 border border-border/10">
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
            <Handshake className="w-3.5 h-3.5 text-accent-gold" />
            Quick Facts
          </h4>
          {contact.metAt && (
            <div className="flex items-start gap-2">
              <Calendar className="w-3.5 h-3.5 text-text-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-text-muted uppercase">How you met</p>
                <p className="text-xs text-text-secondary">{contact.metAt}</p>
              </div>
            </div>
          )}
          {contact.connectionToMotorsport && (
            <div className="flex items-start gap-2">
              <Trophy className="w-3.5 h-3.5 text-text-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-text-muted uppercase">Motorsport Connection</p>
                <p className="text-xs text-text-secondary">{contact.connectionToMotorsport}</p>
              </div>
            </div>
          )}
          {daysSinceContact !== null && (
            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-text-muted mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-text-muted uppercase">Last Contact</p>
                <p className="text-xs text-text-secondary">
                  {daysSinceContact === 0 ? 'This week' : `${daysSinceContact} week${daysSinceContact !== 1 ? 's' : ''} ago`}
                  {' · '}{totalExchanges} message{totalExchanges !== 1 ? 's' : ''} exchanged
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Personality & Traits ── */}
        {(contact.personalitySummary || (contact.traits && contact.traits.length > 0)) && (
          <div className="bg-surface-dark/40 rounded-xl p-3 space-y-2 border border-border/10">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-purple-400" />
              Personality
            </h4>
            {contact.personalitySummary && (
              <p className="text-xs text-text-secondary leading-relaxed">{contact.personalitySummary}</p>
            )}
            {contact.traits && contact.traits.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {contact.traits.map(trait => (
                  <span key={trait} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/15">
                    {trait}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Bio Section ── */}
        {contact.bio && (
          <div className="bg-surface-dark/40 rounded-xl p-3 space-y-2 border border-border/10">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-green-400" />
              Biography
            </h4>
            {typeof contact.bio === 'object' && (
              <>
                {contact.bio.background && (
                  <p className="text-xs text-text-secondary leading-relaxed">{contact.bio.background}</p>
                )}
                {contact.bio.careerNarrative && (
                  <p className="text-xs text-text-muted leading-relaxed italic">{contact.bio.careerNarrative}</p>
                )}
                {contact.bio.anecdotes && contact.bio.anecdotes.length > 0 && (
                  <div className="mt-1.5">
                    <p className="text-[10px] text-text-muted uppercase mb-1">Anecdotes & Stories</p>
                    <ul className="space-y-0.5">
                      {contact.bio.anecdotes.map((a, i) => (
                        <li key={i} className="text-xs text-text-secondary pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-text-muted">{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Conversation Topics ── */}
        {contact.conversationTopics && contact.conversationTopics.length > 0 && (
          <div className="bg-surface-dark/40 rounded-xl p-3 space-y-2 border border-border/10">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              Topics They Talk About
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {contact.conversationTopics.map((topic, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/15">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── How They Can Help ── */}
        {contact.canHelp && contact.canHelp.length > 0 && (
          <div className="bg-surface-dark/40 rounded-xl p-3 space-y-2 border border-border/10">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
              <Handshake className="w-3.5 h-3.5 text-emerald-400" />
              How They Can Help
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {contact.canHelp.map((help, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/15 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" />
                  {help}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Social Info (interests, education, wealth, etc.) ── */}
        {(contact.interests?.length || contact.educationLevel || contact.wealthLevel || contact.socialCircle) && (
          <div className="bg-surface-dark/40 rounded-xl p-3 space-y-2 border border-border/10">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              Social Profile
            </h4>
            {contact.educationLevel && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted w-20">Education</span>
                <span className="text-text-secondary capitalize">{contact.educationLevel}</span>
              </div>
            )}
            {contact.wealthLevel && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted w-20">Wealth</span>
                <span className="text-text-secondary capitalize">{contact.wealthLevel}</span>
              </div>
            )}
            {contact.socialCircle && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted w-20">Social Circle</span>
                <span className="text-text-secondary capitalize">{contact.socialCircle}</span>
              </div>
            )}
            {contact.interests && contact.interests.length > 0 && (
              <div>
                <p className="text-[10px] text-text-muted uppercase mb-1.5">Interests & Hobbies</p>
                <div className="flex flex-wrap gap-1.5">
                  {contact.interests.map((interest, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/15">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Partner-specific: Desires & Deal-breakers ── */}
        {(contact.type === 'partner' || contact.type === 'potential_date') && (contact.desires || contact.dealBreakers?.length || contact.loveLanguage) && (
          <div className="bg-surface-dark/40 rounded-xl p-3 space-y-2 border border-border/10">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-pink-400" />
              Relationship Insights
            </h4>
            {contact.loveLanguage && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted w-24">Love Language</span>
                <span className="text-pink-300 capitalize">{contact.loveLanguage}</span>
              </div>
            )}
            {contact.firstImpression && (
              <div className="flex items-start gap-2 text-xs">
                <span className="text-text-muted w-24 flex-shrink-0">First Impression</span>
                <span className="text-text-secondary">{contact.firstImpression}</span>
              </div>
            )}
            {contact.desires && (
              <>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted w-24">Wants Marriage</span>
                  <span className="text-text-secondary">{contact.desires.wantsMarriage ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted w-24">Wants Kids</span>
                  <span className="text-text-secondary">{contact.desires.wantsChildren ? `Yes (${contact.desires.desiredChildrenCount})` : 'No'}</span>
                </div>
              </>
            )}
            {contact.dealBreakers && contact.dealBreakers.length > 0 && (
              <div>
                <p className="text-[10px] text-text-muted uppercase mb-1">Deal Breakers</p>
                <div className="flex flex-wrap gap-1.5">
                  {contact.dealBreakers.map((db, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/15">
                      {db}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Staff-specific info ── */}
        {contact.type === 'team_staff' && (contact.staffRole || contact.staffPersonality || contact.staffQuirks?.length) && (
          <div className="bg-surface-dark/40 rounded-xl p-3 space-y-2 border border-border/10">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              Staff Profile
            </h4>
            {contact.staffRole && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-text-muted w-20">Role</span>
                <span className="text-text-secondary capitalize">{contact.staffRole.replace(/_/g, ' ')}</span>
              </div>
            )}
            {contact.staffPersonality && (
              <p className="text-xs text-text-secondary leading-relaxed">{contact.staffPersonality}</p>
            )}
            {contact.staffQuirks && contact.staffQuirks.length > 0 && (
              <div>
                <p className="text-[10px] text-text-muted uppercase mb-1">Quirks</p>
                <div className="flex flex-wrap gap-1.5">
                  {contact.staffQuirks.map((q, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/15">
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </motion.div>
  )
}

// ============================================
// RELATIONSHIPS DASHBOARD (Right panel - ALL relationship types)
// ============================================

function RelationshipsDashboard({
  contacts,
  potentialDates,
  messaging,
  onSelectContact,
  currentWeek,
  currentYear,
  detailContact: externalDetailContact,
  onDetailContactChange,
}: {
  contacts: Contact[]
  potentialDates: PotentialDate[]
  messaging: ReturnType<typeof createDefaultMessagingState>
  onSelectContact: (contact: Contact) => void
  currentWeek?: number
  currentYear?: number
  detailContact?: Contact | null
  onDetailContactChange?: (contact: Contact | null) => void
}) {
  const [internalDetailContact, setInternalDetailContact] = useState<Contact | null>(null)
  
  // Use external state if provided, otherwise internal
  const detailContact = externalDetailContact !== undefined ? externalDetailContact : internalDetailContact
  const setDetailContact = onDetailContactChange || setInternalDetailContact
  
  // ── Relationship categories with metadata ──
  const categories: Array<{
    type: string
    label: string
    icon: string
    color: string
    barColor: string
    description: string
  }> = [
    { type: 'partner', label: 'Romantic', icon: '❤️', color: 'text-pink-400', barColor: 'bg-pink-500', description: 'Your romantic partner' },
    { type: 'potential_date', label: 'Dating Prospects', icon: '💕', color: 'text-pink-300', barColor: 'bg-pink-400', description: 'People you could date' },
    { type: 'family', label: 'Family', icon: '👨‍👩‍👧', color: 'text-yellow-400', barColor: 'bg-yellow-500', description: 'Family members' },
    { type: 'friend', label: 'Friends', icon: '🤝', color: 'text-green-400', barColor: 'bg-green-500', description: 'Your social circle' },
    { type: 'team_staff', label: 'Team Staff', icon: '🏎️', color: 'text-cyan-400', barColor: 'bg-cyan-500', description: 'Your team crew' },
    { type: 'rival_driver', label: 'Rival Drivers', icon: '🏁', color: 'text-orange-400', barColor: 'bg-orange-500', description: 'Competitors on track' },
    { type: 'sponsor_rep', label: 'Sponsors', icon: '💼', color: 'text-emerald-400', barColor: 'bg-emerald-500', description: 'Sponsor representatives' },
    { type: 'team_principal', label: 'Team Principals', icon: '👔', color: 'text-purple-400', barColor: 'bg-purple-500', description: 'Rival team bosses' },
    { type: 'business', label: 'Business', icon: '📊', color: 'text-blue-400', barColor: 'bg-blue-500', description: 'Professional contacts' },
  ]
  
  // ── Compute overall stats ──
  const totalContacts = contacts.length
  const avgRelationship = totalContacts > 0 
    ? Math.round(contacts.reduce((sum, c) => sum + c.relationshipLevel, 0) / totalContacts) 
    : 0
  const pendingDates = messaging.pendingDateInvites || []
  const completedDates = pendingDates.filter(d => d.status === 'completed').length
  const pendingRequests = (messaging.pendingRequests || []).filter(r => r.status === 'pending').length
  
  // ── If a contact is selected for detail, show ContactDetailPanel ──
  if (detailContact) {
    return (
      <ContactDetailPanel
        contact={detailContact}
        messaging={messaging}
        currentWeek={currentWeek}
        currentYear={currentYear}
        onClose={() => setDetailContact(null)}
        onOpenChat={(c) => { setDetailContact(null); onSelectContact(c) }}
      />
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-border/10 bg-surface-darker/50 flex-shrink-0">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Users className="w-5 h-5 text-racing-red" />
          Relationships
        </h2>
        <p className="text-xs text-text-muted mt-0.5">All your connections at a glance</p>
      </div>
      
      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-border/10 flex-shrink-0">
        <div className="bg-surface-dark/50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-text-primary">{totalContacts}</p>
          <p className="text-[10px] text-text-muted">Contacts</p>
        </div>
        <div className="bg-surface-dark/50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-text-primary">{avgRelationship}%</p>
          <p className="text-[10px] text-text-muted">Avg Level</p>
        </div>
        <div className="bg-surface-dark/50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-text-primary">{completedDates}</p>
          <p className="text-[10px] text-text-muted">Dates</p>
        </div>
        <div className="bg-surface-dark/50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-text-primary">{pendingRequests}</p>
          <p className="text-[10px] text-text-muted">Invites</p>
        </div>
      </div>
      
      {/* ── Portrait Card Grid ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {totalContacts === 0 && potentialDates.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No relationships yet</p>
            <p className="text-xs mt-1 opacity-60">Meet people at events and through your career</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {/* Regular contacts as portrait cards */}
            {contacts.map((contact, idx) => {
              const catMeta = categories.find(c => c.type === contact.type)
              const tagLabel = catMeta?.label || contact.type.replace(/_/g, ' ')
              const tagColor = catMeta?.color || 'text-text-muted'
              const tagBg = catMeta ? `${catMeta.barColor.replace('bg-', 'bg-')}/15` : 'bg-surface-dark/50'
              const barColor = catMeta?.barColor || 'bg-gray-500'
              
              return (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setDetailContact(contact)}
                  className="relative rounded-xl overflow-hidden cursor-pointer group border border-border/10 hover:border-border/30 transition-all hover:scale-[1.02]"
                  style={{ aspectRatio: '3 / 4' }}
                >
                  {/* Portrait fills the card */}
                  <PortraitImage
                    src={getContactPortrait(contactToContactInfo(contact))}
                    name={contact.name}
                    variant="card"
                  />
                  
                  {/* Online indicator */}
                  {contact.isOnline && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full border border-black/30 shadow-lg shadow-green-500/30" />
                  )}
                  
                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-10 pb-2.5 px-2.5">
                    {/* Type tag */}
                    <span className={`text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${tagColor} border border-current/20`}
                      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                    >
                      {tagLabel}
                    </span>
                    
                    {/* Name */}
                    <p className="text-xs font-bold text-white mt-1 truncate leading-tight">{contact.name}</p>
                    
                    {/* Relationship bars */}
                    <div className="flex flex-col gap-1 mt-1.5">
                      {/* Affection */}
                      <div className="flex items-center gap-1">
                        <Smile className="w-2 h-2 text-pink-400 flex-shrink-0" />
                        <div className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden">
                          <div className="h-full bg-pink-400 rounded-full transition-all" style={{ width: `${contact.affectionMeter}%` }} />
                        </div>
                      </div>
                      {/* Trust */}
                      <div className="flex items-center gap-1">
                        <Shield className="w-2 h-2 text-blue-400 flex-shrink-0" />
                        <div className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${contact.trustMeter}%` }} />
                        </div>
                      </div>
                      {/* Romance (only for romantic types) */}
                      {(contact.type === 'partner' || contact.type === 'potential_date') && (
                        <div className="flex items-center gap-1">
                          <Heart className="w-2 h-2 text-red-400 flex-shrink-0" />
                          <div className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${contact.romanceMeter}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl ring-1 ring-inset ring-white/10" />
                </motion.div>
              )
            })}
            
            {/* Potential dates as portrait cards */}
            {potentialDates.map((date, idx) => {
              const dateName = `${date.firstName} ${date.lastName}`
              const dateContactInfo = { 
                ...date, 
                name: dateName,
                type: 'potential_date' as const,
                currentMood: { overall: 'neutral' as const, energy: 'medium' as const, receptiveness: 70, recentEvents: [] },
                relationshipLevel: 30, affectionMeter: 40, romanceMeter: 30, trustMeter: 40,
                traits: date.traits
              } as ContactInfo
              
              return (
                <motion.div
                  key={date.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (contacts.length + idx) * 0.03 }}
                  className="relative rounded-xl overflow-hidden cursor-pointer group border border-border/10 hover:border-pink-500/30 transition-all hover:scale-[1.02]"
                  style={{ aspectRatio: '3 / 4' }}
                >
                  <PortraitImage
                    src={getContactPortrait(dateContactInfo)}
                    name={dateName}
                    variant="card"
                  />
                  
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-10 pb-2.5 px-2.5">
                    <span className="text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full text-pink-300 border border-pink-300/20"
                      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                    >
                      Dating Prospect
                    </span>
                    <p className="text-xs font-bold text-white mt-1 truncate leading-tight">{dateName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-green-400">{date.compatibilityScore}%</span>
                      <span className="text-[9px] text-pink-400">{date.interestLevel}% interest</span>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl ring-1 ring-inset ring-white/10" />
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function Phone() {
  const { player, careerState, addContact, initializeMessaging, addPersonalCalendarEntry, updateRelationshipMeters, migrateExistingInvitations } = useCareerStore()
  const [activeTab, setActiveTab] = useState('messages')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [detailContact, setDetailContact] = useState<Contact | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [migrationRan, setMigrationRan] = useState(false)
  const [migrationResult, setMigrationResult] = useState<number | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  
  // Open a chat AND show the contact's detail panel on the right
  const openChat = useCallback((contact: Contact) => {
    setSelectedContact(contact)
    setDetailContact(contact)
  }, [])
  const [hasSynced, setHasSynced] = useState(false)
  
  // Get messaging state from store
  const messaging = careerState?.messaging || createDefaultMessagingState()
  const contacts = messaging.contacts
  const conversations = messaging.conversations
  const potentialDates = messaging.potentialDates
  const nowYear = careerState?.currentYear ?? 2024
  const nowWeek = careerState?.currentWeek ?? 1
  const nowDay = careerState?.currentDay ?? 1
  const nowHour = careerState?.dayBudget?.currentHour ?? 7

  const isMessageVisibleNow = useCallback((msg?: TextMessage) => {
    if (!msg?.timestamp) return true
    const ts = msg.timestamp
    const msgYear = ts.year ?? nowYear
    const msgWeek = ts.week ?? nowWeek
    const msgDay = ts.day ?? nowDay
    const msgHour = ts.hour ?? 0
    const messageDisplayHour = Math.floor(msgHour)

    if (msgYear < nowYear) return true
    if (msgYear > nowYear) return false
    if (msgWeek < nowWeek) return true
    if (msgWeek > nowWeek) return false
    if (msgDay < nowDay) return true
    if (msgDay > nowDay) return false
    return messageDisplayHour <= nowHour
  }, [nowYear, nowWeek, nowDay, nowHour])

  const getVisibleUnreadCount = useCallback((conv?: Conversation) => {
    if (!conv?.messages || conv.messages.length === 0) return 0
    return conv.messages.filter((m: any) =>
      m?.sender !== 'player' &&
      !(m?.isRead || m?.read) &&
      isMessageVisibleNow(m)
    ).length
  }, [isMessageVisibleNow])
  
  const getLatestMessageForPreview = useCallback((conv?: Conversation): TextMessage | undefined => {
    if (!conv?.messages || conv.messages.length === 0) return undefined
    const score = (msg: TextMessage) => {
      const ts = msg.timestamp || ({} as any)
      const year = ts.year ?? 0
      const week = ts.week ?? 0
      const day = ts.day ?? 0
      const hour = ts.hour ?? 0
      return (year * 100000000) + (week * 1000000) + (day * 10000) + Math.round(hour * 100)
    }
    const visibleMessages = conv.messages.filter(m => isMessageVisibleNow(m))
    if (visibleMessages.length === 0) return undefined
    return visibleMessages.reduce((latest, current) => {
      return score(current) >= score(latest) ? current : latest
    }, visibleMessages[0])
  }, [isMessageVisibleNow])

  // Calculate total unread
  const totalUnread = Object.values(conversations).reduce((sum, conv) => sum + getVisibleUnreadCount(conv as Conversation), 0)
  
  // Sync automatic contacts on mount (partner, children, etc.)
  useEffect(() => {
    if (careerState && !hasSynced) {
      // Initialize messaging if needed
      if (!careerState.messaging) {
        initializeMessaging()
      }
      
      // Sync automatic contacts (adds staff, rivals, sponsors)
      const syncedContacts = syncAutomaticContacts(careerState, contacts)
      
      // Add any new contacts that were synced, and create intro conversations for them
      syncedContacts.forEach(contact => {
        if (!contacts.find(c => c.id === contact.id)) {
          addContact(contact)
          
          // Create an intro conversation if one doesn't exist yet
          // Also check for conversation keyed with `conv-` prefix (older format)
          const convId = `conv_${contact.id}`
          const convIdAlt = `conv-${contact.id}`
          const existingConversations = careerState.messaging?.conversations ?? {}
          if (!existingConversations[convId] && !existingConversations[convIdAlt]) {
            // Build a contextual intro message based on the contact's role.
            // IMPORTANT: partner/family checks come FIRST so they can never
            // accidentally receive a staff-style intro message.
            let introMsg = `Hey! Great to be connected.`
            if (contact.type === 'partner') {
              introMsg = `Hey love! ❤️`
            } else if (contact.type === 'family') {
              introMsg = `Hey! So happy we can chat on here now 💕`
            } else if (contact.staffRole === 'personal_assistant') {
              introMsg = `Hey boss! I'm your personal assistant, I'll be helping you stay organized with schedules, travel, and anything else you need. Don't hesitate to reach out! 😊`
            } else if (contact.staffRole) {
              const roleName = contact.staffRole.replace(/_/g, ' ')
              introMsg = `Hi! Looking forward to working with you. Feel free to message me about anything ${roleName}-related.`
            } else if (contact.isStarterContact) {
              // Starter contacts from career creation should already have
              // their conversations — skip creating a generic one here.
              // If we reach this point it means their conversation was lost;
              // use a neutral fallback instead of a PA-style message.
              introMsg = `Hey! Glad we're connected on here 😊`
            }
            
            const conv = createConversation(contact, introMsg, careerState.currentWeek, careerState.currentYear, careerState.currentDay, careerState.dayBudget?.currentHour)
            const storeState = useCareerStore.getState()
            if (storeState.careerState?.messaging) {
              useCareerStore.setState({
                careerState: {
                  ...storeState.careerState,
                  messaging: {
                    ...storeState.careerState.messaging,
                    conversations: {
                      ...storeState.careerState.messaging.conversations,
                      [conv.id]: conv,
                    },
                    unreadTotal: (storeState.careerState.messaging.unreadTotal || 0) + 1,
                  }
                }
              })
            }
          }
        }
      })
      
      // Sync group chats based on current contacts
      if (careerState.messaging) {
        const updatedGroups = syncGroupChats(
          careerState,
          syncedContacts,
          careerState.messaging.groupConversations || {}
        )
        // Store group chats if any were created
        if (Object.keys(updatedGroups).length > 0 && !careerState.messaging.groupConversations) {
          // Would update store - using store action if available
          const storeState = useCareerStore.getState()
          if (storeState.careerState?.messaging) {
            useCareerStore.setState({
              careerState: {
                ...storeState.careerState,
                messaging: {
                  ...storeState.careerState.messaging,
                  groupConversations: updatedGroups,
                }
              }
            })
          }
        }
        
        // Build social graph
        const socialGraph = buildSocialGraph(syncedContacts)
        if (Object.keys(socialGraph).length > 0 && !careerState.messaging.socialConnections) {
          const storeState = useCareerStore.getState()
          if (storeState.careerState?.messaging) {
            useCareerStore.setState({
              careerState: {
                ...storeState.careerState,
                messaging: {
                  ...storeState.careerState.messaging,
                  socialConnections: socialGraph,
                }
              }
            })
          }
        }
      }
      
      setHasSynced(true)
    }
  }, [careerState, contacts, hasSynced, addContact, initializeMessaging])
  
  // Convert ContactInfo[] to Contact[] for UI, with dynamic online status
  const gameHour = (careerState as any)?.dayBudget?.currentHour ?? 9
  const gameDay = careerState?.currentDay ?? 1
  const uiContacts = useMemo(() => {
    return contacts.map(c => {
      const { isOnline, lastSeen } = calculateContactOnlineStatus(c, gameHour, gameDay)
      return contactInfoToContact({ ...c, isOnline, lastSeen })
    })
  }, [contacts, gameHour, gameDay])
  
  const filteredContacts = useMemo(() => {
    const filtered = uiContacts.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    // Sort by most recent message (like WhatsApp — newest chats at top)
    filtered.sort((a, b) => {
      const convA = conversations[`conv_${a.id}`] || conversations[`conv-${a.id}`]
      const convB = conversations[`conv_${b.id}`] || conversations[`conv-${b.id}`]
      const timeA = convA?.lastMessageTime
      const timeB = convB?.lastMessageTime
      
      // Contacts without conversations go to the bottom
      if (!timeA && !timeB) return 0
      if (!timeA) return 1
      if (!timeB) return -1
      
      // Compare by year, then week, then day (most recent first)
      const scoreA = (timeA.year ?? 0) * 100000 + (timeA.week ?? 0) * 100 + (timeA.day ?? 0)
      const scoreB = (timeB.year ?? 0) * 100000 + (timeB.week ?? 0) * 100 + (timeB.day ?? 0)
      return scoreB - scoreA
    })
    
    return filtered
  }, [uiContacts, searchQuery, conversations])
  
  const favoriteContacts = useMemo(() => 
    uiContacts.filter(c => c.isFavorite),
    [uiContacts]
  )
  
  // ── Global polling: deliver ready NPC replies even when conversation isn't open ──
  // This fixes the "typing..." indicator getting stuck in the chat list because
  // deliverPendingNpcReply was only called from inside ConversationView.
  // IMPORTANT: Skip conversations that are currently open — the local ConversationView poller handles those.
  const { deliverPendingNpcReply } = useCareerStore()
  const openContactId = selectedContact?.id ?? null
  useEffect(() => {
    const pendingReplies = messaging.pendingNpcReplies
    if (!pendingReplies || Object.keys(pendingReplies).length === 0) return
    
    const pollInterval = setInterval(() => {
      const currentPending = useCareerStore.getState().careerState?.messaging?.pendingNpcReplies
      if (!currentPending) return
      
      for (const convId of Object.keys(currentPending)) {
        // Skip the currently open conversation — its local poller handles delivery
        // Handle both conv_ and conv- formats
        const contactIdFromConv = convId.replace(/^conv[_-]/, '')
        if (contactIdFromConv === openContactId) continue
        
        const pending = currentPending[convId]
        if (pending.status === 'ready' && pending.generatedResponse) {
          const elapsed = Date.now() - pending.queuedAt
          if (elapsed >= pending.deliverAfterMs) {
            deliverPendingNpcReply(convId)
            console.log(`[Phone] Global poller delivered ready NPC reply for ${convId}`)
          }
        }
      }
    }, 1000)
    
    return () => clearInterval(pollInterval)
  }, [messaging.pendingNpcReplies, deliverPendingNpcReply, openContactId])
  
  // ── Scan existing messages for invitations (async — uses AI) ──
  const handleScanForInvitations = useCallback(async () => {
    if (isScanning) return
    setIsScanning(true)
    try {
      const count = await migrateExistingInvitations()
      setMigrationResult(count)
      setMigrationRan(true)
      if (count > 0) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Found ${count} invitation${count !== 1 ? 's' : ''} in your messages!`, type: 'success' } }))
      } else {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'No new invitations found in messages', type: 'info' } }))
      }
    } catch (e) {
      console.error('[Phone] Migration scan failed:', e)
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Scan failed — try again', type: 'error' } }))
    } finally {
      setIsScanning(false)
    }
  }, [migrateExistingInvitations, isScanning])
  
  // ── Accept/Decline contact request handlers ──
  const handleAcceptRequest = useCallback((requestId: string) => {
    const storeState = useCareerStore.getState()
    const currentMessaging = storeState.careerState?.messaging
    if (!currentMessaging) return
    
    const request = currentMessaging.pendingRequests?.find(r => r.id === requestId)
    if (!request) return
    
    const contact = currentMessaging.contacts.find(c => c.id === request.contactId)
    const contactName = contact?.name?.split(' ')[0] || 'Contact'
    
    // Determine scheduling: use suggestedWeek + suggestedDay for smart booking
    const cWeek = storeState.careerState?.currentWeek ?? 1
    const cDay = storeState.careerState?.currentDay ?? 1
    const cYear = storeState.careerState?.currentYear ?? 1
    
    let schedDay = request.suggestedDay || 6  // Default to Saturday if no day suggested
    let schedWeek: number
    
    if (request.suggestedWeek) {
      // Use the NPC's suggested week directly
      schedWeek = request.suggestedWeek
      // If the suggested date has already passed, push to next week
      if (schedWeek === cWeek && schedDay <= cDay) {
        schedWeek = cWeek + 1
      } else if (schedWeek < cWeek) {
        schedWeek = cWeek + 1
      }
    } else {
      // Fallback: book this week if day hasn't passed, otherwise next week
      schedWeek = schedDay > cDay ? cWeek : cWeek + 1
    }
    
    // Build activity name — prefer eventName from AI, fallback to type-based name
    const fallbackNames: Record<string, string> = {
      dinner_invite: `Dinner with ${contactName}`,
      social_invite: `Event with ${contactName}`,
      date_request: `Date with ${contactName}`,
      media_request: `Interview with ${contactName}`,
      sponsor_appearance: `Sponsor event: ${contactName}`,
      charity_ask: `Charity event with ${contactName}`,
      introduction: `Meeting via ${contactName}`,
      race_tickets: `Paddock passes for ${contactName}`,
      advice: `Catch-up with ${contactName}`,
      career_favor: `Favour for ${contactName}`,
      contract_talk: `Contract discussion with ${contactName}`,
      wager: `Wager with ${contactName}`,
    }
    const activityName = request.eventName || fallbackNames[request.type] || `${request.description.slice(0, 40)}`
    
    const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const pickPreferredPeriod = (req: any): DayPeriod => {
      const text = `${req?.eventName || ''} ${req?.description || ''}`.toLowerCase()
      if (/\bdinner\b|\bdate night\b|\bevening\b|\bnight\b|\bdrinks?\b|\bconcert\b|\bcinema\b|\bmovie\b/.test(text)) return 'evening'
      if (/\bbreakfast\b|\bbrunch\b|\bmorning\b/.test(text)) return 'morning'
      if (/\blunch\b|\bafternoon\b/.test(text)) return 'afternoon'
      if (/\bcycling\b|\bbike\b|\bbiking\b|\bhike\b|\bwalk\b|\btrail\b/.test(text)) return 'morning'

      switch (req?.type) {
        case 'dinner_invite':
        case 'date_request':
          return 'evening'
        case 'media_request':
          return 'morning'
        case 'sponsor_appearance':
        case 'charity_ask':
        case 'introduction':
        case 'career_favor':
        case 'advice':
          return 'afternoon'
        case 'race_tickets':
        case 'social_invite':
        default:
          return 'afternoon'
      }
    }
    const preferredPeriod = pickPreferredPeriod(request)
    
    // ── Generic category & stat-effect mapping ──
    // These provide base reputation / board / sponsor effects for the calendar outcome modal.
    // Relationship effects (affection, trust, romance) are handled separately via socialActionMeta
    // so they go through the proper love-language / interest-bonus pipeline in completeActivity.
    const categoryMap: Record<string, ActivityCategory> = {
      dinner_invite: 'social', social_invite: 'social', date_request: 'romance',
      media_request: 'media', sponsor_appearance: 'sponsor', charity_ask: 'social',
      introduction: 'social', race_tickets: 'social', advice: 'social',
      career_favor: 'social', contract_talk: 'team', wager: 'social',
    }
    const statEffectsMap: Record<string, Record<string, number>> = {
      dinner_invite:       { reputation: 1, boardMood: 1 },
      social_invite:       { reputation: 2, boardMood: 1 },
      date_request:        { reputation: 1 },
      media_request:       { reputation: 3, boardMood: 2, marketability: 2 },
      sponsor_appearance:  { reputation: 3, boardMood: 3, sponsorSatisfaction: 5 },
      charity_ask:         { reputation: 4, boardMood: 2, fanSentiment: 3 },
      introduction:        { reputation: 2, boardMood: 1 },
      race_tickets:        { reputation: 1, fanSentiment: 1 },
      advice:              { reputation: 1 },
      career_favor:        { reputation: 2, boardMood: 1 },
      contract_talk:       { boardMood: 2 },
      wager:               { reputation: 1 },
    }
    
    // ── Generic relationship effects based on invitation type + contact type ──
    // These flow through socialActionMeta → completeActivity → updateRelationshipMeters
    // which applies love-language & interest bonuses automatically.
    const contactType = contact?.type || 'friend'
    const isRomantic = contactType === 'partner' || contactType === 'potential_date' || request.type === 'date_request'
    const isBusiness = contactType === 'business' || contactType === 'sponsor_rep' || contactType === 'team_principal'
    
    // Base relationship reward from the request, or derive from invitation nature
    const baseReward = request.relationshipReward || 3
    const relationshipEffects: { affection?: number; trust?: number; romance?: number } = {
      affection: baseReward,
      trust: Math.ceil(baseReward * 0.6),
      ...(isRomantic ? { romance: Math.ceil(baseReward * 0.8) } : {}),
    }
    // Business contacts gain more trust, less affection
    if (isBusiness) {
      relationshipEffects.trust = baseReward
      relationshipEffects.affection = Math.ceil(baseReward * 0.5)
    }
    
    // ── Social action category for the completeActivity pipeline ──
    const socialCategoryMap: Record<string, string> = {
      dinner_invite: 'dining', social_invite: 'event_invite', date_request: 'romantic',
      media_request: 'professional', sponsor_appearance: 'professional', charity_ask: 'event_invite',
      introduction: 'professional', race_tickets: 'casual', advice: 'casual',
      career_favor: 'professional', contract_talk: 'professional', wager: 'casual',
    }
    
    addPersonalCalendarEntry({
      name: activityName,
      description: request.venue ? `${request.description}\n📍 ${request.venue}` : request.description,
      activityId: `contact_request_${request.type}`,
      category: categoryMap[request.type] || 'social',
      preferredPeriod,
      week: schedWeek,
      day: schedDay,
      duration: request.timeCost || 2,
      drainLevel: 'low',
      calendarEntryType: 'personal',
      effectsOnComplete: statEffectsMap[request.type] || { reputation: 1 },
      socialActionMeta: {
        contactId: request.contactId,
        actionId: `contact_request_${request.type}`,
        contactName: contact?.name || 'Contact',
        effects: relationshipEffects,
        cost: request.moneyCost || 0,
        category: socialCategoryMap[request.type] || 'event_invite',
      },
    })
    
    // Mark request as accepted with scheduling info
    // IMPORTANT: Re-read fresh state AFTER addPersonalCalendarEntry to avoid overwriting the new activity
    const freshState = useCareerStore.getState()
    const freshMessaging = freshState.careerState?.messaging
    if (!freshMessaging) return
    
    const updatedRequests = (freshMessaging.pendingRequests || []).map(r =>
      r.id === requestId 
        ? { ...r, status: 'accepted' as const, scheduledWeek: schedWeek, scheduledDay: schedDay, scheduledYear: cYear }
        : r
    )
    
    useCareerStore.setState({
      careerState: {
        ...freshState.careerState!,
        messaging: {
          ...freshMessaging,
          pendingRequests: updatedRequests,
        }
      }
    })
    
    // Small immediate relationship nudge for saying "yes" (main effects fire on completion day)
    if (contact) {
      updateRelationshipMeters(contact.id, {
        affection: 1,
        trust: 1,
      })
    }
    
    // Show confirmation toast
    const schedDayName = dayNames[schedDay] || `Day ${schedDay}`
    const toastMsg = schedWeek === cWeek 
      ? `${activityName} booked for this ${schedDayName}` 
      : schedWeek === cWeek + 1 
        ? `${activityName} booked for next ${schedDayName}`
        : `${activityName} booked for Week ${schedWeek}, ${schedDayName}`
    console.log(`[Phone] Accepted request ${requestId}: ${toastMsg}`)
    
    // Dispatch a toast notification if the toast system is available
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: toastMsg, type: 'success' } }))
  }, [addPersonalCalendarEntry, updateRelationshipMeters])
  
  const handleDeclineRequest = useCallback((requestId: string) => {
    const storeState = useCareerStore.getState()
    const currentMessaging = storeState.careerState?.messaging
    if (!currentMessaging) return
    
    const request = currentMessaging.pendingRequests?.find(r => r.id === requestId)
    if (!request) return
    
    const contact = currentMessaging.contacts.find(c => c.id === request.contactId)
    
    // Mark request as declined
    const updatedRequests = (currentMessaging.pendingRequests || []).map(r =>
      r.id === requestId ? { ...r, status: 'declined' as const } : r
    )
    
    useCareerStore.setState({
      careerState: {
        ...storeState.careerState!,
        messaging: {
          ...currentMessaging,
          pendingRequests: updatedRequests,
        }
      }
    })
    
    // Small relationship penalty for declining
    if (contact) {
      updateRelationshipMeters(contact.id, {
        affection: -2,
        trust: -1,
      })
    }
    
    console.log(`[Phone] Declined request ${requestId}`)
  }, [updateRelationshipMeters])
  
  if (!player || !careerState) return null
  
  const playerName = `${player.firstName} ${player.lastName}`
  const currentWeek = careerState.currentWeek
  const currentYear = careerState.currentYear
  const currentDay = careerState.currentDay
  
  // ── Invitations data ──
  const allRequests = messaging.pendingRequests || []
  const pendingInvitations = allRequests.filter(r => r.status === 'pending')
  const acceptedInvitations = allRequests.filter(r => r.status === 'accepted').sort((a, b) => {
    const aWeek = a.scheduledWeek ?? a.suggestedWeek ?? 999
    const bWeek = b.scheduledWeek ?? b.suggestedWeek ?? 999
    const aDay = a.scheduledDay ?? a.suggestedDay ?? 7
    const bDay = b.scheduledDay ?? b.suggestedDay ?? 7
    return aWeek !== bWeek ? aWeek - bWeek : aDay - bDay
  })
  const pastInvitations = allRequests.filter(r => r.status === 'declined' || r.status === 'expired' || r.status === 'completed')
  const pendingInvitationCount = pendingInvitations.length
  
  // Compute game time display for phone status bar
  const dayHour = (careerState as any).dayBudget?.currentHour ?? 9
  const gameTimeStr = `${dayHour}:${Math.floor(Math.random() * 6)}${Math.floor(Math.random() * 10)}`
  
  // If a contact is selected, show conversation view wrapped in phone frame
  if (selectedContact) {
    const conversationId = conversations[`conv_${selectedContact.id}`] ? `conv_${selectedContact.id}` : 
                           conversations[`conv-${selectedContact.id}`] ? `conv-${selectedContact.id}` : `conv_${selectedContact.id}`
    const conversation = conversations[conversationId] || {
      id: conversationId,
      contactId: selectedContact.id,
      contactName: selectedContact.name,
      contactType: selectedContact.type === 'partner' || selectedContact.type === 'potential_date' ? 'romantic' : 
                   selectedContact.type === 'family' ? 'family' : 'social',
      isActive: true,
      lastMessageTime: { week: currentWeek, day: currentDay, year: currentYear },
      unreadCount: 0,
      messages: [],
      relationshipLevel: selectedContact.relationshipLevel,
      currentMood: selectedContact.mood,
      awaitingResponse: false,
      conversationStage: 'new'
    } as Conversation
    
    return (
      <div className="bg-white w-full h-full overflow-y-auto">
        <div className="flex gap-[24px] p-[24px] h-[calc(100vh-120px)]">
        {/* Left column: Phone + Responses (same width) */}
        <div className="flex-shrink-0 flex flex-col gap-[12px] w-[390px]">
          <PhoneFrame gameTime={gameTimeStr} notificationCount={totalUnread}>
            <ConversationView
              contact={selectedContact}
              conversation={conversation}
              onBack={() => { setSelectedContact(null); setDetailContact(null) }}
              playerName={playerName}
              responsePortalId="phone-response-panel"
            />
          </PhoneFrame>
          <div className="w-full bg-surface-darker/30 rounded-2xl border border-border/10 overflow-hidden max-h-[40vh] flex flex-col">
            <div className="px-4 py-2 text-xs text-text-muted flex items-center gap-2 border-b border-border/10">
              <Sparkles className="w-3.5 h-3.5 text-racing-red" />
              Response Options
            </div>
            <div id="phone-response-panel" className="flex-1 min-h-0 overflow-y-auto">
              {!selectedContact && (
                <div className="p-4 text-xs text-text-muted">Open a conversation to respond.</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right column: Relationships panel */}
        <div className="flex-1 min-w-0 bg-surface-darker/30 rounded-2xl border border-border/10 overflow-hidden flex flex-col">
          <RelationshipsDashboard
            contacts={uiContacts}
            potentialDates={potentialDates}
            messaging={messaging}
            onSelectContact={openChat}
            currentWeek={currentWeek}
            currentYear={currentYear}
            detailContact={detailContact}
            onDetailContactChange={setDetailContact}
          />
        </div>
      </div>
      </div>
    )
  }
  
  // ── Main phone screen (chat list) ── SIDE BY SIDE: Phone left, Relationships right
  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="flex gap-[24px] p-[24px] h-[calc(100vh-120px)]">
      {/* ════════ LEFT: Phone + Responses ════════ */}
      <div className="flex-shrink-0 w-[390px] flex flex-col gap-[12px]">
        <PhoneFrame gameTime={gameTimeStr} notificationCount={totalUnread}>
          <div className="flex flex-col h-full">
            {/* ── WhatsApp-style header ── */}
            <div className="px-4 pt-2 pb-1 bg-[#1f2c34]">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-lg font-bold text-[#e9edef]">Messages</h1>
                <div className="flex items-center gap-3">
                  {totalUnread > 0 && (
                    <span className="bg-[#00a884] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {totalUnread}
                    </span>
                  )}
                  <Search className="w-4 h-4 text-[#8696a0] cursor-pointer" />
                </div>
              </div>
              
              {/* Tab bar inside phone - Chats, Invites, Contacts */}
              <div className="flex gap-1">
                {[
                  { id: 'messages', label: 'Chats', badge: totalUnread },
                  { id: 'invitations', label: 'Invites', badge: pendingInvitationCount },
                  { id: 'contacts', label: 'Contacts', badge: 0 },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 py-2 text-xs font-medium rounded-t-lg transition-colors relative
                      ${activeTab === tab.id 
                        ? 'text-[#00a884] border-b-2 border-[#00a884]' 
                        : 'text-[#8696a0] hover:text-[#e9edef]'
                      }
                    `}
                  >
                    {tab.label}
                    {tab.badge > 0 && (
                      <span className="ml-1 bg-[#00a884] text-white text-[9px] font-bold px-1 py-0.5 rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* ── Content area ── */}
            <div className="flex-1 overflow-y-auto bg-[#0b141a]">
              <AnimatePresence mode="wait">
                {/* ── Messages Tab ── */}
                {activeTab === 'messages' && (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 space-y-1"
                >
                  {/* Search bar */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8696a0]" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#202c33] rounded-lg text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none"
                    />
                  </div>
                  
                  {/* Favorites row */}
                  {favoriteContacts.length > 0 && (
                    <div className="mb-3 pb-3 border-b border-[#222d34]">
                      <div className="flex gap-3 overflow-x-auto">
                        {favoriteContacts.map(contact => {
                          const convId = `conv_${contact.id}`
                          const conv = conversations[convId] || conversations[`conv-${contact.id}`]
                          const visibleUnread = getVisibleUnreadCount(conv as Conversation | undefined)
                          return (
                            <button
                              key={contact.id}
                              onClick={() => openChat(contact)}
                              className="flex flex-col items-center gap-1 min-w-[52px]"
                            >
                              <div className="relative">
                                <PortraitImage
                                  src={getContactPortrait(contactToContactInfo(contact))}
                                  name={contact.name}
                                  size="lg"
                                />
                                {contact.isOnline && (
                                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00a884] rounded-full border-2 border-[#0b141a]" />
                                )}
                                {visibleUnread > 0 && (
                                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#00a884] rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                                    {visibleUnread}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] text-[#8696a0] truncate max-w-[52px]">
                                {contact.name.split(' ')[0]}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Pending invitations banner — tap to go to Invites tab */}
                  {pendingInvitationCount > 0 && (
                    <button
                      onClick={() => setActiveTab('invitations')}
                      className="w-full mb-2 p-2.5 bg-[#182229] border border-[#00a884]/30 rounded-lg flex items-center gap-2.5 hover:bg-[#1e2d36] transition-colors text-left"
                    >
                      <div className="w-8 h-8 bg-[#00a884]/15 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-[#00a884]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-[#e9edef]">
                          {pendingInvitationCount} pending invitation{pendingInvitationCount !== 1 ? 's' : ''}
                        </p>
                        <p className="text-[9px] text-[#8696a0]">Tap to view and respond</p>
                      </div>
                      <ChevronLeft className="w-3.5 h-3.5 text-[#8696a0] rotate-180 flex-shrink-0" />
                    </button>
                  )}
                  
                  {/* Group chats */}
                  {messaging.groupConversations && Object.keys(messaging.groupConversations).length > 0 && (
                    <div className="mb-2">
                      {Object.values(messaging.groupConversations).map(group => {
                        const typeIcons: Record<string, string> = {
                          team_staff: '🏎️', series_drivers: '🏁', family: '👨‍👩‍👧‍👦', friend_group: '🎉',
                        }
                        return (
                          <div
                            key={group.id}
                            className="flex items-center gap-3 px-1 py-2.5 border-b border-[#222d34] cursor-pointer hover:bg-[#182229] transition-colors"
                          >
                            <div className="w-10 h-10 bg-[#202c33] rounded-full flex items-center justify-center text-base flex-shrink-0">
                              {typeIcons[group.type] || '💬'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#e9edef]">{group.name}</span>
                                <span className="text-[10px] text-[#8696a0]">{group.participantIds.length} members</span>
                              </div>
                              <p className="text-xs text-[#8696a0] truncate">
                                {group.messages.length > 0 ? group.messages[0]?.content : 'No messages yet'}
                              </p>
                            </div>
                            {group.unreadCount > 0 && (
                              <span className="bg-[#00a884] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {group.unreadCount}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  
                  {/* Individual conversations */}
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map(contact => {
                      const convId = `conv_${contact.id}`
                      const conv = conversations[convId] || conversations[`conv-${contact.id}`]
                      const lastMsg = getLatestMessageForPreview(conv)
                      const visibleUnread = getVisibleUnreadCount(conv as Conversation | undefined)
                      const typeColors: Record<string, string> = {
                        partner: 'bg-pink-500', potential_date: 'bg-pink-400',
                        family: 'bg-yellow-500', friend: 'bg-green-500',
                        business: 'bg-blue-500', team_staff: 'bg-cyan-500',
                        rival_driver: 'bg-orange-500', sponsor_rep: 'bg-emerald-500',
                        team_principal: 'bg-purple-500',
                      }
                      
                      return (
                        <div
                          key={contact.id}
                          onClick={() => openChat(contact)}
                          className="flex items-center gap-3 px-1 py-2.5 border-b border-[#222d34] cursor-pointer hover:bg-[#182229] transition-colors"
                        >
                          <div className="relative flex-shrink-0">
                            <PortraitImage
                              src={getContactPortrait(contactToContactInfo(contact))}
                              name={contact.name}
                              size="lg"
                            />
                            {contact.isOnline && (
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00a884] rounded-full border-2 border-[#0b141a]" />
                            )}
                            {/* Type indicator dot */}
                            <div className={`absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full border border-[#0b141a] ${typeColors[contact.type] || 'bg-gray-500'}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-[#e9edef] truncate">{contact.name}</span>
                              {lastMsg && (
                                <span className="text-[10px] text-[#8696a0] flex-shrink-0 ml-2">
                                  {getConversationListTimestamp(
                                    lastMsg.timestamp?.week ?? 1,
                                    lastMsg.timestamp?.day ?? 1,
                                    lastMsg.timestamp?.hour ?? 12,
                                    lastMsg.timestamp?.year ?? 2024,
                                    careerState?.currentWeek ?? 1,
                                    careerState?.currentDay ?? 1,
                                    careerState?.currentYear ?? 2024
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-[#8696a0] truncate flex-1">
                                {(messaging.pendingNpcReplies?.[convId] || messaging.pendingNpcReplies?.[`conv-${contact.id}`]) &&
                                 (((messaging.pendingNpcReplies?.[convId] || messaging.pendingNpcReplies?.[`conv-${contact.id}`])?.status === 'generating') ||
                                  ((messaging.pendingNpcReplies?.[convId] || messaging.pendingNpcReplies?.[`conv-${contact.id}`])?.status === 'ready')) ? (
                                  <span className="text-[#00a884] italic">typing...</span>
                                ) : lastMsg ? (
                                  <>
                                    {lastMsg.sender === 'player' && (
                                      <span className="text-[#53bdeb]">
                                        {lastMsg.isRead ? '✓✓ ' : '✓ '}
                                      </span>
                                    )}
                                    {lastMsg.content}
                                  </>
                                ) : (
                                  <span className="italic">Start a conversation</span>
                                )}
                              </p>
                              {visibleUnread > 0 && (
                                <span className="bg-[#00a884] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ml-2 flex-shrink-0">
                                  {visibleUnread}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-12 text-[#8696a0]">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No conversations yet</p>
                      <p className="text-xs mt-1 opacity-60">Meet people at social events</p>
                    </div>
                  )}
                </motion.div>
              )}
              
              {/* ── Invitations Tab ── */}
              {activeTab === 'invitations' && (
                <motion.div
                  key="invitations"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 space-y-3"
                >
                  {/* Pending Invitations */}
                  {pendingInvitations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Clock className="w-3.5 h-3.5 text-[#00a884]" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#00a884]">
                          Pending ({pendingInvitations.length})
                        </span>
                      </div>
                      {pendingInvitations.map(request => {
                        const reqContact = contacts.find(c => c.id === request.contactId)
                        const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                        const sugDay = request.suggestedDay ? dayNames[request.suggestedDay] : null
                        const sugWeek = request.suggestedWeek
                        const isThisWeek = sugWeek === currentWeek
                        const isNextWeek = sugWeek === currentWeek + 1
                        const dateLabel = sugDay 
                          ? `${isThisWeek ? 'This' : isNextWeek ? 'Next' : `Wk ${sugWeek}`} ${sugDay}`
                          : null
                        const typeIcons: Record<string, string> = {
                          dinner_invite: '🍽️', social_invite: '🎉', date_request: '💕',
                          media_request: '📰', sponsor_appearance: '🤝', charity_ask: '❤️',
                          introduction: '👋', race_tickets: '🏁', advice: '💬', career_favor: '💼',
                          contract_talk: '📋', wager: '🎲',
                        }
                        return (
                          <div
                            key={request.id}
                            className="p-3 mb-2 bg-[#182229] border border-[#00a884]/30 rounded-xl"
                          >
                            <div className="flex items-start gap-2.5">
                              {reqContact && (
                                <PortraitImage
                                  src={getContactPortrait(contactToContactInfo(reqContact as any))}
                                  name={reqContact.name}
                                  size="md"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-sm">{typeIcons[request.type] || '📩'}</span>
                                  <span className="text-xs font-medium text-[#e9edef] truncate">
                                    {request.eventName || (reqContact?.name ? `${reqContact.name.split(' ')[0]}'s invite` : 'Invitation')}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#8696a0] leading-snug mb-1.5">{request.description}</p>
                                <div className="flex items-center gap-2 text-[10px] flex-wrap">
                                  {dateLabel && (
                                    <span className="flex items-center gap-0.5 text-[#00a884] font-medium">
                                      <Calendar className="w-3 h-3" />
                                      {dateLabel}
                                    </span>
                                  )}
                                  {request.venue && (
                                    <span className="flex items-center gap-0.5 text-[#8696a0]">
                                      <MapPin className="w-3 h-3" />
                                      {request.venue}
                                    </span>
                                  )}
                                  {request.timeCost ? (
                                    <span className="text-[#8696a0]">{request.timeCost}h</span>
                                  ) : null}
                                  {request.moneyCost ? (
                                    <span className="text-[#8696a0]">${request.moneyCost.toLocaleString()}</span>
                                  ) : null}
                                </div>
                                {reqContact && (
                                  <p className="text-[9px] text-[#8696a0] mt-1">From {reqContact.name}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2.5">
                              <button 
                                onClick={() => handleAcceptRequest(request.id)}
                                className="flex-1 py-1.5 text-[11px] font-medium bg-[#00a884] text-white rounded-lg hover:bg-[#00c896] transition-colors"
                              >Accept</button>
                              <button 
                                onClick={() => handleDeclineRequest(request.id)}
                                className="flex-1 py-1.5 text-[11px] font-medium bg-[#374045] text-[#8696a0] rounded-lg hover:bg-[#4a5560] transition-colors"
                              >Decline</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  
                  {/* Upcoming (Accepted) Invitations */}
                  {acceptedInvitations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Calendar className="w-3.5 h-3.5 text-[#53bdeb]" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#53bdeb]">
                          Upcoming ({acceptedInvitations.length})
                        </span>
                      </div>
                      {acceptedInvitations.map(request => {
                        const reqContact = contacts.find(c => c.id === request.contactId)
                        const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                        const schedDay = request.scheduledDay ? dayNames[request.scheduledDay] : '?'
                        const schedWeek = request.scheduledWeek ?? '?'
                        const typeIcons: Record<string, string> = {
                          dinner_invite: '🍽️', social_invite: '🎉', date_request: '💕',
                          media_request: '📰', sponsor_appearance: '🤝', charity_ask: '❤️',
                          introduction: '👋', race_tickets: '🏁', advice: '💬', career_favor: '💼',
                          contract_talk: '📋', wager: '🎲',
                        }
                        return (
                          <div
                            key={request.id}
                            className="p-2.5 mb-1.5 bg-[#182229] border border-[#53bdeb]/20 rounded-xl"
                          >
                            <div className="flex items-center gap-2.5">
                              {reqContact && (
                                <PortraitImage
                                  src={getContactPortrait(contactToContactInfo(reqContact as any))}
                                  name={reqContact.name}
                                  size="sm"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs">{typeIcons[request.type] || '📩'}</span>
                                  <span className="text-[11px] font-medium text-[#e9edef] truncate">
                                    {request.eventName || request.description.slice(0, 35)}
                                  </span>
                                </div>
                                {reqContact && (
                                  <p className="text-[9px] text-[#8696a0] mt-0.5">with {reqContact.name.split(' ')[0]}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 px-2 py-1 bg-[#53bdeb]/10 rounded-lg flex-shrink-0">
                                <Calendar className="w-3 h-3 text-[#53bdeb]" />
                                <span className="text-[10px] text-[#53bdeb] font-medium">Wk {schedWeek} {schedDay}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  
                  {/* Past/Expired Invitations */}
                  {pastInvitations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <X className="w-3.5 h-3.5 text-[#8696a0]" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8696a0]">
                          Past ({pastInvitations.length})
                        </span>
                      </div>
                      {pastInvitations.slice(0, 5).map(request => {
                        const reqContact = contacts.find(c => c.id === request.contactId)
                        const statusLabels: Record<string, string> = {
                          declined: 'Declined', expired: 'Expired', completed: 'Completed',
                        }
                        const statusColors: Record<string, string> = {
                          declined: 'text-red-400', expired: 'text-[#8696a0]', completed: 'text-[#00a884]',
                        }
                        return (
                          <div
                            key={request.id}
                            className="p-2 mb-1 bg-[#182229]/60 border border-[#222d34]/40 rounded-lg opacity-60"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] text-[#e9edef]/70 truncate block">
                                  {request.eventName || request.description.slice(0, 40)}
                                </span>
                                <span className="text-[9px] text-[#8696a0]">
                                  {reqContact ? `from ${reqContact.name.split(' ')[0]}` : ''}
                                </span>
                              </div>
                              <span className={`text-[9px] font-medium ${statusColors[request.status] || 'text-[#8696a0]'}`}>
                                {statusLabels[request.status] || request.status}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  
                  {/* Scan messages button */}
                  {!migrationRan && (
                    <button
                      onClick={handleScanForInvitations}
                      disabled={isScanning}
                      className={`w-full p-2.5 mb-3 bg-[#202c33] border border-[#00a884]/20 rounded-xl flex items-center gap-2.5 transition-colors text-left ${isScanning ? 'opacity-70 cursor-wait' : 'hover:bg-[#1e2d36]'}`}
                    >
                      <div className="w-8 h-8 bg-[#00a884]/15 rounded-full flex items-center justify-center flex-shrink-0">
                        {isScanning ? (
                          <div className="w-4 h-4 border-2 border-[#00a884]/30 border-t-[#00a884] rounded-full animate-spin" />
                        ) : (
                          <Search className="w-4 h-4 text-[#00a884]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-[#e9edef]">
                          {isScanning ? 'Scanning messages...' : 'Scan messages for invitations'}
                        </p>
                        <p className="text-[9px] text-[#8696a0]">
                          {isScanning ? 'AI is analyzing your chats' : 'Check existing chats for missed invites'}
                        </p>
                      </div>
                    </button>
                  )}
                  
                  {/* Empty state */}
                  {pendingInvitations.length === 0 && acceptedInvitations.length === 0 && pastInvitations.length === 0 && (
                    <div className="text-center py-12 text-[#8696a0]">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No invitations yet</p>
                      <p className="text-xs mt-1 opacity-60">Your contacts will invite you to events</p>
                      {!migrationRan && (
                        <button
                          onClick={handleScanForInvitations}
                          disabled={isScanning}
                          className={`mt-3 px-4 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${isScanning ? 'bg-[#00a884]/60 text-white/80 cursor-wait' : 'bg-[#00a884] text-white hover:bg-[#00c896]'}`}
                        >{isScanning ? 'Scanning...' : 'Scan chats for invites'}</button>
                      )}
                      {migrationRan && migrationResult === 0 && (
                        <p className="text-[10px] mt-2 text-[#00a884]">All caught up - no missed invitations</p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
              
              {/* ── Contacts Tab ── */}
              {activeTab === 'contacts' && (
                <motion.div
                  key="contacts"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3"
                >
                  {['partner', 'family', 'friend', 'business', 'team_staff', 'rival_driver', 'sponsor_rep', 'team_principal'].map(type => {
                    const typeContacts = uiContacts.filter(c => c.type === type)
                    if (typeContacts.length === 0) return null
                    const typeLabels: Record<string, string> = {
                      partner: 'Partner', family: 'Family', friend: 'Friends', business: 'Business',
                      team_staff: 'Team Staff', rival_driver: 'Rival Drivers', sponsor_rep: 'Sponsors',
                      team_principal: 'Team Principals',
                    }
                    const typeIcons: Record<string, string> = {
                      partner: '❤️', family: '👨‍👩‍👧', friend: '🤝', business: '💼',
                      team_staff: '🏎️', rival_driver: '🏁', sponsor_rep: '🤝', team_principal: '👔',
                    }
                    
                    return (
                      <div key={type} className="mb-4">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <span className="text-sm">{typeIcons[type]}</span>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#00a884]">
                            {typeLabels[type]} ({typeContacts.length})
                          </span>
                        </div>
                        {typeContacts.map(contact => (
                          <div
                            key={contact.id}
                            onClick={() => setDetailContact(contact)}
                            className="flex items-center gap-3 px-1 py-2 cursor-pointer hover:bg-[#182229] rounded-lg transition-colors"
                          >
                            <PortraitImage
                              src={getContactPortrait(contactToContactInfo(contact))}
                              name={contact.name}
                              size="md"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-[#e9edef]">{contact.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="w-14 h-1 bg-[#202c33] rounded-full overflow-hidden">
                                  <div className="h-full bg-[#00a884] transition-all" style={{ width: `${contact.affectionMeter}%` }} />
                                </div>
                                <span className="text-[9px] text-[#8696a0]">{contact.relationshipLevel}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </motion.div>
              )}
              
            </AnimatePresence>
          </div>
        </div>
        </PhoneFrame>
        <div className="w-full bg-surface-darker/30 rounded-2xl border border-border/10 overflow-hidden">
          <div className="px-4 py-2 text-xs text-text-muted flex items-center gap-2 border-b border-border/10">
            <Sparkles className="w-3.5 h-3.5 text-racing-red" />
            Response Options
          </div>
          <div id="phone-response-panel" className="max-h-[36vh] overflow-y-auto">
            {!selectedContact && (
              <div className="p-4 text-xs text-text-muted">Open a conversation to respond.</div>
            )}
          </div>
        </div>
      </div>
      
      {/* ════════ RIGHT: Relationships Dashboard ════════ */}
      <div className="flex-1 min-w-0 bg-[#f9fafb] rounded-[16px] border-[0.8px] border-black/10 overflow-hidden flex flex-col">
        <RelationshipsDashboard
          contacts={uiContacts}
          potentialDates={potentialDates}
          messaging={messaging}
          onSelectContact={openChat}
          currentWeek={currentWeek}
          currentYear={currentYear}
          detailContact={detailContact}
          onDetailContactChange={setDetailContact}
        />
      </div>
    </div>
    </div>
  )
}

export default Phone
