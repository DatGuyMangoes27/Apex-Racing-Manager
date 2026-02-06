import { useState, useMemo, useCallback, useEffect } from 'react'
import type { motion } from 'framer-motion';
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
    datingStatus: contact.datingStatus
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
  const lastMessage = conversation?.messages[0]
  
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
              {lastMessage.content}
            </p>
          )}
        </div>
        
        {/* Status */}
        <div className="flex flex-col items-end gap-1">
          {unreadCount > 0 && (
            <Badge variant="danger" size="sm" className="min-w-[20px] justify-center">
              {unreadCount}
            </Badge>
          )}
          <span className="text-xs text-text-muted">{contact.lastSeen}</span>
        </div>
      </div>
    </motion.div>
  )
}

function MessageBubble({ message, isPlayer }: { message: TextMessage; isPlayer: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isPlayer ? 'justify-end' : 'justify-start'}`}
    >
      <div 
        className={`
          max-w-[75%] px-4 py-2.5 rounded-2xl
          ${isPlayer 
            ? 'bg-racing-red text-white rounded-br-md' 
            : 'bg-surface-dark text-text-primary rounded-bl-md'
          }
        `}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div className={`flex items-center gap-1 mt-1 ${isPlayer ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] opacity-60">
            {message.timestamp.hour}:00
          </span>
          {isPlayer && (
            message.isRead 
              ? <CheckCheck className="w-3 h-3 opacity-60" />
              : <Check className="w-3 h-3 opacity-60" />
          )}
        </div>
      </div>
    </motion.div>
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
      case 'risky': return <Badge variant="warning" size="sm">Risky</Badge>
      case 'bold': return <Badge variant="danger" size="sm">Bold</Badge>
      default: return null
    }
  }
  
  return (
    <div className="space-y-2">
      {choices.map((choice, index) => (
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
          `}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-white text-sm">{choice.preview}</p>
              <p className="text-xs text-white/70 mt-0.5">{choice.fullMessage}</p>
            </div>
            {getRiskBadge(choice.riskLevel)}
          </div>
        </motion.button>
      ))}
    </div>
  )
}

function ConversationView({
  contact,
  conversation,
  onBack,
  playerName
}: {
  contact: Contact
  conversation: Conversation
  onBack: () => void
  playerName: string
}) {
  const { careerState, addMessage, markConversationRead, updateRelationshipMeters, sendGift, sendDateInvite } = useCareerStore()
  const [messageChoices, setMessageChoices] = useState<MessageChoice[]>([])
  const [isLoadingChoices, setIsLoadingChoices] = useState(false)
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [showDateModal, setShowDateModal] = useState(false)
  
  // Get messages from store conversation
  const storeConversation = careerState?.messaging?.conversations[conversation.id]
  const messages = storeConversation?.messages || conversation.messages
  
  const currentWeek = careerState?.currentWeek ?? 1
  const _currentDay = careerState?.currentDay ?? 1
  const _currentYear = careerState?.currentYear ?? 2024
  
  // Mark conversation as read on mount
  useEffect(() => {
    if (storeConversation?.unreadCount && storeConversation.unreadCount > 0) {
      markConversationRead(conversation.id)
    }
  }, [conversation.id, storeConversation?.unreadCount, markConversationRead])
  
  // Generate message choices
  const loadChoices = useCallback(async () => {
    setIsLoadingChoices(true)
    try {
      const context = {
        contactName: contact.name,
        contactType: contact.type,
        traits: contact.traits,
        relationshipLevel: contact.relationshipLevel,
        affectionMeter: contact.affectionMeter,
        romanceMeter: contact.romanceMeter,
        trustMeter: contact.trustMeter,
        relationshipStatus: contact.type === 'partner' ? 'dating' : contact.datingStatus || 'friend',
        currentMood: contact.mood.overall,
        moodEnergy: contact.mood.energy,
        lastMessageFromThem: messages.find(m => m.sender === 'npc')?.content,
        daysSinceLastContact: 1,
        recentEvents: [],
        playerName,
        playerCurrentStress: 30
      }
      
      const choices = await generateMessageChoices(context)
      setMessageChoices(choices)
    } catch (error) {
      console.error('Failed to generate choices:', error)
    } finally {
      setIsLoadingChoices(false)
    }
  }, [contact, messages, playerName])
  
  useEffect(() => {
    loadChoices()
  }, [loadChoices])
  
  const handleSendMessage = async (choice: MessageChoice) => {
    // Add player message to store
    addMessage(conversation.id, {
      content: choice.fullMessage,
      isPlayer: true
    })
    
    setMessageChoices([])
    
    // Generate NPC response
    setIsLoadingChoices(true)
    try {
      const context = {
        contactName: contact.name,
        contactType: contact.type,
        traits: contact.traits,
        relationshipLevel: contact.relationshipLevel,
        affectionMeter: contact.affectionMeter,
        romanceMeter: contact.romanceMeter,
        trustMeter: contact.trustMeter,
        currentMood: contact.mood.overall,
        moodEnergy: contact.mood.energy,
        daysSinceLastContact: 1,
        recentEvents: [],
        playerName,
        playerCurrentStress: 30
      }
      
      const response = await generateNpcResponse(context, choice.fullMessage, choice.category)
      
      // Add NPC response to store
      addMessage(conversation.id, {
        content: response.message,
        isPlayer: false
      })
      
      // Update relationship meters from response
      if (response.affectionChange || response.romanceChange || response.trustChange) {
        updateRelationshipMeters(contact.id, {
          affection: response.affectionChange,
          romance: response.romanceChange,
          trust: response.trustChange
        })
      }
      
      // Reload choices for next message
      loadChoices()
    } catch (error) {
      console.error('Failed to generate response:', error)
      setIsLoadingChoices(false)
    }
  }
  
  const _handleSendGift = (gift: { id?: string; name: string; value: number }) => {
    sendGift(contact.id, gift.name, gift.value)
    
    // Add gift message to conversation
    addMessage(conversation.id, {
      content: `Sent a gift: ${gift.name}`,
      isPlayer: true
    })
    
    // Calculate and apply effects
    const effects = gift.id === 'flowers' ? { affection: 3 } :
                    gift.id === 'chocolates' ? { affection: 2 } :
                    gift.id === 'jewelry' ? { affection: 8, romance: 3 } :
                    gift.id === 'watch' ? { affection: 12, romance: 5 } :
                    gift.id === 'trip' ? { affection: 15, romance: 10, trust: 5 } :
                    gift.id === 'car' ? { affection: 25, romance: 15, trust: 10 } :
                    { affection: Math.floor(gift.value / 100) }
    
    updateRelationshipMeters(contact.id, effects)
    
    setShowGiftModal(false)
  }
  
  const _handlePlanDate = (date: { id?: string; type?: string; name?: string; location: string; cost?: number }) => {
    const dateType = date.type || date.name || 'Date'
    sendDateInvite(contact.id, dateType, date.location, currentWeek + 1)
    
    // Add date invite message
    addMessage(conversation.id, {
      content: `Would you like to go on a ${dateType.toLowerCase()}? 💕`,
      isPlayer: true
    })
    
    // Simulate acceptance based on relationship
    const acceptanceChance = (contact.affectionMeter + contact.trustMeter) / 200
    const accepted = Math.random() < acceptanceChance + 0.3
    
    setTimeout(() => {
      addMessage(conversation.id, {
        content: accepted 
          ? "I'd love to! That sounds wonderful! 😊"
          : "I'm sorry, I'm not free then. Maybe another time?",
        isPlayer: false
      })
    }, 500)
    
    setShowDateModal(false)
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/10">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="relative">
          <PortraitImage
            src={getContactPortrait(contactToContactInfo(contact))}
            name={contact.name}
            size="md"
          />
          {contact.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-surface-darker" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-text-primary">{contact.name}</h3>
          <p className="text-xs text-text-muted">
            {contact.isOnline ? 'Online' : contact.lastSeen}
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowGiftModal(true)}
            className="text-pink-400"
          >
            <Gift className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowDateModal(true)}
            className="text-red-400"
          >
            <Calendar className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Affection Meters */}
      <div className="p-3 bg-surface-dark/30 border-b border-border/10">
        <AffectionMeters contact={contact} />
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex flex-col-reverse gap-3">
          {messages.map(message => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              isPlayer={message.sender === 'player'} 
            />
          ))}
        </div>
      </div>
      
      {/* Message Choice Area */}
      <div className="p-4 border-t border-border/10 bg-surface-darker/50">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-racing-red" />
          <span className="text-xs text-text-muted">Choose your response</span>
          {!isDialogueAIAvailable() && (
            <Badge variant="outline" size="sm">Template Mode</Badge>
          )}
        </div>
        
        <MessageChoiceWheel
          choices={messageChoices}
          onSelect={handleSendMessage}
          isLoading={isLoadingChoices}
        />
      </div>
      
      {/* Gift Modal */}
      <Modal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        title={`Send Gift to ${contact.name}`}
        size="md"
      >
        <GiftSelector
          contact={contact}
          onSend={(_gift) => {
            setShowGiftModal(false)
            // Handle gift sending
          }}
          onClose={() => setShowGiftModal(false)}
        />
      </Modal>
      
      {/* Date Modal */}
      <Modal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        title={`Ask ${contact.name} Out`}
        size="md"
      >
        <DatePlanner
          contact={contact}
          onPlan={(_date) => {
            setShowDateModal(false)
            // Handle date planning
          }}
          onClose={() => setShowDateModal(false)}
        />
      </Modal>
    </div>
  )
}

function GiftSelector({ 
  contact, 
  onSend, 
  _onClose 
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
  _onClose 
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
        Plan a date with {contact.name}. They seem to be in a {contact.mood.overall} mood today.
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
// DATING TAB COMPONENT
// ============================================

function DatingTab({
  contacts,
  potentialDates,
  messaging,
  _currentWeek,
  _currentYear,
  onSelectContact
}: {
  contacts: Contact[]
  potentialDates: PotentialDate[]
  messaging: ReturnType<typeof createDefaultMessagingState>
  currentWeek: number
  currentYear: number
  onSelectContact: (contact: Contact) => void
}) {
  const partner = contacts.find(c => c.type === 'partner')
  
  // Calculate dating stats from messaging state
  const pendingDates = messaging.pendingDateInvites || []
  const completedDates = pendingDates.filter(d => d.status === 'completed').length
  const giftsSent = messaging.pendingGifts?.length || 0
  
  // Get people you've met who could be romantic interests
  const romanticProspects = contacts.filter(c => c.type === 'potential_date')
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Current Relationship */}
      <Card variant="racing" padding="lg" className="col-span-2">
        <CardHeader 
          title="Current Relationship" 
          icon={<Heart className="w-5 h-5 text-pink-400" />}
        />
        
        {partner ? (
          <div className="mt-4">
            <div className="flex items-center gap-4">
              <PortraitImage
                src={getContactPortrait(contactToContactInfo(partner))}
                name={partner.name}
                size="2xl"
                bordered
                borderColor="default"
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold">{partner.name}</h3>
                <p className="text-text-muted">
                  {partner.metAt ? `Met at ${partner.metAt}` : 'Your partner'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="success">
                    {partner.mood.overall.charAt(0).toUpperCase() + partner.mood.overall.slice(1)}
                  </Badge>
                  <Badge variant="outline">Level: {partner.relationshipLevel}</Badge>
                  {partner.datingStatus && (
                    <Badge variant="info">
                      {partner.datingStatus.charAt(0).toUpperCase() + partner.datingStatus.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-surface-dark/50 rounded-lg p-3 text-center">
                <Smile className="w-6 h-6 text-pink-400 mx-auto mb-1" />
                <p className="text-2xl font-bold">{partner.affectionMeter}</p>
                <p className="text-xs text-text-muted">Affection</p>
              </div>
              <div className="bg-surface-dark/50 rounded-lg p-3 text-center">
                <Heart className="w-6 h-6 text-red-400 mx-auto mb-1" />
                <p className="text-2xl font-bold">{partner.romanceMeter}</p>
                <p className="text-xs text-text-muted">Romance</p>
              </div>
              <div className="bg-surface-dark/50 rounded-lg p-3 text-center">
                <Sparkles className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                <p className="text-2xl font-bold">{partner.trustMeter}</p>
                <p className="text-xs text-text-muted">Trust</p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button className="flex-1" onClick={() => onSelectContact(partner)}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button variant="secondary" className="flex-1">
                <Gift className="w-4 h-4 mr-2" />
                Send Gift
              </Button>
              <Button variant="secondary" className="flex-1">
                <Calendar className="w-4 h-4 mr-2" />
                Plan Date
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Heart className="w-16 h-16 text-text-muted/30 mb-4" />
            <h3 className="text-lg font-medium">Single</h3>
            <p className="text-text-muted text-sm mt-1">
              Meet people at social events to start dating
            </p>
          </div>
        )}
      </Card>
      
      {/* Dating Stats */}
      <Card variant="glass" padding="lg">
        <CardHeader title="Dating Stats" icon={<Star className="w-5 h-5" />} />
        <div className="space-y-4 mt-4">
          <div>
            <p className="text-xs text-text-muted">Dates Completed</p>
            <p className="text-2xl font-bold">{completedDates}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Gifts Sent</p>
            <p className="text-2xl font-bold">{giftsSent}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">People Met</p>
            <p className="text-2xl font-bold">{romanticProspects.length + potentialDates.length}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Pending Date Invites</p>
            <p className="text-2xl font-bold">{pendingDates.filter(d => d.status === 'pending').length}</p>
          </div>
        </div>
      </Card>
      
      {/* People You've Met */}
      {(romanticProspects.length > 0 || potentialDates.length > 0) && (
        <Card variant="glass" padding="lg" className="col-span-3">
          <CardHeader 
            title="People You've Met" 
            icon={<Users className="w-5 h-5 text-pink-400" />}
            subtitle="Potential romantic interests"
          />
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {romanticProspects.map(prospect => (
              <motion.div
                key={prospect.id}
                whileHover={{ scale: 1.02 }}
                className="bg-surface-dark/50 rounded-xl p-4 cursor-pointer hover:bg-surface-dark/70 transition-colors"
                onClick={() => onSelectContact(prospect)}
              >
                <div className="flex items-center gap-3">
                  <PortraitImage
                    src={getContactPortrait(contactToContactInfo(prospect))}
                    name={prospect.name}
                    size="lg"
                    bordered
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{prospect.name}</h4>
                    {prospect.metAt && (
                      <p className="text-xs text-text-muted flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {prospect.metAt}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Status</span>
                    <Badge variant="outline" size="sm">
                      {prospect.datingStatus || 'Stranger'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-surface-darker rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-red-500"
                        style={{ width: `${prospect.relationshipLevel}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-muted">{prospect.relationshipLevel}%</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {prospect.traits.slice(0, 2).map(trait => (
                    <span 
                      key={trait} 
                      className="text-[10px] px-1.5 py-0.5 bg-surface-darker rounded-full text-text-muted"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
            
            {/* Potential dates from the pool */}
            {potentialDates.map(date => (
              <motion.div
                key={date.id}
                whileHover={{ scale: 1.02 }}
                className="bg-surface-dark/50 rounded-xl p-4 cursor-pointer hover:bg-surface-dark/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <PortraitImage
                    src={getContactPortrait({ 
                      ...date, 
                      name: `${date.firstName} ${date.lastName}`,
                      type: 'potential_date' as const,
                      currentMood: { overall: 'neutral', energy: 'medium', receptiveness: 70, recentEvents: [] },
                      relationshipLevel: 30,
                      affectionMeter: 40,
                      romanceMeter: 30,
                      trustMeter: 40,
                      traits: date.traits
                    } as ContactInfo)}
                    name={`${date.firstName} ${date.lastName}`}
                    size="lg"
                    bordered
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{date.firstName} {date.lastName}</h4>
                    <p className="text-xs text-text-muted">{date.occupation}</p>
                    <p className="text-xs text-text-muted flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {date.metAt}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Compatibility</span>
                    <span className="font-medium text-green-400">{date.compatibilityScore}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Interest Level</span>
                    <span className="font-medium text-pink-400">{date.interestLevel}%</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {date.traits.slice(0, 2).map(trait => (
                    <span 
                      key={trait} 
                      className="text-[10px] px-1.5 py-0.5 bg-surface-darker rounded-full text-text-muted"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function Phone() {
  const { player, careerState, addContact, initializeMessaging } = useCareerStore()
  const [activeTab, setActiveTab] = useState('messages')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasSynced, setHasSynced] = useState(false)
  
  // Get messaging state from store
  const messaging = careerState?.messaging || createDefaultMessagingState()
  const contacts = messaging.contacts
  const conversations = messaging.conversations
  const potentialDates = messaging.potentialDates
  
  // Calculate total unread
  const totalUnread = Object.values(conversations).reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
  
  // Sync automatic contacts on mount (partner, children, etc.)
  useEffect(() => {
    if (careerState && !hasSynced) {
      // Initialize messaging if needed
      if (!careerState.messaging) {
        initializeMessaging()
      }
      
      // Sync automatic contacts
      const syncedContacts = syncAutomaticContacts(careerState, contacts)
      
      // Add any new contacts that were synced
      syncedContacts.forEach(contact => {
        if (!contacts.find(c => c.id === contact.id)) {
          addContact(contact)
        }
      })
      
      setHasSynced(true)
    }
  }, [careerState, contacts, hasSynced, addContact, initializeMessaging])
  
  // Convert ContactInfo[] to Contact[] for UI
  const uiContacts = useMemo(() => {
    return contacts.map(contactInfoToContact)
  }, [contacts])
  
  const filteredContacts = useMemo(() => {
    return uiContacts.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [uiContacts, searchQuery])
  
  const favoriteContacts = useMemo(() => 
    uiContacts.filter(c => c.isFavorite),
    [uiContacts]
  )
  
  if (!player || !careerState) return null
  
  const playerName = `${player.firstName} ${player.lastName}`
  const currentWeek = careerState.currentWeek
  const currentYear = careerState.currentYear
  const currentDay = careerState.currentDay
  
  // If a contact is selected, show conversation view
  if (selectedContact) {
    const conversationId = `conv_${selectedContact.id}`
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
      <div className="h-[calc(100vh-120px)]">
        <ConversationView
          contact={selectedContact}
          conversation={conversation}
          onBack={() => setSelectedContact(null)}
          playerName={playerName}
        />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Phone"
        subtitle="Messages, Contacts & Dating"
        icon={<PhoneIcon className="w-6 h-6" />}
        actions={totalUnread > 0 ? (
          <Badge variant="danger" className="animate-pulse">
            {totalUnread} unread
          </Badge>
        ) : undefined}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="messages">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
            {totalUnread > 0 && (
              <Badge variant="danger" size="sm" className="ml-2">{totalUnread}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Users className="w-4 h-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="dating">
            <Heart className="w-4 h-4 mr-2" />
            Dating
          </TabsTrigger>
        </TabsList>
        
        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card variant="glass" padding="lg">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-dark rounded-xl border border-border/20 text-sm focus:outline-none focus:border-racing-red/50"
              />
            </div>
            
            {/* Favorites */}
            {favoriteContacts.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs text-text-muted uppercase tracking-wider mb-2">Favorites</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {favoriteContacts.map(contact => {
                    const convId = `conv_${contact.id}`
                    const conv = conversations[convId]
                    return (
                    <motion.button
                      key={contact.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedContact(contact)}
                      className="flex flex-col items-center gap-1 min-w-[60px]"
                    >
                      <div className="relative">
                        <PortraitImage
                          src={getContactPortrait(contactToContactInfo(contact))}
                          name={contact.name}
                          size="xl"
                        />
                        {contact.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-surface-darker" />
                        )}
                        {conv?.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-racing-red rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-text-secondary truncate max-w-[60px]">
                        {contact.name.split(' ')[0]}
                      </span>
                    </motion.button>
                  )})}
                </div>
              </div>
            )}
            
            {/* Conversation List */}
            <div className="space-y-2">
              {filteredContacts.length > 0 ? (
                filteredContacts.map(contact => {
                  const convId = `conv_${contact.id}`
                  const conv = conversations[convId]
                  return (
                    <ContactListItem
                      key={contact.id}
                      contact={contact}
                      conversation={conv}
                      isSelected={false}
                      onClick={() => setSelectedContact(contact)}
                    />
                  )
                })
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No contacts yet</p>
                  <p className="text-xs mt-1">Meet people at social events to add them here</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
        
        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <div className="grid grid-cols-2 gap-4">
            {['partner', 'family', 'friend', 'business'].map(type => {
              const typeContacts = uiContacts.filter(c => c.type === type)
              const icons = {
                partner: <Heart className="w-5 h-5 text-pink-400" />,
                family: <Users className="w-5 h-5 text-blue-400" />,
                friend: <MessageSquare className="w-5 h-5 text-green-400" />,
                business: <Briefcase className="w-5 h-5 text-yellow-400" />
              }
              
              return (
                <Card key={type} variant="glass" padding="lg">
                  <CardHeader 
                    title={type.charAt(0).toUpperCase() + type.slice(1)} 
                    icon={icons[type as keyof typeof icons]}
                    subtitle={`${typeContacts.length} contacts`}
                  />
                  <div className="space-y-2 mt-4">
                    {typeContacts.map(contact => (
                      <motion.button
                        key={contact.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedContact(contact)}
                        className="w-full p-3 bg-surface-dark/30 rounded-lg text-left hover:bg-surface-dark/50 transition-colors flex items-center gap-3"
                      >
                        <PortraitImage
                          src={getContactPortrait(contactToContactInfo(contact))}
                          name={contact.name}
                          size="md"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-sm">{contact.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-16 h-1.5 bg-surface-darker rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-pink-400" 
                                style={{ width: `${contact.affectionMeter}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-text-muted">{contact.affectionMeter}%</span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                    {typeContacts.length === 0 && (
                      <p className="text-sm text-text-muted text-center py-4">No contacts yet</p>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>
        
        {/* Dating Tab */}
        <TabsContent value="dating">
          <DatingTab 
            contacts={uiContacts}
            potentialDates={potentialDates}
            messaging={messaging}
            currentWeek={currentWeek}
            currentYear={currentYear}
            onSelectContact={setSelectedContact}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Phone
