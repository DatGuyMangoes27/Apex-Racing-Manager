import { useState, useMemo } from 'react'
import {
  Briefcase,
  TrendingUp,
  Home,
  Building2,
  Plus,
  X
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePersonalLifeState } from '@/screens/PersonalLife/usePersonalLifeState'
import { usePersonalLifeActions } from '@/hooks/usePersonalLifeActions'
import { useToast } from '@/components/ui/Toast'
import { calculateInvestmentPortfolioSummary } from '@/simulation/investments/portfolioManager'
import { STOCKS, BUSINESS_TEMPLATES } from '@/data/investment-config'
import type { BusinessType } from '@/data/investment-config'
import { generatePropertyListings } from '@/simulation/investments/realEstateManager'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'
const INNER = 'bg-[#f9fafb] border-[0.8px] border-black/10 rounded-[16px] p-[16px]'

export default function Investments() {
  const { personalLifeState, careerState } = usePersonalLifeState()
  const {
    buyStock,
    sellStock,
    startPersonalBusiness,
    buyProperty,
    getPropertyListings
  } = usePersonalLifeActions()
  const { addToast } = useToast()

  const personalLife = personalLifeState ?? (careerState as any)?.personalLife
  const stockHoldings = (personalLife as any)?.stockHoldings ?? []
  const businessVentures = (personalLife as any)?.businessVentures ?? []
  const properties = (personalLife as any)?.properties ?? []
  const liquidCash = personalLife?.finances?.liquidCash ?? 0
  const currentWeek = careerState?.currentWeek ?? 1
  const currentYear = careerState?.currentYear ?? 2024

  const portfolioSummary = useMemo(() => {
    const summary = calculateInvestmentPortfolioSummary(stockHoldings, businessVentures)
    const propertyValue = properties.reduce((sum: number, p: any) => sum + (p.currentValue ?? p.purchasePrice ?? 0), 0)
    return {
      ...summary,
      propertyValue,
      totalInvestmentsValue: summary.totalInvestmentsValue + propertyValue
    }
  }, [stockHoldings, businessVentures, properties])

  const [buyStockModal, setBuyStockModal] = useState(false)
  const [buyStockSymbol, setBuyStockSymbol] = useState('')
  const [buyStockShares, setBuyStockShares] = useState(10)
  const [sellStockModal, setSellStockModal] = useState<{ symbol: string; name: string; shares: number } | null>(null)
  const [sellShares, setSellShares] = useState(1)
  const [propertyListings, setPropertyListings] = useState<any[]>([])
  const [propertyModal, setPropertyModal] = useState(false)
  const [startBusinessModal, setStartBusinessModal] = useState(false)
  const [newBusinessType, setNewBusinessType] = useState<BusinessType>('racing_school')
  const [newBusinessName, setNewBusinessName] = useState('')
  const [newBusinessAmount, setNewBusinessAmount] = useState(500000)
  const [newBusinessLocation, setNewBusinessLocation] = useState('Monaco')

  const businessTypes = Object.keys(BUSINESS_TEMPLATES) as BusinessType[]
  const selectedTemplate = BUSINESS_TEMPLATES[newBusinessType]

  const handleBuyStock = () => {
    if (!buyStockSymbol || buyStockShares < 1) {
      addToast({ type: 'error', title: 'Invalid', message: 'Select a stock and enter at least 1 share.' })
      return
    }
    const result = buyStock(buyStockSymbol, buyStockShares)
    addToast({
      type: result.success ? 'success' : 'error',
      title: result.success ? 'Purchased' : 'Failed',
      message: result.message
    })
    if (result.success) {
      setBuyStockModal(false)
      setBuyStockSymbol('')
      setBuyStockShares(10)
    }
  }

  const handleSellStock = () => {
    if (!sellStockModal || sellShares < 1) return
    const result = sellStock(sellStockModal.symbol, sellShares)
    addToast({
      type: result.success ? 'success' : 'error',
      title: result.success ? 'Sold' : 'Failed',
      message: result.message
    })
    if (result.success) {
      setSellStockModal(null)
      setSellShares(1)
    }
  }

  const openPropertyModal = () => {
    const budgetMin = 50000
    const budgetMax = Math.max(liquidCash * 5, 5000000)
    const listings = generatePropertyListings(40, budgetMin, budgetMax)
    setPropertyListings(listings)
    setPropertyModal(true)
  }

  const handleBuyProperty = (listingIndex: number) => {
    const result = buyProperty(listingIndex)
    addToast({
      type: result.success ? 'success' : 'error',
      title: result.success ? 'Property Purchased' : 'Failed',
      message: result.message
    })
    if (result.success) setPropertyModal(false)
  }

  const handleStartBusiness = () => {
    if (newBusinessAmount < selectedTemplate.minInvestment || newBusinessAmount > selectedTemplate.maxInvestment) {
      addToast({
        type: 'error',
        title: 'Invalid amount',
        message: `Investment must be between $${selectedTemplate.minInvestment.toLocaleString()} and $${selectedTemplate.maxInvestment.toLocaleString()}`
      })
      return
    }
    const result = startPersonalBusiness(newBusinessType, newBusinessName || selectedTemplate.name, newBusinessAmount, 100, newBusinessLocation)
    addToast({
      type: result.success ? 'success' : 'error',
      title: result.success ? 'Business Started' : 'Failed',
      message: result.message
    })
    if (result.success) {
      setStartBusinessModal(false)
      setNewBusinessName('')
      setNewBusinessAmount(500000)
    }
  }

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        {/* Header */}
        <div className="flex items-center gap-[12px]">
          <Briefcase className="w-[28px] h-[28px] text-[#0a0a0a]" />
          <div>
            <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px]" style={FB}>Investments</h1>
            <p className="text-[14px] text-[#4a5565] mt-[2px]" style={FR}>
              Grow your wealth with stocks, real estate, and side businesses
            </p>
          </div>
        </div>

        {/* Portfolio summary */}
        <div className={CARD}>
          <div className="p-[16px] border-b border-black/10 flex items-center gap-[8px]">
            <TrendingUp className="w-[16px] h-[16px] text-[#0a0a0a]" />
            <h2 className="text-[16px] text-[#0a0a0a]" style={FBold}>Portfolio summary</h2>
          </div>
          <div className="p-[16px] grid grid-cols-2 sm:grid-cols-4 gap-[16px]">
            <div className={INNER}>
              <p className="text-[12px] text-[#4a5565] uppercase tracking-wide" style={FR}>Liquid cash</p>
              <p className="text-[18px] text-[#0a0a0a] mt-[4px]" style={FBold}>${liquidCash.toLocaleString()}</p>
            </div>
            <div className={INNER}>
              <p className="text-[12px] text-[#4a5565] uppercase tracking-wide" style={FR}>Stocks</p>
              <p className="text-[18px] text-[#0a0a0a] mt-[4px]" style={FBold}>${portfolioSummary.stocksValue.toLocaleString()}</p>
              {portfolioSummary.stockCount > 0 && (
                <p className="text-[12px] text-[#4a5565]" style={FR}>{portfolioSummary.stockCount} holdings</p>
              )}
            </div>
            <div className={INNER}>
              <p className="text-[12px] text-[#4a5565] uppercase tracking-wide" style={FR}>Real estate</p>
              <p className="text-[18px] text-[#0a0a0a] mt-[4px]" style={FBold}>${portfolioSummary.propertyValue.toLocaleString()}</p>
              {properties.length > 0 && (
                <p className="text-[12px] text-[#4a5565]" style={FR}>{properties.length} properties</p>
              )}
            </div>
            <div className={INNER}>
              <p className="text-[12px] text-[#4a5565] uppercase tracking-wide" style={FR}>Businesses</p>
              <p className="text-[18px] text-[#0a0a0a] mt-[4px]" style={FBold}>${portfolioSummary.businessesValue.toLocaleString()}</p>
              {portfolioSummary.monthlyBusinessIncome > 0 && (
                <p className="text-[12px] text-[#00a63e]" style={FR}>~${Math.round(portfolioSummary.monthlyBusinessIncome / 4).toLocaleString()}/wk</p>
              )}
            </div>
          </div>
          <div className="px-[16px] pb-[16px] border-t border-black/10 pt-[12px]">
            <p className="text-[14px] text-[#4a5565]" style={FR}>
              Total investment value: <span className="text-[#0a0a0a]" style={FBold}>${portfolioSummary.totalInvestmentsValue.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Stocks */}
        <div className={CARD}>
          <div className="p-[16px] border-b border-black/10 flex items-center justify-between">
            <div className="flex items-center gap-[8px]">
              <TrendingUp className="w-[16px] h-[16px] text-[#0a0a0a]" />
              <h2 className="text-[16px] text-[#0a0a0a]" style={FBold}>Stocks</h2>
            </div>
            <button
              onClick={() => setBuyStockModal(true)}
              className="border-[0.8px] border-black/20 rounded-[12px] px-[12px] py-[6px] text-[13px] flex items-center gap-[4px] hover:bg-black/5 transition-colors"
              style={FR}
            >
              <Plus className="w-[14px] h-[14px]" /> Buy stocks
            </button>
          </div>
          <div className="p-[16px]">
            {stockHoldings.length === 0 ? (
              <p className="text-[14px] text-[#4a5565]" style={FR}>No stock holdings. Buy stocks to build your portfolio.</p>
            ) : (
              <div className="flex flex-col gap-[8px]">
                {stockHoldings.map((h: any, i: number) => (
                  <div
                    key={`${h.stockSymbol}-${i}`}
                    className={`${INNER} flex justify-between items-center`}
                  >
                    <div>
                      <span className="text-[14px] text-[#0a0a0a]" style={FBold}>{h.stockSymbol}</span>
                      <span className="text-[14px] text-[#4a5565] ml-[8px]" style={FR}>{h.companyName}</span>
                      <p className="text-[12px] text-[#4a5565] mt-[2px]" style={FR}>{h.shares} shares · ${h.currentValue.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-[8px]">
                      <span className={`text-[14px] ${h.unrealizedGain >= 0 ? 'text-[#00a63e]' : 'text-[#ef4444]'}`} style={FR}>
                        {h.unrealizedGain >= 0 ? '+' : ''}${h.unrealizedGain.toLocaleString()} ({h.unrealizedGainPercent >= 0 ? '+' : ''}{h.unrealizedGainPercent.toFixed(1)}%)
                      </span>
                      <button
                        className="px-[12px] py-[6px] text-[13px] hover:bg-black/5 rounded-[8px] transition-colors"
                        style={FR}
                        onClick={() => setSellStockModal({ symbol: h.stockSymbol, name: h.companyName, shares: h.shares })}
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Real estate */}
        <div className={CARD}>
          <div className="p-[16px] border-b border-black/10 flex items-center justify-between">
            <div className="flex items-center gap-[8px]">
              <Home className="w-[16px] h-[16px] text-[#0a0a0a]" />
              <h2 className="text-[16px] text-[#0a0a0a]" style={FBold}>Real estate</h2>
            </div>
            <button
              onClick={openPropertyModal}
              className="border-[0.8px] border-black/20 rounded-[12px] px-[12px] py-[6px] text-[13px] flex items-center gap-[4px] hover:bg-black/5 transition-colors"
              style={FR}
            >
              <Plus className="w-[14px] h-[14px]" /> Browse properties
            </button>
          </div>
          <div className="p-[16px]">
            {properties.length === 0 ? (
              <p className="text-[14px] text-[#4a5565]" style={FR}>No properties. Browse listings to buy real estate, or manage properties in Personal Life → Lifestyle.</p>
            ) : (
              <div className="flex flex-col gap-[8px]">
                {properties.map((p: any) => (
                  <div key={p.id} className={`${INNER} flex justify-between items-center`}>
                    <div>
                      <span className="text-[14px] text-[#0a0a0a]" style={FBold}>{p.name ?? 'Property'}</span>
                      <p className="text-[12px] text-[#4a5565] mt-[2px]" style={FR}>${(p.currentValue ?? p.purchasePrice ?? 0).toLocaleString()}</p>
                    </div>
                    <Link to="/personal-life/lifestyle">
                      <button className="px-[12px] py-[6px] text-[13px] hover:bg-black/5 rounded-[8px] transition-colors" style={FR}>Manage</button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Business ventures */}
        <div className={CARD}>
          <div className="p-[16px] border-b border-black/10 flex items-center justify-between">
            <div className="flex items-center gap-[8px]">
              <Building2 className="w-[16px] h-[16px] text-[#0a0a0a]" />
              <h2 className="text-[16px] text-[#0a0a0a]" style={FBold}>Business ventures</h2>
            </div>
            <button
              onClick={() => setStartBusinessModal(true)}
              className="border-[0.8px] border-black/20 rounded-[12px] px-[12px] py-[6px] text-[13px] flex items-center gap-[4px] hover:bg-black/5 transition-colors"
              style={FR}
            >
              <Plus className="w-[14px] h-[14px]" /> Start business
            </button>
          </div>
          <div className="p-[16px]">
            {businessVentures.length === 0 ? (
              <p className="text-[14px] text-[#4a5565]" style={FR}>No businesses. Start a venture to earn passive income.</p>
            ) : (
              <div className="flex flex-col gap-[8px]">
                {businessVentures.map((b: any) => (
                  <div key={b.id} className={`${INNER} flex justify-between items-center`}>
                    <div>
                      <span className="text-[14px] text-[#0a0a0a]" style={FBold}>{b.name}</span>
                      <p className="text-[12px] text-[#4a5565] mt-[2px]" style={FR}>
                        {b.ownershipPercent}% · ${(b.currentValuation * (b.ownershipPercent / 100)).toLocaleString()} value · ${b.monthlyProfit?.toLocaleString() ?? 0}/mo profit
                      </p>
                    </div>
                    <span
                      className={`px-[8px] py-[2px] rounded-[8px] text-[12px] ${
                        b.status === 'thriving' ? 'bg-[#f0fdf4] text-[#00a63e]' :
                        b.status === 'struggling' ? 'bg-[#fef2f2] text-[#ef4444]' :
                        'bg-[#f9fafb] text-[#4a5565]'
                      }`}
                      style={FR}
                    >
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Buy stock modal */}
      {buyStockModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => setBuyStockModal(false)}>
          <div className="bg-white rounded-[24px] w-full max-w-[500px]" onClick={e => e.stopPropagation()}>
            <div className="p-[24px] flex flex-col gap-[16px]">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] tracking-[-0.5px]" style={FB}>Buy stocks</h2>
                <button onClick={() => setBuyStockModal(false)} className="p-[8px] hover:bg-black/5 rounded-[8px]">
                  <X className="w-[20px] h-[20px]" />
                </button>
              </div>
              <div>
                <label className="block text-[14px] text-[#0a0a0a] mb-[4px]" style={FBold}>Stock</label>
                <select
                  className="w-full rounded-[12px] bg-white border-[0.8px] border-black/20 px-[12px] py-[10px] text-[14px] text-[#0a0a0a] outline-none focus:border-black/40"
                  style={FR}
                  value={buyStockSymbol}
                  onChange={e => setBuyStockSymbol(e.target.value)}
                >
                  <option value="">Select...</option>
                  {STOCKS.map(s => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.symbol} – {s.companyName} (${s.currentPrice})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[14px] text-[#0a0a0a] mb-[4px]" style={FBold}>Shares</label>
                <input
                  type="number"
                  min={1}
                  value={buyStockShares}
                  onChange={e => setBuyStockShares(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-[12px] bg-white border-[0.8px] border-black/20 px-[12px] py-[10px] text-[14px] text-[#0a0a0a] outline-none focus:border-black/40"
                  style={FR}
                />
              </div>
              {buyStockSymbol && (
                <p className="text-[14px] text-[#4a5565]" style={FR}>
                  Total: ${((STOCKS.find(s => s.symbol === buyStockSymbol)?.currentPrice ?? 0) * buyStockShares).toLocaleString()} (cash: ${liquidCash.toLocaleString()})
                </p>
              )}
              <div className="flex justify-end gap-[8px]">
                <button onClick={() => setBuyStockModal(false)} className="border-[0.8px] border-black/20 rounded-[12px] px-[16px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR}>Cancel</button>
                <button onClick={handleBuyStock} className="bg-black text-white rounded-[16px] px-[16px] py-[10px] text-[14px] hover:bg-black/80 transition-colors" style={FBold}>Buy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sell stock modal */}
      {sellStockModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => setSellStockModal(null)}>
          <div className="bg-white rounded-[24px] w-full max-w-[500px]" onClick={e => e.stopPropagation()}>
            <div className="p-[24px] flex flex-col gap-[16px]">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] tracking-[-0.5px]" style={FB}>Sell stocks</h2>
                <button onClick={() => setSellStockModal(null)} className="p-[8px] hover:bg-black/5 rounded-[8px]">
                  <X className="w-[20px] h-[20px]" />
                </button>
              </div>
              <p className="text-[14px] text-[#4a5565]" style={FR}>Selling {sellStockModal.name} ({sellStockModal.symbol}). Max: {sellStockModal.shares} shares.</p>
              <div>
                <label className="block text-[14px] text-[#0a0a0a] mb-[4px]" style={FBold}>Shares to sell</label>
                <input
                  type="number"
                  min={1}
                  max={sellStockModal.shares}
                  value={sellShares}
                  onChange={e => setSellShares(Math.min(sellStockModal.shares, parseInt(e.target.value, 10) || 0))}
                  className="w-full rounded-[12px] bg-white border-[0.8px] border-black/20 px-[12px] py-[10px] text-[14px] text-[#0a0a0a] outline-none focus:border-black/40"
                  style={FR}
                />
              </div>
              <div className="flex justify-end gap-[8px]">
                <button onClick={() => setSellStockModal(null)} className="border-[0.8px] border-black/20 rounded-[12px] px-[16px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR}>Cancel</button>
                <button onClick={handleSellStock} className="bg-black text-white rounded-[16px] px-[16px] py-[10px] text-[14px] hover:bg-black/80 transition-colors" style={FBold}>Sell</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Property listings modal */}
      {propertyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => setPropertyModal(false)}>
          <div className="bg-white rounded-[24px] w-full max-w-[600px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-[24px] pb-[16px] flex items-center justify-between border-b border-black/10">
              <h2 className="text-[20px] tracking-[-0.5px]" style={FB}>Browse properties</h2>
              <button onClick={() => setPropertyModal(false)} className="p-[8px] hover:bg-black/5 rounded-[8px]">
                <X className="w-[20px] h-[20px]" />
              </button>
            </div>
            <div className="p-[24px] flex flex-col gap-[8px] overflow-y-auto">
              {propertyListings.length === 0 ? (
                <p className="text-[14px] text-[#4a5565]" style={FR}>No listings in your budget. Increase liquid cash to see more.</p>
              ) : (
                propertyListings.map((listing: any, i: number) => (
                  <div key={i} className={`${INNER} flex justify-between items-center`}>
                    <div>
                      <span className="text-[14px] text-[#0a0a0a]" style={FBold}>{listing.name ?? listing.property?.name ?? 'Property'}</span>
                      <p className="text-[12px] text-[#4a5565]" style={FR}>${(listing.listPrice ?? listing.askingPrice ?? 0).toLocaleString()}</p>
                    </div>
                    <button
                      className={`border-[0.8px] border-black/20 rounded-[12px] px-[12px] py-[6px] text-[13px] transition-colors ${
                        liquidCash < (listing.listPrice ?? listing.askingPrice ?? 0) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-black/5'
                      }`}
                      style={FR}
                      onClick={() => handleBuyProperty(i)}
                      disabled={liquidCash < (listing.listPrice ?? listing.askingPrice ?? 0)}
                    >
                      Buy
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Start business modal */}
      {startBusinessModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-[24px]" onClick={() => setStartBusinessModal(false)}>
          <div className="bg-white rounded-[24px] w-full max-w-[500px]" onClick={e => e.stopPropagation()}>
            <div className="p-[24px] flex flex-col gap-[16px]">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] tracking-[-0.5px]" style={FB}>Start business</h2>
                <button onClick={() => setStartBusinessModal(false)} className="p-[8px] hover:bg-black/5 rounded-[8px]">
                  <X className="w-[20px] h-[20px]" />
                </button>
              </div>
              <div>
                <label className="block text-[14px] text-[#0a0a0a] mb-[4px]" style={FBold}>Type</label>
                <select
                  className="w-full rounded-[12px] bg-white border-[0.8px] border-black/20 px-[12px] py-[10px] text-[14px] text-[#0a0a0a] outline-none focus:border-black/40"
                  style={FR}
                  value={newBusinessType}
                  onChange={e => setNewBusinessType(e.target.value as BusinessType)}
                >
                  {businessTypes.map(t => (
                    <option key={t} value={t}>{BUSINESS_TEMPLATES[t as BusinessType].name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[14px] text-[#0a0a0a] mb-[4px]" style={FBold}>Business name (optional)</label>
                <input
                  value={newBusinessName}
                  onChange={e => setNewBusinessName(e.target.value)}
                  placeholder={selectedTemplate.name}
                  className="w-full rounded-[12px] bg-white border-[0.8px] border-black/20 px-[12px] py-[10px] text-[14px] text-[#0a0a0a] outline-none focus:border-black/40"
                  style={FR}
                />
              </div>
              <div>
                <label className="block text-[14px] text-[#0a0a0a] mb-[4px]" style={FBold}>Investment ($)</label>
                <input
                  type="number"
                  min={selectedTemplate.minInvestment}
                  max={selectedTemplate.maxInvestment}
                  value={newBusinessAmount}
                  onChange={e => setNewBusinessAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-[12px] bg-white border-[0.8px] border-black/20 px-[12px] py-[10px] text-[14px] text-[#0a0a0a] outline-none focus:border-black/40"
                  style={FR}
                />
                <p className="text-[12px] text-[#4a5565] mt-[4px]" style={FR}>
                  Min ${selectedTemplate.minInvestment.toLocaleString()} – Max ${selectedTemplate.maxInvestment.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-[14px] text-[#0a0a0a] mb-[4px]" style={FBold}>Location</label>
                <input
                  value={newBusinessLocation}
                  onChange={e => setNewBusinessLocation(e.target.value)}
                  className="w-full rounded-[12px] bg-white border-[0.8px] border-black/20 px-[12px] py-[10px] text-[14px] text-[#0a0a0a] outline-none focus:border-black/40"
                  style={FR}
                />
              </div>
              <p className="text-[14px] text-[#4a5565]" style={FR}>Cash: ${liquidCash.toLocaleString()}</p>
              <div className="flex justify-end gap-[8px]">
                <button onClick={() => setStartBusinessModal(false)} className="border-[0.8px] border-black/20 rounded-[12px] px-[16px] py-[10px] text-[14px] hover:bg-black/5 transition-colors" style={FR}>Cancel</button>
                <button onClick={handleStartBusiness} className="bg-black text-white rounded-[16px] px-[16px] py-[10px] text-[14px] hover:bg-black/80 transition-colors" style={FBold}>Start business</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
