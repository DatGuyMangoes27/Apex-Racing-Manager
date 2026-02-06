import { useState, useEffect } from 'react';
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
  const [pressConferenceContext, setPressConferenceContext] = useState<PressConferenceContext | null>(null)
  const [gameContext, setGameContext] = useState<ComprehensiveGameContext | null>(null)

  // Initialize team media state if needed
  useEffect(() => {
    if (careerState?.ownedTeam && !careerState.teamMediaState) {
      initializeTeamMedia(careerState.ownedTeam.name)
    }
  }, [careerState?.ownedTeam, careerState?.teamMediaState, initializeTeamMedia])

  if (!careerState?.ownedTeam) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-text-muted" />
          <h2 className="text-xl font-display font-semibold mb-2">No Team Found</h2>
          <p className="text-text-muted">Create a team to access the Media Center</p>
        </div>
      </div>
    )
  }

  const team = careerState.ownedTeam
  const mediaState = careerState.teamMediaState || createDefaultTeamMediaState(team.name)
  
  // Get driver name from RivalDriver
  const primaryDriver = team.drivers?.[0] ? rivals.find(r => r.id === team.drivers[0].driverId) : null
  const driverName = primaryDriver ? `${primaryDriver.firstName} ${primaryDriver.lastName}` : undefined
  
  // Get sponsors from team finances
  const sponsors = team.finances?.sponsors || []
  
  // Get championship position from standings
  const currentSeriesId = player?.currentSeriesId
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
  // HANDLERS
  // ============================================

  // ============================================
  // SOCIAL POST HANDLERS (AI-Generated)
  // ============================================
  
  const handleOpenSocialPostModal = async (postType: SocialPostType) => {
    setSelectedSocialPostType(postType)
    setShowSocialModal(true)
    setLoadingSocialPosts(true)
    setSocialPostOptions([])
    setSelectedSocialOptionId(null)
    
    // Build context for AI generation
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
      nextRaceTrack: currentRaceWeekend?.trackName
    }
    
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
      'practice_update': 'race_preview',
      'qualifying_result': 'race_result',
      'team_update': 'development_update',
      'behind_scenes': 'behind_scenes',
      'fan_engagement': 'fan_engagement',
      'sponsor_thank_you': 'sponsor_highlight',
      'driver_spotlight': 'driver_spotlight',
      'development_tease': 'development_update',
      'throwback': 'throwback',
      'motivation': 'fan_engagement'
    }
    
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
      posted: true
    }
    
    // addTeamPost already updates followers, totalPosts, viralPosts, and postHistory
    addTeamPost(newPost)
    
    // Apply effects to fan sentiment
    if (selectedOption.effects.fanSentiment !== 0) {
      updateFanSentiment(selectedOption.effects.fanSentiment, 'Social media post')
    }
    
    // Calculate follower change for display
    const followerChange = wentViral 
      ? selectedOption.effects.followerGain * 3 
      : hadBacklash 
        ? -Math.floor(selectedOption.effects.followerGain / 2)
        : selectedOption.effects.followerGain
    
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
  }
  
  // ============================================
  // PRESS RELEASE HANDLERS (AI-Generated)
  // ============================================
  
  const handleOpenPressReleaseModal = async (releaseType: PressReleaseType) => {
    setSelectedPressReleaseType(releaseType)
    setShowPressReleaseModal(true)
    setLoadingPressReleases(true)
    setPressReleaseOptions([])
    setSelectedPressReleaseId(null)
    
    // Build context for AI generation
    const context: PressReleaseContext = {
      releaseType,
      teamName: team.name,
      teamTier: team.tier,
      driverName,
      boardMood: team.boardMood,
      currentWeek: careerState.currentWeek,
      currentYear: careerState.currentYear,
      trackName: currentRaceWeekend?.trackName,
      championshipPosition: playerStanding?.position,
      seasonPoints: playerStanding?.points
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
    
    // Apply effects
    if (selectedOption.effects.fanSentiment !== 0) {
      updateFanSentiment(selectedOption.effects.fanSentiment, 'Press release')
    }
    
    // Update board mood (boardMood is on OwnedTeam, not TeamMediaState)
    // Note: This would need to be handled via updateOwnedTeam, but for now we'll skip it
    // as boardMood is not part of TeamMediaState
    
    // Roll for controversy
    if (Math.random() * 100 < selectedOption.effects.controversyRisk) {
      addToast({
        type: 'warning',
        title: 'Press Release Controversy',
        message: 'Your statement attracted unwanted attention from the media',
        duration: 4000
      })
      // Could add actual controversy here
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
      seriesName: player?.currentSeriesId || 'Unknown Series',
      seriesTier: team.tier,
      driverName,
      lastRacePosition: lastRaceResult?.racePosition,
      championshipPosition: playerStanding?.position,
      boardMood: team.boardMood,
      teamMorale: comprehensiveCtx.teamMorale,
      currentWeek: careerState.currentWeek,
      currentYear: careerState.currentYear
    } as PressConferenceContext
    
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

  const handleOpenDuty = async (duty: MediaDuty) => {
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
      driverName,
      boardMood: team.boardMood,
      teamMorale: team.teamMorale || team.fanSentiment, // Using fan sentiment as proxy if teamMorale not available
      // Add more context as available
    }
    
    try {
      const options = await generateMediaDutyOptions(context)
      if (options) {
        setDutyOptions(options)
        storeDutyOptions(duty.id, options)
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

  const handleCompleteDuty = () => {
    if (!selectedDuty || !selectedOptionId) return
    
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
    
    const selectedOption = dutyOptions.find(o => o.id === selectedOptionId)
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
    <div className="space-y-6">
      <PageHeader
        title="Media Center"
        subtitle={`${team.name} Communications Hub`}
        icon={<Tv className="w-6 h-6" />}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant={getReachTierBadge(mediaState.mediaReachTier) as 'gold' | 'blue' | 'green' | 'default'} size="lg">
              <Globe className="w-4 h-4 mr-1" />
              {mediaState.mediaReachTier.charAt(0).toUpperCase() + mediaState.mediaReachTier.slice(1)} Reach
            </Badge>
            {activeControversies.length > 0 && (
              <Badge variant="red" size="lg">
                <AlertOctagon className="w-4 h-4 mr-1" />
                {activeControversies.length} Active Issue{activeControversies.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        }
      />

      {/* Stats Overview - 2 Rows */}
      <div className="space-y-4">
        {/* Row 1: Core Team Metrics */}
        <div className="grid grid-cols-5 gap-4">
          <MediaStatCard 
            icon={<Star className="w-5 h-5" />} 
            label="Media Score" 
            value={mediaState.mediaScore} 
            suffix="/100" 
            color="text-accent-gold" 
          />
          <MediaStatCard 
            icon={<Heart className="w-5 h-5" />} 
            label="Fan Sentiment" 
            value={mediaState.fanSentiment} 
            suffix="/100" 
            color={getSentimentColor(mediaState.fanSentiment)}
            trend={getTrendIcon(mediaState.fanSentimentTrend)}
          />
          <MediaStatCard 
            icon={<Users className="w-5 h-5" />} 
            label="Team Followers" 
            value={formatFollowers(mediaState.teamSocial.followers)} 
            color="text-status-info"
            badge={mediaState.teamSocial.verified ? '✓ Verified' : undefined}
          />
          <MediaStatCard 
            icon={<Briefcase className="w-5 h-5" />} 
            label="Board PR Score" 
            value={mediaState.boardPRSatisfaction} 
            suffix="/100" 
            color={mediaState.boardPRSatisfaction >= 60 ? 'text-status-success' : 'text-status-warning'} 
          />
          <MediaStatCard 
            icon={<Crown className="w-5 h-5" />} 
            label="Fan Club" 
            value={formatFollowers(mediaState.fanClub.members)} 
            color="text-purple-400" 
          />
        </div>
        
        {/* Row 2: Activity Metrics */}
        <div className="grid grid-cols-5 gap-4">
          <MediaStatCard 
            icon={<MessageSquare className="w-5 h-5" />} 
            label="Total Posts" 
            value={mediaState.teamSocial.totalPosts} 
            color="text-text-secondary" 
          />
          <MediaStatCard 
            icon={<Zap className="w-5 h-5" />} 
            label="Viral Posts" 
            value={mediaState.teamSocial.viralPosts} 
            color="text-accent-orange" 
          />
          <MediaStatCard 
            icon={<Newspaper className="w-5 h-5" />} 
            label="Headlines" 
            value={mediaState.teamHeadlines.length} 
            color="text-text-secondary" 
          />
          <MediaStatCard 
            icon={<AlertTriangle className="w-5 h-5" />} 
            label="Season Controversies" 
            value={mediaState.seasonControversies} 
            color={mediaState.seasonControversies > 3 ? 'text-status-error' : 'text-text-muted'} 
          />
          <MediaStatCard 
            icon={<PartyPopper className="w-5 h-5" />} 
            label="Fan Events" 
            value={mediaState.seasonFanEventsHeld} 
            color="text-status-success" 
          />
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="command">
        <TabsList className="mb-6">
          <TabsTrigger value="command">Command Center</TabsTrigger>
          <TabsTrigger value="duties" className="relative">
            Media Duties
            {mediaState.dutySchedule?.weekendDuties?.filter(d => d.status === 'available').length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-accent-orange text-white">
                {mediaState.dutySchedule.weekendDuties.filter(d => d.status === 'available').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="press" className="relative">
            Press & PR
            {activeControversies.length > 0 && (
              <span className="ml-2 w-2 h-2 rounded-full bg-accent-red animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="headlines">Headlines</TabsTrigger>
          <TabsTrigger value="drivers">Driver Media</TabsTrigger>
          <TabsTrigger value="fans">Fan Zone</TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* TAB: MEDIA DUTIES */}
        {/* ============================================ */}
        <TabsContent value="duties">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Duty Timeline */}
            <div className="col-span-2 space-y-6">
              {/* Active Duties - Need Attention */}
              {activeDuties.length > 0 && (
                <Card variant="glass" padding="lg">
                  <CardHeader 
                    title="Active Duties" 
                    subtitle="Requires your attention now"
                    icon={<AlertCircle className="w-5 h-5 text-accent-orange" />}
                  />
                  <div className="space-y-3 mt-4">
                    {activeDuties.map(duty => {
                      const displayInfo = getDutyDisplayInfo(duty)
                      return (
                        <div
                          key={duty.id}
                          className="p-4 bg-accent-orange/10 border border-accent-orange/30 rounded-lg cursor-pointer hover:bg-accent-orange/20 transition-colors"
                          onClick={() => handleOpenDuty(duty)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg bg-accent-orange/20 flex items-center justify-center`}>
                                <Mic className="w-5 h-5 text-accent-orange" />
                              </div>
                              <div>
                                <p className="font-medium text-text-primary">{displayInfo.name}</p>
                                <p className="text-sm text-text-muted">{displayInfo.timeDescription} • {duty.trackName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={displayInfo.urgency === 'critical' ? 'destructive' : displayInfo.urgency === 'high' ? 'warning' : 'default'}>
                                {displayInfo.urgency.toUpperCase()}
                              </Badge>
                              <ChevronRight className="w-5 h-5 text-text-muted" />
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-4 text-sm text-text-muted">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              Skip fine: ${duty.skipPenalty.fine.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
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
                    icon={<Calendar className="w-5 h-5 text-status-info" />}
                  />
                  <div className="space-y-2 mt-4">
                    {upcomingDuties.map(duty => {
                      const displayInfo = getDutyDisplayInfo(duty)
                      return (
                        <div
                          key={duty.id}
                          className="p-3 bg-surface-secondary/50 border border-surface-border rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-status-info/20 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-status-info" />
                              </div>
                              <div>
                                <p className="font-medium text-text-primary">{displayInfo.name}</p>
                                <p className="text-xs text-text-muted">{displayInfo.timeDescription}</p>
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
                    icon={<CheckCircle className="w-5 h-5 text-status-success" />}
                  />
                  <div className="space-y-2 mt-4">
                    {completedDuties.map(duty => {
                      const displayInfo = getDutyDisplayInfo(duty)
                      return (
                        <div
                          key={duty.id}
                          className="p-3 bg-status-success/5 border border-status-success/20 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 text-status-success" />
                              <div>
                                <p className="font-medium text-text-primary">{displayInfo.name}</p>
                                {duty.selectedOption && (
                                  <p className="text-xs text-text-muted line-clamp-1">
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
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-text-muted" />
                    <h3 className="text-lg font-medium text-text-primary mb-2">No Race Weekend</h3>
                    <p className="text-text-muted">
                      Media duties will appear when you have an upcoming race weekend.
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Stats & Promises */}
            <div className="space-y-6">
              {/* Season Stats */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Season Media Stats" />
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Duties Completed</span>
                    <span className="font-medium text-status-success">
                      {mediaState.dutySchedule?.completedDutiesThisSeason || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Duties Missed</span>
                    <span className="font-medium text-status-error">
                      {mediaState.dutySchedule?.missedDutiesThisSeason || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Fines Paid</span>
                    <span className="font-medium text-accent-orange">
                      ${(mediaState.dutySchedule?.finesPaidThisSeason || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Controversies</span>
                    <span className="font-medium text-status-warning">
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
                    icon={<Target className="w-5 h-5 text-accent-red" />}
                  />
                  <div className="space-y-3 mt-4">
                    {mediaState.dutySchedule?.activePromises
                      ?.filter(p => !p.fulfilled && !p.broken)
                      .map(promise => (
                        <div
                          key={promise.id}
                          className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg"
                        >
                          <p className="text-sm font-medium text-text-primary">{promise.target}</p>
                          <p className="text-xs text-text-muted mt-1">
                            Deadline: Week {promise.deadline}
                          </p>
                        </div>
                      ))}
                  </div>
                </Card>
              )}

              {/* Tips */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Media Tips" icon={<Sparkles className="w-5 h-5 text-accent-gold" />} />
                <div className="space-y-3 mt-4 text-sm text-text-muted">
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
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Main Overview */}
            <div className="col-span-2 space-y-6">
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
                  <div className="space-y-3">
                    {recentHeadlines.map((headline) => (
                      <div 
                        key={headline.id} 
                        className="p-3 bg-background/50 rounded-lg border border-surface-border hover:border-surface-secondary transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className={`font-medium ${getHeadlineSentimentColor(headline.sentiment)}`}>
                              {headline.headline}
                            </p>
                            <p className="text-xs text-text-muted mt-1">
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
                  <div className="text-center py-8 text-text-muted">
                    <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No headlines yet. Start making news!</p>
                  </div>
                )}
              </Card>

              {/* Active Controversies */}
              {activeControversies.length > 0 && (
                <Card variant="glass" padding="lg" className="border-status-error/30">
                  <CardHeader 
                    title="Active Controversies"
                    subtitle="Issues requiring your attention"
                    icon={<AlertOctagon className="w-5 h-5 text-status-error" />}
                  />
                  <div className="space-y-4">
                    {activeControversies.map((controversy) => (
                      <div 
                        key={controversy.id} 
                        className={`p-4 rounded-lg border ${getControversySeverityColor(controversy.severity)}`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h4 className="font-semibold">{controversy.headline}</h4>
                            <p className="text-sm opacity-80 mt-1">{controversy.description}</p>
                          </div>
                          <Badge variant={controversy.severity === 'critical' ? 'red' : controversy.severity === 'major' ? 'orange' : 'default'}>
                            {controversy.severity.toUpperCase()}
                          </Badge>
                        </div>
                        
                        {/* Intensity bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
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
                          <div className="flex gap-2 flex-wrap">
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
                          <p className="text-sm opacity-70">
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
                <div className="grid grid-cols-3 gap-4">
                  <Button 
                    variant="primary" 
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => setShowSocialModal(true)}
                  >
                    <Send className="w-6 h-6" />
                    <span>New Post</span>
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="h-auto py-4 flex-col gap-2"
                    onClick={() => setShowPressReleaseModal(true)}
                  >
                    <FileText className="w-6 h-6" />
                    <span>Press Release</span>
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="h-auto py-4 flex-col gap-2"
                    onClick={handleOpenEventModal}
                  >
                    <Users className="w-6 h-6" />
                    <span>Fan Event</span>
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Media Narrative */}
              <Card variant="default" padding="lg">
                <CardHeader title="Media Narrative" subtitle="How the press sees your team" />
                <div className="space-y-3">
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-sm text-text-muted mb-1">Current Story</p>
                    <p className="font-display font-semibold text-lg capitalize">
                      {mediaState.currentNarrative.current.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Strength: {mediaState.currentNarrative.strength}%
                    </p>
                  </div>
                  {mediaState.currentNarrative.factors.length > 0 && (
                    <div>
                      <p className="text-xs text-text-muted mb-2">Driving factors:</p>
                      <div className="flex flex-wrap gap-1">
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
                  <div className="space-y-3">
                    {pendingObligations.slice(0, 4).map((obligation) => (
                      <div key={obligation.id} className="p-3 bg-background rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{obligation.sponsorName}</span>
                          <Badge variant={obligation.deadline <= careerState.currentWeek + 2 ? 'red' : 'default'} size="sm">
                            Week {obligation.deadline}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-muted mb-2">{obligation.description}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent-gold transition-all"
                              style={{ width: `${(obligation.completed / obligation.required) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-muted">
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Tier</span>
                    <Badge variant="gold" size="sm" className="capitalize">{mediaState.fanClub.tier}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Satisfaction</span>
                    <span className={getSentimentColor(mediaState.fanClub.memberSatisfaction)}>
                      {mediaState.fanClub.memberSatisfaction}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Weekly Growth</span>
                    <span className={mediaState.fanClub.weeklyGrowth >= 0 ? 'text-status-success' : 'text-status-error'}>
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
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {/* Press Conferences */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Press Conferences" subtitle="Scheduled and available events" />
                <div className="space-y-4">
                  {mediaState.pressConferences.length > 0 ? (
                    mediaState.pressConferences.slice(0, 5).map((conf) => (
                      <div key={conf.id} className="p-4 bg-background/50 rounded-lg border border-surface-border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{conf.title}</h4>
                          <Badge variant={conf.completed ? 'green' : 'default'}>
                            {conf.completed ? 'Completed' : 'Scheduled'}
                          </Badge>
                        </div>
                        <p className="text-sm text-text-muted">{conf.description}</p>
                        <p className="text-xs text-text-muted mt-2">Week {conf.week}, Year {conf.year}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-text-muted">
                      <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
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

              {/* Press Releases - AI Generated */}
              <Card variant="glass" padding="lg">
                <CardHeader 
                  title="Press Releases" 
                  subtitle="AI-assisted official statements"
                />
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {PRESS_RELEASE_TYPES.slice(0, 6).map((releaseType) => (
                    <motion.button
                      key={releaseType.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOpenPressReleaseModal(releaseType.type)}
                      className="p-3 bg-background/50 hover:bg-surface-secondary rounded-lg text-center transition-all border border-transparent hover:border-surface-border"
                    >
                      <span className="text-xl block mb-1">{releaseType.icon}</span>
                      <span className="text-xs font-medium">{releaseType.name}</span>
                    </motion.button>
                  ))}
                </div>
                <div className="border-t border-surface-border pt-4">
                  <h4 className="text-sm font-medium mb-3">Recent Releases</h4>
                  <div className="space-y-3">
                    {mediaState.pressReleases.length > 0 ? (
                      mediaState.pressReleases.slice(0, 3).map((release) => (
                        <div key={release.id} className="p-3 bg-background/50 rounded-lg">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-medium text-sm">{release.headline}</h4>
                              <p className="text-xs text-text-muted mt-1">
                                {release.released ? `Released Week ${release.week}` : `Scheduled for Week ${release.embargoUntil}`}
                              </p>
                            </div>
                            <Badge variant={release.released ? 'green' : 'default'} size="sm">
                              {release.coverage.reach}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-4 text-text-muted text-sm">No press releases issued yet</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Crisis Management */}
              <Card variant="default" padding="lg" className={activeControversies.length > 0 ? 'border-status-error/30' : ''}>
                <CardHeader title="Crisis Management" subtitle="Active issues" />
                {activeControversies.length > 0 ? (
                  <div className="space-y-2">
                    {activeControversies.map((c) => (
                      <div key={c.id} className="p-2 bg-status-error/10 rounded border border-status-error/30">
                        <p className="text-sm font-medium text-status-error">{c.headline}</p>
                        <p className="text-xs text-text-muted">Intensity: {Math.round(c.currentIntensity)}%</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-status-success" />
                    <p className="text-sm text-status-success">All clear!</p>
                  </div>
                )}
              </Card>

              {/* Journalist Relations Preview */}
              <Card variant="default" padding="lg">
                <CardHeader title="Key Journalists" subtitle="Your media relationships" />
                {mediaState.journalistRelations.length > 0 ? (
                  <div className="space-y-2">
                    {mediaState.journalistRelations.slice(0, 5).map((j) => (
                      <div key={j.id} className="flex items-center justify-between p-2 bg-background rounded">
                        <div>
                          <p className="text-sm font-medium">{j.name}</p>
                          <p className="text-xs text-text-muted">{j.outlet}</p>
                        </div>
                        <div className={`text-sm font-medium ${j.relationship >= 0 ? 'text-status-success' : 'text-status-error'}`}>
                          {j.relationship >= 0 ? '+' : ''}{j.relationship}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-4">No journalist relationships yet</p>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 3: SOCIAL MEDIA */}
        {/* ============================================ */}
        <TabsContent value="social">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {/* Post Composer - AI Generated */}
              <Card variant="glass" padding="lg">
                <CardHeader 
                  title="Create Post" 
                  subtitle="AI will generate post options based on context"
                />
                <div className="grid grid-cols-4 gap-3">
                  {SOCIAL_POST_TYPES.map((postType) => (
                    <motion.button
                      key={postType.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOpenSocialPostModal(postType.type)}
                      className="p-4 bg-background/50 hover:bg-surface-secondary rounded-xl text-center transition-all border border-transparent hover:border-surface-border"
                    >
                      <span className="text-2xl block mb-2">{postType.icon}</span>
                      <span className="text-sm font-medium">{postType.name}</span>
                      <span className="text-xs text-text-muted block mt-1">{postType.description}</span>
                    </motion.button>
                  ))}
                </div>
              </Card>

              {/* Post History */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Recent Posts" subtitle="Your social media activity" />
                <div className="space-y-4">
                  {mediaState.teamSocial.postHistory.length > 0 ? (
                    mediaState.teamSocial.postHistory.slice(0, 10).map((post) => (
                      <div key={post.id} className="p-4 bg-background/50 rounded-lg">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <p className="text-sm">{post.content}</p>
                            <p className="text-xs text-text-muted mt-2">
                              Week {post.week}, Year {post.year} • <span className="capitalize">{post.tone}</span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {post.wentViral && <Badge variant="gold" size="sm">🔥 Viral</Badge>}
                            {post.hadBacklash && <Badge variant="red" size="sm">⚠️ Backlash</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-text-muted">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {post.engagement.likes.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="w-4 h-4" />
                            {post.engagement.shares.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.engagement.comments.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-text-muted">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No posts yet. Start engaging with your fans!</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Stats */}
              <Card variant="default" padding="lg">
                <CardHeader title={`@${team.name.replace(/\s+/g, '')}`} subtitle="Team Account" />
                <div className="space-y-4">
                  <div className="text-center p-4 bg-background rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-accent-gold" />
                      <span className="text-xs text-text-muted uppercase tracking-wide">Public Followers</span>
                    </div>
                    <p className="text-3xl font-display font-bold text-accent-gold">
                      {formatFollowers(mediaState.teamSocial.followers)}
                    </p>
                    <p className="text-xs text-text-muted mt-1">Anyone can follow • See public posts</p>
                    {mediaState.teamSocial.verified && (
                      <Badge variant="blue" size="sm" className="mt-2">✓ Verified</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-background rounded-lg text-center">
                      <p className="text-lg font-semibold">{mediaState.teamSocial.totalPosts}</p>
                      <p className="text-xs text-text-muted">Posts</p>
                    </div>
                    <div className="p-3 bg-background rounded-lg text-center">
                      <p className="text-lg font-semibold">{mediaState.teamSocial.engagementRate.toFixed(1)}%</p>
                      <p className="text-xs text-text-muted">Engagement</p>
                    </div>
                  </div>
                  
                  {/* Info box */}
                  <div className="p-3 bg-accent-gold/10 border border-accent-gold/20 rounded-lg">
                    <p className="text-xs text-text-muted leading-relaxed">
                      <strong className="text-accent-gold">Followers</strong> are your public audience on social media. Regular posting builds your following. High engagement can convert some followers to <strong className="text-purple-400">Fan Club Members</strong>.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Trending Topics */}
              <Card variant="default" padding="lg">
                <CardHeader title="Trending" subtitle="Popular in motorsport" />
                <div className="flex flex-wrap gap-2">
                  {['#Racing', '#Motorsport', '#TeamUpdate', '#RaceDay', '#Development', '#Fans'].map(tag => (
                    <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                  ))}
                </div>
              </Card>

              {/* Social Media Milestones */}
              <Card variant="default" padding="lg">
                <CardHeader title="Milestones" />
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {/* Follower Milestones */}
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">1K Followers</span>
                    {mediaState.teamSocial.followers >= 1000 ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">{formatFollowers(1000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">5K Followers</span>
                    {mediaState.teamSocial.followers >= 5000 ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">{formatFollowers(5000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">10K Followers</span>
                    {mediaState.teamSocial.followers >= 10000 ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">{formatFollowers(10000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">25K Followers</span>
                    {mediaState.teamSocial.followers >= 25000 ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">{formatFollowers(25000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">50K Followers</span>
                    {mediaState.teamSocial.followers >= 50000 ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">{formatFollowers(50000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">100K Followers</span>
                    {mediaState.teamSocial.followers >= 100000 ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">{formatFollowers(100000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">500K Followers</span>
                    {mediaState.teamSocial.followers >= 500000 ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">{formatFollowers(500000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">1M Followers</span>
                    {mediaState.teamSocial.followers >= 1000000 ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">{formatFollowers(1000000 - mediaState.teamSocial.followers)} to go</span>
                    )}
                  </div>
                  
                  {/* Engagement Milestones */}
                  <div className="border-t border-surface-border my-2 pt-2">
                    <p className="text-xs text-text-muted mb-2">Engagement</p>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">First Viral Post</span>
                    {mediaState.teamSocial.viralPosts > 0 ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">Locked</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">5 Viral Posts</span>
                    {mediaState.teamSocial.viralPosts >= 5 ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">{5 - mediaState.teamSocial.viralPosts} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">10 Viral Posts</span>
                    {mediaState.teamSocial.viralPosts >= 10 ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">{10 - mediaState.teamSocial.viralPosts} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">50 Posts</span>
                    {mediaState.teamSocial.totalPosts >= 50 ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">{50 - mediaState.teamSocial.totalPosts} to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">100 Posts</span>
                    {mediaState.teamSocial.totalPosts >= 100 ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">{100 - mediaState.teamSocial.totalPosts} to go</span>
                    )}
                  </div>
                  
                  {/* Account Status */}
                  <div className="border-t border-surface-border my-2 pt-2">
                    <p className="text-xs text-text-muted mb-2">Account Status</p>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">Verified Account</span>
                    {mediaState.teamSocial.verified ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">50K followers</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">5% Engagement Rate</span>
                    {mediaState.teamSocial.engagementRate >= 5 ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">{(5 - mediaState.teamSocial.engagementRate).toFixed(1)}% to go</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">10% Engagement Rate</span>
                    {mediaState.teamSocial.engagementRate >= 10 ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : (
                      <span className="text-xs text-text-muted">{(10 - mediaState.teamSocial.engagementRate).toFixed(1)}% to go</span>
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
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <Card variant="glass" padding="lg">
                <CardHeader title="Press Coverage" subtitle="All headlines about your team" />
                <div className="space-y-3">
                  {mediaState.teamHeadlines.length > 0 ? (
                    mediaState.teamHeadlines.map((headline) => (
                      <div 
                        key={headline.id} 
                        className="p-4 bg-background/50 rounded-lg border border-surface-border hover:border-surface-secondary transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className={`font-medium ${getHeadlineSentimentColor(headline.sentiment)}`}>
                              {headline.headline}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                              <span>{headline.outlet}</span>
                              <span>•</span>
                              <span className="capitalize">{headline.topic}</span>
                              <span>•</span>
                              <span>Week {headline.week}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
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
                    <div className="text-center py-12 text-text-muted">
                      <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No press coverage yet</p>
                      <p className="text-sm mt-2">Race results and team activities generate headlines</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Coverage Summary */}
              <Card variant="default" padding="lg">
                <CardHeader title="Coverage Summary" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Total Headlines</span>
                    <span className="font-semibold">{mediaState.teamHeadlines.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Positive</span>
                    <span className="font-semibold text-status-success">
                      {mediaState.teamHeadlines.filter(h => h.sentiment === 'positive').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Negative</span>
                    <span className="font-semibold text-status-error">
                      {mediaState.teamHeadlines.filter(h => h.sentiment === 'negative').length}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Journalist Relations */}
              <Card variant="default" padding="lg">
                <CardHeader title="Journalist Relations" subtitle="Build media connections" />
                {mediaState.journalistRelations.length > 0 ? (
                  <div className="space-y-3">
                    {mediaState.journalistRelations.map((journalist) => (
                      <div key={journalist.id} className="p-3 bg-background rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{journalist.name}</span>
                          <span className={`text-sm ${journalist.relationship >= 0 ? 'text-status-success' : 'text-status-error'}`}>
                            {journalist.relationship >= 0 ? '+' : ''}{journalist.relationship}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted">{journalist.outlet} • {journalist.specialty}</p>
                        {journalist.isHostile && (
                          <Badge variant="red" size="sm" className="mt-2">Hostile</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-4">
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
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {/* Driver Profiles */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Driver Media Profiles" subtitle="Manage your drivers' public image" />
                {mediaState.driverMediaProfiles.length > 0 ? (
                  <div className="space-y-4">
                    {mediaState.driverMediaProfiles.map((profile) => (
                      <div key={profile.driverId} className="p-4 bg-background/50 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">{profile.driverName}</h4>
                            <p className="text-sm text-text-muted capitalize">{profile.mediaPersonality.replace('_', ' ')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-text-muted">Followers</p>
                            <p className="font-semibold">{formatFollowers(profile.socialFollowers)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-text-muted mb-1">Marketability</p>
                            <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-accent-gold"
                                style={{ width: `${profile.marketability}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-text-muted mb-1">Media Training</p>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div 
                                  key={level}
                                  className={`w-4 h-4 rounded ${level <= profile.mediaTrainingLevel ? 'bg-status-success' : 'bg-surface-secondary'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-text-muted mb-1">Controversy Risk</p>
                            <Badge variant={profile.controversyRisk > 60 ? 'red' : profile.controversyRisk > 30 ? 'orange' : 'green'} size="sm">
                              {profile.controversyRisk}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No drivers on roster yet</p>
                  </div>
                )}
              </Card>

              {/* Interview Requests */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Interview Requests" subtitle="Pending media opportunities" />
                {mediaState.pendingInterviewRequests.length > 0 ? (
                  <div className="space-y-3">
                    {mediaState.pendingInterviewRequests.map((request) => (
                      <div key={request.id} className="p-4 bg-background/50 rounded-lg border border-surface-border">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h4 className="font-semibold">{request.outlet}</h4>
                            <p className="text-sm text-text-muted">
                              For: {request.driverName} • Topic: <span className="capitalize">{request.topic}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-status-success">${request.payment.toLocaleString()}</p>
                            <Badge variant={request.riskLevel === 'very_high' ? 'red' : request.riskLevel === 'high' ? 'orange' : 'default'} size="sm">
                              {request.riskLevel.replace('_', ' ')} risk
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => {
                              const { handleInterviewRequest } = useCareerStore.getState()
                              handleInterviewRequest(request.id, true)
                              addToast({ type: 'success', title: 'Interview approved', message: `${request.driverName} will attend`, duration: 3000 })
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
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
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No pending interview requests</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card variant="default" padding="lg">
                <CardHeader title="Media Training" subtitle="Invest in your drivers" />
                <p className="text-sm text-text-muted mb-4">
                  Better trained drivers handle interviews better and cause fewer controversies.
                </p>
                <Button variant="secondary" className="w-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade Training
                </Button>
              </Card>

              <Card variant="default" padding="lg">
                <CardHeader title="Interview Stats" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-text-muted">Total Completed</span>
                    <span className="font-semibold">{mediaState.completedInterviews.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-muted">Total Earnings</span>
                    <span className="font-semibold text-status-success">
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
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {/* Fan Sentiment Chart */}
              <Card variant="glass" padding="lg">
                <CardHeader title="Fan Sentiment" subtitle="How your fans feel about the team" />
                <div className="flex items-center gap-8 mb-6">
                  <div className="text-center">
                    <p className={`text-5xl font-display font-bold ${getSentimentColor(mediaState.fanSentiment)}`}>
                      {mediaState.fanSentiment}
                    </p>
                    <p className="text-sm text-text-muted mt-1">Current Sentiment</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-surface-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          mediaState.fanSentiment >= 70 ? 'bg-status-success' :
                          mediaState.fanSentiment >= 40 ? 'bg-status-warning' : 'bg-status-error'
                        }`}
                        style={{ width: `${mediaState.fanSentiment}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-text-muted mt-1">
                      <span>Angry</span>
                      <span>Neutral</span>
                      <span>Ecstatic</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(mediaState.fanSentimentTrend)}
                    <span className="text-sm capitalize">{mediaState.fanSentimentTrend}</span>
                  </div>
                </div>

                {/* Sentiment History */}
                {mediaState.fanSentimentHistory.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Recent Changes</p>
                    {mediaState.fanSentimentHistory.slice(-5).reverse().map((entry, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 bg-background/50 rounded">
                        <span className="text-text-muted">Week {entry.week}</span>
                        <span>{entry.reason || 'General'}</span>
                        <span className={entry.value >= 50 ? 'text-status-success' : 'text-status-error'}>
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
                      <Plus className="w-4 h-4 mr-1" />
                      Schedule Event
                    </Button>
                  }
                />
                {mediaState.fanEvents.length > 0 ? (
                  <div className="space-y-3">
                    {mediaState.fanEvents.map((event) => (
                      <div key={event.id} className="p-4 bg-background/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{event.name}</h4>
                          <Badge variant={event.completed ? 'green' : 'default'}>
                            {event.completed ? 'Completed' : `Week ${event.scheduledWeek}`}
                          </Badge>
                        </div>
                        <p className="text-sm text-text-muted">{event.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="text-text-muted">Cost: ${event.cost.toLocaleString()}</span>
                          <span className="text-status-success">+{event.effects.fanSentiment} sentiment</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <PartyPopper className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No fan events scheduled</p>
                    <p className="text-sm mt-2">Fan events boost sentiment and engagement</p>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Fan Club */}
              <Card variant="default" padding="lg">
                <CardHeader title="Fan Club" subtitle={mediaState.fanClub.tier} />
                <div className="space-y-4">
                  <div className="text-center p-4 bg-background rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-text-muted uppercase tracking-wide">Exclusive Members</span>
                    </div>
                    <p className="text-3xl font-display font-bold text-purple-400">
                      {formatFollowers(mediaState.fanClub.members)}
                    </p>
                    <p className="text-xs text-text-muted mt-1">Registered fans • Get exclusive content</p>
                  </div>
                  
                  {/* Info box explaining Fan Club vs Followers */}
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <p className="text-xs text-text-muted leading-relaxed">
                      <strong className="text-purple-400">Fan Club Members</strong> are dedicated supporters who registered for exclusive content. Unlike social media <strong className="text-accent-gold">Followers</strong>, members get behind-the-scenes access and drive merchandise sales.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Satisfaction</span>
                      <span>{mediaState.fanClub.memberSatisfaction}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Weekly Growth</span>
                      <span className={mediaState.fanClub.weeklyGrowth >= 0 ? 'text-status-success' : 'text-status-error'}>
                        {mediaState.fanClub.weeklyGrowth >= 0 ? '+' : ''}{mediaState.fanClub.weeklyGrowth}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Exclusive Content</span>
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
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Total Sales</span>
                    <span className="font-semibold">${mediaState.merchandise.totalSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">This Week</span>
                    <span className="font-semibold">${mediaState.merchandise.weeklySales.toLocaleString()}</span>
                  </div>
                  {mediaState.merchandise.popularItems.length > 0 && (
                    <div>
                      <p className="text-xs text-text-muted mb-2">Popular Items</p>
                      <div className="flex flex-wrap gap-1">
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
        }}
        title="Create Social Media Post"
        size="lg"
      >
        <div className="space-y-6">
          {/* Post Type Selection */}
          {!selectedSocialPostType ? (
            <>
              <p className="text-text-muted text-sm">Select what you want to post about. AI will generate options based on your team's current situation.</p>
              <div className="grid grid-cols-4 gap-3">
                {SOCIAL_POST_TYPES.map((postType) => (
                  <motion.button
                    key={postType.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOpenSocialPostModal(postType.type)}
                    className="p-4 bg-surface hover:bg-surface-secondary rounded-xl text-center transition-all border border-surface-border"
                  >
                    <span className="text-2xl block mb-2">{postType.icon}</span>
                    <span className="text-sm font-medium block">{postType.name}</span>
                  </motion.button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Selected Type Header */}
              <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg">
                <span className="text-3xl">{SOCIAL_POST_TYPES.find(t => t.type === selectedSocialPostType)?.icon}</span>
                <div>
                  <h4 className="font-semibold">{SOCIAL_POST_TYPES.find(t => t.type === selectedSocialPostType)?.name}</h4>
                  <p className="text-sm text-text-muted">{SOCIAL_POST_TYPES.find(t => t.type === selectedSocialPostType)?.description}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto" 
                  onClick={() => {
                    setSelectedSocialPostType(null)
                    setSocialPostOptions([])
                    setSelectedSocialOptionId(null)
                  }}
                >
                  Change
                </Button>
              </div>

              {/* Loading State */}
              {loadingSocialPosts && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-accent-red" />
                  <span className="ml-3 text-text-muted">Generating post options...</span>
                </div>
              )}

              {/* AI-Generated Options */}
              {!loadingSocialPosts && socialPostOptions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-text-muted">Select an AI-generated option to post:</p>
                  {socialPostOptions.map((option) => (
                    <motion.div
                      key={option.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedSocialOptionId(option.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedSocialOptionId === option.id 
                          ? 'border-accent-red bg-accent-red/10' 
                          : 'border-surface-border bg-surface hover:bg-surface-secondary'
                      }`}
                    >
                      <p className="text-sm mb-3">{option.content}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {option.hashtags.map((tag, i) => (
                          <span key={i} className="text-xs text-accent-red">{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <div className="flex items-center gap-4">
                          <span className="capitalize">{option.tone}</span>
                          <span>{option.includesMedia !== 'none' ? `+${option.includesMedia}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={option.effects.viralChance > 15 ? 'text-status-success' : ''}>
                            Viral: {option.effects.viralChance}%
                          </span>
                          <span className={option.effects.backlashRisk > 15 ? 'text-status-error' : ''}>
                            Risk: {option.effects.backlashRisk}%
                          </span>
                        </div>
                      </div>
                      {selectedSocialOptionId === option.id && (
                        <div className="mt-3 pt-3 border-t border-surface-border">
                          <p className="text-xs text-text-muted mb-2">Expected Effects:</p>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div>
                              <p className="text-text-muted">Followers</p>
                              <p className={option.effects.followerGain > 0 ? 'text-status-success' : 'text-status-error'}>
                                +{option.effects.followerGain}
                              </p>
                            </div>
                            <div>
                              <p className="text-text-muted">Fan Sentiment</p>
                              <p className={option.effects.fanSentiment >= 0 ? 'text-status-success' : 'text-status-error'}>
                                {option.effects.fanSentiment >= 0 ? '+' : ''}{option.effects.fanSentiment}
                              </p>
                            </div>
                            <div>
                              <p className="text-text-muted">Sponsors</p>
                              <p className={option.effects.sponsorSatisfaction >= 0 ? 'text-status-success' : 'text-status-error'}>
                                {option.effects.sponsorSatisfaction >= 0 ? '+' : ''}{option.effects.sponsorSatisfaction}
                              </p>
                            </div>
                            <div>
                              <p className="text-text-muted">Engagement</p>
                              <p className="text-accent-gold">+{option.effects.engagementBoost}%</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Regenerate / Submit */}
              {!loadingSocialPosts && socialPostOptions.length > 0 && (
                <div className="flex gap-3">
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
                    disabled={!selectedSocialOptionId}
                    onClick={handlePublishSocialPost}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Publish Post
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
        }}
        title="Issue Press Release"
        size="xl"
      >
        <div className="space-y-6">
          {/* Release Type Selection */}
          {!selectedPressReleaseType ? (
            <>
              <p className="text-text-muted text-sm">Select the type of press release. AI will draft options based on your team's situation.</p>
              <div className="grid grid-cols-3 gap-3">
                {PRESS_RELEASE_TYPES.map((releaseType) => (
                  <motion.button
                    key={releaseType.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOpenPressReleaseModal(releaseType.type)}
                    className="p-4 bg-surface hover:bg-surface-secondary rounded-xl text-center transition-all border border-surface-border"
                  >
                    <span className="text-2xl block mb-2">{releaseType.icon}</span>
                    <span className="text-sm font-medium block">{releaseType.name}</span>
                    <span className="text-xs text-text-muted block mt-1">{releaseType.description}</span>
                  </motion.button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Selected Type Header */}
              <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg">
                <span className="text-3xl">{PRESS_RELEASE_TYPES.find(t => t.type === selectedPressReleaseType)?.icon}</span>
                <div>
                  <h4 className="font-semibold">{PRESS_RELEASE_TYPES.find(t => t.type === selectedPressReleaseType)?.name}</h4>
                  <p className="text-sm text-text-muted">{PRESS_RELEASE_TYPES.find(t => t.type === selectedPressReleaseType)?.description}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto" 
                  onClick={() => {
                    setSelectedPressReleaseType(null)
                    setPressReleaseOptions([])
                    setSelectedPressReleaseId(null)
                  }}
                >
                  Change
                </Button>
              </div>

              {/* Loading State */}
              {loadingPressReleases && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-accent-red" />
                  <span className="ml-3 text-text-muted">Drafting press release options...</span>
                </div>
              )}

              {/* AI-Generated Options */}
              {!loadingPressReleases && pressReleaseOptions.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-text-muted">Select a press release draft to publish:</p>
                  {pressReleaseOptions.map((option) => (
                    <motion.div
                      key={option.id}
                      whileHover={{ scale: 1.005 }}
                      onClick={() => setSelectedPressReleaseId(option.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedPressReleaseId === option.id 
                          ? 'border-accent-red bg-accent-red/10' 
                          : 'border-surface-border bg-surface hover:bg-surface-secondary'
                      }`}
                    >
                      <h4 className="font-semibold text-lg mb-2">{option.headline}</h4>
                      <p className="text-sm text-text-muted mb-3 whitespace-pre-line">{option.content}</p>
                      <div className="p-3 bg-background/50 rounded-lg mb-3 italic text-sm">
                        "{option.quote}"
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <div className="flex items-center gap-3">
                          <span className="capitalize">{option.tone}</span>
                          <Badge variant="default" size="sm">{option.formalityLevel} formality</Badge>
                        </div>
                        <span className={option.effects.controversyRisk > 20 ? 'text-status-warning' : ''}>
                          Controversy Risk: {option.effects.controversyRisk}%
                        </span>
                      </div>
                      {selectedPressReleaseId === option.id && (
                        <div className="mt-3 pt-3 border-t border-surface-border">
                          <p className="text-xs text-text-muted mb-2">Expected Effects:</p>
                          <div className="grid grid-cols-5 gap-2 text-xs">
                            <div>
                              <p className="text-text-muted">Media Score</p>
                              <p className="text-accent-gold">+{option.effects.mediaScore}</p>
                            </div>
                            <div>
                              <p className="text-text-muted">Fan Sentiment</p>
                              <p className={option.effects.fanSentiment >= 0 ? 'text-status-success' : 'text-status-error'}>
                                {option.effects.fanSentiment >= 0 ? '+' : ''}{option.effects.fanSentiment}
                              </p>
                            </div>
                            <div>
                              <p className="text-text-muted">Sponsors</p>
                              <p className={option.effects.sponsorSatisfaction >= 0 ? 'text-status-success' : 'text-status-error'}>
                                {option.effects.sponsorSatisfaction >= 0 ? '+' : ''}{option.effects.sponsorSatisfaction}
                              </p>
                            </div>
                            <div>
                              <p className="text-text-muted">Board Mood</p>
                              <p className={option.effects.boardMood >= 0 ? 'text-status-success' : 'text-status-error'}>
                                {option.effects.boardMood >= 0 ? '+' : ''}{option.effects.boardMood}
                              </p>
                            </div>
                            <div>
                              <p className="text-text-muted">Reputation</p>
                              <p className={option.effects.reputation >= 0 ? 'text-status-success' : 'text-status-error'}>
                                {option.effects.reputation >= 0 ? '+' : ''}{option.effects.reputation}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Regenerate / Submit */}
              {!loadingPressReleases && pressReleaseOptions.length > 0 && (
                <div className="flex gap-3">
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
        <div className="space-y-6">
          <p className="text-text-muted text-sm">
            Fan events boost engagement and strengthen sponsor relationships. 
            Choose an event that fits your budget and goals.
          </p>

          {/* Loading State */}
          {loadingEvents ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent-red mb-3" />
              <p className="text-text-muted text-sm">Generating AI event options...</p>
            </div>
          ) : (
          /* Event Options */
          <div className="space-y-4">
            {eventOptions.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedEventId(event.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedEventId === event.id 
                    ? 'border-accent-red bg-accent-red/10' 
                    : 'border-surface-border bg-surface hover:bg-surface-secondary'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{event.name}</h4>
                  <Badge variant={team.budgets.cash >= event.cost ? 'green' : 'red'} size="sm">
                    ${event.cost.toLocaleString()}
                  </Badge>
                </div>
                <p className="text-sm text-text-muted mb-3">{event.description}</p>
                
                <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                  <div>
                    <p className="text-text-muted">Expected Attendance</p>
                    <p className="font-semibold">{event.expectedAttendance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Duration</p>
                    <p className="font-semibold">{event.duration}</p>
                  </div>
                  <div>
                    <p className="text-text-muted">Requires Driver</p>
                    <p className="font-semibold">{event.requiresDriver ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {event.risks.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-status-warning mb-3">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Risks: {event.risks.join(', ')}</span>
                  </div>
                )}

                {selectedEventId === event.id && (
                  <div className="pt-3 border-t border-surface-border">
                    <p className="text-xs text-text-muted mb-2">Expected Effects:</p>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <div>
                        <p className="text-text-muted">Fans</p>
                        <p className="text-status-success">+{event.effects.fanSentiment}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Followers</p>
                        <p className="text-status-success">+{event.effects.followerGain}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Sponsors</p>
                        <p className="text-status-success">+{event.effects.sponsorSatisfaction}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Morale</p>
                        <p className="text-status-success">+{event.effects.teamMorale}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Media</p>
                        <p className="text-accent-gold">+{event.effects.mediaScore}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
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
        <div className="space-y-6">
          <div className="p-4 bg-surface-secondary rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="font-medium">Fan Club: {formatFollowers(mediaState.fanClub.members)} members</p>
                <p className="text-sm text-text-muted">Satisfaction: {mediaState.fanClub.memberSatisfaction}%</p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-text-muted">
            Create exclusive content for your fan club members. Better content increases satisfaction and attracts new members.
          </p>

          {loadingExclusiveContent ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-3" />
              <p className="text-text-muted text-sm">Generating AI content options...</p>
            </div>
          ) : (
          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {exclusiveContentOptions.map((content) => (
              <motion.div
                key={content.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedExclusiveContentId(content.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedExclusiveContentId === content.id 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : 'border-surface-border bg-surface hover:bg-surface-secondary'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{content.icon}</span>
                  <h4 className="font-semibold text-sm">{content.title}</h4>
                </div>
                <p className="text-xs text-text-muted mb-3 line-clamp-2">{content.previewText}</p>
                <div className="flex items-center justify-between">
                  <Badge variant={team.budgets.cash >= content.productionCost ? 'green' : 'red'} size="sm">
                    ${content.productionCost.toLocaleString()}
                  </Badge>
                  <span className="text-xs text-status-success">+{content.effects.memberSatisfaction}% sat</span>
                </div>
                
                {selectedExclusiveContentId === content.id && (
                  <div className="mt-3 pt-3 border-t border-surface-border">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-text-muted">Satisfaction</p>
                        <p className="text-status-success">+{content.effects.memberSatisfaction}%</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Member Growth</p>
                        <p className="text-status-success">+{content.effects.memberGrowth}%</p>
                      </div>
                      <div>
                        <p className="text-text-muted">New Followers</p>
                        <p className="text-status-success">+{content.effects.followerConversion}%</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Engagement</p>
                        <p className="text-accent-gold">+{content.effects.engagementBoost}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          )}

          <div className="flex gap-3">
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
        <div className="space-y-6">
          {!conferenceInProgress ? (
            <>
              <p className="text-sm text-text-muted">
                Host a press conference to boost your media presence. Choose the format based on your risk tolerance.
              </p>

              <div className="space-y-4">
                {pressConferenceOptions.map((conf) => (
                  <motion.div
                    key={conf.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedPressConferenceId(conf.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedPressConferenceId === conf.id 
                        ? 'border-accent-red bg-accent-red/10' 
                        : 'border-surface-border bg-surface hover:bg-surface-secondary'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{conf.name}</h4>
                        <p className="text-xs text-text-muted">{conf.duration} • {conf.questions.length} questions</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={conf.difficulty === 'easy' ? 'green' : conf.difficulty === 'hard' ? 'red' : 'default'} size="sm">
                          {conf.difficulty}
                        </Badge>
                        <p className="text-xs text-text-muted mt-1">${conf.cost.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-sm text-text-muted">{conf.description}</p>
                    
                    {selectedPressConferenceId === conf.id && (
                      <div className="mt-3 pt-3 border-t border-surface-border">
                        <p className="text-xs text-text-muted mb-2">Base Media Score: +{conf.baseMediaScore}</p>
                        <p className="text-xs text-text-muted">Your answers will determine additional bonuses or penalties.</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3">
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
                  <Loader2 className="w-8 h-8 animate-spin text-accent-red mb-3" />
                  <p className="text-text-muted text-sm">AI is generating response options...</p>
                  {conferenceResults && (
                    <p className="text-xs text-text-muted mt-2">
                      Current Score: <span className="text-accent-gold">+{conferenceResults.mediaScore}</span>
                    </p>
                  )}
                </div>
              ) : currentQuestion && (
                <div className="space-y-4">
                  {/* Progress indicator */}
                  <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                    <span className="text-sm text-text-muted">
                      Question {questionIndex + 1} of {conferenceResults?.total || 0}
                    </span>
                    <Badge variant={currentQuestion.difficulty === 'hostile' ? 'red' : currentQuestion.difficulty === 'hard' ? 'orange' : 'default'}>
                      {currentQuestion.difficulty}
                    </Badge>
                  </div>
                  
                  {/* Question */}
                  <div className="p-4 bg-background rounded-lg">
                    <div className="flex items-center gap-2 mb-2 text-xs text-text-muted">
                      <span className="font-medium">{currentQuestion.journalist}</span>
                      <span>•</span>
                      <span>{currentQuestion.outlet}</span>
                    </div>
                    <p className="font-medium text-lg">"{currentQuestion.question}"</p>
                  </div>
                  
                  {/* Answer options */}
                  <div className="space-y-3">
                    {currentAnswerOptions.map((answer) => (
                      <motion.button
                        key={answer.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => handleAnswerQuestion(answer.id)}
                        className="w-full p-4 text-left rounded-lg border border-surface-border bg-surface hover:bg-surface-secondary transition-all"
                      >
                        <p className="text-sm mb-2">{answer.answer}</p>
                        <div className="flex items-center justify-between text-xs text-text-muted">
                          <span className="capitalize">{answer.tone}</span>
                          <div className="flex items-center gap-3">
                            <span className={answer.effects.controversyRisk > 20 ? 'text-status-warning' : ''}>
                              Risk: {answer.effects.controversyRisk}%
                            </span>
                            <span className="text-status-success">+{answer.effects.mediaScore} media</span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  
                  {/* Current score */}
                  {conferenceResults && (
                    <div className="text-center text-sm text-text-muted">
                      Running Media Score: <span className="font-semibold text-accent-gold">+{conferenceResults.mediaScore}</span>
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
        }}
        title={selectedDuty ? getDutyDisplayInfo(selectedDuty).name : 'Media Duty'}
        size="lg"
      >
        {selectedDuty && (
          <div className="space-y-6">
            {/* Duty Info */}
            <div className="p-4 bg-surface-secondary rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent-red/20 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-accent-red" />
                </div>
                <div>
                  <p className="font-medium text-lg">{selectedDuty.trackName}</p>
                  <p className="text-sm text-text-muted">
                    {selectedDuty.seriesName} • {getDayName(selectedDuty.day)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-text-muted text-sm">
                {getDutyConfig(selectedDuty.type)?.description}
              </p>
            </div>

            {/* Loading State */}
            {loadingOptions && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent-red" />
                <span className="ml-3 text-text-muted">Generating response options...</span>
              </div>
            )}

            {/* Response Options */}
            {!loadingOptions && dutyOptions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-text-primary">Choose Your Response</h4>
                {dutyOptions.map((option) => (
                  <motion.div
                    key={option.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedOptionId(option.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedOptionId === option.id
                        ? 'border-accent-red bg-accent-red/10'
                        : 'border-surface-border bg-surface hover:border-surface-secondary'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-text-primary">{option.content}</p>
                        <div className="flex items-center gap-2 mt-2">
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
                        <CheckCircle className="w-6 h-6 text-accent-red flex-shrink-0" />
                      )}
                    </div>
                    
                    {/* Effect Preview */}
                    <div className="mt-3 pt-3 border-t border-surface-border flex flex-wrap gap-3 text-xs">
                      {option.effects.sponsorSatisfaction !== 0 && (
                        <span className={option.effects.sponsorSatisfaction > 0 ? 'text-status-success' : 'text-status-error'}>
                          Sponsor: {option.effects.sponsorSatisfaction > 0 ? '+' : ''}{option.effects.sponsorSatisfaction}
                        </span>
                      )}
                      {option.effects.fanSentiment !== 0 && (
                        <span className={option.effects.fanSentiment > 0 ? 'text-status-success' : 'text-status-error'}>
                          Fans: {option.effects.fanSentiment > 0 ? '+' : ''}{option.effects.fanSentiment}
                        </span>
                      )}
                      {option.effects.teamMorale !== 0 && (
                        <span className={option.effects.teamMorale > 0 ? 'text-status-success' : 'text-status-error'}>
                          Team: {option.effects.teamMorale > 0 ? '+' : ''}{option.effects.teamMorale}
                        </span>
                      )}
                      {option.effects.boardMood !== 0 && (
                        <span className={option.effects.boardMood > 0 ? 'text-status-success' : 'text-status-error'}>
                          Board: {option.effects.boardMood > 0 ? '+' : ''}{option.effects.boardMood}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Skip Penalty Warning */}
            <div className="p-3 bg-status-warning/10 border border-status-warning/20 rounded-lg">
              <div className="flex items-center gap-2 text-status-warning">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Skip Penalty</span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Skipping this duty will cost ${selectedDuty.skipPenalty.fine.toLocaleString()} and reduce sponsor satisfaction by {selectedDuty.skipPenalty.sponsorSatisfaction}.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                className="flex-1"
                onClick={handleSkipDuty}
              >
                Skip Duty
              </Button>
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

function MediaStatCard({ icon, label, value, suffix, color = 'text-accent-red', trend, badge }: MediaStatCardProps) {
  return (
    <Card variant="glass" padding="md">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {trend && <div className="ml-auto">{trend}</div>}
      </div>
      <p className="text-text-muted text-sm">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className="font-display font-bold text-2xl">
          {value}
          {suffix && <span className="text-sm text-text-muted font-normal">{suffix}</span>}
        </p>
        {badge && <Badge variant="blue" size="sm" className="ml-2">{badge}</Badge>}
      </div>
    </Card>
  )
}
