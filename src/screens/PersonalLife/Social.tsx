import { Star } from 'lucide-react'
import { PageHeader } from '@/components/ui'
import { SocialPanel, SocialMediaHub } from '@/components/personal'
import { usePersonalLifeState } from './usePersonalLifeState'
import { usePersonalLifeActions } from '@/hooks/usePersonalLifeActions'

export function PersonalLifeSocial() {
  const { player, careerState, personalLifeState } = usePersonalLifeState()
  const {
    interactWithContactAction,
    askContactForFavorAction,
    respondToScandal,
    donateToFoundation,
    planGala,
    scheduleEvent,
    dismissEvent,
    resolveRivalryAction
  } = usePersonalLifeActions()

  if (!player || !careerState || !personalLifeState) return null

  const expandedState = (careerState as any).expandedPersonalLife

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social & Reputation"
        subtitle={`${player.firstName} ${player.lastName} - Public Image & Network`}
        icon={<Star className="w-6 h-6" />}
      />
      
      <SocialPanel
        personalBrand={personalLifeState.brand}
        socialContacts={personalLifeState.contacts}
        upcomingEvents={personalLifeState.upcomingEvents}
        rivalries={personalLifeState.rivalries}
        activeScandals={personalLifeState.scandals}
        charityFoundations={personalLifeState.foundations}
        socialLog={personalLifeState.socialLog}
        currentWeek={careerState.currentWeek}
        currentYear={careerState.currentYear}
        onInteractWithContact={interactWithContactAction}
        onAskContactForFavor={askContactForFavorAction}
        onRespondToScandal={respondToScandal}
        onDonateToFoundation={donateToFoundation}
        onPlanGala={planGala}
        onScheduleEvent={scheduleEvent}
        onDismissEvent={dismissEvent}
        onResolveRivalry={resolveRivalryAction}
      />
      
      {/* Social Media Deep Dive */}
      {expandedState?.socialMedia && (
        <SocialMediaHub
          socialMedia={expandedState.socialMedia}
          currentWeek={careerState.currentWeek}
          currentYear={careerState.currentYear}
          playerName={`${player.firstName} ${player.lastName}`}
        />
      )}
    </div>
  )
}

export default PersonalLifeSocial
