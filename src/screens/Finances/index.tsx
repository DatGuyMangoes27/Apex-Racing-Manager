import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, TrendingUp, PiggyBank, Receipt, Briefcase, Building2, 
  ArrowUpRight, ArrowDownRight, Check, X, Clock, Trophy, Award, 
  Star, Sparkles, RefreshCw, AlertCircle, Lock, Unlock, Filter,
  ChevronDown, Search, Globe, Wrench, Zap, Target, AlertTriangle,
  Megaphone, ShieldAlert, Mic, TrendingUp as ViralIcon, Users, History,
  Heart, MessageSquare, Share2, Ban
} from 'lucide-react'
import { Card, CardHeader, Button, Badge, PageHeader, Tabs, TabsList, TabsTrigger, TabsContent, Modal, useToast, Input, SatisfactionMeter } from '@/components/ui'
import { useCareerStore, SponsorDeal } from '@/store/careerStore'
import { useRivalStore } from '@/store/rivalStore'
import {
  calculateLivingExpenses,
  getAllSponsorsWithEligibility,
  SponsorEligibility,
  getSponsorPersonality
} from '@/simulation/finances';

const SPONSOR_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  performance: { 
    label: 'Performance', 
    color: 'text-accent-red', 
    bgColor: 'bg-accent-red/10',
    description: 'Values racing results over media presence'
  },
  lifestyle: { 
    label: 'Lifestyle', 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/10',
    description: 'Wants engagement and bold personality'
  },
  traditional: { 
    label: 'Traditional', 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/10',
    description: 'Values professionalism and avoids controversy'
  },
  fan_focused: { 
    label: 'Fan-Focused', 
    color: 'text-status-success', 
    bgColor: 'bg-status-success/10',
    description: 'Wants community engagement and accessibility'
  }
}

// Tone Labels for UI
const TONE_LABELS: Record<string, string> = {
  confident: 'Confident',
  humble: 'Humble',
  bold: 'Bold',
  diplomatic: 'Diplomatic',
  aggressive: 'Aggressive',
  deflecting: 'Deflecting'
}

export function Finances() {
  const { 
    player, 
    careerState,
    generateSponsorOffers,
    acceptSponsorDeal,
    declineSponsorDeal
  } = useCareerStore()
  const { addToast } = useToast()
  
  const [selectedOffer, setSelectedOffer] = useState<SponsorDeal | null>(null)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [isGeneratingOffers, setIsGeneratingOffers] = useState(false)
  
  // Sponsor discovery state
  const [selectedCategory, setSelectedCategory] = useState<SponsorCategory | 'all'>('all')
  const [selectedTier, setSelectedTier] = useState<SponsorTier | 'all'>('all')
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false)
  const [sponsorSearchTerm, setSponsorSearchTerm] = useState('')
  const [selectedSponsorEligibility, setSelectedSponsorEligibility] = useState<SponsorEligibility | null>(null)
  const [showSponsorDetailModal, setShowSponsorDetailModal] = useState(false)

  if (!player || !careerState) return null

  // If team owner mode, show team finances dashboard
  const ownedTeam = careerState.ownedTeam
  if (ownedTeam) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Team Finances"
          subtitle={`${ownedTeam.name} - Financial Management`}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <TeamFinancesDashboard
          team={ownedTeam}
          seriesEntries={careerState.seriesEntries || []}
          currentWeek={careerState.currentWeek}
          currentYear={careerState.currentYear}
        />
      </div>
    )
  }
  
  // Legacy driver finances below...

  const { finances } = player
  const netWorth = (finances?.bankBalance ?? 0) - (finances?.debts ?? 0)
  const transactions = finances?.transactions ?? []
  const sponsorDeals = finances?.sponsorDeals ?? []
  
  // Get real transactions (most recent first)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.week - a.week
      })
      .slice(0, 10)
  }, [transactions])
  
  // Calculate income breakdown from actual transactions
  const incomeBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {
      salary: 0,
      prize: 0,
      sponsorship: 0,
      bonus: 0,
      other: 0
    }
    
    // Sum up current year transactions
    transactions
      .filter(tx => tx.type === 'income' && tx.year === careerState?.currentYear)
      .forEach(tx => {
        const category = tx.category in breakdown ? tx.category : 'other'
        breakdown[category] += tx.amount
      })
    
    return breakdown
  }, [transactions, careerState?.currentYear])
  
  // Calculate expense breakdown from actual transactions
  const expenseBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {
      living_expenses: 0,
      equipment: 0,
      training: 0,
      seat_fee: 0,
      travel: 0,
      other: 0
    }
    
    // Map category names
    const categoryMap: Record<string, string> = {
      'living_expenses': 'living_expenses',
      'equipment': 'equipment',
      'training': 'training',
      'seat_fee': 'seat_fee',
      'travel': 'travel'
    }
    
    transactions
      .filter(tx => tx.type === 'expense' && tx.year === careerState?.currentYear)
      .forEach(tx => {
        const category = categoryMap[tx.category] || 'other'
        breakdown[category] += tx.amount
      })
    
    return breakdown
  }, [transactions, careerState?.currentYear])
  
  // Calculate monthly sponsor income
  const monthlySponsorIncome = useMemo(() => {
    return sponsorDeals
      .filter(d => d.active)
      .reduce((sum, d) => sum + d.monthlyPayment, 0)
  }, [sponsorDeals])
  
  // Calculate estimated monthly expenses
  const estimatedMonthlyExpenses = useMemo(() => {
    const living = calculateLivingExpenses(player)
    const equipment = player.currentSeriesId ? 200 : 0 // rough estimate
    return living + equipment
  }, [player])
  
  // Net monthly estimate
  const netMonthly = ((finances?.salary ?? 0) * 2) + monthlySponsorIncome - estimatedMonthlyExpenses
  
  // Get all sponsors with eligibility for the discovery grid
  const allSponsorsWithEligibility = useMemo(() => {
    const currentSeries = player.currentSeriesId 
      ? useRivalStore.getState().getSeriesById(player.currentSeriesId)
      : undefined
    
    return getAllSponsorsWithEligibility(
      player,
      currentSeries?.tier,
      player.contract?.manufacturerId,
      currentSeries?.category
    )
  }, [player, player.currentSeriesId, player.contract?.manufacturerId])
  
  // Filter sponsors based on search/filter criteria
  const filteredSponsors = useMemo(() => {
    let sponsors = allSponsorsWithEligibility
    
    // Filter by category
    if (selectedCategory !== 'all') {
      sponsors = sponsors.filter(s => s.sponsor.category === selectedCategory)
    }
    
    // Filter by tier
    if (selectedTier !== 'all') {
      sponsors = sponsors.filter(s => s.sponsor.tier === selectedTier)
    }
    
    // Filter by availability
    if (showOnlyAvailable) {
      sponsors = sponsors.filter(s => s.isEligible)
    }
    
    // Filter by search term
    if (sponsorSearchTerm.trim()) {
      const term = sponsorSearchTerm.toLowerCase()
      sponsors = sponsors.filter(s => 
        s.sponsor.name.toLowerCase().includes(term) ||
        s.sponsor.description.toLowerCase().includes(term) ||
        s.sponsor.category.toLowerCase().includes(term)
      )
    }
    
    // Exclude already active sponsors
    const activeSponsorIds = sponsorDeals.filter(d => d.active).map(d => d.sponsorId)
    sponsors = sponsors.filter(s => !activeSponsorIds.includes(s.sponsor.id))
    
    // Sort by eligibility then tier
    const tierOrder: Record<SponsorTier, number> = { entry: 0, mid: 1, high: 2, elite: 3 }
    return sponsors.sort((a, b) => {
      // Eligible sponsors first
      if (a.isEligible !== b.isEligible) {
        return a.isEligible ? -1 : 1
      }
      // Then by tier
      return tierOrder[a.sponsor.tier] - tierOrder[b.sponsor.tier]
    })
  }, [allSponsorsWithEligibility, selectedCategory, selectedTier, showOnlyAvailable, sponsorSearchTerm, sponsorDeals])
  
  // Count available and total sponsors
  const sponsorCounts = useMemo(() => {
    const activeSponsorIds = sponsorDeals.filter(d => d.active).map(d => d.sponsorId)
    const availableSponsors = allSponsorsWithEligibility.filter(s => 
      s.isEligible && !activeSponsorIds.includes(s.sponsor.id)
    )
    return {
      total: SPONSORS.length - activeSponsorIds.length,
      available: availableSponsors.length,
      active: activeSponsorIds.length
    }
  }, [allSponsorsWithEligibility, sponsorDeals])

  // Handle generating sponsor offers
  const handleFindSponsors = () => {
    setIsGeneratingOffers(true)
    
    // Small delay for UX feedback
    setTimeout(() => {
      const offers = generateSponsorOffers()
      setIsGeneratingOffers(false)
      
      if (offers.length > 0) {
        addToast({
          type: 'success',
          title: 'Sponsors Found!',
          message: `${offers.length} sponsor${offers.length > 1 ? 's are' : ' is'} interested in working with you.`,
          duration: 4000
        })
      } else {
        addToast({
          type: 'info',
          title: 'No New Sponsors',
          message: 'No sponsors are interested right now. Try improving your reputation and marketability.',
          duration: 4000
        })
      }
    }, 500)
  }
  
  // Handle accepting a sponsor deal
  const handleAcceptDeal = () => {
    if (!selectedOffer) return
    
    acceptSponsorDeal(selectedOffer.id)
    setShowOfferModal(false)
    setSelectedOffer(null)
    
    addToast({
      type: 'success',
      title: 'Sponsor Signed!',
      message: `Welcome ${selectedOffer.sponsorName} as your new sponsor! You'll receive $${selectedOffer.monthlyPayment.toLocaleString()}/month.`,
      duration: 5000
    })
    
    // Auto-save after signing sponsor
    setTimeout(() => {
      addToast({
        type: 'save',
        title: 'Auto-Saved',
        message: 'Sponsor deal recorded.',
        duration: 2000
      })
    }, 500)
  }
  
  // Handle declining a sponsor deal
  const handleDeclineDeal = () => {
    if (!selectedOffer) return
    
    declineSponsorDeal(selectedOffer.id)
    setShowOfferModal(false)
    setSelectedOffer(null)
    
    addToast({
      type: 'info',
      title: 'Offer Declined',
      message: `You declined ${selectedOffer.sponsorName}'s offer.`,
      duration: 3000
    })
  }
  
  // View sponsor offer details
  const handleViewOffer = (offer: SponsorDeal) => {
    setSelectedOffer(offer)
    setShowOfferModal(true)
  }
  
  const pendingOffers = careerState?.pendingSponsorOffers || []
  const activeSponsors = sponsorDeals.filter(d => d.active)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finances"
        subtitle="Manage your racing career finances"
        icon={<DollarSign className="w-6 h-6" />}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <FinanceStatCard
          icon={<PiggyBank className="w-5 h-5" />}
          label="Bank Balance"
          value={finances?.bankBalance ?? 0}
          color="success"
        />
        <FinanceStatCard
          icon={<Briefcase className="w-5 h-5" />}
          label="Salary"
          value={finances?.salary ?? 0}
          suffix="/race"
          color="info"
        />
        <FinanceStatCard
          icon={<Building2 className="w-5 h-5" />}
          label="Sponsor Income"
          value={monthlySponsorIncome}
          suffix="/month"
          color={monthlySponsorIncome > 0 ? 'success' : 'warning'}
        />
        <FinanceStatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Net Worth"
          value={netWorth}
          color={netWorth >= 0 ? 'success' : 'danger'}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="sponsors">
            Sponsors
            {pendingOffers.length > 0 && (
              <Badge variant="red" size="sm" className="ml-2">
                {pendingOffers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-3 gap-6">
            {/* Transaction History */}
            <div className="col-span-2">
              <Card variant="glass" padding="lg">
                <CardHeader 
                  title="Recent Transactions" 
                  subtitle={`${transactions.length} total transactions`}
                />
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((tx, index) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-background/50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center
                            ${tx.type === 'income' 
                              ? 'bg-status-success/20 text-status-success' 
                              : 'bg-status-danger/20 text-status-danger'
                            }
                          `}>
                            {tx.type === 'income' 
                              ? <ArrowUpRight className="w-5 h-5" />
                              : <ArrowDownRight className="w-5 h-5" />
                            }
                          </div>
                          <div>
                            <p className="font-medium">{tx.description}</p>
                            <p className="text-sm text-text-muted">Week {tx.week}, Year {tx.year}</p>
                          </div>
                        </div>
                        <span className={`
                          font-mono font-bold text-lg
                          ${tx.type === 'income' ? 'text-status-success' : 'text-status-danger'}
                        `}>
                          {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-text-muted">
                      <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No transactions yet</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Budget Breakdown */}
            <div className="space-y-6">
              <Card variant="racing" padding="lg">
                <CardHeader title="Monthly Budget" />
                <div className="space-y-4">
                  <BudgetItem label="Race Salary (avg)" amount={(finances?.salary ?? 0) * 2} type="income" />
                  <BudgetItem label="Sponsor Income" amount={monthlySponsorIncome} type="income" />
                  <BudgetItem label="Living Expenses" amount={-calculateLivingExpenses(player)} type="expense" />
                  <BudgetItem label="Equipment" amount={-100} type="expense" />
                  <div className="border-t border-surface-border pt-4">
                    <BudgetItem 
                      label="Net Monthly" 
                      amount={netMonthly} 
                      type={netMonthly >= 0 ? 'income' : 'expense'}
                      bold
                    />
                  </div>
                </div>
              </Card>

              <Card variant="default" padding="lg">
                <CardHeader title="Active Sponsors" />
                {activeSponsors.length > 0 ? (
                  <div className="space-y-2">
                    {activeSponsors.slice(0, 3).map(sponsor => (
                      <div key={sponsor.id} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                        <span className="font-medium text-sm">{sponsor.sponsorName}</span>
                        <span className="font-mono text-status-success text-sm">
                          ${sponsor.monthlyPayment.toLocaleString()}/mo
                        </span>
                      </div>
                    ))}
                    {activeSponsors.length > 3 && (
                      <p className="text-sm text-text-muted text-center">
                        +{activeSponsors.length - 3} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-4">
                    No active sponsors
                  </p>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="income">
          <Card variant="glass" padding="lg">
            <CardHeader 
              title="Income Sources" 
              subtitle={`Year ${careerState.currentYear} earnings`}
            />
            <div className="grid grid-cols-2 gap-4">
              <IncomeSourceCard
                title="Race Salary"
                amount={incomeBreakdown.salary}
                frequency="Per Race"
                description="Base salary from your team contract"
                icon={<Briefcase className="w-5 h-5" />}
              />
              <IncomeSourceCard
                title="Prize Money"
                amount={incomeBreakdown.prize}
                frequency="Variable"
                description="Earnings based on race results"
                icon={<Trophy className="w-5 h-5" />}
              />
              <IncomeSourceCard
                title="Sponsorships"
                amount={incomeBreakdown.sponsorship}
                frequency="Monthly"
                description="Personal sponsorship deals"
                icon={<Building2 className="w-5 h-5" />}
              />
              <IncomeSourceCard
                title="Bonuses"
                amount={incomeBreakdown.bonus}
                frequency="Performance"
                description="Win bonuses and championship rewards"
                icon={<Award className="w-5 h-5" />}
              />
            </div>
            
            <div className="mt-6 p-4 bg-status-success/10 border border-status-success/30 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Year-to-Date Income</span>
                <span className="font-mono font-bold text-2xl text-status-success">
                  ${Object.values(incomeBreakdown).reduce((a, b) => a + b, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card variant="glass" padding="lg">
            <CardHeader 
              title="Expenses" 
              subtitle={`Year ${careerState.currentYear} spending`}
            />
            <div className="grid grid-cols-2 gap-4">
              <ExpenseCard
                title="Living Expenses"
                amount={expenseBreakdown.living_expenses || 0}
                frequency="Weekly"
                description="Accommodation, food, utilities"
              />
              <ExpenseCard
                title="Equipment"
                amount={expenseBreakdown.equipment || 0}
                frequency="Weekly"
                description="Helmet, suit, gloves maintenance"
              />
              <ExpenseCard
                title="Training"
                amount={expenseBreakdown.training || 0}
                frequency="Variable"
                description="Gym, coaching, simulator time"
              />
              <ExpenseCard
                title="Seat Fees"
                amount={expenseBreakdown.seat_fee || 0}
                frequency="Per Season"
                description="Pay-driver seat costs"
              />
            </div>
            
            <div className="mt-6 p-4 bg-status-danger/10 border border-status-danger/30 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Year-to-Date Expenses</span>
                <span className="font-mono font-bold text-2xl text-status-danger">
                  -${Object.values(expenseBreakdown).reduce((a, b) => a + b, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sponsors">
          <div className="space-y-6">
            {/* Pending Offers */}
            {pendingOffers.length > 0 && (
              <Card variant="racing" padding="lg">
                <CardHeader 
                  title="Sponsor Offers" 
                  subtitle={`${pendingOffers.length} offer${pendingOffers.length > 1 ? 's' : ''} waiting for your response`}
                />
                <div className="grid grid-cols-2 gap-4">
                  {pendingOffers.map((offer, index) => (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <SponsorOfferCard 
                        offer={offer} 
                        onView={() => handleViewOffer(offer)}
                      />
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}
            
            {/* Active Sponsors */}
            {activeSponsors.length > 0 && (
              <Card variant="glass" padding="lg">
                <CardHeader 
                  title="Active Sponsorships" 
                  subtitle={`${activeSponsors.length} active sponsor${activeSponsors.length > 1 ? 's' : ''}`}
                />
                <div className="grid grid-cols-2 gap-4">
                  {activeSponsors.map((sponsor, index) => (
                    <motion.div
                      key={sponsor.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ActiveSponsorCard 
                        sponsor={sponsor} 
                        currentYear={careerState.currentYear}
                        playerReputation={player?.reputation ?? 0}
                        playerMarketability={player?.stats?.marketability ?? 0}
                      />
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}
            
            {/* Sponsor Discovery Grid */}
            <Card variant="glass" padding="lg">
              <CardHeader 
                title="Sponsor Discovery" 
                subtitle={`${sponsorCounts.available} of ${sponsorCounts.total} sponsors available to you`}
                action={
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleFindSponsors}
                    disabled={isGeneratingOffers}
                  >
                    {isGeneratingOffers ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Contacting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Contact Sponsors
                      </>
                    )}
                  </Button>
                }
              />
              
              {/* Your Profile Stats */}
              <div className="flex items-center gap-6 p-4 bg-background/50 rounded-xl mb-6">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-accent-gold" />
                  <div>
                    <span className="text-xs text-text-muted">Reputation</span>
                    <p className="font-mono font-bold">{(Math.round(player.reputation * 10) / 10).toFixed(1)}/100</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-status-info" />
                  <div>
                    <span className="text-xs text-text-muted">Marketability</span>
                    <p className="font-mono font-bold">{player.stats.marketability}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-accent-gold" />
                  <div>
                    <span className="text-xs text-text-muted">Career Wins</span>
                    <p className="font-mono font-bold">{player.totalWins}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent-blue" />
                  <div>
                    <span className="text-xs text-text-muted">Podiums</span>
                    <p className="font-mono font-bold">{player.totalPodiums}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-text-muted" />
                  <div>
                    <span className="text-xs text-text-muted">Nationality</span>
                    <p className="font-mono font-bold text-sm">{player.nationality}</p>
                  </div>
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <Input
                    value={sponsorSearchTerm}
                    onChange={(e) => setSponsorSearchTerm(e.target.value)}
                    placeholder="Search sponsors..."
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as SponsorCategory | 'all')}
                  className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(SPONSOR_CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
                
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value as SponsorTier | 'all')}
                  className="px-3 py-2 bg-surface border border-surface-border rounded-lg text-sm"
                >
                  <option value="all">All Tiers</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Tier</option>
                  <option value="high">High Tier</option>
                  <option value="elite">Elite</option>
                </select>
                
                <Button
                  variant={showOnlyAvailable ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Available Only
                </Button>
              </div>
              
              {/* Sponsor Grid */}
              <div className="grid grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredSponsors.map((eligibility, index) => (
                    <motion.div
                      key={eligibility.sponsor.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <SponsorDiscoveryCard
                        eligibility={eligibility}
                        onClick={() => {
                          setSelectedSponsorEligibility(eligibility)
                          setShowSponsorDetailModal(true)
                        }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              {filteredSponsors.length === 0 && (
                <div className="text-center py-12 text-text-muted">
                  <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No sponsors match your filters</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Sponsor Offer Detail Modal */}
      <Modal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        title="Sponsor Offer"
        size="md"
      >
        {selectedOffer && (
          <div className="space-y-6">
            {/* Sponsor Header */}
            <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
              <div className="w-14 h-14 rounded-xl bg-accent-gold/20 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-accent-gold" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl">{selectedOffer.sponsorName}</h3>
                <p className="text-text-muted">Personal Sponsorship Deal</p>
              </div>
            </div>
            
            {/* Affiliation Bonuses Applied */}
            {(selectedOffer.hasNationalityBonus || selectedOffer.hasManufacturerBonus || selectedOffer.hasSeriesBonus) && (
              <div className="flex gap-2 flex-wrap">
                {selectedOffer.hasNationalityBonus && (
                  <Badge variant="green" size="sm" className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    +20% Nationality Bonus
                  </Badge>
                )}
                {selectedOffer.hasManufacturerBonus && (
                  <Badge variant="blue" size="sm" className="flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    +20% Manufacturer Bonus
                  </Badge>
                )}
                {selectedOffer.hasSeriesBonus && (
                  <Badge variant="purple" size="sm" className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    +10% Series Bonus
                  </Badge>
                )}
              </div>
            )}
            
            {/* Deal Terms */}
            <div className="space-y-3">
              <h4 className="text-text-muted text-sm font-medium">Deal Terms</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-background rounded-lg">
                  <span className="text-text-muted text-sm">Monthly Payment</span>
                  <p className="font-mono font-bold text-xl text-status-success">
                    ${selectedOffer.monthlyPayment.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <span className="text-text-muted text-sm">Duration</span>
                  <p className="font-mono font-bold text-xl">
                    {selectedOffer.duration} Season{selectedOffer.duration > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <span className="text-text-muted text-sm">Win Bonus</span>
                  <p className="font-mono font-bold text-xl text-accent-gold">
                    +${selectedOffer.bonusPerWin.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <span className="text-text-muted text-sm">Podium Bonus</span>
                  <p className="font-mono font-bold text-xl text-accent-blue">
                    +${selectedOffer.bonusPerPodium.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Performance Targets Section */}
            {selectedOffer.targets && selectedOffer.targets.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent-gold" />
                  <h4 className="text-text-muted text-sm font-medium">Season Performance Targets</h4>
                </div>
                
                <div className="p-4 bg-surface rounded-xl space-y-2">
                  {selectedOffer.targets.map((target, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-surface-border last:border-b-0">
                      <span className="text-sm">{target.description}</span>
                      <Badge 
                        variant={target.isInverse ? 'orange' : 'blue'} 
                        size="sm"
                      >
                        {target.isInverse ? 'Max' : 'Target'}: {target.targetValue}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-start gap-2 px-2">
                  <AlertCircle className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
                  <p className="text-xs text-text-muted">
                    Meeting targets maintains sponsor satisfaction. Exceeding targets can earn bonuses.
                    Missing targets will reduce satisfaction and may affect payments.
                  </p>
                </div>
              </div>
            )}
            
            {/* Media Commitments Section (NEW) */}
            {(() => {
              const sponsorType = selectedOffer.sponsorType || 'traditional'
              const typeConfig = SPONSOR_TYPE_CONFIG[sponsorType]
              const personality = selectedOffer.personality || getSponsorPersonality(sponsorType)
              const hasMediaReqs = selectedOffer.mediaRequirements && (
                selectedOffer.mediaRequirements.shoutoutsRequired > 0 ||
                selectedOffer.mediaRequirements.noControversy ||
                selectedOffer.mediaRequirements.arrangedInterviews ||
                selectedOffer.mediaRequirements.minFollowers ||
                selectedOffer.mediaRequirements.bonusForViral
              )
              
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-purple-400" />
                      <h4 className="text-text-muted text-sm font-medium">Media Commitments</h4>
                    </div>
                    <Badge variant="outline" size="sm" className={typeConfig.color}>
                      {typeConfig.label}
                    </Badge>
                  </div>
                  
                  <div className="p-4 bg-surface rounded-xl space-y-4">
                    {/* Sponsor Type Description */}
                    <div className={`p-3 ${typeConfig.bgColor} rounded-lg`}>
                      <p className="text-xs text-text-secondary">{typeConfig.description}</p>
                    </div>
                    
                    {/* Media Requirements */}
                    {hasMediaReqs ? (
                      <div className="space-y-2">
                        {selectedOffer.mediaRequirements?.shoutoutsRequired && selectedOffer.mediaRequirements.shoutoutsRequired > 0 && (
                          <div className="flex items-center justify-between py-2 border-b border-surface-border">
                            <div className="flex items-center gap-2">
                              <Share2 className="w-4 h-4 text-accent-orange" />
                              <span className="text-sm">Sponsor Shoutouts</span>
                            </div>
                            <span className="text-sm font-mono">{selectedOffer.mediaRequirements.shoutoutsRequired}/season</span>
                          </div>
                        )}
                        
                        {selectedOffer.mediaRequirements?.arrangedInterviews && selectedOffer.mediaRequirements.arrangedInterviews > 0 && (
                          <div className="flex items-center justify-between py-2 border-b border-surface-border">
                            <div className="flex items-center gap-2">
                              <Mic className="w-4 h-4 text-status-info" />
                              <span className="text-sm">Arranged Interviews</span>
                            </div>
                            <span className="text-sm font-mono">{selectedOffer.mediaRequirements.arrangedInterviews}/season</span>
                          </div>
                        )}
                        
                        {selectedOffer.mediaRequirements?.minFollowers && (
                          <div className="flex items-center justify-between py-2 border-b border-surface-border">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-purple-400" />
                              <span className="text-sm">Minimum Followers</span>
                            </div>
                            <span className="text-sm font-mono">{(selectedOffer.mediaRequirements.minFollowers / 1000).toFixed(0)}K+</span>
                          </div>
                        )}
                        
                        {selectedOffer.mediaRequirements?.noControversy && (
                          <div className="flex items-center justify-between py-2 border-b border-surface-border">
                            <div className="flex items-center gap-2">
                              <Ban className="w-4 h-4 text-accent-red" />
                              <span className="text-sm">No Controversial Posts</span>
                            </div>
                            <Badge variant="red" size="sm">Required</Badge>
                          </div>
                        )}
                        
                        {selectedOffer.mediaRequirements?.bonusForViral && (
                          <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                              <ViralIcon className="w-4 h-4 text-status-success" />
                              <span className="text-sm">Viral Post Bonus</span>
                            </div>
                            <span className="text-sm font-mono text-status-success">+${selectedOffer.mediaRequirements.bonusForViral.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted">No specific media requirements</p>
                    )}
                    
                    {/* Preferred & Disliked Tones */}
                    <div className="pt-3 border-t border-surface-border space-y-2">
                      <p className="text-xs text-text-muted font-medium">Post Style Preferences</p>
                      <div className="flex flex-wrap gap-2">
                        {personality.preferredTones.map(tone => (
                          <Badge key={tone} variant="green" size="sm" className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {TONE_LABELS[tone] || tone}
                          </Badge>
                        ))}
                        {personality.dislikedTones.map(tone => (
                          <Badge key={tone} variant="red" size="sm" className="flex items-center gap-1">
                            <X className="w-3 h-3" />
                            {TONE_LABELS[tone] || tone}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Controversy Tolerance */}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-text-muted">Controversy Tolerance</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                personality.controversyTolerance >= 50 ? 'bg-status-success' :
                                personality.controversyTolerance >= 30 ? 'bg-accent-orange' : 'bg-accent-red'
                              }`}
                              style={{ width: `${personality.controversyTolerance}%` }}
                            />
                          </div>
                          <span className="text-xs">{personality.controversyTolerance >= 50 ? 'High' : personality.controversyTolerance >= 30 ? 'Med' : 'Low'}</span>
                        </div>
                      </div>
                      
                      {/* Engagement Focus */}
                      {personality.engagementFocus && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-purple-400">
                          <MessageSquare className="w-3 h-3" />
                          <span>Cares about engagement metrics (likes, shares, viral potential)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Contract Value Estimate */}
            <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-text-muted">Estimated Total Value</span>
                  <p className="text-xs text-text-muted">(Monthly payments only)</p>
                </div>
                <span className="font-mono font-bold text-2xl text-status-success">
                  ${(selectedOffer.monthlyPayment * 12 * selectedOffer.duration).toLocaleString()}
                </span>
              </div>
            </div>
            
            {/* Minimum Reputation Notice */}
            {player.reputation < selectedOffer.minReputation + 10 && (
              <div className="flex items-start gap-3 p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-status-warning mt-0.5" />
                <p className="text-sm text-status-warning">
                  This sponsor requires maintaining at least {selectedOffer.minReputation} reputation. 
                  If your reputation drops significantly, they may cancel the deal.
                </p>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-surface-border">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={handleDeclineDeal}
              >
                <X className="w-4 h-4 mr-2" />
                Decline
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleAcceptDeal}
              >
                <Check className="w-4 h-4 mr-2" />
                Accept Deal
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Sponsor Discovery Detail Modal */}
      <Modal
        isOpen={showSponsorDetailModal}
        onClose={() => setShowSponsorDetailModal(false)}
        title="Sponsor Details"
        size="lg"
      >
        {selectedSponsorEligibility && (
          <SponsorDetailView
            eligibility={selectedSponsorEligibility}
            player={player}
            onClose={() => setShowSponsorDetailModal(false)}
          />
        )}
      </Modal>
    </div>
  )
}

// ============================================
// Component Definitions
// ============================================

interface FinanceStatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  trend?: number
  suffix?: string
  color: 'success' | 'danger' | 'info' | 'warning'
}

function FinanceStatCard({ icon, label, value, trend, suffix, color }: FinanceStatCardProps) {
  const colorClasses = {
    success: 'text-status-success',
    danger: 'text-status-danger',
    info: 'text-status-info',
    warning: 'text-status-warning'
  }

  const bgClasses = {
    success: 'bg-status-success/20',
    danger: 'bg-status-danger/20',
    info: 'bg-status-info/20',
    warning: 'bg-status-warning/20'
  }

  return (
    <Card variant="glass" padding="md">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${bgClasses[color]} flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <Badge variant={trend >= 0 ? 'green' : 'red'} size="sm">
            {trend >= 0 ? '+' : ''}{trend.toLocaleString()}
          </Badge>
        )}
      </div>
      <p className="text-text-muted text-sm">{label}</p>
      <p className={`font-mono font-bold text-2xl ${colorClasses[color]}`}>
        ${value.toLocaleString()}
        {suffix && <span className="text-sm text-text-muted font-normal">{suffix}</span>}
      </p>
    </Card>
  )
}

interface BudgetItemProps {
  label: string
  amount: number
  type: 'income' | 'expense'
  bold?: boolean
}

function BudgetItem({ label, amount, type, bold }: BudgetItemProps) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-text-secondary ${bold ? 'font-medium' : ''}`}>{label}</span>
      <span className={`
        font-mono ${bold ? 'font-bold text-lg' : 'font-medium'}
        ${type === 'income' ? 'text-status-success' : 'text-status-danger'}
      `}>
        {type === 'income' ? '+' : '-'}${Math.abs(amount).toLocaleString()}
      </span>
    </div>
  )
}

interface IncomeSourceCardProps {
  title: string
  amount: number
  frequency: string
  description: string
  icon?: React.ReactNode
}

function IncomeSourceCard({ title, amount, frequency, description, icon }: IncomeSourceCardProps) {
  return (
    <div className="p-4 bg-background/50 rounded-xl border border-surface-border">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-status-success">{icon}</span>}
          <h4 className="font-medium">{title}</h4>
        </div>
        <Badge variant="green" size="sm">{frequency}</Badge>
      </div>
      <p className="font-mono font-bold text-2xl text-status-success mb-2">
        ${amount.toLocaleString()}
      </p>
      <p className="text-sm text-text-muted">{description}</p>
    </div>
  )
}

function ExpenseCard({ title, amount, frequency, description }: Omit<IncomeSourceCardProps, 'icon'>) {
  return (
    <div className="p-4 bg-background/50 rounded-xl border border-surface-border">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium">{title}</h4>
        <Badge variant="default" size="sm">{frequency}</Badge>
      </div>
      <p className="font-mono font-bold text-2xl text-status-danger mb-2">
        -${amount.toLocaleString()}
      </p>
      <p className="text-sm text-text-muted">{description}</p>
    </div>
  )
}

interface SponsorOfferCardProps {
  offer: SponsorDeal
  onView: () => void
}

function SponsorOfferCard({ offer, onView }: SponsorOfferCardProps) {
  return (
    <Card variant="default" padding="md" hoverable className="cursor-pointer" onClick={onView}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-gold/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-accent-gold" />
          </div>
          <div>
            <h4 className="font-medium">{offer.sponsorName}</h4>
            <p className="text-sm text-text-muted">{offer.duration} season deal</p>
          </div>
        </div>
        <Badge variant="orange" size="sm">New</Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-text-muted">Monthly</p>
          <p className="font-mono font-bold text-status-success">${offer.monthlyPayment.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Win</p>
          <p className="font-mono font-bold text-accent-gold">+${offer.bonusPerWin.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Podium</p>
          <p className="font-mono font-bold text-accent-blue">+${offer.bonusPerPodium.toLocaleString()}</p>
        </div>
      </div>
      
      <Button variant="secondary" className="w-full mt-3" size="sm">
        View Details
      </Button>
    </Card>
  )
}

interface ActiveSponsorCardProps {
  sponsor: SponsorDeal
  currentYear: number
  playerReputation: number
  playerMarketability: number
}

function ActiveSponsorCard({ sponsor, currentYear, playerReputation, playerMarketability }: ActiveSponsorCardProps) {
  const yearsRemaining = (sponsor.startYear + sponsor.duration) - currentYear
  const [showTargets, setShowTargets] = useState(false)
  const [showMediaRequirements, setShowMediaRequirements] = useState(false)
  const [showSentimentHistory, setShowSentimentHistory] = useState(false)
  const [_showRequirements, _setShowRequirements] = useState(false)
  const [showPersonality, setShowPersonality] = useState(false)
  
  // Get satisfaction and payment modifier
  const satisfaction = sponsor.satisfaction ?? 70
  const paymentModifier = getPaymentModifier(satisfaction)
  const hasTargets = sponsor.targets && sponsor.targets.length > 0
  const hasMediaRequirements = sponsor.mediaRequirements && (
    sponsor.mediaRequirements.shoutoutsRequired > 0 ||
    sponsor.mediaRequirements.noControversy ||
    (sponsor.mediaRequirements.arrangedInterviews && sponsor.mediaRequirements.arrangedInterviews > 0) ||
    sponsor.mediaRequirements.bonusForViral
  )
  const hasSentimentHistory = sponsor.satisfactionHistory && sponsor.satisfactionHistory.length > 0
  const isWarning = satisfaction < 60
  const isCritical = satisfaction < 40
  
  // Check if player meets requirements
  const meetsReputation = playerReputation >= sponsor.minReputation
  const meetsMarketability = !sponsor.minMarketability || playerMarketability >= sponsor.minMarketability
  const hasRequirements = sponsor.minReputation > 0 || (sponsor.minMarketability && sponsor.minMarketability > 0)
  
  // Calculate actual payments with modifier
  const effectiveMonthly = Math.round(sponsor.monthlyPayment * paymentModifier)
  const effectiveWinBonus = Math.round(sponsor.bonusPerWin * paymentModifier)
  const effectivePodiumBonus = Math.round(sponsor.bonusPerPodium * paymentModifier)
  
  return (
    <Card variant="glass" padding="md" className={isCritical ? 'border-red-500/50' : isWarning ? 'border-amber-500/30' : ''}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isCritical ? 'bg-red-500/20' : isWarning ? 'bg-amber-500/20' : 'bg-status-success/20'
          }`}>
            {isCritical ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : isWarning ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : (
              <Check className="w-5 h-5 text-status-success" />
            )}
          </div>
          <div>
            <h4 className="font-medium">{sponsor.sponsorName}</h4>
            <div className="flex items-center gap-1 text-sm text-text-muted">
              <Clock className="w-3 h-3" />
              <span>{yearsRemaining} season{yearsRemaining !== 1 ? 's' : ''} remaining</span>
            </div>
          </div>
        </div>
        <Badge variant={isCritical ? 'red' : isWarning ? 'yellow' : 'green'} size="sm">
          {isCritical ? 'At Risk' : isWarning ? 'Warning' : 'Active'}
        </Badge>
      </div>
      
      {/* Satisfaction Meter */}
      <div className="mb-3">
        <SatisfactionMeter 
          satisfaction={satisfaction} 
          size="sm" 
          showLabel={true}
          showValue={true}
        />
      </div>
      
      {/* Satisfaction Thresholds Info */}
      <div className="mb-3 p-2 bg-black/20 rounded-lg">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-text-muted">Thresholds:</span>
          <div className="flex gap-2">
            <span className={satisfaction >= 40 ? 'text-amber-400' : 'text-red-400'}>
              ⚠️ 40% Warning
            </span>
            <span className={satisfaction >= 20 ? 'text-red-400' : 'text-red-600 font-bold'}>
              ❌ 20% Termination
            </span>
          </div>
        </div>
        {/* Requirements Status */}
        {hasRequirements && (
          <div className="border-t border-white/10 pt-2 mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Min Reputation:</span>
              <span className={meetsReputation ? 'text-green-400' : 'text-red-400'}>
                {sponsor.minReputation}% {meetsReputation ? '✓' : '✗'} 
                <span className="text-text-muted ml-1">(You: {playerReputation}%)</span>
              </span>
            </div>
            {sponsor.minMarketability && sponsor.minMarketability > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Min Marketability:</span>
                <span className={meetsMarketability ? 'text-green-400' : 'text-red-400'}>
                  {sponsor.minMarketability}% {meetsMarketability ? '✓' : '✗'}
                  <span className="text-text-muted ml-1">(You: {playerMarketability}%)</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Affiliation Bonuses */}
      {(sponsor.hasNationalityBonus || sponsor.hasManufacturerBonus || sponsor.hasSeriesBonus) && (
        <div className="flex gap-1 flex-wrap mb-3">
          {sponsor.hasNationalityBonus && (
            <Badge variant="green" size="sm" className="text-xs">
              <Globe className="w-3 h-3 mr-1" />+20%
            </Badge>
          )}
          {sponsor.hasManufacturerBonus && (
            <Badge variant="blue" size="sm" className="text-xs">
              <Wrench className="w-3 h-3 mr-1" />+20%
            </Badge>
          )}
          {sponsor.hasSeriesBonus && (
            <Badge variant="purple" size="sm" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />+10%
            </Badge>
          )}
        </div>
      )}
      
      {/* Payment Info - with modifier indicator */}
      <div className="grid grid-cols-3 gap-2 text-center p-2 bg-background/50 rounded-lg mb-3">
        <div>
          <p className="text-xs text-text-muted">Monthly</p>
          <p className={`font-mono font-bold ${paymentModifier < 1 ? 'text-amber-400' : paymentModifier > 1 ? 'text-green-400' : 'text-status-success'}`}>
            ${effectiveMonthly.toLocaleString()}
          </p>
          {paymentModifier !== 1 && (
            <p className="text-[10px] text-text-muted line-through">${sponsor.monthlyPayment.toLocaleString()}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-text-muted">Win</p>
          <p className={`font-mono font-bold ${paymentModifier < 1 ? 'text-amber-400' : paymentModifier > 1 ? 'text-green-400' : 'text-accent-gold'}`}>
            +${effectiveWinBonus.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Podium</p>
          <p className={`font-mono font-bold ${paymentModifier < 1 ? 'text-amber-400' : paymentModifier > 1 ? 'text-green-400' : 'text-accent-blue'}`}>
            +${effectivePodiumBonus.toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* Performance Targets Section */}
      {hasTargets && (
        <div className="border-t border-white/10 pt-3">
          <button
            onClick={() => setShowTargets(!showTargets)}
            className="flex items-center justify-between w-full text-sm text-text-muted hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Performance Targets ({sponsor.targets!.filter(t => t.met).length}/{sponsor.targets!.length})
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showTargets ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showTargets && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  {sponsor.targets!.map((target) => (
                    <TargetProgressItem key={target.id} target={target} />
                  ))}
                </div>
                
                {/* Season Stats */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <p className="text-text-muted">Wins</p>
                      <p className="font-bold text-accent-gold">{sponsor.seasonWins ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-text-muted">Podiums</p>
                      <p className="font-bold text-accent-blue">{sponsor.seasonPodiums ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-text-muted">Races</p>
                      <p className="font-bold">{sponsor.seasonRacesStarted ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-text-muted">DNFs</p>
                      <p className={`font-bold ${(sponsor.seasonDNFs ?? 0) > 2 ? 'text-red-400' : ''}`}>{sponsor.seasonDNFs ?? 0}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Media Requirements Section */}
      {hasMediaRequirements && (
        <div className="border-t border-white/10 pt-3">
          <button
            onClick={() => setShowMediaRequirements(!showMediaRequirements)}
            className="flex items-center justify-between w-full text-sm text-text-muted hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Media Commitments
              {sponsor.sponsorType && (
                <Badge 
                  variant={
                    sponsor.sponsorType === 'lifestyle' ? 'purple' :
                    sponsor.sponsorType === 'performance' ? 'blue' :
                    sponsor.sponsorType === 'fan_focused' ? 'orange' :
                    'default'
                  } 
                  size="sm" 
                  className="text-[10px]"
                >
                  {sponsor.sponsorType.replace('_', ' ')}
                </Badge>
              )}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showMediaRequirements ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showMediaRequirements && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  {/* Shoutouts Progress */}
                  {sponsor.mediaRequirements!.shoutoutsRequired > 0 && (
                    <div className="bg-black/30 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Megaphone className="w-3 h-3" />
                          Social Media Shoutouts
                        </span>
                        <span className="text-xs font-mono">
                          {sponsor.mediaRequirements!.shoutoutsCompleted ?? 0}/{sponsor.mediaRequirements!.shoutoutsRequired}
                        </span>
                      </div>
                      <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-accent-orange"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${Math.min(100, ((sponsor.mediaRequirements!.shoutoutsCompleted ?? 0) / sponsor.mediaRequirements!.shoutoutsRequired) * 100)}%` 
                          }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Arranged Interviews */}
                  {sponsor.mediaRequirements!.arrangedInterviews && sponsor.mediaRequirements!.arrangedInterviews > 0 && (
                    <div className="bg-black/30 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Mic className="w-3 h-3" />
                          Sponsor Interviews
                        </span>
                        <span className="text-xs font-mono">
                          {sponsor.mediaRequirements!.arrangedInterviewsCompleted ?? 0}/{sponsor.mediaRequirements!.arrangedInterviews}
                        </span>
                      </div>
                      <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-accent-blue"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${Math.min(100, ((sponsor.mediaRequirements!.arrangedInterviewsCompleted ?? 0) / sponsor.mediaRequirements!.arrangedInterviews!) * 100)}%` 
                          }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* No Controversy Clause */}
                  {sponsor.mediaRequirements!.noControversy && (
                    <div className="bg-black/30 rounded-lg p-2 flex items-center justify-between">
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        No Controversy Clause
                      </span>
                      <Badge variant="red" size="sm" className="text-[10px]">Active</Badge>
                    </div>
                  )}

                  {/* Min Followers Requirement */}
                  {sponsor.mediaRequirements!.minFollowers && (
                    <div className="bg-black/30 rounded-lg p-2 flex items-center justify-between">
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Min Followers Required
                      </span>
                      <span className="text-xs font-mono text-accent-cyan">
                        {(sponsor.mediaRequirements!.minFollowers / 1000).toFixed(0)}K+
                      </span>
                    </div>
                  )}

                  {/* Viral Bonus */}
                  {sponsor.mediaRequirements!.bonusForViral && sponsor.mediaRequirements!.bonusForViral > 0 && (
                    <div className="bg-black/30 rounded-lg p-2 flex items-center justify-between">
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <ViralIcon className="w-3 h-3" />
                        Viral Post Bonus
                      </span>
                      <span className="text-xs font-mono text-accent-gold">
                        +${sponsor.mediaRequirements!.bonusForViral.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Sentiment History Section */}
      {hasSentimentHistory && (
        <div className="border-t border-white/10 pt-3">
          <button
            onClick={() => setShowSentimentHistory(!showSentimentHistory)}
            className="flex items-center justify-between w-full text-sm text-text-muted hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Sentiment History ({sponsor.satisfactionHistory!.length})
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showSentimentHistory ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showSentimentHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {[...sponsor.satisfactionHistory!].reverse().map((entry, index) => (
                    <div 
                      key={`${entry.week}-${entry.year}-${index}`}
                      className="bg-black/30 rounded-lg p-2"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-muted">
                          Week {entry.week}, Year {entry.year}
                        </span>
                        <span className={`text-xs font-mono font-bold ${
                          entry.newValue > entry.oldValue ? 'text-green-400' : 
                          entry.newValue < entry.oldValue ? 'text-red-400' : 
                          'text-text-muted'
                        }`}>
                          {entry.newValue > entry.oldValue ? '+' : ''}{entry.newValue - entry.oldValue}%
                          <span className="text-text-muted ml-1">
                            ({entry.oldValue}→{entry.newValue})
                          </span>
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary truncate">{entry.reason}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      {/* Sponsor Personality Section */}
      {sponsor.personality && (
        <div className="border-t border-white/10 pt-3">
          <button
            onClick={() => setShowPersonality(!showPersonality)}
            className="flex items-center justify-between w-full text-sm text-text-muted hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Sponsor Preferences
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showPersonality ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showPersonality && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3">
                  {/* Preferred Tones */}
                  <div className="bg-black/30 rounded-lg p-2">
                    <p className="text-xs text-text-muted mb-2">Preferred Post Tones:</p>
                    <div className="flex flex-wrap gap-1">
                      {sponsor.personality.preferredTones.map(tone => (
                        <Badge key={tone} variant="green" size="sm" className="text-[10px]">
                          ✓ {TONE_LABELS[tone] || tone}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Disliked Tones */}
                  <div className="bg-black/30 rounded-lg p-2">
                    <p className="text-xs text-text-muted mb-2">Disliked Post Tones:</p>
                    <div className="flex flex-wrap gap-1">
                      {sponsor.personality.dislikedTones.map(tone => (
                        <Badge key={tone} variant="red" size="sm" className="text-[10px]">
                          ✗ {TONE_LABELS[tone] || tone}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Controversy Tolerance */}
                  <div className="bg-black/30 rounded-lg p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-muted">Controversy Tolerance</span>
                      <span className={`text-xs font-bold ${
                        sponsor.personality.controversyTolerance >= 50 ? 'text-status-success' :
                        sponsor.personality.controversyTolerance >= 30 ? 'text-accent-orange' : 'text-accent-red'
                      }`}>
                        {sponsor.personality.controversyTolerance >= 50 ? 'High' : 
                         sponsor.personality.controversyTolerance >= 30 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                    <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          sponsor.personality.controversyTolerance >= 50 ? 'bg-status-success' :
                          sponsor.personality.controversyTolerance >= 30 ? 'bg-accent-orange' : 'bg-accent-red'
                        }`}
                        style={{ width: `${sponsor.personality.controversyTolerance}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Engagement Focus */}
                  <div className="bg-black/30 rounded-lg p-2 flex items-center justify-between">
                    <span className="text-xs text-text-muted">Cares About Engagement</span>
                    <Badge 
                      variant={sponsor.personality.engagementFocus ? 'green' : 'default'} 
                      size="sm" 
                      className="text-[10px]"
                    >
                      {sponsor.personality.engagementFocus ? 'Yes - Viral posts matter!' : 'No'}
                    </Badge>
                  </div>
                  
                  {/* Preferred Post Types */}
                  {sponsor.personality.preferredPostTypes.length > 0 && (
                    <div className="bg-black/30 rounded-lg p-2">
                      <p className="text-xs text-text-muted mb-2">Preferred Content:</p>
                      <div className="flex flex-wrap gap-1">
                        {sponsor.personality.preferredPostTypes.slice(0, 4).map(type => (
                          <Badge key={type} variant="outline" size="sm" className="text-[10px] text-status-success border-status-success/30">
                            {type.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Disliked Post Types */}
                  {sponsor.personality.dislikedPostTypes.length > 0 && (
                    <div className="bg-black/30 rounded-lg p-2">
                      <p className="text-xs text-text-muted mb-2">Avoid This Content:</p>
                      <div className="flex flex-wrap gap-1">
                        {sponsor.personality.dislikedPostTypes.slice(0, 4).map(type => (
                          <Badge key={type} variant="outline" size="sm" className="text-[10px] text-accent-red border-accent-red/30">
                            {type.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Card>
  )
}

/**
 * Individual target progress display
 */
function TargetProgressItem({ target }: { target: SponsorTarget }) {
  const progress = getTargetProgressPercentage(target)
  const progressString = getTargetProgressString(target)
  
  // Determine color based on status
  const getStatusColor = () => {
    if (target.exceeded) return '#22c55e' // Green for exceeded
    if (target.met) return '#3b82f6' // Blue for met
    if (progress < 50) return '#ef4444' // Red if struggling
    return '#f59e0b' // Amber for in progress
  }
  
  const color = getStatusColor()
  
  return (
    <div className="bg-black/30 rounded-lg p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-muted truncate flex-1 mr-2">{target.description}</span>
        {target.exceeded ? (
          <Badge variant="green" size="sm" className="text-[10px]">Exceeded!</Badge>
        ) : target.met ? (
          <Badge variant="blue" size="sm" className="text-[10px]">Complete</Badge>
        ) : (
          <span className="text-xs text-text-muted">{progressString}</span>
        )}
      </div>
      <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ============================================
// Sponsor Discovery Components
// ============================================

interface SponsorDiscoveryCardProps {
  eligibility: SponsorEligibility
  onClick: () => void
}

function SponsorDiscoveryCard({ eligibility, onClick }: SponsorDiscoveryCardProps) {
  const { sponsor, isEligible, payment, bonuses } = eligibility
  const tierColors: Record<SponsorTier, string> = {
    entry: 'border-gray-500/30 bg-gray-500/5',
    mid: 'border-blue-500/30 bg-blue-500/5',
    high: 'border-purple-500/30 bg-purple-500/5',
    elite: 'border-accent-gold/30 bg-accent-gold/5'
  }
  const tierLabels: Record<SponsorTier, string> = {
    entry: 'Entry',
    mid: 'Mid',
    high: 'High',
    elite: 'Elite'
  }
  const categoryInfo = SPONSOR_CATEGORIES[sponsor.category]
  
  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border cursor-pointer transition-all
        ${tierColors[sponsor.tier]}
        ${isEligible 
          ? 'hover:border-status-success/50 hover:shadow-lg hover:shadow-status-success/10' 
          : 'opacity-60 hover:opacity-80'
        }
      `}
    >
      {/* Lock Overlay */}
      {!isEligible && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl">
          <div className="text-center">
            <Lock className="w-6 h-6 mx-auto text-text-muted mb-1" />
            <span className="text-xs text-text-muted">Locked</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{categoryInfo.icon}</span>
          <div>
            <h4 className="font-medium text-sm leading-tight">{sponsor.name}</h4>
            <p className="text-xs text-text-muted">{sponsor.country}</p>
          </div>
        </div>
        <Badge 
          variant={sponsor.tier === 'elite' ? 'yellow' : sponsor.tier === 'high' ? 'purple' : 'default'} 
          size="sm"
        >
          {tierLabels[sponsor.tier]}
        </Badge>
      </div>
      
      {/* Affiliation Badges */}
      {isEligible && (bonuses.nationality || bonuses.manufacturer || bonuses.series) && (
        <div className="flex gap-1 mb-3">
          {bonuses.nationality && (
            <div className="w-5 h-5 rounded-full bg-status-success/20 flex items-center justify-center" title="Nationality Bonus +20%">
              <Globe className="w-3 h-3 text-status-success" />
            </div>
          )}
          {bonuses.manufacturer && (
            <div className="w-5 h-5 rounded-full bg-status-info/20 flex items-center justify-center" title="Manufacturer Bonus +20%">
              <Wrench className="w-3 h-3 text-status-info" />
            </div>
          )}
          {bonuses.series && (
            <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center" title="Series Bonus +10%">
              <Zap className="w-3 h-3 text-purple-400" />
            </div>
          )}
        </div>
      )}
      
      {/* Payment Summary */}
      <div className="grid grid-cols-3 gap-1 text-center text-xs">
        <div>
          <p className="text-text-muted">Monthly</p>
          <p className="font-mono font-bold text-status-success">${payment.monthly.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-text-muted">Win</p>
          <p className="font-mono font-bold text-accent-gold">+${payment.winBonus.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-text-muted">Podium</p>
          <p className="font-mono font-bold text-accent-blue">+${payment.podiumBonus.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

interface SponsorDetailViewProps {
  eligibility: SponsorEligibility
  player: {
    reputation: number
    stats: { marketability: number }
    totalWins: number
    totalPodiums: number
    totalRaces: number
    championships: number
    nationality: string
  }
  onClose: () => void
}

function SponsorDetailView({ eligibility, _player, _onClose }: SponsorDetailViewProps) {
  const { sponsor, isEligible, requirements, payment, bonuses } = eligibility
  const categoryInfo = SPONSOR_CATEGORIES[sponsor.category]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-surface-highlight to-surface flex items-center justify-center text-3xl">
          {categoryInfo.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-display font-bold text-xl">{sponsor.name}</h3>
            {isEligible ? (
              <Badge variant="green" size="sm">
                <Unlock className="w-3 h-3 mr-1" />
                Available
              </Badge>
            ) : (
              <Badge variant="default" size="sm">
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </Badge>
            )}
          </div>
          <p className="text-text-muted text-sm">{sponsor.description}</p>
          <p className="text-xs text-text-muted mt-1">{categoryInfo.name} • {sponsor.country}</p>
        </div>
      </div>
      
      {/* Affiliation Bonuses */}
      {(bonuses.nationality || bonuses.manufacturer || bonuses.series) && (
        <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl">
          <h4 className="text-sm font-medium mb-2 text-status-success">✨ Your Affiliation Bonuses</h4>
          <div className="flex gap-3">
            {bonuses.nationality && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-status-success" />
                <span>+20% Nationality Match</span>
              </div>
            )}
            {bonuses.manufacturer && (
              <div className="flex items-center gap-2 text-sm">
                <Wrench className="w-4 h-4 text-status-info" />
                <span>+20% Manufacturer Match</span>
              </div>
            )}
            {bonuses.series && (
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>+10% Series Match</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Payment Details */}
      <div>
        <h4 className="text-sm font-medium text-text-muted mb-3">Payment Structure (with bonuses applied)</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-background rounded-xl text-center">
            <p className="text-xs text-text-muted mb-1">Monthly Payment</p>
            <p className="font-mono font-bold text-2xl text-status-success">
              ${payment.monthly.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-background rounded-xl text-center">
            <p className="text-xs text-text-muted mb-1">Win Bonus</p>
            <p className="font-mono font-bold text-2xl text-accent-gold">
              +${payment.winBonus.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-background rounded-xl text-center">
            <p className="text-xs text-text-muted mb-1">Podium Bonus</p>
            <p className="font-mono font-bold text-2xl text-accent-blue">
              +${payment.podiumBonus.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      
      {/* Requirements Checklist */}
      <div>
        <h4 className="text-sm font-medium text-text-muted mb-3">Requirements</h4>
        <div className="space-y-2">
          {requirements.map((req, index) => (
            <div 
              key={index}
              className={`
                flex items-center justify-between p-3 rounded-lg
                ${req.met ? 'bg-status-success/10' : 'bg-status-danger/10'}
              `}
            >
              <div className="flex items-center gap-3">
                {req.met ? (
                  <Check className="w-5 h-5 text-status-success" />
                ) : (
                  <X className="w-5 h-5 text-status-danger" />
                )}
                <span className="font-medium">{req.label}</span>
              </div>
              <div className="text-right text-sm">
                <span className={req.met ? 'text-status-success' : 'text-status-danger'}>
                  {req.current}
                </span>
                <span className="text-text-muted"> / {req.required}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Possible Affiliation Bonuses (if not applied) */}
      {(sponsor.nationalityBonus?.length || sponsor.manufacturerBonus?.length || sponsor.seriesBonus?.length) && 
       !bonuses.nationality && !bonuses.manufacturer && !bonuses.series && (
        <div className="p-4 bg-surface border border-surface-border rounded-xl">
          <h4 className="text-sm font-medium mb-3">Possible Affiliation Bonuses</h4>
          <div className="space-y-2 text-sm text-text-muted">
            {sponsor.nationalityBonus?.length ? (
              <p>
                <Globe className="w-4 h-4 inline mr-2" />
                +20% for {sponsor.nationalityBonus.join(', ')} drivers
              </p>
            ) : null}
            {sponsor.manufacturerBonus?.length ? (
              <p>
                <Wrench className="w-4 h-4 inline mr-2" />
                +20% when driving for {sponsor.manufacturerBonus.join(', ')}
              </p>
            ) : null}
            {sponsor.seriesBonus?.length ? (
              <p>
                <Zap className="w-4 h-4 inline mr-2" />
                +10% when racing in {sponsor.seriesBonus.join(', ')} series
              </p>
            ) : null}
          </div>
        </div>
      )}
      
      {/* Estimated Value */}
      <div className="p-4 bg-gradient-to-r from-accent-gold/10 to-accent-blue/10 border border-accent-gold/30 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-text-muted">Estimated Annual Value</span>
            <p className="text-xs text-text-muted">(12 months + estimated bonuses)</p>
          </div>
          <span className="font-mono font-bold text-2xl text-accent-gold">
            ${(payment.monthly * 12 + payment.winBonus * 2 + payment.podiumBonus * 5).toLocaleString()}
          </span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="pt-4 border-t border-surface-border">
        {isEligible ? (
          <p className="text-center text-sm text-text-muted">
            Click "Contact Sponsors" to receive offers from available sponsors like this one.
          </p>
        ) : (
          <p className="text-center text-sm text-status-danger">
            You don't meet all requirements for this sponsor yet. Keep improving!
          </p>
        )}
      </div>
    </div>
  )
}
