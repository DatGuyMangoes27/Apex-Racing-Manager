import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Star,
  Trash2,
  Archive,
  MailOpen,
  ChevronRight,
  Briefcase,
  Users,
  FileText,
  Trophy,
  Tv,
  Settings,
} from 'lucide-react';
import { Card, CardHeader, Badge, Button, Modal } from '@/components/ui'
import { NegotiationModal } from '@/components/sponsors'
import { OpportunityResponseModal } from '@/components/opportunities'
import { useCareerStore, Email, EmailCategory, getDayName, SponsorNegotiation } from '@/store/careerStore'
import { TeamOpportunity } from '@/data/team-opportunities'

// Category definitions
const CATEGORIES: { id: EmailCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All Mail', icon: <Mail className="w-4 h-4" /> },
  { id: 'sponsor', label: 'Sponsors', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'board', label: 'Board', icon: <Users className="w-4 h-4" /> },
  { id: 'contract', label: 'Contracts', icon: <FileText className="w-4 h-4" /> },
  { id: 'invitation', label: 'Invitations', icon: <Trophy className="w-4 h-4" /> },
  { id: 'media', label: 'Media', icon: <Tv className="w-4 h-4" /> },
  { id: 'team', label: 'Team', icon: <Settings className="w-4 h-4" /> },
  { id: 'system', label: 'System', icon: <Bell className="w-4 h-4" /> },
]

// Get category color
function getCategoryColor(category: EmailCategory): string {
  switch (category) {
    case 'sponsor': return 'text-accent-gold'
    case 'board': return 'text-accent-blue'
    case 'contract': return 'text-status-success'
    case 'invitation': return 'text-accent-orange'
    case 'media': return 'text-accent-red'
    case 'team': return 'text-text-muted'
    case 'system': return 'text-text-muted'
    default: return 'text-text-muted'
  }
}

// Get category icon
function getCategoryIcon(category: EmailCategory) {
  const cat = CATEGORIES.find(c => c.id === category)
  return cat?.icon ?? <Mail className="w-4 h-4" />
}

export function Emails() {
  const { addToast } = useToast()
  const { 
    careerState, 
    markEmailRead, 
    markEmailUnread,
    toggleEmailStarred, 
    archiveEmail, 
    deleteEmail,
    getUnreadEmailCount
  } = useCareerStore()
  
  const [selectedCategory, setSelectedCategory] = useState<EmailCategory | 'all'>('all')
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [negotiationModalOpen, setNegotiationModalOpen] = useState(false)
  const [selectedNegotiation, setSelectedNegotiation] = useState<SponsorNegotiation | null>(null)
  const [opportunityModalOpen, setOpportunityModalOpen] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<TeamOpportunity | null>(null)
  
  const emails = careerState?.emails ?? []
  const unreadCount = getUnreadEmailCount()
  
  // Filter emails
  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      // Category filter
      if (selectedCategory !== 'all' && email.category !== selectedCategory) return false
      
      // Archive filter
      if (!showArchived && email.archived) return false
      if (showArchived && !email.archived) return false
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          email.subject.toLowerCase().includes(query) ||
          email.sender.toLowerCase().includes(query) ||
          email.body.toLowerCase().includes(query)
        )
      }
      
      return true
    })
  }, [emails, selectedCategory, showArchived, searchQuery])
  
  // Get unread count for category
  const getCategoryUnread = (category: EmailCategory | 'all') => {
    if (category === 'all') return unreadCount
    return emails.filter(e => e.category === category && !e.read && !e.archived).length
  }
  
  // Handle email selection
  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email)
    if (!email.read) {
      markEmailRead(email.id)
    }
  }
  
  // Handle email actions
  const handleStar = (email: Email, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleEmailStarred(email.id)
  }
  
  const handleArchive = (email: Email) => {
    archiveEmail(email.id)
    setSelectedEmail(null)
    addToast({
      type: 'info',
      title: 'Email Archived',
      message: 'Moved to archive',
      duration: 2000
    })
  }
  
  const handleDelete = (email: Email) => {
    deleteEmail(email.id)
    setSelectedEmail(null)
    addToast({
      type: 'info',
      title: 'Email Deleted',
      message: 'Email permanently deleted',
      duration: 2000
    })
  }
  
  const handleMarkUnread = (email: Email) => {
    markEmailUnread(email.id)
    addToast({
      type: 'info',
      title: 'Marked as Unread',
      message: '',
      duration: 1500
    })
  }
  
  // Handle opening negotiation modal from email
  const handleOpenNegotiation = (email: Email) => {
    const negotiationId = email.actionData?.negotiationId as string
    if (!negotiationId) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Could not find negotiation details',
        duration: 3000
      })
      return
    }
    
    const negotiation = careerState?.ownedTeam?.finances?.activeNegotiations?.find(
      n => n.id === negotiationId
    )
    
    if (!negotiation) {
      addToast({
        type: 'error',
        title: 'Negotiation Not Found',
        message: 'This negotiation may have expired or been completed',
        duration: 3000
      })
      return
    }
    
    setSelectedNegotiation(negotiation)
    setNegotiationModalOpen(true)
  }
  
  // Handle opening opportunity modal from email
  const handleOpenOpportunity = (email: Email) => {
    const opportunityId = email.actionData?.opportunityId as string
    if (!opportunityId) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Could not find opportunity details',
        duration: 3000
      })
      return
    }
    
    const opportunity = careerState?.pendingOpportunities?.find(
      o => o.instanceId === opportunityId
    )
    
    if (!opportunity) {
      addToast({
        type: 'error',
        title: 'Opportunity Not Found',
        message: 'This opportunity may have expired or been responded to',
        duration: 3000
      })
      return
    }
    
    setSelectedOpportunity(opportunity)
    setOpportunityModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <GameSectionHeader
        title="INBOX"
        subtitle={`${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`}
        accent="blue"
      />
      
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Categories */}
        <div className="col-span-3">
          <Card variant="glass" padding="none">
            <div className="p-4 border-b border-surface-border">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-text-muted">Categories</h3>
            </div>
            <nav className="p-2">
              {CATEGORIES.map((cat) => {
                const catUnread = getCategoryUnread(cat.id)
                const isActive = selectedCategory === cat.id
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id)
                      setSelectedEmail(null)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-accent-blue/20 text-accent-blue' 
                        : 'hover:bg-surface-secondary text-text-secondary hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {cat.icon}
                      <span className="text-sm font-medium">{cat.label}</span>
                    </div>
                    {catUnread > 0 && (
                      <Badge variant={isActive ? 'blue' : 'default'} size="sm">
                        {catUnread}
                      </Badge>
                    )}
                  </button>
                )
              })}
              
              {/* Archive toggle */}
              <div className="mt-4 pt-4 border-t border-surface-border">
                <button
                  onClick={() => {
                    setShowArchived(!showArchived)
                    setSelectedEmail(null)
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    showArchived 
                      ? 'bg-surface-secondary text-white' 
                      : 'hover:bg-surface-secondary text-text-muted hover:text-white'
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {showArchived ? 'Viewing Archive' : 'View Archive'}
                  </span>
                </button>
              </div>
            </nav>
          </Card>
        </div>
        
        {/* Email List */}
        <div className="col-span-4">
          <Card variant="glass" padding="none" className="h-[calc(100vh-220px)] flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-surface-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Email List */}
            <div className="flex-1 overflow-y-auto">
              {filteredEmails.length > 0 ? (
                <div className="divide-y divide-surface-border">
                  {filteredEmails.map((email) => (
                    <motion.div
                      key={email.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => handleSelectEmail(email)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedEmail?.id === email.id
                          ? 'bg-accent-blue/10'
                          : email.read
                            ? 'hover:bg-surface-secondary/50'
                            : 'bg-surface-secondary/30 hover:bg-surface-secondary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Star button */}
                        <button 
                          onClick={(e) => handleStar(email, e)}
                          className="mt-1 hover:scale-110 transition-transform"
                        >
                          <Star 
                            className={`w-4 h-4 ${
                              email.starred 
                                ? 'text-accent-gold fill-accent-gold' 
                                : 'text-text-muted hover:text-accent-gold'
                            }`} 
                          />
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className={getCategoryColor(email.category)}>
                                {getCategoryIcon(email.category)}
                              </span>
                              <span className={`text-sm font-medium truncate ${
                                !email.read ? 'text-white' : 'text-text-secondary'
                              }`}>
                                {email.sender}
                              </span>
                              {/* Sent email indicator */}
                              {email.actionData?.type === 'outreach_sent' && (
                                <Badge variant="default" size="sm" className="text-[10px]">
                                  Sent
                                </Badge>
                              )}
                            </div>
                            {!email.read && (
                              <span className="w-2 h-2 rounded-full bg-accent-blue flex-shrink-0" />
                            )}
                          </div>
                          <p className={`text-sm truncate ${
                            !email.read ? 'text-white font-medium' : 'text-text-secondary'
                          }`}>
                            {email.subject}
                          </p>
                          <p className="text-xs text-text-muted truncate mt-1">
                            {email.preview}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                            <Clock className="w-3 h-3" />
                            <span>{getDayName(email.receivedDay)}, Week {email.receivedWeek}</span>
                            {email.expiresWeek && email.expiresWeek <= (careerState?.currentWeek ?? 0) + 2 && (
                              <Badge variant="orange" size="sm">
                                Expires soon
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <Mail className="w-16 h-16 text-text-muted/30 mb-4" />
                  <p className="text-text-muted">
                    {showArchived ? 'No archived emails' : 'No emails in this category'}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Email Detail */}
        <div className="col-span-5">
          <Card variant="glass" padding="none" className="h-[calc(100vh-220px)] flex flex-col">
            <AnimatePresence mode="wait">
              {selectedEmail ? (
                <motion.div
                  key={selectedEmail.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full"
                >
                  {/* Email Header */}
                  <div className="p-4 border-b border-surface-border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={getCategoryColor(selectedEmail.category)}>
                            {getCategoryIcon(selectedEmail.category)}
                          </span>
                          <Badge variant="default" size="sm">
                            {CATEGORIES.find(c => c.id === selectedEmail.category)?.label}
                          </Badge>
                        </div>
                        <h2 className="font-display font-bold text-xl">
                          {selectedEmail.subject}
                        </h2>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleStar(selectedEmail, {} as React.MouseEvent)}
                        >
                          <Star className={`w-4 h-4 ${
                            selectedEmail.starred ? 'text-accent-gold fill-accent-gold' : ''
                          }`} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMarkUnread(selectedEmail)}
                        >
                          <MailOpen className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleArchive(selectedEmail)}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(selectedEmail)}
                          className="text-status-error hover:text-status-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Sender info */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center">
                        <span className="font-bold text-sm">
                          {selectedEmail.sender.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{selectedEmail.sender}</p>
                        {selectedEmail.senderRole && (
                          <p className="text-sm text-text-muted">{selectedEmail.senderRole}</p>
                        )}
                      </div>
                      <div className="ml-auto text-sm text-text-muted">
                        {getDayName(selectedEmail.receivedDay)}, Week {selectedEmail.receivedWeek}, {selectedEmail.receivedYear}
                      </div>
                    </div>
                  </div>
                  
                  {/* Email Body */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="prose prose-invert max-w-none">
                      {selectedEmail.body.split('\n').map((paragraph, i) => (
                        <p key={i} className="text-text-secondary mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    
                    {/* Expiry warning */}
                    {selectedEmail.expiresWeek && (
                      <div className="mt-6 p-4 bg-status-warning/10 border border-status-warning/30 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-status-warning" />
                        <div>
                          <p className="font-medium text-status-warning">Time Sensitive</p>
                          <p className="text-sm text-text-muted">
                            This email expires in Week {selectedEmail.expiresWeek}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  {selectedEmail.actionType && (
                    <div className="p-4 border-t border-surface-border">
                      {selectedEmail.actionType === 'accept_decline' && (
                        <div className="flex gap-3">
                          <Button 
                            variant="secondary" 
                            className="flex-1"
                            onClick={() => {
                              // Handle decline action
                              handleArchive(selectedEmail)
                              addToast({
                                type: 'info',
                                title: 'Declined',
                                message: 'Response recorded',
                                duration: 2000
                              })
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                          <Button 
                            variant="primary" 
                            className="flex-1"
                            onClick={() => {
                              // Handle accept action
                              handleArchive(selectedEmail)
                              addToast({
                                type: 'success',
                                title: 'Accepted',
                                message: 'Response recorded',
                                duration: 2000
                              })
                            }}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Accept
                          </Button>
                        </div>
                      )}
                      {selectedEmail.actionType === 'acknowledge' && (
                        <Button 
                          variant="primary" 
                          className="w-full"
                          onClick={() => handleArchive(selectedEmail)}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Acknowledge
                        </Button>
                      )}
                      {selectedEmail.actionType === 'navigate' && (
                        <Button 
                          variant="primary" 
                          className="w-full"
                          onClick={() => {
                            // Navigate to relevant screen based on actionData
                            const destination = (selectedEmail.actionData?.destination as string) || '/home'
                            window.location.hash = destination
                          }}
                        >
                          View Details
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                      {selectedEmail.actionType === 'negotiate_sponsor' && (
                        <Button 
                          variant="primary" 
                          className="w-full"
                          onClick={() => handleOpenNegotiation(selectedEmail)}
                        >
                          <Handshake className="w-4 h-4 mr-2" />
                          View Offer & Negotiate
                        </Button>
                      )}
                      {selectedEmail.actionType === 'review_counter' && (
                        <div className="space-y-3">
                          <div className="p-3 bg-accent-gold/10 border border-accent-gold/30 rounded-lg flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-accent-gold" />
                            <span className="text-sm text-accent-gold">
                              The sponsor has responded with a counter offer
                            </span>
                          </div>
                          <Button 
                            variant="primary" 
                            className="w-full"
                            onClick={() => handleOpenNegotiation(selectedEmail)}
                          >
                            <Handshake className="w-4 h-4 mr-2" />
                            Review Counter Offer
                          </Button>
                        </div>
                      )}
                      {(selectedEmail.actionType === 'opportunity_media' || 
                        selectedEmail.actionType === 'opportunity_manufacturer' ||
                        selectedEmail.actionType === 'opportunity_special') && (
                        <Button 
                          variant="primary" 
                          className="w-full"
                          onClick={() => handleOpenOpportunity(selectedEmail)}
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          View Opportunity
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center"
                >
                  <Mail className="w-20 h-20 text-text-muted/20 mb-4" />
                  <p className="text-text-muted">Select an email to read</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
      
      {/* Negotiation Modal */}
      {selectedNegotiation && careerState?.ownedTeam && (
        <NegotiationModal
          isOpen={negotiationModalOpen}
          onClose={() => {
            setNegotiationModalOpen(false)
            setSelectedNegotiation(null)
          }}
          negotiation={selectedNegotiation}
          team={careerState.ownedTeam}
        />
      )}
      
      {/* Opportunity Response Modal */}
      {selectedOpportunity && (
        <OpportunityResponseModal
          isOpen={opportunityModalOpen}
          onClose={() => {
            setOpportunityModalOpen(false)
            setSelectedOpportunity(null)
          }}
          opportunity={selectedOp