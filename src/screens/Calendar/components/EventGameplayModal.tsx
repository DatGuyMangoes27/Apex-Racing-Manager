/**
 * EventGameplayModal
 * Interactive gameplay modal for attending scheduled events
 * Features multi-round interactions with AI-generated content
 */

import { useState, useEffect } from 'react';
          }
        })
        return newEffects
      })
    }
    
    // Update round with selection
    const updatedRounds = [...scenario.rounds]
    updatedRounds[currentRoundIndex] = {
      ...currentRound,
      selectedChoiceId: choiceId,
      outcome: selectedChoice.effects.outcome === 'good' 
        ? 'Your response was well received.'
        : selectedChoice.effects.outcome === 'bad'
        ? 'That didn\'t go as well as hoped.'
        : 'A neutral response.'
    }
    
    setScenario({ ...scenario, rounds: updatedRounds })
    
    // Move to next round or conclusion
    setTimeout(() => {
      if (currentRoundIndex < scenario.rounds.length - 1) {
        setCurrentRoundIndex(prev => prev + 1)
      } else {
        // Calculate final outcome
        const goodChoices = selectedChoices.filter((_, i) => {
          const round = scenario.rounds[i]
          const choice = round?.choices.find(c => c.id === selectedChoices[i])
          return choice?.effects.outcome === 'good'
        }).length + (selectedChoice.effects.outcome === 'good' ? 1 : 0)
        
        const totalRounds = scenario.rounds.length
        const successRate = goodChoices / totalRounds
        
        // Combine accumulated effects with base activity effects
        if (!activity) return
        const baseEffects = activity.effectsOnComplete || {}
        const finalEffects: ActivityEffect = { ...baseEffects }
        
        // Apply accumulated modifiers
        Object.entries(accumulatedEffects).forEach(([key, value]) => {
          if (typeof value === 'number') {
            const currentValue = (baseEffects[key as keyof ActivityEffect] as number) || 0;
            (finalEffects as any)[key] = currentValue + value
          }
        })
        
        // Bonus/penalty based on overall performance
        if (successRate >= 0.75) {
          // Great performance - 25% bonus to all positive effects
          Object.entries(finalEffects).forEach(([key, value]) => {
            if (typeof value === 'number' && value > 0) {
              (finalEffects as any)[key] = Math.round(value * 1.25)
            }
          })
        } else if (successRate < 0.4) {
          // Poor performance - reduce positive effects by 50%
          Object.entries(finalEffects).forEach(([key, value]) => {
            if (typeof value === 'number' && value > 0) {
              (finalEffects as any)[key] = Math.round(value * 0.5)
            }
          })
        }
        
        // Set conclusion
        setScenario({
          ...scenario,
          rounds: updatedRounds,
          totalOutcome: {
            success: successRate >= 0.5,
            summary: successRate >= 0.75 
              ? 'Excellent! The event was a resounding success.'
              : successRate >= 0.5
              ? 'Good work. The event went well overall.'
              : 'The event had some challenges, but you got through it.',
            effects: finalEffects
          }
        })
        
        setGameState('conclusion')
      }
    }, 1500)
  }
  
  // Complete the event
  const handleComplete = () => {
    if (!activity || !scenario?.totalOutcome) return
    onComplete(activity.id, scenario.totalOutcome.effects)
    handleClose()
  }
  
  const currentRound = scenario?.rounds[currentRoundIndex]
  const CategoryIcon = activity ? getCategoryIcon(activity.category) : Building2
  const categoryColor = activity ? getCategoryColor(activity.category) : 'text-text-muted'
  
  if (!isOpen || !activity) return null
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1A1A1E] border border-surface-secondary rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-surface-secondary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center`}>
              <CategoryIcon className={`w-5 h-5 ${categoryColor}`} />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold">{activity.name}</h2>
              <p className="text-sm text-text-muted">
                {activity.configuration?.venueName || 'Team HQ'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {gameState === 'playing' && scenario && (
              <Badge variant="blue">
                Round {currentRoundIndex + 1} of {scenario.rounds.length}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {gameState === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Loader2 className="w-10 h-10 text-accent-blue animate-spin mb-4" />
                <p className="text-text-muted">Preparing event...</p>
                {isGenerating && (
                  <p className="text-xs text-text-muted mt-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent-gold" />
                    Generating unique scenario...
                  </p>
                )}
              </motion.div>
            )}
            
            {/* Intro State */}
            {gameState === 'intro' && scenario && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <CategoryIcon className={`w-16 h-16 ${categoryColor} mx-auto mb-4`} />
                  <h3 className="text-xl font-display font-bold mb-2">{activity.name}</h3>
                  <p className="text-text-muted">
                    {activity.configuration?.venueName || 'Team HQ'}
                  </p>
                </div>
                
                <Card variant="surface" padding="lg">
                  <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                    {scenario.intro}
                  </p>
                </Card>
                
                <div className="flex justify-center">
                  <Button 
                    variant="primary" 
                    onClick={() => setGameState('playing')}
                    className="min-w-[200px]"
                  >
                    Begin Event
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
            
            {/* Playing State */}
            {gameState === 'playing' && currentRound && (
              <motion.div
                key={`round-${currentRoundIndex}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                {/* Progress indicator */}
                <div className="flex gap-1">
                  {scenario?.rounds.map((_, i) => (
                    <div 
                      key={i}
                      className={`
                        flex-1 h-1.5 rounded-full transition-colors
                        ${i < currentRoundIndex ? 'bg-status-success' : ''}
                        ${i === currentRoundIndex ? 'bg-accent-blue' : ''}
                        ${i > currentRoundIndex ? 'bg-surface-secondary' : ''}
                      `}
                    />
                  ))}
                </div>
                
                {/* Situation */}
                <Card variant="surface" padding="lg">
                  <p className="text-text-secondary leading-relaxed">
                    {currentRound.situation}
                  </p>
                </Card>
                
                {/* NPC Dialogue */}
                {currentRound.npcDialogue && (
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-text-muted" />
                    </div>
                    <div className="flex-1 bg-surface-secondary/50 rounded-xl p-4">
                      {currentRound.npcName && (
                        <p className="text-sm font-medium text-accent-blue mb-1">
                          {currentRound.npcName}
                          {currentRound.npcRole && (
                            <span className="text-text-muted font-normal ml-2">
                              {currentRound.npcRole}
                            </span>
                          )}
                        </p>
                      )}
                      <p className="text-text-secondary italic">"{currentRound.npcDialogue}"</p>
                    </div>
                  </div>
                )}
                
                {/* Choices */}
                {!currentRound.selectedChoiceId ? (
                  <div className="space-y-3">
                    <p className="text-sm text-text-muted font-medium">Choose your response:</p>
                    {currentRound.choices.map((choice, idx) => (
                      <button
                        key={choice.id}
                        onClick={() => handleChoiceSelect(choice.id)}
                        className="w-full p-4 rounded-xl border-2 border-surface-secondary hover:border-accent-blue/50 
                                 bg-surface-secondary/30 hover:bg-surface-secondary/50 text-left transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center 
                                         text-xs font-bold group-hover:bg-accent-blue group-hover:text-white transition-colors">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-text-primary">{choice.text}</p>
                            <Badge 
                              variant={
                                choice.tone === 'confident' ? 'blue' :
                                choice.tone === 'diplomatic' ? 'green' :
                                choice.tone === 'honest' ? 'default' :
                                choice.tone === 'deflecting' ? 'gold' :
                                'red'
                              }
                              className="mt-2 text-xs"
                            >
                              {choice.tone}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-surface-secondary/30 border border-surface-secondary"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {currentRound.outcome?.includes('well received') ? (
                        <TrendingUp className="w-5 h-5 text-status-success" />
                      ) : currentRound.outcome?.includes('didn\'t go') ? (
                        <TrendingDown className="w-5 h-5 text-status-error" />
                      ) : (
                        <Check className="w-5 h-5 text-text-muted" />
                      )}
                      <span className="text-sm text-text-muted">{currentRound.outcome}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
            
            {/* Conclusion State */}
            {gameState === 'conclusion' && scenario?.totalOutcome && (
              <motion.div
                key="conclusion"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  {scenario.totalOutcome.success ? (
                    <Award className="w-16 h-16 text-status-success mx-auto mb-4" />
                  ) : (
                    <AlertTriangle className="w-16 h-16 text-status-warning mx-auto mb-4" />
                  )}
                  <h3 className="text-xl font-display font-bold mb-2">Event Complete</h3>
                  <p className="text-text-muted">{scenario.totalOutcome.summary}</p>
                </div>
                
                {/* Effects Summary */}
                <Card variant="surface" padding="lg">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-accent-blue" />
                    Results
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(scenario.totalOutcome.effects).map(([key, value]) => {
                      if (value === undefined || value === 0 || typeof value === 'boolean') return null
                      const isPositive = typeof value === 'number' && value > 0
                      const displayKey = key.replace(/([A-Z])/g, ' $1').trim()
                      return (
                        <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-surface-secondary/30">
                          <span className="text-sm text-text-muted capitalize">{displayKey}</span>
                          <span className={`font-bold ${isPositive ? 'text-status-success' : 'text-status-error'}`}>
                            {isPositive ? '+' : ''}{value}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </Card>
                
                <div className="flex justify-center">
                  <Button 
                    variant="primary" 
                    onClick={handleComplete}
                    className="min-w-[200px]"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Complete Event
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============================================
// FALLBACK SCENARIO GENERATORS
// ============================================

function generateSponsorFallback(activity: ScheduledActivity): EventScenario {
  const sponsorNames = activity.configuration?.guests?.sponsorReps?.map(s => s.sponsorName) || ['your sponsors']
  
  return {
    intro: `You arrive at ${activity.configuration?.venueName || 'the venue'} for ${activity.name}. Representatives from ${sponsorNames.join(', ')} are already present, ready to discuss your partnership.

The atmosphere is professional but friendly. It's important to make a good impression and reinforce the value of your partnership.`,
    rounds: [
      {
        id: 'sponsor_1',
        situation: 'The sponsor representatives greet you warmly. They ask about your recent performance and what the future holds for the team.',
        npcName: 'Sponsor Representative',
        npcRole: 'Partnership Manager',
        npcDialogue: 'We\'ve been following your progress closely. How do you see the partnership evolving this season?',
        choices: [
          {
            id: 'confident',
            text: 'We\'re building something special here. Our trajectory is only going up, and having your support makes all the difference.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { sponsorSatisfaction: 3, reputation: 1 } }
          },
          {
            id: 'diplomatic',
            text: 'We value our partnership greatly. We\'re focused on continuous improvement and making the most of every opportunity.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { sponsorSatisfaction: 2 } }
          },
          {
            id: 'honest',
            text: 'We\'ve had our challenges, but we\'re learning and adapting. Your support has been crucial through it all.',
            tone: 'honest',
            effects: { outcome: 'neutral', modifiers: { sponsorSatisfaction: 1 } }
          },
          {
            id: 'deflecting',
            text: 'Let\'s focus on the positive aspects. We have some exciting plans that I think will interest you.',
            tone: 'deflecting',
            effects: { outcome: 'neutral', modifiers: {} }
          }
        ]
      },
      {
        id: 'sponsor_2',
        situation: 'The conversation shifts to brand visibility and activation opportunities.',
        npcDialogue: 'Our marketing team has been tracking impressions. How can we maximize our brand\'s presence going forward?',
        choices: [
          {
            id: 'proactive',
            text: 'I have several ideas for joint activations - social media content, fan engagement events, and exclusive behind-the-scenes access.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { sponsorSatisfaction: 4 } }
          },
          {
            id: 'collaborative',
            text: 'I\'d love to hear your team\'s ideas too. A collaborative approach usually yields the best results.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { sponsorSatisfaction: 2, boardMood: 1 } }
          },
          {
            id: 'standard',
            text: 'We\'ll continue with our current approach - car livery, team gear, and social media mentions.',
            tone: 'honest',
            effects: { outcome: 'neutral', modifiers: { sponsorSatisfaction: 1 } }
          }
        ]
      },
      {
        id: 'sponsor_3',
        situation: 'Before the event concludes, the representative mentions they\'re reviewing partnership budgets.',
        npcDialogue: 'Budget season is coming up. Is there anything specific you need that could help performance?',
        choices: [
          {
            id: 'strategic',
            text: 'Additional development budget would help us compete at a higher level, which means more visibility for you.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { sponsorSatisfaction: 2, cash: 5000 } }
          },
          {
            id: 'grateful',
            text: 'We\'re grateful for the current support. If there\'s room to grow, we\'d use it wisely.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { sponsorSatisfaction: 3 } }
          },
          {
            id: 'modest',
            text: 'We\'re managing well with current resources. Let\'s focus on delivering results first.',
            tone: 'honest',
            effects: { outcome: 'neutral', modifiers: { boardMood: 2 } }
          }
        ]
      }
    ]
  }
}

function generateTeamFallback(activity: ScheduledActivity): EventScenario {
  return {
    intro: `The team gathers at ${activity.configuration?.venueName || 'the meeting room'} for ${activity.name}. Engineers, mechanics, and key staff are present, ready to discuss the team's direction.

This is an important opportunity to align the team and address any concerns.`,
    rounds: [
      {
        id: 'team_1',
        situation: 'The chief engineer presents recent data and asks for your input on development priorities.',
        npcName: 'Chief Engineer',
        npcDialogue: 'We have limited resources. Should we focus on fixing our weaknesses or building on our strengths?',
        choices: [
          {
            id: 'weakness',
            text: 'Let\'s address our weaknesses. We can\'t afford to have any glaring issues holding us back.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { developmentPoints: 2, teamMorale: 1 } }
          },
          {
            id: 'strength',
            text: 'Build on our strengths. Let\'s maximize what we do well and make it our competitive advantage.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { developmentPoints: 2 } }
          },
          {
            id: 'balanced',
            text: 'A balanced approach - incremental improvements across the board.',
            tone: 'diplomatic',
            effects: { outcome: 'neutral', modifiers: { developmentPoints: 1, teamMorale: 1 } }
          }
        ]
      },
      {
        id: 'team_2',
        situation: 'A team member raises concerns about workload and morale.',
        npcName: 'Team Member',
        npcDialogue: 'The pace has been intense. Some of us are feeling the pressure. How are we addressing burnout?',
        choices: [
          {
            id: 'supportive',
            text: 'Your wellbeing is a priority. Let\'s look at our schedule and find ways to ease the pressure.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { teamMorale: 5 } }
          },
          {
            id: 'motivational',
            text: 'The hard work will pay off. We\'re building something great here, and I appreciate everyone\'s dedication.',
            tone: 'confident',
            effects: { outcome: 'neutral', modifiers: { teamMorale: 2 } }
          },
          {
            id: 'direct',
            text: 'This is a competitive environment. We need to push through, but I hear your concerns.',
            tone: 'honest',
            effects: { outcome: 'bad', modifiers: { teamMorale: -2, boardMood: 1 } }
          }
        ]
      },
      {
        id: 'team_3',
        situation: 'The meeting concludes with a discussion about upcoming goals.',
        npcDialogue: 'What\'s our realistic target for the next few races?',
        choices: [
          {
            id: 'ambitious',
            text: 'We\'re going for wins. Anything less than podiums should feel like a missed opportunity.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { teamMorale: 3, boardMood: 2 } }
          },
          {
            id: 'realistic',
            text: 'Consistent points finishes. Let\'s build momentum race by race.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { teamMorale: 2, boardMood: 1 } }
          },
          {
            id: 'cautious',
            text: 'Let\'s see where we are after the next race and adjust from there.',
            tone: 'deflecting',
            effects: { outcome: 'neutral', modifiers: { teamMorale: 1 } }
          }
        ]
      }
    ]
  }
}

function generateMediaFallback(activity: ScheduledActivity): EventScenario {
  return {
    intro: `The media event is about to begin at ${activity.configuration?.venueName || 'the venue'}. Journalists and cameras are set up, ready to hear from you.

Remember: everything you say could end up in headlines. Choose your words carefully.`,
    rounds: [
      {
        id: 'media_1',
        situation: 'A journalist asks about your recent performance and expectations.',
        npcName: 'Sports Journalist',
        npcRole: 'Motorsport Weekly',
        npcDialogue: 'Your recent results have been mixed. Are you satisfied with where the team is right now?',
        choices: [
          {
            id: 'positive',
            text: 'We\'re making progress every race. The results don\'t always show it, but the data tells a positive story.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { reputation: 2, fanSentiment: 2 } }
          },
          {
            id: 'honest',
            text: 'We know we can do better. We\'re working hard to find those extra tenths.',
            tone: 'honest',
            effects: { outcome: 'good', modifiers: { reputation: 1, fanSentiment: 3 } }
          },
          {
            id: 'defensive',
            text: 'Results aren\'t everything. The competition is fierce and we\'re holding our own.',
            tone: 'deflecting',
            effects: { outcome: 'neutral', modifiers: { reputation: -1 } }
          }
        ]
      },
      {
        id: 'media_2',
        situation: 'A question comes up about a rival team\'s recent success.',
        npcDialogue: 'What do you think about [Rival Team]\'s performance this season?',
        choices: [
          {
            id: 'respectful',
            text: 'They\'ve done a great job. Credit where it\'s due. It motivates us to work harder.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { reputation: 2 } }
          },
          {
            id: 'competitive',
            text: 'They\'re doing well, but we\'re not far behind. The season is long.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { fanSentiment: 2 } }
          },
          {
            id: 'dismissive',
            text: 'We focus on ourselves. I don\'t pay much attention to what others are doing.',
            tone: 'deflecting',
            effects: { outcome: 'neutral', modifiers: {} }
          }
        ]
      },
      {
        id: 'media_3',
        situation: 'A fan question is relayed through social media.',
        npcDialogue: 'A fan asks: What message do you have for your supporters?',
        choices: [
          {
            id: 'grateful',
            text: 'Our fans are incredible. Their support keeps us going, especially during tough times. We race for them.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { fanSentiment: 5, reputation: 1 } }
          },
          {
            id: 'promise',
            text: 'Keep believing in us. We\'re working to give you something to celebrate soon.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { fanSentiment: 3 } }
          },
          {
            id: 'standard',
            text: 'Thank you for the support. We appreciate everyone who follows us.',
            tone: 'honest',
            effects: { outcome: 'neutral', modifiers: { fanSentiment: 1 } }
          }
        ]
      }
    ]
  }
}

function generateDevelopmentFallback(activity: ScheduledActivity): EventScenario {
  return {
    intro: `The ${activity.name} session begins. Engineers and technical staff are gathered, data and simulations ready for review.

This is where the car gets faster - through careful analysis and smart decisions.`,
    rounds: [
      {
        id: 'dev_1',
        situation: 'The data shows two potential development paths.',
        npcName: 'Lead Engineer',
        npcDialogue: 'We can optimize for straight-line speed or cornering. Which direction should we take?',
        choices: [
          {
            id: 'speed',
            text: 'Straight-line speed. It\'s easier to measure and defend positions.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { developmentPoints: 3 } }
          },
          {
            id: 'cornering',
            text: 'Cornering. That\'s where races are won and lost.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { developmentPoints: 3 } }
          },
          {
            id: 'balance',
            text: 'Let\'s find a balance. We need to be competitive everywhere.',
            tone: 'diplomatic',
            effects: { outcome: 'neutral', modifiers: { developmentPoints: 2 } }
          }
        ]
      },
      {
        id: 'dev_2',
        situation: 'A junior engineer proposes an unconventional approach.',
        npcDialogue: 'I have an idea that\'s a bit unorthodox, but the simulations look promising...',
        choices: [
          {
            id: 'encourage',
            text: 'Let\'s hear it. Innovation comes from trying new things.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { developmentPoints: 2, teamMorale: 3 } }
          },
          {
            id: 'cautious',
            text: 'Interesting. Let\'s run more simulations before committing.',
            tone: 'diplomatic',
            effects: { outcome: 'neutral', modifiers: { developmentPoints: 1, teamMorale: 1 } }
          },
          {
            id: 'dismiss',
            text: 'We should stick to proven methods. Too risky to experiment now.',
            tone: 'deflecting',
            effects: { outcome: 'bad', modifiers: { teamMorale: -2 } }
          }
        ]
      }
    ]
  }
}

function generatePersonalFallback(activity: ScheduledActivity): EventScenario {
  return {
    intro: `You step away from the racing world for ${activity.name}. Sometimes the best thing you can do for performance is recharge.`,
    rounds: [
      {
        id: 'personal_1',
        situation: 'You have some free time to yourself. How do you want to spend it?',
        choices: [
          {
            id: 'active',
            text: 'Hit the gym or go for a run to clear your head and build fitness.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { fitness: 3, driverMorale: 1 } }
          },
          {
            id: 'social',
            text: 'Catch up with friends or family -- quality time you rarely get during the season.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { driverMorale: 3, confidence: 2 } }
          },
          {
            id: 'relax',
            text: 'Just rest. Sleep in, watch something, and decompress completely.',
            tone: 'deflecting',
            effects: { outcome: 'good', modifiers: { driverMorale: 2, stress: -2 } }
          }
        ]
      },
      {
        id: 'personal_2',
        situation: 'An unexpected message arrives -- a former colleague wants to meet for coffee and discuss a potential opportunity.',
        choices: [
          {
            id: 'accept',
            text: 'Agree to meet. Could be a useful connection, and you\'re curious.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { reputation: 2, marketability: 1 } }
          },
          {
            id: 'postpone',
            text: 'Suggest meeting another time -- today is about you, not business.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { driverMorale: 1, stress: -1 } }
          },
          {
            id: 'decline',
            text: 'Politely decline. You need boundaries between work and personal life.',
            tone: 'deflecting',
            effects: { outcome: 'neutral', modifiers: { stress: -2 } }
          }
        ]
      }
    ]
  }
}

function generateGenericFallback(activity: ScheduledActivity): EventScenario {
  return {
    intro: `You arrive for ${activity.name}. The venue is prepared and everyone is ready to begin.`,
    rounds: [
      {
        id: 'generic_1',
        situation: 'The event begins with introductions and setting expectations.',
        choices: [
          {
            id: 'engage',
            text: 'Take an active role in leading discussions and setting the agenda.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { reputation: 1, teamMorale: 1 } }
          },
          {
            id: 'participate',
            text: 'Participate thoughtfully, listening as much as speaking.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { teamMorale: 2 } }
          },
          {
            id: 'observe',
            text: 'Take a more observational approach, speaking only when necessary.',
            tone: 'deflecting',
            effects: { outcome: 'neutral', modifiers: {} }
          }
        ]
      },
      {
        id: 'generic_2',
        situation: 'A decision needs to be made about how to proceed.',
        choices: [
          {
            id: 'decisive',
            text: 'Make a clear decision and move forward confidently.',
            tone: 'confident',
            effects: { outcome: 'good', modifiers: { boardMood: 2 } }
          },
          {
            id: 'collaborative',
            text: 'Seek input from others before deciding.',
            tone: 'diplomatic',
            effects: { outcome: 'good', modifiers: { teamMorale: 2 } }
          },
          {
            id: 'defer',
            text: 'Defer the decision for now - more information is needed.',
            tone: 'deflecting',
            effects: { outcome: 'neutral', modifiers: {} }
          }
        ]
      }
    ]
  }
}
