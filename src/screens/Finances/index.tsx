import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Wallet,
  Receipt,
  Banknote,
  Briefcase,
  Users,
  Building2,
  Wrench,
  Beaker,
  MoreHorizontal,
  Store,
  ChevronRight,
} from 'lucide-react'
import { useCareerStore } from '@/store/careerStore'

// ============================================
// FIGMA-EXACT FINANCES PAGE
// White theme · green/red accents · Arial Black
// ============================================

const FONT_BLACK: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FONT_BOLD: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FONT_REGULAR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }

const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'

function formatMoney(n: number, showSign = false): string {
  const abs = Math.abs(n)
  let str: string
  if (abs >= 1_000_000) str = `$${(abs / 1_000_000).toFixed(2)}M`
  else if (abs >= 1_000) str = `$${abs.toLocaleString()}`
  else str = `$${abs}`
  if (showSign && n > 0) return `+${str}`
  if (n < 0) return `-${str}`
  return str
}

export function Finances() {
  const { careerState } = useCareerStore()
  const navigate = useNavigate()
  const team = careerState?.ownedTeam
  const budgets = team?.budgets
  const finances = team?.finances

  // ── Computed values ──────────────────────────────────────────

  const cash = budgets?.cash ?? 0
  const ytdIncome = budgets?.yearToDateIncome ?? 0
  const ytdExpenses = budgets?.yearToDateExpenses ?? 0
  const runwayWeeks = budgets?.runwayWeeks ?? 0

  // Sponsor income (monthly total from active sponsors)
  const sponsors = useMemo(() => {
    return (finances?.sponsors ?? []).filter((s: { active: boolean }) => s.active)
  }, [finances?.sponsors])

  const sponsorMonthlyIncome = useMemo(() => {
    return sponsors.reduce((sum: number, s: { monthlyPayment: number }) => sum + s.monthlyPayment, 0)
  }, [sponsors])

  // Weekly burn & income from transactions
  const { weeklyBurn, weeklyIncome } = useMemo(() => {
    const transactions = finances?.transactions ?? []
    const currentWeek = careerState?.currentWeek ?? 1
    const currentYear = careerState?.currentYear ?? 2026
    const recentWeeks = 4
    const recent = transactions.filter(
      (t: { week: number; year: number }) =>
        t.year === currentYear && t.week > currentWeek - recentWeeks && t.week <= currentWeek
    )
    const weeks = Math.max(1, recentWeeks)
    const totalExpenses = recent
      .filter((t: { type: string }) => t.type === 'expense')
      .reduce((sum: number, t: { amount: number }) => sum + Math.abs(t.amount), 0)
    const totalIncome = recent
      .filter((t: { type: string }) => t.type === 'income')
      .reduce((sum: number, t: { amount: number }) => sum + Math.abs(t.amount), 0)
    return { weeklyBurn: Math.round(totalExpenses / weeks), weeklyIncome: Math.round(totalIncome / weeks) }
  }, [finances?.transactions, careerState?.currentWeek, careerState?.currentYear])

  const netChange = weeklyIncome - weeklyBurn

  // Income sources from YTD transactions
  const incomeSources = useMemo(() => {
    const transactions = finances?.transactions ?? []
    const currentYear = careerState?.currentYear ?? 2026
    const yearTx = transactions.filter(
      (t: { type: string; year: number }) => t.type === 'income' && t.year === currentYear
    )
    const byCategory: Record<string, number> = {}
    for (const t of yearTx) {
      const cat = (t as { category: string }).category || 'other'
      byCategory[cat] = (byCategory[cat] || 0) + Math.abs((t as { amount: number }).amount)
    }
    return [
      { label: 'Team Sponsors', amount: byCategory['sponsor_payment'] || byCategory['sponsor'] || 0 },
      { label: 'Race Prizes', amount: byCategory['race_prize'] || byCategory['prize_money'] || 0 },
      { label: 'Championship Prizes', amount: byCategory['championship_prize'] || byCategory['championship_bonus'] || 0 },
      { label: 'Manufacturer Support', amount: byCategory['manufacturer'] || byCategory['manufacturer_support'] || 0 },
    ]
  }, [finances?.transactions, careerState?.currentYear])

  // Expense breakdown from YTD transactions
  const expenseBreakdown = useMemo(() => {
    const transactions = finances?.transactions ?? []
    const currentYear = careerState?.currentYear ?? 2026
    const yearTx = transactions.filter(
      (t: { type: string; year: number }) => t.type === 'expense' && t.year === currentYear
    )
    const byCategory: Record<string, number> = {}
    for (const t of yearTx) {
      const cat = (t as { category: string }).category || 'other'
      byCategory[cat] = (byCategory[cat] || 0) + Math.abs((t as { amount: number }).amount)
    }
    const items = [
      { label: 'Staff Salaries', amount: byCategory['staff_salary'] || byCategory['salary'] || 0, color: '#ef4444' },
      { label: 'Facility Operations', amount: byCategory['facility'] || byCategory['facility_operation'] || 0, color: '#ef4444' },
      { label: 'Entry Fees', amount: byCategory['entry_fee'] || byCategory['series_entry'] || 0, color: '#f54900' },
      { label: 'Development & R&D', amount: byCategory['development'] || byCategory['rnd'] || byCategory['r_and_d'] || 0, color: '#ef4444' },
      { label: 'Other', amount: byCategory['other'] || byCategory['misc'] || 0, color: '#f54900' },
      { label: 'Store Costs', amount: byCategory['merchandise'] || byCategory['store'] || 0, color: '#00a63e' },
    ]
    const maxAmount = Math.max(...items.map((i) => i.amount), 1)
    return items.map((i) => ({ ...i, pct: (i.amount / maxAmount) * 100 }))
  }, [finances?.transactions, careerState?.currentYear])

  const totalYtdIncome = incomeSources.reduce((s, i) => s + i.amount, 0) || ytdIncome
  const totalYtdExpenses = expenseBreakdown.reduce((s, i) => s + i.amount, 0) || ytdExpenses

  // ── No career guard ──────────────────────────────────────────

  if (!careerState || !team) {
    return (
      <div className="flex items-center justify-center h-full bg-white" style={FONT_BLACK}>
        <p className="text-[24px] text-[#4a5565]">No active career</p>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        {/* ── HEADER ── */}
        <div>
          <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px] leading-[36px]" style={FONT_BLACK}>
            FINANCES
          </h1>
          <p className="text-[14px] text-[#4a5565] leading-[20px] mt-[4px]" style={FONT_REGULAR}>
            Financial overview and budget management
          </p>
        </div>

        {/* ── TOP STAT CARDS (4) ── */}
        <div className="flex gap-[16px]">
          <StatCard label="TEAM CASH" value={formatMoney(cash)} icon={Wallet} variant="green" />
          <StatCard label="YTD INCOME" value={formatMoney(totalYtdIncome)} icon={TrendingUp} variant="green" />
          <StatCard label="YTD EXPENSES" value={formatMoney(totalYtdExpenses)} icon={Receipt} variant="red" />
          <StatCard label="SPONSOR INCOME" value={`${formatMoney(sponsorMonthlyIncome)}/mo`} icon={Briefcase} variant="red" />
        </div>

        {/* ── FINANCIAL RUNWAY BAR ── */}
        <div className={`${CARD} flex items-center justify-between px-[24px] py-[20px]`}>
          <div className="flex items-center gap-[12px]">
            <div className="bg-[#fef2f2] w-[40px] h-[40px] rounded-[12px] flex items-center justify-center">
              <AlertTriangle className="w-[20px] h-[20px] text-[#ef4444]" />
            </div>
            <div>
              <p className="text-[14px] text-[#ef4444] leading-[20px]" style={FONT_BLACK}>FINANCIAL RUNWAY</p>
              <p className="text-[12px] text-[#4a5565] leading-[16px]" style={FONT_REGULAR}>
                {runwayWeeks} weeks of funding remaining
              </p>
            </div>
          </div>
          <div className="flex items-center gap-[48px]">
            <div className="text-center">
              <p className="text-[12px] text-[#4a5565] tracking-[0.6px] leading-[16px]" style={FONT_REGULAR}>WEEKLY BURN</p>
              <p className="text-[20px] text-[#0a0a0a] leading-[28px]" style={FONT_BLACK}>{formatMoney(weeklyBurn)}</p>
            </div>
            <div className="text-center">
              <p className="text-[12px] text-[#4a5565] tracking-[0.6px] leading-[16px]" style={FONT_REGULAR}>WEEKLY INCOME</p>
              <p className="text-[20px] text-[#00a63e] leading-[28px]" style={FONT_BLACK}>+{formatMoney(weeklyIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-[12px] text-[#4a5565] tracking-[0.6px] leading-[16px]" style={FONT_REGULAR}>NET CHANGE</p>
              <p
                className="text-[20px] leading-[28px]"
                style={{ ...FONT_BLACK, color: netChange >= 0 ? '#00a63e' : '#ef4444' }}
              >
                {formatMoney(netChange, true)}
              </p>
            </div>
          </div>
          {runwayWeeks < 12 && (
            <button className="bg-[#ef4444] h-[40px] rounded-[12px] px-[20px] flex items-center justify-center hover:bg-red-600 transition-colors">
              <span className="text-[12px] text-white tracking-[0.6px]" style={FONT_BLACK}>EMERGENCY</span>
            </button>
          )}
        </div>

        {/* ── TWO COLUMNS: Income Sources + Expense Breakdown ── */}
        <div className="flex gap-[24px]">
          {/* INCOME SOURCES */}
          <div className={`${CARD} flex-1 p-[24px]`}>
            <div className="flex items-center gap-[8px] mb-[4px]">
              <TrendingUp className="w-[16px] h-[16px] text-[#00a63e]" />
              <span className="text-[14px] text-[#0a0a0a] tracking-[-0.7px] leading-[20px]" style={FONT_BLACK}>
                INCOME SOURCES
              </span>
            </div>
            <p className="text-[12px] text-[#4a5565] leading-[16px] mb-[20px]" style={FONT_REGULAR}>
              Year {careerState.currentYear} Earnings
            </p>
            <div className="flex flex-col gap-[16px]">
              {incomeSources.map((src) => (
                <div key={src.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-[12px]">
                    <div className="bg-[#f0fdf4] w-[32px] h-[32px] rounded-[8px] flex items-center justify-center">
                      <DollarSign className="w-[16px] h-[16px] text-[#00a63e]" />
                    </div>
                    <div>
                      <p className="text-[14px] text-[#0a0a0a] leading-[20px]" style={FONT_BOLD}>{src.label}</p>
                      <p className="text-[12px] text-[#4a5565] leading-[16px]" style={FONT_REGULAR}>
                        {totalYtdIncome > 0 ? `${Math.round((src.amount / totalYtdIncome) * 100)}% of total income` : '0% of total income'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[16px] text-[#0a0a0a] leading-[24px]" style={FONT_BLACK}>
                    {formatMoney(src.amount)}
                  </span>
                </div>
              ))}
              <div className="border-t-[0.8px] border-black/10 pt-[16px] flex items-center justify-between">
                <span className="text-[14px] text-[#0a0a0a] leading-[20px]" style={FONT_BLACK}>Total YTD Income</span>
                <span className="text-[20px] text-[#0a0a0a] leading-[28px]" style={FONT_BLACK}>
                  {formatMoney(totalYtdIncome)}
                </span>
              </div>
            </div>
          </div>

          {/* EXPENSE BREAKDOWN */}
          <div className={`${CARD} flex-1 p-[24px]`}>
            <div className="flex items-center gap-[8px] mb-[4px]">
              <TrendingDown className="w-[16px] h-[16px] text-[#ef4444]" />
              <span className="text-[14px] text-[#0a0a0a] tracking-[-0.7px] leading-[20px]" style={FONT_BLACK}>
                EXPENSE BREAKDOWN
              </span>
            </div>
            <p className="text-[12px] text-[#4a5565] leading-[16px] mb-[20px]" style={FONT_REGULAR}>
              Year {careerState.currentYear} Spending
            </p>
            <div className="flex flex-col gap-[14px]">
              {expenseBreakdown.map((exp) => (
                <div key={exp.label}>
                  <div className="flex items-center justify-between mb-[4px]">
                    <span className="text-[13px] text-[#0a0a0a] leading-[20px]" style={FONT_BOLD}>{exp.label}</span>
                    <span className="text-[13px] text-[#ef4444] leading-[20px]" style={FONT_BLACK}>
                      -{formatMoney(exp.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <div className="flex-1 h-[6px] bg-[#f3f4f6] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, exp.pct)}%`, background: exp.color }}
                      />
                    </div>
                    <span className="text-[10px] text-[#4a5565] w-[36px] text-right" style={FONT_REGULAR}>
                      {totalYtdExpenses > 0 ? `${Math.round((exp.amount / totalYtdExpenses) * 100)}%` : '0%'}
                    </span>
                  </div>
                </div>
              ))}
              <div className="border-t-[0.8px] border-black/10 pt-[14px] flex items-center justify-between">
                <span className="text-[14px] text-[#0a0a0a] leading-[20px]" style={FONT_BLACK}>Total YTD Expenses</span>
                <span className="text-[20px] text-[#ef4444] leading-[28px]" style={FONT_BLACK}>
                  -{formatMoney(totalYtdExpenses)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTIVE SPONSORS ── */}
        <div className={`${CARD} p-[24px]`}>
          <div className="flex items-center justify-between mb-[20px]">
            <div className="flex items-center gap-[8px]">
              <Briefcase className="w-[16px] h-[16px] text-[#0a0a0a]" />
              <span className="text-[14px] text-[#0a0a0a] tracking-[-0.7px] leading-[20px]" style={FONT_BLACK}>
                ACTIVE SPONSORS
              </span>
            </div>
            <span className="text-[12px] text-[#4a5565] leading-[16px]" style={FONT_REGULAR}>
              {sponsors.length} sponsor{sponsors.length !== 1 ? 's' : ''}
            </span>
          </div>

          {sponsors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[32px]">
              <Briefcase className="w-[40px] h-[40px] text-[#d1d5dc] mb-[12px]" />
              <p className="text-[14px] text-[#4a5565]" style={FONT_REGULAR}>No active sponsors</p>
              <button
                onClick={() => navigate('/sponsor-market')}
                className="mt-[12px] bg-black h-[36px] rounded-[12px] px-[16px] flex items-center gap-[8px] hover:bg-gray-900 transition-colors"
              >
                <span className="text-[12px] text-white" style={FONT_BLACK}>FIND SPONSORS</span>
                <ChevronRight className="w-[14px] h-[14px] text-white" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-[16px]">
              {sponsors.map((sponsor: { id: string; sponsorName: string; slot: string; monthlyPayment: number; satisfaction: number; startYear: number; duration: number; active: boolean }) => {
                const yearsLeft = sponsor.startYear + sponsor.duration - (careerState?.currentYear ?? 2026)
                const slotLabel = sponsor.slot?.replace(/_/g, ' ')?.replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Sponsor'
                return (
                  <div key={sponsor.id} className="border-[0.8px] border-black/10 rounded-[16px] p-[20px]">
                    <div className="flex items-center gap-[8px] mb-[4px]">
                      <span className="text-[14px] text-[#0a0a0a] leading-[20px] truncate" style={FONT_BLACK}>
                        {sponsor.sponsorName}
                      </span>
                      <span
                        className="bg-[#f0fdf4] text-[#00a63e] text-[10px] px-[8px] py-[2px] rounded-full shrink-0"
                        style={FONT_BLACK}
                      >
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-[12px] text-[#4a5565] leading-[16px] mb-[12px]" style={FONT_REGULAR}>
                      {slotLabel}
                    </p>
                    <div className="flex items-center justify-between mb-[12px]">
                      <span className="text-[20px] text-[#0a0a0a] leading-[28px]" style={FONT_BLACK}>
                        {formatMoney(sponsor.monthlyPayment)}
                        <span className="text-[12px] text-[#4a5565]" style={FONT_REGULAR}>/mo</span>
                      </span>
                      <div className="flex items-center gap-[4px]">
                        <Clock className="w-[12px] h-[12px] text-[#4a5565]" />
                        <span className="text-[12px] text-[#4a5565]" style={FONT_REGULAR}>
                          {yearsLeft > 0 ? `${yearsLeft} yr${yearsLeft !== 1 ? 's' : ''} left` : 'Expiring'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-[4px]">
                        <span className="text-[11px] text-[#4a5565]" style={FONT_REGULAR}>Satisfaction</span>
                        <span className="text-[11px] text-[#0a0a0a]" style={FONT_BLACK}>{Math.round(sponsor.satisfaction)}%</span>
                      </div>
                      <div className="h-[6px] bg-[#f3f4f6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, sponsor.satisfaction)}%`,
                            background: sponsor.satisfaction >= 60 ? '#00a63e' : sponsor.satisfaction >= 30 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Stat Card Component ──────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string
  value: string
  icon: typeof DollarSign
  variant: 'green' | 'red'
}) {
  const bg = variant === 'green' ? 'bg-[#00a63e]' : 'bg-[#ef4444]'
  return (
    <div className={`flex-1 ${bg} rounded-[16px] p-[20px] relative overflow-hidden`}>
      <div className="flex items-center gap-[8px] mb-[8px]">
        <Icon className="w-[16px] h-[16px] text-white/70" />
        <span className="text-[12px] text-white/80 tracking-[0.6px] leading-[16px]" style={FONT_BLACK}>
          {label}
        </span>
      </div>
      <p className="text-[24px] text-white leading-[32px]" style={FONT_BLACK}>
        {value}
      </p>
    </div>
  )
}
