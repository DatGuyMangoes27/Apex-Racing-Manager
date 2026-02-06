import { motion } from 'framer-motion'
import { Mail, Star, ChevronRight, Briefcase, Users, FileText, Trophy, Tv, Settings, Bell } from 'lucide-react'
import { Card, CardHeader, Badge, Button } from '@/components/ui'
import { useCareerStore, Email, EmailCategory } from '@/store/careerStore'
import { useNavigate } from 'react-router-dom'

interface EmailPreviewProps {
  maxItems?: number
}

// Get icon for email category
function getCategoryIcon(category: EmailCategory) {
  switch (category) {
    case 'sponsor': return <Briefcase className="w-4 h-4 text-accent-gold" />
    case 'board': return <Users className="w-4 h-4 text-accent-blue" />
    case 'contract': return <FileText className="w-4 h-4 text-status-success" />
    case 'invitation': return <Trophy className="w-4 h-4 text-accent-orange" />
    case 'media': return <Tv className="w-4 h-4 text-accent-red" />
    case 'team': return <Settings className="w-4 h-4 text-text-muted" />
    case 'system': return <Bell className="w-4 h-4 text-text-muted" />
    default: return <Mail className="w-4 h-4 text-text-muted" />
  }
}

// Get category color
function getCategoryColor(category: EmailCategory) {
  switch (category) {
    case 'sponsor': return 'border-accent-gold/30'
    case 'board': return 'border-accent-blue/30'
    case 'contract': return 'border-status-success/30'
    case 'invitation': return 'border-accent-orange/30'
    case 'media': return 'border-accent-red/30'
    default: return 'border-surface-border'
  }
}

export function EmailPreview({ maxItems = 3 }: EmailPreviewProps) {
  const navigate = useNavigate()
  const { careerState } = useCareerStore()
  
  const emails = careerState?.emails ?? []
  const unreadEmails = emails.filter(e => !e.read && !e.archived)
  const displayEmails = unreadEmails.slice(0, maxItems)
  const totalUnread = unreadEmails.length
  
  const handleEmailClick = (_email: Email) => {
    navigate('/emails')
  }
  
  return (
    <Card variant="glass" padding="lg">
      <CardHeader 
        title="Inbox"
        icon={<Mail className="w-5 h-5" />}
        action={
          totalUnread > 0 ? (
            <Badge variant="red" size="lg">
              {totalUnread} unread
            </Badge>
          ) : (
            <Badge variant="default" size="lg">
              All read
            </Badge>
          )
        }
      />
      
      {displayEmails.length > 0 ? (
        <div className="space-y-2">
          {displayEmails.map((email, index) => (
            <motion.div
              key={email.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleEmailClick(email)}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-surface-secondary/50 ${
                getCategoryColor(email.category)
              } ${!email.read ? 'bg-surface-secondary/30' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getCategoryIcon(email.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-medium truncate ${!email.read ? 'text-white' : 'text-text-secondary'}`}>
                      {email.sender}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {email.starred && <Star className="w-3 h-3 text-accent-gold fill-accent-gold" />}
                      {!email.read && <span className="w-2 h-2 rounded-full bg-accent-red" />}
                    </div>
                  </div>
                  <p className={`text-sm truncate ${!email.read ? 'text-text-primary' : 'text-text-muted'}`}>
                    {email.subject}
                  </p>
                  <p className="text-xs text-text-muted truncate mt-0.5">
                    {email.preview}
                  </p>
                </div>
              </div>
              
              {/* Action indicator */}
              {email.actionType && (
                <div className="mt-2 pt-2 border-t border-surface-border/50">
                  <Badge 
                    variant={
                      email.actionType === 'negotiate_sponsor' || email.actionType === 'review_counter' 
                        ? 'green' 
                        : 'orange'
                    } 
                    size="sm"
                  >
                    {email.actionType === 'accept_decline' ? 'Action Required' : 
                     email.actionType === 'respond' ? 'Response Needed' : 
                     email.actionType === 'negotiate_sponsor' ? 'Negotiation Offer' :
                     email.actionType === 'review_counter' ? 'Counter Received' :
                     'View Details'}
                  </Badge>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Mail className="w-12 h-12 mx-auto text-text-muted/30 mb-3" />
          <p className="text-sm text-text-muted">No unread emails</p>
        </div>
      )}
      
      {/* View All Link */}
      <div className="mt-4 pt-4 border-t border-surface-border">
        <Button 
          variant="ghost" 
          className="w-full justify-between"
          onClick={() => navigate('/emails')}
        >
          <span>View All Emails</span>
          <div className="flex items-center gap-2">
            {emails.length > 0 && (
              <span className="text-text-muted text-sm">{emails.filter(e => !e.archived).length} total</span>
            )}
            <ChevronRight className="w-4 h-4" />
          </div>
        </Button>
      </div>
    </Card>
  )
}
