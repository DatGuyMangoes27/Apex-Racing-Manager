import { useState, useMemo, useEffect } from 'react'
import {
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Plus,
  Package,
  LayoutGrid,
  Store,
  AlertTriangle,
  DollarSign,
  Edit2,
  X,
  Settings2
} from 'lucide-react'
import { Card, CardHeader, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Modal, Input, Select, useToast, InfoTooltip } from '@/components/ui'
import { getMerchandiseImage } from '@/utils/generated-assets'
import { formatCurrency } from '@/data/financial-config'
import {
  MERCH_PRODUCT_TEMPLATES,
  MERCH_RARITY_CONFIG,
  STORE_CONFIGS,
  STORE_LOCATION_OPTIONS,
  COLLECTION_THEME_CONFIG
} from '@/data/financial-extended-config'
import { useCareerStore } from '@/store/careerStore'
import type {
  MerchandiseFullState,
  MerchProduct,
  MerchCollection,
  MerchStore,
  MerchRarity,
  CollectionTheme,
  StoreType
} from '@/store/careerStore'
import type { TeamTier } from '@/store/rivalStore'
import { getInventoryValue, getRetailValue } from '@/simulation/finances/merchandise'

// Map product template id to image key used by getMerchandiseImage
const TEMPLATE_IMAGE_KEYS: Record<string, string> = {
  team_tshirt: 'merch-tshirt',
  team_cap: 'merch-cap',
  team_hoodie: 'merch-hoodie',
  team_jacket: 'merch-jacket',
  team_mug: 'merch-mug',
  diecast_car: 'merch-model-car',
  team_polo: 'merch-tshirt',
  race_suit_replica: 'merch-jacket',
  team_keychain: 'merch-keychain',
  team_flag: 'merch-flag',
  poster_set: 'merch-poster'
}

function getProductImageKey(product: MerchProduct): string {
  const template = MERCH_PRODUCT_TEMPLATES.find(t => t.name === product.name || t.id === product.name)
  const key = template ? TEMPLATE_IMAGE_KEYS[template.id] : undefined
  return key ?? 'merch-tshirt'
}

function getPriceOptionsForProduct(product: MerchProduct): { value: string; label: string }[] {
  const template = MERCH_PRODUCT_TEMPLATES.find(t => t.name === product.name || t.id === product.name)
  const rc = MERCH_RARITY_CONFIG[product.rarity]
  const min = template && rc ? Math.ceil(template.basePriceRange[0] * rc.priceMultiplier) : 1
  const max = template && rc ? Math.ceil(template.basePriceRange[1] * rc.priceMultiplier * 1.5) : 999
  const step = Math.max(1, Math.ceil((max - min) / 12))
  const opts: { value: string; label: string }[] = []
  for (let p = min; p <= max; p += step) opts.push({ value: String(p), label: formatCurrency(p) })
  if (opts[opts.length - 1]?.value !== String(max)) opts.push({ value: String(max), label: formatCurrency(max) })
  return opts
}

interface MerchandiseDashboardProps {
  merchandise: MerchandiseFullState
  currentWeek: number
  currentYear: number
  teamTier: TeamTier
  className?: string
}

export function MerchandiseDashboard({
  merchandise,
  currentWeek,
  currentYear,
  teamTier,
  className = ''
}: MerchandiseDashboardProps) {
  const { addToast } = useToast()
  const {
    addMerchandiseProduct,
    createMerchandiseCollection,
    openMerchandiseStore,
    updateMerchandiseProductPrice,
    discontinueMerchandiseProduct,
    updateMerchandiseStoreProducts
  } = useCareerStore()

  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showCreateCollection, setShowCreateCollection] = useState(false)
  const [showOpenStore, setShowOpenStore] = useState(false)
  const [manageStore, setManageStore] = useState<MerchStore | null>(null)
  const [editingPriceProductId, setEditingPriceProductId] = useState<string | null>(null)
  const [newPriceValue, setNewPriceValue] = useState('')

  const inventoryValue = useMemo(() => getInventoryValue(merchandise.products), [merchandise.products])
  const retailValue = useMemo(() => getRetailValue(merchandise.products), [merchandise.products])
  const recentHistory = merchandise.revenueHistory.slice(-12)
  const activeProducts = merchandise.products.filter(p => p.active)

  return (
    <div className={className}>
      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="stores">Stores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <TrendingUp className="w-4 h-4" />
                Total Revenue
                <InfoTooltip content="Total income from merchandise sales across all stores since the start. Grows as you add products and stock stores." />
              </div>
              <div className="text-xl font-mono font-semibold text-status-success mt-1">
                {formatCurrency(merchandise.totalRevenue)}
              </div>
            </Card>
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <TrendingDown className="w-4 h-4" />
                Total Costs
                <InfoTooltip content="Total spend on production, store costs, and marketing. Track this against revenue to stay profitable." />
              </div>
              <div className="text-xl font-mono font-semibold text-status-danger mt-1">
                {formatCurrency(merchandise.totalCosts)}
              </div>
            </Card>
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <DollarSign className="w-4 h-4" />
                Weekly Profit
                <InfoTooltip content="Revenue minus costs this week. Positive means merchandise is contributing to team finances." />
              </div>
              <div className={`text-xl font-mono font-semibold mt-1 ${merchandise.weeklyProfit >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                {formatCurrency(merchandise.weeklyProfit)}
              </div>
            </Card>
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <Package className="w-4 h-4" />
                Inventory Value
                <InfoTooltip content="Value of unsold stock at production cost. Tied up until products sell." />
              </div>
              <div className="text-xl font-mono font-semibold mt-1">
                {formatCurrency(inventoryValue)}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="glass" padding="lg">
              <CardHeader
                title="Revenue (last 12 weeks)"
                icon={<InfoTooltip content="Weekly sales for the past 12 weeks. Use this to spot trends and see if new products or collections are selling." />}
              />
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentHistory.length === 0 ? (
                  <p className="text-sm text-text-muted">No revenue data yet. Add products and they will sell over time.</p>
                ) : (
                  recentHistory.map((h, i) => (
                    <div key={`${h.week}-${h.year}`} className="flex justify-between text-sm">
                      <span className="text-text-muted">Week {h.week}, Year {h.year}</span>
                      <span className="font-mono">{formatCurrency(h.revenue)}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <div className="space-y-4">
              {merchandise.lowStockAlerts.length > 0 && (
                <Card variant="glass" padding="md">
                  <CardHeader
                    title="Low stock"
                    icon={
                      <>
                        <AlertTriangle className="w-4 h-4 text-status-warning" />
                        <InfoTooltip content="Products below their reorder point. Increase weekly production or add a new production run to avoid stockouts." />
                      </>
                    }
                  />
                  <ul className="text-sm space-y-1">
                    {merchandise.lowStockAlerts.map(pid => {
                      const p = merchandise.products.find(x => x.id === pid)
                      return p ? <li key={pid}>{p.name} — {p.stockLevel} left</li> : null
                    })}
                  </ul>
                </Card>
              )}
              {merchandise.topSellingProducts.length > 0 && (
                <Card variant="glass" padding="md">
                  <CardHeader
                    title="Top sellers"
                    icon={<InfoTooltip content="Best-selling products by units sold. Consider featuring these in collections or keeping stock high." />}
                  />
                  <ul className="text-sm space-y-1">
                    {merchandise.topSellingProducts.slice(0, 5).map(pid => {
                      const p = merchandise.products.find(x => x.id === pid)
                      return p ? <li key={pid}>{p.name} — {p.totalSold} sold</li> : null
                    })}
                  </ul>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card variant="glass" padding="lg">
            <CardHeader
              title="Products"
              subtitle={`${activeProducts.length} active products`}
              icon={<InfoTooltip content="Design products here. Each product must be added to a store (Stores tab → Manage) before it can sell." />}
              action={
                <span className="flex items-center gap-1.5">
                  <InfoTooltip content="Choose a product type, set price and stock, then add the product. After that, go to Stores → Manage to add it to your Team Online Store or other stores." />
                  <Button variant="primary" size="sm" onClick={() => setShowAddProduct(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add product
                  </Button>
                </span>
              }
            />
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {merchandise.products.length === 0 ? (
                <p className="text-text-muted text-sm py-4">No products yet. Add one to start selling.</p>
              ) : (
                merchandise.products.map(product => (
                  <div
                    key={product.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border border-surface-border ${!product.active ? 'opacity-60' : ''}`}
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-surface-secondary shrink-0">
                      <img
                        src={getMerchandiseImage(getProductImageKey(product))}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{product.name}</span>
                        {merchandise.lowStockAlerts.includes(product.id) && (
                          <Badge variant="warning" size="sm">Low stock</Badge>
                        )}
                        {merchandise.topSellingProducts.includes(product.id) && (
                          <Badge variant="green" size="sm">Top seller</Badge>
                        )}
                        {!product.active && <Badge variant="secondary" size="sm">Discontinued</Badge>}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {product.category} · {product.rarity} · Stock: {product.stockLevel} · Reorder at: {product.reorderPoint} · Prod: {product.weeklyProduction}/wk · Sold: {product.totalSold}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {editingPriceProductId === product.id ? (
                        <div className="flex items-center gap-2">
                          <Select
                            options={getPriceOptionsForProduct(product)}
                            value={newPriceValue}
                            onChange={e => setNewPriceValue(e.target.value)}
                            className="w-28"
                          />
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              const price = parseInt(newPriceValue, 10)
                              if (isNaN(price) || price < 1) {
                                addToast({ type: 'error', message: 'Invalid price' })
                                return
                              }
                              const result = updateMerchandiseProductPrice(product.id, price)
                              if (result.success) {
                                addToast({ type: 'success', message: `Price updated: ${product.name} is now ${formatCurrency(price)}` })
                                setEditingPriceProductId(null)
                                setNewPriceValue('')
                              } else {
                                addToast({ type: 'error', message: result.error ?? 'Update failed' })
                              }
                            }}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingPriceProductId(null); setNewPriceValue('') }}>Cancel</Button>
                        </div>
                      ) : (
                        <div className="font-mono text-status-success">{formatCurrency(product.basePrice)}</div>
                      )}
                    </div>
                    {product.active && editingPriceProductId !== product.id && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingPriceProductId(product.id)
                            setNewPriceValue(String(product.basePrice))
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            discontinueMerchandiseProduct(product.id)
                            addToast({ type: 'success', message: `Product discontinued: ${product.name}` })
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          <AddProductModal
            isOpen={showAddProduct}
            onClose={() => setShowAddProduct(false)}
            currentWeek={currentWeek}
            currentYear={currentYear}
            onSuccess={params => {
              const result = addMerchandiseProduct(params)
              if (result.success) {
                const productName = MERCH_PRODUCT_TEMPLATES.find(t => t.id === params.templateId)?.name ?? 'New product'
                addToast({ type: 'success', message: `Product added: ${productName}` })
                setShowAddProduct(false)
              } else {
                addToast({ type: 'error', message: result.error ?? 'Could not add product' })
              }
            }}
          />
        </TabsContent>

        <TabsContent value="collections">
          <Card variant="glass" padding="lg">
            <CardHeader
              title="Collections"
              subtitle={`${merchandise.collections.length} collections`}
              icon={<InfoTooltip content="Collections group products and run themed campaigns to boost sales for selected items. Create one to promote a set of products together." />}
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCreateCollection(true)}
                  disabled={activeProducts.length === 0}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create collection
                </Button>
              }
            />
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {merchandise.collections.length === 0 ? (
                <p className="text-text-muted text-sm py-4">No collections yet. Create one to boost sales for selected products.</p>
              ) : (
                merchandise.collections.map(coll => (
                  <div key={coll.id} className="flex items-center justify-between p-3 rounded-lg border border-surface-border">
                    <div>
                      <div className="font-medium">{coll.name}</div>
                      <div className="text-xs text-text-muted">
                        Theme: {coll.theme} · {coll.products.length} products · {coll.active ? 'Active' : 'Ended'}
                        {coll.endWeek != null && ` · Ends W${coll.endWeek}/${coll.endYear}`}
                      </div>
                    </div>
                    <Badge variant={coll.active ? 'green' : 'secondary'}>{coll.active ? 'Active' : 'Ended'}</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          <CreateCollectionModal
            isOpen={showCreateCollection}
            onClose={() => setShowCreateCollection(false)}
            products={activeProducts}
            currentWeek={currentWeek}
            currentYear={currentYear}
            onSuccess={params => {
              const result = createMerchandiseCollection(params)
              if (result.success) {
                addToast({ type: 'success', message: `Collection created: ${params.name}` })
                setShowCreateCollection(false)
              } else {
                addToast({ type: 'error', message: result.error ?? 'Could not create collection' })
              }
            }}
          />
        </TabsContent>

        <TabsContent value="stores">
          <Card variant="glass" padding="lg">
            <CardHeader
              title="Stores"
              subtitle={`${merchandise.stores.length} stores`}
              icon={<InfoTooltip content="Selling channels (online, physical, pop-up, event). Add products to each store via Manage so they can sell there." />}
              action={
                <span className="flex items-center gap-1.5">
                  <InfoTooltip content="Open store creates a new channel; Manage lets you choose which products each store stocks, including the default Team Online Store." />
                  <Button variant="primary" size="sm" onClick={() => setShowOpenStore(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Open store
                  </Button>
                </span>
              }
            />
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {merchandise.stores.map(store => (
                <div key={store.id} className="flex items-center justify-between p-3 rounded-lg border border-surface-border">
                  <div>
                    <div className="font-medium">{store.name}</div>
                    <div className="text-xs text-text-muted">
                      {store.type} · {formatCurrency(store.weeklyCost)}/wk · {store.products.length} products
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setManageStore(store)}
                    >
                      <Settings2 className="w-4 h-4 mr-1" />
                      Manage
                    </Button>
                    <Badge variant={store.active ? 'green' : 'secondary'}>{store.active ? 'Open' : 'Closed'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <ManageStoreProductsModal
            store={manageStore}
            products={activeProducts}
            onClose={() => setManageStore(null)}
            onSave={(storeId, productIds) => {
              updateMerchandiseStoreProducts(storeId, productIds)
              addToast({ type: 'success', message: 'Store products updated' })
              setManageStore(null)
            }}
          />

          <OpenStoreModal
            isOpen={showOpenStore}
            onClose={() => setShowOpenStore(false)}
            products={activeProducts}
            currentWeek={currentWeek}
            currentYear={currentYear}
            onSuccess={(type, _customName, location, productIds) => {
              const result = openMerchandiseStore(type, STORE_CONFIGS[type].name, location, productIds)
              if (result.success) {
                addToast({ type: 'success', message: `Store opened: ${STORE_CONFIGS[type].name}` })
                setShowOpenStore(false)
              } else {
                addToast({ type: 'error', message: result.error ?? 'Could not open store' })
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// --- Add Product Modal ---
interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  currentWeek: number
  currentYear: number
  onSuccess: (params: {
    templateId: string
    basePrice: number
    rarity: MerchRarity
    initialStock: number
    weeklyProduction: number
    reorderPoint: number
    currentWeek: number
    currentYear: number
  }) => void
}

function AddProductModal({ isOpen, onClose, currentWeek, currentYear, onSuccess }: AddProductModalProps) {
  const [templateId, setTemplateId] = useState(MERCH_PRODUCT_TEMPLATES[0]?.id ?? '')
  const [basePrice, setBasePrice] = useState('')
  const [rarity, setRarity] = useState<MerchRarity>('standard')
  const [initialStock, setInitialStock] = useState('100')
  const [weeklyProduction, setWeeklyProduction] = useState('50')
  const [reorderPoint, setReorderPoint] = useState('20')

  const template = useMemo(() => MERCH_PRODUCT_TEMPLATES.find(t => t.id === templateId), [templateId])
  const rarityConfig = template ? MERCH_RARITY_CONFIG[rarity] : null
  const minPrice = template && rarityConfig
    ? Math.ceil(template.basePriceRange[0] * rarityConfig.priceMultiplier)
    : 0
  const maxPrice = template && rarityConfig
    ? Math.ceil(template.basePriceRange[1] * rarityConfig.priceMultiplier * 1.5)
    : 0

  useEffect(() => {
    if (minPrice === 0 && maxPrice === 0) return
    const p = parseInt(basePrice, 10)
    if (basePrice === '' || isNaN(p) || p < minPrice || p > maxPrice) {
      setBasePrice(String(minPrice))
    }
  }, [minPrice, maxPrice, templateId, rarity])

  const basePriceOptions = useMemo(() => {
    if (minPrice >= maxPrice) return [{ value: String(minPrice), label: `$${minPrice}` }]
    const step = Math.max(1, Math.ceil((maxPrice - minPrice) / 15))
    const opts: { value: string; label: string }[] = []
    for (let p = minPrice; p <= maxPrice; p += step) opts.push({ value: String(p), label: `$${p}` })
    if (opts[opts.length - 1]?.value !== String(maxPrice)) opts.push({ value: String(maxPrice), label: `$${maxPrice}` })
    return opts
  }, [minPrice, maxPrice])

  const initialStockOptions = [
    { value: '50', label: '50' },
    { value: '100', label: '100' },
    { value: '150', label: '150' },
    { value: '200', label: '200' },
    { value: '250', label: '250' },
    { value: '300', label: '300' },
    { value: '500', label: '500' }
  ]
  const reorderPointOptions = [
    { value: '10', label: '10' },
    { value: '20', label: '20' },
    { value: '30', label: '30' },
    { value: '40', label: '40' },
    { value: '50', label: '50' },
    { value: '75', label: '75' },
    { value: '100', label: '100' }
  ]
  const weeklyProductionOptions = [
    { value: '0', label: '0' },
    { value: '25', label: '25' },
    { value: '50', label: '50' },
    { value: '75', label: '75' },
    { value: '100', label: '100' },
    { value: '150', label: '150' },
    { value: '200', label: '200' }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseInt(basePrice, 10)
    const stock = parseInt(initialStock, 10)
    const prod = parseInt(weeklyProduction, 10)
    const reorder = parseInt(reorderPoint, 10)
    if (isNaN(price) || price < minPrice || price > maxPrice) return
    if (isNaN(stock) || stock < 1) return
    if (isNaN(prod) || prod < 0) return
    if (isNaN(reorder) || reorder < 0) return
    onSuccess({
      templateId,
      basePrice: price,
      rarity,
      initialStock: stock,
      weeklyProduction: prod,
      reorderPoint: reorder,
      currentWeek,
      currentYear
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add product" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm font-medium text-text-secondary">Product type</span>
            <InfoTooltip content="Choose from predefined product templates (apparel, accessories, collectibles, etc.). Name will match the template." />
          </div>
          <Select
            options={MERCH_PRODUCT_TEMPLATES.map(t => ({ value: t.id, label: t.name }))}
            value={templateId}
            onChange={e => setTemplateId(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm font-medium text-text-secondary">Rarity</span>
            <InfoTooltip content="Affects price range and demand. Limited/Exclusive/Ultra rare have higher prices and lower volume." />
          </div>
          <Select
            options={[
              { value: 'standard', label: 'Standard' },
              { value: 'limited', label: 'Limited' },
              { value: 'exclusive', label: 'Exclusive' },
              { value: 'ultra_rare', label: 'Ultra rare' }
            ]}
            value={rarity}
            onChange={e => setRarity(e.target.value as MerchRarity)}
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm font-medium text-text-secondary">Base price (${minPrice}–{maxPrice})</span>
            <InfoTooltip content="Must be within the allowed range for this product and rarity. Drives margin and demand." />
          </div>
          <Select
            options={basePriceOptions}
            value={basePrice}
            onChange={e => setBasePrice(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm font-medium text-text-secondary">Initial stock</span>
            <InfoTooltip content="Starting inventory. You pay production cost for this stock when adding the product." />
          </div>
          <Select
            options={initialStockOptions}
            value={initialStock}
            onChange={e => setInitialStock(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm font-medium text-text-secondary">Reorder point</span>
            <InfoTooltip content="When stock falls below this, consider increasing weekly production or reordering." />
          </div>
          <Select
            options={reorderPointOptions}
            value={reorderPoint}
            onChange={e => setReorderPoint(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm font-medium text-text-secondary">Weekly production</span>
            <InfoTooltip content="New units produced each week (costs apply). Set to 0 to stop restocking." />
          </div>
          <Select
            options={weeklyProductionOptions}
            value={weeklyProduction}
            onChange={e => setWeeklyProduction(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Add product</Button>
        </div>
      </form>
    </Modal>
  )
}

// --- Create Collection Modal ---
interface CreateCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  products: MerchProduct[]
  currentWeek: number
  currentYear: number
  onSuccess: (params: {
    name: string
    description: string
    theme: CollectionTheme
    productIds: string[]
    exclusiveToMembers: boolean
    marketingBudget: number
    currentWeek: number
    currentYear: number
  }) => void
}

function CreateCollectionModal({ isOpen, onClose, products, currentWeek, currentYear, onSuccess }: CreateCollectionModalProps) {
  const [theme, setTheme] = useState<CollectionTheme>('season')
  const [productIds, setProductIds] = useState<string[]>([])
  const [exclusiveToMembers, setExclusiveToMembers] = useState(false)
  const [marketingBudget, setMarketingBudget] = useState('5000')

  const marketingBudgetOptions = [
    { value: '0', label: '$0' },
    { value: '1000', label: '$1,000' },
    { value: '2500', label: '$2,500' },
    { value: '5000', label: '$5,000' },
    { value: '10000', label: '$10,000' },
    { value: '25000', label: '$25,000' },
    { value: '50000', label: '$50,000' }
  ]

  const themeLabel = theme.charAt(0).toUpperCase() + theme.slice(1)
  const derivedName = `${themeLabel} Collection ${currentYear}`
  const derivedDescription = COLLECTION_THEME_CONFIG[theme]?.description ?? `Official ${theme} collection`

  const toggleProduct = (id: string) => {
    setProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (productIds.length === 0) return
    const budget = parseInt(marketingBudget, 10)
    onSuccess({
      name: derivedName,
      description: derivedDescription,
      theme,
      productIds,
      exclusiveToMembers,
      marketingBudget: isNaN(budget) ? 0 : Math.max(0, budget),
      currentWeek,
      currentYear
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create collection" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm font-medium text-text-secondary">Theme</span>
            <InfoTooltip content="Determines campaign duration and sales multiplier. Name and description are auto-generated from theme and year." />
          </div>
          <Select
            options={Object.entries(COLLECTION_THEME_CONFIG).map(([k, v]) => ({ value: k, label: `${k} — ${v.description}` }))}
            value={theme}
            onChange={e => setTheme(e.target.value as CollectionTheme)}
          />
        </div>
        <p className="text-sm text-text-muted">
          Collection will be named &quot;{derivedName}&quot;.
        </p>
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <label className="text-sm font-medium text-text-secondary">Products (select at least one)</label>
            <InfoTooltip content="Select which products are included in this collection. At least one is required." />
          </div>
          <div className="max-h-40 overflow-y-auto space-y-2 border border-surface-border rounded-lg p-2">
            {products.map(p => (
              <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={productIds.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                />
                <span className="text-sm">{p.name}</span>
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={exclusiveToMembers} onChange={e => setExclusiveToMembers(e.target.checked)} />
          <span className="text-sm">Exclusive to fan club members</span>
        </label>
        <Select
          label="Marketing budget"
          options={marketingBudgetOptions}
          value={marketingBudget}
          onChange={e => setMarketingBudget(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={productIds.length === 0}>Create collection</Button>
        </div>
      </form>
    </Modal>
  )
}

// --- Manage Store Products Modal ---
interface ManageStoreProductsModalProps {
  store: MerchStore | null
  products: MerchProduct[]
  onClose: () => void
  onSave: (storeId: string, productIds: string[]) => void
}

function ManageStoreProductsModal({ store, products, onClose, onSave }: ManageStoreProductsModalProps) {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

  useEffect(() => {
    if (store) setSelectedProductIds([...store.products])
  }, [store?.id])

  const isOpen = store !== null
  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSave = () => {
    if (!store) return
    onSave(store.id, selectedProductIds)
  }

  if (!store) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage store products" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          {store.name} · {store.type}
        </p>
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <label className="text-sm font-medium text-text-secondary">Products to stock</label>
            <InfoTooltip content="Select which products this store sells. Only selected products appear and generate sales here." />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 border border-surface-border rounded-lg p-2">
            {products.length === 0 ? (
              <p className="text-sm text-text-muted">No active products. Add products in the Products tab first.</p>
            ) : (
              products.map(p => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                  />
                  <span className="text-sm">{p.name}</span>
                </label>
              ))
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}

// --- Open Store Modal ---
interface OpenStoreModalProps {
  isOpen: boolean
  onClose: () => void
  products: MerchProduct[]
  currentWeek: number
  currentYear: number
  onSuccess: (type: StoreType, customName?: string, location?: string, productIds?: string[]) => void
}

function OpenStoreModal({ isOpen, onClose, products, currentWeek, currentYear, onSuccess }: OpenStoreModalProps) {
  const [type, setType] = useState<StoreType>('online')
  const [location, setLocation] = useState(STORE_LOCATION_OPTIONS[0]?.value ?? '')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

  const config = STORE_CONFIGS[type]
  const showLocation = type !== 'online'
  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSuccess(type, undefined, showLocation ? location : undefined, selectedProductIds)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Open store" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm font-medium text-text-secondary">Store type</span>
            <InfoTooltip content="Online = low setup, ongoing cost. Physical = high setup, higher traffic. Pop-up/Event = medium cost, temporary." />
          </div>
          <Select
            options={Object.entries(STORE_CONFIGS).map(([k, v]) => ({
              value: k,
              label: `${v.name} — ${formatCurrency(v.setupCost)} setup, ${formatCurrency(v.weeklyCostBase)}/wk`
            }))}
            value={type}
            onChange={e => setType(e.target.value as StoreType)}
          />
        </div>
        {showLocation && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm font-medium text-text-secondary">Location</span>
              <InfoTooltip content="Only for physical, pop-up, and event stores; choose from predefined locations." />
            </div>
            <Select
              options={STORE_LOCATION_OPTIONS}
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Products to stock</label>
          <div className="max-h-40 overflow-y-auto space-y-2 border border-surface-border rounded-lg p-2">
            {products.length === 0 ? (
              <p className="text-sm text-text-muted">No active products. Add products first.</p>
            ) : (
              products.map(p => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                  />
                  <span className="text-sm">{p.name}</span>
                </label>
              ))
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Open store</Button>
        </div>
      </form>
    </Modal>
  )
}

export default MerchandiseDashboard
