import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car,
  Watch,
  Palette,
  Wine,
  Trophy,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  Eye,
  Star,
  Calendar,
  MapPin,
  Award,
  Sparkles,
  Plus,
  Filter
} from 'lucide-react'
import { Card, CardHeader, Button, Badge, Modal, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import type {
  Collection,
  CollectionItem,
  CollectionEvent,
  ArtCollectionDetails
} from '@/data/collections-config'

// ============================================
// COLLECTION SHOWCASE COMPONENT
// ============================================

interface CollectionShowcaseProps {
  collections?: Collection[]
  className?: string
}

export function CollectionShowcase({ collections = [], className = '' }: CollectionShowcaseProps) {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)

  const totalValue = useMemo(() => 
    collections.reduce((sum, c) => sum + (c.items?.reduce((s: number, i: any) => s + (i.currentValue || 0), 0) || 0), 0),
    [collections]
  )

  if (collections.length === 0) {
    return (
      <Card className={className}>
        <CardHeader title="Collections" icon={<Trophy className="w-4 h-4" />} />
        <div className="p-6 text-center">
          <Sparkles className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">No collections yet. Start collecting to build your showcase!</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader 
        title="Collections" 
        subtitle={`${collections.length} collections — $${totalValue.toLocaleString()} total value`}
        icon={<Trophy className="w-4 h-4" />}
      />
      <div className="p-4 space-y-3">
        {collections.map((collection, i) => (
          <div key={i} className="p-3 rounded-lg bg-surface/50 border border-border/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-text-primary">{collection.name || 'Collection'}</span>
              <Badge variant="default">{collection.items?.length || 0} items</Badge>
            </div>
            <p className="text-xs text-text-muted">{collection.description || 'A curated collection'}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default CollectionShowcase