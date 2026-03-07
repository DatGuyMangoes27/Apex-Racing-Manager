import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, Radio, Tv, Globe, FileText, Send, Users, Star, TrendingUp, TrendingDown, Heart, MessageCircle, Share2, Eye, Camera, Video, Newspaper, Award, AlertTriangle, CheckCircle, Clock, ChevronRight, Plus, X, Loader2, DollarSign, Sparkles, Flame, Shield, Zap, Scale, Target, BarChart3, Building2, PartyPopper, Crown, Calendar, RefreshCw, Briefcase, AlertOctagon, MessageSquare, AlertCircle, ChevronUp, ChevronDown, UserCheck } from 'lucide-react';
import { useToast } from '@/components/ui';

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" };
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 };
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" };
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden';
const INNER = 'bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]';

function Card({ children, className = '', variant, padding, onClick }: { children: React.ReactNode; className?: string; variant?: string; padding?: string; onClick?: () => void }) {
  const padCls = padding === 'lg' ? 'p-[24px]' : padding === 'md' ? 'p-[16px]' : padding === 'sm' ? 'p-[12px]' : '';
  return <div className={`${CARD} ${padCls} ${className}`} onClick={onClick}>{children}</div>;
}
function CardHeader({ title, subtitle, icon, action }: { title: string; subtitle?: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-[12px]">
      <div className="flex items-center gap-[8px]">
        {icon && <span className="text-[#0a0a0a]">{icon}</span>}
        <div>
          <h3 className="text-[16px] text-[#0a0a0a]" style={FBold}>{title}</h3>
          {subtitle && <p className="text-[13px] text-[#4a5565]" style={FR}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
function Badge({ children, className = '', variant, size }: { children: React.ReactNode; className?: string; variant?: string; size?: string }) {
  const colorMap: Record<string, string> = { green: 'bg-[#f0fdf4] text-[#00a63e]', success: 'bg-[#f0fdf4] text-[#00a63e]', blue: 'bg-[#eff6ff] text-[#3b82f6]', red: 'bg-[#fef2f2] text-[#ef4444]', destructive: 'bg-[#fef2f2] text-[#ef4444]', orange: 'bg-[#fff7ed] text-[#f97316]', warning: 'bg-[#fffbeb] text-[#f59e0b]', yellow: 'bg-[#fffbeb] text-[#f59e0b]', gold: 'bg-[#fffbeb] text-[#f59e0b]', purple: 'bg-[#faf5ff] text-[#a855f7]', outline: 'border-[0.8px] border-black/10 bg-transparent text-[#4a5565]', default: 'bg-[#f9fafb] text-[#4a5565]' };
  const sizeCls = size === 'lg' ? 'px-[10px] py-[4px] text-[14px]' : size === 'md' ? 'px-[8px] py-[3px] text-[13px]' : 'px-[6px] py-[2px] text-[12px]';
  return <span className={`inline-flex items-center rounded-[8px] ${sizeCls} ${colorMap[variant || 'default'] || colorMap.default} ${className}`} style={FR}>{children}</span>;
}
function Button({ children, className = '', variant, size, onClick, disabled, type }: { children: React.ReactNode; className?: string; variant?: string; size?: string; onClick?: (e?: any) => void; disabled?: boolean; type?: 'button' | 'submit' }) {
  const base = variant === 'primary' || !variant ? 'bg-black text-white hover:bg-black/80 rounded-[16px]' : variant === 'secondary' ? 'border-[0.8px] border-black/20 hover:bg-black/5 rounded-[12px]' : variant === 'ghost' ? 'hover:bg-black/5 rounded-[8px] text-[#4a5565]' : variant === 'danger' ? 'bg-[#ef4444] text-white hover:bg-[#dc2626] rounded-[16px]' : 'hover:bg-black/5 rounded-[8px]';
  const sizeCls = size === 'sm' ? 'px-[10px] py-[6px] text-[13px]' : size === 'lg' ? 'px-[20px] py-[12px] text-[15px]' : 'px-[16px] py-[10px] text-[14px]';
  return <button type={type || 'button'} className={`inline-flex items-center justify-center transition-colors ${base} ${sizeCls} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`} style={variant === 'primary' || !variant || variant === 'danger' ? FBold : FR} onClick={disabled ? undefined : onClick} disabled={disabled}>{children}</button>;
}
function Progress({ value, className = '' }: { value: number; className?: string }) {
  return <div className={`h-[8px] bg-[#f3f4f6] rounded-full overflow-hidden ${className}`}><div className="h-full bg-black rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}
function Modal({ children, isOpen, onClose, title, size }: { children: React.ReactNode; isOpen: boolean; onClose: () => void; title?: string; size?: string }) {
  if (!isOpen) return null;
  const maxW = size === 'xl' ? 'max-w-[900px]' : size === 'lg' ? 'max-w-[700px]' : size === 'sm' ? 'max-w-[440px]' : 'max-w-[560px]';
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={onClose}>
      <div className={`bg-white rounded-[24px] w-full ${maxW} max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="p-[24px]">
          {title && <h2 className="text-[20px] text-[#0a0a0a] tracking-[-0.5px] mb-[16px]" style={FB}>{title}</h2>}
          {children}
        </div>
      </div>
    </div>
  );
}
function PageHeader({ title, subtitle, icon, actions }: { title: string; subtitle?: string; icon?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-[12px]">
        {icon && <span className="text-[#0a0a0a]">{icon}</span>}
        <div>
          <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px]" style={FB}>{title}</h1>
          {subtitle && <p className="text-[14px] text-[#4a5565] mt-[2px]" style={FR}>{subtitle}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}
const TabCtx = createContext<{ value: string; onChange: (v: string) => void }>({ value: '', onChange: () => {} });
function Tabs({ children, value, onValueChange }: { children: React.ReactNode; value?: string; onValueChange?: (v: string) => void; defaultValue?: string }) {
  return <TabCtx.Provider value={{ value: value || '', onChange: onValueChange || (() => {}) }}>{children}</TabCtx.Provider>;
}
function TabsList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex gap-[4px] border-b border-black/10 ${className}`}>{children}</div>;
}
function TabsTrigger({ children, value, className = '' }: { children: React.ReactNode; value: string; className?: string }) {
  const ctx = useContext(TabCtx);
  const active = ctx.value === value;
  return <button onClick={() => ctx.onChange(value)} className={`px-[16px] py-[10px] text-[14px] border-b-2 transition-colors ${active ? 'border-black text-[#0a0a0a]' : 'border-transparent text-[#4a5565] hover:text-[#0a0a0a]'} ${className}`} style={active ? FBold : FR}>{children}</button>;
}
function TabsContent({ children, value, className = '' }: { children: React.ReactNode; value: string; className?: string }) {
  const ctx = useContext(TabCtx);
  if (ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}
import { useCareerStore, createDefaultTeamMediaState, type TeamPostType, type TeamHeadline, type MediaDuty, type MediaDutyOption, type MediaDutyType } from '@/store/careerStore';
import { useRivalStore } from '@/store/rivalStore';
import { getActivityTimeCost } from '@/data/activity-time-costs';
import { routeNotification } from '@/services/notificationRouter';
import { formatFollowers } from '@/data/backgrounds';
import { getDutyConfig, getDutyDisplayInfo, getDayName } from '@/data/media-schedule';
import { getTrackDisplayName } from '@/data/track-aliases';
import { FACILITY_LEVEL_OVERRIDES, FACILITY_LEVELS, FACILITY_NAMES, type FacilityType } from '@/data/facility-config';
import {
  type FanEventOption,
  type PressConferenceOption,
  type PressConferenceQuestion,
  type PressConferenceAnswerOption,
  type ExclusiveContentOption,
  type TeamPressConferenceContext,
  type ComprehensiveGameContext,
  type TeamSocialPostContext,
  type SocialPostType,
  type PressReleaseType,
  type PressReleaseContext,
  type FanEventContext,
  type ExclusiveContentContext,
  type MediaDutyContext,
  buildComprehensiveContext,
  generateSocialPostOptions,
  generatePressReleaseOptions,
  generateAIFanEventOptions,
  generateAIExclusiveContentOptions,
  generatePressConferenceOptions,
  generateAIPressConferenceQuestions,
  generateAIAnswerOptions,
  generateMediaDutyOptions,
  generatePostImage,
  generatePressReleaseImage,
  getPressReleaseFallbackCategory,
  type PostImageContext,
  type PressReleaseImageContext,
} from '@/services/mediaAI';
import { getRandomImage, type ImageCategory } from '@/data/stock-images';
import type { TeamPost } from '@/store/careerStore';

// Display config for social post types grouped by category
const SOCIAL_POST_TYPES: { type: SocialPostType; icon: string; name: string; description: string; category: string }[] = [
  // Race Weekend
  { type: 'race_result', icon: '🏁', name: 'Race Result', description: 'Share race outcome', category: 'Race Weekend' },
  { type: 'race_preview', icon: '🏎️', name: 'Race Preview', description: 'Hype the upcoming race', category: 'Race Weekend' },
  { type: 'practice_update', icon: '⏱️', name: 'Practice', description: 'Practice session update', category: 'Race Weekend' },
  { type: 'qualifying_result', icon: '📊', name: 'Qualifying', description: 'Qualifying result', category: 'Race Weekend' },
  // Team & People
  { type: 'team_update', icon: '🔧', name: 'Team Update', description: 'General team news', category: 'Team & People' },
  { type: 'behind_scenes', icon: '📷', name: 'Behind the Scenes', description: 'BTS content', category: 'Team & People' },
  { type: 'driver_spotlight', icon: '⭐', name: 'Driver Spotlight', description: 'Highlight your driver', category: 'Team & People' },
  { type: 'staff_appreciation', icon: '👨‍🔧', name: 'Staff Appreciation', description: 'Celebrate crew & engineers', category: 'Team & People' },
  { type: 'new_signing', icon: '✍️', name: 'New Signing', description: 'Announce a new hire', category: 'Team & People' },
  // Development & Facilities
  { type: 'development_tease', icon: '🔬', name: 'Development Tease', description: 'Tease upcoming upgrades', category: 'Development' },
  { type: 'upgrade_reveal', icon: '🚀', name: 'Upgrade Reveal', description: 'Show off completed R&D', category: 'Development' },
  { type: 'factory_tour', icon: '🏭', name: 'Factory Tour', description: 'Showcase your facilities', category: 'Development' },
  // Sponsors & Business
  { type: 'sponsor_thank_you', icon: '🤝', name: 'Sponsor Thank You', description: 'Thank your sponsors', category: 'Business' },
  { type: 'sponsor_activation', icon: '📣', name: 'Sponsor Activation', description: 'Partnership content', category: 'Business' },
  { type: 'merch_announcement', icon: '🛍️', name: 'Merchandise', description: 'Promote merch & collections', category: 'Business' },
  // Fan & Community
  { type: 'fan_engagement', icon: '💬', name: 'Fan Engagement', description: 'Engage with fans', category: 'Community' },
  { type: 'poll_question', icon: '📊', name: 'Poll / Question', description: 'Ask fans a question', category: 'Community' },
  { type: 'charity_community', icon: '❤️', name: 'Charity & Community', description: 'Community involvement', category: 'Community' },
  // Culture & Rivalry
  { type: 'motivation', icon: '💪', name: 'Motivation', description: 'Motivational post', category: 'Culture' },
  { type: 'throwback', icon: '📼', name: 'Throwback', description: 'Throwback content', category: 'Culture' },
  { type: 'rivalry_banter', icon: '🔥', name: 'Rivalry Banter', description: 'Competitive banter', category: 'Culture' },
  { type: 'milestone_celebration', icon: '🏆', name: 'Milestone', description: 'Celebrate achievements', category: 'Culture' },
  { type: 'championship_push', icon: '🥇', name: 'Championship Push', description: 'Title fight content', category: 'Culture' },
  // Activity-Linked Posts
  { type: 'activity_team_briefing', icon: '📋', name: 'Team Briefing', description: 'Share your briefing recap', category: 'Activity Recap' },
  { type: 'activity_season_launch', icon: '🎉', name: 'Season Launch', description: 'Announce the new season', category: 'Activity Recap' },
  { type: 'activity_testing', icon: '🔧', name: 'Testing Day', description: 'Share testing session', category: 'Activity Recap' },
  { type: 'activity_race_debrief', icon: '📝', name: 'Race Debrief', description: 'Post-race analysis recap', category: 'Activity Recap' },
  { type: 'activity_sponsor_event', icon: '🎪', name: 'Sponsor Event', description: 'Sponsor event highlights', category: 'Activity Recap' },
  { type: 'activity_board_meeting', icon: '🏛️', name: 'Board Meeting', description: 'Big decisions shared', category: 'Activity Recap' },
  { type: 'activity_facility_walkthrough', icon: '🏗️', name: 'Facility Tour', description: 'Show off the facilities', category: 'Activity Recap' },
  { type: 'activity_charity_event', icon: '🎗️', name: 'Charity Event', description: 'Community involvement', category: 'Activity Recap' },
  { type: 'activity_pre_race_briefing', icon: '🏁', name: 'Pre-Race Brief', description: 'Ready for race day', category: 'Activity Recap' },
  // Early Career / Contextual Posts
  { type: 'team_introduction', icon: '👋', name: 'Team Introduction', description: 'Introduce your team to the world', category: 'Career Moments' },
  { type: 'journey_begins', icon: '🌟', name: 'Journey Begins', description: 'Start of your racing journey', category: 'Career Moments' },
  { type: 'hiring_call', icon: '📢', name: 'Hiring Call', description: 'Recruit new talent', category: 'Career Moments' },
  { type: 'underdog_story', icon: '🐕', name: 'Underdog Story', description: 'Embrace the underdog spirit', category: 'Career Moments' },
  { type: 'sponsor_search', icon: '🤝', name: 'Seeking Partners', description: 'Open for sponsorship', category: 'Career Moments' },
];

const PRESS_RELEASE_TYPES: { type: PressReleaseType; icon: string; name: string; description: string; category: string }[] = [
  // Race & Performance
  { type: 'race_recap', icon: '🏁', name: 'Race Recap', description: 'Post-race statement', category: 'Race & Performance' },
  { type: 'championship_update', icon: '🥇', name: 'Championship Update', description: 'Title campaign status', category: 'Race & Performance' },
  { type: 'testing_report', icon: '⏱️', name: 'Testing Report', description: 'Test session findings', category: 'Race & Performance' },
  // People & Signings
  { type: 'driver_signing', icon: '✍️', name: 'Driver Signing', description: 'Driver announcement', category: 'People' },
  { type: 'staff_announcement', icon: '👨‍🔧', name: 'Staff Announcement', description: 'Hire or promotion', category: 'People' },
  // Business & Sponsors
  { type: 'sponsor_announcement', icon: '🤝', name: 'Sponsor', description: 'Sponsor news', category: 'Business' },
  { type: 'partnership', icon: '💼', name: 'Partnership', description: 'Partnership news', category: 'Business' },
  { type: 'merchandise_launch', icon: '🛍️', name: 'Merchandise', description: 'Product launch', category: 'Business' },
  // Technical & Facilities
  { type: 'development_update', icon: '🔧', name: 'Development', description: 'Technical update', category: 'Technical' },
  { type: 'facility_expansion', icon: '🏗️', name: 'Facility Expansion', description: 'Infrastructure upgrade', category: 'Technical' },
  // Season
  { type: 'season_preview', icon: '📅', name: 'Season Preview', description: 'Season outlook', category: 'Season' },
  { type: 'season_review', icon: '📋', name: 'Season Review', description: 'Season summary', category: 'Season' },
  // Milestones & Culture
  { type: 'milestone', icon: '🏆', name: 'Milestone', description: 'Milestone reached', category: 'Milestones' },
  // Crisis & Response
  { type: 'apology', icon: '🙏', name: 'Apology', description: 'Official apology', category: 'Crisis' },
  { type: 'incident_response', icon: '⚠️', name: 'Incident Response', description: 'Address an incident', category: 'Crisis' },
  // General
  { type: 'general_statement', icon: '📢', name: 'Statement', description: 'General statement', category: 'General' },
];

function getTrendIcon(trend: string | undefined): JSX.Element | null {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-[#00a63e]" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-[#ef4444]" />;
  return null;
}

function getSentimentColor(score: number): string {
  if (score >= 70) return 'text-[#00a63e]';
  if (score >= 40) return 'text-[#f59e0b]';
  return 'text-[#ef4444]';
}

function getHeadlineSentimentColor(sentiment: number | string): string {
  if (sentiment === 'positive' || (typeof sentiment === 'number' && sentiment >= 0)) return 'text-[#00a63e]';
  if (sentiment === 'negative' || (typeof sentiment === 'number' && sentiment < 0)) return 'text-[#ef4444]';
  return 'text-[#6b7280]';
}

function getControversySeverityColor(severity: string): string {
  if (severity === 'catastrophic') return 'border-[#ef4444] bg-[#ef4444]/10';
  if (severity === 'major') return 'border-[#f59e0b] bg-[#f59e0b]/10';
  return 'border-black/10 bg-[#f9fafb]';
}

function getReachTierBadge(tier: string): string {
  if (tier === 'global' || tier === 'elite') return 'gold';
  if (tier === 'regional' || tier === 'national') return 'blue';
  return 'green';
}

// Media routing types for calendar integration
interface CalendarDutyState {
  activityId: string
  templateId: string
  name: string
  description?: string
  category: string
}

const CALENDAR_DUTY_PREFIX = 'calendar-duty-'

function inferMediaDutyTypeFromCalendar(templateId: string, name: string): MediaDutyType {
  const lower = `${templateId} ${name}`.toLowerCase()
  if (lower.includes('pre_race') || lower.includes('race_strategy')) return 'pre_race'
  if (lower.includes('post_race') || lower.includes('race_recap')) return 'post_race'
  if (lower.includes('qualifying')) return 'post_qualifying'
  if (lower.includes('practice')) return 'post_practice'
  if (lower.includes('briefing')) return 'pre_weekend_briefing'
  // Generic media obligations (podcasts/interviews/events) fallback to a broad debrief duty type.
  return 'post_weekend_debrief'
}

/**
 * Map a calendar activity template ID to the best Media screen tab
 */
function getMediaTabForActivity(templateId: string, name: string): string {
  const lower = (templateId + ' ' + name).toLowerCase()
  if (lower.includes('race_expected_pre_race_press_conference') || lower.includes('race_expected_post_qualifying_media') || lower.includes('race_expected_post_race_press_conference')) return 'press'
  if (lower.includes('press_conference') || lower.includes('press_event') || lower.includes('press_release') || lower.includes('media_day') || lower.includes('season_opener_media') || lower.includes('season_launch')) return 'press'
  if (lower.includes('interview') || lower.includes('media_interview')) return 'press'
  if (lower.includes('social_media') || lower.includes('social_obligation')) return 'social'
  if (lower.includes('fan_event') || lower.includes('fan_zone')) return 'fans'
  if (lower.includes('media_duty') || lower.includes('exclusive_content')) return 'duties'
  // Default to duties tab for any media activity
  return 'duties'
}

export default function MediaScreen() {
  const {
    player,
    careerState,
    initializeTeamMedia,
    consumeHoursFromBudget,
    addPersonalCalendarEntry,
    updateFanSentiment,
    updateTeamMediaState,
    addTeamPost,
    addTeamHeadline,
    addPressClipping,
    addPressRelease,
    completeDuty,
    skipDuty,
    completeActivity: completeCalendarActivity,
  } = useCareerStore();
  const { rivals, getStandings, getSeriesById } = useRivalStore();
  const { addToast } = useToast()
  
  // ---- Calendar duty routing ----
  const location = useLocation()
  const routerNavigate = useNavigate()
  const calendarDuty = (location.state as any)?.calendarDuty as CalendarDutyState | undefined
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (calendarDuty) return getMediaTabForActivity(calendarDuty.templateId, calendarDuty.name)
    return 'duties'
  })
  const [pendingCalendarDuty, setPendingCalendarDuty] = useState<CalendarDutyState | undefined>(calendarDuty)
  const [calendarLinkedDutyId, setCalendarLinkedDutyId] = useState<string | null>(null)
  const [autoOpenedCalendarDutyId, setAutoOpenedCalendarDutyId] = useState<string | null>(null)
  
  // Handle calendar duty routing when arriving from Calendar
  useEffect(() => {
    if (calendarDuty) {
      const targetTab = getMediaTabForActivity(calendarDuty.templateId, calendarDuty.name)
      setActiveTab(targetTab)
      setPendingCalendarDuty(calendarDuty)
      addToast(`Complete your media duty: ${calendarDuty.name}`, 'info')
      // Clear location state to prevent re-triggering on tab changes
      window.history.replaceState({}, '')
    }
  }, [calendarDuty])
  
  const [showEventModal, setShowEventModal] = useState(false)
  const [eventOptions, setEventOptions] = useState<FanEventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [loadingEvents, setLoadingEvents] = useState(false)
  
  // Press Conference state
  const [showPressConferenceModal, setShowPressConferenceModal] = useState(false)
  const [pressConferenceOptions, setPressConferenceOptions] = useState<PressConferenceOption[]>([])
  const [selectedPressConferenceId, setSelectedPressConferenceId] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<PressConferenceQuestion | null>(null)
  const [currentAnswerOptions, setCurrentAnswerOptions] = useState<PressConferenceAnswerOption[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [conferenceInProgress, setConferenceInProgress] = useState(false)
  const [conferenceResults, setConferenceResults] = useState<{ mediaScore: number; completed: number; total: number } | null>(null)
  const [loadingConference, setLoadingConference] = useState(false)
  const [loadingAnswers, setLoadingAnswers] = useState(false)
  
  // Exclusive Content state
  const [showExclusiveContentModal, setShowExclusiveContentModal] = useState(false)
  const [exclusiveContentOptions, setExclusiveContentOptions] = useState<ExclusiveContentOption[]>([])
  const [selectedExclusiveContentId, setSelectedExclusiveContentId] = useState<string | null>(null)
  const [loadingExclusiveContent, setLoadingExclusiveContent] = useState(false)
  
  // Store context for AI generation
  const [pressConferenceContext, setPressConferenceContext] = useState<TeamPressConferenceContext | null>(null)
  const [gameContext, setGameContext] = useState<ComprehensiveGameContext | null>(null)

  // Social post modal state
  const [expandedHeadlines, setExpandedHeadlines] = useState(false)
  const [selectedSocialPostType, setSelectedSocialPostType] = useState<SocialPostType | null>(null)
  const [showSocialModal, setShowSocialModal] = useState(false)
  const [loadingSocialPosts, setLoadingSocialPosts] = useState(false)
  const [socialPostOptions, setSocialPostOptions] = useState<import('@/services/mediaAI').SocialPostOption[]>([])
  const [selectedSocialOptionId, setSelectedSocialOptionId] = useState<string | null>(null)
  // AI image generation state for social posts
  const [generatedPostImage, setGeneratedPostImage] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Press release modal state
  const [selectedPressReleaseType, setSelectedPressReleaseType] = useState<PressReleaseType | null>(null)
  const [showPressReleaseModal, setShowPressReleaseModal] = useState(false)
  const [loadingPressReleases, setLoadingPressReleases] = useState(false)
  const [pressReleaseOptions, setPressReleaseOptions] = useState<import('@/services/mediaAI').PressReleaseOption[]>([])
  const [selectedPressReleaseId, setSelectedPressReleaseId] = useState<string | null>(null)
  // Press release image state
  const [pressReleaseImage, setPressReleaseImage] = useState<string | null>(null)
  const [isGeneratingPRImage, setIsGeneratingPRImage] = useState(false)
  const [pressReleaseImageEnabled, setPressReleaseImageEnabled] = useState(true)
  const [prImageIsStock, setPrImageIsStock] = useState(false)

  // Media duty modal state
  const [selectedDuty, setSelectedDuty] = useState<MediaDuty | null>(null)
  const [dutyOptions, setDutyOptions] = useState<MediaDutyOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)

  // Initialize team media state if needed
  useEffect(() => {
    if (careerState?.ownedTeam && !careerState.teamMediaState) {
      initializeTeamMedia(careerState.ownedTeam.name)
    }
  }, [careerState?.ownedTeam, careerState?.teamMediaState, initializeTeamMedia])

  if (!careerState?.ownedTeam) {
    return (
      <div className="bg-white w-full h-full overflow-y-auto flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Building2 className="w-[64px] h-[64px] mx-auto mb-[16px] text-[#6b7280]" />
          <h2 className="text-[20px] text-[#0a0a0a] mb-[8px]" style={FB}>No Team Found</h2>
          <p className="text-[14px] text-[#6b7280]" style={FR}>Create a team to access the Media Center</p>
        </div>
      </div>
    )
  }

  const team = careerState.ownedTeam
  const mediaState = careerState.teamMediaState || createDefaultTeamMediaState(team.name)
  const isCalendarDutyInProgress = !!(pendingCalendarDuty && selectedDuty && calendarLinkedDutyId === selectedDuty.id)

  const resolveSeriesIdFromTemplate = useCallback((templateId: string): string | undefined => {
    const entries = careerState.seriesEntries || []
    return entries.find(e => templateId.endsWith(`_${e.seriesId}`))?.seriesId
  }, [careerState.seriesEntries])

  const createCalendarBackedDuty = useCallback((duty: CalendarDutyState): MediaDuty => {
    const templateSeriesId = resolveSeriesIdFromTemplate(duty.templateId)
    const fallbackSeriesId = player?.currentSeriesId || careerState.seriesEntries?.[0]?.seriesId || 'career-series'
    const seriesId = templateSeriesId || fallbackSeriesId
    const seriesName = careerState.seriesEntries?.find(e => e.seriesId === seriesId)?.seriesName || 'Calendar Media Duty'
    const inferredType = inferMediaDutyTypeFromCalendar(duty.templateId, duty.name)
    return {
      id: `${CALENDAR_DUTY_PREFIX}${duty.activityId}`,
      type: inferredType,
      week: careerState.currentWeek,
      year: careerState.currentYear,
      day: careerState.currentDay ?? 1,
      trackId: `calendar-${duty.templateId}`,
      trackName: duty.name,
      seriesId,
      seriesName,
      mandatory: true,
      status: 'available',
      deadline: careerState.currentDay ?? 1,
      skipPenalty: {
        fine: 0,
        sponsorSatisfaction: 0,
        boardMood: 0,
        fanSentiment: 0,
        reputation: 0
      }
    }
  }, [careerState.currentWeek, careerState.currentYear, careerState.currentDay, careerState.seriesEntries, player?.currentSeriesId, resolveSeriesIdFromTemplate])
  
  // Get driver name from RivalDriver
  const primaryDriver = team.drivers?.[0] ? rivals.find(r => r.id === team.drivers[0].driverId) : null
  const driverName = primaryDriver ? `${primaryDriver.firstName} ${primaryDriver.lastName}` : undefined
  
  // Get sponsors from team finances
  const sponsors = team.finances?.sponsors || []
  
  // Get championship position from standings
  const currentSeriesId = useMemo(() => {
    if (player?.currentSeriesId) return player.currentSeriesId
    const entries = careerState.seriesEntries || []
    if (entries.length === 0) return undefined
    const raceWeekEntry = entries.find((entry) => {
      const series = getSeriesById(entry.seriesId)
      return (series?.calendar || []).some((ev) => ev.week === careerState.currentWeek)
    })
    return raceWeekEntry?.seriesId || entries[0]?.seriesId
  }, [player?.currentSeriesId, careerState.seriesEntries, careerState.currentWeek, getSeriesById])
  const standings = currentSeriesId ? getStandings(currentSeriesId) : []
  const playerStanding = player ? standings.find(s => s.driverId === player.id || s.driverName === `${player.firstName} ${player.lastName}`) : null
  
  // Get current race weekend from raceWeekendProgress
  const raceWeekendProgress = careerState.raceWeekendProgress
  const currentRaceWeekend = raceWeekendProgress ? {
    trackId: raceWeekendProgress.trackId,
    trackName: '', // Will be looked up from trackId if needed
    week: raceWeekendProgress.week,
    year: raceWeekendProgress.year
  } : undefined
  
  // Get last race result from race history
  const lastRaceResult = player?.raceHistory && player.raceHistory.length > 0 
    ? player.raceHistory[player.raceHistory.length - 1]
    : undefined
  
  // Computed values
  const recentHeadlines = mediaState.teamHeadlines.slice(0, expandedHeadlines ? 20 : 5)
  const activeControversies = mediaState.activeControversies.filter(c => !c.resolved)
  const pendingObligations = mediaState.sponsorMediaObligations.filter(o => o.completed < o.required)

  // ============================================
  // POST TYPE AVAILABILITY (Context-Aware)
  // ============================================
  
  // Helper: map activity templateIds/names to social post types
  const ACTIVITY_TO_POST_TYPE_MAP: Record<string, SocialPostType> = {
    'team_briefing': 'activity_team_briefing',
    'season_launch': 'activity_season_launch',
    'season_opener_media': 'activity_season_launch',
    'season_launch_media': 'activity_season_launch',
    'pre_season_testing': 'activity_testing',
    'shakedown': 'activity_testing',
    'test_session': 'activity_testing',
    'race_debrief': 'activity_race_debrief',
    'post_race_debrief': 'activity_race_debrief',
    'sponsor_event': 'activity_sponsor_event',
    'sponsor_hospitality': 'activity_sponsor_event',
    'sponsor_meeting': 'activity_sponsor_event',
    'board_meeting': 'activity_board_meeting',
    'board_presentation': 'activity_board_meeting',
    'facility_walkthrough': 'activity_facility_walkthrough',
    'factory_tour': 'activity_facility_walkthrough',
    'charity_event': 'activity_charity_event',
    'community_event': 'activity_charity_event',
    'pre_race_briefing': 'activity_pre_race_briefing',
    'driver_briefing': 'activity_pre_race_briefing',
    'race_expected_pre_race_press_conference': 'race_preview',
    'race_expected_post_qualifying_media': 'qualifying_result',
    'race_expected_post_race_press_conference': 'race_result',
  }

  // Get suggested post types from recently completed activities
  const getSuggestedPostTypes = (): { type: SocialPostType; reason: string }[] => {
    const recentActivities = careerState.recentCompletedActivities || []
    const suggestions: { type: SocialPostType; reason: string }[] = []
    const seenTypes = new Set<SocialPostType>()
    
    // Check recent activities (most recent first)
    for (let i = recentActivities.length - 1; i >= 0; i--) {
      const activity = recentActivities[i]
      // Only suggest from activities within last 2 weeks
      if (careerState.currentWeek - activity.completedWeek > 2) continue
      
      // Try to match by templateId first, then by name keywords
      let matchedType: SocialPostType | null = null
      const lowerTemplateId = (activity.templateId || '').toLowerCase()
      const lowerName = (activity.name || '').toLowerCase()
      
      for (const [keyword, postType] of Object.entries(ACTIVITY_TO_POST_TYPE_MAP)) {
        if (lowerTemplateId.includes(keyword) || lowerName.includes(keyword)) {
          matchedType = postType
          break
        }
      }
      
      // Also match by category
      if (!matchedType) {
        if (activity.category === 'sponsor') matchedType = 'activity_sponsor_event'
        else if (lowerName.includes('test') || lowerName.includes('shakedown')) matchedType = 'activity_testing'
        else if (lowerName.includes('brief')) matchedType = 'activity_team_briefing'
        else if (lowerName.includes('charit') || lowerName.includes('community')) matchedType = 'activity_charity_event'
      }
      
      if (matchedType && !seenTypes.has(matchedType)) {
        seenTypes.add(matchedType)
        suggestions.push({ type: matchedType, reason: activity.name })
      }
    }

    // Sponsor-driven suggestions (align behavior with PR suggestions)
    const recentSigningWeekThreshold = Math.max(1, careerState.currentWeek - 4)
    const recentSponsor = sponsors.find(s => (s.signedWeek ?? 0) >= recentSigningWeekThreshold)
    if (recentSponsor && !seenTypes.has('sponsor_thank_you')) {
      seenTypes.add('sponsor_thank_you')
      suggestions.push({ type: 'sponsor_thank_you', reason: recentSponsor.sponsorName || 'New sponsor signed' })
    }
    if (pendingObligations.length > 0 && !seenTypes.has('sponsor_activation')) {
      const obligation = pendingObligations[0]
      seenTypes.add('sponsor_activation')
      suggestions.push({ type: 'sponsor_activation', reason: obligation?.sponsorName || 'Sponsor obligation pending' })
    }
    
    return suggestions.slice(0, 6) // Keep concise but include sponsor-driven prompts
  }

  const suggestedPostTypes = getSuggestedPostTypes()

  const getAvailablePostTypes = () => {
    const hasRaceHistory = (player?.raceHistory?.length ?? 0) > 0
    const hasRaceWeekend = !!raceWeekendProgress
    const hasPractice = !!raceWeekendProgress?.practice
    const hasQualifying = !!raceWeekendProgress?.qualifying?.position
    const hasDrivers = (team.drivers?.length ?? 0) > 0
    const hasStaff = (team.staff?.length ?? 0) > 0
    const hasSponsors = sponsors.length > 0
    const hasFacilities = !!team.facilities
    const hasMerch = !!careerState.merchandiseState
    const hasHistory = (careerState.currentWeek > 4) || hasRaceHistory
    const isTopFive = (playerStanding?.position ?? 99) <= 5
    const hasCompletedUpgrades = !!(team.development?.completedUpgrades && team.development.completedUpgrades.length > 0)
    
    // Career stage checks
    const isFirstSeason = (player?.seasonsCompleted ?? 0) === 0
    const isEarlyCareer = isFirstSeason && careerState.currentWeek <= 8
    const isSmallTeam = ((team.staff?.length ?? 0) + (team.facilityStaff?.length ?? 0)) < 5
    const hasNoSponsors = sponsors.length === 0
    const isEntryTier = team.tier === 'entry' || team.tier === 'amateur'
    const totalPosts = mediaState.teamSocial.totalPosts
    const hasNeverPosted = totalPosts === 0
    
    // Check for recent signings (driver or staff signed within last 4 weeks)
    const recentSigningWeekThreshold = Math.max(1, careerState.currentWeek - 4)
    const hasRecentSigning = (team.drivers?.some(d => (d.contractSignedWeek ?? 0) >= recentSigningWeekThreshold)) ||
      (team.staff?.some(s => (s.hiredWeek ?? 0) >= recentSigningWeekThreshold))
    
    // Check which activity-linked types have matching recent activities
    const suggestedTypeSet = new Set(suggestedPostTypes.map(s => s.type))
    
    const availabilityMap: Record<SocialPostType, boolean> = {
      // Race Weekend
      race_result: hasRaceHistory,
      race_preview: hasRaceWeekend,
      practice_update: hasPractice,
      qualifying_result: hasQualifying,
      // Team & People
      team_update: true,
      behind_scenes: true,
      driver_spotlight: hasDrivers,
      staff_appreciation: hasStaff && !isSmallTeam, // Only show if team has meaningful staff count
      new_signing: hasRecentSigning || hasDrivers,
      // Development & Facilities
      development_tease: true,
      upgrade_reveal: hasCompletedUpgrades,
      factory_tour: hasFacilities,
      // Sponsors & Business
      sponsor_thank_you: hasSponsors,
      sponsor_activation: hasSponsors,
      merch_announcement: hasMerch,
      // Fan & Community
      fan_engagement: true,
      poll_question: true,
      charity_community: true,
      // Culture & Rivalry
      motivation: true,
      throwback: hasHistory,
      rivalry_banter: true,
      milestone_celebration: hasRaceHistory || (mediaState.teamSocial.followers >= 1000),
      championship_push: isTopFive,
      // Activity-Linked (only show if matching activity was recently completed)
      activity_team_briefing: suggestedTypeSet.has('activity_team_briefing'),
      activity_season_launch: suggestedTypeSet.has('activity_season_launch'),
      activity_testing: suggestedTypeSet.has('activity_testing'),
      activity_race_debrief: suggestedTypeSet.has('activity_race_debrief'),
      activity_sponsor_event: suggestedTypeSet.has('activity_sponsor_event'),
      activity_board_meeting: suggestedTypeSet.has('activity_board_meeting'),
      activity_facility_walkthrough: suggestedTypeSet.has('activity_facility_walkthrough'),
      activity_charity_event: suggestedTypeSet.has('activity_charity_event'),
      activity_pre_race_briefing: suggestedTypeSet.has('activity_pre_race_briefing'),
      // Early Career / Contextual (show based on career stage)
      team_introduction: isEarlyCareer || hasNeverPosted, // Available in first 8 weeks or if never posted
      journey_begins: isFirstSeason && careerState.currentWeek <= 4, // Only first 4 weeks of first season
      hiring_call: isSmallTeam, // Show when team needs more people
      underdog_story: isEntryTier && isSmallTeam, // Show for small entry-tier teams
      sponsor_search: hasNoSponsors, // Show when team has no sponsors
    }
    
    return SOCIAL_POST_TYPES.filter(pt => availabilityMap[pt.type])
  }
  
  const availablePostTypes = getAvailablePostTypes()
  
  // Separate suggested (activity-linked + career moment) posts from regular ones
  const suggestedTypeSet = new Set(suggestedPostTypes.map(s => s.type))
  const suggestedAvailableTypes = availablePostTypes.filter(pt =>
    suggestedTypeSet.has(pt.type) || pt.category === 'Career Moments'
  )
  const regularAvailableTypes = availablePostTypes.filter(pt => 
    pt.category !== 'Activity Recap' && pt.category !== 'Career Moments'
  )

  // ============================================
  // PRESS RELEASE TYPE AVAILABILITY (Context-Aware)
  // ============================================

  // Helper: map recent events to suggested press release types
  const getSuggestedPressReleaseTypes = (): { type: PressReleaseType; reason: string }[] => {
    const suggestions: { type: PressReleaseType; reason: string }[] = []
    const seenTypes = new Set<PressReleaseType>()
    
    const raceHistory = player?.raceHistory || []
    const hasRaceHistory = raceHistory.length > 0
    const lastRace = hasRaceHistory ? raceHistory[raceHistory.length - 1] : null
    const recentSigningWeekThreshold = Math.max(1, careerState.currentWeek - 4)
    const isFirstSeason = (player?.seasonsCompleted ?? 0) === 0
    const isEarlyCareer = isFirstSeason && careerState.currentWeek <= 8
    const totalPressReleases = mediaState.pressReleases.length
    const hasNeverReleasedPR = totalPressReleases === 0
    
    // === EVENT-DRIVEN SUGGESTIONS (highest priority) ===
    
    // After a race: suggest race recap
    if (lastRace && (careerState.currentWeek - (lastRace.week || 0)) <= 2) {
      suggestions.push({ type: 'race_recap', reason: `P${lastRace.position} at ${lastRace.trackName || 'last race'}` })
      seenTypes.add('race_recap')
    }
    
    // After signing a driver
    const recentDriverSigning = team.drivers?.find(d => (d.contractSignedWeek ?? 0) >= recentSigningWeekThreshold)
    if (recentDriverSigning && !seenTypes.has('driver_signing')) {
      const signingDriver = rivals.find(r => r.id === recentDriverSigning.driverId)
      suggestions.push({ type: 'driver_signing', reason: signingDriver ? `${signingDriver.firstName} ${signingDriver.lastName}` : 'New driver signed' })
      seenTypes.add('driver_signing')
    }
    
    // After signing a sponsor
    const recentSponsor = sponsors.find(s => (s.signedWeek ?? 0) >= recentSigningWeekThreshold)
    if (recentSponsor && !seenTypes.has('sponsor_announcement')) {
      suggestions.push({ type: 'sponsor_announcement', reason: recentSponsor.sponsorName || 'New sponsor' })
      seenTypes.add('sponsor_announcement')
    }
    
    // After staff hiring
    const recentStaff = team.staff?.find(s => (s.hiredWeek ?? 0) >= recentSigningWeekThreshold)
    if (recentStaff && !seenTypes.has('staff_announcement')) {
      suggestions.push({ type: 'staff_announcement', reason: recentStaff.name || 'New hire' })
      seenTypes.add('staff_announcement')
    }
    
    // After completing upgrades
    const hasRecentUpgrades = team.development?.completedUpgrades && team.development.completedUpgrades.length > 0
    if (hasRecentUpgrades && !seenTypes.has('development_update')) {
      suggestions.push({ type: 'development_update', reason: 'New upgrades completed' })
      seenTypes.add('development_update')
    }
    
    // Active controversy: suggest response
    if (activeControversies.length > 0 && !seenTypes.has('incident_response')) {
      suggestions.push({ type: 'incident_response', reason: 'Active controversy' })
      seenTypes.add('incident_response')
    }
    
    // Top 5 in championship: suggest update
    if ((playerStanding?.position ?? 99) <= 5 && !seenTypes.has('championship_update')) {
      suggestions.push({ type: 'championship_update', reason: `P${playerStanding?.position} in championship` })
      seenTypes.add('championship_update')
    }
    
    // Recent activity-based suggestions
    const recentActivities = careerState.recentCompletedActivities || []
    for (let i = recentActivities.length - 1; i >= 0 && suggestions.length < 6; i--) {
      const activity = recentActivities[i]
      if (careerState.currentWeek - activity.completedWeek > 2) continue
      const lowerName = (activity.name || '').toLowerCase()
      const lowerTemplate = (activity.templateId || '').toLowerCase()
      
      if ((lowerName.includes('test') || lowerTemplate.includes('test')) && !seenTypes.has('testing_report')) {
        suggestions.push({ type: 'testing_report', reason: activity.name })
        seenTypes.add('testing_report')
      }
    }
    
    // === CAREER STAGE SUGGESTIONS (fill gaps when no events) ===
    
    // Early career / first-time: suggest a general statement to introduce the team
    if ((isEarlyCareer || hasNeverReleasedPR) && !seenTypes.has('general_statement')) {
      suggestions.push({ type: 'general_statement', reason: hasNeverReleasedPR ? 'Introduce your team to the media' : 'New team, first season' })
      seenTypes.add('general_statement')
    }
    
    // First season: suggest season preview
    if (isFirstSeason && !hasRaceHistory && !seenTypes.has('season_preview')) {
      suggestions.push({ type: 'season_preview', reason: 'Set out your goals for the season' })
      seenTypes.add('season_preview')
    }
    
    // Has staff but hasn't released about it
    if ((team.staff?.length ?? 0) > 0 && !seenTypes.has('staff_announcement') && hasNeverReleasedPR) {
      suggestions.push({ type: 'staff_announcement', reason: `${team.staff?.length} team member${(team.staff?.length ?? 0) > 1 ? 's' : ''}` })
      seenTypes.add('staff_announcement')
    }
    
    // Has facilities: suggest development update or facility expansion
    if (team.facilities && !seenTypes.has('development_update') && !seenTypes.has('facility_expansion')) {
      const facilityCount = Object.values(team.facilities).filter(f => f && typeof f === 'object' && (f as any).level > 0).length
      if (facilityCount > 0) {
        suggestions.push({ type: 'facility_expansion', reason: `${facilityCount} active facilit${facilityCount > 1 ? 'ies' : 'y'}` })
        seenTypes.add('facility_expansion')
      }
    }
    
    // Has sponsors but no PR about them yet
    if (sponsors.length > 0 && !seenTypes.has('sponsor_announcement') && !seenTypes.has('partnership')) {
      suggestions.push({ type: 'partnership', reason: sponsors.map(s => s.sponsorName).slice(0, 2).join(', ') })
      seenTypes.add('partnership')
    }
    
    return suggestions.slice(0, 4)
  }
  
  const suggestedPressReleaseTypes = getSuggestedPressReleaseTypes()
  
  const getAvailablePressReleaseTypes = () => {
    const hasRaceHistory = (player?.raceHistory?.length ?? 0) > 0
    const hasDrivers = (team.drivers?.length ?? 0) > 0
    const hasStaff = (team.staff?.length ?? 0) > 0
    const hasSponsors = sponsors.length > 0
    const hasMerch = !!careerState.merchandiseState
    const hasFacilities = !!team.facilities
    const isTopFive = (playerStanding?.position ?? 99) <= 5
    const hasCompletedUpgrades = !!(team.development?.completedUpgrades && team.development.completedUpgrades.length > 0)
    const hasActiveControversy = activeControversies.length > 0
    const recentSigningWeekThreshold = Math.max(1, careerState.currentWeek - 4)
    const hasRecentDriverSigning = team.drivers?.some(d => (d.contractSignedWeek ?? 0) >= recentSigningWeekThreshold)
    const hasRecentStaffHire = team.staff?.some(s => (s.hiredWeek ?? 0) >= recentSigningWeekThreshold)
    const currentSeriesEntry = careerState.seriesEntries?.find(e => e.seriesId === currentSeriesId)
    
    const availabilityMap: Record<PressReleaseType, boolean> = {
      // Race & Performance
      race_recap: hasRaceHistory,
      championship_update: isTopFive,
      testing_report: true, // Always can report on testing
      // People
      driver_signing: hasRecentDriverSigning || hasDrivers,
      staff_announcement: hasRecentStaffHire || hasStaff,
      // Business
      sponsor_announcement: hasSponsors,
      partnership: hasSponsors,
      merchandise_launch: hasMerch,
      // Technical
      development_update: hasCompletedUpgrades || true,
      facility_expansion: hasFacilities,
      // Season
      season_preview: true,
      season_review: hasRaceHistory,
      // Milestones
      milestone: hasRaceHistory || (player?.seasonsCompleted ?? 0) > 0,
      // Crisis
      apology: hasActiveControversy,
      incident_response: hasActiveControversy,
      // General
      general_statement: true,
    }
    
    return PRESS_RELEASE_TYPES.filter(pt => availabilityMap[pt.type])
  }
  
  const availablePressReleaseTypes = getAvailablePressReleaseTypes()
  
  // Separate suggested press release types from regular ones
  const suggestedPRTypeSet = new Set(suggestedPressReleaseTypes.map(s => s.type))
  const suggestedAvailablePRTypes = availablePressReleaseTypes.filter(pt => suggestedPRTypeSet.has(pt.type))
  const regularAvailablePRTypes = availablePressReleaseTypes.filter(pt => !suggestedPRTypeSet.has(pt.type))

  // ============================================
  // HANDLERS
  // ============================================

  // ============================================
  // SOCIAL POST HANDLERS (AI-Generated)
  // ============================================
  
  // Map SocialPostType to image prompt type for generatePostImage
  const getImagePostType = (postType: SocialPostType): string => {
    const mapping: Partial<Record<SocialPostType, string>> = {
      race_result: lastRaceResult?.position === 1 ? 'post_race_win' : (lastRaceResult?.position ?? 99) <= 3 ? 'post_race_podium' : 'post_race_tough',
      race_preview: 'race_preview',
      practice_update: 'practice_update',
      qualifying_result: 'qualifying_result',
      team_update: 'team_update',
      behind_scenes: 'behind_scenes',
      driver_spotlight: 'driver_spotlight',
      staff_appreciation: 'behind_scenes',
      new_signing: 'team_update',
      development_tease: 'development_tease',
      upgrade_reveal: 'upgrade_reveal',
      factory_tour: 'behind_scenes',
      sponsor_thank_you: 'sponsor_highlight',
      sponsor_activation: 'sponsor_highlight',
      merch_announcement: 'merch_drop',
      fan_engagement: 'fan_engagement',
      poll_question: 'fan_engagement',
      charity_community: 'fan_engagement',
      motivation: 'motivation',
      throwback: 'throwback',
      rivalry_banter: 'rivalry',
      milestone_celebration: 'milestone_celebration',
      championship_push: 'championship_push',
      // Activity-linked posts
      activity_team_briefing: 'behind_scenes',
      activity_season_launch: 'team_update',
      activity_testing: 'practice_update',
      activity_race_debrief: 'behind_scenes',
      activity_sponsor_event: 'sponsor_highlight',
      activity_board_meeting: 'behind_scenes',
      activity_facility_walkthrough: 'behind_scenes',
      activity_charity_event: 'fan_engagement',
      activity_pre_race_briefing: 'race_preview',
      // Early career / contextual
      team_introduction: 'team_update',
      journey_begins: 'team_update',
      hiring_call: 'behind_scenes',
      underdog_story: 'behind_scenes',
      sponsor_search: 'sponsor_highlight',
    }
    return mapping[postType] || 'team_update'
  }

  // Build facility descriptions from actual facility state + config
  const getFacilityDescriptions = (): string[] => {
    if (!team.facilities) return []
    const descriptions: string[] = []
    const facilityTypes: FacilityType[] = ['aero', 'chassis', 'engine', 'sim', 'manufacturing', 'marketing']
    for (const ft of facilityTypes) {
      const facility = team.facilities[ft]
      if (!facility) continue
      const overrides = FACILITY_LEVEL_OVERRIDES[ft]
      const levelConfig = overrides?.find(l => l.level === facility.level) || FACILITY_LEVELS.find(l => l.level === facility.level)
      if (levelConfig) {
        descriptions.push(`${FACILITY_NAMES[ft]}: ${levelConfig.description} (Level ${facility.level} ${levelConfig.name})`)
      }
    }
    return descriptions
  }

  // Get car type description from series or car data
  const getCarTypeDescription = (): string | undefined => {
    const seriesEntry = careerState.seriesEntries?.find(se => se.status === 'active')
    if (seriesEntry) {
      const name = seriesEntry.seriesName?.toLowerCase() || ''
      if (name.includes('gt') || name.includes('touring')) return 'GT race car'
      if (name.includes('prototype') || name.includes('lmp') || name.includes('endurance')) return 'prototype race car'
      if (name.includes('formula') || name.includes('open')) return 'open-wheel formula car'
      return 'race car'
    }
    return undefined
  }

  const handleGeneratePostImage = async (postType: SocialPostType) => {
    setIsGeneratingImage(true)
    setGeneratedPostImage(null)
    setImageError(false)
    
    try {
      // Build enriched image context with full team state
      const totalStaff = (team.staff?.length ?? 0) + (team.facilityStaff?.length ?? 0)
      const carCount = careerState.cars?.length ?? 0
      const preferredCar = (careerState.cars || []).find(c => c.driverType === 'owner') || (careerState.cars || [])[0]
      const hasSeriesEntry = (careerState.seriesEntries?.filter(se => se.status === 'active').length ?? 0) > 0
      const currentSeriesEntry = careerState.seriesEntries?.find(se => se.seriesId === currentSeriesId)
      const morale = (team.teamMorale ?? 50) > 70 ? 'high' : (team.teamMorale ?? 50) > 40 ? 'good' : 'low'

      const imageContext: PostImageContext = {
        postType: getImagePostType(postType),
        tone: 'professional',
        playerName: player?.firstName ? `${player.firstName} ${player.lastName}` : 'Team Principal',
        teamName: team.name,
        seriesName: currentSeriesEntry?.seriesName || currentSeriesId || 'racing series',
        trackName: lastRaceResult?.trackName || currentRaceWeekend?.trackName,
        isVictory: lastRaceResult?.position === 1,
        isPodium: (lastRaceResult?.position ?? 99) <= 3,
        // Full team state
        teamTier: team.tier,
        carCount,
        carType: getCarTypeDescription(),
        carModelName: preferredCar?.liveryName || preferredCar?.chassisId,
        carLiveryName: preferredCar?.liveryName,
        carLiveryPath: preferredCar?.liveryPath,
        carChassisId: preferredCar?.chassisId,
        carEngineId: preferredCar?.engineId,
        hasSeriesEntry,
        staffCount: totalStaff,
        facilityDescriptions: getFacilityDescriptions(),
        sponsorNames: sponsors.map(s => s.sponsorName).filter(Boolean),
        isFirstSeason: (player?.seasonsCompleted ?? 0) === 0,
        seasonsCompleted: player?.seasonsCompleted ?? 0,
        teamMorale: morale,
        baseCountry: team.baseCountry,
      }
      
      const imageUrl = await generatePostImage(imageContext)
      if (imageUrl) {
        setGeneratedPostImage(imageUrl)
      } else {
        // Context-aware fallback: don't show race imagery if team has no car
        let fallbackCategory: ImageCategory
        if (carCount === 0) {
          fallbackCategory = 'paddock'
        } else if (['race_result', 'race_preview', 'practice_update', 'qualifying_result'].includes(postType)) {
          fallbackCategory = 'gt-racing'
        } else if (['behind_scenes', 'factory_tour', 'staff_appreciation'].includes(postType)) {
          fallbackCategory = 'garage'
        } else if (['development_tease', 'upgrade_reveal'].includes(postType)) {
          fallbackCategory = 'garage'
        } else {
          fallbackCategory = 'paddock'
        }
        setGeneratedPostImage(getRandomImage(fallbackCategory))
        setImageError(true)
      }
    } catch (err) {
      console.error('[Media] Image generation failed:', err)
      setGeneratedPostImage(getRandomImage('paddock'))
      setImageError(true)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleOpenSocialPostModal = async (postType: SocialPostType) => {
    setSelectedSocialPostType(postType)
    setShowSocialModal(true)
    setLoadingSocialPosts(true)
    setSocialPostOptions([])
    setSelectedSocialOptionId(null)
    setGeneratedPostImage(null)
    setIsGeneratingImage(false)
    setImageError(false)
    
    // Build context for AI generation
    const staffNames = team.staff?.map(s => s.name).filter(Boolean) || []
    const facilityNames = team.facilities ? Object.keys(team.facilities).filter(k => (team.facilities as any)?.[k]?.level > 0) : []
    const completedUpgradeNames = team.development?.completedUpgrades?.map((u: any) => u.name || u.id) || []
    const recentUpgradeNames = team.development?.activeUpgrades?.map((u: any) => u.name || u.id) || []
    const raceHistory = player?.raceHistory || []
    const totalWins = raceHistory.filter(r => r.position === 1).length
    const totalPodiums = raceHistory.filter(r => r.position <= 3).length
    
    // Find rival teams from standings (teams near player in standings)
    const rivalTeamNames = standings
      .filter(s => s.position !== playerStanding?.position)
      .slice(0, 3)
      .map(s => s.teamName || s.driverName)
      .filter(Boolean)
    
    // Find the matching recent activity for activity-linked post types
    const matchingSuggestion = suggestedPostTypes.find(s => s.type === postType)
    const matchingActivity = (careerState.recentCompletedActivities || []).find(a => {
      const lowerName = (a.name || '').toLowerCase()
      const lowerTemplateId = (a.templateId || '').toLowerCase()
      for (const [keyword, pType] of Object.entries(ACTIVITY_TO_POST_TYPE_MAP)) {
        if (pType === postType && (lowerTemplateId.includes(keyword) || lowerName.includes(keyword))) return true
      }
      return false
    })
    
    // Get current series name
    const currentSeriesEntry = careerState.seriesEntries?.find(se => se.seriesId === currentSeriesId)
    
    const context: TeamSocialPostContext = {
      postType,
      teamName: team.name,
      teamTier: team.tier,
      driverName,
      boardMood: team.boardMood,
      teamMorale: team.teamMorale,
      fanSentiment: mediaState.fanSentiment,
      followerCount: mediaState.teamSocial.followers,
      primarySponsor: sponsors[0]?.sponsorName,
      allSponsors: sponsors.map(s => s.sponsorName),
      championshipPosition: playerStanding?.position,
      pointsTotal: playerStanding?.points,
      currentWeek: careerState.currentWeek,
      currentYear: careerState.currentYear,
      isRaceWeek: !!currentRaceWeekend,
      nextRaceTrack: currentRaceWeekend?.trackName,
      lastRacePosition: lastRaceResult?.position,
      lastRaceTrack: lastRaceResult?.trackName,
      qualifyingPosition: raceWeekendProgress?.qualifying?.position,
      // New fields for expanded post types
      staffNames,
      facilityNames,
      completedUpgrades: completedUpgradeNames,
      recentUpgrades: recentUpgradeNames,
      hasMerch: !!careerState.merchandiseState,
      rivalTeamNames,
      totalRaces: raceHistory.length,
      totalWins,
      totalPodiums,
      // Enriched context
      staffCount: (team.staff?.length ?? 0) + (team.facilityStaff?.length ?? 0),
      facilityStaffCount: team.facilityStaff?.length ?? 0,
      carCount: careerState.cars?.length ?? 0,
      seasonsCompleted: player?.seasonsCompleted ?? 0,
      seriesName: currentSeriesEntry?.seriesName,
      sponsorCount: sponsors.length,
      budgetRunwayWeeks: team.finances?.runwayWeeks,
      // Activity-linked context
      recentActivityName: matchingActivity?.name || matchingSuggestion?.reason,
      recentActivityDescription: matchingActivity?.description,
      recentActivityCategory: matchingActivity?.category,
    }
    
    // Generate captions and image in parallel
    handleGeneratePostImage(postType)
    
    const options = await generateSocialPostOptions(context)
    if (options) {
      setSocialPostOptions(options)
    }
    setLoadingSocialPosts(false)
  }
  
  const handlePublishSocialPost = () => {
    if (!selectedSocialOptionId || !selectedSocialPostType) return
    
    const selectedOption = socialPostOptions.find(opt => opt.id === selectedSocialOptionId)
    if (!selectedOption) return
    
    // Calculate engagement with effects
    const baseEngagement = selectedOption.effects.engagementBoost * 10
    const followerMultiplier = mediaState.teamSocial.followers / 10000
    const randomVariance = 0.8 + Math.random() * 0.4
    
    const likes = Math.round(baseEngagement * followerMultiplier * randomVariance * 100)
    const shares = Math.round(likes * (0.1 + Math.random() * 0.15))
    const comments = Math.round(likes * (0.05 + Math.random() * 0.1))
    
    // Roll for viral/backlash
    const wentViral = Math.random() * 100 < selectedOption.effects.viralChance
    const hadBacklash = Math.random() * 100 < selectedOption.effects.backlashRisk
    
    // Map SocialPostType to TeamPostType
    const postTypeMapping: Record<SocialPostType, TeamPostType> = {
      'race_result': 'race_result',
      'race_preview': 'race_preview',
      'practice_update': 'practice_update',
      'qualifying_result': 'qualifying_result',
      'team_update': 'development_update',
      'behind_scenes': 'behind_scenes',
      'driver_spotlight': 'driver_spotlight',
      'staff_appreciation': 'staff_appreciation',
      'new_signing': 'new_signing',
      'development_tease': 'development_update',
      'upgrade_reveal': 'upgrade_reveal',
      'factory_tour': 'factory_tour',
      'sponsor_thank_you': 'sponsor_highlight',
      'sponsor_activation': 'sponsor_activation',
      'merch_announcement': 'merch_drop',
      'fan_engagement': 'fan_engagement',
      'poll_question': 'poll',
      'charity_community': 'charity',
      'motivation': 'fan_engagement',
      'throwback': 'throwback',
      'rivalry_banter': 'rivalry_post',
      'milestone_celebration': 'milestone_celebration',
      'championship_push': 'championship_push',
      // Activity-linked posts
      'activity_team_briefing': 'activity_recap',
      'activity_season_launch': 'activity_recap',
      'activity_testing': 'activity_recap',
      'activity_race_debrief': 'activity_recap',
      'activity_sponsor_event': 'activity_recap',
      'activity_board_meeting': 'activity_recap',
      'activity_facility_walkthrough': 'activity_recap',
      'activity_charity_event': 'charity',
      'activity_pre_race_briefing': 'activity_recap',
      // Early career / contextual posts
      'team_introduction': 'team_introduction',
      'journey_begins': 'journey_begins',
      'hiring_call': 'hiring_call',
      'underdog_story': 'underdog_story',
      'sponsor_search': 'sponsor_search',
    }
    
    // Calculate follower change based on post quality and viral/backlash status
    const followerChange = wentViral 
      ? selectedOption.effects.followerGain * 3 
      : hadBacklash 
        ? -Math.floor(selectedOption.effects.followerGain / 2)
        : selectedOption.effects.followerGain

    const newPost: Omit<TeamPost, 'id'> = {
      week: careerState.currentWeek,
      year: careerState.currentYear,
      type: postTypeMapping[selectedSocialPostType] || 'fan_engagement',
      content: selectedOption.content + (selectedOption.hashtags.length > 0 ? '\n\n' + selectedOption.hashtags.join(' ') : ''),
      tone: selectedOption.tone,
      engagement: { 
        likes, 
        shares, 
        comments, 
        sentiment: hadBacklash ? -20 : wentViral ? 80 : 50 
      },
      wentViral,
      hadBacklash,
      effects: [],
      posted: true,
      imageDataUrl: generatedPostImage || undefined,
      followerGain: followerChange,
    }
    
    // addTeamPost already updates followers, totalPosts, viralPosts, and postHistory
    addTeamPost(newPost)
    
    // Apply effects to fan sentiment
    if (selectedOption.effects.fanSentiment !== 0) {
      updateFanSentiment(selectedOption.effects.fanSentiment, 'Social media post')
    }
    
    // Apply reputation change from social post
    if (selectedOption.effects.reputation && selectedOption.effects.reputation !== 0) {
      const currentPlayer = useCareerStore.getState().player
      if (currentPlayer) {
        const newRep = Math.max(0, Math.min(100, currentPlayer.reputation + selectedOption.effects.reputation))
        useCareerStore.setState(state => ({
          player: state.player ? { ...state.player, reputation: newRep } : state.player
        }))
      }
    }
    
    // Apply sponsor satisfaction change from social post
    if (selectedOption.effects.sponsorSatisfaction && selectedOption.effects.sponsorSatisfaction !== 0) {
      const currentState = useCareerStore.getState().careerState
      if (currentState?.ownedTeam?.sponsorDeals) {
        const updatedDeals = currentState.ownedTeam.sponsorDeals.map((deal: any) => ({
          ...deal,
          satisfaction: Math.max(0, Math.min(100, (deal.satisfaction ?? 70) + selectedOption.effects.sponsorSatisfaction))
        }))
        useCareerStore.setState(state => ({
          careerState: {
            ...state.careerState!,
            ownedTeam: {
              ...state.careerState!.ownedTeam!,
              sponsorDeals: updatedDeals
            }
          }
        }))
      }
    }
    
    // followerChange already calculated above and passed to newPost
    
    // Show feedback
    if (wentViral && !hadBacklash) {
      addToast({ 
        type: 'success', 
        title: '🔥 Post went VIRAL!', 
        message: `+${formatFollowers(followerChange)} new followers!`, 
        duration: 5000 
      })
    } else if (hadBacklash) {
      addToast({ 
        type: 'warning', 
        title: 'Post received backlash', 
        message: 'Some fans were not happy with this', 
        duration: 4000 
      })
    } else {
      addToast({ 
        type: 'success', 
        title: 'Post published!', 
        message: `${likes.toLocaleString()} likes, +${formatFollowers(followerChange)} followers`, 
        duration: 3000 
      })
    }
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
    const socialTimeCost = getActivityTimeCost('social_media_content')
    if (socialTimeCost.hours > 0) {
      consumeHoursFromBudget(socialTimeCost.hours, socialTimeCost.drain, 'Social Media Post', 'social_media_content')
    }
    addPersonalCalendarEntry({
      name: 'Social Media Post',
      description: `Published ${selectedSocialPostType} post`,
      activityId: 'social_media_content',
      week: careerState.currentWeek,
      day: careerState.currentDay ?? 1,
      duration: socialTimeCost.hours,
      drainLevel: socialTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'media',
      immediate: true
    })
    routeNotification({
      category: 'media_pr',
      subject: 'Social Media Post Published',
      body: `Your social media post has been published. ${wentViral ? 'It went viral!' : hadBacklash ? 'There was some backlash.' : 'Engagement looks healthy.'}`,
    })

    // Reset modal
    setShowSocialModal(false)
    setSelectedSocialPostType(null)
    setSocialPostOptions([])
    setSelectedSocialOptionId(null)
    setGeneratedPostImage(null)
    setIsGeneratingImage(false)
    setImageError(false)
  }
  
  // ============================================
  // PRESS RELEASE HANDLERS (AI-Generated)
  // ============================================
  
  // Generate press release image
  const handleGeneratePRImage = async (releaseType: PressReleaseType) => {
    setIsGeneratingPRImage(true)
    setPrImageIsStock(false)
    setPressReleaseImage(null)
    
    // Get facility descriptions
    const facilityDescs: string[] = []
    if (team.facilities) {
      for (const [key, facility] of Object.entries(team.facilities)) {
        if (facility && typeof facility === 'object' && (facility as any).level > 0) {
          const level = (facility as any).level || 1
          const facilityName = FACILITY_NAMES[key as FacilityType] || key
          const overrides = FACILITY_LEVEL_OVERRIDES[key as FacilityType]
          const levelData = overrides?.[level] || FACILITY_LEVELS[level]
          const desc = levelData?.description || `Level ${level}`
          facilityDescs.push(`${facilityName}: ${desc}`)
        }
      }
    }
    
    const currentSeriesEntry = careerState.seriesEntries?.find(e => e.seriesId === currentSeriesId)
    const recentSigningDriver = team.drivers?.find(d => (d.contractSignedWeek ?? 0) >= Math.max(1, careerState.currentWeek - 4))
    const signingDriverRival = recentSigningDriver ? rivals.find(r => r.id === recentSigningDriver.driverId) : null
    
    const imageCtx: PressReleaseImageContext = {
      releaseType,
      teamName: team.name,
      teamTier: team.tier,
      driverName,
      trackName: lastRaceResult?.trackName || currentRaceWeekend?.trackName,
      newEntityName: signingDriverRival ? `${signingDriverRival.firstName} ${signingDriverRival.lastName}` : undefined,
      racePosition: lastRaceResult?.position,
      championshipPosition: playerStanding?.position,
      totalWins: (player?.raceHistory || []).filter(r => r.position === 1).length,
      carCount: careerState.cars?.length ?? 0,
      carType: careerState.cars?.[0]?.type,
      staffCount: (team.staff?.length ?? 0) + (team.facilityStaff?.length ?? 0),
      hasSeriesEntry: !!currentSeriesEntry,
      seriesName: currentSeriesEntry?.seriesName,
      facilityDescriptions: facilityDescs,
      sponsorNames: sponsors.map(s => s.sponsorName),
      isFirstSeason: (player?.seasonsCompleted ?? 0) === 0,
      seasonsCompleted: player?.seasonsCompleted,
      teamMorale: team.teamMorale,
      baseCountry: team.baseCountry,
      recentSigningName: signingDriverRival ? `${signingDriverRival.firstName} ${signingDriverRival.lastName}` : undefined,
    }
    
    const imageUrl = await generatePressReleaseImage(imageCtx)
    
    if (imageUrl) {
      setPressReleaseImage(imageUrl)
    } else {
      // Stock fallback
      const fallbackCategory = getPressReleaseFallbackCategory(releaseType, careerState.cars?.length ?? 0)
      setPressReleaseImage(getRandomImage(fallbackCategory))
      setPrImageIsStock(true)
    }
    
    setIsGeneratingPRImage(false)
  }
  
  const handleOpenPressReleaseModal = async (releaseType: PressReleaseType) => {
    setSelectedPressReleaseType(releaseType)
    setShowPressReleaseModal(true)
    setLoadingPressReleases(true)
    setPressReleaseOptions([])
    setSelectedPressReleaseId(null)
    setPressReleaseImage(null)
    setPrImageIsStock(false)
    
    // Trigger image generation in parallel
    if (pressReleaseImageEnabled) {
      handleGeneratePRImage(releaseType)
    }
    
    // Compute helper values for rich context
    const staffNames = team.staff?.map(s => s.name).filter(Boolean) || []
    const facilityNamesList = team.facilities ? Object.keys(team.facilities).filter(k => (team.facilities as any)?.[k]?.level > 0) : []
    const completedUpgradeNames = team.development?.completedUpgrades?.map((u: any) => u.name || u.id) || []
    const recentUpgradeNames = team.development?.activeUpgrades?.map((u: any) => u.name || u.id) || []
    const raceHistoryAll = player?.raceHistory || []
    const totalWins = raceHistoryAll.filter(r => r.position === 1).length
    const totalPodiums = raceHistoryAll.filter(r => r.position <= 3).length
    const currentSeriesEntry = careerState.seriesEntries?.find(e => e.seriesId === currentSeriesId)
    const rivalTeamNamesArr = (getStandings(currentSeriesId || '') || [])
      .filter(s => s.driverName !== `${player?.firstName} ${player?.lastName}`)
      .slice(0, 5)
      .map(s => s.teamName)
      .filter(Boolean) as string[]
    
    // Get facility descriptions
    const facilityDescs: string[] = []
    if (team.facilities) {
      for (const [key, facility] of Object.entries(team.facilities)) {
        if (facility && typeof facility === 'object' && (facility as any).level > 0) {
          const level = (facility as any).level || 1
          const facilityName = FACILITY_NAMES[key as FacilityType] || key
          const overrides = FACILITY_LEVEL_OVERRIDES[key as FacilityType]
          const levelData = overrides?.[level] || FACILITY_LEVELS[level]
          const desc = levelData?.description || `Level ${level}`
          facilityDescs.push(`${facilityName}: ${desc}`)
        }
      }
    }
    
    // Recent signing context
    const recentSigningWeekThreshold = Math.max(1, careerState.currentWeek - 4)
    const recentDriverSigning = team.drivers?.find(d => (d.contractSignedWeek ?? 0) >= recentSigningWeekThreshold)
    const signingDriverRival = recentDriverSigning ? rivals.find(r => r.id === recentDriverSigning.driverId) : null
    const recentStaffHire = team.staff?.find(s => (s.hiredWeek ?? 0) >= recentSigningWeekThreshold)
    
    // Suggested PR context
    const matchingSuggestion = suggestedPressReleaseTypes.find(s => s.type === releaseType)
    
    // Recent activity context
    const recentActivities = careerState.recentCompletedActivities || []
    const matchingActivity = recentActivities.length > 0 ? recentActivities[recentActivities.length - 1] : undefined
    
    // Build rich context for AI generation (matching social post depth)
    const context: PressReleaseContext = {
      releaseType,
      teamName: team.name,
      teamTier: team.tier,
      driverName,
      boardMood: team.boardMood,
      currentWeek: careerState.currentWeek,
      currentYear: careerState.currentYear,
      trackName: lastRaceResult?.trackName || currentRaceWeekend?.trackName,
      championshipPosition: playerStanding?.position,
      seasonPoints: playerStanding?.points,
      racePosition: lastRaceResult?.position,
      // New entity (for signing/sponsor types)
      newEntityName: signingDriverRival ? `${signingDriverRival.firstName} ${signingDriverRival.lastName}` : undefined,
      // Team state
      teamMorale: team.teamMorale,
      fanSentiment: mediaState.fanSentiment,
      followerCount: mediaState.teamSocial.followers,
      // People
      staffCount: (team.staff?.length ?? 0) + (team.facilityStaff?.length ?? 0),
      facilityStaffCount: team.facilityStaff?.length ?? 0,
      staffNames,
      recentSigningName: signingDriverRival 
        ? `${signingDriverRival.firstName} ${signingDriverRival.lastName}` 
        : recentStaffHire?.name,
      recentSigningRole: recentStaffHire?.role,
      // Business
      primarySponsor: sponsors[0]?.sponsorName,
      allSponsors: sponsors.map(s => s.sponsorName),
      sponsorCount: sponsors.length,
      budgetRunwayWeeks: team.finances?.runwayWeeks,
      // Technical
      carCount: careerState.cars?.length ?? 0,
      carType: careerState.cars?.[0]?.type,
      hasSeriesEntry: !!currentSeriesEntry,
      seriesName: currentSeriesEntry?.seriesName,
      recentUpgrades: recentUpgradeNames,
      completedUpgrades: completedUpgradeNames,
      facilityNames: facilityNamesList,
      facilityDescriptions: facilityDescs,
      // Performance history
      totalRaces: raceHistoryAll.length,
      totalWins,
      totalPodiums,
      lastRaceTrack: lastRaceResult?.trackName,
      lastRacePosition: lastRaceResult?.position,
      qualifyingPosition: raceWeekendProgress?.qualifying?.position,
      isRaceWeek: !!currentRaceWeekend,
      isPostRace: !!lastRaceResult && (careerState.currentWeek - (lastRaceResult.week || 0)) <= 1,
      // Career stage
      seasonsCompleted: player?.seasonsCompleted ?? 0,
      isFirstSeason: (player?.seasonsCompleted ?? 0) === 0,
      rivalTeamNames: rivalTeamNamesArr,
      // Activity-linked
      recentActivityName: matchingActivity?.name || matchingSuggestion?.reason,
      recentActivityDescription: matchingActivity?.description,
      recentActivityCategory: matchingActivity?.category,
      // Image generation
      baseCountry: team.baseCountry,
      sponsorNames: sponsors.map(s => s.sponsorName),
    }
    
    const options = await generatePressReleaseOptions(context)
    if (options) {
      setPressReleaseOptions(options)
    }
    setLoadingPressReleases(false)
  }
  
  const handlePublishPressRelease = () => {
    if (!selectedPressReleaseId || !selectedPressReleaseType) return
    
    const selectedOption = pressReleaseOptions.find(opt => opt.id === selectedPressReleaseId)
    if (!selectedOption) return
    
    // Create a headline from the press release
    const newHeadline: Omit<TeamHeadline, 'id'> = {
      headline: selectedOption.headline,
      outlet: 'Team Press Office',
      outletTier: 'local',
      sentiment: selectedOption.effects.fanSentiment >= 0 ? 'positive' : 'negative',
      topic: 'general',
      saved: false,
      week: careerState.currentWeek,
      year: careerState.currentYear,
    }
    
    addTeamHeadline(newHeadline)
    
    // Store the press release with image (fixes the "Recent Releases" always being empty)
    const mediaScore = selectedOption.effects.mediaScore || 3
    const reachTier = mediaScore >= 8 ? 'global' as const 
      : mediaScore >= 6 ? 'national' as const 
      : mediaScore >= 4 ? 'regional' as const 
      : 'local' as const
    
    addPressRelease({
      week: careerState.currentWeek,
      year: careerState.currentYear,
      type: selectedPressReleaseType as any, // PressReleaseType from mediaAI maps to store type
      headline: selectedOption.headline,
      body: selectedOption.content,
      tone: selectedOption.tone,
      released: true,
      imageDataUrl: pressReleaseImage || undefined,
      quote: selectedOption.quote,
      formalityLevel: selectedOption.formalityLevel,
      coverage: {
        reach: reachTier,
        outlets: Math.max(1, Math.round(mediaScore * 2)),
        sentiment: Math.round(selectedOption.effects.fanSentiment * 20),
      },
      effects: [
        ...(selectedOption.effects.fanSentiment !== 0 ? [{ type: 'fanSentiment' as const, value: selectedOption.effects.fanSentiment }] : []),
        ...(selectedOption.effects.boardMood !== 0 ? [{ type: 'boardMood' as const, value: selectedOption.effects.boardMood }] : []),
        ...(selectedOption.effects.sponsorSatisfaction !== 0 ? [{ type: 'sponsorSatisfaction' as const, value: selectedOption.effects.sponsorSatisfaction }] : []),
        ...(selectedOption.effects.reputation !== 0 ? [{ type: 'reputation' as const, value: selectedOption.effects.reputation }] : []),
      ],
    })
    
    // Apply effects
    if (selectedOption.effects.fanSentiment !== 0) {
      updateFanSentiment(selectedOption.effects.fanSentiment, 'Press release')
    }
    
    // Roll for controversy
    if (Math.random() * 100 < selectedOption.effects.controversyRisk) {
      addToast({
        type: 'warning',
        title: 'Press Release Controversy',
        message: 'Your statement attracted unwanted attention from the media',
        duration: 4000
      })
    } else {
      addToast({
        type: 'success',
        title: 'Press Release Published',
        message: selectedOption.headline,
        duration: 4000
      })
    }
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
    const prTimeCost = getActivityTimeCost('press_release_review')
    if (prTimeCost.hours > 0) {
      consumeHoursFromBudget(prTimeCost.hours, prTimeCost.drain, 'Press Release', 'press_release_review')
    }
    addPersonalCalendarEntry({
      name: 'Press Release',
      description: `Published: ${selectedOption.headline}`,
      activityId: 'press_release_review',
      week: careerState.currentWeek,
      day: careerState.currentDay ?? 1,
      duration: prTimeCost.hours,
      drainLevel: prTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'media',
      immediate: true
    })
    routeNotification({
      category: 'media_pr',
      subject: 'Press Release Published',
      body: `Your press release has been distributed: "${selectedOption.headline}". Media coverage is being tracked.`,
    })
    
    // Reset modal
    setShowPressReleaseModal(false)
    setSelectedPressReleaseType(null)
    setPressReleaseOptions([])
    setSelectedPressReleaseId(null)
    setPressReleaseImage(null)
    setPrImageIsStock(false)
  }
  
  // ============================================
  // FAN EVENT HANDLERS
  // ============================================
  
  const handleOpenEventModal = async () => {
    setShowEventModal(true)
    setSelectedEventId(null)
    setLoadingEvents(true)
    
    // Build comprehensive game context for AI
    const comprehensiveCtx = buildComprehensiveContext(team, careerState, mediaState)
    
    // Generate event options
    const context: FanEventContext = {
      eventType: 'meet_greet',
      teamName: team.name,
      teamTier: team.tier,
      driverName: comprehensiveCtx.primaryDriver?.name || driverName,
      isVirtual: false,
      sponsorName: comprehensiveCtx.sponsors?.[0]?.name || sponsors[0]?.sponsorName,
      fanSentiment: mediaState.fanSentiment,
      followerCount: mediaState.teamSocial.followers,
      currentWeek: careerState.currentWeek,
      currentYear: careerState.currentYear
    }
    
    // Try AI generation with comprehensive context, falls back automatically
    const options = await generateAIFanEventOptions(context, comprehensiveCtx)
    setEventOptions(options)
    setLoadingEvents(false)
  }
  
  const handleScheduleEvent = () => {
    if (!selectedEventId) return
    
    const selectedEvent = eventOptions.find(opt => opt.id === selectedEventId)
    if (!selectedEvent) return
    
    // Check if team can afford it
    if (team.budgets.cash < selectedEvent.cost) {
      addToast({
        type: 'error',
        title: 'Insufficient Funds',
        message: `You need $${selectedEvent.cost.toLocaleString()} to schedule this event`,
        duration: 4000
      })
      return
    }
    
    // Apply the event (simplified - could add to a scheduled events system)
    // For now, apply effects immediately as a placeholder
    if (selectedEvent.effects.fanSentiment !== 0) {
      updateFanSentiment(selectedEvent.effects.fanSentiment, `Fan event: ${selectedEvent.name}`)
    }
    
    // Update followers
    if (mediaState.teamSocial && careerState.teamMediaState) {
      updateTeamMediaState({
        teamSocial: {
          ...mediaState.teamSocial,
          followers: mediaState.teamSocial.followers + selectedEvent.effects.followerGain
        }
      })
    }
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
    const eventTimeCost = getActivityTimeCost('fan_event')
    if (eventTimeCost.hours > 0) {
      consumeHoursFromBudget(eventTimeCost.hours, eventTimeCost.drain, `Fan Event: ${selectedEvent.name}`, 'fan_event')
    }
    addPersonalCalendarEntry({
      name: `Fan Event: ${selectedEvent.name}`,
      description: `${selectedEvent.name} - Expected ${selectedEvent.expectedAttendance} attendees`,
      activityId: 'fan_event',
      week: careerState.currentWeek,
      day: careerState.currentDay ?? 1,
      duration: eventTimeCost.hours,
      drainLevel: eventTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'media',
      immediate: true
    })
    routeNotification({
      category: 'media_pr',
      subject: `Fan Event: ${selectedEvent.name}`,
      body: `The fan event "${selectedEvent.name}" has been scheduled. Expected attendance: ${selectedEvent.expectedAttendance}. Your PR team will handle promotion.`,
    })
    
    addToast({
      type: 'success',
      title: 'Event Scheduled!',
      message: `${selectedEvent.name} - Expected ${selectedEvent.expectedAttendance} attendees`,
      duration: 4000
    })
    
    // Reset modal
    setShowEventModal(false)
    setEventOptions([])
    setSelectedEventId(null)
  }
  
  // ============================================
  // EXCLUSIVE CONTENT HANDLER
  // ============================================
  
  // ============================================
  // EXCLUSIVE CONTENT HANDLERS (AI-Generated)
  // ============================================
  
  const handleOpenExclusiveContentModal = async () => {
    setShowExclusiveContentModal(true)
    setSelectedExclusiveContentId(null)
    setLoadingExclusiveContent(true)
    
    // Build comprehensive game context for AI
    const comprehensiveCtx = buildComprehensiveContext(team, careerState, mediaState)
    
    const context: ExclusiveContentContext = {
      teamName: team.name,
      teamTier: team.tier,
      driverName: comprehensiveCtx.primaryDriver?.name || driverName,
      fanClubMembers: mediaState.fanClub.members,
      memberSatisfaction: mediaState.fanClub.memberSatisfaction,
      currentWeek: careerState.currentWeek,
      isRaceWeek: !!currentRaceWeekend,
      trackName: currentRaceWeekend?.trackId ? getTrackDisplayName(currentRaceWeekend.trackId) : undefined,
      lastRaceResult: lastRaceResult?.racePosition,
      recentUpgrade: comprehensiveCtx.recentUpgrades?.[0]
    }
    
    // Try AI generation with comprehensive context, falls back automatically
    const options = await generateAIExclusiveContentOptions(context, comprehensiveCtx)
    setExclusiveContentOptions(options)
    setLoadingExclusiveContent(false)
  }
  
  const handleReleaseExclusiveContent = () => {
    if (!selectedExclusiveContentId || !careerState.teamMediaState) return
    
    const selectedContent = exclusiveContentOptions.find(opt => opt.id === selectedExclusiveContentId)
    if (!selectedContent) return
    
    // Check if team can afford it
    if (team.budgets.cash < selectedContent.productionCost) {
      addToast({
        type: 'error',
        title: 'Insufficient Funds',
        message: `You need $${selectedContent.productionCost.toLocaleString()} to produce this content`,
        duration: 4000
      })
      return
    }
    
    // Apply effects
    const newContentCount = (mediaState.fanClub.exclusiveContentReleased || 0) + 1
    const followerGain = Math.floor(mediaState.fanClub.members * (selectedContent.effects.followerConversion / 100))
    const memberGrowth = Math.floor(mediaState.fanClub.members * (selectedContent.effects.memberGrowth / 100))
    
    updateTeamMediaState({
      fanClub: {
        ...mediaState.fanClub,
        exclusiveContentReleased: newContentCount,
        memberSatisfaction: Math.min(100, mediaState.fanClub.memberSatisfaction + selectedContent.effects.memberSatisfaction),
        members: mediaState.fanClub.members + memberGrowth
      },
      teamSocial: {
        ...mediaState.teamSocial,
        followers: mediaState.teamSocial.followers + followerGain,
        engagementRate: Math.min(15, mediaState.teamSocial.engagementRate + selectedContent.effects.engagementBoost * 0.1)
      }
    })
    
    // Boost fan sentiment
    updateFanSentiment(Math.ceil(selectedContent.effects.memberSatisfaction / 2), `Released: ${selectedContent.title}`)
    
    addToast({
      type: 'success',
      title: `${selectedContent.title} Released!`,
      message: `Satisfaction +${selectedContent.effects.memberSatisfaction}%, +${memberGrowth} members, +${followerGain} followers`,
      duration: 5000
    })
    
    // === TIME BUDGET + CALENDAR + NOTIFICATION INTEGRATION ===
    const exclusiveTimeCost = getActivityTimeCost('exclusive_content')
    if (exclusiveTimeCost.hours > 0) {
      consumeHoursFromBudget(exclusiveTimeCost.hours, exclusiveTimeCost.drain, `Exclusive Content: ${selectedContent.title}`, 'exclusive_content')
    }
    addPersonalCalendarEntry({
      name: `Exclusive Content: ${selectedContent.title}`,
      description: `Released exclusive fan club content: ${selectedContent.title}`,
      activityId: 'exclusive_content',
      week: careerState.currentWeek,
      day: careerState.currentDay ?? 1,
      duration: exclusiveTimeCost.hours,
      drainLevel: exclusiveTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'media',
      immediate: true
    })
    routeNotification({
      category: 'media_pr',
      subject: 'Exclusive Content Released',
      body: `Exclusive fan club content "${selectedContent.title}" has been released. Member satisfaction increased and fan engagement is growing.`,
    })

    // Reset modal
    setShowExclusiveContentModal(false)
    setExclusiveContentOptions([])
    setSelectedExclusiveContentId(null)
  }
  
  // ============================================
  // PRESS CONFERENCE HANDLERS
  // ============================================
  
  const handleOpenPressConferenceModal = async () => {
    setShowPressConferenceModal(true)
    setSelectedPressConferenceId(null)
    setConferenceInProgress(false)
    setConferenceResults(null)
    setQuestionIndex(0)
    setLoadingConference(true)
    
    // Build comprehensive game context for AI
    const comprehensiveCtx = buildComprehensiveContext(team, careerState, mediaState)
    setGameContext(comprehensiveCtx)
    
    const context = {
      conferenceType: 'mid_season_review',
      eventType: 'post_race_finish' as const,
      playerName: player?.firstName ? `${player.firstName} ${player.lastName}` : 'Player',
      teamName: team.name,
      teamTier: team.tier,
      seriesName: currentSeriesId || 'Unknown Series',
      seriesTier: team.tier,
      driverName,
      lastRacePosition: lastRaceResult?.racePosition,
      championshipPosition: playerStanding?.position,
      boardMood: team.boardMood,
      teamMorale: comprehensiveCtx.teamMorale,
      currentWeek: careerState.currentWeek,
      currentYear: careerState.currentYear
    } as TeamPressConferenceContext
    
    // Store context for later use in answer generation
    setPressConferenceContext(context)
    
    // Use sync generation for conference structure (quick)
    // Questions will be AI-generated when conference starts
    const options = generatePressConferenceOptions(context)
    setPressConferenceOptions(options)
    setLoadingConference(false)
  }
  
  const handleStartPressConference = async () => {
    if (!selectedPressConferenceId || !pressConferenceContext) return
    
    const selectedConference = pressConferenceOptions.find(opt => opt.id === selectedPressConferenceId)
    if (!selectedConference) return
    
    // === TIME BUDGET + CALENDAR INTEGRATION ===
    const pcTimeCost = getActivityTimeCost('press_conference')
    if (pcTimeCost.hours > 0) {
      consumeHoursFromBudget(pcTimeCost.hours, pcTimeCost.drain, `Press Conference: ${selectedConference.name}`, 'press_conference')
    }
    addPersonalCalendarEntry({
      name: `Press Conference`,
      description: `Press conference: ${selectedConference.name}`,
      activityId: 'press_conference',
      week: careerState.currentWeek,
      day: careerState.currentDay ?? 1,
      duration: pcTimeCost.hours,
      drainLevel: pcTimeCost.drain,
      calendarEntryType: 'personal',
      category: 'media',
      immediate: true
    })
    
    // Start the conference
    setConferenceInProgress(true)
    setQuestionIndex(0)
    setLoadingAnswers(true)
    
    // Generate AI questions for the conference with full game context
    const aiQuestions = await generateAIPressConferenceQuestions(
      pressConferenceContext, 
      selectedConference.questions.length,
      gameContext || undefined
    )
    
    // Update the conference with AI questions
    const updatedConference = {
      ...selectedConference,
      questions: aiQuestions
    }
    setPressConferenceOptions(prev => prev.map(opt => 
      opt.id === selectedPressConferenceId ? updatedConference : opt
    ))
    
    setConferenceResults({ mediaScore: selectedConference.baseMediaScore, completed: 0, total: aiQuestions.length })
    
    // Load first question with AI-generated answers
    const firstQuestion = aiQuestions[0]
    if (firstQuestion) {
      setCurrentQuestion(firstQuestion)
      const aiAnswers = await generateAIAnswerOptions(
        firstQuestion, 
        pressConferenceContext,
        gameContext || undefined
      )
      setCurrentAnswerOptions(aiAnswers)
    }
    setLoadingAnswers(false)
  }
  
  const handleAnswerQuestion = async (answerId: string) => {
    if (!currentQuestion || !selectedPressConferenceId || !pressConferenceContext) return
    
    const selectedAnswer = currentAnswerOptions.find(opt => opt.id === answerId)
    const selectedConference = pressConferenceOptions.find(opt => opt.id === selectedPressConferenceId)
    
    if (!selectedAnswer || !selectedConference) return
    
    // Apply answer effects
    const currentResults = conferenceResults || { mediaScore: 0, completed: 0, total: 0 }
    const newResults = {
      mediaScore: currentResults.mediaScore + selectedAnswer.effects.mediaScore,
      completed: currentResults.completed + 1,
      total: currentResults.total
    }
    setConferenceResults(newResults)
    
    // Move to next question or finish
    const nextIndex = questionIndex + 1
    if (nextIndex < selectedConference.questions.length) {
      setQuestionIndex(nextIndex)
      setLoadingAnswers(true)
      
      const nextQuestion = selectedConference.questions[nextIndex]
      setCurrentQuestion(nextQuestion)
      
      // Generate AI answers for next question with full game context
      const aiAnswers = await generateAIAnswerOptions(
        nextQuestion, 
        pressConferenceContext,
        gameContext || undefined
      )
      setCurrentAnswerOptions(aiAnswers)
      setLoadingAnswers(false)
    } else {
      // Conference finished
      finishPressConference(newResults, selectedConference)
    }
  }
  
  const finishPressConference = (results: { mediaScore: number; completed: number; total: number }, _conference: PressConferenceOption) => {
    // Apply final effects
    if (careerState.teamMediaState) {
      const mediaBoost = results.mediaScore
      updateTeamMediaState({
        mediaScore: Math.min(100, (mediaState.mediaScore || 50) + mediaBoost)
      })
    }
    
    updateFanSentiment(Math.ceil(results.mediaScore / 2), 'Press conference coverage')
    addPressClipping({
      week: careerState.currentWeek,
      year: careerState.currentYear,
      headline: `${team.name} addresses media after race weekend`,
      outlet: 'Motorsport Daily',
      sentiment: results.mediaScore >= 0 ? 'positive' : 'neutral',
      relatedEventId: _conference?.id
    })
    
    addToast({
      type: 'success',
      title: 'Press Conference Completed!',
      message: `Media score: +${results.mediaScore} from ${results.completed} questions`,
      duration: 5000
    })
    
    // Reset
    setConferenceInProgress(false)
    setCurrentQuestion(null)
    setCurrentAnswerOptions([])
    setShowPressConferenceModal(false)
    setPressConferenceOptions([])
    setSelectedPressConferenceId(null)
  }

  const handleRespondToControversy = (controversyId: string, responseType: 'apologize' | 'defend' | 'no_comment' | 'deflect') => {
    const { respondToControversy } = useCareerStore.getState()
    respondToControversy(controversyId, responseType)
    
    // === TIME BUDGET + CALENDAR INTEGRATION ===
    const contTimeCost = getActivityTimeCost('controversy_response')
    if (contTimeCost.hours > 0) {
      consumeHoursFromBudget(contTimeCost.hours, contTimeCost.drain, `Controversy Response: ${responseType}`, 'controversy_response')
    }
    addPersonalCalendarEntry({
      name: `Controversy Response`,
      description: `Responded to controversy: ${responseType.replace('_', ' ')}`,
      activityId: 'controversy_response',
      week: careerState.currentWeek,
      day: careerState.currentDay ?? 1,
      duration: contTimeCost.hours,
      drainLevel: contTimeCost.drain,
      calendarEntryType: 'mandatory',
      category: 'media',
      immediate: true
    })
    routeNotification({
      category: 'media_pr',
      subject: 'Controversy Response Issued',
      body: `Your response to the controversy has been issued. You chose to ${responseType.replace('_', ' ')}. The PR team is monitoring the media reaction.`,
    })
    
    addToast({ 
      type: 'info', 
      title: 'Response issued', 
      message: `You chose to ${responseType.replace('_', ' ')}`, 
      duration: 3000 
    })
  }

  // ============================================
  // MEDIA DUTY HANDLERS
  // ============================================

  const handleOpenDuty = async (duty: MediaDuty, linkedFromCalendar = false) => {
    setCalendarLinkedDutyId(linkedFromCalendar ? duty.id : null)
    setSelectedDuty(duty)
    setSelectedOptionId(null)
    
    // If options already generated, use them
    if (duty.generatedOptions && duty.generatedOptions.length > 0) {
      setDutyOptions(duty.generatedOptions)
      return
    }
    
    // Generate new options
    setLoadingOptions(true)
    
    const context: MediaDutyContext = {
      dutyType: duty.type,
      teamName: team.name,
      teamTier: team.tier,
      trackName: duty.trackName,
      seriesName: duty.seriesName,
      currentWeek: careerState.currentWeek,
      currentYear: careerState.currentYear,
      dutyTitle: linkedFromCalendar ? pendingCalendarDuty?.name : undefined,
      dutyDescription: linkedFromCalendar ? pendingCalendarDuty?.description : undefined,
      sourceTemplateId: linkedFromCalendar ? pendingCalendarDuty?.templateId : undefined,
      driverName,
      boardMood: team.boardMood,
      teamMorale: team.teamMorale || team.fanSentiment, // Using fan sentiment as proxy if teamMorale not available
      // Add more context as available
    }
    
    try {
      const options = await generateMediaDutyOptions(context)
      if (options) {
        setDutyOptions(options)
      }
    } catch (e) {
      console.error('Failed to generate duty options:', e)
      addToast({
        type: 'error',
        title: 'Generation failed',
        message: 'Could not generate response options',
        duration: 3000
      })
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleOpenCalendarDutyFlow = useCallback(async () => {
    if (!pendingCalendarDuty) return

    setActiveTab('duties')

    const currentWeekDuties = (mediaState.dutySchedule?.weekendDuties || []).filter(
      duty => duty.week === careerState.currentWeek
    )

    const matchingStoredDuty = currentWeekDuties.find(duty => {
      const display = getDutyDisplayInfo(duty).name.toLowerCase()
      const lowerName = pendingCalendarDuty.name.toLowerCase()
      const lowerTemplate = pendingCalendarDuty.templateId.toLowerCase()
      return (
        duty.id === pendingCalendarDuty.activityId ||
        display.includes(lowerName) ||
        lowerName.includes(display) ||
        lowerTemplate.includes(duty.type)
      )
    })

    if (matchingStoredDuty) {
      await handleOpenDuty(matchingStoredDuty, true)
      return
    }

    await handleOpenDuty(createCalendarBackedDuty(pendingCalendarDuty), true)
  }, [pendingCalendarDuty, mediaState.dutySchedule?.weekendDuties, careerState.currentWeek, handleOpenDuty, createCalendarBackedDuty])

  useEffect(() => {
    if (!pendingCalendarDuty) return
    if (autoOpenedCalendarDutyId === pendingCalendarDuty.activityId) return
    setAutoOpenedCalendarDutyId(pendingCalendarDuty.activityId)
    void handleOpenCalendarDutyFlow()
  }, [pendingCalendarDuty, autoOpenedCalendarDutyId, handleOpenCalendarDutyFlow])

  const handleCompleteDuty = () => {
    if (!selectedDuty || !selectedOptionId) return
    const selectedOption = dutyOptions.find(o => o.id === selectedOptionId)

    const isStoredDuty = (mediaState.dutySchedule?.weekendDuties || []).some(d => d.id === selectedDuty.id)
    if (isStoredDuty) {
      completeDuty(selectedDuty.id, selectedOptionId)

      // === TIME BUDGET + CALENDAR INTEGRATION ===
      const dutyTimeCost = getActivityTimeCost('media_duty')
      if (dutyTimeCost.hours > 0) {
        consumeHoursFromBudget(dutyTimeCost.hours, dutyTimeCost.drain, `Media Duty: ${selectedDuty.type}`, 'media_duty')
      }
      addPersonalCalendarEntry({
        name: `Media Duty: ${selectedDuty.type.replace(/_/g, ' ')}`,
        description: `Completed media duty: ${selectedDuty.type.replace(/_/g, ' ')}`,
        activityId: 'media_duty',
        week: careerState.currentWeek,
        day: careerState.currentDay ?? 1,
        duration: dutyTimeCost.hours,
        drainLevel: dutyTimeCost.drain,
        calendarEntryType: 'mandatory',
        category: 'media',
        immediate: true
      })
    }

    if (isCalendarDutyInProgress && pendingCalendarDuty) {
      completeCalendarActivity(pendingCalendarDuty.activityId, { reputation: 3, marketability: 2 })
      // Mirror completion into Media tab surface so these duties are visible in media history.
      const dutyName = pendingCalendarDuty.name || 'Media duty'
      const headlineTone = (selectedOption?.effects?.mediaScore ?? 0) >= 0 ? 'positive' : 'neutral'
      addTeamHeadline({
        week: careerState.currentWeek,
        year: careerState.currentYear,
        headline: `${team.name} completes ${dutyName}`,
        outlet: 'Motorsport Daily',
        outletTier: 'national',
        sentiment: headlineTone,
        topic: 'results',
        relatedTo: pendingCalendarDuty.templateId,
        saved: false,
        effects: [
          {
            type: 'media_score',
            amount: Math.max(1, Math.abs(selectedOption?.effects?.mediaScore ?? 1)),
            reason: `Completed ${dutyName}`,
            source: 'calendar_media_duty',
          }
        ]
      })
      addPressClipping({
        week: careerState.currentWeek,
        year: careerState.currentYear,
        headline: `${team.name} fulfills ${dutyName}`,
        outlet: 'Trackside Report',
        sentiment: headlineTone,
        relatedEventId: pendingCalendarDuty.activityId
      })
      setPendingCalendarDuty(undefined)
      setCalendarLinkedDutyId(null)
      routerNavigate('/calendar')
    }

    addToast({
      type: 'success',
      title: 'Media duty completed',
      message: selectedOption ? `"${selectedOption.content.slice(0, 50)}..."` : 'Statement delivered',
      duration: 4000
    })
    
    // Reset state
    setSelectedDuty(null)
    setDutyOptions([])
    setSelectedOptionId(null)
    setCalendarLinkedDutyId(null)
  }

  const handleSkipDuty = () => {
    if (!selectedDuty) return
    
    skipDuty(selectedDuty.id)
    
    addToast({
      type: 'warning',
      title: 'Media duty skipped',
      message: `Penalty applied: $${selectedDuty.skipPenalty.fine.toLocaleString()} fine`,
      duration: 5000
    })
    
    // Reset state
    setSelectedDuty(null)
    setDutyOptions([])
    setSelectedOptionId(null)
    setCalendarLinkedDutyId(null)
  }

  // Get duties for display
  const weekendDuties = mediaState.dutySchedule?.weekendDuties?.filter(
    d => d.week === careerState.currentWeek
  ) || []
  const activeDuties = weekendDuties.filter(d => d.status === 'available')
  const upcomingDuties = weekendDuties.filter(d => d.status === 'upcoming')
  const completedDuties = weekendDuties.filter(d => d.status === 'completed')
  const _missedDuties = weekendDuties.filter(d => d.status === 'missed' || d.status === 'skipped')

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
    <div className="p-[24px] flex flex-col gap-[24px]">
      <PageHeader
        title="Interviews"
        subtitle={`${team.name} — Race Weekend Media Duties`}
        icon={<Mic className="w-6 h-6" />}
        actions={
          <div className="flex items-center gap-[12px]">
            {activeControversies.length > 0 && (
              <Badge variant="red" size="lg">
                <AlertOctagon className="w-4 h-4 mr-[4px]" />
                {activeControversies.length} Active Issue{activeControversies.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        }
      />

      {/* Interview-only: skip tab bar, always show duties content */}
      <Tabs value="duties" onValueChange={() => {}}>
        <TabsList className="hidden" />

        {/* Calendar Duty Banner - shown when routed from Calendar for a specific media activity */}
        {pendingCalendarDuty && (
          <div
            className="mb-[16px] p-[12px] bg-[#eff6ff] border-[0.8px] border-[#3b82f6]/30 rounded-[12px] flex items-center justify-between"
          >
            <div className="flex items-center gap-[12px]">
              <Calendar className="w-5 h-5 text-[#3b82f6]" />
              <div>
                <p className="text-[14px] font-semibold text-[#3b82f6]">Calendar Media Duty</p>
                <p className="text-[12px] text-[#6b7280]">Complete your scheduled duty: <span className="text-[#0a0a0a]">{pendingCalendarDuty.name}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-[8px]">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setPendingCalendarDuty(undefined)
                  routerNavigate('/calendar')
                }}
              >
                Back to Calendar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  void handleOpenCalendarDutyFlow()
                }}
              >
                <CheckCircle className="w-4 h-4 mr-[4px]" />
                Start Duty Flow
              </Button>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* TAB: MEDIA DUTIES */}
        {/* ============================================ */}
        <TabsContent value="duties">
          <div className="grid grid-cols-3 gap-[24px]">
            {/* Left Column - Duty Timeline */}
            <div className="col-span-2 space-y-[24px]">
              {/* Active Duties - Need Attention */}
              {activeDuties.length > 0 && (
                <Card variant="glass" padding="lg">
                  <CardHeader 
                    title="Active Duties" 
                    subtitle="Requires your attention now"
                    icon={<AlertCircle className="w-5 h-5 text-[#f97316]" />}
                  />
                  <div className="space-y-[12px] mt-[16px]">
                    {activeDuties.map(duty => {
                      const displayInfo = getDutyDisplayInfo(duty)
                      return (
                        <div
                          key={duty.id}
                          className="p-4 bg-[#f97316]/10 border-[0.8px] border-[#f97316]/30 rounded-[8px] cursor-pointer hover:bg-[#f97316]/20 transition-colors"
                          onClick={() => handleOpenDuty(duty)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-[12px]">
                              <div className={`w-10 h-10 rounded-[8px] bg-[#f97316]/20 flex items-center justify-center`}>
                                <Mic className="w-5 h-5 text-[#f97316]" />
                              </div>
                              <div>
                                <p className="font-medium text-[#0a0a0a]">{displayInfo.name}</p>
                                <p className="text-[14px] text-[#6b7280]">{displayInfo.timeDescription} • {duty.trackName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-[12px]">
                              <Badge variant={displayInfo.urgency === 'critical' ? 'destructive' : displayInfo.urgency === 'high' ? 'warning' : 'default'}>
                                {displayInfo.urgency.toUpperCase()}
                              </Badge>
                              <ChevronRight className="w-5 h-5 text-[#6b7280]" />
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-[16px] text-[14px] text-[#6b7280]">
                            <span className="flex items-center gap-[4px]">
                              <DollarSign className="w-4 h-4" />
                              Skip fine: ${duty.skipPenalty.fine.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-[4px]">
                              <AlertTriangle className="w-4 h-4" />
                              {duty.skipPenalty.sponsorSatisfaction} sponsor satisfaction
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Upcoming Duties */}
              {upcomingDuties.length > 0 && (
                <Card variant="glass" padding="lg">
                  <CardHeader 
                    title="Upcoming Duties" 
                    subtitle="Scheduled for this weekend"
                    icon={<Calendar className="w-5 h-5 text-[#3b82f6]" />}
                  />
                  <div className="space-y-[8px] mt-[16px]">
                    {upcomingDuties.map(duty => {
                      const displayInfo = getDutyDisplayInfo(duty)
                      return (
                        <div
                          key={duty.id}
                          className="p-3 bg-[#f9fafb]/50 border-[0.8px] border-black/10 rounded-[8px]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-[12px]">
                              <div className="w-8 h-8 rounded-[8px] bg-[#3b82f6]/20 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-[#3b82f6]" />
                              </div>
                              <div>
                                <p className="font-medium text-[#0a0a0a]">{displayInfo.name}</p>
                                <p className="text-[12px] text-[#6b7280]">{displayInfo.timeDescription}</p>
                              </div>
                            </div>
                            <Badge variant="outline">{getDayName(duty.day)}</Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Completed Duties */}
              {completedDuties.length > 0 && (
                <Card variant="glass" padding="lg">
                  <CardHeader 
                    title="Completed" 
                    subtitle="Duties finished this weekend"
                    icon={<CheckCircle className="w-5 h-5 text-[#00a63e]" />}
                  />
                  <div className="space-y-[8px] mt-[16px]">
                    {completedDuties.map(duty => {
                      const displayInfo = getDutyDisplayInfo(duty)
                      return (
                        <div
                          key={duty.id}
                          className="p-3 bg-[#00a63e]/5 border-[0.8px] border-[#00a63e]/20 rounded-[8px]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-[12px]">
                              <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                              <div>
                                <p className="font-medium text-[#0a0a0a]">{displayInfo.name}</p>
                                {duty.selectedOption && (
                                  <p className="text-[12px] text-[#6b7280] line-clamp-1">
                                    "{duty.selectedOption.content.slice(0, 60)}..."
                                  </p>
                                )}
                              </div>
                            </div>
                            {duty.controversyTriggered && (
                              <Badge variant="warning">Controversy</Badge>
                            )}
                            {duty.fineIssued && duty.fineIssued > 0 && (
                              <Badge variant="destructive">${duty.fineIssued.toLocaleString()} fine</Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* No Duties This Week */}
              {weekendDuties.length === 0 && (
                <Card variant="glass" padding="lg">
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto mb-[16px] text-[#6b7280]" />
                    <h3 className="text-[18px] font-medium text-[#0a0a0a] mb-[8px]">No Race Weekend</h3>
                    <p className="text-[#6b7280]">
                      Media duties will appear when you have an upcoming race weekend.
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Stats & Promises */}
            <div className="space-y-[24px]">
              {/* Season Stats */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Season Media Stats" />
                <div className="space-y-[16px] mt-[16px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7280]">Duties Completed</span>
                    <span className="font-medium text-[#00a63e]">
                      {mediaState.dutySchedule?.completedDutiesThisSeason || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7280]">Duties Missed</span>
                    <span className="font-medium text-[#ef4444]">
                      {mediaState.dutySchedule?.missedDutiesThisSeason || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7280]">Fines Paid</span>
                    <span className="font-medium text-[#f97316]">
                      ${(mediaState.dutySchedule?.finesPaidThisSeason || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6b7280]">Controversies</span>
                    <span className="font-medium text-[#f59e0b]">
                      {mediaState.dutySchedule?.controversiesFromMedia || 0}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Active Promises */}
              {(mediaState.dutySchedule?.activePromises?.length || 0) > 0 && (
                <Card variant="glass" padding="lg">
                  <CardHeader 
                    title="Active Promises" 
                    subtitle="Public commitments to deliver"
                    icon={<Target className="w-5 h-5 text-[#ef4444]" />}
                  />
                  <div className="space-y-[12px] mt-[16px]">
                    {mediaState.dutySchedule?.activePromises
                      ?.filter(p => !p.fulfilled && !p.broken)
                      .map(promise => (
                        <div
                          key={promise.id}
                          className="p-3 bg-[#ef4444]/10 border-[0.8px] border-[#ef4444]/20 rounded-[8px]"
                        >
                          <p className="text-[14px] font-medium text-[#0a0a0a]">{promise.target}</p>
                          <p className="text-[12px] text-[#6b7280] mt-1">
                            Deadline: Week {promise.deadline}
                          </p>
                        </div>
                      ))}
                  </div>
                </Card>
              )}

              {/* Tips */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Media Tips" icon={<Sparkles className="w-5 h-5 text-[#f59e0b]" />} />
                <div className="space-y-[12px] mt-[16px] text-[14px] text-[#6b7280]">
                  <p>• Complete all duties to maintain sponsor satisfaction</p>
                  <p>• Bold statements can boost engagement but risk controversy</p>
                  <p>• Making promises is risky - you must deliver or face backlash</p>
                  <p>• Post-race duties are the most watched - choose wisely</p>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 1: COMMAND CENTER */}
        {/* ============================================ */}
        <TabsContent value="command">
          <div className="grid grid-cols-3 gap-[24px]">
            {/* Left Column - Main Overview */}
            <div className="col-span-2 space-y-[24px]">
              {/* Breaking News / Recent Headlines */}
              <Card variant="glass" padding="lg">
                <CardHeader 
                  title="Breaking News" 
                  subtitle="Latest headlines about your team"
                  action={
                    <Button variant="ghost" size="sm" onClick={() => setExpandedHeadlines(!expandedHeadlines)}>
                      {expandedHeadlines ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  }
                />
                {recentHeadlines.length > 0 ? (
                  <div className="space-y-[12px]">
                    {recentHeadlines.map((headline) => (
                      <div 
                        key={headline.id} 
                        className="p-3 bg-[#f9fafb] rounded-[8px] border-[0.8px] border-black/10 hover:border-black/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-[12px]">
                          <div className="flex-1">
                            <p className={`font-medium ${getHeadlineSentimentColor(headline.sentiment)}`}>
                              {headline.headline}
                            </p>
                            <p className="text-[12px] text-[#6b7280] mt-1">
                              {headline.outlet} • Week {headline.week}, Year {headline.year}
                            </p>
                          </div>
                          <Badge variant={headline.sentiment === 'positive' ? 'green' : headline.sentiment === 'negative' ? 'red' : 'default'} size="sm">
                            {headline.sentiment}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#6b7280]">
                    <Newspaper className="w-12 h-12 mx-auto mb-[12px] opacity-50" />
                    <p>No headlines yet. Start making news!</p>
                  </div>
                )}
              </Card>

              {/* Active Controversies */}
              {activeControversies.length > 0 && (
                <Card variant="glass" padding="lg" className="border-[#ef4444]/30">
                  <CardHeader 
                    title="Active Controversies"
                    subtitle="Issues requiring your attention"
                    icon={<AlertOctagon className="w-5 h-5 text-[#ef4444]" />}
                  />
                  <div className="space-y-[16px]">
                    {activeControversies.map((controversy) => (
                      <div 
                        key={controversy.id} 
                        className={`p-4 rounded-[8px] border ${getControversySeverityColor(controversy.severity)}`}
                      >
                        <div className="flex items-start justify-between gap-[16px] mb-[12px]">
                          <div>
                            <h4 className="font-semibold">{controversy.headline}</h4>
                            <p className="text-[14px] opacity-80 mt-1">{controversy.description}</p>
                          </div>
                          <Badge variant={controversy.severity === 'critical' ? 'red' : controversy.severity === 'major' ? 'orange' : 'default'}>
                            {controversy.severity.toUpperCase()}
                          </Badge>
                        </div>
                        
                        {/* Intensity bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-[12px] mb-[4px]">
                            <span>Public Intensity</span>
                            <span>{Math.round(controversy.currentIntensity)}%</span>
                          </div>
                          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-current transition-all duration-500"
                              style={{ width: `${controversy.currentIntensity}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Response options */}
                        {!controversy.responded ? (
                          <div className="flex gap-[8px] flex-wrap">
                            <Button size="sm" variant="secondary" onClick={() => handleRespondToControversy(controversy.id, 'apologize')}>
                              Apologize
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleRespondToControversy(controversy.id, 'defend')}>
                              Defend
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleRespondToControversy(controversy.id, 'no_comment')}>
                              No Comment
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleRespondToControversy(controversy.id, 'deflect')}>
                              Deflect
                            </Button>
                          </div>
                        ) : (
                          <p className="text-[14px] opacity-70">
                            Response: <span className="capitalize">{controversy.responseType?.replace('_', ' ')}</span>
                            {controversy.responseEffectiveness && ` (${controversy.responseEffectiveness}% effective)`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Quick Actions */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Quick Actions" subtitle="AI-assisted media tasks" />
                <div className="grid grid-cols-3 gap-[16px]">
                  <Button 
                    variant="primary" 
                    className="h-auto py-4 flex-col gap-[8px]"
                    onClick={() => setShowSocialModal(true)}
                  >
                    <Send className="w-6 h-6" />
                    <span>New Post</span>
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="h-auto py-4 flex-col gap-[8px]"
                    onClick={() => setShowPressReleaseModal(true)}
                  >
                    <FileText className="w-6 h-6" />
                    <span>Press Release</span>
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="h-auto py-4 flex-col gap-[8px]"
                    onClick={handleOpenEventModal}
                  >
                    <Users className="w-6 h-6" />
                    <span>Fan Event</span>
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-[24px]">
              {/* Media Narrative */}
              <Card variant="default" padding="lg">
                <CardHeader title="Media Narrative" subtitle="How the press sees your team" />
                <div className="space-y-[12px]">
                  <div className="p-3 bg-background rounded-[8px]">
                    <p className="text-[14px] text-[#6b7280] mb-[4px]">Current Story</p>
                    <p className="font-semibold text-[18px] capitalize">
                      {mediaState.currentNarrative.current.replace('_', ' ')}
                    </p>
                    <p className="text-[12px] text-[#6b7280] mt-1">
                      Strength: {mediaState.currentNarrative.strength}%
                    </p>
                  </div>
                  {mediaState.currentNarrative.factors.length > 0 && (
                    <div>
                      <p className="text-[12px] text-[#6b7280] mb-[8px]">Driving factors:</p>
                      <div className="flex flex-wrap gap-[4px]">
                        {mediaState.currentNarrative.factors.map((factor, i) => (
                          <Badge key={i} variant="default" size="sm">{factor}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Sponsor Obligations */}
              {pendingObligations.length > 0 && (
                <Card variant="default" padding="lg">
                  <CardHeader title="Media Obligations" subtitle="Required sponsor activities" />
                  <div className="space-y-[12px]">
                    {pendingObligations.slice(0, 4).map((obligation) => (
                      <div key={obligation.id} className="p-3 bg-background rounded-[8px]">
                        <div className="flex items-center justify-between mb-[8px]">
                          <span className="font-medium text-[14px]">{obligation.sponsorName}</span>
                          <Badge variant={obligation.deadline <= careerState.currentWeek + 2 ? 'red' : 'default'} size="sm">
                            Week {obligation.deadline}
                          </Badge>
                        </div>
                        <p className="text-[12px] text-[#6b7280] mb-[8px]">{obligation.description}</p>
                        <div className="flex items-center gap-[8px]">
                          <div className="flex-1 h-2 bg-[#f9fafb] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#f59e0b] transition-all"
                              style={{ width: `${(obligation.completed / obligation.required) * 100}%` }}
                            />
                          </div>
                          <span className="text-[12px] text-[#6b7280]">
                            {obligation.completed}/{obligation.required}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Fan Club Status */}
              <Card variant="default" padding="lg">
                <CardHeader title="Fan Club" subtitle={`${formatFollowers(mediaState.fanClub.members)} members`} />
                <div className="space-y-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#6b7280]">Tier</span>
                    <Badge variant="gold" size="sm" className="capitalize">{mediaState.fanClub.tier}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#6b7280]">Satisfaction</span>
                    <span className={getSentimentColor(mediaState.fanClub.memberSatisfaction)}>
                      {mediaState.fanClub.memberSatisfaction}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#6b7280]">Weekly Growth</span>
                    <span className={mediaState.fanClub.weeklyGrowth >= 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}>
                      {mediaState.fanClub.weeklyGrowth >= 0 ? '+' : ''}{mediaState.fanClub.weeklyGrowth}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 2: PRESS & PR */}
        {/* ============================================ */}
        <TabsContent value="press">
          <div className="grid grid-cols-3 gap-[24px]">
            <div className="col-span-2 space-y-[24px]">
              {/* Press Conferences */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Press Conferences" subtitle="Scheduled and available events" />
                <div className="space-y-[16px]">
                  {mediaState.pressConferences.length > 0 ? (
                    mediaState.pressConferences.slice(0, 5).map((conf) => (
                      <div key={conf.id} className="p-4 bg-[#f9fafb] rounded-[8px] border-[0.8px] border-black/10">
                        <div className="flex items-center justify-between mb-[8px]">
                          <h4 className="font-semibold">{conf.title}</h4>
                          <Badge variant={conf.completed ? 'green' : 'default'}>
                            {conf.completed ? 'Completed' : 'Scheduled'}
                          </Badge>
                        </div>
                        <p className="text-[14px] text-[#6b7280]">{conf.description}</p>
                        <p className="text-[12px] text-[#6b7280] mt-[8px]">Week {conf.week}, Year {conf.year}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-[#6b7280]">
                      <Mic className="w-12 h-12 mx-auto mb-[12px] opacity-50" />
                      <p>No press conferences scheduled</p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="mt-4"
                        onClick={handleOpenPressConferenceModal}
                      >
                        Schedule Press Conference
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* Suggested Press Releases (Activity-Linked) */}
              {suggestedAvailablePRTypes.length > 0 && (
                <Card variant="glass" padding="lg">
                  <CardHeader 
                    title="Suggested Releases" 
                    subtitle="Based on recent team events"
                  />
                  <div className="grid grid-cols-2 gap-[12px]">
                    {suggestedAvailablePRTypes.map((prType) => {
                      const suggestion = suggestedPressReleaseTypes.find(s => s.type === prType.type)
                      return (
                        <button
                          key={prType.type}
                          onClick={() => handleOpenPressReleaseModal(prType.type)}
                          className="p-[16px] bg-black/5 hover:bg-black/10 rounded-[12px] text-left transition-all border-[0.8px] border-black/10 hover:border-black/20 relative overflow-hidden"
                        >
                          <div className="flex items-start gap-[12px]">
                            <span className="text-[24px] flex-shrink-0">{prType.icon}</span>
                            <div className="min-w-0">
                              <span className="text-[14px] font-medium block">{prType.name}</span>
                              <span className="text-[12px] text-[#6b7280] block mt-0.5">{prType.description}</span>
                              {suggestion?.reason && (
                                <span className="text-[10px] text-[#ef4444] mt-1 block truncate">
                                  {suggestion.reason}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="absolute top-1.5 right-1.5">
                            <span className="text-[9px] bg-[#ef4444]/20 text-[#ef4444] px-1.5 py-0.5 rounded-full font-medium">
                              Suggested
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Press Releases - AI Generated */}
              <Card variant="glass" padding="lg">
                <CardHeader 
                  title="Press Releases" 
                  subtitle="AI-assisted official statements"
                />
                <div className="grid grid-cols-4 gap-[12px] mb-[16px]">
                  {regularAvailablePRTypes.map((releaseType) => (
                    <button
                      key={releaseType.type}
                      onClick={() => handleOpenPressReleaseModal(releaseType.type)}
                      className="p-[12px] bg-[#f9fafb] hover:bg-[#f3f4f6] rounded-[8px] text-center transition-all border-[0.8px] border-transparent hover:border-black/10"
                    >
                      <span className="text-[20px] block mb-[4px]">{releaseType.icon}</span>
                      <span className="text-[12px] font-medium">{releaseType.name}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-black/10 pt-4">
                  <h4 className="text-[14px] font-medium mb-[12px]">Recent Releases</h4>
                  <div className="space-y-[12px]">
                    {mediaState.pressReleases.length > 0 ? (
                      mediaState.pressReleases.slice(0, 5).map((release) => {
                        const toneColors: Record<string, string> = {
                          professional: 'bg-blue-500/20 text-blue-400',
                          confident: 'bg-amber-500/20 text-amber-400',
                          humble: 'bg-sky-500/20 text-sky-400',
                          bold: 'bg-orange-500/20 text-orange-400',
                        }
                        const toneColor = toneColors[release.tone] || 'bg-[#f9fafb] text-[#6b7280]'
                        const releaseTypeInfo = PRESS_RELEASE_TYPES.find(t => t.type === release.type)
                        
                        return (
                          <div key={release.id} className="p-3 bg-[#f9fafb] rounded-[8px] overflow-hidden">
                            {/* Image banner */}
                            {release.imageDataUrl && (
                              <div className="-mx-3 -mt-3 mb-[12px]">
                                <img 
                                  src={release.imageDataUrl} 
                                  alt={release.headline}
                                  className="w-full aspect-[3/1] object-cover"
                                />
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-[12px]">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-[8px] mb-[4px]">
                                  {releaseTypeInfo && (
                                    <span className="text-[14px]">{releaseTypeInfo.icon}</span>
                                  )}
                                  <h4 className="font-medium text-[14px] truncate">{release.headline}</h4>
                                </div>
                                {release.quote && (
                                  <p className="text-[12px] text-[#6b7280] italic mb-[4px].5 line-clamp-1">
                                    "{release.quote}"
                                  </p>
                                )}
                                <div className="flex items-center gap-[8px] flex-wrap">
                                  <p className="text-[10px] text-[#6b7280]">
                                    Week {release.week}, Year {release.year}
                                  </p>
                                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${toneColor}`}>
                                    {release.tone}
                                  </span>
                                  {release.formalityLevel && (
                                    <Badge variant="default" size="sm">{release.formalityLevel}</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-[4px] flex-shrink-0">
                                <Badge variant={release.released ? 'green' : 'default'} size="sm">
                                  {release.coverage.reach}
                                </Badge>
                                <span className="text-[10px] text-[#6b7280]">{release.coverage.outlets} outlet{release.coverage.outlets !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-center py-4 text-[#6b7280] text-[14px]">No press releases issued yet</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-[24px]">
              {/* Crisis Management */}
              <Card variant="default" padding="lg" className={activeControversies.length > 0 ? 'border-[#ef4444]/30' : ''}>
                <CardHeader title="Crisis Management" subtitle="Active issues" />
                {activeControversies.length > 0 ? (
                  <div className="space-y-[8px]">
                    {activeControversies.map((c) => (
                      <div key={c.id} className="p-2 bg-[#ef4444]/10 rounded-[4px] border-[0.8px] border-[#ef4444]/30">
                        <p className="text-[14px] font-medium text-[#ef4444]">{c.headline}</p>
                        <p className="text-[12px] text-[#6b7280]">Intensity: {Math.round(c.currentIntensity)}%</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Shield className="w-8 h-8 mx-auto mb-[8px] text-[#00a63e]" />
                    <p className="text-[14px] text-[#00a63e]">All clear!</p>
                  </div>
                )}
              </Card>

              {/* Journalist Relations Preview */}
              <Card variant="default" padding="lg">
                <CardHeader title="Key Journalists" subtitle="Your media relationships" />
                {mediaState.journalistRelations.length > 0 ? (
                  <div className="space-y-[8px]">
                    {mediaState.journalistRelations.slice(0, 5).map((j) => (
                      <div key={j.id} className="flex items-center justify-between p-[8px] bg-background rounded">
                        <div>
                          <p className="text-[14px] font-medium">{j.name}</p>
                          <p className="text-[12px] text-[#6b7280]">{j.outlet}</p>
                        </div>
                        <div className={`text-[14px] font-medium ${j.relationship >= 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}`}>
                          {j.relationship >= 0 ? '+' : ''}{j.relationship}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[14px] text-[#6b7280] text-center py-4">No journalist relationships yet</p>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 3: SOCIAL MEDIA */}
        {/* ============================================ */}
        <TabsContent value="social">
          <div className="grid grid-cols-3 gap-[24px]">
            <div className="col-span-2 space-y-[24px]">
              {/* Suggested Posts (Activity-Linked & Career Moments) */}
              {suggestedAvailableTypes.length > 0 && (
                <Card variant="glass" padding="lg">
                  <CardHeader 
                    title="Suggested Posts" 
                    subtitle="Based on recent activities, sponsors, and career stage"
                  />
                  <div className="grid grid-cols-2 gap-[12px]">
                    {suggestedAvailableTypes.map((postType) => {
                      const suggestion = suggestedPostTypes.find(s => s.type === postType.type)
                      return (
                        <button
                          key={postType.type}
                          onClick={() => handleOpenSocialPostModal(postType.type)}
                          className="p-[16px] bg-black/5 hover:bg-black/10 rounded-[12px] text-left transition-all border-[0.8px] border-black/10 hover:border-black/20 relative overflow-hidden"
                        >
                          <div className="flex items-start gap-[12px]">
                            <span className="text-[24px] flex-shrink-0">{postType.icon}</span>
                            <div className="min-w-0">
                              <span className="text-[14px] font-medium block">{postType.name}</span>
                              <span className="text-[12px] text-[#6b7280] block mt-0.5">{postType.description}</span>
                              {suggestion?.reason && (
                                <span className="text-[10px] text-[#ef4444] mt-1 block truncate">
                                  Reason: {suggestion.reason}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="absolute top-1.5 right-1.5">
                            <span className="text-[9px] bg-[#ef4444]/20 text-[#ef4444] px-1.5 py-0.5 rounded-full font-medium">
                              {postType.category === 'Activity Recap' ? 'Activity' : 'Suggested'}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Post Composer - AI Generated */}
              <Card variant="glass" padding="lg">
                <CardHeader 
                  title="Create Post" 
                  subtitle="AI will generate post options based on context"
                />
                <div className="grid grid-cols-4 gap-[12px]">
                  {regularAvailableTypes.map((postType) => (
                    <button
                      key={postType.type}
                      onClick={() => handleOpenSocialPostModal(postType.type)}
                      className="p-[16px] bg-[#f9fafb] hover:bg-[#f3f4f6] rounded-[12px] text-center transition-all border-[0.8px] border-transparent hover:border-black/10"
                    >
                      <span className="text-[24px] block mb-[8px]">{postType.icon}</span>
                      <span className="text-[14px] font-medium">{postType.name}</span>
                      <span className="text-[12px] text-[#6b7280] block mt-1">{postType.description}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Post History */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Recent Posts" subtitle="Your social media activity" />
                <div className="space-y-[16px]">
                  {mediaState.teamSocial.postHistory.length > 0 ? (
                    mediaState.teamSocial.postHistory.slice(0, 10).map((post) => (
                      <div key={post.id} className="p-4 bg-[#f9fafb] rounded-[8px]">
                        {post.imageDataUrl && (
                          <img 
                            src={post.imageDataUrl} 
                            alt="Post image" 
                            className="w-full aspect-video object-cover rounded-[8px] mb-[12px]"
                          />
                        )}
                        <div className="flex items-start justify-between gap-[16px] mb-[12px]">
                          <div className="flex-1">
                            <p className="text-[14px]">{post.content}</p>
                            <p className="text-[12px] text-[#6b7280] mt-[8px]">
                              Week {post.week}, Year {post.year} • <span className="capitalize">{post.tone}</span>
                            </p>
                          </div>
                          <div className="flex gap-[8px]">
                            {post.wentViral && <Badge variant="gold" size="sm">🔥 Viral</Badge>}
                            {post.hadBacklash && <Badge variant="red" size="sm">⚠️ Backlash</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-[24px] text-[14px] text-[#6b7280]">
                          <span className="flex items-center gap-[4px]">
                            <Heart className="w-4 h-4" />
                            {post.engagement.likes.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-[4px]">
                            <Share2 className="w-4 h-4" />
                            {post.engagement.shares.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-[4px]">
                            <MessageCircle className="w-4 h-4" />
                            {post.engagement.comments.toLocaleString()}
                          </span>
                          {post.followerGain != null && post.followerGain !== 0 && (
                            <span className={`flex items-center gap-[4px] ${post.followerGain > 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}`}>
                              {post.followerGain > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              {post.followerGain > 0 ? '+' : ''}{post.followerGain.toLocaleString()} followers
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-[#6b7280]">
                      <MessageSquare className="w-12 h-12 mx-auto mb-[12px] opacity-50" />
                      <p>No posts yet. Start engaging with your fans!</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-[24px]">
              {/* Account Stats */}
              <Card variant="default" padding="lg">
                <CardHeader title={`@${team.name.replace(/\s+/g, '')}`} subtitle="Team Account" />
                <div className="space-y-[16px]">
                  <div className="text-center p-[16px] bg-background rounded-[8px]">
                    <div className="flex items-center justify-center gap-[8px] mb-[4px]">
                      <Globe className="w-4 h-4 text-[#f59e0b]" />
                      <span className="text-[12px] text-[#6b7280] uppercase tracking-wide">Public Followers</span>
                    </div>
                    <p className="text-[30px] font-bold text-[#f59e0b]">
                      {formatFollowers(mediaState.teamSocial.followers)}
                    </p>
                    <p className="text-[12px] text-[#6b7280] mt-1">Anyone can follow • See public posts</p>
                    {mediaState.teamSocial.verified && (
                      <Badge variant="blue" size="sm" className="mt-2">✓ Verified</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-[12px]">
                    <div className="p-3 bg-background rounded-[8px] text-center">
                      <p className="text-[18px] font-semibold">{mediaState.teamSocial.totalPosts}</p>
                      <p className="text-[12px] text-[#6b7280]">Posts</p>
                    </div>
                    <div className="p-3 bg-background rounded-[8px] text-center">
                      <p className="text-[18px] font-semibold">{mediaState.teamSocial.engagementRate.toFixed(1)}%</p>
                      <p className="text-[12px] text-[#6b7280]">Engagement</p>
                    </div>
                  </div>
                  
                  {/* Info box */}
                  <div className="p-3 bg-[#f59e0b]/10 border-[0.8px] border-[#f59e0b]/20 rounded-[8px]">
                    <p className="text-[12px] text-[#6b7280] leading-relaxed">
                      <strong className="text-[#f59e0b]">Followers</strong> are your public audience on social media. Regular posting builds your following. High engagement can convert some followers to <strong className="text-[#a855f7]">Fan Club Members</strong>.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Trending Topics */}
              <Card variant="default" padding="lg">
                <CardHeader title="Trending" subtitle="Popular in motorsport" />
                <div className="flex flex-wrap gap-[8px]">
                  {['#Racing', '#Motorsport', '#TeamUpdate', '#RaceDay', '#Development', '#Fans'].map(tag => (
                    <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                  ))}
                </div>
              </Card>

              {/* Social Media Milestones */}
              <Card variant="default" padding="lg">
                <CardHeader title="Milestones" />
                <div className="space-y-[8px] max-h-80 overflow-y-auto">
                  {/* Follower Milestones */}
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">1K Followers</span>
                    {mediaState.teamSocial.followers >= 1000 ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">{formatFollowers(1000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">5K Followers</span>
                    {mediaState.teamSocial.followers >= 5000 ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">{formatFollowers(5000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">10K Followers</span>
                    {mediaState.teamSocial.followers >= 10000 ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">{formatFollowers(10000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">25K Followers</span>
                    {mediaState.teamSocial.followers >= 25000 ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">{formatFollowers(25000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">50K Followers</span>
                    {mediaState.teamSocial.followers >= 50000 ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">{formatFollowers(50000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">100K Followers</span>
                    {mediaState.teamSocial.followers >= 100000 ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">{formatFollowers(100000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">500K Followers</span>
                    {mediaState.teamSocial.followers >= 500000 ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">{formatFollowers(500000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">1M Followers</span>
                    {mediaState.teamSocial.followers >= 1000000 ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">{formatFollowers(1000000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  
                  {/* Engagement Milestones */}
                  <div className="border-t border-black/10 my-2 pt-2">
                    <p className="text-[12px] text-[#6b7280] mb-[8px]">Engagement</p>
                  </div>
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">First Viral Post</span>
                    {mediaState.teamSocial.viralPosts > 0 ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">Locked</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">5 Viral Posts</span>
                    {mediaState.teamSocial.viralPosts >= 5 ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">{5 - mediaState.teamSocial.viralPosts} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">10 Viral Posts</span>
                    {mediaState.teamSocial.viralPosts >= 10 ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">{10 - mediaState.teamSocial.viralPosts} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">50 Posts</span>
                    {mediaState.teamSocial.totalPosts >= 50 ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">{50 - mediaState.teamSocial.totalPosts} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">100 Posts</span>
                    {mediaState.teamSocial.totalPosts >= 100 ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">{100 - mediaState.teamSocial.totalPosts} to go</span>
                    )}
                  </div>
                  
                  {/* Account Status */}
                  <div className="border-t border-black/10 my-2 pt-2">
                    <p className="text-[12px] text-[#6b7280] mb-[8px]">Account Status</p>
                  </div>
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">Verified Account</span>
                    {mediaState.teamSocial.verified ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">50K followers</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">5% Engagement Rate</span>
                    {mediaState.teamSocial.engagementRate >= 5 ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">{(5 - mediaState.teamSocial.engagementRate).toFixed(1)}% to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-[8px] bg-background rounded">
                    <span className="text-[14px]">10% Engagement Rate</span>
                    {mediaState.teamSocial.engagementRate >= 10 ? (
                      <CheckCircle className="w-5 h-5 text-[#00a63e]" />
                    ) : (
                      <span className="text-[12px] text-[#6b7280]">{(10 - mediaState.teamSocial.engagementRate).toFixed(1)}% to go</span>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 4: HEADLINES */}
        {/* ============================================ */}
        <TabsContent value="headlines">
          <div className="grid grid-cols-3 gap-[24px]">
            <div className="col-span-2">
              <Card variant="glass" padding="lg">
                <CardHeader title="Press Coverage" subtitle="All headlines about your team" />
                <div className="space-y-[12px]">
                  {mediaState.teamHeadlines.length > 0 ? (
                    mediaState.teamHeadlines.map((headline) => (
                      <div 
                        key={headline.id} 
                        className="p-4 bg-[#f9fafb] rounded-[8px] border-[0.8px] border-black/10 hover:border-black/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-[16px]">
                          <div className="flex-1">
                            <p className={`font-medium ${getHeadlineSentimentColor(headline.sentiment)}`}>
                              {headline.headline}
                            </p>
                            <div className="flex items-center gap-[12px] mt-[8px] text-[12px] text-[#6b7280]">
                              <span>{headline.outlet}</span>
                              <span>•</span>
                              <span className="capitalize">{headline.topic}</span>
                              <span>•</span>
                              <span>Week {headline.week}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-[8px]">
                            <Badge variant={headline.sentiment === 'positive' ? 'green' : headline.sentiment === 'negative' ? 'red' : 'default'} size="sm">
                              {headline.sentiment}
                            </Badge>
                            <Badge variant="default" size="sm" className="capitalize">
                              {headline.outletTier}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-[#6b7280]">
                      <Newspaper className="w-16 h-16 mx-auto mb-[16px] opacity-50" />
                      <p>No press coverage yet</p>
                      <p className="text-[14px] mt-[8px]">Race results and team activities generate headlines</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-[24px]">
              {/* Coverage Summary */}
              <Card variant="default" padding="lg">
                <CardHeader title="Coverage Summary" />
                <div className="space-y-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#6b7280]">Total Headlines</span>
                    <span className="font-semibold">{mediaState.teamHeadlines.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#6b7280]">Positive</span>
                    <span className="font-semibold text-[#00a63e]">
                      {mediaState.teamHeadlines.filter(h => h.sentiment === 'positive').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#6b7280]">Negative</span>
                    <span className="font-semibold text-[#ef4444]">
                      {mediaState.teamHeadlines.filter(h => h.sentiment === 'negative').length}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Journalist Relations */}
              <Card variant="default" padding="lg">
                <CardHeader title="Journalist Relations" subtitle="Build media connections" />
                {mediaState.journalistRelations.length > 0 ? (
                  <div className="space-y-[12px]">
                    {mediaState.journalistRelations.map((journalist) => (
                      <div key={journalist.id} className="p-3 bg-background rounded-[8px]">
                        <div className="flex items-center justify-between mb-[4px]">
                          <span className="font-medium text-[14px]">{journalist.name}</span>
                          <span className={`text-[14px] ${journalist.relationship >= 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}`}>
                            {journalist.relationship >= 0 ? '+' : ''}{journalist.relationship}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#6b7280]">{journalist.outlet} • {journalist.specialty}</p>
                        {journalist.isHostile && (
                          <Badge variant="red" size="sm" className="mt-2">Hostile</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[14px] text-[#6b7280] text-center py-4">
                    Journalists will appear as you interact with media
                  </p>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 5: DRIVER MEDIA */}
        {/* ============================================ */}
        <TabsContent value="drivers">
          <div className="grid grid-cols-3 gap-[24px]">
            <div className="col-span-2 space-y-[24px]">
              {/* Driver Profiles */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Driver Media Profiles" subtitle="Manage your drivers' public image" />
                {mediaState.driverMediaProfiles.length > 0 ? (
                  <div className="space-y-[16px]">
                    {mediaState.driverMediaProfiles.map((profile) => (
                      <div key={profile.driverId} className="p-4 bg-[#f9fafb] rounded-[8px]">
                        <div className="flex items-center justify-between mb-[16px]">
                          <div>
                            <h4 className="font-semibold">{profile.driverName}</h4>
                            <p className="text-[14px] text-[#6b7280] capitalize">{profile.mediaPersonality.replace('_', ' ')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[14px] text-[#6b7280]">Followers</p>
                            <p className="font-semibold">{formatFollowers(profile.socialFollowers)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-[16px]">
                          <div>
                            <p className="text-[12px] text-[#6b7280] mb-[4px]">Marketability</p>
                            <div className="h-2 bg-[#f9fafb] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#f59e0b]"
                                style={{ width: `${profile.marketability}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-[12px] text-[#6b7280] mb-[4px]">Media Training</p>
                            <div className="flex gap-[4px]">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div 
                                  key={level}
                                  className={`w-4 h-4 rounded-[4px] ${level <= profile.mediaTrainingLevel ? 'bg-[#00a63e]' : 'bg-[#f9fafb]'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[12px] text-[#6b7280] mb-[4px]">Controversy Risk</p>
                            <Badge variant={profile.controversyRisk > 60 ? 'red' : profile.controversyRisk > 30 ? 'orange' : 'green'} size="sm">
                              {profile.controversyRisk}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#6b7280]">
                    <UserCheck className="w-12 h-12 mx-auto mb-[12px] opacity-50" />
                    <p>No drivers on roster yet</p>
                  </div>
                )}
              </Card>

              {/* Interview Requests */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Interview Requests" subtitle="Pending media opportunities" />
                {mediaState.pendingInterviewRequests.length > 0 ? (
                  <div className="space-y-[12px]">
                    {mediaState.pendingInterviewRequests.map((request) => (
                      <div key={request.id} className="p-4 bg-[#f9fafb] rounded-[8px] border-[0.8px] border-black/10">
                        <div className="flex items-start justify-between gap-[16px] mb-[12px]">
                          <div>
                            <h4 className="font-semibold">{request.outlet}</h4>
                            <p className="text-[14px] text-[#6b7280]">
                              For: {request.driverName} • Topic: <span className="capitalize">{request.topic}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[18px] font-semibold text-[#00a63e]">${request.payment.toLocaleString()}</p>
                            <Badge variant={request.riskLevel === 'very_high' ? 'red' : request.riskLevel === 'high' ? 'orange' : 'default'} size="sm">
                              {request.riskLevel.replace('_', ' ')} risk
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-[8px]">
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => {
                              const { handleInterviewRequest } = useCareerStore.getState()
                              handleInterviewRequest(request.id, true)
                              addToast({ type: 'success', title: 'Interview approved', message: `${request.driverName} will attend`, duration: 3000 })
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-[4px]" />
                            Approve
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              const { handleInterviewRequest } = useCareerStore.getState()
                              handleInterviewRequest(request.id, false)
                              addToast({ type: 'info', title: 'Interview declined', duration: 3000 })
                            }}
                          >
                            <X className="w-4 h-4 mr-[4px]" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#6b7280]">
                    <Mic className="w-12 h-12 mx-auto mb-[12px] opacity-50" />
                    <p>No pending interview requests</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-[24px]">
              <Card variant="default" padding="lg">
                <CardHeader title="Media Training" subtitle="Invest in your drivers" />
                <p className="text-[14px] text-[#6b7280] mb-[16px]">
                  Better trained drivers handle interviews better and cause fewer controversies.
                </p>
                <Button variant="secondary" className="w-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade Training
                </Button>
              </Card>

              <Card variant="default" padding="lg">
                <CardHeader title="Interview Stats" />
                <div className="space-y-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[14px] text-[#6b7280]">Total Completed</span>
                    <span className="font-semibold">{mediaState.completedInterviews.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[14px] text-[#6b7280]">Total Earnings</span>
                    <span className="font-semibold text-[#00a63e]">
                      ${mediaState.completedInterviews.reduce((sum, i) => sum + i.payment, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 6: FAN ZONE */}
        {/* ============================================ */}
        <TabsContent value="fans">
          <div className="grid grid-cols-3 gap-[24px]">
            <div className="col-span-2 space-y-[24px]">
              {/* Fan Sentiment Chart */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Fan Sentiment" subtitle="How your fans feel about the team" />
                <div className="flex items-center gap-8 mb-[24px]">
                  <div className="text-center">
                    <p className={`text-[48px] font-bold ${getSentimentColor(mediaState.fanSentiment)}`}>
                      {mediaState.fanSentiment}
                    </p>
                    <p className="text-[14px] text-[#6b7280] mt-1">Current Sentiment</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-[#f9fafb] rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          mediaState.fanSentiment >= 70 ? 'bg-[#00a63e]' :
                          mediaState.fanSentiment >= 40 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
                        }`}
                        style={{ width: `${mediaState.fanSentiment}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[12px] text-[#6b7280] mt-1">
                      <span>Angry</span>
                      <span>Neutral</span>
                      <span>Ecstatic</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    {getTrendIcon(mediaState.fanSentimentTrend)}
                    <span className="text-[14px] capitalize">{mediaState.fanSentimentTrend}</span>
                  </div>
                </div>

                {/* Sentiment History */}
                {mediaState.fanSentimentHistory.length > 0 && (
                  <div className="space-y-[8px]">
                    <p className="text-[14px] font-medium">Recent Changes</p>
                    {mediaState.fanSentimentHistory.slice(-5).reverse().map((entry, i) => (
                      <div key={i} className="flex items-center justify-between text-[14px] p-[8px] bg-[#f9fafb] rounded">
                        <span className="text-[#6b7280]">Week {entry.week}</span>
                        <span>{entry.reason || 'General'}</span>
                        <span className={entry.value >= 50 ? 'text-[#00a63e]' : 'text-[#ef4444]'}>
                          {entry.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Fan Events */}
              <Card variant="glass" padding="lg">
                <CardHeader 
                  title="Fan Events" 
                  subtitle="Connect with your supporters"
                  action={
                    <Button variant="primary" size="sm" onClick={handleOpenEventModal}>
                      <Plus className="w-4 h-4 mr-[4px]" />
                      Schedule Event
                    </Button>
                  }
                />
                {mediaState.fanEvents.length > 0 ? (
                  <div className="space-y-[12px]">
                    {mediaState.fanEvents.map((event) => (
                      <div key={event.id} className="p-4 bg-[#f9fafb] rounded-[8px]">
                        <div className="flex items-center justify-between mb-[8px]">
                          <h4 className="font-semibold">{event.name}</h4>
                          <Badge variant={event.completed ? 'green' : 'default'}>
                            {event.completed ? 'Completed' : `Week ${event.scheduledWeek}`}
                          </Badge>
                        </div>
                        <p className="text-[14px] text-[#6b7280]">{event.description}</p>
                        <div className="flex items-center gap-[16px] mt-[12px] text-[14px]">
                          <span className="text-[#6b7280]">Cost: ${event.cost.toLocaleString()}</span>
                          <span className="text-[#00a63e]">+{event.effects.fanSentiment} sentiment</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#6b7280]">
                    <PartyPopper className="w-12 h-12 mx-auto mb-[12px] opacity-50" />
                    <p>No fan events scheduled</p>
                    <p className="text-[14px] mt-[8px]">Fan events boost sentiment and engagement</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-[24px]">
              {/* Fan Club */}
              <Card variant="default" padding="lg">
                <CardHeader title="Fan Club" subtitle={mediaState.fanClub.tier} />
                <div className="space-y-[16px]">
                  <div className="text-center p-[16px] bg-background rounded-[8px]">
                    <div className="flex items-center justify-center gap-[8px] mb-[4px]">
                      <Crown className="w-4 h-4 text-[#a855f7]" />
                      <span className="text-[12px] text-[#6b7280] uppercase tracking-wide">Exclusive Members</span>
                    </div>
                    <p className="text-[30px] font-bold text-[#a855f7]">
                      {formatFollowers(mediaState.fanClub.members)}
                    </p>
                    <p className="text-[12px] text-[#6b7280] mt-1">Registered fans • Get exclusive content</p>
                  </div>
                  
                  {/* Info box explaining Fan Club vs Followers */}
                  <div className="p-3 bg-purple-500/10 border-[0.8px] border-purple-500/20 rounded-[8px]">
                    <p className="text-[12px] text-[#6b7280] leading-relaxed">
                      <strong className="text-[#a855f7]">Fan Club Members</strong> are dedicated supporters who registered for exclusive content. Unlike social media <strong className="text-[#f59e0b]">Followers</strong>, members get behind-the-scenes access and drive merchandise sales.
                    </p>
                  </div>
                  <div className="space-y-[8px]">
                    <div className="flex justify-between text-[14px]">
                      <span className="text-[#6b7280]">Satisfaction</span>
                      <span>{mediaState.fanClub.memberSatisfaction}%</span>
                    </div>
                    <div className="flex justify-between text-[14px]">
                      <span className="text-[#6b7280]">Weekly Growth</span>
                      <span className={mediaState.fanClub.weeklyGrowth >= 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}>
                        {mediaState.fanClub.weeklyGrowth >= 0 ? '+' : ''}{mediaState.fanClub.weeklyGrowth}
                      </span>
                    </div>
                    <div className="flex justify-between text-[14px]">
                      <span className="text-[#6b7280]">Exclusive Content</span>
                      <span>{mediaState.fanClub.exclusiveContentReleased}</span>
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={handleOpenExclusiveContentModal}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Exclusive Content
                  </Button>
                </div>
              </Card>

              {/* Merchandise */}
              <Card variant="default" padding="lg">
                <CardHeader title="Merchandise" />
                <div className="space-y-[12px]">
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#6b7280]">Total Sales</span>
                    <span className="font-semibold">${mediaState.merchandise.totalSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#6b7280]">This Week</span>
                    <span className="font-semibold">${mediaState.merchandise.weeklySales.toLocaleString()}</span>
                  </div>
                  {mediaState.merchandise.popularItems.length > 0 && (
                    <div>
                      <p className="text-[12px] text-[#6b7280] mb-[8px]">Popular Items</p>
                      <div className="flex flex-wrap gap-[4px]">
                        {mediaState.merchandise.popularItems.map((item, i) => (
                          <Badge key={i} variant="default" size="sm">{item}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ============================================ */}
      {/* SOCIAL POST MODAL (AI-Generated Options) */}
      {/* ============================================ */}
      <Modal
        isOpen={showSocialModal}
        onClose={() => {
          setShowSocialModal(false)
          setSelectedSocialPostType(null)
          setSocialPostOptions([])
          setSelectedSocialOptionId(null)
          setGeneratedPostImage(null)
          setIsGeneratingImage(false)
          setImageError(false)
        }}
        title="Create Social Media Post"
        size="lg"
      >
        <div className="space-y-[24px]">
          {/* Post Type Selection */}
          {!selectedSocialPostType ? (
            <>
              <p className="text-[#6b7280] text-[14px]">Select what you want to post about. AI will generate options based on your team's current situation.</p>
              
              {/* Suggested Posts in Modal */}
              {suggestedAvailableTypes.length > 0 && (
                <div className="space-y-[8px]">
                  <p className="text-[12px] font-medium text-[#ef4444] uppercase tracking-wider">Suggested for You</p>
                  <div className="grid grid-cols-2 gap-[8px]">
                    {suggestedAvailableTypes.map((postType) => {
                      const suggestion = suggestedPostTypes.find(s => s.type === postType.type)
                      return (
                        <button
                          key={postType.type}
                          onClick={() => handleOpenSocialPostModal(postType.type)}
                          className="p-[12px] bg-black/5 hover:bg-black/10 rounded-[8px] text-left transition-all border-[0.8px] border-black/10 hover:border-black/20"
                        >
                          <div className="flex items-center gap-[8px]">
                            <span className="text-[18px]">{postType.icon}</span>
                            <div className="min-w-0">
                              <span className="text-[14px] font-medium block">{postType.name}</span>
                              {suggestion?.reason && (
                                <span className="text-[10px] text-[#ef4444] block truncate">Reason: {suggestion.reason}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <div className="border-t border-black/10 my-3" />
                </div>
              )}
              
              <div className="grid grid-cols-4 gap-[12px]">
                {regularAvailableTypes.map((postType) => (
                  <button
                    key={postType.type}
                    onClick={() => handleOpenSocialPostModal(postType.type)}
                    className="p-[16px] bg-white hover:bg-[#f9fafb] rounded-[12px] text-center transition-all border-[0.8px] border-black/10"
                  >
                    <span className="text-[24px] block mb-[8px]">{postType.icon}</span>
                    <span className="text-[14px] font-medium block">{postType.name}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Selected Type Header */}
              <div className="flex items-center gap-[12px] p-[12px] bg-[#f9fafb] rounded-[8px]">
                <span className="text-[30px]">{SOCIAL_POST_TYPES.find(t => t.type === selectedSocialPostType)?.icon}</span>
                <div>
                  <h4 className="font-semibold">{SOCIAL_POST_TYPES.find(t => t.type === selectedSocialPostType)?.name}</h4>
                  <p className="text-[14px] text-[#6b7280]">{SOCIAL_POST_TYPES.find(t => t.type === selectedSocialPostType)?.description}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto" 
                  onClick={() => {
                    setSelectedSocialPostType(null)
                    setSocialPostOptions([])
                    setSelectedSocialOptionId(null)
                    setGeneratedPostImage(null)
                    setIsGeneratingImage(false)
                    setImageError(false)
                  }}
                >
                  Change
                </Button>
              </div>

              {/* Generated Image */}
              <div className="relative rounded-[12px] overflow-hidden bg-white border-[0.8px] border-black/10">
                {isGeneratingImage ? (
                  <div className="aspect-video flex flex-col items-center justify-center gap-[12px] bg-[#f9fafb] animate-pulse">
                    <Loader2 className="w-8 h-8 animate-spin text-[#ef4444]" />
                    <span className="text-[14px] text-[#6b7280]">Generating image with AI...</span>
                  </div>
                ) : generatedPostImage ? (
                  <div className="relative">
                    <img 
                      src={generatedPostImage} 
                      alt="Generated post image" 
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-[8px]">
                      {imageError && (
                        <Badge variant="default" size="sm" className="bg-white/80 backdrop-blur-sm text-[#6b7280] text-[10px]">Stock image</Badge>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (selectedSocialPostType) handleGeneratePostImage(selectedSocialPostType)
                        }}
                        className="p-1.5 bg-white/80 backdrop-blur-sm rounded-[8px] hover:bg-white transition-colors"
                        title="Regenerate image"
                      >
                        <RefreshCw className="w-4 h-4 text-[#4a5565]" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-[#f9fafb]">
                    <Camera className="w-8 h-8 text-[#6b7280]" />
                  </div>
                )}
              </div>

              {/* Loading State */}
              {loadingSocialPosts && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-[#ef4444]" />
                  <span className="ml-3 text-[#6b7280]">Generating post options...</span>
                </div>
              )}

              {/* AI-Generated Options */}
              {!loadingSocialPosts && socialPostOptions.length > 0 && (
                <div className="space-y-[12px]">
                  <p className="text-[14px] text-[#6b7280]">Select an AI-generated option to post:</p>
                  {socialPostOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => setSelectedSocialOptionId(option.id)}
                      className={`p-[16px] rounded-[12px] border-[0.8px] cursor-pointer transition-all ${
                        selectedSocialOptionId === option.id 
                          ? 'border-black bg-black/5' 
                          : 'border-black/10 bg-white hover:bg-[#f9fafb]'
                      }`}
                    >
                      <p className="text-[14px] mb-[12px]">{option.content}</p>
                      <div className="flex flex-wrap gap-[8px] mb-[12px]">
                        {option.hashtags.map((tag, i) => (
                          <span key={i} className="text-[12px] text-[#ef4444]">{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[12px] text-[#6b7280]">
                        <div className="flex items-center gap-[16px]">
                          <span className="capitalize">{option.tone}</span>
                          <span>{option.includesMedia !== 'none' ? `+${option.includesMedia}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-[12px]">
                          <span className={option.effects.viralChance > 15 ? 'text-[#00a63e]' : ''}>
                            Viral: {option.effects.viralChance}%
                          </span>
                          <span className={option.effects.backlashRisk > 15 ? 'text-[#ef4444]' : ''}>
                            Risk: {option.effects.backlashRisk}%
                          </span>
                        </div>
                      </div>
                      {selectedSocialOptionId === option.id && (
                        <div className="mt-3 pt-3 border-t border-black/10">
                          <p className="text-[12px] text-[#6b7280] mb-[8px]">Expected Effects:</p>
                          <div className="grid grid-cols-4 gap-[8px] text-[12px]">
                            <div>
                              <p className="text-[#6b7280]">Followers</p>
                              <p className={option.effects.followerGain > 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}>
                                +{option.effects.followerGain}
                              </p>
                            </div>
                            <div>
                              <p className="text-[#6b7280]">Fan Sentiment</p>
                              <p className={option.effects.fanSentiment >= 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}>
                                {option.effects.fanSentiment >= 0 ? '+' : ''}{option.effects.fanSentiment}
                              </p>
                            </div>
                            <div>
                              <p className="text-[#6b7280]">Sponsors</p>
                              <p className={option.effects.sponsorSatisfaction >= 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}>
                                {option.effects.sponsorSatisfaction >= 0 ? '+' : ''}{option.effects.sponsorSatisfaction}
                              </p>
                            </div>
                            <div>
                              <p className="text-[#6b7280]">Engagement</p>
                              <p className="text-[#f59e0b]">+{option.effects.engagementBoost}%</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Regenerate / Submit */}
              {!loadingSocialPosts && socialPostOptions.length > 0 && (
                <div className="flex gap-[12px]">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleOpenSocialPostModal(selectedSocialPostType)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button 
                    variant="primary" 
                    className="flex-1"
                    disabled={!selectedSocialOptionId || isGeneratingImage}
                    onClick={handlePublishSocialPost}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isGeneratingImage ? 'Generating Image...' : 'Publish Post'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* ============================================ */}
      {/* PRESS RELEASE MODAL (AI-Generated Options) */}
      {/* ============================================ */}
      <Modal
        isOpen={showPressReleaseModal}
        onClose={() => {
          setShowPressReleaseModal(false)
          setSelectedPressReleaseType(null)
          setPressReleaseOptions([])
          setSelectedPressReleaseId(null)
          setPressReleaseImage(null)
          setPrImageIsStock(false)
        }}
        title="Issue Press Release"
        size="xl"
      >
        <div className="space-y-[24px]">
          {/* Release Type Selection */}
          {!selectedPressReleaseType ? (
            <>
              <p className="text-[#6b7280] text-[14px]">Select the type of press release. AI will draft options based on your team's current situation.</p>
              <div className="grid grid-cols-4 gap-[12px]">
                {availablePressReleaseTypes.map((releaseType) => (
                  <button
                    key={releaseType.type}
                    onClick={() => handleOpenPressReleaseModal(releaseType.type)}
                    className="p-[16px] bg-white hover:bg-[#f9fafb] rounded-[12px] text-center transition-all border-[0.8px] border-black/10"
                  >
                    <span className="text-[24px] block mb-[8px]">{releaseType.icon}</span>
                    <span className="text-[14px] font-medium block">{releaseType.name}</span>
                    <span className="text-[12px] text-[#6b7280] block mt-1">{releaseType.description}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Selected Type Header */}
              <div className="flex items-center gap-[12px] p-[12px] bg-[#f9fafb] rounded-[8px]">
                <span className="text-[30px]">{PRESS_RELEASE_TYPES.find(t => t.type === selectedPressReleaseType)?.icon}</span>
                <div>
                  <h4 className="font-semibold">{PRESS_RELEASE_TYPES.find(t => t.type === selectedPressReleaseType)?.name}</h4>
                  <p className="text-[14px] text-[#6b7280]">{PRESS_RELEASE_TYPES.find(t => t.type === selectedPressReleaseType)?.description}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto" 
                  onClick={() => {
                    setSelectedPressReleaseType(null)
                    setPressReleaseOptions([])
                    setSelectedPressReleaseId(null)
                    setPressReleaseImage(null)
                    setPrImageIsStock(false)
                  }}
                >
                  Change
                </Button>
              </div>

              {/* Press Release Image Preview */}
              <div className="space-y-[8px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[8px]">
                    <button
                      onClick={() => {
                        const newEnabled = !pressReleaseImageEnabled
                        setPressReleaseImageEnabled(newEnabled)
                        if (!newEnabled) {
                          setPressReleaseImage(null)
                          setPrImageIsStock(false)
                        } else if (selectedPressReleaseType) {
                          handleGeneratePRImage(selectedPressReleaseType)
                        }
                      }}
                      className={`
                        flex items-center gap-[8px] px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all
                        ${pressReleaseImageEnabled 
                          ? 'bg-[#ef4444]/20 text-[#ef4444] border-[0.8px] border-[#ef4444]/30' 
                          : 'bg-[#f9fafb] text-[#6b7280] border-[0.8px] border-black/10 hover:border-black/20'}
                      `}
                    >
                      {pressReleaseImageEnabled ? (
                        <>
                          <Camera className="w-3.5 h-3.5" />
                          AI Image On
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5" />
                          AI Image Off
                        </>
                      )}
                    </button>
                    {prImageIsStock && pressReleaseImageEnabled && (
                      <Badge variant="default" size="sm">Stock Image</Badge>
                    )}
                  </div>
                </div>
                
                {pressReleaseImageEnabled && (
                  <div className="rounded-[12px] overflow-hidden border-[0.8px] border-black/10 relative group">
                    {isGeneratingPRImage ? (
                      <div className="aspect-video bg-[#f9fafb] flex flex-col items-center justify-center gap-[12px]">
                        <Loader2 className="w-8 h-8 animate-spin text-[#ef4444]" />
                        <span className="text-[12px] text-[#6b7280]">Generating press release image...</span>
                      </div>
                    ) : pressReleaseImage ? (
                      <>
                        <img 
                          src={pressReleaseImage} 
                          alt="Press release" 
                          className="w-full aspect-video object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => selectedPressReleaseType && handleGeneratePRImage(selectedPressReleaseType)}
                            className="px-3 py-1.5 bg-white/90 rounded-[8px] text-[12px] font-medium hover:bg-white transition-colors flex items-center gap-[4px].5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Regenerate Image
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-video bg-[#f9fafb] flex items-center justify-center">
                        <span className="text-[12px] text-[#6b7280]">No image generated</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Loading State */}
              {loadingPressReleases && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#ef4444]" />
                  <span className="ml-3 text-[#6b7280]">Drafting press release options...</span>
                </div>
              )}

              {/* AI-Generated Options */}
              {!loadingPressReleases && pressReleaseOptions.length > 0 && (
                <div className="space-y-[16px]">
                  <p className="text-[14px] text-[#6b7280]">Select a press release draft to publish:</p>
                  {pressReleaseOptions.map((option) => {
                    const isSelected = selectedPressReleaseId === option.id
                    const toneColors: Record<string, string> = {
                      professional: 'bg-blue-500/20 text-blue-400',
                      confident: 'bg-amber-500/20 text-amber-400',
                      humble: 'bg-sky-500/20 text-sky-400',
                      bold: 'bg-orange-500/20 text-orange-400',
                      aggressive: 'bg-red-500/20 text-red-400',
                    }
                    const toneColor = toneColors[option.tone] || 'bg-[#f9fafb] text-[#6b7280]'
                    
                    return (
                      <div
                        key={option.id}
                        onClick={() => setSelectedPressReleaseId(option.id)}
                        className={`p-[16px] rounded-[12px] border-[0.8px] cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-black bg-black/5' 
                            : 'border-black/10 bg-white hover:bg-[#f9fafb]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-[12px] mb-[8px]">
                          <h4 className="font-semibold text-[18px]">{option.headline}</h4>
                          <div className="flex items-center gap-[8px] flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${toneColor}`}>
                              {option.tone}
                            </span>
                            <Badge variant="default" size="sm">{option.formalityLevel}</Badge>
                          </div>
                        </div>
                        <p className="text-[14px] text-[#6b7280] mb-[12px] whitespace-pre-line">{option.content}</p>
                        <div className="p-3 bg-[#f9fafb] rounded-[8px] mb-[12px] italic text-[14px] border-l-2 border-[#ef4444]/30">
                          "{option.quote}"
                        </div>
                        <div className="flex items-center justify-between text-[12px] text-[#6b7280]">
                          <div className="flex items-center gap-[12px]">
                            <span className={option.effects.controversyRisk > 20 ? 'text-[#f59e0b]' : ''}>
                              Risk: {option.effects.controversyRisk}%
                            </span>
                          </div>
                          <div className="flex items-center gap-[8px]">
                            <span>Media +{option.effects.mediaScore}</span>
                            <span className={option.effects.fanSentiment >= 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}>
                              Fans {option.effects.fanSentiment >= 0 ? '+' : ''}{option.effects.fanSentiment}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-black/10">
                            <p className="text-[12px] text-[#6b7280] mb-[8px]">Expected Effects:</p>
                            <div className="grid grid-cols-5 gap-[8px] text-[12px]">
                              <div>
                                <p className="text-[#6b7280]">Media Score</p>
                                <p className="text-[#f59e0b]">+{option.effects.mediaScore}</p>
                              </div>
                              <div>
                                <p className="text-[#6b7280]">Fan Sentiment</p>
                                <p className={option.effects.fanSentiment >= 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}>
                                  {option.effects.fanSentiment >= 0 ? '+' : ''}{option.effects.fanSentiment}
                                </p>
                              </div>
                              <div>
                                <p className="text-[#6b7280]">Sponsors</p>
                                <p className={option.effects.sponsorSatisfaction >= 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}>
                                  {option.effects.sponsorSatisfaction >= 0 ? '+' : ''}{option.effects.sponsorSatisfaction}
                                </p>
                              </div>
                              <div>
                                <p className="text-[#6b7280]">Board Mood</p>
                                <p className={option.effects.boardMood >= 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}>
                                  {option.effects.boardMood >= 0 ? '+' : ''}{option.effects.boardMood}
                                </p>
                              </div>
                              <div>
                                <p className="text-[#6b7280]">Reputation</p>
                                <p className={option.effects.reputation >= 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}>
                                  {option.effects.reputation >= 0 ? '+' : ''}{option.effects.reputation}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Regenerate / Submit */}
              {!loadingPressReleases && pressReleaseOptions.length > 0 && (
                <div className="flex gap-[12px]">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleOpenPressReleaseModal(selectedPressReleaseType)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button 
                    variant="primary" 
                    className="flex-1"
                    disabled={!selectedPressReleaseId}
                    onClick={handlePublishPressRelease}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Publish Press Release
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* ============================================ */}
      {/* FAN EVENT MODAL */}
      {/* ============================================ */}
      <Modal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false)
          setEventOptions([])
          setSelectedEventId(null)
        }}
        title="Schedule Fan Event"
        size="lg"
      >
        <div className="space-y-[24px]">
          <p className="text-[#6b7280] text-[14px]">
            Fan events boost engagement and strengthen sponsor relationships. 
            Choose an event that fits your budget and goals.
          </p>

          {/* Loading State */}
          {loadingEvents ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#ef4444] mb-[12px]" />
              <p className="text-[#6b7280] text-[14px]">Generating AI event options...</p>
            </div>
          ) : (
          /* Event Options */
          <div className="space-y-[16px]">
            {eventOptions.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`p-[16px] rounded-[12px] border-[0.8px] cursor-pointer transition-all ${
                  selectedEventId === event.id 
                    ? 'border-black bg-black/5' 
                    : 'border-black/10 bg-white hover:bg-[#f9fafb]'
                }`}
              >
                <div className="flex items-start justify-between mb-[8px]">
                  <h4 className="font-semibold">{event.name}</h4>
                  <Badge variant={team.budgets.cash >= event.cost ? 'green' : 'red'} size="sm">
                    ${event.cost.toLocaleString()}
                  </Badge>
                </div>
                <p className="text-[14px] text-[#6b7280] mb-[12px]">{event.description}</p>
                
                <div className="grid grid-cols-3 gap-[16px] text-[12px] mb-[12px]">
                  <div>
                    <p className="text-[#6b7280]">Expected Attendance</p>
                    <p className="font-semibold">{event.expectedAttendance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[#6b7280]">Duration</p>
                    <p className="font-semibold">{event.duration}</p>
                  </div>
                  <div>
                    <p className="text-[#6b7280]">Requires Driver</p>
                    <p className="font-semibold">{event.requiresDriver ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {event.risks.length > 0 && (
                  <div className="flex items-center gap-[8px] text-[12px] text-[#f59e0b] mb-[12px]">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Risks: {event.risks.join(', ')}</span>
                  </div>
                )}

                {selectedEventId === event.id && (
                  <div className="pt-3 border-t border-black/10">
                    <p className="text-[12px] text-[#6b7280] mb-[8px]">Expected Effects:</p>
                    <div className="grid grid-cols-5 gap-[8px] text-[12px]">
                      <div>
                        <p className="text-[#6b7280]">Fans</p>
                        <p className="text-[#00a63e]">+{event.effects.fanSentiment}</p>
                      </div>
                      <div>
                        <p className="text-[#6b7280]">Followers</p>
                        <p className="text-[#00a63e]">+{event.effects.followerGain}</p>
                      </div>
                      <div>
                        <p className="text-[#6b7280]">Sponsors</p>
                        <p className="text-[#00a63e]">+{event.effects.sponsorSatisfaction}</p>
                      </div>
                      <div>
                        <p className="text-[#6b7280]">Morale</p>
                        <p className="text-[#00a63e]">+{event.effects.teamMorale}</p>
                      </div>
                      <div>
                        <p className="text-[#6b7280]">Media</p>
                        <p className="text-[#f59e0b]">+{event.effects.mediaScore}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}

          {/* Submit */}
          <div className="flex gap-[12px]">
            <Button variant="ghost" className="flex-1" onClick={() => setShowEventModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              className="flex-1"
              disabled={loadingEvents || !selectedEventId ? true : (team.budgets.cash < (eventOptions.find(e => e.id === selectedEventId)?.cost || 0))}
              onClick={handleScheduleEvent}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Event
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================ */}
      {/* EXCLUSIVE CONTENT MODAL */}
      {/* ============================================ */}
      <Modal
        isOpen={showExclusiveContentModal}
        onClose={() => {
          setShowExclusiveContentModal(false)
          setExclusiveContentOptions([])
          setSelectedExclusiveContentId(null)
        }}
        title="Create Exclusive Fan Club Content"
        size="lg"
      >
        <div className="space-y-[24px]">
          <div className="p-4 bg-[#f9fafb] rounded-[8px]">
            <div className="flex items-center gap-[16px]">
              <div className="w-12 h-12 rounded-[12px] bg-purple-500/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-[#a855f7]" />
              </div>
              <div>
                <p className="font-medium">Fan Club: {formatFollowers(mediaState.fanClub.members)} members</p>
                <p className="text-[14px] text-[#6b7280]">Satisfaction: {mediaState.fanClub.memberSatisfaction}%</p>
              </div>
            </div>
          </div>
          
          <p className="text-[14px] text-[#6b7280]">
            Create exclusive content for your fan club members. Better content increases satisfaction and attracts new members.
          </p>

          {loadingExclusiveContent ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#a855f7] mb-[12px]" />
              <p className="text-[#6b7280] text-[14px]">Generating AI content options...</p>
            </div>
          ) : (
          <div className="grid grid-cols-2 gap-[16px] max-h-96 overflow-y-auto">
            {exclusiveContentOptions.map((content) => (
              <div
                key={content.id}
                onClick={() => setSelectedExclusiveContentId(content.id)}
                className={`p-[16px] rounded-[12px] border-[0.8px] cursor-pointer transition-all ${
                  selectedExclusiveContentId === content.id 
                    ? 'border-[#a855f7] bg-[#faf5ff]' 
                    : 'border-black/10 bg-white hover:bg-[#f9fafb]'
                }`}
              >
                <div className="flex items-center gap-[8px] mb-[8px]">
                  <span className="text-[24px]">{content.icon}</span>
                  <h4 className="font-semibold text-[14px]">{content.title}</h4>
                </div>
                <p className="text-[12px] text-[#6b7280] mb-[12px] line-clamp-2">{content.previewText}</p>
                <div className="flex items-center justify-between">
                  <Badge variant={team.budgets.cash >= content.productionCost ? 'green' : 'red'} size="sm">
                    ${content.productionCost.toLocaleString()}
                  </Badge>
                  <span className="text-[12px] text-[#00a63e]">+{content.effects.memberSatisfaction}% sat</span>
                </div>
                
                {selectedExclusiveContentId === content.id && (
                  <div className="mt-3 pt-3 border-t border-black/10">
                    <div className="grid grid-cols-2 gap-[8px] text-[12px]">
                      <div>
                        <p className="text-[#6b7280]">Satisfaction</p>
                        <p className="text-[#00a63e]">+{content.effects.memberSatisfaction}%</p>
                      </div>
                      <div>
                        <p className="text-[#6b7280]">Member Growth</p>
                        <p className="text-[#00a63e]">+{content.effects.memberGrowth}%</p>
                      </div>
                      <div>
                        <p className="text-[#6b7280]">New Followers</p>
                        <p className="text-[#00a63e]">+{content.effects.followerConversion}%</p>
                      </div>
                      <div>
                        <p className="text-[#6b7280]">Engagement</p>
                        <p className="text-[#f59e0b]">+{content.effects.engagementBoost}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}

          <div className="flex gap-[12px]">
            <Button variant="ghost" className="flex-1" onClick={() => setShowExclusiveContentModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              className="flex-1"
              disabled={loadingExclusiveContent || !selectedExclusiveContentId ? true : (team.budgets.cash < (exclusiveContentOptions.find(e => e.id === selectedExclusiveContentId)?.productionCost || 0))}
              onClick={handleReleaseExclusiveContent}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Produce & Release
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================ */}
      {/* PRESS CONFERENCE MODAL */}
      {/* ============================================ */}
      <Modal
        isOpen={showPressConferenceModal}
        onClose={() => {
          if (!conferenceInProgress) {
            setShowPressConferenceModal(false)
            setPressConferenceOptions([])
            setSelectedPressConferenceId(null)
            setConferenceResults(null)
          }
        }}
        title={conferenceInProgress ? 'Press Conference in Progress' : 'Schedule Press Conference'}
        size="lg"
      >
        <div className="space-y-[24px]">
          {!conferenceInProgress ? (
            <>
              <p className="text-[14px] text-[#6b7280]">
                Host a press conference to boost your media presence. Choose the format based on your risk tolerance.
              </p>

              <div className="space-y-[16px]">
                {pressConferenceOptions.map((conf) => (
                  <div
                    key={conf.id}
                    onClick={() => setSelectedPressConferenceId(conf.id)}
                    className={`p-[16px] rounded-[12px] border-[0.8px] cursor-pointer transition-all ${
                      selectedPressConferenceId === conf.id 
                        ? 'border-black bg-black/5' 
                        : 'border-black/10 bg-white hover:bg-[#f9fafb]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-[8px]">
                      <div>
                        <h4 className="font-semibold">{conf.name}</h4>
                        <p className="text-[12px] text-[#6b7280]">{conf.duration} • {conf.questions.length} questions</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={conf.difficulty === 'easy' ? 'green' : conf.difficulty === 'hard' ? 'red' : 'default'} size="sm">
                          {conf.difficulty}
                        </Badge>
                        <p className="text-[12px] text-[#6b7280] mt-1">${conf.cost.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-[14px] text-[#6b7280]">{conf.description}</p>
                    
                    {selectedPressConferenceId === conf.id && (
                      <div className="mt-3 pt-3 border-t border-black/10">
                        <p className="text-[12px] text-[#6b7280] mb-[8px]">Base Media Score: +{conf.baseMediaScore}</p>
                        <p className="text-[12px] text-[#6b7280]">Your answers will determine additional bonuses or penalties.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-[12px]">
                <Button variant="ghost" className="flex-1" onClick={() => setShowPressConferenceModal(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1"
                  disabled={!selectedPressConferenceId || loadingConference}
                  onClick={handleStartPressConference}
                >
                  {loadingConference ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mic className="w-4 h-4 mr-2" />
                  )}
                  {loadingConference ? 'Preparing...' : 'Start Conference'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Conference in progress */}
              {loadingAnswers ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#ef4444] mb-[12px]" />
                  <p className="text-[#6b7280] text-[14px]">AI is generating response options...</p>
                  {conferenceResults && (
                    <p className="text-[12px] text-[#6b7280] mt-[8px]">
                      Current Score: <span className="text-[#f59e0b]">+{conferenceResults.mediaScore}</span>
                    </p>
                  )}
                </div>
              ) : currentQuestion && (
                <div className="space-y-[16px]">
                  {/* Progress indicator */}
                  <div className="flex items-center justify-between p-[12px] bg-[#f9fafb] rounded-[8px]">
                    <span className="text-[14px] text-[#6b7280]">
                      Question {questionIndex + 1} of {conferenceResults?.total || 0}
                    </span>
                    <Badge variant={currentQuestion.difficulty === 'hostile' ? 'red' : currentQuestion.difficulty === 'hard' ? 'orange' : 'default'}>
                      {currentQuestion.difficulty}
                    </Badge>
                  </div>
                  
                  {/* Question */}
                  <div className="p-4 bg-background rounded-[8px]">
                    <div className="flex items-center gap-[8px] mb-[8px] text-[12px] text-[#6b7280]">
                      <span className="font-medium">{currentQuestion.journalist}</span>
                      <span>•</span>
                      <span>{currentQuestion.outlet}</span>
                    </div>
                    <p className="font-medium text-[18px]">"{currentQuestion.question}"</p>
                  </div>
                  
                  {/* Answer options */}
                  <div className="space-y-[12px]">
                    {currentAnswerOptions.map((answer) => (
                      <button
                        key={answer.id}
                        onClick={() => handleAnswerQuestion(answer.id)}
                        className="w-full p-[16px] text-left rounded-[8px] border-[0.8px] border-black/10 bg-white hover:bg-[#f9fafb] transition-all"
                      >
                        <p className="text-[14px] mb-[8px]">{answer.answer}</p>
                        <div className="flex items-center justify-between text-[12px] text-[#6b7280]">
                          <span className="capitalize">{answer.tone}</span>
                          <div className="flex items-center gap-[12px]">
                            <span className={answer.effects.controversyRisk > 20 ? 'text-[#f59e0b]' : ''}>
                              Risk: {answer.effects.controversyRisk}%
                            </span>
                            <span className="text-[#00a63e]">+{answer.effects.mediaScore} media</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Current score */}
                  {conferenceResults && (
                    <div className="text-center text-[14px] text-[#6b7280]">
                      Running Media Score: <span className="font-semibold text-[#f59e0b]">+{conferenceResults.mediaScore}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* ============================================ */}
      {/* MEDIA DUTY COMPLETION MODAL */}
      {/* ============================================ */}
      <Modal
        isOpen={selectedDuty !== null}
        onClose={() => {
          setSelectedDuty(null)
          setDutyOptions([])
          setSelectedOptionId(null)
          setCalendarLinkedDutyId(null)
        }}
        title={
          selectedDuty
            ? (isCalendarDutyInProgress && pendingCalendarDuty
              ? pendingCalendarDuty.name
              : getDutyDisplayInfo(selectedDuty).name)
            : 'Media Duty'
        }
        size="lg"
      >
        {selectedDuty && (
          <div className="space-y-[24px]">
            {/* Duty Info */}
            <div className="p-4 bg-[#f9fafb] rounded-[8px]">
              <div className="flex items-center gap-[12px]">
                <div className="w-12 h-12 rounded-[12px] bg-[#ef4444]/20 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-[#ef4444]" />
                </div>
                <div>
                  <p className="font-medium text-[18px]">{selectedDuty.trackName}</p>
                  <p className="text-[14px] text-[#6b7280]">
                    {selectedDuty.seriesName} • {getDayName(selectedDuty.day)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[#6b7280] text-[14px]">
                {(isCalendarDutyInProgress && pendingCalendarDuty?.description)
                  ? pendingCalendarDuty.description
                  : getDutyConfig(selectedDuty.type)?.description}
              </p>
            </div>

            {/* Loading State */}
            {loadingOptions && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#ef4444]" />
                <span className="ml-3 text-[#6b7280]">Generating response options...</span>
              </div>
            )}

            {/* Response Options */}
            {!loadingOptions && dutyOptions.length > 0 && (
              <div className="space-y-[12px]">
                <h4 className="font-medium text-[#0a0a0a]">Choose Your Response</h4>
                {dutyOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setSelectedOptionId(option.id)}
                    className={`p-[16px] rounded-[12px] border-[0.8px] cursor-pointer transition-all ${
                      selectedOptionId === option.id
                        ? 'border-black bg-black/5'
                        : 'border-black/10 bg-white hover:bg-[#f9fafb]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-[12px]">
                      <div className="flex-1">
                        <p className="text-[#0a0a0a]">{option.content}</p>
                        <div className="flex items-center gap-[8px] mt-[8px]">
                          <Badge 
                            variant={
                              option.tone === 'aggressive' ? 'destructive' : 
                              option.tone === 'confident' ? 'blue' : 
                              option.tone === 'humble' ? 'green' : 
                              'default'
                            } 
                            size="sm"
                          >
                            {option.tone}
                          </Badge>
                          {option.makesPromises && (
                            <Badge variant="warning" size="sm">Makes Promise</Badge>
                          )}
                          {option.criticizesTeam && (
                            <Badge variant="destructive" size="sm">Criticizes Team</Badge>
                          )}
                          {option.effects.controversyRisk > 30 && (
                            <Badge variant="red" size="sm">
                              {option.effects.controversyRisk}% Controversy Risk
                            </Badge>
                          )}
                        </div>
                      </div>
                      {selectedOptionId === option.id && (
                        <CheckCircle className="w-6 h-6 text-[#ef4444] flex-shrink-0" />
                      )}
                    </div>
                    
                    {/* Effect Preview */}
                    <div className="mt-3 pt-3 border-t border-black/10 flex flex-wrap gap-[12px] text-[12px]">
                      {option.effects.sponsorSatisfaction !== 0 && (
                        <span className={option.effects.sponsorSatisfaction > 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}>
                          Sponsor: {option.effects.sponsorSatisfaction > 0 ? '+' : ''}{option.effects.sponsorSatisfaction}
                        </span>
                      )}
                      {option.effects.fanSentiment !== 0 && (
                        <span className={option.effects.fanSentiment > 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}>
                          Fans: {option.effects.fanSentiment > 0 ? '+' : ''}{option.effects.fanSentiment}
                        </span>
                      )}
                      {option.effects.teamMorale !== 0 && (
                        <span className={option.effects.teamMorale > 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}>
                          Team: {option.effects.teamMorale > 0 ? '+' : ''}{option.effects.teamMorale}
                        </span>
                      )}
                      {option.effects.boardMood !== 0 && (
                        <span className={option.effects.boardMood > 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}>
                          Board: {option.effects.boardMood > 0 ? '+' : ''}{option.effects.boardMood}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Skip Penalty Warning */}
            {!isCalendarDutyInProgress && (
              <div className="p-3 bg-[#f59e0b]/10 border-[0.8px] border-[#f59e0b]/20 rounded-[8px]">
                <div className="flex items-center gap-[8px] text-[#f59e0b]">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[14px] font-medium">Skip Penalty</span>
                </div>
                <p className="text-[12px] text-[#6b7280] mt-1">
                  Skipping this duty will cost ${selectedDuty.skipPenalty.fine.toLocaleString()} and reduce sponsor satisfaction by {selectedDuty.skipPenalty.sponsorSatisfaction}.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-[12px]">
              {!isCalendarDutyInProgress && (
                <Button 
                  variant="ghost" 
                  className="flex-1"
                  onClick={handleSkipDuty}
                >
                  Skip Duty
                </Button>
              )}
              <Button 
                variant="primary" 
                className="flex-1"
                disabled={!selectedOptionId || loadingOptions}
                onClick={handleCompleteDuty}
              >
                <Send className="w-4 h-4 mr-2" />
                Deliver Statement
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </div>
  )
}

// ============================================
// STAT CARD COMPONENT
// ============================================

interface MediaStatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  suffix?: string
  color?: string
  trend?: React.ReactNode
  badge?: string
}

function MediaStatCard({ icon, label, value, suffix, color = 'text-[#0a0a0a]', trend, badge }: MediaStatCardProps) {
  return (
    <div className={`${INNER}`}>
      <div className="flex items-center gap-[8px] mb-[8px]">
        <div className="w-[40px] h-[40px] rounded-[10px] bg-[#f3f4f6] flex items-center justify-center text-[#0a0a0a]">
          {icon}
        </div>
        {trend && <div className="ml-auto">{trend}</div>}
      </div>
      <p className="text-[#4a5565] text-[13px]" style={FR}>{label}</p>
      <div className="flex items-baseline gap-[4px]">
        <p className="text-[22px] text-[#0a0a0a]" style={FBold}>
          {value}
          {suffix && <span className="text-[13px] text-[#4a5565]" style={{ ...FR, fontWeight: 400 }}>{suffix}</span>}
        </p>
        {badge && <Badge variant="blue" size="sm" className="ml-[8px]">{badge}</Badge>}
      </div>
    </div>
  )
}
